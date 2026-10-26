import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HarnessCore,
  firstFailure,
  mergeChanges,
  mergeRisks,
  warningsToRisks
} from '../src/core/harness.js';
import type {
  DecisionEngine,
  Exploration,
  FailureVerdict,
  FixResult,
  HaltReason,
  HarnessHandlers,
  HarnessState,
  HarnessUI,
  ReadyInput,
  ReadyResult,
  RiskAssessment,
  RouteDecision,
  RunRequest,
  ValidationResult,
  WorkPlan,
  WorkResult
} from '../src/core/contracts.js';

function okValidation(): ValidationResult {
  return { ok: true, commands: [{ command: 'vp check', code: 0 }], warnings: [] };
}

function failedValidation(): ValidationResult {
  return {
    ok: false,
    commands: [{ command: 'vp check', code: 1, stderr: 'error de tipos' }],
    warnings: []
  };
}

function exploration(overrides: Partial<Exploration> = {}): Exploration {
  return {
    mode: 'odd',
    source: 'nota odd',
    acceptance: ['compila'],
    files: ['src/a.ts'],
    validation: ['vp check'],
    learnings: [],
    risks: [],
    ...overrides
  };
}

function work(overrides: Partial<WorkResult> = {}): WorkResult {
  return {
    status: 'done',
    changes: [{ path: 'src/a.ts', change: 'agrega helper' }],
    risks: [],
    ...overrides
  };
}

function fix(overrides: Partial<FixResult> = {}): FixResult {
  return { verdict: 'fixed', changes: [], cause: 'ajuste menor', risks: [], ...overrides };
}

interface HarnessFixture {
  core: HarnessCore;
  states: HarnessState[];
  halts: HaltReason[];
  ready: ReadyInput[];
  fixes: number;
  checks: number;
  workPlans: WorkPlan[];
  closed: { handlers: boolean; decisions: boolean };
  decisions: DecisionEngine;
  handlers: HarnessHandlers;
}

interface FixtureOptions {
  route?: RouteDecision;
  explore?: (request: RunRequest) => Promise<Exploration>;
  work?: (plan: WorkPlan) => Promise<WorkResult>;
  check?: () => Promise<ValidationResult>;
  fix?: () => Promise<FixResult>;
  verdicts?: FailureVerdict[];
  ready?: (input: ReadyInput) => Promise<ReadyResult>;
  maxFixAttempts?: number;
}

function makeFixture(options: FixtureOptions = {}): HarnessFixture {
  const states: HarnessState[] = [];
  const halts: HaltReason[] = [];
  let stops = 0;
  const ready: ReadyInput[] = [];
  const workPlans: WorkPlan[] = [];
  const verdicts = [...(options.verdicts ?? [])];
  const closed = { handlers: false, decisions: false };
  const fixture = {
    states,
    halts,
    ready,
    workPlans,
    fixes: 0,
    checks: 0,
    closed,
    decisions: {} as DecisionEngine,
    handlers: {} as HarnessHandlers,
    core: {} as HarnessCore
  };

  const ui: HarnessUI = {
    start(state) {
      states.push(state);
    },
    setState(state) {
      states.push(state);
    },
    stop() {
      stops += 1;
    }
  };

  const decisions: DecisionEngine = {
    async route(): Promise<RouteDecision> {
      return (
        options.route ?? {
          mode: 'odd',
          complexity: 'small',
          needsGraph: false,
          needsSubagents: false,
          confidence: 0.8,
          source: 'heuristic'
        }
      );
    },
    async assessRisk(): Promise<RiskAssessment> {
      return { risks: [], confidence: 0.5, source: 'heuristic' };
    },
    async classifyFailure(): Promise<FailureVerdict> {
      return (
        verdicts.shift() ?? {
          trivial: true,
          nuclear: false,
          reason: 'fallo trivial',
          confidence: 0.9,
          source: 'heuristic'
        }
      );
    },
    async close(): Promise<void> {
      closed.decisions = true;
    }
  };

  const handlers: HarnessHandlers = {
    async explore(request): Promise<Exploration> {
      return options.explore !== undefined ? options.explore(request) : exploration();
    },
    async work(plan): Promise<WorkResult> {
      workPlans.push(plan);
      return options.work !== undefined ? options.work(plan) : work();
    },
    async check(): Promise<ValidationResult> {
      fixture.checks += 1;
      return options.check !== undefined ? options.check() : okValidation();
    },
    async fix(): Promise<FixResult> {
      fixture.fixes += 1;
      return options.fix !== undefined ? options.fix() : fix();
    },
    async ready(input): Promise<ReadyResult> {
      ready.push(input);
      return options.ready !== undefined ? options.ready(input) : {};
    },
    async halt(reason): Promise<void> {
      halts.push(reason);
    },
    async close(): Promise<void> {
      closed.handlers = true;
    }
  };

  fixture.decisions = decisions;
  fixture.handlers = handlers;
  fixture.core = new HarnessCore({
    handlers,
    decisions,
    ui,
    runId: () => 'run-test-1',
    logPath: '.laya/last_run.log',
    ...(options.maxFixAttempts !== undefined ? { maxFixAttempts: options.maxFixAttempts } : {})
  });

  return fixture;
}

