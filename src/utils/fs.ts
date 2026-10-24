import fs from 'node:fs';
import path from 'node:path';
import { ConfigError, errorMessage } from './errors.js';

export function pathExists(target: string): boolean {
  try {
    fs.lstatSync(target);
    return true;
  } catch {
    return false;
  }
}

export function isDirectory(target: string): boolean {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

export function ensureDir(target: string): void {
  fs.mkdirSync(target, { recursive: true });
}

export function readTextFile(target: string): string {
  try {
    return fs.readFileSync(target, 'utf-8');
  } catch (error) {
    throw new ConfigError(`No se pudo leer ${target}: ${errorMessage(error)}`);
  }
}

export function writeTextFile(target: string, content: string): void {
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, content, 'utf-8');
}

export function writeTextFileIfMissing(target: string, content: string): boolean {
  if (pathExists(target)) {
    return false;
  }
  writeTextFile(target, content);
  return true;
}

export function readJsonFile<T>(target: string): T {
  const raw = readTextFile(target);
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new ConfigError(`JSON inválido en ${target}: ${errorMessage(error)}`);
  }
}

export function writeJsonFile(target: string, value: unknown): void {
  writeTextFile(target, `${JSON.stringify(value, null, 2)}\n`);
}

export type LinkType = 'file' | 'dir';
export type LinkResult = 'created' | 'updated' | 'unchanged' | 'skipped';

export function linkPath(target: string, linkPathValue: string, type: LinkType): LinkResult {
  ensureDir(path.dirname(linkPathValue));
  const absoluteTarget = path.resolve(target);

  if (pathExists(linkPathValue)) {
    const stats = fs.lstatSync(linkPathValue);
    if (!stats.isSymbolicLink()) {
      return 'skipped';
    }
    const current = fs.readlinkSync(linkPathValue);
    const resolved = path.resolve(path.dirname(linkPathValue), current);
    if (resolved === absoluteTarget) {
      return 'unchanged';
    }
    fs.unlinkSync(linkPathValue);
    fs.symlinkSync(absoluteTarget, linkPathValue, type);
    return 'updated';
  }

  fs.symlinkSync(absoluteTarget, linkPathValue, type);
  return 'created';
}

export function linkFile(target: string, linkPathValue: string): LinkResult {
  return linkPath(target, linkPathValue, 'file');
}

export function linkDirectory(target: string, linkPathValue: string): LinkResult {
  return linkPath(target, linkPathValue, 'dir');
}

export function removePath(target: string): void {
  if (!pathExists(target)) {
    return;
  }
  fs.rmSync(target, { recursive: true, force: true });
}

export function relativeTo(root: string, target: string): string {
  const relative = path.relative(root, target);
  return relative.length === 0 ? '.' : relative;
}
