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
      aiderImplementer: {
        modelName: 'global-implementer',
        apiKey: 'global-implementer-key',
        env: { DEEPSEEK_API_KEY: 'global-implementer-key' }
      }
    },
    laya: { model: 'global-model', timeoutMs: 5000, enabled: true },
    vitePlus: { checkCommand: 'global-check' },
    aider: { enabled: true, timeoutMs: 2000 },
    validation: { maxAttempts: 5, commands: ['global-command'] }
  };
  const localConfig: HarnessConfigFile = {
    obsidianVaultPath: '/local/vault',
    models: {
      aiderImplementer: { modelName: 'local-implementer' }
    },
    laya: { model: 'local-model' },
    vitePlus: { testCommand: 'local-test' },
    aider: { enabled: false },
    validation: { maxAttempts: 2, commands: ['local-command'] }
  };

  const merged = mergeConfig(globalConfig, localConfig);

  assert.equal(merged.obsidianVaultPath, '/local/vault');
  assert.equal(merged.models.aiderImplementer.modelName, 'local-implementer');
  assert.equal(merged.models.aiderImplementer.apiKey, 'global-implementer-key');
  assert.deepEqual(merged.models.aiderImplementer.env, { DEEPSEEK_API_KEY: 'global-implementer-key' });
  assert.equal(merged.laya?.model, 'local-model');
  assert.equal(merged.laya?.timeoutMs, 5000);
  assert.equal(merged.laya?.enabled, true);
  assert.equal(merged.vitePlus?.checkCommand, 'global-check');
  assert.equal(merged.vitePlus?.testCommand, 'local-test');
  assert.equal(merged.aider?.enabled, false);
  assert.equal(merged.aider?.timeoutMs, 2000);
  assert.equal(merged.validation.maxAttempts, 2);
  assert.deepEqual(merged.validation.commands, ['local-command']);
});

test('mergeConfig usa valores por defecto sin configuración', () => {
  const merged = mergeConfig({}, {});

  assert.equal(merged.obsidianVaultPath, '');
  assert.equal(merged.models.aiderImplementer.modelName, 'deepseek/deepseek-chat');
  assert.equal(merged.validation.maxAttempts, 3);
  assert.deepEqual(merged.validation.commands, [
    'pnpm exec vp check',
    'pnpm exec vp test'
  ]);
  assert.equal(merged.packageManager, 'pnpm');
  assert.equal(merged.scope, 'warn');
  assert.equal(merged.validation.requireCommands, true);
  assert.equal(merged.laya?.enabled, true);
  assert.equal(merged.laya?.model, 'convaiinnovations/laya');
  assert.equal(merged.laya?.subfolder, 'multilingual');
  assert.equal(merged.laya?.fallbackToHeuristic, true);
  assert.equal(merged.vitePlus?.checkCommand, 'vp check');
  assert.equal(merged.vitePlus?.testCommand, 'vp test');
  assert.equal(merged.vitePlus?.fallbackToPackageManager, true);
  assert.equal(merged.aider?.enabled, false);
});

test('loadConfig lee el archivo local del proyecto', () => {
  const temp = makeTempDir();
  try {
    writeJson(path.join(temp.path, '.alvaressrc.json'), {
      obsidianVaultPath: '/vault',
      models: {
        aiderImplementer: { modelName: 'local-implementer' }
      },
      validation: { maxAttempts: 1, commands: ['true'] }
    });

    const config = loadConfig(temp.path);

    assert.equal(config.obsidianVaultPath, '/vault');
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
      laya: {
        enabled: true,
        model: 'convaiinnovations/laya',
        subfolder: 'multilingual',
        device: 'cpu',
        timeoutMs: 30000,
        fallbackToHeuristic: true
      },
      vitePlus: {
        checkCommand: 'vp check',
        testCommand: 'vp test',
        fallbackToPackageManager: true
      },
      models: {
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
  assert.equal(value.laya?.model, 'convaiinnovations/laya');
  assert.equal(value.vitePlus?.checkCommand, 'vp check');
  assert.equal(value.validation?.maxAttempts, 3);
});

test('validateConfigFile rechaza tipos incorrectos', () => {
  assert.throws(() => validateConfigFile([], 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ obsidianVaultPath: 42 }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ models: [] }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ models: { aiderImplementer: 'x' } }, 'test'), ConfigError);
  assert.throws(
    () => validateConfigFile({ models: { aiderImplementer: { env: { KEY: 1 } } } }, 'test'),
    ConfigError
  );
  assert.throws(() => validateConfigFile({ validation: { maxAttempts: 0 } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ validation: { maxAttempts: 1.5 } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ validation: { commands: 'x' } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ validation: { commands: [1] } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ laya: [] }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ laya: { device: 'gpu' } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ laya: { timeoutMs: 10 } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ vitePlus: { checkCommand: 1 } }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ aider: { enabled: 'yes' } }, 'test'), ConfigError);
});

test('toConfigFile conserva todas las claves del esquema', () => {
  const config: HarnessConfig = mergeConfig({}, {});
  const file = toConfigFile(config);

  assert.deepEqual(Object.keys(file).toSorted(), [
    'aider',
    'graphify',
    'laya',
    'models',
    'obsidianVaultPath',
    'packageManager',
    'scope',
    'validation',
    'vitePlus'
  ]);
  assert.deepEqual(Object.keys(file.models ?? {}).toSorted(), ['aiderImplementer']);
});

test('maskConfig oculta claves y secretos de entorno', () => {
  const config: HarnessConfig = {
    obsidianVaultPath: '/vault',
    models: {
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

  assert.equal(masked.models.aiderImplementer.apiKey, '********');
  assert.equal(masked.models.aiderImplementer.env?.DEEPSEEK_API_KEY, '********');
  assert.equal(masked.models.aiderImplementer.env?.OTHER, 'value');
  assert.equal(masked.obsidianVaultPath, '/vault');
});
