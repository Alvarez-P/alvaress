import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runObsidianCommand } from '../src/commands/obsidian.js';
import type { HarnessConfig } from '../src/config/loader.js';
import { makeTempDir, writeJson } from './helpers.js';

function configWith(vaultPath: string): HarnessConfig {
  return {
    obsidianVaultPath: vaultPath,
    models: {
      jevOrchestrator: { modelName: 'jev-latest', apiKey: '', apiBase: '', env: {} },
      aiderImplementer: { modelName: 'deepseek/deepseek-chat', apiKey: '', apiBase: '', env: {} }
    },
    validation: { maxAttempts: 1, commands: [] }
  };
}

function projectWith(tempPath: string, name = 'demo-app'): string {
  const root = path.join(tempPath, 'project');
  fs.mkdirSync(root, { recursive: true });
  writeJson(path.join(root, 'package.json'), { name });
  return root;
}

test('obsidian status informa de la bóveda y la nota', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const vault = path.join(temp.path, 'vault');
    const lines: string[] = [];

    runObsidianCommand(['status'], root, {
      config: configWith(vault),
      stdout: (line) => lines.push(line)
    });

    const status = JSON.parse(lines.join('\n')) as Record<string, unknown>;
    assert.equal(status.configured, true);
    assert.equal(status.exists, false);
    assert.equal(status.noteExists, false);
    assert.equal(status.vaultPath, vault);
    assert.equal(status.notePath, path.join(vault, 'Harness', 'demo-app.md'));
  } finally {
    temp.cleanup();
  }
});

test('obsidian sync crea la bóveda, la nota y los enlaces', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const vault = path.join(temp.path, 'vault');
    const lines: string[] = [];

    runObsidianCommand(['sync'], root, {
      config: configWith(vault),
      stdout: (line) => lines.push(line)
    });

    const connection = JSON.parse(lines.join('\n')) as Record<string, unknown>;
    assert.equal(connection.vaultPath, vault);
    assert.equal(connection.tasksLinkResult, 'created');
    assert.ok(fs.existsSync(path.join(vault, 'Harness', 'demo-app.md')));
    assert.ok(fs.lstatSync(path.join(vault, 'Harness', 'Tasks')).isSymbolicLink());
  } finally {
    temp.cleanup();
  }
});

test('obsidian note exige --summary', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const vault = path.join(temp.path, 'vault');

    assert.throws(
      () => runObsidianCommand(['note'], root, { config: configWith(vault), stdout: () => {} }),
      /--summary/
    );
  } finally {
    temp.cleanup();
  }
});

test('obsidian note registra el cierre en la nota del proyecto', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const vault = path.join(temp.path, 'vault');
    const lines: string[] = [];

    runObsidianCommand(
      [
        'note',
        '--summary',
        'Implementada la tarea',
        '--task',
        'TASK-01',
        '--validation',
        'npm test OK',
        '--risk',
        'ninguno',
        '--next',
        'TASK-02'
      ],
      root,
      { config: configWith(vault), stdout: (line) => lines.push(line) }
    );

    const note = fs.readFileSync(path.join(vault, 'Harness', 'demo-app.md'), 'utf-8');
    assert.match(lines.join('\n'), /Nota de Obsidian actualizada/);
    assert.match(note, /TASK-01/);
    assert.match(note, /- Resumen: Implementada la tarea/);
    assert.match(note, /- Validación: npm test OK/);
    assert.match(note, /- Riesgos: ninguno/);
    assert.match(note, /- Siguiente: TASK-02/);
  } finally {
    temp.cleanup();
  }
});

test('obsidian falla si no hay bóveda configurada', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);

    assert.throws(
      () => runObsidianCommand(['status'], root, { config: configWith(''), stdout: () => {} }),
      /No hay bóveda Obsidian configurada/
    );
  } finally {
    temp.cleanup();
  }
});

test('obsidian muestra ayuda y rechaza subcomandos desconocidos', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const lines: string[] = [];

    runObsidianCommand(['help'], root, {
      config: configWith(path.join(temp.path, 'vault')),
      stdout: (line) => lines.push(line)
    });
    assert.match(lines.join('\n'), /alvaress obsidian/);
    assert.match(lines.join('\n'), /status/);

    assert.throws(
      () =>
        runObsidianCommand(['desconocido'], root, {
          config: configWith(path.join(temp.path, 'vault')),
          stdout: () => {}
        }),
      /Subcomando de obsidian desconocido/
    );
  } finally {
    temp.cleanup();
  }
});
