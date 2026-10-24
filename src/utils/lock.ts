import fs from 'node:fs';
import path from 'node:path';
import { HARNESS_DIR, HARNESS_LOCK_FILENAME } from '../constants.js';
import { LockError, errorMessage } from './errors.js';
import { ensureDir, pathExists, readJsonFile } from './fs.js';

export interface LockInfo {
  pid: number;
  startedAt: string;
  command: string;
}

export interface AcquireLockOptions {
  command?: string;
  force?: boolean;
  staleMs?: number;
}

export interface ProjectLock {
  path: string;
  info: LockInfo;
  release: () => void;
}

const DEFAULT_STALE_MS = 4 * 60 * 60 * 1000;

export function getLockPath(root: string = process.cwd()): string {
  return path.join(root, HARNESS_DIR, HARNESS_LOCK_FILENAME);
}

export function readProjectLock(root: string = process.cwd()): LockInfo | undefined {
  const lockPath = getLockPath(root);
  if (!pathExists(lockPath)) {
    return undefined;
  }
  try {
    return readJsonFile<LockInfo>(lockPath);
  } catch {
    return undefined;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isStale(info: LockInfo | undefined, staleMs: number): boolean {
  if (info === undefined) {
    return true;
  }
  const started = Date.parse(info.startedAt);
  if (!Number.isFinite(started) || Date.now() - started > staleMs) {
    return true;
  }
  return !isProcessAlive(info.pid);
}

function createLockFile(lockPath: string, info: LockInfo): void {
  const descriptor = fs.openSync(lockPath, 'wx');
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(info, null, 2)}\n`, 'utf-8');
  } finally {
    fs.closeSync(descriptor);
  }
}

export function acquireProjectLock(
  root: string = process.cwd(),
  options: AcquireLockOptions = {}
): ProjectLock {
  const lockPath = getLockPath(root);
  ensureDir(path.dirname(lockPath));
  const info: LockInfo = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    command: options.command ?? 'alvaress'
  };
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;

  try {
    createLockFile(lockPath, info);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw new LockError(`No se pudo crear el lock ${lockPath}: ${errorMessage(error)}`);
    }
    const existing = readProjectLock(root);
    if (!options.force && !isStale(existing, staleMs)) {
      const owner = existing === undefined ? 'desconocido' : `PID ${existing.pid} (${existing.command})`;
      throw new LockError(
        `Ya hay una ejecución de alvaress en curso: ${owner}. Espera a que termine o usa --force si estás seguro.`
      );
    }
    fs.rmSync(lockPath, { force: true });
    createLockFile(lockPath, info);
  }

  return {
    path: lockPath,
    info,
    release: () => {
      const current = readProjectLock(root);
      if (current?.pid === process.pid && current.startedAt === info.startedAt) {
        fs.rmSync(lockPath, { force: true });
      }
    }
  };
}

export async function withProjectLock<T>(
  root: string,
  command: string,
  run: () => Promise<T>,
  options: Omit<AcquireLockOptions, 'command'> = {}
): Promise<T> {
  const lock = acquireProjectLock(root, { ...options, command });
  try {
    return await run();
  } finally {
    lock.release();
  }
}
