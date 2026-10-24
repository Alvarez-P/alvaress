import { spawn, spawnSync } from 'node:child_process';
import { errorMessage } from './errors.js';
import { truncate } from './logger.js';

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  maxBuffer?: number;
}

export function commandExists(command: string): boolean {
  const locator = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(locator, [command], { encoding: 'utf-8' });
  return result.status === 0 && result.stdout.trim().length > 0;
}

export function runCommand(command: string, args: string[] = [], options: RunOptions = {}): Promise<CommandResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (result: CommandResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    };

    let child;
    try {
      child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env ?? process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: options.timeout
      });
    } catch (error) {
      finish({ code: 1, stdout: '', stderr: '', error: errorMessage(error) });
      return;
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
      if (options.maxBuffer && stdout.length > options.maxBuffer) {
        stdout = truncate(stdout, options.maxBuffer);
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      if (options.maxBuffer && stderr.length > options.maxBuffer) {
        stderr = truncate(stderr, options.maxBuffer);
      }
    });

    child.on('error', (error: Error) => {
      finish({ code: 1, stdout, stderr, error: error.message });
    });

    child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
      if (signal) {
        finish({ code: 1, stdout, stderr, error: `Proceso terminado por la señal ${signal}` });
        return;
      }
      finish({ code: code ?? 1, stdout, stderr });
    });
  });
}

export function runShellCommand(command: string, options: RunOptions = {}): CommandResult {
  const result = spawnSync(command, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    shell: true,
    encoding: 'utf-8',
    timeout: options.timeout,
    maxBuffer: options.maxBuffer ?? 10 * 1024 * 1024
  });

  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error ? result.error.message : undefined
  };
}

export async function runCommandChecked(
  command: string,
  args: string[] = [],
  options: RunOptions = {}
): Promise<CommandResult> {
  const result = await runCommand(command, args, options);
  if (result.code !== 0) {
    const detail =
      result.error ??
      [result.stderr.trim(), result.stdout.trim()].filter((part) => part.length > 0).join('\n');
    throw new Error(`El comando "${command} ${args.join(' ')}" falló con código ${result.code}. ${detail}`);
  }
  return result;
}