test('HarnessCore completa el happy path ODD y cierra recursos', async () => {
  const fixture = makeFixture();
  const result = await fixture.core.run({ request: 'agrega un helper' });

  assert.equal(result.state, 'Ready');
  assert.equal(result.mode, 'odd');
  assert.equal(result.runId, 'run-test-1');
  assert.equal(result.logPath, '.laya/last_run.log');
  assert.deepEqual(
    result.changes.map((change) => change.path),
    ['src/a.ts']
  );
  assert.equal(fixture.ready.length, 1);
  assert.equal(fixture.ready[0]?.exploration.source, 'nota odd');
  assert.deepEqual(fixture.states, ['Exploring', 'Working', 'Checking', 'Ready']);
  assert.equal(fixture.closed.handlers, true);
  assert.equal(fixture.closed.decisions, true);
});

test('HarnessCore respeta el modo SDD solicitado aunque Laya proponga ODD', async () => {
  const fixture = makeFixture();
  const result = await fixture.core.run({ request: 'rediseña el instalador', mode: 'sdd' });

  assert.equal(result.mode, 'sdd');
  assert.equal(fixture.workPlans[0]?.mode, 'sdd');
});

test('HarnessCore repara una vez y termina en Ready', async () => {
  const fixture = makeFixture({
    check: async () => (fixture.checks === 1 ? failedValidation() : okValidation())
  });
  const result = await fixture.core.run({ request: 'corrige el tipado' });

  assert.equal(result.state, 'Ready');
  assert.equal(fixture.fixes, 1);
  assert.deepEqual(fixture.states, [
    'Exploring',
    'Working',
    'Checking',
    'Fixing',
    'Checking',
    'Ready'
  ]);
  assert.equal(fixture.ready[0]?.validation.ok, true);
});

test('HarnessCore se detiene tras agotar los dos reintentos de Fixing', async () => {
  const fixture = makeFixture({ check: async () => failedValidation() });
  const result = await fixture.core.run({ request: 'arregla todo' });

  assert.equal(result.state, 'Halted');
  assert.equal(result.halt?.code, 'validation');
  assert.equal(fixture.fixes, 2);
  assert.equal(fixture.checks, 3);
  assert.equal(fixture.halts.length, 1);
  assert.match(result.halt?.message ?? '', /2 intento/);
  assert.equal(fixture.states.filter((state) => state === 'Fixing').length, 2);
});

test('HarnessCore corta en HALT nuclear cuando Laya lo detecta', async () => {
  const fixture = makeFixture({
    check: async () => failedValidation(),
    verdicts: [
      {
        trivial: false,
        nuclear: true,
        reason: 'rompe el contrato del worker',
        confidence: 0.95,
        source: 'laya'
      }
    ]
  });
  const result = await fixture.core.run({ request: 'cambia el contrato' });

  assert.equal(result.state, 'Halted');
  assert.equal(result.halt?.code, 'nuclear');
  assert.equal(result.halt?.detail, 'rompe el contrato del worker');
  assert.equal(fixture.fixes, 0);
});

test('HarnessCore corta si la exploración no cierra el alcance', async () => {
  const fixture = makeFixture({
    explore: async () => exploration({ blockedBy: 'la nota ODD no existe' })
  });
  const result = await fixture.core.run({ request: 'tarea ambigua' });

  assert.equal(result.state, 'Halted');
  assert.equal(result.halt?.code, 'scope');
  assert.equal(result.halt?.detail, 'la nota ODD no existe');
  assert.equal(fixture.workPlans.length, 0);
  assert.equal(fixture.halts.length, 1);
});

test('HarnessCore corta si el worker queda bloqueado', async () => {
  const fixture = makeFixture({
    work: async () => work({ status: 'blocked', blockedBy: 'falta una credencial' })
  });
  const result = await fixture.core.run({ request: 'publica el paquete' });

  assert.equal(result.state, 'Halted');
  assert.equal(result.halt?.code, 'scope');
  assert.equal(result.halt?.detail, 'falta una credencial');
});

test('HarnessCore corta si el worker falla', async () => {
  const fixture = makeFixture({
    work: async () => work({ status: 'failed', detail: 'el subagente se cayó' })
  });
  const result = await fixture.core.run({ request: 'edita el archivo' });

  assert.equal(result.state, 'Halted');
  assert.equal(result.halt?.code, 'worker');
  assert.equal(result.halt?.detail, 'el subagente se cayó');
});

