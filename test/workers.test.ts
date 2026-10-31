import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mergeConfig } from '../src/config/loader.js';
import type { ConsultInput, FixInput, WorkPlan } from '../src/core/contracts.js';
import {
  buildConsultMessage,
  buildFixMessage,
  buildWorkMessage,
  capBrief,
  createWorker,
  docsRequested,
  fastCheckCommand,
  subagentSessionId
} from '../src/orchestrator/workers.js';
import { fakeOpencode, makeTempDir, writeFile } from './helpers.js';

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

test('buildFixMessage adjunta el diff cuando lo recibe', () => {
  const input: FixInput = {
    runId: 'run-1',
    attempt: 1,
    files: ['src/helper.ts'],
    failure: { ok: false, commands: [], warnings: [] },
    error: 'falló',
    review: undefined
  };

  const message = buildFixMessage(input, 'diff --git a/src/helper.ts b/src/helper.ts');

  assert.match(message, /Diff actual del alcance/);
  assert.match(message, /diff --git a\/src\/helper\.ts/);
});

test('buildConsultMessage adjunta el diff cuando lo recibe', () => {
  const input: ConsultInput = {
    runId: 'run-1',
    request: 'Agregar un helper',
    mode: 'sdd',
    complexity: 'small',
    source: 'openspec.yaml',
    acceptance: ['El helper funciona'],
    files: ['src/helper.ts'],
    validation: ['pnpm test'],
    briefs: [],
    changes: []
  };

  const message = buildConsultMessage('reviewer', input, 'diff --git a/src/helper.ts b/src/helper.ts');

  assert.match(message, /Diff del árbol de trabajo \(solo lectura\)/);
  assert.match(message, /diff --git a\/src\/helper\.ts/);
});

