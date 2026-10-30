import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { subagentFilePath } from '../src/agent/installer.js';
import { loadConfig } from '../src/config/loader.js';
import type { HarnessConfig } from '../src/config/loader.js';
import { getGlobalOpencodeAgentsDir } from '../src/constants.js';
import type {
  Complexity,
  DecisionEngine,
  Exploration,
  HarnessHandlers,
  HarnessState,
  RouteDecision,
  RunUsage,
  SpecialistRole,
  ValidationResult
} from '../src/core/contracts.js';
import { HarnessCore, firstFailure } from '../src/core/harness.js';
import { HeuristicDecisionEngine } from '../src/decision/heuristics.js';
import { RunLog } from '../src/orchestrator/run-log.js';
import { CommandValidator } from '../src/orchestrator/validator.js';
import { SubagentWorker } from '../src/orchestrator/workers.js';

const BENCH_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(BENCH_DIR, '..');
export const FIXTURES_DIR = path.join(BENCH_DIR, 'fixtures');
const TSC_BIN = path.join(REPO_ROOT, 'node_modules', '.bin', 'tsc');
const REQUIRED_AGENTS = ['alvaress-implementer', 'alvaress-implementer-lite', 'alvaress-fixer'];

export interface FixtureTask {
  request: string;
  complexity: Complexity;
  files: string[];
  acceptance: string[];
  validation: string[];
}

export interface BenchOptions {
  model?: string;
  roles: SpecialistRole[];
  selfCheck: boolean;
  env?: NodeJS.ProcessEnv;
  keep?: boolean;
}

export interface BenchResult {
  fixture: string;
  state: HarnessState;
  durationMs: number;
  fixes: number;
  auditFindings: number;
  usage: RunUsage | undefined;
  halt?: string;
  workdir?: string;
}

export function listFixtures(): string[] {
  return fs
    .readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
}

export function readTask(fixture: string): FixtureTask {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, fixture, 'task.json'), 'utf-8');
  const task = JSON.parse(raw) as FixtureTask;
  return { ...task, validation: task.validation.map((command) => command.replaceAll('{{tsc}}', TSC_BIN)) };
}

/** Comprueba lo que el benchmark necesita fuera del repo antes de gastar tokens. */
export function preflight(env: NodeJS.ProcessEnv = process.env): string[] {
  const problems: string[] = [];
  try {
    execFileSync('opencode', ['--version'], { env, stdio: 'ignore' });
  } catch {
    problems.push('No se encontró "opencode" en el PATH.');
  }
  const directory = getGlobalOpencodeAgentsDir();
  const missing = REQUIRED_AGENTS.filter(
    (agent) => !fs.existsSync(subagentFilePath(directory, agent))
  );
  if (missing.length > 0) {
    problems.push(
      `Faltan subagentes en ${directory}: ${missing.join(', ')}. Ejecuta "alvaress install" o "alvaress agent install".`
    );
  }
  return problems;
}

function git(root: string, args: string[]): void {
  execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], { cwd: root, stdio: 'ignore' });
}

function prepareWorkdir(fixture: string): string {
  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), `alvaress-bench-${fixture}-`));
  fs.cpSync(path.join(FIXTURES_DIR, fixture, 'project'), workdir, { recursive: true });
  git(workdir, ['init', '-q']);
  git(workdir, ['config', 'user.email', 'bench@alvaress.local']);
  git(workdir, ['config', 'user.name', 'alvaress bench']);
  git(workdir, ['add', '.']);
  git(workdir, ['commit', '-q', '-m', 'fixture']);
  return workdir;
}

function benchConfig(workdir: string, options: BenchOptions): HarnessConfig {
  const base = loadConfig(workdir);
  return {
    ...base,
    worker: { ...base.worker, selfCheck: options.selfCheck },
    models: {
      ...base.models,
      subagents: { modelName: options.model ?? base.models.subagents.modelName }
    }
  };
}

/**
 * Decisiones fijas: el modo y la complejidad salen del fixture y los
 * especialistas de las opciones, para que dos corridas sean comparables. El
 * triaje de fallos usa las heurísticas reales.
 */
