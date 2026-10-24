import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeGroups, groupWorkItems } from '../src/orchestrator/locks.js';
import type { OpenSpecSpec, OpenSpecTask, WorkItem } from '../src/openspec/types.js';

function spec(id: string, context: string): OpenSpecSpec {
  return { id, title: id, status: 'Proposed', context, tasks: [] };
}

function item(specId: string, context: string, taskId: string, files: string[] = []): WorkItem {
  const task: OpenSpecTask = { id: taskId, description: taskId, status: 'Pending', files };
  return { spec: spec(specId, context), task };
}

function ids(groups: WorkItem[][]): string[][] {
  return groups.map((group) => group.map((work) => work.task.id).toSorted());
}

test('agrupa tareas del mismo contexto', () => {
  const groups = groupWorkItems([
    item('SPEC-001', 'billing', 'TASK-01'),
    item('SPEC-001', 'billing', 'TASK-02')
  ]);

  assert.deepEqual(ids(groups), [['TASK-01', 'TASK-02']]);
});

test('separa tareas de contextos aislados', () => {
  const groups = groupWorkItems([
    item('SPEC-001', 'billing', 'TASK-01'),
    item('SPEC-002', 'catalog', 'TASK-02')
  ]);

  assert.deepEqual(ids(groups), [['TASK-01'], ['TASK-02']]);
});

test('agrupa tareas que comparten un archivo', () => {
  const groups = groupWorkItems([
    item('SPEC-001', 'billing', 'TASK-01', ['src/shared/types.ts']),
    item('SPEC-002', 'catalog', 'TASK-02', ['src/shared/types.ts']),
    item('SPEC-003', 'shipping', 'TASK-03', ['src/shipping/index.ts'])
  ]);

  assert.deepEqual(ids(groups), [['TASK-01', 'TASK-02'], ['TASK-03']]);
});

test('agrupa de forma transitiva', () => {
  const groups = groupWorkItems([
    item('SPEC-001', 'a', 'TASK-01', ['src/a.ts']),
    item('SPEC-002', 'b', 'TASK-02', ['src/a.ts', 'src/b.ts']),
    item('SPEC-003', 'c', 'TASK-03', ['src/b.ts'])
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(ids(groups), [['TASK-01', 'TASK-02', 'TASK-03']]);
});

test('detecta colisiones entre archivo y directorio', () => {
  const groups = groupWorkItems([
    item('SPEC-001', 'a', 'TASK-01', ['src/billing']),
    item('SPEC-002', 'b', 'TASK-02', ['src/billing/invoice.ts'])
  ]);

  assert.equal(groups.length, 1);
});

test('normaliza separadores de ruta', () => {
  const groups = groupWorkItems([
    item('SPEC-001', 'a', 'TASK-01', ['src\\billing\\invoice.ts']),
    item('SPEC-002', 'b', 'TASK-02', ['src/billing/invoice.ts'])
  ]);

  assert.equal(groups.length, 1);
});

test('describeGroups muestra contexto y tareas', () => {
  const groups = groupWorkItems([
    item('SPEC-001', 'billing', 'TASK-01'),
    item('SPEC-001', 'billing', 'TASK-02'),
    item('SPEC-002', 'catalog', 'TASK-03')
  ]);

  assert.deepEqual(describeGroups(groups), [
    'Grupo 1 [billing]: SPEC-001/TASK-01, SPEC-001/TASK-02',
    'Grupo 2 [catalog]: SPEC-002/TASK-03'
  ]);
});
