import fs from 'node:fs';
import path from 'node:path';
import { HARNESS_BACKUPS_DIR, OPENSPEC_FILENAME } from '../constants.js';
import { ManifestError, errorMessage } from '../utils/errors.js';
import { ensureDir, pathExists, writeTextFileAtomic } from '../utils/fs.js';
import { getManifestPath } from '../openspec/manifest.js';

export interface ManifestBackup {
  id: string;
  path: string;
  createdAt: string;
  size: number;
}

function backupsDir(root: string): string {
  return path.join(root, HARNESS_BACKUPS_DIR);
}

function backupId(date = new Date()): string {
  return date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 17);
}

export function backupManifest(root: string = process.cwd()): ManifestBackup | undefined {
  const source = getManifestPath(root);
  if (!pathExists(source)) {
    return undefined;
  }
  const directory = backupsDir(root);
  ensureDir(directory);
  const id = backupId();
  const target = path.join(directory, `${id}-${OPENSPEC_FILENAME}`);
  const content = fs.readFileSync(source, 'utf-8');
  writeTextFileAtomic(target, content);
  const stats = fs.statSync(target);
  return {
    id,
    path: target,
    createdAt: new Date().toISOString(),
    size: stats.size
  };
}

export function listManifestBackups(root: string = process.cwd()): ManifestBackup[] {
  const directory = backupsDir(root);
  if (!pathExists(directory)) {
    return [];
  }
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(`-${OPENSPEC_FILENAME}`))
    .map((name) => {
      const target = path.join(directory, name);
      const stats = fs.statSync(target);
      return {
        id: name.slice(0, -`-${OPENSPEC_FILENAME}`.length),
        path: target,
        createdAt: stats.mtime.toISOString(),
        size: stats.size
      };
    })
    .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function restoreManifestBackup(
  root: string = process.cwd(),
  id?: string
): ManifestBackup {
  const backups = listManifestBackups(root);
  if (backups.length === 0) {
    throw new ManifestError('No hay backups de openspec.yaml en .harness/backups.');
  }
  const selected =
    id === undefined || id === 'latest'
      ? backups[0]
      : backups.find((backup) => backup.id === id);
  if (selected === undefined) {
    throw new ManifestError(`No existe el backup "${id}". Usa "alvaress restore --list".`);
  }
  try {
    const content = fs.readFileSync(selected.path, 'utf-8');
    writeTextFileAtomic(getManifestPath(root), content);
  } catch (error) {
    throw new ManifestError(`No se pudo restaurar ${selected.path}: ${errorMessage(error)}`);
  }
  return selected;
}
