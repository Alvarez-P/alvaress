import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildTaskDocument,
  collectWorkItems,
  createScaffoldManifest,
  ensureTaskFile,
  findWorkItem,
  inferBoundedContexts,
  inferProjectName,
  loadManifest,
  parseManifest,
  refreshSpecStatus,
  saveManifest,
  scaffoldManifest,
  serializeManifest,
  setTaskStatus
} from '../src/openspec/manifest.js';
import type { OpenSpecManifest } from '../src/openspec/types.js';
import { ManifestError } from '../src/utils/errors.js';
import { makeTempDir, writeFile, writeJson } from './helpers.js';

const VALID_MANIFEST = `specification: "1.0.0"
project: "demo-app"
bounded_contexts:
  - name: "billing"
    path: "src/billing"
  - name: "catalog"
    path: "src/catalog"
specs:
  - id: "SPEC-001"
    title: "Crear endpoint de facturación"
    status: "Proposed"
    context: "billing"
    tasks:
      - id: "TASK-01"
        description: "Crear el repositorio de facturas"
        status: "Pending"
        files:
          - "src/billing/invoice.repository.ts"
      - id: "TASK-02"
        description: "Crear el caso de uso"
        status: "Done"
  - id: "SPEC-002"
    title: "Catálogo"
    status: "Archived"
    context: "catalog"
    tasks:
      - id: "TASK-03"
        description: "Tarea archivada"
        status: "Pending"
`;

function manifestWith(status: string, taskStatus = 'Pending'): string {
  return `specification: "1.0.0"
project: "demo"
specs:
  - id: "SPEC-001"
    title: "Spec"
    status: "${status}"
    context: "core"
    tasks:
      - id: "TASK-01"
        description: "Tarea"
        status: "${taskStatus}"
`;
}

test('parseManifest lee el esquema OpenSpec completo', () => {
  const manifest = parseManifest(VALID_MANIFEST);

  assert.equal(manifest.specification, '1.0.0');
  assert.equal(manifest.project, 'demo-app');
  assert.equal(manifest.bounded_contexts?.length, 2);
  assert.equal(manifest.specs.length, 2);
  assert.equal(manifest.specs[0]?.tasks[0]?.files?.[0], 'src/billing/invoice.repository.ts');
});

test('parseManifest rechaza YAML inválido y campos obligatorios', () => {
  assert.throws(() => parseManifest('specs: ['), ManifestError);
  assert.throws(() => parseManifest('- item'), ManifestError);
  assert.throws(() => parseManifest('project: demo\nspecs: []'), ManifestError);
  assert.throws(() => parseManifest('specification: "1.0.0"\nspecs: []'), ManifestError);
  assert.throws(() => parseManifest('specification: "1.0.0"\nproject: demo'), ManifestError);
  assert.throws(
    () => parseManifest('specification: "1.0.0"\nproject: demo\nbounded_contexts: {}'),
    ManifestError
  );
});

test('parseManifest valida bounded contexts', () => {
  assert.throws(
    () =>
      parseManifest(`specification: "1.0.0"
project: demo
bounded_contexts:
  - name: ""
    path: "src"
specs: []
`),
    ManifestError
  );
  assert.throws(
    () =>
      parseManifest(`specification: "1.0.0"
project: demo
bounded_contexts:
  - name: "core"
specs: []
`),
    ManifestError
  );
});

test('parseManifest valida estados de spec y tarea', () => {
  assert.throws(() => parseManifest(manifestWith('Unknown')), ManifestError);
  assert.throws(() => parseManifest(manifestWith('Proposed', 'Unknown')), ManifestError);
  assert.throws(
    () => parseManifest(manifestWith('Proposed').replace('status: "Pending"\n', '')),
    ManifestError
  );
});

test('parseManifest valida título, ids, duplicados y archivos', () => {
  const missingTitle = manifestWith('Proposed').replace('    title: "Spec"\n', '');
  assert.throws(() => parseManifest(missingTitle), ManifestError);

  const invalidId = manifestWith('Proposed').replace('SPEC-001', 'SPEC 001');
  assert.throws(() => parseManifest(invalidId), ManifestError);

  const duplicate = `${manifestWith('Proposed')}      - id: "TASK-01"
      description: "Duplicada"
      status: "Pending"
`;
  assert.throws(() => parseManifest(duplicate), ManifestError);

  const invalidFiles = manifestWith('Proposed').replace(
    '        status: "Pending"\n',
    '        status: "Pending"\n        files: "src/file.ts"\n'
  );
  assert.throws(() => parseManifest(invalidFiles), ManifestError);
});

test('loadManifest, saveManifest y serializeManifest conservan la estructura', () => {
  const temp = makeTempDir();
  try {
    writeFile(path.join(temp.path, 'openspec.yaml'), VALID_MANIFEST);
    const manifest = loadManifest(temp.path);

    setTaskStatus(manifest, 'TASK-01', 'Done');
    saveManifest(manifest, temp.path);

    const reloaded = loadManifest(temp.path);
    assert.equal(reloaded.specs[0]?.tasks[0]?.status, 'Done');
    assert.match(serializeManifest(reloaded), /specification: 1\.0\.0/);
  } finally {
    temp.cleanup();
  }
});

test('loadManifest falla si no existe openspec.yaml', () => {
  const temp = makeTempDir();
  try {
    assert.throws(() => loadManifest(temp.path), ManifestError);
  } finally {
    temp.cleanup();
  }
});