function fixedDecisions(task: FixtureTask, roles: SpecialistRole[]): DecisionEngine {
  const heuristics = new HeuristicDecisionEngine();
  const route: RouteDecision = {
    mode: 'odd',
    complexity: task.complexity,
    needsGraph: false,
    needsSubagents: roles.length > 0,
    confidence: 1,
    source: 'heuristic'
  };
  return {
    route: () => Promise.resolve(route),
    planFlow: () => Promise.resolve({ roles, reason: 'bench', confidence: 1, source: 'heuristic' }),
    assessRisk: (input) => heuristics.assessRisk(input),
    classifyFailure: (input) => heuristics.classifyFailure(input),
    decideLearningScope: (input) => heuristics.decideLearningScope(input)
  };
}

function failureText(validation: ValidationResult): string {
  const failure = firstFailure(validation);
  return [failure?.stderr ?? '', failure?.stdout ?? ''].filter((part) => part.trim().length > 0).join('\n');
}

export async function runFixture(fixture: string, options: BenchOptions): Promise<BenchResult> {
  const task = readTask(fixture);
  const workdir = prepareWorkdir(fixture);
  const runId = `bench-${fixture}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const started = Date.now();
  try {
    const config = benchConfig(workdir, options);
    const log = new RunLog(workdir);
    log.begin({ command: 'bench', request: task.request });
    const worker = new SubagentWorker({
      root: workdir,
      config,
      log,
      ...(options.env !== undefined ? { env: options.env } : {})
    });
    const states: HarnessState[] = [];
    const exploration: Exploration = {
      mode: 'odd',
      source: `bench/fixtures/${fixture}/task.json`,
      acceptance: task.acceptance,
      files: task.files,
      validation: task.validation,
      learnings: [],
      risks: []
    };
    const handlers: HarnessHandlers = {
      explore: () => Promise.resolve(exploration),
      consult: (role, input) => worker.consult(role, input),
      work: (plan) => worker.work(plan),
      check: () =>
        new CommandValidator({
          root: workdir,
          config,
          commands: task.validation,
          log,
          ...(options.env !== undefined ? { env: options.env } : {})
        }).validate(),
      fix: (failure, attempt, _work, review) =>
        worker.fix({
          runId,
          attempt,
          files: task.files,
          failure,
          error: failureText(failure),
          ...(review !== undefined ? { review } : {})
        }),
      ready: () => Promise.resolve({}),
      halt: () => Promise.resolve()
    };
    const core = new HarnessCore({
      handlers,
      decisions: fixedDecisions(task, options.roles),
      ui: { start: (state) => states.push(state), setState: (state) => states.push(state), stop: () => {} },
      runId: () => runId
    });

    const result = await core.run({ request: task.request, mode: 'odd', files: task.files, commit: false });
    const usage = worker.usage();
    log.usage(usage);
    log.finish(result);
    return {
      fixture,
      state: result.state,
      durationMs: Date.now() - started,
      fixes: states.filter((state) => state === 'Fixing').length,
      auditFindings: result.risks.filter((risk) => risk.source === 'audit').length,
      usage,
      ...(result.halt !== undefined ? { halt: result.halt.message } : {}),
      ...(options.keep === true ? { workdir } : {})
    };
  } finally {
    if (options.keep !== true) {
      fs.rmSync(workdir, { recursive: true, force: true });
    }
  }
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function summarize(results: BenchResult[]): string {
  const rows = new Map<string, BenchResult[]>();
  for (const result of results) {
    rows.set(result.fixture, [...(rows.get(result.fixture) ?? []), result]);
  }
  const lines = [
    '| Fixture | Ready | Llamadas | Entrada | Salida | Caché | Reparaciones | Tiempo |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'
  ];
  for (const [fixture, runs] of rows) {
    const ready = runs.filter((run) => run.state === 'Ready').length;
    const total = (pick: (run: BenchResult) => number): string => Math.round(mean(runs.map(pick))).toString();
    lines.push(
      `| ${fixture} | ${ready}/${runs.length} | ${total((run) => run.usage?.total.calls ?? 0)} | ` +
        `${total((run) => run.usage?.total.input ?? 0)} | ${total((run) => run.usage?.total.output ?? 0)} | ` +
        `${total((run) => run.usage?.total.cacheRead ?? 0)} | ${mean(runs.map((run) => run.fixes)).toFixed(1)} | ` +
        `${(mean(runs.map((run) => run.durationMs)) / 1000).toFixed(1)} s |`
    );
  }
  return lines.join('\n');
}
