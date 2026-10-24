import path from 'node:path';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import { commandOutput, logger, truncate } from '../utils/logger.js';
import { pathExists } from '../utils/fs.js';
import { runShellCommand } from '../utils/process.js';
import type { CommandResult } from '../utils/process.js';
import { buildAiderEnv, runAider } from './aider.js';

export interface VerifyOptions {
  root?: string;
  files?: string[];
  env?: NodeJS.ProcessEnv;
  config?: HarnessConfig;
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

export async function verifyAndRepairTask(taskId: string, options: VerifyOptions = {}): Promise<boolean> {
  const root = options.root ?? process.cwd();
  const config = options.config ?? loadConfig(root);
  const commands = config.validation.commands;
  const maxAttempts = Math.max(1, config.validation.maxAttempts || 1);
  let attempts = 0;

  if (commands.length === 0) {
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

    const accumulatedError = formatValidationFailure(failure);
    logger.warn(
      `[Self-Healing] Errores detectados en la tarea ${taskId}. Iniciando intento de reparación automática ${attempts}/${maxAttempts}...`
    );

    const implementer = config.models.aiderImplementer;
    const repairMessage = `El código generado falló las pruebas lógicas locales con el siguiente reporte de error:\n\n${accumulatedError}\nPor favor, analiza el error, modifica los archivos necesarios para resolverlo y mantén el tipado estricto de TypeScript y decoradores de NestJS sin añadir comentarios explicativos en el código.`;

    const taskDocument = path.join('.harness', 'tasks', `${taskId}.md`);
    const repairFiles = (options.files ?? []).filter((file) => pathExists(path.join(root, file)));
    const repair = await runAider(implementer.modelName, {
      message: repairMessage,
      files: repairFiles,
      readFiles: pathExists(path.join(root, taskDocument)) ? [taskDocument] : [],
      cwd: root,
      env: { ...buildAiderEnv(config), ...options.env },
      inherit: true
    });

    if (repair.code !== 0) {
      logger.error(
        `[Error] Fallo crítico al invocar el proceso de reparación de Aider: ${
          repair.error ?? commandOutput(repair.stdout, repair.stderr)
        }`
      );
    }
  }

  logger.error(
    `[Self-Healing] La tarea ${taskId} no pudo ser auto-corregida tras ${maxAttempts} intento(s).`
  );
  return false;
}
