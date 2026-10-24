import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  loadConfig,
  maskConfig,
  mergeConfig,
  readConfigFile,
  toConfigFile,
  validateConfigFile
} from '../src/config/loader.js';
import type { HarnessConfig, HarnessConfigFile } from '../src/config/loader.js';
import { ConfigError } from '../src/utils/errors.js';
import { makeTempDir, writeFile, writeJson } from './helpers.js';

test('mergeConfig aplica precedencia local y fusiona env', () => {
  const globalConfig: HarnessConfigFile = {
    obsidianVaultPath: '/global/vault',
    models: {
      jevOrchestrator: {
        modelName: 'global-orchestrator',
        apiKey: 'global-key',
        apiBase: 'http://global',
        env: { SHARED: 'global', GLOBAL_ONLY: 'yes' }
      },
      aiderImplementer: {
        modelName: 'global-implementer',
        apiKey: 'global-implementer-key',
        env: { DEEPSEEK_API_KEY: 'global-implementer-key' }
      }
    },
    validation: { maxAttempts: 5, commands: ['global-command'] }
  };
  const localConfig: HarnessConfigFile = {
    obsidianVaultPath: '/local/vault',
    models: {
      jevOrchestrator: { modelName: 'local-orchestrator', env: { SHARED: 'local', LOCAL_ONLY: 'yes' } },
      aiderImplementer: { modelName: 'local-implementer' }
    },
    validation: { maxAttempts: 2, commands: ['local-command'] }
  };

  const merged = mergeConfig(globalConfig, localConfig);

  assert.equal(merged.obsidianVaultPath, '/local/vault');
  assert.equal(merged.models.jevOrchestrator.modelName, 'local-orchestrator');
  assert.equal(merged.models.jevOrchestrator.apiKey, 'global-key');
  assert.equal(merged.models.jevOrchestrator.apiBase, 'http://global');
  assert.deepEqual(merged.models.jevOrchestrator.env, {
    SHARED: 'local',
    GLOBAL_ONLY: 'yes',
    LOCAL_ONLY: 'yes'
  });
  assert.equal(merged.models.aiderImplementer.modelName, 'local-implementer');
  assert.equal(merged.models.aiderImplementer.apiKey, 'global-implementer-key');
  assert.deepEqual(merged.models.aiderImplementer.env, { DEEPSEEK_API_KEY: 'global-implementer-key' });
  assert.equal(merged.validation.maxAttempts, 2);
  assert.deepEqual(merged.validation.commands, ['local-command']);
});

test('mergeConfig usa valores por defecto sin configuración', () => {
  const merged = mergeConfig({}, {});

  assert.equal(merged.obsidianVaultPath, '');
  assert.equal(merged.models.jevOrchestrator.modelName, 'jev-latest');
  assert.equal(merged.models.jevOrchestrator.apiBase, 'https://api.typesafe.ai/v1');
  assert.equal(merged.models.aiderImplementer.modelName, 'deepseek/deepseek-chat');
  assert.deepEqual(merged.models.jevOrchestrator.env, {});
  assert.equal(merged.validation.maxAttempts, 3);
  assert.deepEqual(merged.validation.commands, [
    'npx oxlint --deny=correctness --deny=suspicious',
    'npx tsc --noEmit'
  ]);
});

test('loadConfig lee el archivo local del proyecto', () => {
  const temp = makeTempDir();
  try {
    writeJson(path.join(temp.path, '.alvaressrc.json'), {
      obsidianVaultPath: '/vault',
      models: {
        jevOrchestrator: { modelName: 'local-orchestrator' },
        aiderImplementer: { modelName: 'local-implementer' }
      },
      validation: { maxAttempts: 1, commands: ['true'] }
    });

    const config = loadConfig(temp.path);

    assert.equal(config.obsidianVaultPath, '/vault');
    assert.equal(config.models.jevOrchestrator.modelName, 'local-orchestrator');
    assert.equal(config.models.aiderImplementer.modelName, 'local-implementer');
    assert.equal(config.validation.maxAttempts, 1);
    assert.deepEqual(config.validation.commands, ['true']);
  } finally {
    temp.cleanup();
  }
});

