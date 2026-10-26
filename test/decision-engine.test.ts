import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { LayaConfig } from '../src/config/loader.js';
import type { FailureInput, RiskInput } from '../src/core/contracts.js';
import { HeuristicDecisionEngine, estimateComplexity } from '../src/decision/heuristics.js';
import {
  LayaDecisionEngine,
  createDecisionEngine
} from '../src/decision/laya.js';
import type { LayaAgentLike, LayaAnswer, LayaPrediction } from '../src/decision/laya.js';

function layaConfig(overrides: Partial<LayaConfig> = {}): LayaConfig {
  return {
    enabled: true,
    model: 'convaiinnovations/laya',
    subfolder: 'multilingual',
    device: 'cpu',
    timeoutMs: 1000,
    fallbackToHeuristic: true,
    ...overrides
  };
}

function fakeAgent(
  answers: Record<string, LayaAnswer | undefined> | (() => Promise<LayaPrediction>)
): LayaAgentLike & { calls: Array<{ state: string; questions: Record<string, unknown> }>; closed: boolean } {
  const calls: Array<{ state: string; questions: Record<string, unknown> }> = [];
  const agent = {
    calls,
    closed: false,
    async predict(state: string, questions: Record<string, unknown>): Promise<LayaPrediction> {
      calls.push({ state, questions });
      if (typeof answers === 'function') {
        return answers();
      }
      return { answers };
    },
    async dispose(): Promise<void> {
      agent.closed = true;
    }
  };
  return agent;
}

test('estimateComplexity escala de trivial a large', () => {
  assert.equal(estimateComplexity({ request: 'arregla un typo' }), 'trivial');
  assert.equal(
    estimateComplexity({ request: 'agrega una función de utilidad y su test unitario' }),
    'small'
  );
  assert.equal(
    estimateComplexity({
      request:
        'refactoriza el cargador de configuración para separar la validación de la fusión de valores y agrega pruebas de regresión para cada rama'
    }),
    'medium'
  );
  assert.equal(
    estimateComplexity({ request: 'x'.repeat(500), files: ['a', 'b', 'c', 'd', 'e'] }),
    'large'
  );
});

test('HeuristicDecisionEngine elige ODD para cambios pequeños', async () => {
  const decision = await new HeuristicDecisionEngine().route({ request: 'corrige el typo del README' });

  assert.equal(decision.mode, 'odd');
  assert.equal(decision.complexity, 'trivial');
  assert.equal(decision.needsGraph, false);
  assert.equal(decision.source, 'heuristic');
});

test('HeuristicDecisionEngine elige SDD para arquitectura o muchos archivos', async () => {
  const engine = new HeuristicDecisionEngine();
  const byText = await engine.route({ request: 'rediseña la arquitectura del instalador' });
  const byFiles = await engine.route({
    request: 'ajusta imports',
    files: ['a.ts', 'b.ts', 'c.ts', 'd.ts']
  });

  assert.equal(byText.mode, 'sdd');
  assert.equal(byText.needsGraph, true);
  assert.equal(byText.needsSubagents, true);
  assert.equal(byFiles.mode, 'sdd');
  assert.equal(byFiles.complexity, 'medium');
});

test('HeuristicDecisionEngine detecta consultas al grafo', async () => {
  const decision = await new HeuristicDecisionEngine().route({
    request: 'revisa las dependencias entre módulos',
    files: ['a.ts', 'b.ts', 'c.ts']
  });

  assert.equal(decision.needsGraph, true);
});

function riskInput(overrides: Partial<RiskInput> = {}): RiskInput {
  return {
    request: 'cambia la configuración',
    changes: [{ path: 'src/config/loader.ts', change: 'agrega laya' }],
    warnings: ['import sin usar'],
    ...overrides
  };
}

test('HeuristicDecisionEngine convierte warnings y archivos sensibles en riesgos', async () => {
  const assessment = await new HeuristicDecisionEngine().assessRisk(riskInput());

  assert.equal(assessment.source, 'heuristic');
  assert.deepEqual(
    assessment.risks.map((risk) => risk.source),
    ['linter', 'harness']
  );
  assert.equal(assessment.risks[1]?.severity, 'high');
});

test('HeuristicDecisionEngine marca diffs amplios y borrados', async () => {
  const changes = Array.from({ length: 6 }, (_, index) => ({
    path: `src/file-${index}.ts`,
    change: 'ajuste',
    ...(index === 0 ? { kind: 'deleted' as const } : {})
  }));
  const assessment = await new HeuristicDecisionEngine().assessRisk(
    riskInput({ changes, warnings: [] })
  );

  assert.equal(assessment.risks.length, 2);
  assert.match(assessment.risks[0]?.title ?? '', /6 archivos/);
  assert.match(assessment.risks[1]?.title ?? '', /eliminados/);
});

function failureInput(overrides: Partial<FailureInput> = {}): FailureInput {
  return {
    command: 'vp check',
    exitCode: 1,
    error: 'error TS2322: Type string is not assignable to type number',
    attempt: 1,
    ...overrides
  };
}

test('HeuristicDecisionEngine clasifica errores locales como triviales', async () => {
  const verdict = await new HeuristicDecisionEngine().classifyFailure(failureInput());

  assert.equal(verdict.trivial, true);
  assert.equal(verdict.nuclear, false);
});

