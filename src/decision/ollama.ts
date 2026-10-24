import { spawn, spawnSync } from 'node:child_process';
import { DEFAULT_DECISION_BASE } from '../constants.js';
import { commandExists, runCommand, runShellCommand } from '../utils/process.js';
import type { CommandResult, RunOptions } from '../utils/process.js';
import { tagsEndpoint, versionEndpoint } from './client.js';
import type { FetchLike } from './client.js';

export interface OllamaStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  models: string[];
  error?: string;
}

export interface OllamaInstallPlan {
  command: string;
  args: string[];
  shell: boolean;
}

export interface OllamaInstallDeps {
  platform?: NodeJS.Platform;
  hasCommand?: (command: string) => boolean;
  run?: (command: string, args: string[], options?: RunOptions) => Promise<CommandResult>;
  runShell?: (command: string, options?: RunOptions) => CommandResult;
}

const MIN_OLLAMA_VERSION = '0.35.0';
const MODEL_MIN_OLLAMA_VERSION: Record<string, string> = {
  kev: '0.40.4',
  laya: '0.40.0'
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseOllamaVersion(text: string): string | undefined {
  return text.match(/(\d+\.\d+\.\d+)/)?.[1];
}

export function compareVersions(left: string, right: string): number {
  const a = left.split('.').map((part) => Number.parseInt(part, 10));
  const b = right.split('.').map((part) => Number.parseInt(part, 10));
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

function parseTags(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value.models)) {
    return [];
  }
  const names: string[] = [];
  for (const entry of value.models) {
    if (isRecord(entry) && typeof entry.name === 'string') {
      names.push(entry.name);
    }
  }
  return names;
}

