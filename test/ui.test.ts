import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RGB, createPalette, colorEnabled, stripAnsi } from '../src/ui/colors.js';
import { StatusLine } from '../src/ui/status-line.js';
import {
  dedupeTasks,
  printFinalReport,
  renderFinalReport,
  selectChanges
} from '../src/ui/final-report.js';
import type { FileChange, Risk } from '../src/core/contracts.js';

function captureStream(isTTY = false): {
  stream: NodeJS.WriteStream;
  output: () => string;
} {
  const chunks: string[] = [];
  const stream = {
    isTTY,
    write(chunk: string): boolean {
      chunks.push(chunk);
      return true;
    }
  } as unknown as NodeJS.WriteStream;

  return { stream, output: () => chunks.join('') };
}

const off = createPalette(false);
const on = createPalette(true);

function files(count: number): FileChange[] {
  return Array.from({ length: count }, (_, index) => ({
    path: `src/file-${index + 1}.ts`,
    change: `cambio ${index + 1}`
  }));
}

function risks(): Risk[] {
  return [
    { title: 'La nota ODD quedó desactualizada', source: 'harness' },
    { title: 'quedan imports sin usar', source: 'linter', severity: 'low' }
  ];
}

test('la paleta usa TrueColor de 24 bits con los valores exactos', () => {
  assert.deepEqual(RGB.accent, { r: 68, g: 94, b: 161 });
  assert.deepEqual(RGB.text, { r: 200, g: 200, b: 200 });
  assert.deepEqual(RGB.border, { r: 26, g: 41, b: 70 });
  assert.deepEqual(RGB.surface, { r: 31, g: 35, b: 46 });
  assert.deepEqual(RGB.warning, { r: 209, g: 154, b: 102 });

  assert.equal(on.accent('x'), '\x1b[38;2;68;94;161mx\x1b[0m');
  assert.equal(on.text('x'), '\x1b[38;2;200;200;200mx\x1b[0m');
  assert.equal(on.border('x'), '\x1b[38;2;26;41;70mx\x1b[0m');
  assert.equal(on.warning('x'), '\x1b[38;2;209;154;102mx\x1b[0m');
  assert.equal(
    on.surface('x'),
    '\x1b[48;2;31;35;46m\x1b[38;2;200;200;200mx\x1b[0m'
  );
});

test('cada helper de color termina con el reset de la terminal', () => {
  for (const helper of [on.accent, on.text, on.border, on.warning, on.surface, on.bold, on.dim]) {
    assert.ok(helper('valor').endsWith('\x1b[0m'));
  }
});

test('la paleta deshabilitada no emite secuencias ANSI', () => {
  assert.equal(off.enabled, false);
  assert.equal(off.accent('x'), 'x');
  assert.equal(off.surface('x'), 'x');
  assert.equal(off.bold('x'), 'x');
});

test('stripAnsi elimina los códigos de color', () => {
  assert.equal(stripAnsi(on.accent('hola')), 'hola');
  assert.equal(stripAnsi(on.surface('riesgo')), 'riesgo');
});

test('colorEnabled respeta NO_COLOR, FORCE_COLOR y TTY', () => {
  assert.equal(colorEnabled({ isTTY: true }, {}), true);
  assert.equal(colorEnabled({ isTTY: false }, {}), false);
  assert.equal(colorEnabled({ isTTY: true }, { NO_COLOR: '1' }), false);
  assert.equal(colorEnabled({ isTTY: false }, { FORCE_COLOR: '1' }), true);
  assert.equal(colorEnabled({ isTTY: true }, { FORCE_COLOR: '0' }), false);
});

test('StatusLine pinta el estado con acento y un punto inicial', () => {
  const { stream, output } = captureStream(false);
  const line = new StatusLine({ stream, palette: on, animated: false });

  line.start('Exploring');
  assert.equal(output(), '\x1b[38;2;200;200;200m[alvaress]\x1b[0m \x1b[38;2;68;94;161mEXPLORING.\x1b[0m\n');
});

