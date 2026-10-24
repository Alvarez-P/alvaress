import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { HarnessConfig } from '../config/loader.js';
import { ensureDir } from '../utils/fs.js';
import type { CommandResult } from '../utils/process.js';

export interface AiderRunOptions {
  message: string;
  files?: string[];
  readFiles?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  inherit?: boolean;
  timeoutMs?: number;
  logFile?: string;
  extraArgs?: string[];
}

const SAFE_ENV_KEYS = [
  'PATH',
  'HOME',
  'USER',
  'LOGNAME',
  'SHELL',
  'TERM',
  'LANG',
  'LC_ALL',
  'TMPDIR',
  'PWD',
  'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME',
  'XDG_DATA_HOME'
];

const SECRET_ENV_PATTERN = /(?:ALVARESS|OLLAMA|NPM_TOKEN|NODE_AUTH_TOKEN|GITHUB_TOKEN|AWS_SECRET|OPENAI_API_KEY|DEEPSEEK_API_KEY)/i;

function baseEnvironment(inheritEnv: boolean): NodeJS.ProcessEnv {
  if (!inheritEnv) {
    const result: NodeJS.ProcessEnv = {};
    for (const key of SAFE_ENV_KEYS) {
      const value = process.env[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }
  const result: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(result)) {
    if (SECRET_ENV_PATTERN.test(key) && key !== 'DEEPSEEK_API_KEY' && key !== 'OPENAI_API_KEY') {
      delete result[key];
    }
  }
  return result;
}

export function buildAiderEnv(config: HarnessConfig, inheritEnv?: boolean): NodeJS.ProcessEnv {
  const implementer = config.models.aiderImplementer;
  return {
    ...baseEnvironment(inheritEnv ?? config.aider?.inheritEnv ?? true),
    ...(implementer.apiKey
      ? { DEEPSEEK_API_KEY: implementer.apiKey, OPENAI_API_KEY: implementer.apiKey }
      : {}),
    ...(implementer.apiBase ? { OPENAI_API_BASE: implementer.apiBase } : {}),
    ...implementer.env
  };
}

export function buildAiderArgs(model: string, options: AiderRunOptions): string[] {
  const args = [
    '--model',
    model,
    '--message',
    options.message,
    '--no-auto-commits',
    ...(options.extraArgs ?? [])
  ];
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
    let timedOut = false;
    let timer: NodeJS.Timeout | undefined;
    let logStream: fs.WriteStream | undefined;

    const finish = (result: CommandResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      if (logStream !== undefined) {
        logStream.end();
      }
      resolve(result);
    };

    if (options.logFile !== undefined) {
      ensureDir(path.dirname(options.logFile));
      logStream = fs.createWriteStream(options.logFile, { flags: 'a' });
    }

    let child;
    try {
      child = spawn('aider', buildAiderArgs(model, options), {
        cwd: options.cwd,
        env: options.env ?? process.env,
        stdio: options.inherit && logStream === undefined ? 'inherit' : ['ignore', 'pipe', 'pipe']
      });
    } catch (error) {
      finish({ code: 1, stdout: '', stderr: '', error: error instanceof Error ? error.message : String(error) });
      return;
    }

    if (options.timeoutMs !== undefined && options.timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!settled) {
            child.kill('SIGKILL');
          }
        }, 5000).unref();
      }, options.timeoutMs);
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      logStream?.write(text);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      logStream?.write(text);
    });

    child.on('error', (error: Error) => {
      finish({ code: 1, stdout, stderr, error: error.message });
    });

    child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
      if (timedOut) {
        finish({
          code: 1,
          stdout,
          stderr,
          error: `Aider superó el tiempo máximo de ${options.timeoutMs} ms y fue detenido.`
        });
        return;
      }
      if (signal) {
        finish({ code: 1, stdout, stderr, error: `Aider terminó por la señal ${signal}` });
        return;
      }
      finish({ code: code ?? 1, stdout, stderr });
    });
  });
}