test('HarnessCore corta cuando el run no produce cambios', async () => {
  const fixture = makeFixture({ work: async () => work({ changes: [] }) });
  const result = await fixture.core.run({ request: 'no hace nada' });

  assert.equal(result.state, 'Halted');
  assert.equal(result.halt?.code, 'empty-diff');
  assert.equal(fixture.checks, 0);
});

test('HarnessCore corta si la reparación requiere al orquestador', async () => {
  const fixture = makeFixture({
    check: async () => failedValidation(),
    fix: async () => fix({ verdict: 'needs-orchestrator', cause: 'hay dos diseños posibles' })
  });
  const result = await fixture.core.run({ request: 'elige arquitectura' });

  assert.equal(result.state, 'Halted');
  assert.equal(result.halt?.code, 'scope');
  assert.equal(result.halt?.detail, 'hay dos diseños posibles');
  assert.equal(fixture.fixes, 1);
});

test('HarnessCore convierte un error inesperado en HALT de herramienta', async () => {
  const fixture = makeFixture({
    explore: async () => {
      throw new Error('graphify no responde');
    }
  });
  const result = await fixture.core.run({ request: 'consulta el grafo' });

  assert.equal(result.state, 'Halted');
  assert.equal(result.halt?.code, 'tool');
  assert.match(result.halt?.detail ?? '', /graphify no responde/);
  assert.equal(fixture.closed.handlers, true);
  assert.equal(fixture.closed.decisions, true);
});

test('HarnessCore fusiona cambios y riesgos del worker, la reparación y el linter', async () => {
  const fixture = makeFixture({
    explore: async () =>
      exploration({
        risks: [{ title: 'nota ODD desactualizada', source: 'harness' }]
      }),
    work: async () =>
      work({
        changes: [
          { path: 'src/a.ts', change: 'primera versión' },
          { path: 'src/b.ts', change: 'nuevo test' }
        ],
        risks: [{ title: 'cambia el orden de imports', source: 'worker' }]
      }),
    check: async () =>
      fixture.checks === 1
        ? {
            ok: false,
            commands: [{ command: 'vp check', code: 1, stderr: 'fallo' }],
            warnings: ['quedan dos imports sin usar']
          }
        : {
            ok: true,
            commands: [{ command: 'vp check', code: 0 }],
            warnings: ['quedan dos imports sin usar']
          },
    fix: async () => fix({ changes: [{ path: 'src/a.ts', change: 'corrige imports' }] })
  });

  const result = await fixture.core.run({ request: 'refactoriza imports' });

  assert.equal(result.state, 'Ready');
  assert.deepEqual(
    result.changes.map((change) => `${change.path}:${change.change}`),
    ['src/a.ts:corrige imports', 'src/b.ts:nuevo test']
  );
  assert.deepEqual(
    result.risks.map((risk) => risk.title),
    ['nota ODD desactualizada', 'cambia el orden de imports', 'quedan dos imports sin usar']
  );
});

test('HarnessCore usa el resultado de ready para el commit y el log', async () => {
  const fixture = makeFixture({
    ready: async () => ({
      commit: { committed: true, sha: 'abc1234', files: ['src/a.ts'] },
      logPath: '.laya/runs/run-test-1.log'
    })
  });
  const result = await fixture.core.run({ request: 'haz commit' });

  assert.equal(result.commit?.sha, 'abc1234');
  assert.equal(result.logPath, '.laya/runs/run-test-1.log');
});

test('firstFailure devuelve el primer comando con código distinto de cero', () => {
  assert.equal(
    firstFailure({
      ok: false,
      commands: [
        { command: 'vp check', code: 0 },
        { command: 'vp test', code: 2 }
      ],
      warnings: []
    })?.command,
    'vp test'
  );
  assert.equal(firstFailure(okValidation()), undefined);
});

test('mergeChanges conserva el último estado por ruta', () => {
  const merged = mergeChanges(
    [{ path: 'src/a.ts', change: 'creado', kind: 'created' }],
    [{ path: 'src/a.ts', change: 'modificado', kind: 'modified' }],
    [{ path: 'src/b.ts', change: 'borrado', kind: 'deleted' }]
  );

  assert.deepEqual(merged, [
    { path: 'src/a.ts', change: 'modificado', kind: 'modified' },
    { path: 'src/b.ts', change: 'borrado', kind: 'deleted' }
  ]);
});

test('mergeRisks deduplica por fuente, título y descripción', () => {
  const merged = mergeRisks(
    [{ title: 'scope', source: 'harness' }],
    [{ title: 'scope', source: 'harness' }],
    [{ title: 'scope', source: 'linter' }],
    [{ title: 'scope', description: 'detalle', source: 'harness' }]
  );

  assert.equal(merged.length, 3);
});

test('warningsToRisks convierte warnings del linter en riesgos de severidad baja', () => {
  assert.deepEqual(warningsToRisks(['import sin usar']), [
    { title: 'import sin usar', source: 'linter', severity: 'low' }
  ]);
});
