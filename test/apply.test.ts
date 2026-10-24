import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadManifest } from '../src/openspec/manifest.js';
import { applyTasks } from '../src/orchestrator/apply.js';
import { makeTempDir, writeFile, writeJson, fakeAider, baseConfig, withPathAsync } from './helpers.js';

function projectManifest(options: {
  contexts?: Array<{ name: string; path: string }>;
  specs?: Array<{ id: string; context: string; tasks: Array<{ id: string; status?: string; files?: string[] }> }>;
} = {}): string {
  const contexts = options.contexts ?? [
    { name: 'billing', path: 'src/billing' },
    { name: 'catalog', path: 'src/catalog' }
  ];
  const specs = options.specs ?? [
    {
      id: 'SPEC-001',
      context: 'billing',
      tasks: [{ id: 'TASK-01' }, { id: 'TASK-02' }]
    }
  ];

  const lines = ['specification: "1.0.0"', 'project: "demo-app"', 'bounded_contexts:'];
  for (const context of contexts) {
    lines.push(`  - name: "${context.name}"`, `    path: "${context.path}"`);
  }
  lines.push('specs:');
  for (const spec of specs) {
    lines.push(
      `  - id: "${spec.id}"`,
      `    title: "Spec ${spec.id}"`,
      '    status: "Proposed"',
      `    context: "${spec.context}"`,
      '    tasks:'
    );
    for (const task of spec.tasks) {
      lines.push(`      - id: "${task.id}"`, `        description: "Tarea ${task.id}"`, `        status: "${task.status ?? 'Pending'}"`);
      if (task.files) {
        lines.push('        files:');
        for (const file of task.files) {
          lines.push(`          - "${file}"`);
        }
      }
    }
  }
  return `${lines.join('\n')}\n`;
}

function setupProject(manifest = projectManifest(), config: Record<string, unknown> = baseConfig()): {
  root: string;
  bin: string;
  log: string;
  cleanup: () => void;
} {
  const temp = makeTempDir();
  const bin = path.join(temp.path, 'bin');
  fs.mkdirSync(bin);
  const log = path.join(temp.path, 'aider.log');
  fakeAider(bin, { log });
  writeFile(path.join(temp.path, 'openspec.yaml'), manifest);
  writeJson(path.join(temp.path, '.alvaressrc.json'), config);
  return { root: temp.path, bin, log, cleanup: temp.cleanup };
}

test('applyTasks ejecuta grupos aislados en paralelo y actualiza estados', async () => {
  const project = setupProject(
    projectManifest({
      specs: [
        { id: 'SPEC-001', context: 'billing', tasks: [{ id: 'TASK-01' }] },
        { id: 'SPEC-002', context: 'catalog', tasks: [{ id: 'TASK-02' }] }
      ]
    })
  );
  try {
    const report = await withPathAsync([project.bin], () => applyTasks({ root: project.root }));

    assert.equal(report.total, 2);
    assert.equal(report.groups, 2);
    assert.equal(report.verified, 2);
    assert.equal(report.failed, 0);
    assert.equal(report.results.length, 2);
    assert.deepEqual(
      report.results.map((result) => result.taskId).toSorted(),
      ['TASK-01', 'TASK-02']
    );

    const manifest = loadManifest(project.root);
    assert.equal(manifest.specs[0]?.tasks[0]?.status, 'Done');
    assert.equal(manifest.specs[1]?.tasks[0]?.status, 'Done');
    assert.equal(manifest.specs[0]?.status, 'Verified');
    assert.equal(manifest.specs[1]?.status, 'Verified');

    const calls = fs.readFileSync(project.log, 'utf-8').trim().split('\n');
    assert.equal(calls.length, 2);
  } finally {
    project.cleanup();
  }
});

test('applyTasks secuencia tareas del mismo contexto', async () => {
  const project = setupProject(
    projectManifest({
      specs: [{ id: 'SPEC-001', context: 'billing', tasks: [{ id: 'TASK-01' }, { id: 'TASK-02' }] }]
    })
  );
  try {
    const report = await withPathAsync([project.bin], () => applyTasks({ root: project.root }));

    assert.equal(report.groups, 1);
    assert.equal(report.verified, 2);
    const calls = fs.readFileSync(project.log, 'utf-8').trim().split('\n');
    assert.equal(calls.length, 2);
    assert.match(calls[0] ?? '', /TASK-01\.md/);
    assert.match(calls[1] ?? '', /TASK-02\.md/);
  } finally {
    project.cleanup();
  }
});

