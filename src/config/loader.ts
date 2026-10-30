import path from 'node:path';
import {
  DEFAULT_LAYA_TIMEOUT_MS,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_SCOPE,
  DEFAULT_VITE_PLUS_CHECK,
  DEFAULT_VITE_PLUS_TEST,
  DEFAULT_WORKER_TIMEOUT_MS,
  GLOBAL_CONFIG_PATH,
  LOCAL_CONFIG_FILENAME
} from '../constants.js';
import { ConfigError } from '../utils/errors.js';
import { pathExists, readJsonFile, writeJsonFile } from '../utils/fs.js';
import { defaultValidationCommands } from '../utils/package-manager.js';
import { isModelReference } from './models.js';

export type PackageManager = 'pnpm' | 'npm';
export type ScopeMode = 'strict' | 'warn' | 'off';

export interface ModelSelection {
  /** `provider/model` de OpenCode. Vacío = heredar el modelo de la sesión. */
  modelName: string;
}

export interface LayaConfig {
  enabled: boolean;
  /** Directorio local con el bundle ONNX. Vacío = caché global compartida. */
  modelDir?: string;
  device?: 'cpu' | 'cuda';
  /** Hilos intra-op de ONNX Runtime en CPU. */
  threads?: number;
  timeoutMs: number;
  fallbackToHeuristic: boolean;
}

export interface VitePlusConfig {
  checkCommand: string;
  testCommand: string;
  fallbackToPackageManager: boolean;
}

export type WorkerBackend = 'opencode' | 'claude';

const WORKER_BACKENDS: readonly WorkerBackend[] = ['opencode', 'claude'];

export interface HarnessConfig {
  obsidianVaultPath: string;
  packageManager?: PackageManager;
  scope?: ScopeMode;
  graphify?: {
    autoUpdate?: boolean;
  };
  laya?: LayaConfig;
  vitePlus?: VitePlusConfig;
  worker?: {
    timeoutMs?: number;
    selfCheck?: boolean;
    backend?: WorkerBackend;
  };
  models: {
    orchestrator: ModelSelection;
    subagents: ModelSelection;
  };
  validation: {
    maxAttempts: number;
    commands: string[];
    requireCommands?: boolean;
  };
}

export interface HarnessConfigFile {
  obsidianVaultPath?: string;
  packageManager?: PackageManager;
  scope?: ScopeMode;
  graphify?: {
    autoUpdate?: boolean;
  };
  laya?: {
    enabled?: boolean;
    modelDir?: string;
    device?: 'cpu' | 'cuda';
    threads?: number;
    timeoutMs?: number;
    fallbackToHeuristic?: boolean;
  };
  vitePlus?: {
    checkCommand?: string;
    testCommand?: string;
    fallbackToPackageManager?: boolean;
  };
  worker?: {
    timeoutMs?: number;
    selfCheck?: boolean;
    backend?: WorkerBackend;
  };
  models?: {
    orchestrator?: Partial<ModelSelection>;
    subagents?: Partial<ModelSelection>;
  };
  validation?: {
    maxAttempts?: number;
    commands?: string[];
    requireCommands?: boolean;
  };
}

export interface ConfigPaths {
  global: string;
  local: string;
}

export function getConfigPaths(root: string = process.cwd()): ConfigPaths {
  return {
    global: GLOBAL_CONFIG_PATH,
    local: path.join(root, LOCAL_CONFIG_FILENAME)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, field: string, source: string): void {
  if (value !== undefined && typeof value !== 'string') {
    throw new ConfigError(`El campo "${field}" debe ser una cadena en ${source}.`);
  }
}

function assertModelSelection(value: unknown, field: string, source: string): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    throw new ConfigError(`El campo "${field}" debe ser un objeto en ${source}.`);
  }
  assertString(value.modelName, `${field}.modelName`, source);
  if (typeof value.modelName === 'string' && !isModelReference(value.modelName)) {
    throw new ConfigError(
      `El campo "${field}.modelName" debe usar el formato provider/model en ${source}.`
    );
  }
}

