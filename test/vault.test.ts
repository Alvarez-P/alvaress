import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  appendVaultNoteEntry,
  connectVault,
  getVaultNotePath,
  renderVaultNote
} from '../src/vault/vault.js';
import { makeTempDir, writeFile, writeJson } from './helpers.js';

test('renderVaultNote genera frontmatter y enlaces', () => {
  const note = renderVaultNote('demo-app');

  assert.match(note, /^---\nproject: "demo-app"\nharness: true\nstatus: active\n/);
  assert.match(note, /# demo-app/);
  assert.match(note, /\[\[Tasks\]\]/);
});

test('connectVault crea la estructura Harness y enlaces', () => {
  const temp = makeTempDir();
  try {
    const root = path.join(temp.path, 'project');
    const vault = path.join(temp.path, 'vault');
    fs.mkdirSync(root, { recursive: true });
    writeJson(path.join(root, 'package.json'), { name: 'demo-app' });
    writeFile(path.join(root, 'openspec.yaml'), 'specification: "1.0.0"\nproject: demo-app\nspecs: []\n');

    const connection = connectVault(root, vault);

    assert.equal(connection.vaultPath, vault);
    assert.equal(connection.harnessDir, path.join(vault, 'Harness'));
    assert.equal(connection.tasksLinkResult, 'created');
    assert.equal(connection.manifestLinkResult, 'created');
    assert.ok(fs.lstatSync(path.join(vault, 'Harness', 'Tasks')).isSymbolicLink());
    assert.ok(fs.existsSync(connection.notePath));
    assert.ok(connection.manifestLink !== undefined && fs.existsSync(connection.manifestLink));
  } finally {
    temp.cleanup();
  }
});

test('connectVault es idempotente y conserva la nota', () => {
  const temp = makeTempDir();
  try {
    const root = path.join(temp.path, 'project');
    const vault = path.join(temp.path, 'vault');
    fs.mkdirSync(root, { recursive: true });

    const first = connectVault(root, vault);
    writeFile(first.notePath, 'nota editada');
    const second = connectVault(root, vault);

    assert.equal(second.tasksLinkResult, 'unchanged');
    assert.equal(fs.readFileSync(second.notePath, 'utf-8'), 'nota editada');
  } finally {
    temp.cleanup();
  }
});

test('getVaultNotePath sanea el nombre y usa Harness', () => {
  assert.equal(
    getVaultNotePath('/tmp/vault', '@scope/demo app'),
    path.join('/tmp/vault', 'Harness', '-scope-demo-app.md')
  );
});

test('appendVaultNoteEntry crea la nota y la sección Registro', () => {
  const temp = makeTempDir();
  try {
    const notePath = path.join(temp.path, 'Harness', 'demo-app.md');

    appendVaultNoteEntry(notePath, {
      summary: 'Implementada la tarea 1',
      task: 'TASK-01',
      validation: 'npm test: 112/112',
      risks: 'Sin riesgos',
      next: 'Revisar TASK-02',
      timestamp: '2026-01-01T00:00:00.000Z'
    });

    const note = fs.readFileSync(notePath, 'utf-8');
    assert.match(note, /# demo-app/);
    assert.match(note, /## Registro/);
    assert.match(note, /### 2026-01-01T00:00:00\.000Z · TASK-01/);
    assert.match(note, /- Resumen: Implementada la tarea 1/);
    assert.match(note, /- Validación: npm test: 112\/112/);
    assert.match(note, /- Riesgos: Sin riesgos/);
    assert.match(note, /- Siguiente: Revisar TASK-02/);
  } finally {
    temp.cleanup();
  }
});

test('appendVaultNoteEntry conserva el contenido y añade entradas', () => {
  const temp = makeTempDir();
  try {
    const notePath = path.join(temp.path, 'demo-app.md');
    writeFile(notePath, '# demo-app\n\n## Registro\n\n### previa\n\n- Resumen: anterior\n');

    appendVaultNoteEntry(notePath, {
      summary: 'Segunda entrada',
      timestamp: '2026-01-02T00:00:00.000Z'
    });

    const note = fs.readFileSync(notePath, 'utf-8');
    assert.equal(note.match(/## Registro/g)?.length, 1);
    assert.match(note, /- Resumen: anterior/);
    assert.match(note, /### 2026-01-02T00:00:00\.000Z/);
    assert.match(note, /- Resumen: Segunda entrada/);
  } finally {
    temp.cleanup();
  }
});

test('appendVaultNoteEntry añade Registro a una nota existente sin sección', () => {
  const temp = makeTempDir();
  try {
    const notePath = path.join(temp.path, 'demo-app.md');
    writeFile(notePath, '# demo-app\n\nContenido previo\n');

    appendVaultNoteEntry(notePath, { summary: 'Cierre', timestamp: '2026-01-03T00:00:00.000Z' });

    const note = fs.readFileSync(notePath, 'utf-8');
    assert.match(note, /Contenido previo/);
    assert.match(note, /## Registro/);
    assert.match(note, /- Resumen: Cierre/);
  } finally {
    temp.cleanup();
  }
});

test('connectVault sanea el nombre del proyecto', () => {
  const temp = makeTempDir();
  try {
    const root = path.join(temp.path, 'project');
    const vault = path.join(temp.path, 'vault');
    fs.mkdirSync(root, { recursive: true });
    writeJson(path.join(root, 'package.json'), { name: '@scope/demo app' });

    const connection = connectVault(root, vault);

    assert.equal(path.basename(connection.notePath), '-scope-demo-app.md');
  } finally {
    temp.cleanup();
  }
});
