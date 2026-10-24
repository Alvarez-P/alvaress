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
    decision: {
      model: 'kev',
      apiBase: 'http://global:11434',
      apiKey: 'global-key'
    },
    models: {
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
    decision: { model: 'laya', apiBase: 'http://local:11434' },
    models: {
      aiderImplementer: { modelName: 'local-implementer' }
    },
    validation: { maxAttempts: 2, commands: ['local-command'] }
  };

  const merged = mergeConfig(globalConfig, localConfig);

  assert.equal(merged.obsidianVaultPath, '/local/vault');
  assert.equal(merged.decision.model, 'laya');
  assert.equal(merged.decision.apiKey, 'global-key');
  assert.equal(merged.decision.apiBase, 'http://local:11434');
  assert.equal(merged.models.aiderImplementer.modelName, 'local-implementer');
  assert.equal(merged.models.aiderImplementer.apiKey, 'global-implementer-key');
  assert.deepEqual(merged.models.aiderImplementer.env, { DEEPSEEK_API_KEY: 'global-implementer-key' });
  assert.equal(merged.validation.maxAttempts, 2);
  assert.deepEqual(merged.validation.commands, ['local-command']);
});

test('mergeConfig usa valores por defecto sin configuración', () => {
  const merged = mergeConfig({}, {});

  assert.equal(merged.obsidianVaultPath, '');
  assert.equal(merged.decision.model, 'kev');
  assert.equal(merged.decision.apiBase, 'http://127.0.0.1:11434');
  assert.equal(merged.decision.apiKey, '');
  assert.equal(merged.decision.timeoutMs, 60000);
  assert.equal(merged.decision.cache, true);
  assert.equal(merged.decision.maxCalls, 3);
  assert.equal(merged.models.aiderImplementer.modelName, 'deepseek/deepseek-chat');
  assert.equal(merged.validation.maxAttempts, 3);
  assert.deepEqual(merged.validation.commands, [
    'pnpm exec oxlint --deny=correctness --deny=suspicious',
    'pnpm exec tsc --noEmit'
  ]);
  assert.equal(merged.packageManager, 'pnpm');
  assert.equal(merged.scope, 'warn');
  assert.equal(merged.validation.requireCommands, true);
});

test('loadConfig lee el archivo local del proyecto', () => {
  const temp = makeTempDir();
  try {
    writeJson(path.join(temp.path, '.alvaressrc.json'), {
      obsidianVaultPath: '/vault',
      decision: { model: 'laya' },
      models: {
        aiderImplementer: { modelName: 'local-implementer' }
      },
      validation: { maxAttempts: 1, commands: ['true'] }
    });

    const config = loadConfig(temp.path);

    assert.equal(config.obsidianVaultPath, '/vault');
    assert.equal(config.decision.model, 'laya');
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
      decision: {
        model: 'kev:9b',
        apiBase: 'http://127.0.0.1:11434',
        apiKey: '',
        timeoutMs: 60000,
        cache: true,
        cacheTtlMs: 86400000,
        maxCalls: 3
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
  assert.equal(value.decision?.model, 'kev:9b');
  assert.equal(value.validation?.maxAttempts, 3);
});

test('validateConfigFile rechaza tipos incorrectos', () => {
  assert.throws(() => validateConfigFile([], 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ obsidianVaultPath: 42 }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ decision: [] }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ decision: { model: 'gpt-4' } }, 'test'), ConfigError);
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
});

test('toConfigFile conserva todas las claves del esquema', () => {
  const config: HarnessConfig = mergeConfig({}, {});
  const file = toConfigFile(config);

  assert.deepEqual(Object.keys(file).toSorted(), [
    'aider',
    'decision',
    'graphify',
    'models',
    'obsidianVaultPath',
    'packageManager',
    'scope',
    'validation'
  ]);
  assert.deepEqual(Object.keys(file.models ?? {}).toSorted(), ['aiderImplementer']);
  assert.deepEqual(Object.keys(file.decision ?? {}).toSorted(), [
    'apiBase',
    'apiKey',
    'cache',
    'cacheTtlMs',
    'maxCalls',
    'model',
    'timeoutMs'
  ]);
});

test('maskConfig oculta claves y secretos de entorno', () => {
  const config: HarnessConfig = {
    obsidianVaultPath: '/vault',
    decision: {
      model: 'kev',
      apiBase: 'http://localhost:11434',
      apiKey: 'secret-decision',
      timeoutMs: 60000,
      cache: true,
      cacheTtlMs: 1000,
      maxCalls: 3
    },
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

  assert.equal(masked.decision.apiKey, '********');
  assert.equal(masked.models.aiderImplementer.apiKey, '********');
  assert.equal(masked.models.aiderImplementer.env?.DEEPSEEK_API_KEY, '********');
  assert.equal(masked.models.aiderImplementer.env?.OTHER, 'value');
  assert.equal(masked.obsidianVaultPath, '/vault');
});
