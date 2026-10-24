import path from 'node:path';
import { runShellCommand } from '../utils/process.js';

export type ScopeMode = 'strict' | 'warn' | 'off';

function normalize(file: string): string {
  return path.normalize(file).replaceAll('\\', '/').replace(/^\.\//, '');
}

function pathsOverlap(left: string, right: string): boolean {
  const normalizedLeft = normalize(left).replace(/\/+$/, '');
  const normalizedRight = normalize(right).replace(/\/+$/, '');
  if (normalizedLeft === normalizedRight) {
    return true;
  }
  return (
    normalizedLeft.startsWith(`${normalizedRight}/`) || normalizedRight.startsWith(`${normalizedLeft}/`)
  );
}

export function changedFiles(root: string): string[] | null {
  const result = runShellCommand('git status --porcelain', { cwd: root, timeout: 15000 });
  if (result.code !== 0) {
    return null;
  }
  const files = new Set<string>();
  for (const line of result.stdout.split('\n')) {
    if (line.trim().length === 0) {
      continue;
    }
    const raw = line.slice(3).trim();
    if (raw.length === 0) {
      continue;
    }
    const renamed = raw.includes(' -> ') ? raw.split(' -> ').pop() : raw;
    if (renamed !== undefined && renamed.length > 0) {
      files.add(normalize(renamed));
    }
  }
  return [...files];
}

export function outOfScopeFiles(changed: string[], assigned: string[]): string[] {
  if (assigned.length === 0) {
    return [];
  }
  return changed.filter((file) => !assigned.some((allowed) => pathsOverlap(file, allowed)));
}

export function checkScope(
  root: string,
  assigned: string[],
  mode: ScopeMode
): { changed: string[] | null; outOfScope: string[] } {
  if (mode === 'off') {
    return { changed: null, outOfScope: [] };
  }
  const changed = changedFiles(root);
  if (changed === null) {
    return { changed: null, outOfScope: [] };
  }
  return { changed, outOfScope: outOfScopeFiles(changed, assigned) };
}
