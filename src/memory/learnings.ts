import crypto from 'node:crypto';
import path from 'node:path';
import {
  GLOBAL_MEMORY_DIR,
  GLOBAL_MEMORY_FILENAME,
  GLOBAL_PLAYBOOK_FILENAME,
  HARNESS_DIR,
  MEMORY_DIR_ENV
} from '../constants.js';
import { ensureDir, pathExists, readJsonFile, writeJsonFile, writeTextFileAtomic } from '../utils/fs.js';
import { redactSecrets } from '../utils/redact.js';

export const LEARNING_KINDS = ['step', 'solution', 'pitfall', 'preference', 'improvement'] as const;
export type LearningKind = (typeof LEARNING_KINDS)[number];

const KIND_LABELS: Record<LearningKind, string> = {
  step: 'Pasos reutilizables',
  solution: 'Soluciones',
  pitfall: 'Trampas y errores',
  preference: 'Preferencias',
  improvement: 'Mejoras propuestas al agente'
};

const MAX_PLAYBOOK_ENTRIES = 120;
const MAX_TAGS = 8;
const MIN_TITLE_LENGTH = 5;
const MIN_BODY_LENGTH = 20;
const GENERIC_TITLES = new Set([
  'aprendizaje',
  'mejora',
  'nota',
  'cambio',
  'fix',
  'update',
  'varios',
  'cosas',
  'tarea completada'
]);

export interface Learning {
  id: string;
  kind: LearningKind;
  title: string;
  body: string;
  tags: string[];
  project: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  uses: number;
}

export interface MemoryPaths {
  dir: string;
  store: string;
  playbook: string;
}

export type LearningScope = 'global' | 'project';
export type LearningScopeFilter = LearningScope | 'all';

export interface ScopedLearning extends Learning {
  scope: LearningScope;
}

export interface MemoryStores {
  global: MemoryPaths;
  project: MemoryPaths;
}

export interface PromoteResult {
  learning: Learning;
  created: boolean;
}

export interface AddLearningInput {
  kind: LearningKind;
  title: string;
  body?: string;
  tags?: string[];
  project?: string;
  source?: string;
}

export interface AddLearningResult {
  learning: Learning;
  created: boolean;
}

export interface LearningFilter {
  kind?: LearningKind;
  tag?: string;
  limit?: number;
}

export interface PruneOptions {
  keep?: number;
  maxAgeDays?: number;
  dryRun?: boolean;
  now?: Date;
}

export interface PruneResult {
  removed: Learning[];
  kept: number;
}

interface LearningStoreFile {
  version: number;
  learnings: Learning[];
}

export function getMemoryPaths(dir?: string): MemoryPaths {
  const configured = dir ?? process.env[MEMORY_DIR_ENV];
  const resolved = configured !== undefined && configured.trim().length > 0
    ? path.resolve(configured.trim())
    : GLOBAL_MEMORY_DIR;
  return {
    dir: resolved,
    store: path.join(resolved, GLOBAL_MEMORY_FILENAME),
    playbook: path.join(resolved, GLOBAL_PLAYBOOK_FILENAME)
  };
}

/** Store de aprendizajes propio del proyecto: `<root>/.harness/memory/`. */
export function getProjectMemoryPaths(root: string): MemoryPaths {
  return getMemoryPaths(path.join(root, HARNESS_DIR, 'memory'));
}

export function getMemoryStores(
  root: string,
  options: { globalDir?: string; projectDir?: string } = {}
): MemoryStores {
  return {
    global: getMemoryPaths(options.globalDir),
    project:
      options.projectDir !== undefined && options.projectDir.trim().length > 0
        ? getMemoryPaths(options.projectDir)
        : getProjectMemoryPaths(root)
  };
}

export function isLearningKind(value: string): value is LearningKind {
  return (LEARNING_KINDS as readonly string[]).includes(value);
}

