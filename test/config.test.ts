import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  loadConfig,
  displayConfig,
  mergeConfig,
  readConfigFile,
  toConfigFile,
  validateConfigFile
} from '../src/config/loader.js';
import type { HarnessConfig, HarnessConfigFile } from '../src/config/loader.js';
import { ConfigError } from '../src/utils/errors.js';
import { makeTempDir, writeFile, writeJson } from './helpers.js';

test('mergeConfig aplica precedencia local', () => {
  const globalConfig: HarnessConfigFile = {
    obsidianVaultPath: '/global/vault',
    models: {
      orchestrator: { modelName: 'openai/global-orchestrator' },
      subagents: { modelName: 'openai/global-subagents' }
    },
    laya: { modelDir: 'global-model', timeoutMs: 5000, enabled: true },
    vitePlus: { checkCommand: 'global-check' },
    worker: { timeoutMs: 2000 },
    validation: { maxAttempts: 5, commands: ['global-command'] }
  };
  const localConfig: HarnessConfigFile = {
    obsidianVaultPath: '/local/vault',
    models: {
      orchestrator: { modelName: 'openai/local-orchestrator' }
    },
    laya: { modelDir: 'local-model' },
    vitePlus: { testCommand: 'local-test' },
    validation: { maxAttempts: 2, commands: ['local-command'] }
  };

  const merged = mergeConfig(globalConfig, localConfig);

  assert.equal(merged.obsidianVaultPath, '/local/vault');
  assert.equal(merged.models.orchestrator.modelName, 'openai/local-orchestrator');
  assert.equal(merged.models.subagents.modelName, 'openai/global-subagents');
  assert.equal(merged.laya?.modelDir, 'local-model');
  assert.equal(merged.laya?.timeoutMs, 5000);
  assert.equal(merged.laya?.enabled, true);
  assert.equal(merged.vitePlus?.checkCommand, 'global-check');
  assert.equal(merged.vitePlus?.testCommand, 'local-test');
  assert.equal(merged.worker?.timeoutMs, 2000);
  assert.equal(merged.validation.maxAttempts, 2);
  assert.deepEqual(merged.validation.commands, ['local-command']);
});

test('mergeConfig usa valores por defecto sin configuración', () => {
  const merged = mergeConfig({}, {});

  assert.equal(merged.obsidianVaultPath, '');
  assert.equal(merged.models.orchestrator.modelName, '');
  assert.equal(merged.models.subagents.modelName, '');
  assert.equal(merged.worker?.timeoutMs, 600_000);
  assert.equal(merged.validation.maxAttempts, 3);
  assert.deepEqual(merged.validation.commands, [
    'pnpm exec vp check',
    'pnpm exec vp test'
  ]);
  assert.equal(merged.packageManager, 'pnpm');
  assert.equal(merged.scope, 'warn');
  assert.equal(merged.validation.requireCommands, true);
  assert.equal(merged.laya?.enabled, true);
  assert.equal(merged.laya?.modelDir, undefined);
  assert.equal(merged.laya?.fallbackToHeuristic, true);
  assert.equal(merged.vitePlus?.checkCommand, 'vp check');
  assert.equal(merged.vitePlus?.testCommand, 'vp test');
  assert.equal(merged.vitePlus?.fallbackToPackageManager, true);
});

test('loadConfig lee el archivo local del proyecto', () => {
  const temp = makeTempDir();
  try {
    writeJson(path.join(temp.path, '.alvaressrc.json'), {
      obsidianVaultPath: '/vault',
      models: {
        subagents: { modelName: 'openai/local-subagents' }
      },
      validation: { maxAttempts: 1, commands: ['true'] }
    });

    const config = loadConfig(temp.path);

    assert.equal(config.obsidianVaultPath, '/vault');
    assert.equal(config.models.subagents.modelName, 'openai/local-subagents');
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
        orchestrator: { modelName: 'openai/gpt-5' },
        subagents: { modelName: 'openai/gpt-5-mini' }
      },
      worker: { timeoutMs: 60000 },
      validation: { maxAttempts: 3, commands: ['npx tsc --noEmit'] }
    },
    'test'
  );

  assert.equal(value.obsidianVaultPath, '/vault');
  assert.equal(value.laya?.modelDir, undefined);
  assert.equal(value.vitePlus?.checkCommand, 'vp check');
  assert.equal(value.worker?.timeoutMs, 60000);
  assert.equal(value.validation?.maxAttempts, 3);
});

test('validateConfigFile rechaza tipos incorrectos', () => {
  assert.throws(() => validateConfigFile([], 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ obsidianVaultPath: 42 }, 'test'), ConfigError);
  assert.throws(() => validateConfigFile({ models: [] }, 'test'), ConfigError);
  assert.throws(
    () => validateConfigFile({ models: { orchestrator: { modelName: 'gpt-5' } } }, 'test'),
    ConfigError
  );
  assert.throws(
    () => validateConfigFile({ models: { subagents: { modelName: 'gpt-5-mini' } } }, 'test'),
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
  assert.throws(() => validateConfigFile({ worker: { timeoutMs: 10 } }, 'test'), ConfigError);
});

test('toConfigFile conserva todas las claves del esquema', () => {
  const config: HarnessConfig = mergeConfig({}, {});
  const file = toConfigFile(config);

  assert.deepEqual(Object.keys(file).toSorted(), [
    'graphify',
    'laya',
    'models',
    'obsidianVaultPath',
    'packageManager',
    'scope',
    'validation',
    'vitePlus',
    'worker'
  ]);
  assert.deepEqual(Object.keys(file.models ?? {}).toSorted(), [
    'orchestrator',
    'subagents'
  ]);
});

test('displayConfig conserva los modelos sin credenciales', () => {
  const config: HarnessConfig = {
    obsidianVaultPath: '/vault',
    models: {
      orchestrator: { modelName: 'openai/orchestrator' },
      subagents: { modelName: 'openai/subagents' }
    },
    validation: { maxAttempts: 2, commands: ['true'] }
  };

  const displayed = displayConfig(config);

  assert.equal(displayed.models.orchestrator.modelName, 'openai/orchestrator');
  assert.equal(displayed.models.subagents.modelName, 'openai/subagents');
  assert.equal(displayed.obsidianVaultPath, '/vault');
});
