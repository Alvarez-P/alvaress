import path from 'node:path';
import { OPENSPEC_FILENAME } from '../constants.js';
import { getManifestPath, getTasksDir, inferProjectName, ensureHarnessDirs } from '../openspec/manifest.js';
import { ensureDir, linkDirectory, linkFile, pathExists, readTextFile, writeTextFile, writeTextFileIfMissing } from '../utils/fs.js';
import type { LinkResult } from '../utils/fs.js';

export interface VaultConnection {
  vaultPath: string;
  harnessDir: string;
  tasksLink: string;
  tasksLinkResult: LinkResult;
  notePath: string;
  manifestLink?: string;
  manifestLinkResult?: LinkResult;
}

function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

export function getVaultNotePath(vaultPath: string, projectName: string): string {
  return path.join(vaultPath, 'Harness', `${safeFileName(projectName)}.md`);
}

export function renderVaultNote(projectName: string): string {
  return [
    '---',
    `project: "${projectName}"`,
    'harness: true',
    '---',
    '',
    `# ${projectName}`,
    '',
    '- Tareas: [[Tasks]]',
    `- Manifest: ${OPENSPEC_FILENAME}`,
    '',
    '## Registro',
    ''
  ].join('\n');
}

export interface VaultNoteEntry {
  summary: string;
  task?: string;
  validation?: string;
  risks?: string;
  next?: string;
  timestamp?: string;
}

export function appendVaultNoteEntry(notePath: string, entry: VaultNoteEntry): void {
  const timestamp = entry.timestamp ?? new Date().toISOString();
  const heading = entry.task === undefined ? timestamp : `${timestamp} · ${entry.task}`;
  const lines = ['', `### ${heading}`, '', `- Resumen: ${entry.summary}`];
  if (entry.validation !== undefined && entry.validation.length > 0) {
    lines.push(`- Validación: ${entry.validation}`);
  }
  if (entry.risks !== undefined && entry.risks.length > 0) {
    lines.push(`- Riesgos: ${entry.risks}`);
  }
  if (entry.next !== undefined && entry.next.length > 0) {
    lines.push(`- Siguiente: ${entry.next}`);
  }

  const current = pathExists(notePath)
    ? readTextFile(notePath)
    : renderVaultNote(path.basename(notePath, '.md'));
  const base = current.includes('## Registro')
    ? current.trimEnd()
    : `${current.trimEnd()}\n\n## Registro`;
  writeTextFile(notePath, `${base}\n${lines.join('\n')}\n`);
}

export function connectObsidianVault(root: string, vaultPath: string): VaultConnection {
  ensureDir(vaultPath);
  ensureHarnessDirs(root);

  const harnessDir = path.join(vaultPath, 'Harness');
  ensureDir(harnessDir);

  const tasksLink = path.join(harnessDir, 'Tasks');
  const tasksLinkResult = linkDirectory(getTasksDir(root), tasksLink);

  const projectName = inferProjectName(root);
  const notePath = getVaultNotePath(vaultPath, projectName);
  writeTextFileIfMissing(notePath, renderVaultNote(projectName));

  let manifestLink: string | undefined;
  let manifestLinkResult: LinkResult | undefined;
  const manifestPath = getManifestPath(root);
  if (pathExists(manifestPath)) {
    manifestLink = path.join(harnessDir, OPENSPEC_FILENAME);
    manifestLinkResult = linkFile(manifestPath, manifestLink);
  }

  return { vaultPath, harnessDir, tasksLink, tasksLinkResult, notePath, manifestLink, manifestLinkResult };
}