export async function detectOllama(
  apiBase: string = DEFAULT_DECISION_BASE,
  fetchImpl: FetchLike = fetch,
  timeoutMs = 4000
): Promise<OllamaStatus> {
  const cliInstalled = commandExists('ollama');
  try {
    const versionResponse = await fetchImpl(versionEndpoint(apiBase), {
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!versionResponse.ok) {
      throw new Error(`HTTP ${versionResponse.status}`);
    }
    const versionBody: unknown = await versionResponse.json();
    const version =
      isRecord(versionBody) && typeof versionBody.version === 'string'
        ? versionBody.version
        : undefined;

    const tagsResponse = await fetchImpl(tagsEndpoint(apiBase), {
      signal: AbortSignal.timeout(timeoutMs)
    });
    const tagsBody: unknown = tagsResponse.ok ? await tagsResponse.json() : {};

    return {
      installed: true,
      running: true,
      version,
      models: parseTags(tagsBody)
    };
  } catch (error) {
    return {
      installed: cliInstalled,
      running: false,
      models: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function detectOllamaSync(): OllamaStatus {
  if (!commandExists('ollama')) {
    return { installed: false, running: false, models: [] };
  }

  const versionResult = runShellCommand('ollama --version', { timeout: 5000 });
  const version =
    parseOllamaVersion(versionResult.stdout) ?? parseOllamaVersion(versionResult.stderr);

  const list = runShellCommand('ollama list', { timeout: 15000 });
  if (list.code !== 0) {
    return {
      installed: true,
      running: false,
      version,
      models: [],
      error: list.stderr.trim() || list.error
    };
  }

  const models = list.stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/)[0] ?? '')
    .filter((name) => name.length > 0);

  return { installed: true, running: true, version, models };
}

export function hasOllamaModel(models: string[], model: string): boolean {
  const wanted = model.trim().toLowerCase();
  if (wanted.length === 0) {
    return false;
  }
  const tagged = wanted.includes(':') ? wanted : `${wanted}:latest`;
  return models.some((entry) => {
    const name = entry.toLowerCase();
    return name === wanted || name === tagged;
  });
}

export function pullOllamaModel(model: string): Promise<CommandResult> {
  return runCommand('ollama', ['pull', model], { timeout: 30 * 60 * 1000 });
}

export function ollamaInstallPlan(
  platform: NodeJS.Platform = process.platform,
  hasCommand: (command: string) => boolean = commandExists
): OllamaInstallPlan | undefined {
  if (platform === 'darwin') {
    if (!hasCommand('brew')) {
      return undefined;
    }
    return { command: 'brew', args: ['install', 'ollama'], shell: false };
  }
  if (platform === 'win32') {
    if (!hasCommand('winget')) {
      return undefined;
    }
    return {
      command: 'winget',
      args: [
        'install',
        '--id',
        'Ollama.Ollama',
        '-e',
        '--accept-source-agreements',
        '--accept-package-agreements'
      ],
      shell: false
    };
  }
  if (platform === 'linux') {
    if (!hasCommand('curl')) {
      return undefined;
    }
    return { command: 'curl -fsSL https://ollama.com/install.sh | sh', args: [], shell: true };
  }
  return undefined;
}

export async function installOllama(deps: OllamaInstallDeps = {}): Promise<CommandResult> {
  const plan = ollamaInstallPlan(deps.platform, deps.hasCommand);
  if (plan === undefined) {
    return { code: 1, stdout: '', stderr: '', error: ollamaInstallHint() };
  }

  const timeout = 15 * 60 * 1000;
  if (plan.shell) {
    if (deps.runShell !== undefined) {
      return deps.runShell(plan.command, { timeout });
    }
    const result = spawnSync(plan.command, {
      shell: true,
      stdio: 'inherit',
      timeout
    });
    return {
      code: result.status ?? 1,
      stdout: '',
      stderr: '',
      error: result.error ? result.error.message : undefined
    };
  }
  const run = deps.run ?? runCommand;
  return run(plan.command, plan.args, { timeout });
}

export function startOllamaServer(apiBase: string = DEFAULT_DECISION_BASE): boolean {
  if (!commandExists('ollama')) {
    return false;
  }
  let host: string;
  try {
    const url = new URL(apiBase);
    if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname)) {
      return false;
    }
    host = url.host;
  } catch {
    return false;
  }
  try {
    const child = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, OLLAMA_HOST: host }
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

export async function waitForOllama(
  apiBase: string = DEFAULT_DECISION_BASE,
  attempts = 15,
  delayMs = 1000
): Promise<OllamaStatus> {
  let status = await detectOllama(apiBase);
  for (let attempt = 1; attempt < attempts && !status.running; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    status = await detectOllama(apiBase);
  }
  return status;
}

export async function ensureOllamaRunning(
  apiBase: string = DEFAULT_DECISION_BASE,
  attempts = 15,
  delayMs = 1000
): Promise<OllamaStatus> {
  const status = await detectOllama(apiBase);
  if (status.running || !status.installed) {
    return status;
  }
  startOllamaServer(apiBase);
  return waitForOllama(apiBase, attempts, delayMs);
}

export function ollamaInstallHint(): string {
  if (process.platform === 'darwin') {
    return 'Instala Ollama con "brew install ollama" o desde https://ollama.com/download.';
  }
  if (process.platform === 'win32') {
    return 'Instala Ollama con "winget install Ollama.Ollama" o desde https://ollama.com/download.';
  }
  return 'Instala Ollama con "curl -fsSL https://ollama.com/install.sh | sh" (requiere curl) o desde https://ollama.com/download.';
}

export function ollamaStartHint(): string {
  return 'Arranca Ollama con "ollama serve" o abriendo la aplicación de Ollama.';
}

export function minimumOllamaVersion(model?: string): string {
  const base = model?.trim().toLowerCase().split(':')[0] ?? '';
  return MODEL_MIN_OLLAMA_VERSION[base] ?? MIN_OLLAMA_VERSION;
}

export function ollamaVersionWarning(
  version: string | undefined,
  model?: string
): string | undefined {
  if (version === undefined) {
    return undefined;
  }
  const minimum = minimumOllamaVersion(model);
  if (compareVersions(version, minimum) < 0) {
    const suffix = model !== undefined ? ` para usar ${model}` : '';
    return `Ollama ${version} es anterior a ${minimum}${suffix}. Actualiza Ollama.`;
  }
  return undefined;
}
