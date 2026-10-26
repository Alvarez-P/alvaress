import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { FileChange, Risk } from '../core/contracts.js';
import { changedFiles, outOfScopeFiles } from './scope.js';
import type { ScopeMode } from './scope.js';

const IGNORED_PREFIXES = ['.laya/', '.harness/', 'node_modules/', 'dist/', 'graphify-out/'];

export type WorkspaceSnapshot = Map<string, string | null>;

function normalize(file: string): string {
  return path.normalize(file).replaceAll('\\', '/').replace(/^\.\//, '');
}

export function isRunArtifact(file: string): boolean {
  const normalized = normalize(file);
  return IGNORED_PREFIXES.some(
    (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)
  );
}

function hashFile(root: string, file: string): string | null {
  try {
    const target = path.join(root, file);
    const stat = fs.statSync(target);
    if (!stat.isFile()) {
      return null;
    }
    return crypto.createHash('sha1').update(fs.readFileSync(target)).digest('hex');
  } catch {
    return null;
  }
}

export function snapshotWorkspace(root: string, extra: string[] = []): WorkspaceSnapshot {
  const files = new Set<string>();
  for (const file of extra) {
    files.add(normalize(file));
  }
  for (const file of changedFiles(root) ?? []) {
    files.add(normalize(file));
  }

  const snapshot: WorkspaceSnapshot = new Map();
  for (const file of files) {
    if (isRunArtifact(file)) {
      continue;
    }
    snapshot.set(file, hashFile(root, file));
  }
  return snapshot;
}

export function diffSnapshots(
  before: WorkspaceSnapshot,
  after: WorkspaceSnapshot,
  source: string
): FileChange[] {
  const changes: FileChange[] = [];

  for (const [file, hash] of after) {
    const previous = before.get(file);
    if (hash === null) {
      if (previous !== undefined && previous !== null) {
        changes.push({ path: file, change: `${source} eliminó el archivo`, kind: 'deleted' });
      }
      continue;
    }
    if (previous === undefined) {
      changes.push({ path: file, change: `${source} creó el archivo`, kind: 'created' });
      continue;
    }
    if (previous !== hash) {
      changes.push({ path: file, change: `${source} modificó el archivo`, kind: 'modified' });
    }
  }

  for (const [file, hash] of before) {
    if (after.has(file)) {
      continue;
    }
    if (hash !== null) {
      changes.push({ path: file, change: `${source} eliminó el archivo`, kind: 'deleted' });
    }
  }

  return changes;
}

export function scopeRisks(assigned: string[], changes: FileChange[], mode: ScopeMode): Risk[] {
  if (assigned.length === 0 || mode === 'off') {
    return [];
  }
  const outside = outOfScopeFiles(
    changes.map((change) => change.path),
    assigned
  );
  if (outside.length === 0) {
    return [];
  }
  return [
    {
      title: `El worker tocó archivos fuera del alcance: ${outside.join(', ')}`,
      source: 'worker',
      severity: mode === 'strict' ? 'high' : 'medium'
    }
  ];
}

export function outOfScope(assigned: string[], changes: FileChange[]): string[] {
  if (assigned.length === 0) {
    return [];
  }
  return outOfScopeFiles(
    changes.map((change) => change.path),
    assigned
  );
}