function assertBoolean(value: unknown, field: string, source: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new ConfigError(`El campo "${field}" debe ser booleano en ${source}.`);
  }
}

function assertPositiveInteger(value: unknown, field: string, source: string, minimum = 1): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new ConfigError(
      `El campo "${field}" debe ser un entero mayor o igual a ${minimum} en ${source}.`
    );
  }
}

export function validateConfigFile(value: unknown, source: string): HarnessConfigFile {
  if (!isRecord(value)) {
    throw new ConfigError(`La configuración de ${source} debe ser un objeto JSON.`);
  }

  assertString(value.obsidianVaultPath, 'obsidianVaultPath', source);

  if (value.packageManager !== undefined && value.packageManager !== 'pnpm' && value.packageManager !== 'npm') {
    throw new ConfigError(`El campo "packageManager" solo admite "pnpm" o "npm" en ${source}.`);
  }
  if (value.scope !== undefined && value.scope !== 'strict' && value.scope !== 'warn' && value.scope !== 'off') {
    throw new ConfigError(`El campo "scope" solo admite "strict", "warn" o "off" en ${source}.`);
  }

  if (value.graphify !== undefined) {
    if (!isRecord(value.graphify)) {
      throw new ConfigError(`El campo "graphify" debe ser un objeto en ${source}.`);
    }
    assertBoolean(value.graphify.autoUpdate, 'graphify.autoUpdate', source);
  }

  if (value.laya !== undefined) {
    if (!isRecord(value.laya)) {
      throw new ConfigError(`El campo "laya" debe ser un objeto en ${source}.`);
    }
    assertBoolean(value.laya.enabled, 'laya.enabled', source);
    assertString(value.laya.modelDir, 'laya.modelDir', source);
    if (
      value.laya.device !== undefined &&
      value.laya.device !== 'cpu' &&
      value.laya.device !== 'cuda'
    ) {
      throw new ConfigError(`El campo "laya.device" solo admite "cpu" o "cuda" en ${source}.`);
    }
    assertPositiveInteger(value.laya.threads, 'laya.threads', source, 1);
    assertPositiveInteger(value.laya.timeoutMs, 'laya.timeoutMs', source, 1000);
    assertBoolean(value.laya.fallbackToHeuristic, 'laya.fallbackToHeuristic', source);
  }

  if (value.vitePlus !== undefined) {
    if (!isRecord(value.vitePlus)) {
      throw new ConfigError(`El campo "vitePlus" debe ser un objeto en ${source}.`);
    }
    assertString(value.vitePlus.checkCommand, 'vitePlus.checkCommand', source);
    assertString(value.vitePlus.testCommand, 'vitePlus.testCommand', source);
    assertBoolean(
      value.vitePlus.fallbackToPackageManager,
      'vitePlus.fallbackToPackageManager',
      source
    );
  }

  if (value.worker !== undefined) {
    if (!isRecord(value.worker)) {
      throw new ConfigError(`El campo "worker" debe ser un objeto en ${source}.`);
    }
    assertPositiveInteger(value.worker.timeoutMs, 'worker.timeoutMs', source, 1000);
    assertBoolean(value.worker.selfCheck, 'worker.selfCheck', source);
    if (
      value.worker.backend !== undefined &&
      !WORKER_BACKENDS.includes(value.worker.backend as WorkerBackend)
    ) {
      throw new ConfigError(
        `El campo "worker.backend" debe ser ${WORKER_BACKENDS.join(' o ')} en ${source}.`
      );
    }
  }

  if (value.models !== undefined) {
    if (!isRecord(value.models)) {
      throw new ConfigError(`El campo "models" debe ser un objeto en ${source}.`);
    }
    assertModelSelection(value.models.orchestrator, 'models.orchestrator', source);
    assertModelSelection(value.models.subagents, 'models.subagents', source);
  }

  if (value.validation !== undefined) {
    if (!isRecord(value.validation)) {
      throw new ConfigError(`El campo "validation" debe ser un objeto en ${source}.`);
    }
    const attempts = value.validation.maxAttempts;
    if (attempts !== undefined && (!Number.isInteger(attempts) || (attempts as number) < 1)) {
      throw new ConfigError(`El campo "validation.maxAttempts" debe ser un entero mayor o igual a 1 en ${source}.`);
    }
    const commands = value.validation.commands;
    if (commands !== undefined) {
      if (!Array.isArray(commands) || commands.some((command) => typeof command !== 'string')) {
        throw new ConfigError(`El campo "validation.commands" debe ser una lista de cadenas en ${source}.`);
      }
    }
    assertBoolean(value.validation.requireCommands, 'validation.requireCommands', source);
  }

  return value as HarnessConfigFile;
}

