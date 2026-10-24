import { spawn } from 'node:child_process';
import type { HarnessConfig } from '../config/loader.js';
import type { CommandResult } from '../utils/process.js';

export interface AiderRunOptions {
  message: string;
  files?: string[];
  readFiles?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  inherit?: boolean;
}

export function buildAiderEnv(config: HarnessConfig): NodeJS.ProcessEnv {
  const implementer = config.models.aiderImplementer;
  return {
    ...process.env,
    ...(implementer.apiKey
      ? { DEEPSEEK_API_KEY: implementer.apiKey, OPENAI_API_KEY: implementer.apiKey }
      : {}),
    ...(implementer.apiBase ? { OPENAI_API_BASE: implementer.apiBase } : {}),
    ...implementer.env
  };
}

export function buildAiderArgs(model: string, options: AiderRunOptions): string[] {
  const args = ['--model', model, '--message', options.message, '--no-auto-commits'];
  for (const file of options.readFiles ?? []) {
    args.push('--read', file);
  }
  if (options.files && options.files.length > 0) {
    args.push(...options.files);
  }
  return args;
}

export function runAider(model: string, options: AiderRunOptions): Promise<CommandResult> {
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
      child = spawn('aider', buildAiderArgs(model, options), {
        cwd: options.cwd,
        env: options.env ?? process.env,
        stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe']
      });
    } catch (error) {
      finish({ code: 1, stdout: '', stderr: '', error: error instanceof Error ? error.message : String(error) });
      return;
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error: Error) => {
      finish({ code: 1, stdout, stderr, error: error.message });
    });

    child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
      if (signal) {
        finish({ code: 1, stdout, stderr, error: `Aider terminó por la señal ${signal}` });
        return;
      }
      finish({ code: code ?? 1, stdout, stderr });
    });
  });
}
