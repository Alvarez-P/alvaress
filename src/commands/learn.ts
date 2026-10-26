import path from 'node:path';
import {
  addLearning,
  assertLearningKind,
  filterLearnings,
  findLearning,
  formatLearning,
  getMemoryPaths,
  loadLearnings,
  pruneLearnings,
  rebuildPlaybook,
  recordLearningUse,
  searchLearnings
} from '../memory/learnings.js';
import type { Learning, MemoryPaths } from '../memory/learnings.js';
import { flagEnabled, parseArgs } from '../utils/args.js';

const HELP = `alvaress learn

Aprendizajes globales que el agente reutiliza entre proyectos.

Uso:
  alvaress learn add <tipo> "<título>" ["<detalle>"]
      [--kind step|solution|pitfall|preference|improvement]
      [--title "<título>"] [--body "<detalle>"] [--tag pnpm,ci]
      [--project <nombre>] [--source <tarea|run>] [--json]
  alvaress learn list [--kind <tipo>] [--tag <tag>] [--limit 20] [--json]
  alvaress learn search "<texto>" [--kind <tipo>] [--tag <tag>] [--limit 10] [--json]
  alvaress learn show <id> [--json]
  alvaress learn use <id>
  alvaress learn prune [--keep 100] [--max-age-days 90] [--dry-run]
  alvaress learn playbook [--json]

El store vive en ~/.alvaress/memory/learnings.json y el resumen legible en
~/.alvaress/memory/PLAYBOOK.md. Usa ALVARESS_MEMORY_DIR para cambiarlo.`;

export interface LearnCommandDeps {
  memoryDir?: string;
  stdout?: (line: string) => void;
}

function flagValue(flags: Record<string, string | boolean>, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseLimit(flags: Record<string, string | boolean>, fallback: number): number {
  const raw = flagValue(flags, 'limit');
  if (raw === undefined) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('El valor de --limit debe ser un entero mayor o igual a 1.');
  }
  return value;
}

function printLearning(learning: Learning, stdout: (line: string) => void): void {
  stdout(formatLearning(learning));
  stdout('');
}

function resolvePaths(deps: LearnCommandDeps): MemoryPaths {
  return getMemoryPaths(deps.memoryDir);
}