export function readConfigFile(target: string): HarnessConfigFile {
  if (!pathExists(target)) {
    return {};
  }
  return validateConfigFile(readJsonFile<unknown>(target), target);
}

function interpolateEnv(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_match, name: string) => process.env[name] ?? '');
}

function interpolateCommands(commands: string[] | undefined): string[] | undefined {
  return commands?.map((command) => interpolateEnv(command) ?? command);
}

export function mergeConfig(globalConfig: HarnessConfigFile, localConfig: HarnessConfigFile): HarnessConfig {
  const globalOrchestrator = globalConfig.models?.orchestrator;
  const localOrchestrator = localConfig.models?.orchestrator;
  const globalSubagents = globalConfig.models?.subagents;
  const localSubagents = localConfig.models?.subagents;
  const packageManager =
    localConfig.packageManager ?? globalConfig.packageManager ?? DEFAULT_PACKAGE_MANAGER;
  const vitePlus = {
    checkCommand:
      localConfig.vitePlus?.checkCommand ||
      globalConfig.vitePlus?.checkCommand ||
      DEFAULT_VITE_PLUS_CHECK,
    testCommand:
      localConfig.vitePlus?.testCommand ||
      globalConfig.vitePlus?.testCommand ||
      DEFAULT_VITE_PLUS_TEST,
    fallbackToPackageManager:
      localConfig.vitePlus?.fallbackToPackageManager ??
      globalConfig.vitePlus?.fallbackToPackageManager ??
      true
  };

  return {
    obsidianVaultPath: interpolateEnv(localConfig.obsidianVaultPath || globalConfig.obsidianVaultPath) ?? '',
    packageManager,
    scope: localConfig.scope ?? globalConfig.scope ?? DEFAULT_SCOPE,
    graphify: {
      autoUpdate: localConfig.graphify?.autoUpdate ?? globalConfig.graphify?.autoUpdate ?? false
    },
    laya: {
      enabled: localConfig.laya?.enabled ?? globalConfig.laya?.enabled ?? true,
      modelDir: localConfig.laya?.modelDir || globalConfig.laya?.modelDir || undefined,
      device: localConfig.laya?.device ?? globalConfig.laya?.device ?? 'cpu',
      threads: localConfig.laya?.threads ?? globalConfig.laya?.threads,
      timeoutMs:
        localConfig.laya?.timeoutMs ?? globalConfig.laya?.timeoutMs ?? DEFAULT_LAYA_TIMEOUT_MS,
      fallbackToHeuristic:
        localConfig.laya?.fallbackToHeuristic ?? globalConfig.laya?.fallbackToHeuristic ?? true
    },
    vitePlus,
    worker: {
      timeoutMs:
        localConfig.worker?.timeoutMs ??
        globalConfig.worker?.timeoutMs ??
        DEFAULT_WORKER_TIMEOUT_MS,
      selfCheck: localConfig.worker?.selfCheck ?? globalConfig.worker?.selfCheck ?? false,
      backend: localConfig.worker?.backend ?? globalConfig.worker?.backend ?? 'opencode'
    },
    models: {
      orchestrator: {
        modelName: localOrchestrator?.modelName ?? globalOrchestrator?.modelName ?? ''
      },
      subagents: {
        modelName: localSubagents?.modelName ?? globalSubagents?.modelName ?? ''
      }
    },
    validation: {
      maxAttempts:
        localConfig.validation?.maxAttempts || globalConfig.validation?.maxAttempts || DEFAULT_MAX_ATTEMPTS,
      commands:
        interpolateCommands(localConfig.validation?.commands || globalConfig.validation?.commands) ??
        defaultValidationCommands(packageManager, vitePlus),
      requireCommands:
        localConfig.validation?.requireCommands ?? globalConfig.validation?.requireCommands ?? true
    }
  };
}

