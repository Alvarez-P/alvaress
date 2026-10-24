import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAiderArgs, buildAiderEnv } from '../src/orchestrator/aider.js';
import { mergeConfig } from '../src/config/loader.js';
import type { HarnessConfig } from '../src/config/loader.js';

function config(overrides: Partial<HarnessConfig> = {}): HarnessConfig {
  const base = mergeConfig({}, {});
  return {
    ...base,
    ...overrides,
    models: {
      ...base.models,
      ...overrides.models
    },
    validation: {
      ...base.validation,
      ...overrides.validation
    }
  };
}

test('buildAiderEnv propaga claves y endpoint del implementador', () => {
  const env = buildAiderEnv(
    config({
      models: {
        ...mergeConfig({}, {}).models,
        aiderImplementer: {
          modelName: 'deepseek/deepseek-chat',
          apiKey: 'sk-test',
          apiBase: 'http://localhost:11434/v1',
          env: { CUSTOM: 'value', DEEPSEEK_API_KEY: 'sk-from-env' }
        }
      }
    })
  );

  assert.equal(env.DEEPSEEK_API_KEY, 'sk-from-env');
  assert.equal(env.OPENAI_API_KEY, 'sk-test');
  assert.equal(env.OPENAI_API_BASE, 'http://localhost:11434/v1');
  assert.equal(env.CUSTOM, 'value');
  assert.ok(env.PATH !== undefined);
});

test('buildAiderEnv no define claves vacías', () => {
  const env = buildAiderEnv(
    config({
      models: {
        ...mergeConfig({}, {}).models,
        aiderImplementer: { modelName: 'local', apiKey: '', apiBase: '', env: {} }
      }
    })
  );

  assert.equal(env.DEEPSEEK_API_KEY, process.env.DEEPSEEK_API_KEY);
  assert.equal(env.OPENAI_API_KEY, process.env.OPENAI_API_KEY);
  assert.equal(env.OPENAI_API_BASE, process.env.OPENAI_API_BASE);
});

test('buildAiderArgs incluye modelo, mensaje y archivos', () => {
  const args = buildAiderArgs('deepseek/deepseek-chat', {
    message: 'Implementa la tarea',
    readFiles: ['.harness/tasks/TASK-01.md'],
    files: ['src/a.ts', 'src/b.ts']
  });

  assert.deepEqual(args, [
    '--model',
    'deepseek/deepseek-chat',
    '--message',
    'Implementa la tarea',
    '--no-auto-commits',
    '--read',
    '.harness/tasks/TASK-01.md',
    'src/a.ts',
    'src/b.ts'
  ]);
});

test('buildAiderArgs omite archivos vacíos', () => {
  const args = buildAiderArgs('local', { message: 'x', files: [] });
  assert.deepEqual(args, ['--model', 'local', '--message', 'x', '--no-auto-commits']);
});