export function runLearnCommand(
  args: string[],
  root: string = process.cwd(),
  deps: LearnCommandDeps = {}
): void {
  const stdout = deps.stdout ?? ((line: string) => console.log(line));
  const [subcommand, ...rest] = args;

  if (
    subcommand === undefined ||
    subcommand === 'help' ||
    subcommand === '--help' ||
    subcommand === '-h'
  ) {
    stdout(HELP);
    return;
  }

  const paths = resolvePaths(deps);

  if (subcommand === 'add') {
    const { positional, flags } = parseArgs(rest);
    const kind = flagValue(flags, 'kind') ?? positional[0];
    if (kind === undefined) {
      throw new Error('Uso: alvaress learn add <tipo> "<título>" ["<detalle>"]');
    }
    const title = flagValue(flags, 'title') ?? positional[1];
    if (title === undefined) {
      throw new Error('El aprendizaje necesita un título: alvaress learn add <tipo> "<título>"');
    }
    const body = flagValue(flags, 'body') ?? positional.slice(2).join(' ');
    const tags = [flagValue(flags, 'tag'), flagValue(flags, 'tags')]
      .filter((tag): tag is string => tag !== undefined);
    const project = flagValue(flags, 'project') ?? path.basename(path.resolve(root));

    const result = addLearning(
      {
        kind: assertLearningKind(kind),
        title,
        body,
        tags,
        project,
        source: flagValue(flags, 'source')
      },
      paths
    );

    if (flagEnabled(flags, 'json')) {
      stdout(JSON.stringify(result, null, 2));
      return;
    }
    stdout(
      result.created
        ? `Aprendizaje guardado: ${result.learning.id} · ${result.learning.title}`
        : `Aprendizaje reforzado: ${result.learning.id} · ${result.learning.title} (usos: ${result.learning.uses})`
    );
    stdout(`Playbook: ${paths.playbook}`);
    return;
  }

  if (subcommand === 'list') {
    const { flags } = parseArgs(rest);
    const kind = flagValue(flags, 'kind');
    const learnings = filterLearnings(loadLearnings(paths), {
      kind: kind === undefined ? undefined : assertLearningKind(kind),
      tag: flagValue(flags, 'tag'),
      limit: parseLimit(flags, 20)
    });

    if (flagEnabled(flags, 'json')) {
      stdout(JSON.stringify(learnings, null, 2));
      return;
    }
    if (learnings.length === 0) {
      stdout('No hay aprendizajes guardados todavía.');
      return;
    }
    for (const learning of learnings) {
      stdout(
        `${learning.id}  ${learning.kind.padEnd(11)} ${learning.project.padEnd(18)} usos=${learning.uses}  ${learning.title}`
      );
    }
    return;
  }

  if (subcommand === 'search') {
    const { positional, flags } = parseArgs(rest);
    const query = flagValue(flags, 'query') ?? positional.join(' ');
    if (query.trim().length === 0) {
      throw new Error('Uso: alvaress learn search "<texto>"');
    }
    const kind = flagValue(flags, 'kind');
    const learnings = loadLearnings(paths);
    const scoped = kind === undefined
      ? learnings
      : learnings.filter((learning) => learning.kind === assertLearningKind(kind));
    const matches = searchLearnings(scoped, query, parseLimit(flags, 10));

    if (flagEnabled(flags, 'json')) {
      stdout(JSON.stringify(matches, null, 2));
      return;
    }
    if (matches.length === 0) {
      stdout(`Sin aprendizajes para "${query}".`);
      return;
    }
    for (const learning of matches) {
      printLearning(learning, stdout);
    }
    return;
  }

  if (subcommand === 'show') {
    const { positional, flags } = parseArgs(rest);
    const id = positional[0];
    if (id === undefined) {
      throw new Error('Uso: alvaress learn show <id>');
    }
    const learning = findLearning(loadLearnings(paths), id);
    if (learning === undefined) {
      throw new Error(`No existe el aprendizaje "${id}". Usa "alvaress learn list".`);
    }
    if (flagEnabled(flags, 'json')) {
      stdout(JSON.stringify(learning, null, 2));
      return;
    }
    printLearning(learning, stdout);
    return;
  }

  if (subcommand === 'use') {
    const { positional } = parseArgs(rest);
    const id = positional[0];
    if (id === undefined) {
      throw new Error('Uso: alvaress learn use <id>');
    }
    const learning = recordLearningUse(id, paths);
    stdout(`Aprendizaje reutilizado: ${learning.id} · ${learning.title} (usos: ${learning.uses})`);
    return;
  }

  if (subcommand === 'prune') {
    const { flags } = parseArgs(rest);
    const keepRaw = flagValue(flags, 'keep');
    const ageRaw = flagValue(flags, 'max-age-days');
    const keep = keepRaw === undefined ? 100 : Number.parseInt(keepRaw, 10);
    const maxAgeDays = ageRaw === undefined ? undefined : Number.parseInt(ageRaw, 10);
    if (maxAgeDays !== undefined && (!Number.isInteger(maxAgeDays) || maxAgeDays < 1)) {
      throw new Error('El valor de --max-age-days debe ser un entero mayor o igual a 1.');
    }
    const dryRun = flagEnabled(flags, 'dry-run');
    const result = pruneLearnings(paths, { keep, maxAgeDays, dryRun });

    if (flagEnabled(flags, 'json')) {
      stdout(JSON.stringify({ ...result, dryRun }, null, 2));
      return;
    }
    if (result.removed.length === 0) {
      stdout(`Sin cambios: ${result.kept} aprendizaje(s) conservados.`);
      return;
    }
    for (const learning of result.removed) {
      stdout(`${dryRun ? 'Se eliminaría' : 'Eliminado'}: ${learning.id} · ${learning.title}`);
    }
    stdout(`${dryRun ? 'Simulación' : 'Limpieza'}: ${result.removed.length} eliminado(s), ${result.kept} conservado(s).`);
    return;
  }

  if (subcommand === 'playbook') {
    const { flags } = parseArgs(rest);
    const learnings = loadLearnings(paths);
    rebuildPlaybook(paths, learnings);
    if (flagEnabled(flags, 'json')) {
      stdout(JSON.stringify({ path: paths.playbook, entries: learnings.length }, null, 2));
      return;
    }
    stdout(`Playbook regenerado en ${paths.playbook} (${learnings.length} aprendizaje(s)).`);
    return;
  }

  throw new Error(`Subcomando de learn desconocido: ${subcommand}. Usa "alvaress learn --help".`);
}