test('collectWorkItems omite archivados y solo toma pendientes', () => {
  const manifest = parseManifest(VALID_MANIFEST);
  const items = collectWorkItems(manifest);

  assert.equal(items.length, 1);
  assert.equal(items[0]?.task.id, 'TASK-01');
});

test('collectWorkItems acepta ids explícitos', () => {
  const manifest = parseManifest(VALID_MANIFEST);
  const items = collectWorkItems(manifest, ['TASK-02', 'TASK-03']);

  assert.deepEqual(
    items.map((item) => item.task.id),
    ['TASK-02', 'TASK-03']
  );
  assert.throws(() => collectWorkItems(manifest, ['TASK-99']), ManifestError);
});

test('findWorkItem localiza la tarea y falla si no existe', () => {
  const manifest = parseManifest(VALID_MANIFEST);
  assert.equal(findWorkItem(manifest, 'TASK-02').spec.id, 'SPEC-001');
  assert.throws(() => findWorkItem(manifest, 'TASK-99'), ManifestError);
});

test('refreshSpecStatus calcula Proposed, Verified y Failed', () => {
  const manifest = parseManifest(VALID_MANIFEST);
  const spec = manifest.specs[0]!;

  setTaskStatus(manifest, 'TASK-01', 'Pending');
  setTaskStatus(manifest, 'TASK-02', 'Done');
  refreshSpecStatus(spec);
  assert.equal(spec.status, 'Proposed');

  setTaskStatus(manifest, 'TASK-01', 'Done');
  refreshSpecStatus(spec);
  assert.equal(spec.status, 'Verified');

  setTaskStatus(manifest, 'TASK-01', 'Failed');
  refreshSpecStatus(spec);
  assert.equal(spec.status, 'Failed');

  spec.status = 'Archived';
  refreshSpecStatus(spec);
  assert.equal(spec.status, 'Archived');
});

test('buildTaskDocument incluye descripción, archivos y criterios', () => {
  const manifest = parseManifest(VALID_MANIFEST);
  const spec = manifest.specs[0]!;
  const task = spec.tasks[0]!;
  const document = buildTaskDocument(spec, task, 'src/billing');

  assert.match(document, /# Crear endpoint de facturación/);
  assert.match(document, /- Task: TASK-01/);
  assert.match(document, /- Bounded context path: src\/billing/);
  assert.match(document, /Crear el repositorio de facturas/);
  assert.match(document, /src\/billing\/invoice\.repository\.ts/);
  assert.match(document, /- \[ \] La validación local finaliza con código de salida 0\./);
});

test('buildTaskDocument usa la aceptación personalizada', () => {
  const manifest = parseManifest(VALID_MANIFEST);
  const spec = manifest.specs[0]!;
  const task = { ...spec.tasks[0]!, acceptance: ['Criterio propio'] };
  const document = buildTaskDocument(spec, task);

  assert.match(document, /- \[ \] Criterio propio/);
  assert.match(document, /Bounded context path: \(no definido\)/);
});

test('ensureTaskFile escribe la tarea en .harness/tasks', () => {
  const temp = makeTempDir();
  try {
    const manifest = parseManifest(VALID_MANIFEST);
    const spec = manifest.specs[0]!;
    const target = ensureTaskFile(spec, spec.tasks[0]!, 'src/billing', temp.path);

    assert.equal(target, path.join(temp.path, '.harness', 'tasks', 'TASK-01.md'));
    assert.ok(fs.existsSync(target));
    assert.match(fs.readFileSync(target, 'utf-8'), /TASK-01/);
  } finally {
    temp.cleanup();
  }
});

test('scaffoldManifest no sobrescribe un manifiesto existente', () => {
  const temp = makeTempDir();
  try {
    writeJson(path.join(temp.path, 'package.json'), { name: 'project-name' });
    assert.equal(scaffoldManifest(temp.path), true);

    const target = path.join(temp.path, 'openspec.yaml');
    const original = fs.readFileSync(target, 'utf-8');
    writeFile(target, `${original}\n`);
    assert.equal(scaffoldManifest(temp.path), false);
    assert.equal(fs.readFileSync(target, 'utf-8'), `${original}\n`);
  } finally {
    temp.cleanup();
  }
});

test('inferProjectName e inferBoundedContexts detectan el proyecto', () => {
  const temp = makeTempDir();
  try {
    writeJson(path.join(temp.path, 'package.json'), { name: 'demo-app' });
    assert.equal(inferProjectName(temp.path), 'demo-app');
    assert.deepEqual(inferBoundedContexts(temp.path), []);

    fs.mkdirSync(path.join(temp.path, 'src'));
    assert.deepEqual(inferBoundedContexts(temp.path), [{ name: 'core', path: 'src' }]);

    writeFile(path.join(temp.path, 'package.json'), '{ invalid');
    assert.equal(inferProjectName(temp.path), path.basename(temp.path));
  } finally {
    temp.cleanup();
  }
});

test('createScaffoldManifest construye la estructura inicial', () => {
  const manifest: OpenSpecManifest = createScaffoldManifest('demo', [{ name: 'core', path: 'src' }]);

  assert.deepEqual(manifest, {
    specification: '1.0.0',
    project: 'demo',
    bounded_contexts: [{ name: 'core', path: 'src' }],
    specs: []
  });
});
