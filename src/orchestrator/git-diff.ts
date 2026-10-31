import fs from 'node:fs';
import path from 'node:path';
import { runCommand } from '../utils/process.js';
import { redactSecrets } from '../utils/redact.js';

const DIFF_TIMEOUT_MS = 15_000;
const DIFF_BUFFER_BYTES = 2 * 1024 * 1024;
const MAX_DIFF_CHARS = 8_000;
const MAX_UNTRACKED_FILE_BYTES = 256 * 1024;

const ARTIFACT_EXCLUDES = ['.laya', '.harness', 'graphify-out', 'node_modules', 'dist'];

function normalize(file: string): string {
  return path.normalize(file).replaceAll('\\', '/').replace(/^\.\//, '');
}

function isArtifact(file: string): boolean {
  const normalized = normalize(file);
  return ARTIFACT_EXCLUDES.some(
    (directory) => normalized === directory || normalized.startsWith(`${directory}/`)
  );
}

function isSelected(file: string, files: readonly string[]): boolean {
  if (files.length === 0) {
    return true;
  }
  const normalized = normalize(file);
  return files.some((candidate) => {
    const filter = normalize(candidate).replace(/\/+$/, '');
    return normalized === filter || normalized.startsWith(`${filter}/`);
  });
}

function isTextFile(root: string, file: string): boolean {
  try {
    const target = path.join(root, file);
    if (fs.statSync(target).size > MAX_UNTRACKED_FILE_BYTES) {
      return false;
    }
    return !fs.readFileSync(target).includes(0);
  } catch {
    return false;
  }
}

function truncateDiff(diff: string, maxChars: number): string {
  if (diff.length <= maxChars) {
    return diff;
  }
  const omitted = diff.length - maxChars;
  return `${diff.slice(0, maxChars)}\n[diff truncado: ${omitted} caracteres. Usa "git diff -- <archivo>" para el resto]`;
}

function trackedPaths(files: readonly string[]): string[] {
  return files.length > 0
    ? [...files]
    : ['.', ...ARTIFACT_EXCLUDES.map((directory) => `:(exclude)${directory}`)];
}

async function trackedDiff(root: string, files: readonly string[], stat: boolean): Promise<string> {
  const result = await runCommand(
    'git',
    [
      'diff',
      '--no-color',
      '--no-ext-diff',
      ...(stat ? ['--stat=120'] : ['--unified=3']),
      'HEAD',
      '--',
      ...trackedPaths(files)
    ],
    { cwd: root, timeout: DIFF_TIMEOUT_MS, maxBuffer: DIFF_BUFFER_BYTES }
  );
  return result.code === 0 ? result.stdout.trimEnd() : '';
}

async function untrackedFiles(root: string, files: readonly string[]): Promise<string[]> {
  const listed = await runCommand('git', ['ls-files', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    timeout: DIFF_TIMEOUT_MS,
    maxBuffer: DIFF_BUFFER_BYTES
  });
  if (listed.code !== 0) {
    return [];
  }
  return listed.stdout
    .split('\0')
    .filter(
      (file) => file.length > 0 && !isArtifact(file) && isSelected(file, files) && isTextFile(root, file)
    );
}

async function untrackedDiff(root: string, untracked: readonly string[]): Promise<string> {
  const chunks: string[] = [];
  for (const file of untracked) {
    const result = await runCommand(
      'git',
      ['diff', '--no-color', '--no-ext-diff', '--unified=3', '--no-index', '--', '/dev/null', file],
      { cwd: root, timeout: DIFF_TIMEOUT_MS, maxBuffer: DIFF_BUFFER_BYTES }
    );
    if (result.code === 0 || result.code === 1) {
      const chunk = result.stdout.trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
    }
  }
  return chunks.join('\n');
}

function untrackedStat(root: string, untracked: readonly string[]): string {
  return untracked
    .map((file) => {
      const lines = fs.readFileSync(path.join(root, file), 'utf-8').split('\n').length;
      return ` ${file} | nuevo, ${lines} líneas`;
    })
    .join('\n');
}

/**
 * Diff del árbol de trabajo frente a HEAD, en el estilo que usa Aider para dar
 * contexto al modelo. Incluye los archivos nuevos sin seguimiento, así que el
 * subagente no necesita `git status`. Devuelve `undefined` si no es un repo o no
 * hay cambios. Los artefactos del run y del grafo no se incluyen.
 */
export async function workingTreeDiff(
  root: string,
  files: readonly string[] = [],
  maxChars = MAX_DIFF_CHARS
): Promise<string | undefined> {
  const [tracked, untracked] = await Promise.all([
    trackedDiff(root, files, false),
    untrackedFiles(root, files).then((list) => untrackedDiff(root, list))
  ]);
  const diff = redactSecrets([tracked, untracked].filter((part) => part.length > 0).join('\n')).trim();
  return diff.length > 0 ? truncateDiff(diff, maxChars) : undefined;
}

/**
 * Resumen `--stat` del mismo diff, con los archivos nuevos al final. Es el nivel
 * barato para quien solo necesita saber qué cambió, no cómo.
 */
export async function workingTreeStat(
  root: string,
  files: readonly string[] = [],
  maxChars = MAX_DIFF_CHARS
): Promise<string | undefined> {
  const [tracked, untracked] = await Promise.all([
    trackedDiff(root, files, true),
    untrackedFiles(root, files).then((list) => untrackedStat(root, list))
  ]);
  const stat = [tracked, untracked].filter((part) => part.length > 0).join('\n');
  return stat.trim().length > 0 ? truncateDiff(stat, maxChars) : undefined;
}
