import path from 'node:path';
import type { HarnessConfig } from '../config/loader.js';
import { OPENSPEC_FILENAME } from '../constants.js';
import type { Exploration, Risk, RouteDecision, RunRequest } from '../core/contracts.js';
import { getMemoryStores, loadScopedLearnings, searchLearnings } from '../memory/learnings.js';
import {
  collectWorkItems,
  contextPath,
  ensureTaskFile,
  findWorkItem,
  inferProjectName,
  loadManifest,
  taskFilePath
} from '../openspec/manifest.js';
import type { WorkItem } from '../openspec/types.js';
import { getVaultNotePath } from '../vault/vault.js';
import { pathExists, readTextFile } from '../utils/fs.js';
import type { RunLog } from './run-log.js';

export interface ExploreContext {
  root: string;
  config: HarnessConfig;
  log: RunLog;
}

const STOPWORDS = new Set([
  'para',
  'como',
  'este',
  'esta',
  'esto',
  'desde',
  'hacia',
  'sobre',
  'entre',
  'cuando',
  'donde',
  'hacer',
  'tiene',
  'debe',
  'cada',
  'todo',
  'toda',
  'todos',
  'todas',
  'unos',
  'unas',
  'más',
  'mas',
  'con',
  'por',
  'del',
  'las',
  'los',
  'una',
  'que'
]);

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9áéíóúñü]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token));
}

export function extractSection(note: string, heading: RegExp): string[] {
  const lines = note.split('\n');
  const result: string[] = [];
  let active = false;
  for (const line of lines) {
    if (heading.test(line)) {
      active = true;
      continue;
    }
    if (active && /^#{1,6}\s+/.test(line)) {
      break;
    }
    if (active) {
      result.push(line);
    }
  }
  return result;
}

export function parseChecklist(note: string): string[] {
  const items: string[] = [];
  for (const line of note.split('\n')) {
    const match = /^\s*[-*]\s*\[([ xX])\]\s+(.+)$/.exec(line);
    if (match === null) {
      continue;
    }
    const item = match[2]?.trim() ?? '';
    if (match[1] === ' ' && item.length > 0) {
      items.push(item);
    }
  }
  return items;
}

export function parseAcceptance(note: string, fallback: string): string[] {
  const checklist = parseChecklist(note);
  if (checklist.length > 0) {
    return checklist;
  }

  const section = extractSection(note, /^#{1,6}\s+Criterios de aceptaci[oó]n/i);
  const items = section
    .map((line) => /^\s*[-*]\s+(.+)$/.exec(line)?.[1]?.replace(/^\[[ xX]\]\s*/, '').trim())
    .filter((item): item is string => item !== undefined && item.length > 0);
  return items.length > 0 ? items : [fallback];
}

export function extractAssignedFiles(note: string): string[] {
  const files: string[] = [];
  const section = extractSection(note, /^#{1,6}\s+Archivos asignados/i);
  for (const line of section) {
    const match = /^\s*[-*]\s+(.+)$/.exec(line);
    if (match === null) {
      continue;
    }
    const value = (match[1] ?? '').replace(/`/g, '').trim();
    if (value.length === 0 || value.startsWith('(')) {
      continue;
    }
    files.push(value);
  }

  const inline = /^\s*[-*]\s*Archivos?\s*:\s*(.+)$/im.exec(note);
  if (inline !== null) {
    for (const part of (inline[1] ?? '').split(',')) {
      const value = part.replace(/`/g, '').trim();
      if (value.length > 0) {
        files.push(value);
      }
    }
  }

  return [...new Set(files)];
}

export function extractOpenRisks(note: string): string[] {
  const risks: string[] = [];
  const pattern = /^\s*[-*]\s*Riesgos?(?:\s+abiertos)?\s*:\s*(.+)$/gim;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(note)) !== null) {
    const value = (match[1] ?? '').trim();
    if (value.length === 0 || /^\(?(?:pendiente|ninguno|ninguna)\)?\.?$/i.test(value)) {
      continue;
    }
    risks.push(value);
  }
  return risks;
}

export function markChecklistDone(note: string, items: string[]): string {
  const targets = new Set(items.map(normalize));
  if (targets.size === 0) {
    return note;
  }

  return note
    .split('\n')
    .map((line) => {
      const match = /^(\s*[-*]\s*)\[ \](\s+)(.+)$/.exec(line);
      if (match === null) {
        return line;
      }
      const item = (match[3] ?? '').trim();
      if (!targets.has(normalize(item))) {
        return line;
      }
      return `${match[1] ?? ''}[x]${match[2] ?? ' '}${match[3] ?? ''}`;
    })
    .join('\n');
}

export function resolveOddNote(
  root: string,
  vaultPath: string,
  taskId?: string
): string | undefined {
  if (taskId !== undefined) {
    if (vaultPath.length > 0) {
      const taskNote = path.join(vaultPath, 'Harness', 'Tasks', `${taskId}.md`);
      if (pathExists(taskNote)) {
        return taskNote;
      }
    }
    const localTask = taskFilePath(taskId, root);
    if (pathExists(localTask)) {
      return localTask;
    }
  }

  if (vaultPath.length > 0) {
    const projectNote = getVaultNotePath(vaultPath, inferProjectName(root));
    if (pathExists(projectNote)) {
      return projectNote;
    }
  }

  return undefined;
}

function relevantLearnings(
  root: string,
  request: string,
  description: string
): Array<{ id: string; title: string }> {
  try {
    const stores = getMemoryStores(root);
    const learnings = loadScopedLearnings(stores, 'all');
    if (learnings.length === 0) {
      return [];
    }
    return searchLearnings(learnings, `${request} ${description}`.trim(), 3).map((learning) => ({
      id: learning.id,
      title: learning.title
    }));
  } catch {
    return [];
  }
}

