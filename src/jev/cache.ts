import crypto from 'node:crypto';
import path from 'node:path';
import { HARNESS_CACHE_DIR } from '../constants.js';
import { ensureDir, pathExists, readJsonFile, writeJsonFileAtomic } from '../utils/fs.js';
import type { JevRequest, JevResponse } from './client.js';

interface CacheEntry {
  createdAt: string;
  requestHash: string;
  response: JevResponse;
}

function cacheDirectory(root: string): string {
  return path.join(root, HARNESS_CACHE_DIR, 'jev');
}

export function jevRequestHash(request: JevRequest): string {
  return crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex');
}

export function readJevCache(
  root: string,
  request: JevRequest,
  ttlMs: number
): JevResponse | undefined {
  const hash = jevRequestHash(request);
  const target = path.join(cacheDirectory(root), `${hash}.json`);
  if (!pathExists(target)) {
    return undefined;
  }
  try {
    const entry = readJsonFile<CacheEntry>(target);
    const createdAt = Date.parse(entry.createdAt);
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > ttlMs) {
      return undefined;
    }
    return entry.response;
  } catch {
    return undefined;
  }
}

export function writeJevCache(root: string, request: JevRequest, response: JevResponse): void {
  const hash = jevRequestHash(request);
  const directory = cacheDirectory(root);
  ensureDir(directory);
  writeJsonFileAtomic(path.join(directory, `${hash}.json`), {
    createdAt: new Date().toISOString(),
    requestHash: hash,
    response
  } satisfies CacheEntry);
}
