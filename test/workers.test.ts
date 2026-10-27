import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FixInput, WorkPlan } from '../src/core/contracts.js';
import { buildFixMessage, buildWorkMessage } from '../src/orchestrator/workers.js';

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
});
