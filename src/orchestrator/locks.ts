import path from 'node:path';
import type { WorkItem } from '../openspec/types.js';

function normalizeFile(file: string): string {
  return path.normalize(file).replaceAll('\\', '/');
}

function pathsOverlap(left: string, right: string): boolean {
  const normalizedLeft = normalizeFile(left).replace(/\/+$/, '');
  const normalizedRight = normalizeFile(right).replace(/\/+$/, '');
  if (normalizedLeft === normalizedRight) {
    return true;
  }
  return (
    normalizedLeft.startsWith(`${normalizedRight}/`) || normalizedRight.startsWith(`${normalizedLeft}/`)
  );
}

function sharesFiles(left: WorkItem, right: WorkItem): boolean {
  return (left.task.files ?? []).some((leftFile) =>
    (right.task.files ?? []).some((rightFile) => pathsOverlap(leftFile, rightFile))
  );
}

function createsConflict(left: WorkItem, right: WorkItem): boolean {
  return left.spec.context === right.spec.context || sharesFiles(left, right);
}

function dependsOn(left: WorkItem, right: WorkItem): boolean {
  return (left.task.depends_on ?? []).includes(right.task.id);
}

function orderGroup(group: WorkItem[]): WorkItem[] {
  const byId = new Map(group.map((item) => [item.task.id, item]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: WorkItem[] = [];

  const visit = (item: WorkItem): void => {
    if (visited.has(item.task.id)) {
      return;
    }
    if (visiting.has(item.task.id)) {
      throw new Error(`Dependencia circular detectada en la tarea ${item.task.id}.`);
    }
    visiting.add(item.task.id);
    for (const dependency of item.task.depends_on ?? []) {
      const dependencyItem = byId.get(dependency);
      if (dependencyItem !== undefined) {
        visit(dependencyItem);
      }
    }
    visiting.delete(item.task.id);
    visited.add(item.task.id);
    result.push(item);
  };

  for (const item of [...group].toSorted((left, right) => (left.task.priority ?? 100) - (right.task.priority ?? 100))) {
    visit(item);
  }
  return result;
}

export function groupWorkItems(items: WorkItem[]): WorkItem[][] {
  const parent = items.map((_, index) => index);

  const find = (index: number): number => {
    let current = index;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  };

  const union = (left: number, right: number): void => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parent[rightRoot] = leftRoot;
    }
  };

  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      if (createsConflict(items[left], items[right])) {
        union(left, right);
      }
      if (dependsOn(items[left], items[right]) || dependsOn(items[right], items[left])) {
        union(left, right);
      }
    }
  }

  const groups = new Map<number, WorkItem[]>();
  for (let index = 0; index < items.length; index += 1) {
    const root = find(index);
    const group = groups.get(root);
    if (group) {
      group.push(items[index]);
    } else {
      groups.set(root, [items[index]]);
    }
  }

  return [...groups.values()].map((group) => orderGroup(group));
}

export function describeGroups(groups: WorkItem[][]): string[] {
  return groups.map((group, index) => {
    const tasks = group
      .map((item) => {
        const dependencies = item.task.depends_on ?? [];
        const suffix = dependencies.length > 0 ? ` (deps: ${dependencies.join(', ')})` : '';
        return `${item.spec.id}/${item.task.id}${suffix}`;
      })
      .join(', ');
    const contexts = [...new Set(group.map((item) => item.spec.context))].join(', ');
    return `Grupo ${index + 1} [${contexts}]: ${tasks}`;
  });
}
