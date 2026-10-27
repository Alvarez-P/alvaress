import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import { DEFAULT_LAYA_TIMEOUT_MS } from '../constants.js';
import type { DecisionEngine, LearningScopeDecision } from '../core/contracts.js';
import { HeuristicDecisionEngine } from '../decision/heuristics.js';
import { createDecisionEngine } from '../decision/laya.js';
import {
  addLearning,
  assertLearningKind,
  filterLearnings,
  findScopedLearning,
  formatLearning,
  getMemoryStores,
  loadScopedLearnings,
  promoteLearning,
  pruneLearnings,
  rebuildPlaybook,
  recordScopedLearningUse,
  searchLearnings
} from '../memory/learnings.js';
import type {
  Learning,
  LearningScope,
  LearningScopeFilter,
  MemoryStores,
  ScopedLearning
} from '../memory/learnings.js';
import { inferProjectName } from '../openspec/manifest.js';
import { flagEnabled, parseArgs } from '../utils/args.js';

const HELP = `alvaress learn

Aprendizajes que el agente reutiliza. Hay dos stores:

  global   ~/.alvaress/memory/learnings.json   (transversal a proyectos)
  proyecto <root>/.harness/memory/learnings.json (contexto del repo)

Al guardar, Laya decide si el aprendizaje es global o del proyecto. Puedes
forzarlo con --global o --scope. Usa ALVARESS_MEMORY_DIR para mover el global.

Uso:
  alvaress learn add <tipo> "<título>" ["<detalle>"]
      [--kind step|solution|pitfall|preference|improvement]
      [--title "<título>"] [--body "<detalle>"] [--tag pnpm,ci]
      [--project <nombre>] [--source <tarea|run>]
      [--global | --scope project|global] [--json]
  alvaress learn list [--scope all|global|project] [--kind <tipo>] [--tag <tag>] [--limit 20] [--json]
  alvaress learn search "<texto>" [--scope all|global|project] [--kind <tipo>] [--tag <tag>] [--limit 10] [--json]
  alvaress learn show <id> [--json]
  alvaress learn use <id>
  alvaress learn promote <id>
  alvaress learn prune [--scope all|global|project] [--keep 100] [--max-age-days 90] [--dry-run]
  alvaress learn playbook [--scope all|global|project] [--json]

El playbook del proyecto incluye lo global relevante; el global solo lo global.`;

export interface LearnCommandDeps {
  memoryDir?: string;
  projectMemoryDir?: string;
  decisions?: DecisionEngine;
  config?: HarnessConfig;
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

function parseScope(
  flags: Record<string, string | boolean>,
  fallback: LearningScopeFilter
): LearningScopeFilter {
  const raw = flagValue(flags, 'scope');
  if (raw === undefined) {
    return flagEnabled(flags, 'global') ? 'global' : fallback;
  }
  if (raw !== 'all' && raw !== 'global' && raw !== 'project') {
    throw new Error('El valor de --scope solo admite "all", "global" o "project".');
  }
  return raw;
}

function printLearning(learning: Learning, stdout: (line: string) => void): void {
  stdout(formatLearning(learning));
  stdout('');
}

function resolveStores(root: string, deps: LearnCommandDeps): MemoryStores {
  return getMemoryStores(root, {
    globalDir: deps.memoryDir,
    projectDir: deps.projectMemoryDir
  });
}

function rebuildForScope(stores: MemoryStores, scope: LearningScope): void {
  if (scope === 'global') {
    rebuildPlaybook(stores.global, loadScopedLearnings(stores, 'global'), new Date(), 'global');
    return;
  }
  rebuildPlaybook(stores.project, loadScopedLearnings(stores, 'all'), new Date(), 'project');
}

function rebuildAll(stores: MemoryStores): void {
  rebuildForScope(stores, 'global');
  rebuildForScope(stores, 'project');
}

async function resolveDecisionEngine(
  root: string,
  deps: LearnCommandDeps
): Promise<{ engine: DecisionEngine; owned: boolean }> {
  if (deps.decisions !== undefined) {
    return { engine: deps.decisions, owned: false };
  }

  let config: HarnessConfig;
  try {
    config = deps.config ?? loadConfig(root);
  } catch {
    return { engine: new HeuristicDecisionEngine(), owned: false };
  }

  const laya = config.laya ?? {
    enabled: false,
    device: 'cpu' as const,
    timeoutMs: DEFAULT_LAYA_TIMEOUT_MS,
    fallbackToHeuristic: true
  };
  return { engine: await createDecisionEngine({ root, config: laya }), owned: true };
}

export async function runLearnCommand(
  args: string[],
  root: string = process.cwd(),
  deps: LearnCommandDeps = {}
): Promise<void> {
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

  const stores = resolveStores(root, deps);

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
    const project = flagValue(flags, 'project') ?? inferProjectName(root);
    const learningKind = assertLearningKind(kind);

    const forcedScope = parseScope(flags, 'project');
    if (forcedScope === 'all') {
      throw new Error('learn add requiere --scope global o --scope project.');
    }
    const forced =
      flagEnabled(flags, 'global') || flagValue(flags, 'scope') !== undefined;

    let scope: LearningScope = forcedScope;
    let decision: LearningScopeDecision | undefined;

    if (!forced) {
      const { engine, owned } = await resolveDecisionEngine(root, deps);
      try {
        decision = await engine.decideLearningScope({
          kind: learningKind,
          title,
          body,
          tags,
          project
        });
        scope = decision.scope;
      } finally {
        if (owned) {
          await engine.close?.();
        }
      }
    }

    const target = scope === 'global' ? stores.global : stores.project;
    const result = addLearning(
      {
        kind: learningKind,
        title,
        body,
        tags,
        project,
        source: flagValue(flags, 'source')
      },
      target
    );
    rebuildForScope(stores, scope);

    if (flagEnabled(flags, 'json')) {
      stdout(
        JSON.stringify(
          { ...result, scope, decision, store: target.store, playbook: target.playbook },
          null,
          2
        )
      );
      return;
    }

    stdout(
      result.created
        ? `Aprendizaje guardado: ${result.learning.id} · ${result.learning.title}`
        : `Aprendizaje reforzado: ${result.learning.id} · ${result.learning.title} (usos: ${result.learning.uses})`
    );
    const reason = decision !== undefined ? ` — ${decision.reason}` : forced ? ' — forzado' : '';
    stdout(`Scope: ${scope}${reason}`);
    stdout(`Store: ${target.store}`);
    stdout(`Playbook: ${target.playbook}`);
    return;
  }

