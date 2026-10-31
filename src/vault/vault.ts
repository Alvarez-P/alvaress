import path from 'node:path';
import { OPENSPEC_FILENAME } from '../constants.js';
import {
  ensureHarnessDirs,
  getManifestPath,
  getTasksDir,
  inferProjectName,
  loadManifest
} from '../openspec/manifest.js';
import type { OpenSpecManifest } from '../openspec/types.js';
import {
  ensureDir,
  linkDirectory,
  linkFile,
  pathExists,
  readTextFile,
  writeTextFileAtomic,
  writeTextFileIfMissing
} from '../utils/fs.js';
import type { LinkResult } from '../utils/fs.js';
import { redactSecrets } from '../utils/redact.js';

export interface VaultConnection {
  vaultPath: string;
  harnessDir: string;
  tasksLink: string;
  tasksLinkResult: LinkResult;
  notePath: string;
  taskIndexPath?: string;
  manifestLink?: string;
  manifestLinkResult?: LinkResult;
}

export interface VaultCurrentState {
  objective?: string;
  architecture?: string;
  decisions?: string;
  risks?: string;
  next?: string;
}

function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

export function getVaultNotePath(vaultPath: string, projectName: string): string {
  return path.join(vaultPath, 'Harness', `${safeFileName(projectName)}.md`);
}

export function getVaultTaskIndexPath(vaultPath: string): string {
  return path.join(vaultPath, 'Harness', 'Tasks Index.md');
}

export function renderVaultNote(projectName: string): string {
  return [
    '---',
    `project: "${projectName}"`,
    'harness: true',
    'status: active',
    `last_updated: "${new Date().toISOString()}"`,
    '---',
    '',
    `# ${projectName}`,
    '',
    '- Tareas: [[Tasks]]',
    `- Manifest: ${OPENSPEC_FILENAME}`,
    '',
    '## Estado actual',
    '',
    '- Objetivo: (pendiente)',
    '- Arquitectura: (pendiente)',
    '- Decisiones vigentes: (pendiente)',
    '- Riesgos abiertos: (pendiente)',
    '- Próximos pasos: (pendiente)',
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
  state?: VaultCurrentState;
}

function updateCurrentState(note: string, state: VaultCurrentState): string {
  const replacements: Array<[RegExp, string]> = [
    [/^- Objetivo:.*$/m, `- Objetivo: ${redactSecrets(state.objective ?? '(pendiente)')}`],
    [/^- Arquitectura:.*$/m, `- Arquitectura: ${redactSecrets(state.architecture ?? '(pendiente)')}`],
    [/^- Decisiones vigentes:.*$/m, `- Decisiones vigentes: ${redactSecrets(state.decisions ?? '(pendiente)')}`],
    [/^- Riesgos abiertos:.*$/m, `- Riesgos abiertos: ${redactSecrets(state.risks ?? '(pendiente)')}`],
    [/^- Próximos pasos:.*$/m, `- Próximos pasos: ${redactSecrets(state.next ?? '(pendiente)')}`]
  ];
  let result = note;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function updateTimestamp(note: string): string {
  const timestamp = new Date().toISOString();
  if (/^last_updated:.*$/m.test(note)) {
    return note.replace(/^last_updated:.*$/m, `last_updated: "${timestamp}"`);
  }
  return note.replace(/^---\n/m, `---\nlast_updated: "${timestamp}"\n`);
}

export function appendVaultNoteEntry(notePath: string, entry: VaultNoteEntry): void {
  const timestamp = entry.timestamp ?? new Date().toISOString();
  const heading = entry.task === undefined ? timestamp : `${timestamp} · ${entry.task}`;
  const lines = ['', `### ${heading}`, '', `- Resumen: ${redactSecrets(entry.summary)}`];
  if (entry.validation !== undefined && entry.validation.length > 0) {
    lines.push(`- Validación: ${redactSecrets(entry.validation)}`);
  }
  if (entry.risks !== undefined && entry.risks.length > 0) {
    lines.push(`- Riesgos: ${redactSecrets(entry.risks)}`);
  }
  if (entry.next !== undefined && entry.next.length > 0) {
    lines.push(`- Siguiente: ${redactSecrets(entry.next)}`);
  }

  let current = pathExists(notePath)
    ? readTextFile(notePath)
    : renderVaultNote(path.basename(notePath, '.md'));
  if (!current.includes('## Registro')) {
    current = `${current.trimEnd()}\n\n## Registro\n`;
  }
  if (entry.state !== undefined) {
    current = updateCurrentState(current, entry.state);
  }
  current = updateTimestamp(current);
  writeTextFileAtomic(notePath, `${current.trimEnd()}\n${lines.join('\n')}\n`);
}

export function renderTaskIndex(manifest: OpenSpecManifest): string {
  const lines = [
    '# Índice de tareas',
    '',
    '| Spec | Tarea | Estado | Contexto | Dependencias |',
    '| --- | --- | --- | --- | --- |'
  ];
  for (const spec of manifest.specs) {
    if (spec.tasks.length === 0) {
      lines.push(`| ${spec.id} | (sin tareas) | ${spec.status} | ${spec.context} | - |`);
      continue;
    }
    for (const task of spec.tasks) {
      const dependencies = task.depends_on && task.depends_on.length > 0 ? task.depends_on.join(', ') : '-';
      lines.push(
        `| ${spec.id} | [[Tasks/${task.id}\\|${task.id}]] | ${task.status} | ${spec.context} | ${dependencies} |`
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

export function connectVault(root: string, vaultPath: string): VaultConnection {
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

  let taskIndexPath: string | undefined;
  try {
    const manifest = loadManifest(root);
    taskIndexPath = getVaultTaskIndexPath(vaultPath);
    writeTextFileAtomic(taskIndexPath, renderTaskIndex(manifest));
  } catch {
    taskIndexPath = undefined;
  }

  return {
    vaultPath,
    harnessDir,
    tasksLink,
    tasksLinkResult,
    notePath,
    taskIndexPath,
    manifestLink,
    manifestLinkResult
  };
}
