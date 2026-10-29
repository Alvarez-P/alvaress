import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runLearnCommand } from '../src/commands/learn.js';
import type { DecisionEngine } from '../src/core/contracts.js';
import {
  addLearning,
  getMemoryStores,
  loadLearnings,
  loadScopedLearnings,
  promoteLearning
} from '../src/memory/learnings.js';
import { makeTempDir } from './helpers.js';

function decisionsWith(scope: 'global' | 'project', calls: string[] = []): DecisionEngine {
  return {
    async route() {
      throw new Error('route no debería usarse en learn');
    },
    async planFlow() {
      throw new Error('planFlow no debería usarse en learn');
    },
    async assessRisk() {
      throw new Error('assessRisk no debería usarse en learn');
    },
    async classifyFailure() {
      throw new Error('classifyFailure no debería usarse en learn');
    },
    async decideLearningScope(input) {
      calls.push(input.title);
      return {
        scope,
        confidence: 0.8,
        reason: `decisión de prueba: ${scope}`,
        source: 'heuristic'
      };
    }
  };
}

function projectRoot(tempPath: string): string {
  const root = path.join(tempPath, 'proyecto');
  fs.mkdirSync(root, { recursive: true });
  return root;
}

test('learn add usa Laya para decidir el store global', async () => {
  const temp = makeTempDir();
  try {
    const root = projectRoot(temp.path);
    const globalDir = path.join(temp.path, 'global');
    const projectDir = path.join(temp.path, 'project-memory');
    const lines: string[] = [];

    await runLearnCommand(
      [
        'add',
        'solution',
        'Validar migraciones en seco',
        'Ejecutar el SQL dentro de una transacción y revertirla antes de aplicar.'
      ],
      root,
      {
        memoryDir: globalDir,
        projectMemoryDir: projectDir,
        decisions: decisionsWith('global'),
        stdout: (line) => lines.push(line)
      }
    );

    assert.ok(fs.existsSync(path.join(globalDir, 'learnings.json')));
    assert.equal(fs.existsSync(path.join(projectDir, 'learnings.json')), false);
    assert.match(lines.join('\n'), /Scope: global/);
  } finally {
    temp.cleanup();
  }
});

test('learn add guarda en el proyecto cuando Laya lo decide así', async () => {
  const temp = makeTempDir();
  try {
    const root = projectRoot(temp.path);
    const globalDir = path.join(temp.path, 'global');
    const projectDir = path.join(temp.path, 'project-memory');

    await runLearnCommand(
      [
        'add',
        'pitfall',
        'El endpoint de facturas exige migración local',
        'Antes de tocar src/billing/repository.ts ejecuta la migración del proyecto.'
      ],
      root,
      {
        memoryDir: globalDir,
        projectMemoryDir: projectDir,
        decisions: decisionsWith('project'),
        stdout: () => {}
      }
    );

    const stores = getMemoryStores(root, { globalDir, projectDir });
    const learnings = loadScopedLearnings(stores, 'all');
    assert.equal(learnings.length, 1);
    assert.equal(learnings[0]?.scope, 'project');
  } finally {
    temp.cleanup();
  }
});

test('--global fuerza el store global sin consultar a Laya', async () => {
  const temp = makeTempDir();
  try {
    const root = projectRoot(temp.path);
    const globalDir = path.join(temp.path, 'global');
    const projectDir = path.join(temp.path, 'project-memory');
    const calls: string[] = [];

    await runLearnCommand(
      [
        'add',
        'preference',
        'Usar commits convencionales siempre',
        'El equipo exige Conventional Commits en todos los repositorios.',
        '--global'
      ],
      root,
      {
        memoryDir: globalDir,
        projectMemoryDir: projectDir,
        decisions: decisionsWith('project', calls),
        stdout: () => {}
      }
    );

    assert.deepEqual(calls, []);
    const stores = getMemoryStores(root, { globalDir, projectDir });
    assert.equal(loadScopedLearnings(stores, 'global').length, 1);
    assert.equal(loadScopedLearnings(stores, 'project').length, 0);
  } finally {
    temp.cleanup();
  }
});

test('el store del proyecto gana cuando hay el mismo id en ambos', async () => {
  const temp = makeTempDir();
  try {
    const root = projectRoot(temp.path);
    const stores = getMemoryStores(root, {
      globalDir: path.join(temp.path, 'global'),
      projectDir: path.join(temp.path, 'project-memory')
    });

    addLearning(
      {
        kind: 'pitfall',
        title: 'Mismo aprendizaje en dos stores',
        body: 'Versión global del aprendizaje con suficiente detalle para pasar la validación.'
      },
      stores.global
    );
    addLearning(
      {
        kind: 'pitfall',
        title: 'Mismo aprendizaje en dos stores',
        body: 'Versión del proyecto del aprendizaje con suficiente detalle para pasar la validación.'
      },
      stores.project
    );

    const merged = loadScopedLearnings(stores, 'all');
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.scope, 'project');
    assert.match(merged[0]?.body ?? '', /Versión del proyecto/);
  } finally {
    temp.cleanup();
  }
});

test('learn promote copia el aprendizaje del proyecto al global', async () => {
  const temp = makeTempDir();
  try {
    const root = projectRoot(temp.path);
    const stores = getMemoryStores(root, {
      globalDir: path.join(temp.path, 'global'),
      projectDir: path.join(temp.path, 'project-memory')
    });
    const created = addLearning(
      {
        kind: 'solution',
        title: 'Reintentar uv tras un fallo de red',
        body: 'Repetir uv tool install graphifyy cuando la descarga falla por timeout.'
      },
      stores.project
    );

    const result = promoteLearning(created.learning.id, stores);
    assert.equal(result.created, true);
    assert.equal(loadLearnings(stores.global).length, 1);
    assert.equal(loadLearnings(stores.project).length, 1);
  } finally {
    temp.cleanup();
  }
});

test('learn use incrementa el contador en el store donde vive', async () => {
  const temp = makeTempDir();
  try {
    const root = projectRoot(temp.path);
    const globalDir = path.join(temp.path, 'global');
    const projectDir = path.join(temp.path, 'project-memory');
    const stores = getMemoryStores(root, { globalDir, projectDir });
    const created = addLearning(
      {
        kind: 'step',
        title: 'Comprobar el lockfile antes de instalar',
        body: 'Ejecutar pnpm install --frozen-lockfile para detectar deriva en CI.'
      },
      stores.project
    );

    await runLearnCommand(['use', created.learning.id], root, {
      memoryDir: globalDir,
      projectMemoryDir: projectDir,
      decisions: decisionsWith('project'),
      stdout: () => {}
    });

    assert.equal(loadLearnings(stores.project)[0]?.uses, 1);
    assert.equal(loadLearnings(stores.global).length, 0);
  } finally {
    temp.cleanup();
  }
});
