import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import type { FixInput, WorkPlan } from '../src/core/contracts.js';
import { buildFixMessage, buildWorkMessage } from '../src/orchestrator/workers.js';
import { makeTempDir, writeFile } from './helpers.js';

function plan(): WorkPlan {
  return {
    runId: 'run-1',
    mode: 'sdd',
    request: 'Agregar un helper',
    source: 'openspec.yaml',
    acceptance: ['El helper funciona'],
    files: ['src/helper.ts'],
    validation: ['pnpm test'],
    learnings: []
  };
}

test('buildWorkMessage prohíbe comentarios en el código generado', () => {
  const message = buildWorkMessage(plan());

  assert.match(message, /No agregues comentarios al código/i);
  assert.match(message, /TODO\/FIXME/);
  assert.match(message, /Conserva los comentarios existentes/i);
});

test('buildWorkMessage deja la validación al orquestador y evita reintentos', () => {
  const message = buildWorkMessage(plan());

  assert.match(message, /Validación final \(la ejecuta el orquestador; no la ejecutes tú\)/);
  assert.match(message, /No ejecutes la validación ni comandos de test/i);
  assert.match(message, /error de permisos, no lo reintentes/i);
});

test('buildWorkMessage incluye el contexto de archivos pequeños', () => {
  const temp = makeTempDir('alvaress-inline-');
  try {
    writeFile(path.join(temp.path, 'openspec.yaml'), 'version: 1\n');
    writeFile(path.join(temp.path, 'src', 'helper.ts'), 'export const helper = 1;\n');

    const message = buildWorkMessage(plan(), { root: temp.path, inlineContext: true });

    assert.match(message, /Contexto ya leído por el orquestador/);
    assert.match(message, /### openspec\.yaml/);
    assert.match(message, /### src\/helper\.ts/);
    assert.match(message, /export const helper = 1;/);
  } finally {
    temp.cleanup();
  }
});

test('buildWorkMessage omite archivos fuera del alcance o demasiado grandes', () => {
  const temp = makeTempDir('alvaress-inline-limit-');
  try {
    writeFile(path.join(temp.path, 'src', 'helper.ts'), 'x'.repeat(8_001));

    const message = buildWorkMessage(
      { ...plan(), source: '../fuera.yaml' },
      { root: temp.path, inlineContext: true }
    );

    assert.doesNotMatch(message, /Contexto ya leído por el orquestador/);
  } finally {
    temp.cleanup();
  }
});

test('buildFixMessage prohíbe comentarios en la reparación', () => {
  const input: FixInput = {
    runId: 'run-1',
    attempt: 1,
    files: ['src/helper.ts'],
    failure: {
      ok: false,
      commands: [{ command: 'pnpm test', code: 1, stderr: 'falló' }],
      warnings: []
    },
    error: 'falló'
  };

  const message = buildFixMessage(input);

  assert.match(message, /No agregues comentarios al código/i);
  assert.match(message, /TODO\/FIXME/);
  assert.match(message, /Conserva los comentarios existentes/i);
  assert.match(message, /error de permisos, no lo reintentes/i);
});