test('readConfigFile devuelve vacío si no existe', () => {
  assert.deepEqual(readConfigFile('/tmp/harness-no-existe/config.json'), {});
});

test('readConfigFile rechaza JSON inválido', () => {
  const temp = makeTempDir();
  try {
    const target = path.join(temp.path, 'config.json');
    writeFile(target, '{ invalid');
    assert.throws(() => readConfigFile(target), ConfigError);
  } finally {
    temp.cleanup();
  }
});

test('validateConfigFile acepta la estructura completa', () => {
  const value = validateConfigFile(
    {
      obsidianVaultPath: '/vault',
      models: {
        jevOrchestrator: {
          modelName: 'qwen2.5-coder:3b',
          apiKey: '',
          apiBase: 'http://localhost:11434/v1',
          env: {}
        },
        aiderImplementer: {
          modelName: 'deepseek/deepseek-chat',
          apiKey: 'sk-test',
          apiBase: '',
          env: { DEEPSEEK_API_KEY: 'sk-test' }
        }
      },
      validation: { maxAttempts: 3, commands: ['npx tsc --noEmit'] }
    },
    'test'
  );

  assert.equal(value.obsidianVaultPath, '/vault');
  assert.equal(value.validation?.maxAttempts, 3);
});

test('validateConfigFile rechaza tipos incorrectos', () => {
  assert.throws(() => validateConfigFile([], 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ obsidianVaultPath: 42 }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ models: [] }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ models: { jevOrchestrator: 'x' } }, 'test'), ConfigError);
  assert.throws(
    () => validateConfigFile({ models: { aiderImplementer: { env: { KEY: 1 } } } }, 'test'),
    ConfigError
  );
  assert.throws(() => validateConfigFile({ validation: { maxAttempts: 0 } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ validation: { maxAttempts: 1.5 } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ validation: { commands: 'x' } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ validation: { commands: [1] } }, 'test'), ConfigError);
});

test('toConfigFile conserva todas las claves del esquema', () => {
  const config: HarnessConfig = mergeConfig({}, {});
  const file = toConfigFile(config);

  assert.deepEqual(Object.keys(file).toSorted(), ['models', 'obsidianVaultPath', 'validation']);
  assert.deepEqual(Object.keys(file.models ?? {}).toSorted(), ['aiderImplementer', 'jevOrchestrator']);
  assert.deepEqual(Object.keys(file.models?.jevOrchestrator ?? {}).toSorted(), [
    'apiBase',
    'apiKey',
    'env',
    'modelName'
  ]);
});

test('maskConfig oculta claves y secretos de entorno', () => {
  const config: HarnessConfig = {
    obsidianVaultPath: '/vault',
    models: {
      jevOrchestrator: {
        modelName: 'orchestrator',
        apiKey: 'secret-orchestrator',
        apiBase: 'http://localhost',
        env: { API_TOKEN: 'token-value', PLAIN: 'visible' }
      },
      aiderImplementer: {
        modelName: 'implementer',
        apiKey: 'secret-implementer',
        apiBase: '',
        env: { DEEPSEEK_API_KEY: 'secret', OTHER: 'value' }
      }
    },
    validation: { maxAttempts: 2, commands: ['true'] }
  };

  const masked = maskConfig(config);

  assert.equal(masked.models.jevOrchestrator.apiKey, '********');
  assert.equal(masked.models.aiderImplementer.apiKey, '********');
  assert.equal(masked.models.jevOrchestrator.env?.API_TOKEN, '********');
  assert.equal(masked.models.jevOrchestrator.env?.PLAIN, 'visible');
  assert.equal(masked.models.aiderImplementer.env?.DEEPSEEK_API_KEY, '********');
  assert.equal(masked.models.aiderImplementer.env?.OTHER, 'value');
  assert.equal(masked.obsidianVaultPath, '/vault');
});
