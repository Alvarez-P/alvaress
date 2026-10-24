import crypto from 'node:crypto';
import path from 'node:path';
import { HARNESS_CACHE_DIR } from '../constants.js';
import { ensureDir, pathExists, readJsonFile, writeJsonFileAtomic } from '../utils/fs.js';
import type { DecisionRequest, DecisionResponse } from './client.js';

interface CacheEntry {
  createdAt: string;
  requestHash: string;
  response: DecisionResponse;
}

function cacheDirectory(root: string): string {
  return path.join(root, HARNESS_CACHE_DIR, 'decision');
}

export function decisionRequestHash(request: DecisionRequest): string {
  return crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex');
}

export function readDecisionCache(
  root: string,
  request: DecisionRequest,
  ttlMs: number
): DecisionResponse | undefined {
  const hash = decisionRequestHash(request);
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

export function writeDecisionCache(
  root: string,
  request: DecisionRequest,
  response: DecisionResponse
): void {
  const hash = decisionRequestHash(request);
  const directory = cacheDirectory(root);
  ensureDir(directory);
  writeJsonFileAtomic(path.join(directory, `${hash}.json`), {
    createdAt: new Date().toISOString(),
    requestHash: hash,
    response
  } satisfies CacheEntry);
}
