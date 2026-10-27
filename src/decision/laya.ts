import path from 'node:path';
import type { LayaConfig } from '../config/loader.js';
import {
  DEFAULT_LAYA_TIMEOUT_MS,
  LAYA_FP32_MODEL_CACHE_ROOT,
  LAYA_INT8_MODEL_CACHE_ROOT
} from '../constants.js';
import type {
  DecisionEngine,
  FailureInput,
  FailureVerdict,
  LearningScopeDecision,
  LearningScopeInput,
  RiskAssessment,
  RiskInput,
  RouteDecision,
  RouteInput
} from '../core/contracts.js';
import { errorMessage } from '../utils/errors.js';
import { HeuristicDecisionEngine } from './heuristics.js';
import { BUNDLE_REVISION, LayaModel, verifyBundle } from './vendor/laya/index.js';
import type { Question } from './vendor/laya/index.js';

export interface LayaAnswer {
  type?: string;
  choice?: string;
  noul?: number;
  score?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
  answer_confidence?: number;
  label?: string;
  value?: unknown;
  answer?: unknown;
  probability?: number;
}

export interface LayaPrediction {
  answers: Record<string, LayaAnswer | undefined>;
}

export interface LayaAgentLike {
  predict(
    state: string,
    questions: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<LayaPrediction>;
  close?(): Promise<void> | void;
  dispose?(): Promise<void> | void;
}

export type LayaAgentLoader = (config: LayaConfig, root: string) => Promise<LayaAgentLike>;

function choice(instructions: string, criteria: Record<string, string>): Record<string, unknown> {
  return { type: 'choice', instructions, criteria };
}

function noul(instructions: string): Record<string, unknown> {
  return { type: 'noul', instructions };
}

/** Expande `~` sin depender de las utilidades de prompts. */
function expandHome(target: string): string {
  if (target === '~') {
    return process.env.HOME ?? target;
  }
  if (target.startsWith('~/')) {
    return path.join(process.env.HOME ?? '~', target.slice(2));
  }
  return target;
}

/**
 * Resuelve el directorio del bundle: `laya.modelDir` si está configurado, o la
 * caché global compartida. No descarga nada: si falta el modelo, el run cae a
 * heurísticas y el instalador es quien se encarga de bajarlo.
 *
 * La caché int8 es la preferida. Si no está y queda un bundle fp32 de una
 * instalación anterior, se reutiliza para no obligar a descargar el modelo otra
 * vez.
 */
export async function resolveLayaModelDir(config: LayaConfig, root: string): Promise<string> {
  const configured = config.modelDir?.trim() ?? '';
  if (configured.length > 0) {
    const dir = path.resolve(root, expandHome(configured));
    const check = await verifyBundle(dir);
    if (!check.ok) {
      const problems = [...check.missing, ...check.corrupt];
      throw new Error(
        `El modelo de Laya no está completo en ${dir} (${problems.join(', ')}). Ejecuta "alvaress install".`
      );
    }
    return dir;
  }

  const int8Dir = path.join(LAYA_INT8_MODEL_CACHE_ROOT, BUNDLE_REVISION);
  const legacyDir = path.join(LAYA_FP32_MODEL_CACHE_ROOT, BUNDLE_REVISION);
  const int8Check = await verifyBundle(int8Dir);
  if (int8Check.ok) {
    return int8Dir;
  }
  if ((await verifyBundle(legacyDir)).ok) {
    return legacyDir;
  }

  const problems = [...int8Check.missing, ...int8Check.corrupt];
  throw new Error(
    `El modelo de Laya no está completo en ${int8Dir} (${problems.join(', ')}). Ejecuta "alvaress install".`
  );
}

export async function loadLayaAgent(config: LayaConfig, root: string): Promise<LayaAgentLike> {
  const dir = await resolveLayaModelDir(config, root);
  const model = await LayaModel.load({
    dir,
    ...(config.device !== undefined ? { device: config.device } : {}),
    ...(config.threads !== undefined ? { threads: config.threads } : {}),
    resolveFrom: root
  });

  return {
    predict: (state, questions) => model.systemOne(state, questions as Record<string, Question>),
    close: () => model.close()
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Laya agotó ${timeoutMs}ms en ${label}.`));
    }, timeoutMs);
    timer.unref?.();

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

function readChoice(answer: LayaAnswer | undefined): string | undefined {
  if (answer === undefined) {
    return undefined;
  }
  if (typeof answer.choice === 'string') {
    return answer.choice;
  }
  if (typeof answer.label === 'string') {
    return answer.label;
  }
  if (typeof answer.answer === 'string') {
    return answer.answer;
  }
  if (typeof answer.value === 'string') {
    return answer.value;
  }
  return undefined;
}

function readBoolean(answer: LayaAnswer | undefined): boolean | undefined {
  if (answer === undefined) {
    return undefined;
  }
  if (typeof answer.noul === 'number' && Number.isFinite(answer.noul)) {
    return answer.noul >= 0.5;
  }
  if (typeof answer.answer === 'boolean') {
    return answer.answer;
  }
  if (typeof answer.value === 'boolean') {
    return answer.value;
  }
  if (typeof answer.label === 'string') {
    return answer.label === 'yes' || answer.label === 'true' || answer.label === 'sí';
  }
  return undefined;
}

function readConfidence(answer: LayaAnswer | undefined, fallback: number): number {
  // `answer_confidence` (max p) es la cantidad para la que se calibraron las
  // temperaturas; `confidence` es 1 - entropía normalizada.
  const value = answer?.answer_confidence ?? answer?.confidence ?? answer?.probability;
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function describeRisk(input: RiskInput): string {
  const changes = input.changes
    .map((change) => `${change.kind ?? 'modified'} ${change.path}: ${change.change}`)
    .join('\n');
  const warnings = input.warnings.map((warning) => `- ${warning}`).join('\n');
  return `Petición: ${input.request}\nCambios:\n${changes || 'sin cambios'}\nWarnings:\n${warnings || 'sin warnings'}`;
}

export class LayaDecisionEngine implements DecisionEngine {
  private readonly agent: LayaAgentLike;
  private readonly fallback: DecisionEngine;
  private readonly timeoutMs: number;

  constructor(
    agent: LayaAgentLike,
    options: { fallback?: DecisionEngine; timeoutMs?: number } = {}
  ) {
    this.agent = agent;
    this.fallback = options.fallback ?? new HeuristicDecisionEngine();
    this.timeoutMs = options.timeoutMs ?? DEFAULT_LAYA_TIMEOUT_MS;
  }

  async route(input: RouteInput): Promise<RouteDecision> {
    try {
      const prediction = await this.ask(
        input.request,
        {
          mode: choice('¿La tarea necesita una spec SDD o basta una nota ODD?', {
            odd: 'cambio pequeño, local y de un solo contexto',
            sdd: 'tarea grande, multiarchivo o con varios contextos'
          }),
          complexity: choice('¿Qué complejidad tiene la tarea?', {
            trivial: 'un cambio mínimo en un archivo',
            small: 'un cambio acotado con pocas verificaciones',
            medium: 'varios archivos o decisiones de diseño locales',
            large: 'rediseño, migración o cambio transversal'
          }),
          needsGraph: noul('¿Conviene consultar el grafo de Graphify antes de editar?'),
          needsSubagents: noul('¿Conviene repartir el trabajo en subagentes especializados?')
        },
        'route'
      );

      const mode = readChoice(prediction.answers.mode) === 'sdd' ? 'sdd' : 'odd';
      const complexity = readChoice(prediction.answers.complexity);
      const validComplexity =
        complexity === 'trivial' ||
        complexity === 'small' ||
        complexity === 'medium' ||
        complexity === 'large';

      return {
        mode,
        complexity: validComplexity ? complexity : 'small',
        needsGraph: readBoolean(prediction.answers.needsGraph) ?? mode === 'sdd',
        needsSubagents: readBoolean(prediction.answers.needsSubagents) ?? mode === 'sdd',
        confidence: readConfidence(prediction.answers.mode, 0.7),
        source: 'laya'
      };
    } catch {
      return this.fallback.route(input);
    }
  }

  async assessRisk(input: RiskInput): Promise<RiskAssessment> {
    const base = await this.fallback.assessRisk(input);

    try {
      const prediction = await this.ask(
        describeRisk(input),
        {
          severity: choice('¿Qué severidad tiene el riesgo residual de este cambio?', {
            none: 'no hay riesgo residual relevante',
            low: 'riesgo cosmético o de estilo',
            medium: 'requiere revisión humana antes de publicar',
            high: 'puede romper contratos, seguridad o datos'
          })
        },
        'risk'
      );

      const severity = readChoice(prediction.answers.severity);
      const risks = [...base.risks];
      if (severity === 'medium' || severity === 'high') {
        risks.push({
          title: `Laya clasificó el riesgo residual como ${severity}.`,
          source: 'laya',
          severity
        });
      }

      return {
        risks,
        confidence: readConfidence(prediction.answers.severity, base.confidence),
        source: 'laya'
      };
    } catch {
      return base;
    }
  }

  async classifyFailure(input: FailureInput): Promise<FailureVerdict> {
    try {
      const prediction = await this.ask(
        `Comando: ${input.command}\nIntento: ${input.attempt}\nSalida:\n${input.error}`,
        {
          verdict: choice('¿Cómo debe tratarse este fallo de validación?', {
            trivial: 'es local y se repara con un cambio acotado',
            orchestrator: 'necesita una decisión de diseño del orquestador',
            nuclear: 'rompe un contrato, esquema, migración o el entorno'
          })
        },
        'failure'
      );

      const verdict = readChoice(prediction.answers.verdict);
      const nuclear = verdict === 'nuclear';
      return {
        trivial: verdict === 'trivial',
        nuclear,
        reason:
          verdict === 'orchestrator'
            ? `Laya pide decisión del orquestador para el fallo de "${input.command}".`
            : `Laya clasificó el fallo de "${input.command}" como ${verdict ?? 'desconocido'}.`,
        confidence: readConfidence(prediction.answers.verdict, 0.7),
        source: 'laya'
      };
    } catch {
      return this.fallback.classifyFailure(input);
    }
  }

  async decideLearningScope(input: LearningScopeInput): Promise<LearningScopeDecision> {
    const base = await this.fallback.decideLearningScope(input);

    try {
      const prediction = await this.ask(
        `Proyecto: ${input.project}\nTipo: ${input.kind}\nTítulo: ${input.title}\nDetalle: ${input.body}\nTags: ${input.tags.join(', ') || 'sin tags'}`,
        {
          scope: choice('¿Este aprendizaje sirve en otros proyectos o es específico de este?', {
            global:
              'es una práctica, error o solución general que se puede reutilizar en cualquier proyecto',
            project:
              'menciona archivos, comandos, convenciones o contexto que solo existen en este proyecto'
          })
        },
        'learning-scope'
      );

      const scope = readChoice(prediction.answers.scope) === 'global' ? 'global' : 'project';
      return {
        scope,
        confidence: readConfidence(prediction.answers.scope, base.confidence),
        reason: `Laya clasificó el aprendizaje como ${scope === 'global' ? 'global' : 'del proyecto'}.`,
        source: 'laya'
      };
    } catch {
      return base;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.agent.close !== undefined) {
        await this.agent.close();
        return;
      }
      if (this.agent.dispose !== undefined) {
        await this.agent.dispose();
      }
    } catch {
      // El descargue del modelo no debe romper el cierre del run.
    }
  }

  private ask(
    state: string,
    questions: Record<string, unknown>,
    label: string
  ): Promise<LayaPrediction> {
    return withTimeout(this.agent.predict(state, questions), this.timeoutMs, label);
  }
}

export interface CreateDecisionEngineOptions {
  config: LayaConfig;
  /** Raíz del proyecto; desde ahí se resuelven el modelo y el runtime de ONNX. */
  root?: string;
  loader?: LayaAgentLoader;
  fallback?: DecisionEngine;
}

export async function createDecisionEngine(
  options: CreateDecisionEngineOptions
): Promise<DecisionEngine> {
  const fallback = options.fallback ?? new HeuristicDecisionEngine();
  if (!options.config.enabled) {
    return fallback;
  }

  try {
    const agent = await (options.loader ?? loadLayaAgent)(
      options.config,
      options.root ?? process.cwd()
    );
    return new LayaDecisionEngine(agent, {
      fallback,
      timeoutMs: options.config.timeoutMs
    });
  } catch (error) {
    if (!options.config.fallbackToHeuristic) {
      throw new Error(`No se pudo cargar Laya: ${errorMessage(error)}`, { cause: error });
    }
    return fallback;
  }
}