export function assertLearningKind(value: string): LearningKind {
  if (!isLearningKind(value)) {
    throw new Error(`Tipo de aprendizaje desconocido: "${value}". Usa ${LEARNING_KINDS.join(', ')}.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeStored(value: unknown): Learning | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string') {
    return undefined;
  }
  if (typeof value.kind !== 'string' || !isLearningKind(value.kind)) {
    return undefined;
  }
  return {
    id: value.id,
    kind: value.kind,
    title: value.title,
    body: asString(value.body),
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    project: asString(value.project) || 'global',
    source: typeof value.source === 'string' && value.source.length > 0 ? value.source : undefined,
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
    lastUsedAt: typeof value.lastUsedAt === 'string' && value.lastUsedAt.length > 0 ? value.lastUsedAt : undefined,
    uses: asNumber(value.uses)
  };
}

export function loadLearnings(paths: MemoryPaths = getMemoryPaths()): Learning[] {
  if (!pathExists(paths.store)) {
    return [];
  }
  const raw = readJsonFile<unknown>(paths.store);
  const entries = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.learnings)
      ? raw.learnings
      : [];
  return entries
    .map((entry) => normalizeStored(entry))
    .filter((entry): entry is Learning => entry !== undefined);
}

function stripScope(learning: Learning): Learning {
  if (!('scope' in learning)) {
    return learning;
  }
  const copy = { ...learning } as Learning & { scope?: LearningScope };
  delete copy.scope;
  return copy;
}

export function saveLearnings(learnings: Learning[], paths: MemoryPaths = getMemoryPaths()): void {
  ensureDir(paths.dir);
  const store: LearningStoreFile = { version: 1, learnings: learnings.map(stripScope) };
  writeJsonFile(paths.store, store);
}

export function normalizeTags(tags: string[] | undefined): string[] {
  if (tags === undefined) {
    return [];
  }
  const normalized: string[] = [];
  for (const tag of tags) {
    for (const part of tag.split(',')) {
      const value = part.trim().replace(/^#+/, '').toLowerCase();
      if (value.length > 0 && !normalized.includes(value)) {
        normalized.push(value);
      }
    }
  }
  return normalized.slice(0, MAX_TAGS);
}

function learningId(kind: LearningKind, title: string): string {
  const digest = crypto.createHash('sha256').update(`${kind}:${title.toLowerCase()}`).digest('hex');
  return `L-${digest.slice(0, 8)}`;
}

export function assessLearning(input: AddLearningInput): string | undefined {
  const title = input.title.trim();
  const body = (input.body ?? '').trim();
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ');
  const normalizedBody = body.toLowerCase().replace(/\s+/g, ' ');

  if (title.length < MIN_TITLE_LENGTH) {
    return `El título debe tener al menos ${MIN_TITLE_LENGTH} caracteres y describir el aprendizaje.`;
  }
  if (title.length > 120) {
    return 'El título no debe superar 120 caracteres.';
  }
  if (GENERIC_TITLES.has(normalizedTitle)) {
    return 'El título es demasiado genérico; describe el problema y la solución concreta.';
  }
  if (body.length < MIN_BODY_LENGTH) {
    return `El detalle debe tener al menos ${MIN_BODY_LENGTH} caracteres; un título suelto no es reutilizable.`;
  }
  if (normalizedBody === normalizedTitle) {
    return 'El detalle repite el título; explica qué hacer y por qué funciona.';
  }
  if (redactSecrets(`${title}\n${body}`) !== `${title}\n${body}`) {
    return 'El aprendizaje parece contener un secreto; quita claves, tokens o credenciales.';
  }
  return undefined;
}

export function addLearning(
  input: AddLearningInput,
  paths: MemoryPaths = getMemoryPaths(),
  now: Date = new Date()
): AddLearningResult {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error('El aprendizaje necesita un título.');
  }

  const rejection = assessLearning(input);
  if (rejection !== undefined) {
    throw new Error(`Aprendizaje descartado: ${rejection}`);
  }

  const kind = assertLearningKind(input.kind);
  const learnings = loadLearnings(paths);
  const id = learningId(kind, title);
  const timestamp = now.toISOString();
  const existing = learnings.find((entry) => entry.id === id);

  if (existing !== undefined) {
    const body = (input.body ?? '').trim();
    existing.body = body.length > existing.body.length ? body : existing.body;
    existing.tags = normalizeTags([...existing.tags, ...(input.tags ?? [])]);
    existing.project = input.project?.trim() || existing.project;
    existing.source = input.source?.trim() || existing.source;
    existing.updatedAt = timestamp;
    saveLearnings(learnings, paths);
    rebuildPlaybook(paths, learnings, now);
    return { learning: existing, created: false };
  }

  const learning: Learning = {
    id,
    kind,
    title,
    body: (input.body ?? '').trim(),
    tags: normalizeTags(input.tags),
    project: input.project?.trim() || 'global',
    source: input.source?.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
    uses: 0
  };
  learnings.push(learning);
  saveLearnings(learnings, paths);
  rebuildPlaybook(paths, learnings, now);
  return { learning, created: true };
}

function rank(learning: Learning): number {
  const stamp = Date.parse(learning.lastUsedAt ?? learning.updatedAt ?? learning.createdAt);
  return learning.uses * 1_000_000 + (Number.isNaN(stamp) ? 0 : stamp);
}

function compareRank(a: Learning, b: Learning): number {
  return rank(b) - rank(a);
}

export function sortLearnings<T extends Learning>(learnings: T[]): T[] {
  return learnings.toSorted(compareRank);
}

export function searchLearnings<T extends Learning>(
  learnings: T[],
  query: string,
  limit = 10
): T[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  if (terms.length === 0) {
    return sortLearnings(learnings).slice(0, limit);
  }

  const scored = learnings
    .map((learning) => {
      const title = learning.title.toLowerCase();
      const body = learning.body.toLowerCase();
      const tags = learning.tags.join(' ');
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) {
          score += 5;
        }
        if (tags.includes(term)) {
          score += 3;
        }
        if (body.includes(term)) {
          score += 1;
        }
      }
      return { learning, score };
    })
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => b.score - a.score || compareRank(a.learning, b.learning));
  return scored.slice(0, limit).map((entry) => entry.learning);
}

export function filterLearnings<T extends Learning>(
  learnings: T[],
  filter: LearningFilter = {}
): T[] {
  const tag = filter.tag?.trim().replace(/^#+/, '').toLowerCase();
  const filtered = learnings.filter((learning) => {
    if (filter.kind !== undefined && learning.kind !== filter.kind) {
      return false;
    }
    if (tag !== undefined && tag.length > 0 && !learning.tags.includes(tag)) {
      return false;
    }
    return true;
  });
  const sorted = sortLearnings(filtered);
  return filter.limit !== undefined ? sorted.slice(0, filter.limit) : sorted;
}

export function findLearning(learnings: Learning[], id: string): Learning | undefined {
  const query = id.trim().toLowerCase();
  if (query.length === 0) {
    return undefined;
  }
  const exact = learnings.find((learning) => learning.id.toLowerCase() === query);
  if (exact !== undefined) {
    return exact;
  }
  const matches = learnings.filter((learning) => learning.id.toLowerCase().startsWith(query));
  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Carga y fusiona los dos stores. El del proyecto gana cuando ambos tienen el
 * mismo id, porque describe el contexto concreto donde se está trabajando.
 */
export function loadScopedLearnings(
  stores: MemoryStores,
  scope: LearningScopeFilter = 'all'
): ScopedLearning[] {
  const byId = new Map<string, ScopedLearning>();

  if (scope !== 'project') {
    for (const learning of loadLearnings(stores.global)) {
      byId.set(learning.id, { ...learning, scope: 'global' });
    }
  }
  if (scope !== 'global') {
    for (const learning of loadLearnings(stores.project)) {
      byId.set(learning.id, { ...learning, scope: 'project' });
    }
  }

  return sortLearnings([...byId.values()]);
}

export function findScopedLearning(
  stores: MemoryStores,
  id: string
): ScopedLearning | undefined {
  const project = findLearning(loadLearnings(stores.project), id);
  if (project !== undefined) {
    return { ...project, scope: 'project' };
  }
  const global = findLearning(loadLearnings(stores.global), id);
  return global !== undefined ? { ...global, scope: 'global' } : undefined;
}

export function recordScopedLearningUse(
  id: string,
  stores: MemoryStores,
  now: Date = new Date()
): ScopedLearning {
  const project = loadLearnings(stores.project);
  const projectMatch = findLearning(project, id);
  if (projectMatch !== undefined) {
    projectMatch.uses += 1;
    projectMatch.lastUsedAt = now.toISOString();
    saveLearnings(project, stores.project);
    rebuildPlaybook(stores.project, loadScopedLearnings(stores, 'all'), now, 'project');
    return { ...projectMatch, scope: 'project' };
  }

  const global = loadLearnings(stores.global);
  const globalMatch = findLearning(global, id);
  if (globalMatch === undefined) {
    throw new Error(`No existe el aprendizaje "${id}". Usa "alvaress learn list".`);
  }
  globalMatch.uses += 1;
  globalMatch.lastUsedAt = now.toISOString();
  saveLearnings(global, stores.global);
  rebuildPlaybook(stores.global, global, now, 'global');
  return { ...globalMatch, scope: 'global' };
}

/** Copia un aprendizaje del proyecto al store global sin borrarlo del proyecto. */
export function promoteLearning(
  id: string,
  stores: MemoryStores,
  now: Date = new Date()
): PromoteResult {
  const project = loadLearnings(stores.project);
  const source = findLearning(project, id);
  if (source === undefined) {
    const alreadyGlobal = findLearning(loadLearnings(stores.global), id);
    if (alreadyGlobal !== undefined) {
      throw new Error(`El aprendizaje "${id}" ya vive en el store global.`);
    }
    throw new Error(`No existe el aprendizaje "${id}" en el proyecto.`);
  }

  const global = loadLearnings(stores.global);
  const timestamp = now.toISOString();
  const existing = global.find((entry) => entry.id === source.id);

  if (existing !== undefined) {
    existing.body = source.body.length > existing.body.length ? source.body : existing.body;
    existing.tags = normalizeTags([...existing.tags, ...source.tags]);
    existing.uses = Math.max(existing.uses, source.uses);
    existing.source = source.source ?? existing.source;
    existing.updatedAt = timestamp;
    saveLearnings(global, stores.global);
    rebuildPlaybook(stores.global, global, now, 'global');
    return { learning: existing, created: false };
  }

  const promoted: Learning = { ...source, updatedAt: timestamp };
  global.push(promoted);
  saveLearnings(global, stores.global);
  rebuildPlaybook(stores.global, global, now, 'global');
  return { learning: promoted, created: true };
}

export function recordLearningUse(
  id: string,
  paths: MemoryPaths = getMemoryPaths(),
  now: Date = new Date()
): Learning {
  const learnings = loadLearnings(paths);
  const learning = findLearning(learnings, id);
  if (learning === undefined) {
    throw new Error(`No existe el aprendizaje "${id}". Usa "alvaress learn list".`);
  }
  learning.uses += 1;
  learning.lastUsedAt = now.toISOString();
  saveLearnings(learnings, paths);
  rebuildPlaybook(paths, learnings, now);
  return learning;
}

export function pruneLearnings(
  paths: MemoryPaths = getMemoryPaths(),
  options: PruneOptions = {}
): PruneResult {
  const keep = options.keep ?? 100;
  if (!Number.isInteger(keep) || keep < 1) {
    throw new Error('El valor de --keep debe ser un entero mayor o igual a 1.');
  }

  const now = options.now ?? new Date();
  const cutoff = options.maxAgeDays !== undefined && options.maxAgeDays > 0
    ? now.getTime() - options.maxAgeDays * 24 * 60 * 60 * 1000
    : undefined;

  const learnings = loadLearnings(paths);
  const ranked = sortLearnings(learnings);
  const kept: Learning[] = [];
  const removed: Learning[] = [];

  for (const learning of ranked) {
    const stamp = Date.parse(learning.lastUsedAt ?? learning.updatedAt ?? learning.createdAt);
    const tooOld = cutoff !== undefined && learning.uses === 0 && !Number.isNaN(stamp) && stamp < cutoff;
    if (kept.length >= keep || tooOld) {
      removed.push(learning);
    } else {
      kept.push(learning);
    }
  }

  if (!options.dryRun && removed.length > 0) {
    saveLearnings(kept, paths);
    rebuildPlaybook(paths, kept, now);
  }

  return { removed, kept: kept.length };
}

export function renderPlaybook(
  learnings: Learning[],
  now: Date = new Date(),
  playbookScope: LearningScope = 'global'
): string {
  const ranked = sortLearnings(learnings);
  const visible = ranked.slice(0, MAX_PLAYBOOK_ENTRIES);
  const intro =
    playbookScope === 'project'
      ? 'Aprendizajes del proyecto y globales reutilizables. Se generan con'
      : 'Aprendizajes globales que el agente reutiliza entre proyectos. Se generan con';
  const lines = [
    '# Playbook de alvaress',
    '',
    `${intro}`,
    '`alvaress learn`; no edites este archivo a mano.',
    '',
    `Generado: ${now.toISOString()}`,
    `Entradas: ${visible.length} de ${ranked.length}`,
    ''
  ];

  if (visible.length === 0) {
    lines.push('Todavía no hay aprendizajes. El agente los añade al cerrar tareas.', '');
    return lines.join('\n');
  }

  for (const kind of LEARNING_KINDS) {
    const group = visible.filter((learning) => learning.kind === kind);
    if (group.length === 0) {
      continue;
    }
    lines.push(`## ${KIND_LABELS[kind]}`, '');
    for (const learning of group) {
      lines.push(`### ${learning.title}`, '');
      const entryScope = (learning as ScopedLearning).scope;
      const meta = [
        `\`${learning.id}\``,
        learning.project,
        ...(entryScope !== undefined ? [entryScope] : []),
        `usos: ${learning.uses}`
      ];
      lines.push(meta.join(' · '), '');
      if (learning.body.length > 0) {
        lines.push(learning.body, '');
      }
      if (learning.tags.length > 0) {
        lines.push(`Tags: ${learning.tags.map((tag) => `\`${tag}\``).join(', ')}`, '');
      }
    }
  }

  if (ranked.length > visible.length) {
    lines.push(
      `Hay ${ranked.length - visible.length} aprendizaje(s) más. Búscalos con \`alvaress learn search "<tema>"\`.`,
      ''
    );
  }

  return lines.join('\n');
}

export function rebuildPlaybook(
  paths: MemoryPaths = getMemoryPaths(),
  learnings: Learning[] = loadLearnings(paths),
  now: Date = new Date(),
  playbookScope: LearningScope = 'global'
): string {
  ensureDir(paths.dir);
  const content = renderPlaybook(learnings, now, playbookScope);
  writeTextFileAtomic(paths.playbook, content);
  return content;
}

export function formatLearning(learning: Learning): string {
  const entryScope = (learning as ScopedLearning).scope;
  const meta = [
    learning.id,
    learning.kind,
    learning.project,
    ...(entryScope !== undefined ? [`scope: ${entryScope}`] : []),
    `usos: ${learning.uses}`
  ];
  const lines = [`${learning.title}`, meta.join(' · ')];
  if (learning.body.length > 0) {
    lines.push(learning.body);
  }
  if (learning.tags.length > 0) {
    lines.push(`tags: ${learning.tags.join(', ')}`);
  }
  if (learning.source !== undefined) {
    lines.push(`fuente: ${learning.source}`);
  }
  return lines.join('\n');
}
