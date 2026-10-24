import path from 'node:path';
import {
  DEFAULT_IMPLEMENTER_MODEL,
  DEFAULT_JEV_BASE,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_ORCHESTRATOR_MODEL,
  DEFAULT_VALIDATION_COMMANDS,
  GLOBAL_CONFIG_PATH,
  LOCAL_CONFIG_FILENAME
} from '../constants.js';
import { ConfigError } from '../utils/errors.js';
import { pathExists, readJsonFile, writeJsonFile } from '../utils/fs.js';

export interface ModelProviderConfig {
  modelName: string;
  apiKey?: string;
  apiBase?: string;
  env?: Record<string, string>;
}

export interface HarnessConfig {
  obsidianVaultPath: string;
  models: {
    jevOrchestrator: ModelProviderConfig;
    aiderImplementer: ModelProviderConfig;
  };
  validation: {
    maxAttempts: number;
    commands: string[];
  };
}

export interface HarnessConfigFile {
  obsidianVaultPath?: string;
  models?: {
    jevOrchestrator?: Partial<ModelProviderConfig>;
    aiderImplementer?: Partial<ModelProviderConfig>;
  };
  validation?: {
    maxAttempts?: number;
    commands?: string[];
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

export function validateConfigFile(value: unknown, source: string): HarnessConfigFile {
  if (!isRecord(value)) {
    throw new ConfigError(`La configuración de ${source} debe ser un objeto JSON.`);
  }

  assertString(value.obsidianVaultPath, 'obsidianVaultPath', source);

  if (value.models !== undefined) {
    if (!isRecord(value.models)) {
      throw new ConfigError(`El campo "models" debe ser un objeto en ${source}.`);
    }
    assertModel(value.models.jevOrchestrator, 'models.jevOrchestrator', source);
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
  }

  return value as HarnessConfigFile;
}

export function readConfigFile(target: string): HarnessConfigFile {
  if (!pathExists(target)) {
    return {};
  }
  return validateConfigFile(readJsonFile<unknown>(target), target);
}

export function mergeConfig(globalConfig: HarnessConfigFile, localConfig: HarnessConfigFile): HarnessConfig {
  const globalOrchestrator = globalConfig.models?.jevOrchestrator;
  const localOrchestrator = localConfig.models?.jevOrchestrator;
  const globalImplementer = globalConfig.models?.aiderImplementer;
  const localImplementer = localConfig.models?.aiderImplementer;

  return {
    obsidianVaultPath: localConfig.obsidianVaultPath || globalConfig.obsidianVaultPath || '',
    models: {
      jevOrchestrator: {
        modelName:
          localOrchestrator?.modelName || globalOrchestrator?.modelName || DEFAULT_ORCHESTRATOR_MODEL,
        apiKey: localOrchestrator?.apiKey || globalOrchestrator?.apiKey || '',
        apiBase: localOrchestrator?.apiBase || globalOrchestrator?.apiBase || DEFAULT_JEV_BASE,
        env: { ...globalOrchestrator?.env, ...localOrchestrator?.env }
      },
      aiderImplementer: {
        modelName: localImplementer?.modelName || globalImplementer?.modelName || DEFAULT_IMPLEMENTER_MODEL,
        apiKey: localImplementer?.apiKey || globalImplementer?.apiKey || '',
        apiBase: localImplementer?.apiBase || globalImplementer?.apiBase || '',
        env: { ...globalImplementer?.env, ...localImplementer?.env }
      }
    },
    validation: {
      maxAttempts:
        localConfig.validation?.maxAttempts || globalConfig.validation?.maxAttempts || DEFAULT_MAX_ATTEMPTS,
      commands:
        localConfig.validation?.commands || globalConfig.validation?.commands || [...DEFAULT_VALIDATION_COMMANDS]
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
    models: {
      jevOrchestrator: {
        modelName: config.models.jevOrchestrator.modelName,
        apiKey: config.models.jevOrchestrator.apiKey ?? '',
        apiBase: config.models.jevOrchestrator.apiBase ?? '',
        env: config.models.jevOrchestrator.env ?? {}
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
      commands: config.validation.commands
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
    models: {
      jevOrchestrator: {
        ...config.models.jevOrchestrator,
        apiKey: maskValue(config.models.jevOrchestrator.apiKey ?? ''),
        env: maskEnv(config.models.jevOrchestrator.env)
      },
      aiderImplementer: {
        ...config.models.aiderImplementer,
        apiKey: maskValue(config.models.aiderImplementer.apiKey ?? ''),
        env: maskEnv(config.models.aiderImplementer.env)
      }
    },
    validation: {
      maxAttempts: config.validation.maxAttempts,
      commands: [...config.validation.commands]
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