test('applyTasks marca la tarea y el spec como fallidos si Aider falla', async () => {
  const project = setupProject(
    projectManifest({
      specs: [{ id: 'SPEC-001', context: 'billing', tasks: [{ id: 'TASK-01' }] }]
    })
  );
  try {
    fakeAider(project.bin, { log: project.log, exitCode: 1 });
    const report = await withPathAsync([project.bin], () => applyTasks({ root: project.root }));

    assert.equal(report.failed, 1);
    assert.equal(report.verified, 0);
    const manifest = loadManifest(project.root);
    assert.equal(manifest.specs[0]?.tasks[0]?.status, 'Failed');
    assert.equal(manifest.specs[0]?.status, 'Failed');
  } finally {
    project.cleanup();
  }
});

test('applyTasks marca fallo si la validación local no pasa', async () => {
  const project = setupProject(
    projectManifest({
      specs: [{ id: 'SPEC-001', context: 'billing', tasks: [{ id: 'TASK-01' }] }]
    }),
    baseConfig({ validation: { maxAttempts: 1, commands: ['false'] } })
  );
  try {
    const report = await withPathAsync([project.bin], () => applyTasks({ root: project.root }));

    assert.equal(report.failed, 1);
    const manifest = loadManifest(project.root);
    assert.equal(manifest.specs[0]?.tasks[0]?.status, 'Failed');
  } finally {
    project.cleanup();
  }
});

test('applyTasks en dry-run no invoca Aider ni modifica el manifiesto', async () => {
  const project = setupProject(
    projectManifest({
      specs: [{ id: 'SPEC-001', context: 'billing', tasks: [{ id: 'TASK-01' }] }]
    })
  );
  try {
    const before = fs.readFileSync(path.join(project.root, 'openspec.yaml'), 'utf-8');
    const report = await withPathAsync([project.bin], () =>
      applyTasks({ root: project.root, dryRun: true })
    );

    assert.equal(report.total, 1);
    assert.equal(report.skipped, 1);
    assert.equal(report.verified, 0);
    assert.equal(fs.existsSync(project.log), false);
    assert.equal(fs.readFileSync(path.join(project.root, 'openspec.yaml'), 'utf-8'), before);
    assert.equal(fs.existsSync(path.join(project.root, '.harness', 'tasks', 'TASK-01.md')), false);
  } finally {
    project.cleanup();
  }
});

test('applyTasks ejecuta solo los ids indicados', async () => {
  const project = setupProject(
    projectManifest({
      specs: [
        {
          id: 'SPEC-001',
          context: 'billing',
          tasks: [{ id: 'TASK-01' }, { id: 'TASK-02' }]
        }
      ]
    })
  );
  try {
    const report = await withPathAsync([project.bin], () =>
      applyTasks({ root: project.root, taskIds: ['TASK-02'] })
    );

    assert.equal(report.total, 1);
    assert.equal(report.results[0]?.taskId, 'TASK-02');
    const manifest = loadManifest(project.root);
    assert.equal(manifest.specs[0]?.tasks[0]?.status, 'Pending');
    assert.equal(manifest.specs[0]?.tasks[1]?.status, 'Done');
  } finally {
    project.cleanup();
  }
});

test('applyTasks devuelve un reporte vacío sin tareas pendientes', async () => {
  const project = setupProject(
    projectManifest({
      specs: [{ id: 'SPEC-001', context: 'billing', tasks: [{ id: 'TASK-01', status: 'Done' }] }]
    })
  );
  try {
    const report = await applyTasks({ root: project.root });

    assert.deepEqual(report, {
      total: 0,
      groups: 0,
      verified: 0,
      failed: 0,
      skipped: 0,
      results: []
    });
  } finally {
    project.cleanup();
  }
});
