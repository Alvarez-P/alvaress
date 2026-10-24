import { DEFAULT_DECISION_BASE } from '../constants.js';
import { commandExists, runCommand, runShellCommand } from '../utils/process.js';
import type { CommandResult } from '../utils/process.js';
import { tagsEndpoint, versionEndpoint } from './client.js';
import type { FetchLike } from './client.js';

export interface OllamaStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  models: string[];
  error?: string;
}

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

export function ollamaInstallHint(): string {
  if (process.platform === 'darwin') {
    return 'Instala Ollama con "brew install ollama" o desde https://ollama.com/download.';
  }
  if (process.platform === 'win32') {
    return 'Instala Ollama con "winget install Ollama.Ollama" o desde https://ollama.com/download.';
  }
  return 'Instala Ollama con "curl -fsSL https://ollama.com/install.sh | sh" o desde https://ollama.com/download.';
}

export function ollamaStartHint(): string {
  return 'Arranca Ollama con "ollama serve" o abriendo la aplicación de Ollama.';
}

export function ollamaVersionWarning(version: string | undefined): string | undefined {
  if (version === undefined) {
    return undefined;
  }
  if (compareVersions(version, '0.35.0') < 0) {
    return `Ollama ${version} no soporta /v1/systemone. Actualiza a 0.35.0 o superior.`;
  }
  return undefined;
}
