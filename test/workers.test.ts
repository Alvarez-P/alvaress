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
  createWorker
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
    assert.doesNotMatch(call, /--format json/);
  } finally {
    temp.cleanup();
  }
});
