import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import type { ValidationResult, Worker } from '../core/contracts.js';
import { commandOutput, logger, truncate } from '../utils/logger.js';
import { runShellCommand } from '../utils/process.js';
import type { CommandResult } from '../utils/process.js';
import { createWorker } from './workers.js';

export interface VerifyOptions {
  root?: string;
  files?: string[];
  env?: NodeJS.ProcessEnv;
  config?: HarnessConfig;
  commands?: string[];
  requireCommands?: boolean;
  worker?: Worker;
}

export interface ValidationFailure {
  command: string;
  result: CommandResult;
}

export function runValidationCommands(
  commands: string[],
  root: string,
  env: NodeJS.ProcessEnv = process.env
): ValidationFailure | null {
  for (const command of commands) {
    if (command.trim().length === 0) {
      continue;
    }
    const result = runShellCommand(command, { cwd: root, env });
    if (result.code !== 0) {
      return { command, result };
    }
  }
  return null;
}

export function formatValidationFailure(failure: ValidationFailure): string {
  const output = commandOutput(
    failure.result.stdout,
    failure.result.stderr,
    failure.result.error ?? `El comando terminó con código ${failure.result.code}.`
  );
  return `Comando fallido: ${failure.command}\nCódigo de salida: ${failure.result.code}\nLog de error:\n${truncate(output)}`;
}

function asValidationResult(failure: ValidationFailure): ValidationResult {
  return {
    ok: false,
    commands: [
      {
        command: failure.command,
        code: failure.result.code,
        stdout: failure.result.stdout,
        stderr: failure.result.stderr
      }
    ],
    warnings: []
  };
}

export async function verifyAndRepairTask(
  taskId: string,
  options: VerifyOptions = {}
): Promise<boolean> {
  const root = options.root ?? process.cwd();
  const config = options.config ?? loadConfig(root);
  const commands = options.commands ?? config.validation.commands;
  const requireCommands = options.requireCommands ?? config.validation.requireCommands ?? true;
  const maxAttempts = Math.max(1, config.validation.maxAttempts || 1);
  const worker = options.worker ?? createWorker({ root, config, env: options.env });
  let attempts = 0;

  if (commands.length === 0) {
    if (requireCommands) {
      logger.error(
        `[Validación] La tarea ${taskId} no tiene comandos de validación. Configura "validation.commands" o "validation" en la tarea.`
      );
      return false;
    }
    logger.warn(`No hay comandos de validación configurados para la tarea ${taskId}.`);
    return true;
  }

  while (attempts < maxAttempts) {
    const failure = runValidationCommands(commands, root, options.env);
    if (!failure) {
      logger.success(`[Self-Healing] Tarea ${taskId} validada con éxito (Exit Code 0).`);
      return true;
    }

    attempts += 1;
    if (attempts >= maxAttempts) {
      break;
    }

    logger.warn(
      `[Self-Healing] Errores detectados en la tarea ${taskId}. Iniciando reparación automática ${attempts}/${maxAttempts - 1}...`
    );

    const repair = await worker.fix({
      runId: taskId,
      attempt: attempts,
      files: options.files ?? [],
      failure: asValidationResult(failure),
      error: formatValidationFailure(failure)
    });

    if (repair.verdict !== 'fixed') {
      logger.error(`[Self-Healing] La reparación no aplicó cambios: ${repair.cause}`);
      break;
    }
  }

  logger.error(
    `[Self-Healing] La tarea ${taskId} no pudo ser auto-corregida tras ${maxAttempts} intento(s).`
  );
  return false;
}
