import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runJevCommand } from '../src/commands/jev.js';
import { mergeConfig } from '../src/config/loader.js';
import type { HarnessConfig } from '../src/config/loader.js';
import type { FetchLike } from '../src/jev/client.js';

function configWithKey(): HarnessConfig {
  return mergeConfig(
    {
      models: {
        jevOrchestrator: {
          modelName: 'jev-latest',
          apiKey: 'test-key',
          apiBase: 'https://api.typesafe.ai/v1',
          env: {}
        }
      }
    },
    {}
  );
}

interface FetchCall {
  url: string;
  init?: RequestInit;
}

function fakeFetch(payload: unknown, status = 200): { fetchImpl: FetchLike; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  return { fetchImpl, calls };
}

function capture(): { lines: string[]; write: (line: string) => void } {
  const lines: string[] = [];
  return { lines, write: (line) => lines.push(line) };
}

test('jev predict envía una pregunta noul y aplica el threshold', async () => {
  const { fetchImpl, calls } = fakeFetch({
    model: 'jev-1.13.0',
    answers: { decision: { type: 'noul', noul: 0.91 } }
  });
  const output = capture();

  const code = await runJevCommand(
    ['predict', '--state', 'Cambio pequeño en un archivo', '--question', '¿Puedo aplicarlo?', '--threshold', '0.8'],
    '/tmp',
    { config: configWithKey(), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 0);
  assert.equal(calls[0]?.url, 'https://api.typesafe.ai/v1/systemone');
  const body = JSON.parse(String(calls[0]?.init?.body)) as {
    model: string;
    state: string;
    questions: { decision: { type: string; instructions: string } };
  };
  assert.equal(body.model, 'jev-latest');
  assert.equal(body.state, 'Cambio pequeño en un archivo');
  assert.equal(body.questions.decision.type, 'noul');
  const result = JSON.parse(output.lines[0] ?? '{}') as { probability: number; pass: boolean };
  assert.equal(result.probability, 0.91);
  assert.equal(result.pass, true);
});

test('jev predict devuelve exit code 1 cuando no alcanza el threshold', async () => {
  const { fetchImpl } = fakeFetch({
    model: 'jev-1.13.0',
    answers: { decision: { type: 'noul', noul: 0.42 } }
  });
  const output = capture();

  const code = await runJevCommand(
    ['predict', '--state', 'x', '--question', '¿?', '--threshold', '0.8'],
    '/tmp',
    { config: configWithKey(), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 1);
  const result = JSON.parse(output.lines[0] ?? '{}') as { pass: boolean };
  assert.equal(result.pass, false);
});

test('jev choose devuelve la opción y respeta min-confidence', async () => {
  const { fetchImpl, calls } = fakeFetch({
    model: 'jev-1.13.0',
    answers: {
      decision: {
        type: 'choice',
        choice: 'apply',
        confidence: 0.82,
        probabilities: { spec: 0.1, apply: 0.82, direct: 0.08 }
      }
    }
  });
  const output = capture();

  const code = await runJevCommand(
    [
      'choose',
      '--state',
      'Dos tareas pendientes con archivos definidos',
      '--question',
      '¿Qué camino conviene?',
      '--option',
      'spec=Crear especificación',
      '--option',
      'apply=Ejecutar con Aider',
      '--min-confidence',
      '0.6'
    ],
    '/tmp',
    { config: configWithKey(), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 0);
  const body = JSON.parse(String(calls[0]?.init?.body)) as {
    questions: { decision: { criteria: Record<string, string> } };
  };
  assert.deepEqual(body.questions.decision.criteria, {
    spec: 'Crear especificación',
    apply: 'Ejecutar con Aider'
  });
  const result = JSON.parse(output.lines[0] ?? '{}') as { choice: string; pass: boolean };
  assert.equal(result.choice, 'apply');
  assert.equal(result.pass, true);
});

test('jev score devuelve score, leyenda y probabilidades', async () => {
  const { fetchImpl } = fakeFetch({
    model: 'jev-1.13.0',
    answers: {
      decision: {
        type: 'score',
        score: 0.67,
        confidence: 0.5,
        legend: { '0': 'trivial', '1': 'media', '2': 'alta' },
        probabilities: { '0': 0.33, '1': 0.67, '2': 0 }
      }
    }
  });
  const output = capture();

  const code = await runJevCommand(
    [
      'score',
      '--state',
      'Cambio en tres archivos del mismo contexto',
      '--question',
      '¿Complejidad?',
      '--level',
      'trivial',
      '--level',
      'media',
      '--level',
      'alta'
    ],
    '/tmp',
    { config: configWithKey(), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 0);
  const result = JSON.parse(output.lines[0] ?? '{}') as {
    score: number;
    legend: Record<string, string>;
  };
  assert.equal(result.score, 0.67);
  assert.equal(result.legend['1'], 'media');
});

test('jev ask reenvía una petición completa', async () => {
  const { fetchImpl, calls } = fakeFetch({
    model: 'jev-1.13.0',
    answers: { q: { type: 'noul', noul: 0.5 } }
  });
  const output = capture();
  const request = JSON.stringify({
    state: { tarea: 'x' },
    questions: { q: { type: 'noul', instructions: '¿Es válido?' } }
  });

  const code = await runJevCommand(['ask', '--request', request], '/tmp', {
    config: configWithKey(),
    fetchImpl,
    stdout: output.write
  });

  assert.equal(code, 0);
  const body = JSON.parse(String(calls[0]?.init?.body)) as { state: unknown };
  assert.deepEqual(body.state, { tarea: 'x' });
  const response = JSON.parse(output.lines[0] ?? '{}') as { answers: { q: { noul: number } } };
  assert.equal(response.answers.q.noul, 0.5);
});

test('jev models lista los modelos disponibles', async () => {
  const { fetchImpl, calls } = fakeFetch({
    models: [
      { name: 'jev-latest', description: 'General-purpose system one model.', release_date: '2026-09-15' }
    ]
  });
  const output = capture();

  const code = await runJevCommand(['models'], '/tmp', {
    config: configWithKey(),
    fetchImpl,
    stdout: output.write
  });

  assert.equal(code, 0);
  assert.equal(calls[0]?.url, 'https://api.typesafe.ai/v1/models');
  const result = JSON.parse(output.lines[0] ?? '{}') as { models: Array<{ name: string }> };
  assert.equal(result.models[0]?.name, 'jev-latest');
});

test('jev devuelve exit code 2 sin API key', async () => {
  const errors = capture();
  const code = await runJevCommand(
    ['predict', '--state', 'x', '--question', '¿?'],
    '/tmp',
    { config: mergeConfig({}, {}), stderr: errors.write }
  );

  assert.equal(code, 2);
  assert.match(errors.lines[0] ?? '', /API key/);
});

const failingFetch: FetchLike = async () => new Response('boom', { status: 500 });

test('jev devuelve exit code 2 ante un error HTTP', async () => {
  const errors = capture();

  const code = await runJevCommand(
    ['predict', '--state', 'x', '--question', '¿?'],
    '/tmp',
    { config: configWithKey(), fetchImpl: failingFetch, stderr: errors.write }
  );

  assert.equal(code, 2);
  assert.match(errors.lines[0] ?? '', /HTTP 500/);
});

test('jev rechaza opciones desconocidas y estados ambiguos', async () => {
  const errors = capture();

  const unknown = await runJevCommand(['predict', '--inventado', 'x'], '/tmp', {
    config: configWithKey(),
    stderr: errors.write
  });
  assert.equal(unknown, 2);
  assert.match(errors.lines[0] ?? '', /Opción desconocida/);

  const ambiguous = await runJevCommand(
    ['predict', '--state', 'x', '--state-json', '{}', '--question', '¿?'],
    '/tmp',
    { config: configWithKey(), stderr: errors.write }
  );
  assert.equal(ambiguous, 2);
  assert.match(errors.lines[1] ?? '', /Usa solo uno/);
});