  if (subcommand === 'list') {
    const { flags } = parseArgs(rest);
    const kind = flagValue(flags, 'kind');
    const learnings = filterLearnings(loadScopedLearnings(stores, parseScope(flags, 'all')), {
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
      const scope = (learning as ScopedLearning).scope ?? 'global';
      stdout(
        `${learning.id}  ${learning.kind.padEnd(11)} ${scope.padEnd(7)} ${learning.project.padEnd(18)} usos=${learning.uses}  ${learning.title}`
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
    const learnings = loadScopedLearnings(stores, parseScope(flags, 'all'));
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
    const learning = findScopedLearning(stores, id);
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
    const learning = recordScopedLearningUse(id, stores);
    stdout(
      `Aprendizaje reutilizado: ${learning.id} · ${learning.title} (${learning.scope}, usos: ${learning.uses})`
    );
    return;
  }

  if (subcommand === 'promote') {
    const { positional, flags } = parseArgs(rest);
    const id = positional[0];
    if (id === undefined) {
      throw new Error('Uso: alvaress learn promote <id>');
    }
    const result = promoteLearning(id, stores);
    if (flagEnabled(flags, 'json')) {
      stdout(JSON.stringify({ ...result, store: stores.global.store }, null, 2));
      return;
    }
    stdout(
      result.created
        ? `Aprendizaje promovido al global: ${result.learning.id} · ${result.learning.title}`
        : `Aprendizaje reforzado en el global: ${result.learning.id} · ${result.learning.title}`
    );
    stdout(`Store global: ${stores.global.store}`);
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
    const scope = parseScope(flags, 'all');
    const scopes: LearningScope[] =
      scope === 'all' ? ['global', 'project'] : [scope];
    const results = scopes.map((target) => {
      const result = pruneLearnings(target === 'global' ? stores.global : stores.project, {
        keep,
        maxAgeDays,
        dryRun
      });
      return { scope: target, ...result };
    });
    if (!dryRun) {
      rebuildAll(stores);
    }

    if (flagEnabled(flags, 'json')) {
      stdout(JSON.stringify({ dryRun, results }, null, 2));
      return;
    }
    const removed = results.reduce((total, result) => total + result.removed.length, 0);
    if (removed === 0) {
      const kept = results.reduce((total, result) => total + result.kept, 0);
      stdout(`Sin cambios: ${kept} aprendizaje(s) conservados.`);
      return;
    }
    for (const result of results) {
      for (const learning of result.removed) {
        stdout(
          `${dryRun ? 'Se eliminaría' : 'Eliminado'} (${result.scope}): ${learning.id} · ${learning.title}`
        );
      }
    }
    const kept = results.reduce((total, result) => total + result.kept, 0);
    stdout(
      `${dryRun ? 'Simulación' : 'Limpieza'}: ${removed} eliminado(s), ${kept} conservado(s).`
    );
    return;
  }

  if (subcommand === 'playbook') {
    const { flags } = parseArgs(rest);
    const scope = parseScope(flags, 'all');
    if (scope !== 'project') {
      rebuildForScope(stores, 'global');
    }
    if (scope !== 'global') {
      rebuildForScope(stores, 'project');
    }
    const globalEntries = loadScopedLearnings(stores, 'global').length;
    const projectEntries = loadScopedLearnings(stores, 'all').length;
    if (flagEnabled(flags, 'json')) {
      stdout(
        JSON.stringify(
          {
            global: { path: stores.global.playbook, entries: globalEntries },
            project: { path: stores.project.playbook, entries: projectEntries }
          },
          null,
          2
        )
      );
      return;
    }
    if (scope !== 'project') {
      stdout(`Playbook global regenerado en ${stores.global.playbook} (${globalEntries} aprendizaje(s)).`);
    }
    if (scope !== 'global') {
      stdout(
        `Playbook del proyecto regenerado en ${stores.project.playbook} (${projectEntries} aprendizaje(s)).`
      );
    }
    return;
  }

  throw new Error(`Subcomando de learn desconocido: ${subcommand}. Usa "alvaress learn --help".`);
}