test('HeuristicDecisionEngine clasifica fallos estructurales como nucleares', async () => {
  const engine = new HeuristicDecisionEngine();
  const schema = await engine.classifyFailure(
    failureInput({ error: 'la migración rompe el schema de la base de datos' })
  );
  const killed = await engine.classifyFailure(failureInput({ exitCode: 137, error: '' }));

  assert.equal(schema.nuclear, true);
  assert.equal(killed.nuclear, true);
});

test('HeuristicDecisionEngine no inventa trivialidad ante errores desconocidos', async () => {
  const verdict = await new HeuristicDecisionEngine().classifyFailure(
    failureInput({ error: 'algo salió mal' })
  );

  assert.equal(verdict.trivial, false);
  assert.equal(verdict.nuclear, false);
  assert.match(verdict.reason, /no es concluyente/);
});

test('LayaDecisionEngine interpreta las respuestas tipadas de laya-ts', async () => {
  const agent = fakeAgent({
    mode: { type: 'choice', label: 'sdd', confidence: 0.91 },
    complexity: { type: 'choice', label: 'large' },
    needsGraph: { type: 'noul', answer: true },
    needsSubagents: { type: 'noul', answer: true }
  });
  const engine = new LayaDecisionEngine(agent);
  const decision = await engine.route({ request: 'rediseña el instalador' });

  assert.equal(decision.mode, 'sdd');
  assert.equal(decision.complexity, 'large');
  assert.equal(decision.needsGraph, true);
  assert.equal(decision.needsSubagents, true);
  assert.equal(decision.confidence, 0.91);
  assert.equal(decision.source, 'laya');
  assert.equal(agent.calls.length, 1);
  assert.ok(agent.calls[0]?.questions.mode !== undefined);
});

test('LayaDecisionEngine cae a heurísticas si laya-ts falla', async () => {
  const agent = fakeAgent(async () => {
    throw new Error('modelo no disponible');
  });
  const engine = new LayaDecisionEngine(agent);
  const decision = await engine.route({ request: 'corrige el typo del README' });

  assert.equal(decision.source, 'heuristic');
  assert.equal(decision.mode, 'odd');
});

test('LayaDecisionEngine respeta el timeout y usa el fallback', async () => {
  const agent = fakeAgent(() => new Promise<LayaPrediction>(() => undefined));
  const engine = new LayaDecisionEngine(agent, { timeoutMs: 5 });
  const decision = await engine.route({ request: 'arregla algo pequeño' });

  assert.equal(decision.source, 'heuristic');
});

test('LayaDecisionEngine agrega el riesgo que detecta laya-ts', async () => {
  const agent = fakeAgent({
    severity: { type: 'choice', label: 'high', confidence: 0.88 }
  });
  const assessment = await new LayaDecisionEngine(agent).assessRisk(riskInput());

  assert.equal(assessment.source, 'laya');
  assert.equal(assessment.confidence, 0.88);
  assert.ok(assessment.risks.some((risk) => risk.source === 'laya' && risk.severity === 'high'));
});

test('LayaDecisionEngine no agrega ruido cuando el riesgo es bajo', async () => {
  const agent = fakeAgent({ severity: { type: 'choice', label: 'low' } });
  const assessment = await new LayaDecisionEngine(agent).assessRisk(
    riskInput({ warnings: [], changes: [{ path: 'README.md', change: 'typo' }] })
  );

  assert.equal(assessment.risks.length, 0);
});

test('LayaDecisionEngine traduce el veredicto de fallo', async () => {
  const nuclear = new LayaDecisionEngine(
    fakeAgent({ verdict: { type: 'choice', label: 'nuclear', confidence: 0.95 } })
  );
  const orchestrator = new LayaDecisionEngine(
    fakeAgent({ verdict: { type: 'choice', label: 'orchestrator' } })
  );

  const nuclearVerdict = await nuclear.classifyFailure(failureInput());
  const orchestratorVerdict = await orchestrator.classifyFailure(failureInput());

  assert.equal(nuclearVerdict.nuclear, true);
  assert.equal(nuclearVerdict.trivial, false);
  assert.equal(nuclearVerdict.source, 'laya');
  assert.equal(orchestratorVerdict.nuclear, false);
  assert.match(orchestratorVerdict.reason, /orquestador/);
});

test('LayaDecisionEngine cierra el agente al terminar', async () => {
  const agent = fakeAgent({});
  await new LayaDecisionEngine(agent).close();

  assert.equal(agent.closed, true);
});

test('createDecisionEngine usa heurísticas cuando laya está deshabilitado', async () => {
  const engine = await createDecisionEngine({
    config: layaConfig({ enabled: false })
  });

  assert.ok(engine instanceof HeuristicDecisionEngine);
});

test('createDecisionEngine cae a heurísticas si el cargador falla', async () => {
  const engine = await createDecisionEngine({
    config: layaConfig(),
    loader: async () => {
      throw new Error('laya-ts no está instalado');
    }
  });

  assert.ok(engine instanceof HeuristicDecisionEngine);
});

test('createDecisionEngine propaga el error si el fallback está deshabilitado', async () => {
  await assert.rejects(
    createDecisionEngine({
      config: layaConfig({ fallbackToHeuristic: false }),
      loader: async () => {
        throw new Error('laya-ts no está instalado');
      }
    }),
    /No se pudo cargar laya-ts/
  );
});

test('createDecisionEngine envuelve el agente cargado', async () => {
  const agent = fakeAgent({ mode: { type: 'choice', label: 'odd' } });
  const engine = await createDecisionEngine({
    config: layaConfig(),
    loader: async () => agent
  });

  assert.ok(engine instanceof LayaDecisionEngine);
});