function taskExploration(
  root: string,
  request: RunRequest,
  item: WorkItem,
  config: HarnessConfig
): Exploration {
  const boundedContextPath = contextPath(
    { specification: '', project: '', specs: [item.spec] },
    item.spec.context
  );
  ensureTaskFile(item.spec, item.task, boundedContextPath, root);

  const risks: Risk[] = [];
  let blockedBy: string | undefined;

  if (item.task.status === 'Done') {
    blockedBy = `La tarea ${item.task.id} ya está en estado Done; no hay nada que ejecutar.`;
  }

  const pendingDependency = (item.task.depends_on ?? []).find((dependency) => {
    try {
      return findWorkItem(loadManifest(root), dependency).task.status !== 'Done';
    } catch {
      return true;
    }
  });
  if (blockedBy === undefined && pendingDependency !== undefined) {
    blockedBy = `La tarea ${item.task.id} depende de ${pendingDependency}, que todavía no está Done.`;
  }

  const files =
    request.files !== undefined && request.files.length > 0
      ? request.files
      : (item.task.files ?? []);

  if (files.length === 0) {
    risks.push({
      title: `La tarea ${item.task.id} no declara archivos; el alcance depende del worker.`,
      source: 'harness',
      severity: 'medium'
    });
  }

  const acceptance =
    item.task.acceptance !== undefined && item.task.acceptance.length > 0
      ? item.task.acceptance
      : [item.task.description];

  const validation =
    item.task.validation !== undefined && item.task.validation.length > 0
      ? item.task.validation
      : config.validation.commands;

  return {
    mode: 'sdd',
    taskId: item.task.id,
    source: `${OPENSPEC_FILENAME} · ${item.spec.id}/${item.task.id}`,
    acceptance,
    files,
    validation,
    learnings: relevantLearnings(root, request.request, item.task.description),
    risks,
    ...(blockedBy !== undefined ? { blockedBy } : {})
  };
}

function scoreTask(request: string, item: WorkItem): number {
  const terms = tokens(request);
  if (terms.length === 0) {
    return 0;
  }
  const text = normalize(
    `${item.spec.title} ${item.spec.context} ${item.task.description} ${(item.task.files ?? []).join(' ')}`
  );
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function pickPendingTask(items: WorkItem[], request: string): WorkItem {
  let best = items[0] as WorkItem;
  let bestScore = scoreTask(request, best);
  for (const item of items.slice(1)) {
    const score = scoreTask(request, item);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

async function exploreSdd(
  request: RunRequest,
  route: RouteDecision,
  context: ExploreContext
): Promise<Exploration> {
  const manifest = loadManifest(context.root);
  const pending = collectWorkItems(manifest);
  if (pending.length === 0) {
    return {
      mode: route.mode,
      source: OPENSPEC_FILENAME,
      acceptance: [request.request],
      files: request.files ?? [],
      validation: context.config.validation.commands,
      learnings: relevantLearnings(context.root, request.request, ''),
      risks: [],
      blockedBy: `No hay tareas pendientes en ${OPENSPEC_FILENAME}. Crea la spec y sus tareas primero.`
    };
  }

  const selected = pickPendingTask(pending, request.request);
  const exploration = taskExploration(context.root, request, selected, context.config);
  if (pending.length > 1) {
    exploration.risks.push({
      title: `Se eligió ${selected.task.id} entre ${pending.length} tareas pendientes; usa --task para fijar el alcance.`,
      source: 'harness',
      severity: 'medium'
    });
  }
  return exploration;
}

async function exploreOdd(
  request: RunRequest,
  route: RouteDecision,
  context: ExploreContext
): Promise<Exploration> {
  const notePath = resolveOddNote(
    context.root,
    context.config.vaultPath,
    request.taskId
  );

  if (notePath === undefined) {
    return {
      mode: route.mode,
      source: 'Bóveda',
      acceptance: [request.request],
      files: request.files ?? [],
      validation: context.config.validation.commands,
      learnings: relevantLearnings(context.root, request.request, ''),
      risks: [],
      blockedBy:
        'No se encontró la nota ODD. Configura vaultPath, crea la nota del proyecto o usa --mode sdd.'
    };
  }

  const note = readTextFile(notePath);
  const acceptance = parseAcceptance(note, request.request);
  const noteFiles = extractAssignedFiles(note);
  const files =
    request.files !== undefined && request.files.length > 0
      ? request.files
      : noteFiles;
  const risks: Risk[] = extractOpenRisks(note).map((risk) => ({
    title: risk,
    source: 'harness',
    severity: 'medium'
  }));

  if (parseChecklist(note).length === 0) {
    risks.push({
      title: 'La nota ODD no tiene checklist; se usó la petición como criterio de aceptación.',
      source: 'harness',
      severity: 'low'
    });
  }

  const source = path.relative(context.root, notePath) || notePath;
  context.log.line(`Nota ODD: ${source}`);

  return {
    mode: route.mode,
    source,
    acceptance,
    files,
    validation: context.config.validation.commands,
    learnings: relevantLearnings(context.root, request.request, note),
    risks
  };
}

export async function exploreRequest(
  request: RunRequest,
  route: RouteDecision,
  context: ExploreContext
): Promise<Exploration> {
  if (request.taskId !== undefined) {
    const manifest = loadManifest(context.root);
    const item = findWorkItem(manifest, request.taskId);
    return taskExploration(context.root, request, item, context.config);
  }

  return route.mode === 'sdd'
    ? exploreSdd(request, route, context)
    : exploreOdd(request, route, context);
}