export function loadConfig(root: string = process.cwd()): HarnessConfig {
  const paths = getConfigPaths(root);
  return mergeConfig(readConfigFile(paths.global), readConfigFile(paths.local));
}

/** Configuración global sin los overrides del proyecto. */
export function loadGlobalConfig(): HarnessConfig {
  return mergeConfig(readConfigFile(GLOBAL_CONFIG_PATH), {});
}

export function toConfigFile(config: HarnessConfig): HarnessConfigFile {
  return {
    obsidianVaultPath: config.obsidianVaultPath,
    packageManager: config.packageManager ?? DEFAULT_PACKAGE_MANAGER,
    scope: config.scope ?? DEFAULT_SCOPE,
    graphify: {
      autoUpdate: config.graphify?.autoUpdate ?? false
    },
    laya: {
      enabled: config.laya?.enabled ?? true,
      modelDir: config.laya?.modelDir ?? undefined,
      device: config.laya?.device ?? 'cpu',
      threads: config.laya?.threads,
      timeoutMs: config.laya?.timeoutMs ?? DEFAULT_LAYA_TIMEOUT_MS,
      fallbackToHeuristic: config.laya?.fallbackToHeuristic ?? true
    },
    vitePlus: {
      checkCommand: config.vitePlus?.checkCommand ?? DEFAULT_VITE_PLUS_CHECK,
      testCommand: config.vitePlus?.testCommand ?? DEFAULT_VITE_PLUS_TEST,
      fallbackToPackageManager: config.vitePlus?.fallbackToPackageManager ?? true
    },
    worker: {
      timeoutMs: config.worker?.timeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS,
      ...(config.worker?.selfCheck !== undefined ? { selfCheck: config.worker.selfCheck } : {}),
      ...(config.worker?.backend !== undefined ? { backend: config.worker.backend } : {})
    },
    models: {
      orchestrator: {
        modelName: config.models.orchestrator.modelName
      },
      subagents: {
        modelName: config.models.subagents.modelName
      }
    },
    validation: {
      maxAttempts: config.validation.maxAttempts,
      commands: config.validation.commands,
      requireCommands: config.validation.requireCommands ?? true
    }
  };
}

export function saveGlobalConfig(config: HarnessConfig): void {
  writeJsonFile(GLOBAL_CONFIG_PATH, toConfigFile(config));
}

export function saveLocalConfig(config: HarnessConfig, root: string = process.cwd()): void {
  writeJsonFile(getConfigPaths(root).local, toConfigFile(config));
}

export function displayConfig(config: HarnessConfig): HarnessConfig {
  return {
    obsidianVaultPath: config.obsidianVaultPath,
    packageManager: config.packageManager,
    scope: config.scope,
    graphify: config.graphify,
    laya: config.laya,
    vitePlus: config.vitePlus,
    worker: config.worker,
    models: {
      orchestrator: {
        modelName: config.models.orchestrator.modelName
      },
      subagents: {
        modelName: config.models.subagents.modelName
      }
    },
    validation: {
      maxAttempts: config.validation.maxAttempts,
      commands: [...config.validation.commands],
      requireCommands: config.validation.requireCommands
    }
  };
}
