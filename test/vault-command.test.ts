import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runVaultCommand } from '../src/commands/vault.js';
import type { HarnessConfig } from '../src/config/loader.js';
import { makeTempDir, writeJson } from './helpers.js';

function configWith(vaultPath: string): HarnessConfig {
  return {
    vaultPath: vaultPath,
    laya: {
      enabled: true,
      modelDir: '/models/laya',
      device: 'cpu',
      timeoutMs: 30000,
      fallbackToHeuristic: true
    },
    models: {
      orchestrator: { modelName: 'openai/orchestrator' },
      subagents: { modelName: 'openai/subagents' }
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

test('vault status informa de la bóveda y la nota', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const vault = path.join(temp.path, 'vault');
    const lines: string[] = [];

    runVaultCommand(['status'], root, {
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

test('vault sync crea la bóveda, la nota y los enlaces', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const vault = path.join(temp.path, 'vault');
    const lines: string[] = [];

    runVaultCommand(['sync'], root, {
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

test('vault note exige --summary', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const vault = path.join(temp.path, 'vault');

    assert.throws(
      () => runVaultCommand(['note'], root, { config: configWith(vault), stdout: () => {} }),
      /--summary/
    );
  } finally {
    temp.cleanup();
  }
});

test('vault note registra el cierre en la nota del proyecto', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const vault = path.join(temp.path, 'vault');
    const lines: string[] = [];

    runVaultCommand(
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
    assert.match(lines.join('\n'), /Nota de la bóveda actualizada/);
    assert.match(note, /TASK-01/);
    assert.match(note, /- Resumen: Implementada la tarea/);
    assert.match(note, /- Validación: npm test OK/);
    assert.match(note, /- Riesgos: ninguno/);
    assert.match(note, /- Siguiente: TASK-02/);
  } finally {
    temp.cleanup();
  }
});

test('vault falla si no hay bóveda configurada', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);

    assert.throws(
      () => runVaultCommand(['status'], root, { config: configWith(''), stdout: () => {} }),
      /No hay bóveda configurada/
    );
  } finally {
    temp.cleanup();
  }
});

test('vault muestra ayuda y rechaza subcomandos desconocidos', () => {
  const temp = makeTempDir();
  try {
    const root = projectWith(temp.path);
    const lines: string[] = [];

    runVaultCommand(['help'], root, {
      config: configWith(path.join(temp.path, 'vault')),
      stdout: (line) => lines.push(line)
    });
    assert.match(lines.join('\n'), /alvaress vault/);
    assert.match(lines.join('\n'), /status/);

    assert.throws(
      () =>
        runVaultCommand(['desconocido'], root, {
          config: configWith(path.join(temp.path, 'vault')),
          stdout: () => {}
        }),
      /Subcomando de vault desconocido/
    );
  } finally {
    temp.cleanup();
  }
});
