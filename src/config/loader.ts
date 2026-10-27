import path from 'node:path';
import {
  DEFAULT_AIDER_TIMEOUT_MS,
  DEFAULT_IMPLEMENTER_MODEL,
  DEFAULT_LAYA_TIMEOUT_MS,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_SCOPE,
  DEFAULT_VITE_PLUS_CHECK,
  DEFAULT_VITE_PLUS_TEST,
  GLOBAL_CONFIG_PATH,
  LOCAL_CONFIG_FILENAME
} from '../constants.js';
import { ConfigError } from '../utils/errors.js';
import { pathExists, readJsonFile, writeJsonFile } from '../utils/fs.js';
import { defaultValidationCommands } from '../utils/package-manager.js';

export type PackageManager = 'pnpm' | 'npm';
export type ScopeMode = 'strict' | 'warn' | 'off';

export interface ModelSelection {
  /** `provider/model` de OpenCode. Vacío = heredar el modelo de la sesión. */
  modelName: string;
}

export interface ModelProviderConfig extends ModelSelection {
  apiKey?: string;
  apiBase?: string;
  env?: Record<string, string>;
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

export interface HarnessConfig {
  obsidianVaultPath: string;
  packageManager?: PackageManager;
  scope?: ScopeMode;
  graphify?: {
    autoUpdate?: boolean;
  };
  laya?: LayaConfig;
  vitePlus?: VitePlusConfig;
  aider?: {
    enabled?: boolean;
    timeoutMs?: number;
    extraArgs?: string[];
    inheritEnv?: boolean;
  };
  models: {
    orchestrator: ModelSelection;
    subagents: ModelSelection;
    aiderImplementer: ModelProviderConfig;
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
  aider?: {
    enabled?: boolean;
    timeoutMs?: number;
    extraArgs?: string[];
    inheritEnv?: boolean;
  };
  models?: {
    orchestrator?: Partial<ModelSelection>;
    subagents?: Partial<ModelSelection>;
    aiderImplementer?: Partial<ModelProviderConfig>;
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
}

function assertModel(value: unknown, field: string, source: string): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    throw new ConfigError(`El campo "${field}" debe ser un objeto en ${source}.`);
  }
  assertString(value.modelName, `${field}.modelName`, source);
  assertString(value.apiKey, `${field}.apiKey`, source);
  assertString(value.apiBase, `${field}.apiBase`, source);
  if (value.env !== undefined) {
    if (!isRecord(value.env)) {
      throw new ConfigError(`El campo "${field}.env" debe ser un objeto en ${source}.`);
    }
    for (const [key, entry] of Object.entries(value.env)) {
      if (typeof entry !== 'string') {
        throw new ConfigError(`La variable "${field}.env.${key}" debe ser una cadena en ${source}.`);
      }
    }
  }
}

function assertBoolean(value: unknown, field: string, source: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new ConfigError(`El campo "${field}" debe ser booleano en ${source}.`);
  }
}

function assertStringList(value: unknown, field: string, source: string): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new ConfigError(`El campo "${field}" debe ser una lista de cadenas en ${source}.`);
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

  if (value.aider !== undefined) {
    if (!isRecord(value.aider)) {
      throw new ConfigError(`El campo "aider" debe ser un objeto en ${source}.`);
    }
    assertBoolean(value.aider.enabled, 'aider.enabled', source);
    assertPositiveInteger(value.aider.timeoutMs, 'aider.timeoutMs', source, 1000);
    assertStringList(value.aider.extraArgs, 'aider.extraArgs', source);
    assertBoolean(value.aider.inheritEnv, 'aider.inheritEnv', source);
  }

  if (value.models !== undefined) {
    if (!isRecord(value.models)) {
      throw new ConfigError(`El campo "models" debe ser un objeto en ${source}.`);
    }
    assertModelSelection(value.models.orchestrator, 'models.orchestrator', source);
    assertModelSelection(value.models.subagents, 'models.subagents', source);
    assertModel(value.models.aiderImplementer, 'models.aiderImplementer', source);
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

function interpolateEnvRecord(
  record: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (record === undefined) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = interpolateEnv(value) ?? '';
  }
  return result;
}