test('buildWorkMessage incluye el diff del árbol de trabajo', () => {
  const message = buildWorkMessage(plan(), { diff: 'diff --git a/src/helper.ts b/src/helper.ts' });

  assert.match(message, /Diff actual del árbol de trabajo \(solo lectura; intégralo, no lo repitas\)/);
  assert.match(message, /diff --git a\/src\/helper\.ts/);
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

test('buildWorkMessage integra los briefs de especialistas en orden', () => {
  const message = buildWorkMessage({
    ...plan(),
    briefs: [
      { role: 'architect', summary: 'separa el parseo de la escritura' },
      { role: 'tester', summary: 'cubre el caso de configuración vacía' }
    ]
  });

  assert.match(message, /Briefs de especialistas/);
  assert.match(message, /### architect\nsepara el parseo/);
  assert.match(message, /### tester\ncubre el caso/);
});

test('buildFixMessage incluye la revisión del reviewer', () => {
  const input: FixInput = {
    runId: 'run-1',
    attempt: 1,
    files: ['src/helper.ts'],
    failure: {
      ok: false,
      commands: [{ command: 'pnpm test', code: 1, stderr: 'falló' }],
      warnings: []
    },
    error: 'falló',
    review: 'blocker en src/helper.ts: falta validar el borde'
  };

  const message = buildFixMessage(input);

  assert.match(message, /Revisión del diff \(prioriza los blockers\)/);
  assert.match(message, /falta validar el borde/);
});

test('buildConsultMessage encadena el brief del especialista anterior', () => {
  const input: ConsultInput = {
    runId: 'run-1',
    request: 'rediseña la pantalla de facturación',
    mode: 'sdd',
    complexity: 'medium',
    source: 'openspec.yaml',
    acceptance: ['la pantalla lista facturas'],
    files: ['src/ui/invoice.tsx'],
    validation: ['pnpm test'],
    briefs: [{ role: 'researcher', summary: 'usa el patrón de tabla existente' }],
    changes: [],
    focus: 'define estados vacíos'
  };

  const message = buildConsultMessage('designer', input);

  assert.match(message, /Consultoría designer/);
  assert.match(message, /Briefs anteriores/);
  assert.match(message, /patrón de tabla existente/);
  assert.match(message, /define estados vacíos/);
  assert.match(message, /No edites archivos/);
});

test('SubagentWorker.consult invoca al especialista y devuelve su brief', async () => {
  const temp = makeTempDir('alvaress-consult-');
  try {
    const bin = path.join(temp.path, 'bin');
    fs.mkdirSync(bin);
    const log = path.join(temp.path, 'opencode.log');
    fakeOpencode(bin, { log, action: "echo 'brief del researcher'" });

    const worker = createWorker({
      root: temp.path,
      config: mergeConfig({}, {}),
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });
    const brief = await worker.consult?.('researcher', {
      runId: 'run-1',
      request: 'elige una versión compatible',
      mode: 'odd',
      complexity: 'small',
      source: 'nota odd',
      acceptance: ['la versión existe'],
      files: ['package.json'],
      validation: ['pnpm test'],
      briefs: [],
      changes: []
    });

    assert.equal(brief?.role, 'researcher');
    assert.equal(brief?.summary, 'brief del researcher');
    const call = fs.readFileSync(log, 'utf-8');
    assert.match(call, /--agent alvaress-researcher/);
    assert.match(call, /--format json/);
  } finally {
    temp.cleanup();
  }
});

test('buildWorkMessage usa el stat del árbol de trabajo en lugar del diff', () => {
  const message = buildWorkMessage(plan(), { stat: ' src/helper.ts | 2 +-' });

  assert.match(message, /git diff --stat/);
  assert.match(message, /src\/helper\.ts \| 2 \+-/);
  assert.doesNotMatch(message, /```diff/);
});

test('buildWorkMessage permite un autochequeo único cuando se indica', () => {
  const message = buildWorkMessage(plan(), { selfCheck: 'pnpm tsc --noEmit' });

  assert.match(message, /Autochequeo permitido/);
  assert.match(message, /`pnpm tsc --noEmit`/);
  assert.doesNotMatch(message, /No ejecutes la validación ni comandos de test/);
});

test('fastCheckCommand elige solo comandos rápidos de tipos o lint', () => {
  assert.equal(fastCheckCommand(['pnpm test', 'pnpm tsc --noEmit']), 'pnpm tsc --noEmit');
  assert.equal(fastCheckCommand(['vp check', 'vp test']), 'vp check');
  assert.equal(fastCheckCommand(['pnpm test']), undefined);
});

test('capBrief recorta briefs largos y avisa del recorte', () => {
  assert.equal(capBrief('  corto  ', 10), 'corto');
  const capped = capBrief('x'.repeat(50), 10);
  assert.match(capped, /^x{10}\n\[brief recortado: 40 caracteres\]$/);
});

test('SubagentWorker ofrece el autochequeo solo al implementer completo', async () => {
  const temp = makeTempDir('alvaress-self-check-');
  try {
    const bin = path.join(temp.path, 'bin');
    const log = path.join(temp.path, 'opencode.log');
    fakeOpencode(bin, { log });
    const base = mergeConfig({}, {});
    const worker = createWorker({
      root: temp.path,
      config: { ...base, worker: { ...base.worker, selfCheck: true } },
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });
    const checked: WorkPlan = { ...plan(), validation: ['pnpm tsc --noEmit', 'pnpm test'] };

    await worker.work({ ...checked, complexity: 'medium' });
    await worker.work({ ...checked, complexity: 'small' });

    const [full, lite] = fs.readFileSync(log, 'utf-8').trim().split('\n');
    assert.match(full ?? '', /--agent alvaress-implementer .*Autochequeo permitido/);
    assert.match(lite ?? '', /--agent alvaress-implementer-lite /);
    assert.doesNotMatch(lite ?? '', /Autochequeo permitido/);
  } finally {
    temp.cleanup();
  }
});

test('docsRequested detecta tareas que piden documentar y relaja la regla del prompt', () => {
  const documented = { ...plan(), request: 'Documenta el helper con JSDoc' };

  assert.equal(docsRequested(documented), true);
  assert.equal(docsRequested(plan()), false);
  assert.match(buildWorkMessage(documented), /Agrega JSDoc\/docstrings solo donde la petición lo pide/);
  assert.match(buildWorkMessage(plan()), /JSDoc de relleno/);
});

test('SubagentWorker separa la sesión de cada especialista y suma tokens por fase', async () => {
  const temp = makeTempDir('alvaress-usage-');
  try {
    const bin = path.join(temp.path, 'bin');
    const log = path.join(temp.path, 'opencode.log');
    const events = [
      '{"type":"text","sessionID":"s","part":{"text":"brief en json"}}',
      '{"type":"step_finish","sessionID":"s","part":{"cost":0.01,"tokens":{"input":100,"output":20,"reasoning":0,"cache":{"read":40,"write":0}}}}'
    ];
    fakeOpencode(bin, { log, action: `printf '%s\\n' '${events[0]}' '${events[1]}'` });
    const worker = createWorker({
      root: temp.path,
      config: mergeConfig({}, {}),
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });
    const input: ConsultInput = {
      runId: 'run-1',
      request: 'revisa',
      mode: 'odd',
      complexity: 'medium',
      source: 'nota',
      acceptance: [],
      files: ['src/helper.ts'],
      validation: [],
      briefs: [],
      changes: []
    };

    const brief = await worker.consult?.('architect', input);
    await worker.consult?.('reviewer', input);
    await worker.work({ ...plan(), runId: 'run-1' });

    assert.equal(brief?.summary, 'brief en json');
    const sessions = fs
      .readFileSync(log, 'utf-8')
      .trim()
      .split('\n')
      .map((line) => /--session (\S+)/.exec(line)?.[1]);
    assert.deepEqual(sessions, [
      subagentSessionId('run-1', 'architect'),
      subagentSessionId('run-1', 'reviewer'),
      subagentSessionId('run-1')
    ]);
    const usage = worker.usage?.();
    assert.equal(usage?.phases.especialistas?.input, 100);
    assert.equal(usage?.phases['revisión']?.calls, 1);
    assert.equal(usage?.phases['implementación']?.output, 20);
    assert.equal(usage?.total.input, 300);
    assert.equal(usage?.total.cacheRead, 120);
  } finally {
    temp.cleanup();
  }
});

test('SubagentWorker reporta el error del proveedor en vez del JSON crudo', async () => {
  const temp = makeTempDir('alvaress-provider-error-');
  try {
    const bin = path.join(temp.path, 'bin');
    const event = '{"type":"error","sessionID":"s","error":{"message":"Free usage limit reached."}}';
    fakeOpencode(bin, { action: `printf '%s\\n' '${event}'`, exitCode: 1 });
    const worker = createWorker({
      root: temp.path,
      config: mergeConfig({}, {}),
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });

    const result = await worker.work(plan());

    assert.equal(result.status, 'failed');
    assert.match(result.detail ?? '', /falló: Free usage limit reached\.$/);
  } finally {
    temp.cleanup();
  }
});
