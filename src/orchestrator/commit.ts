import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { OPENSPEC_FILENAME } from '../constants.js';
import type { CommitResult, RunMode } from '../core/contracts.js';
import { isRunArtifact } from './diff.js';

export interface CommitOptions {
  root: string;
  files: string[];
  request?: string;
  taskId?: string;
  mode?: RunMode;
  message?: string;
  noVerify?: boolean;
  extraFiles?: string[];
}

function shortRequest(request: string | undefined): string {
  if (request === undefined) {
    return 'cierra el run';
  }
  const normalized = request.replace(/\s+/g, ' ').trim().replace(/[.。]+$/, '');
  return normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized;
}

export function buildCommitMessage(options: {
  request?: string;
  taskId?: string;
  mode?: RunMode;
}): string {
  const subject =
    options.taskId !== undefined
      ? `completa ${options.taskId} - ${shortRequest(options.request)}`
      : `aplica ${shortRequest(options.request)}`;
  const header = `chore(alvaress): ${subject}`.slice(0, 72);
  return [
    header,
    '',
    'Generado por alvaress.',
    ...(options.mode !== undefined ? [`Modo: ${options.mode}`] : []),
    ...(options.taskId !== undefined ? [`Tarea: ${options.taskId}`] : [])
  ].join('\n');
}

function git(
  root: string,
  args: string[]
): { code: number; stdout: string; stderr: string } {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf-8',
    timeout: 30_000,
    maxBuffer: 10 * 1024 * 1024
  });
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? result.error?.message ?? ''
  };
}

function normalize(file: string): string {
  return path.normalize(file).replaceAll('\\', '/').replace(/^\.\//, '');
}

export function commitRun(options: CommitOptions): CommitResult {
  const candidates = [...options.files, ...(options.extraFiles ?? [])]
    .map(normalize)
    .filter((file) => file.length > 0 && !isRunArtifact(file));
  const files = [...new Set(candidates)];

  if (files.length === 0) {
    return { committed: false, message: 'El run no dejó archivos para commitear.', files: [] };
  }

  const inside = git(options.root, ['rev-parse', '--is-inside-work-tree']);
  if (inside.code !== 0 || inside.stdout.trim() !== 'true') {
    return {
      committed: false,
      message: 'El proyecto no es un repositorio git; se omite el commit.',
      files
    };
  }

  const add = git(options.root, ['add', '-A', '--', ...files]);
  if (add.code !== 0) {
    return {
      committed: false,
      message: `No se pudieron preparar los archivos: ${add.stderr.trim() || add.stdout.trim()}`,
      files
    };
  }

  const staged = git(options.root, ['diff', '--cached', '--name-only']);
  const stagedFiles = staged.stdout
    .split('\n')
    .map((file) => file.trim())
    .filter((file) => file.length > 0);

  if (stagedFiles.length === 0) {
    return { committed: false, message: 'No había cambios nuevos que commitear.', files: [] };
  }

  const message =
    options.message ??
    buildCommitMessage({
      ...(options.request !== undefined ? { request: options.request } : {}),
      ...(options.taskId !== undefined ? { taskId: options.taskId } : {}),
      ...(options.mode !== undefined ? { mode: options.mode } : {})
    });
  const commit = git(options.root, [
    'commit',
    '-m',
    message,
    ...(options.noVerify === true ? ['--no-verify'] : []),
    '--',
    ...stagedFiles
  ]);

  if (commit.code !== 0) {
    return {
      committed: false,
      message: `git commit falló: ${commit.stderr.trim() || commit.stdout.trim()}`,
      files: stagedFiles
    };
  }

  const head = git(options.root, ['rev-parse', '--short', 'HEAD']);
  return {
    committed: true,
    ...(head.code === 0 && head.stdout.trim().length > 0 ? { sha: head.stdout.trim() } : {}),
    message,
    files: stagedFiles
  };
}

export function openspecChanged(root: string): boolean {
  const status = git(root, ['status', '--porcelain', '--', OPENSPEC_FILENAME]);
  return status.code === 0 && status.stdout.trim().length > 0;
}