test('StatusLine anima los tres puntos como loader', () => {
  const { stream, output } = captureStream(false);
  const line = new StatusLine({ stream, palette: off, animated: false });

  line.start('Exploring');
  line.tick();
  line.tick();
  line.tick();

  assert.deepEqual(output().trimEnd().split('\n'), [
    '[alvaress] EXPLORING.',
    '[alvaress] EXPLORING..',
    '[alvaress] EXPLORING...',
    '[alvaress] EXPLORING.'
  ]);
});

test('StatusLine reinicia el loader al cambiar de estado', () => {
  const { stream, output } = captureStream(false);
  const line = new StatusLine({ stream, palette: off, animated: false });

  line.start('Exploring');
  line.tick();
  line.tick();
  line.setState('Working');

  const lines = output().trimEnd().split('\n');
  assert.equal(lines.at(-1), '[alvaress] WORKING.');
});

test('StatusLine usa warning para HALTED y conserva READY en acento', () => {
  const { stream, output } = captureStream(false);
  const line = new StatusLine({ stream, palette: on, animated: false });

  line.start('Exploring');
  line.setState('Halted');
  line.setState('Ready');

  const rendered = output();
  assert.ok(rendered.includes('\x1b[38;2;209;154;102mHALTED.\x1b[0m'));
  assert.ok(rendered.includes('\x1b[38;2;68;94;161mREADY.\x1b[0m'));
});

test('StatusLine en modo animado reescribe una sola fila y limpia al detenerse', () => {
  const { stream, output } = captureStream(true);
  const line = new StatusLine({ stream, palette: off, animated: true });

  line.start('Working');
  line.stop();

  const rendered = output();
  assert.ok(rendered.includes('\r\x1b[2K[alvaress] WORKING.'));
  assert.ok(rendered.endsWith('\r\x1b[2K'));
  assert.equal(rendered.includes('\n'), false);
});

test('selectChanges lista archivos cuando son menos de cinco', () => {
  const selection = selectChanges(files(4), [
    { title: 'tarea irrelevante', description: 'no debe usarse' }
  ]);

  assert.equal(selection.source, 'files');
  assert.equal(selection.omitted, 0);
  assert.equal(selection.items.length, 4);
  assert.equal(selection.items[0]?.label, 'src/file-1.ts -> cambio 1');
});

test('selectChanges usa tareas no redundantes cuando hay cinco archivos o más', () => {
  const selection = selectChanges(files(6), [
    { title: 'extrae el motor', description: 'separa la decisión del bucle' },
    { title: 'extrae el motor', description: 'separa la decisión del bucle' },
    { title: 'agrega el loader', description: 'muestra estados en una fila' },
    { title: 'agrega el loader', description: 'muestra estados en una fila' }
  ]);

  assert.equal(selection.source, 'tasks');
  assert.deepEqual(
    selection.items.map((item) => item.label),
    [
      'extrae el motor -> separa la decisión del bucle',
      'agrega el loader -> muestra estados en una fila'
    ]
  );
  assert.equal(selection.omitted, 0);
});

test('selectChanges muestra solo las tareas destacadas cuando hay más de cinco', () => {
  const tasks = [
    { title: 't1', description: 'd1' },
    { title: 't2', description: 'd2' },
    { title: 't3', description: 'd3' },
    { title: 't4', description: 'd4' },
    { title: 't5', description: 'd5' },
    { title: 't6', description: 'd6', highlight: true },
    { title: 't7', description: 'd7', highlight: true }
  ];
  const selection = selectChanges(files(6), tasks);

  assert.equal(selection.source, 'tasks');
  assert.deepEqual(
    selection.items.map((item) => item.label),
    ['t6 -> d6', 't7 -> d7']
  );
  assert.equal(selection.omitted, 5);
});

test('selectChanges limita a cinco tareas cuando no hay destacadas', () => {
  const tasks = Array.from({ length: 7 }, (_, index) => ({
    title: `t${index + 1}`,
    description: `d${index + 1}`
  }));
  const selection = selectChanges(files(6), tasks);

  assert.equal(selection.items.length, 5);
  assert.equal(selection.omitted, 2);
});