function interpolateCommands(commands: string[] | undefined): string[] | undefined {
  return commands?.map((command) => interpolateEnv(command) ?? command);
}

export function mergeConfig(globalConfig: HarnessConfigFile, localConfig: HarnessConfigFile): HarnessConfig {
  const globalOrchestrator = globalConfig.models?.orchestrator;
  const localOrchestrator = localConfig.models?.orchestrator;
  const globalSubagents = globalConfig.models?.subagents;
  const localSubagents = localConfig.models?.subagents;
  const globalImplementer = globalConfig.models?.aiderImplementer;
  const localImplementer = localConfig.models?.aiderImplementer;
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
    aider: {
      enabled: localConfig.aider?.enabled ?? globalConfig.aider?.enabled ?? false,
      timeoutMs: localConfig.aider?.timeoutMs ?? globalConfig.aider?.timeoutMs ?? DEFAULT_AIDER_TIMEOUT_MS,
      extraArgs: localConfig.aider?.extraArgs ?? globalConfig.aider?.extraArgs ?? [],
      inheritEnv: localConfig.aider?.inheritEnv ?? globalConfig.aider?.inheritEnv ?? true
    },
    models: {
      orchestrator: {
        modelName: localOrchestrator?.modelName ?? globalOrchestrator?.modelName ?? ''
      },
      subagents: {
        modelName: localSubagents?.modelName ?? globalSubagents?.modelName ?? ''
      },
      aiderImplementer: {
        modelName: localImplementer?.modelName || globalImplementer?.modelName || DEFAULT_IMPLEMENTER_MODEL,
        apiKey: interpolateEnv(localImplementer?.apiKey || globalImplementer?.apiKey) ?? '',
        apiBase: interpolateEnv(localImplementer?.apiBase || globalImplementer?.apiBase) ?? '',
        env: {
          ...interpolateEnvRecord(globalImplementer?.env),
          ...interpolateEnvRecord(localImplementer?.env)
        }
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
    aider: {
      enabled: config.aider?.enabled ?? false,
      timeoutMs: config.aider?.timeoutMs ?? DEFAULT_AIDER_TIMEOUT_MS,
      extraArgs: config.aider?.extraArgs ?? [],
      inheritEnv: config.aider?.inheritEnv ?? true
    },
    models: {
      orchestrator: {
        modelName: config.models.orchestrator.modelName
      },
      subagents: {
        modelName: config.models.subagents.modelName
      },
      aiderImplementer: {
        modelName: config.models.aiderImplementer.modelName,
        apiKey: config.models.aiderImplementer.apiKey ?? '',
        apiBase: config.models.aiderImplementer.apiBase ?? '',
        env: config.models.aiderImplementer.env ?? {}
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

function maskValue(value: string): string {
  return value.length > 0 ? '********' : '';
}

export function maskConfig(config: HarnessConfig): HarnessConfig {
  return {
    obsidianVaultPath: config.obsidianVaultPath,
    packageManager: config.packageManager,
    scope: config.scope,
    graphify: config.graphify,
    laya: config.laya,
    vitePlus: config.vitePlus,
    aider: config.aider,
    models: {
      orchestrator: {
        modelName: config.models.orchestrator.modelName
      },
      subagents: {
        modelName: config.models.subagents.modelName
      },
      aiderImplementer: {
        ...config.models.aiderImplementer,
        apiKey: maskValue(config.models.aiderImplementer.apiKey ?? ''),
        env: maskEnv(config.models.aiderImplementer.env)
      }
    },
    validation: {
      maxAttempts: config.validation.maxAttempts,
      commands: [...config.validation.commands],
      requireCommands: config.validation.requireCommands
    }
  };
}

function maskEnv(env: Record<string, string> | undefined): Record<string, string> {
  if (!env) {
    return {};
  }
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    masked[key] = /KEY|TOKEN|SECRET|PASS/i.test(key) ? maskValue(value) : value;
  }
  return masked;
}
