import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface TempDir {
  path: string;
  cleanup: () => void;
}

export function makeTempDir(prefix = 'harness-test-'): TempDir {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return {
    path: directory,
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true })
  };
}

export function writeFile(target: string, content: string): void {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf-8');
}

export function writeJson(target: string, value: unknown): void {
  writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeExecutable(target: string, content: string): void {
  writeFile(target, content);
  fs.chmodSync(target, 0o755);
}

export function readJson<T>(target: string): T {
  return JSON.parse(fs.readFileSync(target, 'utf-8')) as T;
}

export function withPath<T>(directories: string[], run: () => T): T {
  const original = process.env.PATH;
  process.env.PATH = [...directories, original ?? ''].filter((part) => part.length > 0).join(path.delimiter);
  try {
    return run();
  } finally {
    process.env.PATH = original;
  }
}

export async function withPathAsync<T>(directories: string[], run: () => Promise<T>): Promise<T> {
  const original = process.env.PATH;
  process.env.PATH = [...directories, original ?? ''].filter((part) => part.length > 0).join(path.delimiter);
  try {
    return await run();
  } finally {
    process.env.PATH = original;
  }
}

export function fakeAider(binDir: string, options: { log?: string; exitCode?: number; action?: string } = {}): void {
  const lines = ['#!/bin/sh'];
  if (options.log) {
    lines.push(`printf '%s\\n' "$*" | tr '\\n' ' ' >> '${options.log}'`);
    lines.push(`echo >> '${options.log}'`);
  }
  if (options.action) {
    lines.push(options.action);
  }
  lines.push(`exit ${options.exitCode ?? 0}`);
  writeExecutable(path.join(binDir, 'aider'), `${lines.join('\n')}\n`);
}

export function baseConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    obsidianVaultPath: '/tmp/vault',
    models: {
      jevOrchestrator: {
        modelName: 'orchestrator-model',
        apiKey: '',
        apiBase: 'http://localhost:11434/v1',
        env: {}
      },
      aiderImplementer: {
        modelName: 'implementer-model',
        apiKey: '',
        apiBase: '',
        env: {}
      }
    },
    validation: {
      maxAttempts: 1,
      commands: ['node -e "process.exit(0)"']
    },
    ...overrides
  };
}
