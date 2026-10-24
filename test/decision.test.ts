import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDecideCommand } from '../src/commands/decide.js';
import { mergeConfig } from '../src/config/loader.js';
import type { HarnessConfig } from '../src/config/loader.js';
import type { FetchLike } from '../src/decision/client.js';
import { makeTempDir } from './helpers.js';

function configWithModel(model = 'kev'): HarnessConfig {
  return mergeConfig(
    {
      decision: {
        model,
        apiBase: 'http://127.0.0.1:11434'
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

test('decide predict envía una pregunta noul y aplica el threshold', async () => {
  const { fetchImpl, calls } = fakeFetch({
    model: 'kev',
    answers: { decision: { type: 'noul', noul: 0.91 } }
  });
  const output = capture();

  const code = await runDecideCommand(
    ['predict', '--state', 'Cambio pequeño en un archivo', '--question', '¿Puedo aplicarlo?', '--threshold', '0.8'],
    '/tmp',
    { config: configWithModel(), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 0);
  assert.equal(calls[0]?.url, 'http://127.0.0.1:11434/v1/systemone');
  const headers = calls[0]?.init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, undefined);
  const body = JSON.parse(String(calls[0]?.init?.body)) as {
    model: string;
    state: string;
    questions: { decision: { type: string; instructions: string } };
  };
  assert.equal(body.model, 'kev');
  assert.equal(body.state, 'Cambio pequeño en un archivo');
  assert.equal(body.questions.decision.type, 'noul');
  const result = JSON.parse(output.lines[0] ?? '{}') as { probability: number; pass: boolean };
  assert.equal(result.probability, 0.91);
  assert.equal(result.pass, true);
});

test('decide predict devuelve exit code 1 cuando no alcanza el threshold', async () => {
  const { fetchImpl } = fakeFetch({
    model: 'kev',
    answers: { decision: { type: 'noul', noul: 0.42 } }
  });
  const output = capture();

  const code = await runDecideCommand(
    ['predict', '--state', 'x', '--question', '¿?', '--threshold', '0.8'],
    '/tmp',
    { config: configWithModel(), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 1);
  const result = JSON.parse(output.lines[0] ?? '{}') as { pass: boolean };
  assert.equal(result.pass, false);
});

test('decide choose devuelve la opción y respeta min-confidence', async () => {
  const { fetchImpl, calls } = fakeFetch({
    model: 'laya',
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

  const code = await runDecideCommand(
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
    { config: configWithModel('laya'), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 0);
  const body = JSON.parse(String(calls[0]?.init?.body)) as {
    model: string;
    questions: { decision: { criteria: Record<string, string> } };
  };
  assert.equal(body.model, 'laya');
  assert.deepEqual(body.questions.decision.criteria, {
    spec: 'Crear especificación',
    apply: 'Ejecutar con Aider'
  });
  const result = JSON.parse(output.lines[0] ?? '{}') as { choice: string; pass: boolean };
  assert.equal(result.choice, 'apply');
  assert.equal(result.pass, true);
});

test('decide score devuelve score, leyenda y probabilidades', async () => {
  const { fetchImpl } = fakeFetch({
    model: 'kev',
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

  const code = await runDecideCommand(
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
    { config: configWithModel(), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 0);
  const result = JSON.parse(output.lines[0] ?? '{}') as {
    score: number;
    legend: Record<string, string>;
  };
  assert.equal(result.score, 0.67);
  assert.equal(result.legend['1'], 'media');
});

test('decide ask reenvía una petición completa', async () => {
  const { fetchImpl, calls } = fakeFetch({
    model: 'kev',
    answers: { q: { type: 'noul', noul: 0.5 } }
  });
  const output = capture();
  const request = JSON.stringify({
    state: { tarea: 'x' },
    questions: { q: { type: 'noul', instructions: '¿Es válido?' } }
  });

  const code = await runDecideCommand(['ask', '--request', request], '/tmp', {
    config: configWithModel(),
    fetchImpl,
    stdout: output.write
  });

  assert.equal(code, 0);
  const body = JSON.parse(String(calls[0]?.init?.body)) as { state: unknown };
  assert.deepEqual(body.state, { tarea: 'x' });
  const response = JSON.parse(output.lines[0] ?? '{}') as { answers: { q: { noul: number } } };
  assert.equal(response.answers.q.noul, 0.5);
});

test('decide sin subcomando ejecuta la decisión compuesta', async () => {
  const { fetchImpl, calls } = fakeFetch({
    model: 'kev',
    answers: {
      clarity: { type: 'noul', noul: 0.9 },
      path: { type: 'choice', choice: 'apply', confidence: 0.8, probabilities: { apply: 0.8 } },
      complexity: {
        type: 'score',
        score: 1,
        confidence: 0.7,
        legend: { '0': 'trivial', '1': 'media' },
        probabilities: { '0': 0.2, '1': 0.8 }
      }
    }
  });
  const output = capture();
  const temp = makeTempDir('alvaress-decide-composite-');

  try {
    const code = await runDecideCommand(['--state', 'cambio', '--gate'], temp.path, {
      config: configWithModel(),
      fetchImpl,
      stdout: output.write
    });

    assert.equal(code, 0);
    const body = JSON.parse(String(calls[0]?.init?.body)) as {
      questions: Record<string, { type: string }>;
    };
    assert.deepEqual(Object.keys(body.questions).toSorted(), ['clarity', 'complexity', 'path']);
    const result = JSON.parse(output.lines[0] ?? '{}') as { path: { choice: string } };
    assert.equal(result.path.choice, 'apply');
  } finally {
    temp.cleanup();
  }
});

test('decide --model sobrescribe el modelo configurado', async () => {
  const { fetchImpl, calls } = fakeFetch({
    model: 'laya',
    answers: { decision: { type: 'noul', noul: 0.9 } }
  });
  const output = capture();

  const code = await runDecideCommand(
    ['predict', '--state', 'x', '--question', '¿?', '--model', 'laya'],
    '/tmp',
    { config: configWithModel('kev'), fetchImpl, stdout: output.write }
  );

  assert.equal(code, 0);
  const body = JSON.parse(String(calls[0]?.init?.body)) as { model: string };
  assert.equal(body.model, 'laya');
});

test('decide rechaza un modelo no soportado', async () => {
  const errors = capture();
  const code = await runDecideCommand(
    ['predict', '--state', 'x', '--question', '¿?', '--model', 'gpt-4'],
    '/tmp',
    { config: configWithModel(), stderr: errors.write }
  );

  assert.equal(code, 2);
  assert.match(errors.lines[0] ?? '', /kev|laya/);
});

const failingFetch: FetchLike = async () => new Response('boom', { status: 500 });

test('decide devuelve exit code 2 ante un error HTTP', async () => {
  const errors = capture();

  const code = await runDecideCommand(
    ['predict', '--state', 'x', '--question', '¿?'],
    '/tmp',
    { config: configWithModel(), fetchImpl: failingFetch, stderr: errors.write }
  );

  assert.equal(code, 2);
  assert.match(errors.lines[0] ?? '', /HTTP 500/);
});

test('decide rechaza opciones desconocidas y estados ambiguos', async () => {
  const errors = capture();

  const unknown = await runDecideCommand(['predict', '--inventado', 'x'], '/tmp', {
    config: configWithModel(),
    stderr: errors.write
  });
  assert.equal(unknown, 2);
  assert.match(errors.lines[0] ?? '', /Opción desconocida/);

  const ambiguous = await runDecideCommand(
    ['predict', '--state', 'x', '--state-json', '{}', '--question', '¿?'],
    '/tmp',
    { config: configWithModel(), stderr: errors.write }
  );
  assert.equal(ambiguous, 2);
  assert.match(errors.lines[1] ?? '', /Usa solo uno/);
});
