import type { HarnessConfig } from '../config/loader.js';
import type {
  ValidationCommandResult,
  ValidationResult,
  Validator
} from '../core/contracts.js';
import { stripAnsi } from '../ui/colors.js';
import { errorMessage } from '../utils/errors.js';
import { runCommand } from '../utils/process.js';
import { truncate } from '../utils/logger.js';
import type { RunLog } from './run-log.js';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_OUTPUT = 20_000;
const MAX_WARNINGS = 10;
const WARNING_PATTERN = /\b(warn|warning|aviso|deprecated|deprecad[oa])\b/i;

export interface CommandValidatorOptions {
  root: string;
  config: HarnessConfig;
  commands?: string[];
  log?: RunLog;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}

function collectWarnings(result: ValidationCommandResult): string[] {
  const text = stripAnsi(`${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const raw of text.split('\n')) {
    const line = raw.trim().replace(/\s+/g, ' ');
    if (line.length === 0 || !WARNING_PATTERN.test(line)) {
      continue;
    }
    const key = line.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    warnings.push(line.slice(0, 240));
    if (warnings.length >= MAX_WARNINGS) {
      break;
    }
  }

  return warnings;
}

export class CommandValidator implements Validator {
  private readonly root: string;
  private readonly config: HarnessConfig;
  private readonly commands: string[];
  private readonly log: RunLog | undefined;
  private readonly env: NodeJS.ProcessEnv | undefined;
  private readonly timeoutMs: number;

  constructor(options: CommandValidatorOptions) {
    this.root = options.root;
    this.config = options.config;
    this.commands =
      options.commands !== undefined && options.commands.length > 0
        ? options.commands
        : options.config.validation.commands;
    this.log = options.log;
    this.env = options.env;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async validate(_files: string[] = []): Promise<ValidationResult> {
    const commands: ValidationCommandResult[] = [];
    const warnings: string[] = [];
    let ok = true;

    if (this.commands.filter((command) => command.trim().length > 0).length === 0) {
      const message = 'No hay comandos de validación configurados.';
      this.log?.line(`Validación omitida: ${message}`);
      return this.config.validation.requireCommands === false
        ? { ok: true, commands, warnings: [message] }
        : { ok: false, commands: [{ command: 'validation', code: 1, stderr: message }], warnings };
    }

    for (const command of this.commands) {
      if (command.trim().length === 0) {
        continue;
      }

      let result: ValidationCommandResult;
      try {
        const executed = await runCommand('sh', ['-c', command], {
          cwd: this.root,
          ...(this.env !== undefined ? { env: this.env } : {}),
          timeout: this.timeoutMs,
          maxBuffer: 2 * 1024 * 1024
        });
        result = {
          command,
          code: executed.code,
          stdout: truncate(executed.stdout, MAX_OUTPUT),
          stderr: truncate(executed.stderr, MAX_OUTPUT)
        };
        this.log?.command(command, executed);
      } catch (error) {
        const detail = errorMessage(error);
        result = { command, code: 1, stderr: detail };
        this.log?.line(`Error ejecutando ${command}: ${detail}`);
      }

      commands.push(result);
      warnings.push(...collectWarnings(result));

      if (result.code !== 0) {
        ok = false;
        break;
      }
    }

    return {
      ok,
      commands,
      warnings: [...new Set(warnings)].slice(0, MAX_WARNINGS)
    };
  }
}