test('selectChanges cae a archivos si no hay tareas', () => {
  const selection = selectChanges(files(7));

  assert.equal(selection.source, 'files');
  assert.equal(selection.items.length, 5);
  assert.equal(selection.omitted, 2);
});

test('dedupeTasks elimina títulos y descripciones repetidas', () => {
  const result = dedupeTasks([
    { title: 'A', description: 'misma' },
    { title: 'B', description: 'misma' },
    { title: 'A', description: 'otra' },
    { title: '  ', description: 'vacía' },
    { title: 'C', description: 'única' }
  ]);

  assert.deepEqual(
    result.map((task) => task.title),
    ['A', 'C']
  );
});

test('renderFinalReport pinta READY, cambios y riesgos con la paleta', () => {
  const report = renderFinalReport({
    state: 'Ready',
    changes: files(2),
    risks: risks(),
    palette: on,
    logPath: '.laya/last_run.log'
  });

  assert.ok(report.includes('\x1b[38;2;68;94;161m[alvaress] READY\x1b[0m'));
  assert.ok(report.includes('Cambios Realizados:'));
  assert.ok(report.includes('\x1b[38;2;68;94;161m  •\x1b[0m'));
  assert.ok(report.includes('\x1b[48;2;31;35;46m\x1b[38;2;200;200;200mRiesgos Detectados:\x1b[0m'));
  assert.ok(report.includes('\x1b[38;2;209;154;102m  •\x1b[0m'));
  assert.ok(report.includes('\x1b[38;2;209;154;102mLa nota ODD quedó desactualizada\x1b[0m'));
  assert.ok(report.includes('\x1b[38;2;26;41;70m'));
  assert.ok(report.includes('alvaress -i'));
  assert.ok(report.includes('.laya/last_run.log'));
});

test('renderFinalReport avisa cuando no hay riesgos', () => {
  const report = renderFinalReport({
    state: 'Ready',
    changes: files(1),
    risks: [],
    palette: off
  });

  assert.ok(report.includes('Sin riesgos detectados.'));
});

test('renderFinalReport pinta HALTED con motivo y detalle en warning', () => {
  const report = renderFinalReport({
    state: 'Halted',
    changes: [],
    risks: risks(),
    palette: on,
    halt: { message: 'La validación falló.', detail: 'vp check devuelve código 1' }
  });

  assert.ok(report.includes('\x1b[38;2;209;154;102m[alvaress] HALTED\x1b[0m'));
  assert.ok(report.includes('Motivo:'));
  assert.ok(report.includes('La validación falló.'));
  assert.ok(report.includes('vp check devuelve código 1'));
  assert.ok(report.includes('Sin cambios registrados.'));
});

test('renderFinalReport muestra validación, commit y omisiones', () => {
  const report = renderFinalReport({
    state: 'Ready',
    changes: files(7),
    tasks: [
      { title: 't1', description: 'd1' },
      { title: 't2', description: 'd2' },
      { title: 't3', description: 'd3' },
      { title: 't4', description: 'd4' },
      { title: 't5', description: 'd5' },
      { title: 't6', description: 'd6' }
    ],
    risks: [],
    palette: off,
    validation: {
      ok: true,
      commands: [
        { command: 'vp check', code: 0 },
        { command: 'vp test', code: 0 }
      ],
      warnings: []
    },
    commit: { committed: true, sha: 'abc1234', files: ['src/file-1.ts'] }
  });

  assert.ok(report.includes('Validación:'));
  assert.ok(report.includes('vp check -> OK'));
  assert.ok(report.includes('vp test -> OK'));
  assert.ok(report.includes('Commit: abc1234'));
  assert.ok(report.includes('1 archivo(s)'));
  assert.ok(report.includes('… 1 tarea(s) más (ver log)'));
});

test('printFinalReport escribe en el stream sin limpiar cuando se pide', () => {
  const { stream, output } = captureStream(true);
  printFinalReport(
    { state: 'Ready', changes: files(1), risks: [], palette: off },
    { stream, clear: false }
  );

  assert.ok(output().includes('[alvaress] READY'));
  assert.ok(output().endsWith('\n'));
});
