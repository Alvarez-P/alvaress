import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runModelCommand } from '../src/commands/model.js';
import { mergeConfig } from '../src/config/loader.js';
import { compareVersions, hasOllamaModel, parseOllamaVersion } from '../src/decision/ollama.js';
import type { OllamaStatus } from '../src/decision/ollama.js';
import { makeTempDir } from './helpers.js';

function config(model = 'kev') {
  return mergeConfig({ decision: { model, apiBase: 'http://127.0.0.1:11434' } }, {});
}

function capture(): { lines: string[]; write: (line: string) => void } {
  const lines: string[] = [];
  return { lines, write: (line) => lines.push(line) };
}

const running: OllamaStatus = {
  installed: true,
  running: true,
  version: '0.35.0',
  models: ['kev:latest']
};

test('hasOllamaModel exige la etiqueta exacta', () => {
  assert.equal(hasOllamaModel(['kev:latest'], 'kev'), true);
  assert.equal(hasOllamaModel(['kev:9b'], 'kev'), false);
  assert.equal(hasOllamaModel(['kev:9b'], 'kev:9b'), true);
  assert.equal(hasOllamaModel(['laya:latest'], 'kev'), false);
});

test('parseOllamaVersion y compareVersions comparan versiones', () => {
  assert.equal(parseOllamaVersion('ollama version is 0.35.1'), '0.35.1');
  assert.equal(compareVersions('0.35.1', '0.35.0'), 1);
  assert.equal(compareVersions('0.34.9', '0.35.0'), -1);
  assert.equal(compareVersions('0.35.0', '0.35.0'), 0);
});

test('model status informa del modelo instalado', async () => {
  const output = capture();
  const code = await runModelCommand(['status'], '/tmp', {
    config: config('kev'),
    ollama: running,
    stdout: output.write
  });

  assert.equal(code, 0);
  assert.match(output.lines.join('\n'), /Modelo: kev/);
  assert.match(output.lines.join('\n'), /instalado/);
});

test('model status devuelve 1 y sugiere pull si falta el modelo', async () => {
  const output = capture();
  const code = await runModelCommand(['status'], '/tmp', {
    config: config('laya'),
    ollama: running,
    stdout: output.write
  });

  assert.equal(code, 1);
  assert.match(output.lines.join('\n'), /ollama pull laya/);
});

test('model status en JSON incluye el estado de Ollama', async () => {
  const output = capture();
  await runModelCommand(['status', '--json'], '/tmp', {
    config: config('kev'),
    ollama: running,
    stdout: output.write
  });

  const parsed = JSON.parse(output.lines[0] ?? '{}') as {
    model: string;
    installed: boolean;
    ollama: { running: boolean; version: string };
  };
  assert.equal(parsed.model, 'kev');
  assert.equal(parsed.installed, true);
  assert.equal(parsed.ollama.running, true);
  assert.equal(parsed.ollama.version, '0.35.0');
});

test('model list imprime los modelos instalados', async () => {
  const output = capture();
  const code = await runModelCommand(['list'], '/tmp', {
    config: config('kev'),
    ollama: running,
    stdout: output.write
  });

  assert.equal(code, 0);
  assert.equal(output.lines[0], 'kev:latest');
});

test('model <nombre> escribe el override local', async () => {
  const temp = makeTempDir('alvaress-model-');
  try {
    const output = capture();
    const code = await runModelCommand(['laya', '--local'], temp.path, {
      config: config('kev'),
      ollama: running,
      stdout: output.write
    });

    assert.equal(code, 0);
    const written = JSON.parse(
      fs.readFileSync(path.join(temp.path, '.alvaressrc.json'), 'utf-8')
    ) as { decision?: { model?: string } };
    assert.equal(written.decision?.model, 'laya');
    assert.match(output.lines.join('\n'), /ollama pull laya/);
  } finally {
    temp.cleanup();
  }
});

test('model rechaza modelos no soportados', async () => {
  const errors = capture();
  const code = await runModelCommand(['gpt-4', '--local'], '/tmp', {
    config: config(),
    ollama: running,
    stderr: errors.write
  });

  assert.equal(code, 2);
  assert.match(errors.lines[0] ?? '', /kev|laya/);
});
