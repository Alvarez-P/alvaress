import fs from 'node:fs';
import type { LayaConfig } from '../config/loader.js';
import { DEFAULT_LAYA_TIMEOUT_MS, LAYA_TS_PACKAGE } from '../constants.js';
import type {
  DecisionEngine,
  FailureInput,
  FailureVerdict,
  RiskAssessment,
  RiskInput,
  RouteDecision,
  RouteInput
} from '../core/contracts.js';
import { errorMessage } from '../utils/errors.js';
import { HeuristicDecisionEngine } from './heuristics.js';

export interface LayaAnswer {
  type?: string;
  label?: string;
  value?: unknown;
  answer?: unknown;
  confidence?: number;
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

export type LayaAgentLoader = (config: LayaConfig) => Promise<LayaAgentLike>;

function choice(instructions: string, criteria: Record<string, string>): Record<string, unknown> {
  return { type: 'choice', instructions, criteria };
}

function noul(instructions: string): Record<string, unknown> {
  return { type: 'noul', instructions };
}

export async function loadLayaAgent(config: LayaConfig): Promise<LayaAgentLike> {
  const specifier = LAYA_TS_PACKAGE;
  const module = (await import(specifier)) as {
    Agent?: { load(model: string, options?: Record<string, unknown>): Promise<LayaAgentLike> };
  };

  if (module.Agent === undefined) {
    throw new Error('laya-ts no exporta Agent; revisa la versión instalada.');
  }

  const localPath =
    config.model.startsWith('.') ||
    config.model.startsWith('/') ||
    fs.existsSync(config.model);
  const options: Record<string, unknown> = { device: config.device ?? 'cpu' };
  if (!localPath && config.subfolder !== undefined && config.subfolder.length > 0) {
    options.subfolder = config.subfolder;
  }

  return module.Agent.load(config.model, options);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`laya-ts agotó ${timeoutMs}ms en ${label}.`));
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
  const value = answer?.confidence ?? answer?.probability;
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
          title: `laya-ts clasificó el riesgo residual como ${severity}.`,
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
            ? `laya-ts pide decisión del orquestador para el fallo de "${input.command}".`
            : `laya-ts clasificó el fallo de "${input.command}" como ${verdict ?? 'desconocido'}.`,
        confidence: readConfidence(prediction.answers.verdict, 0.7),
        source: 'laya'
      };
    } catch {
      return this.fallback.classifyFailure(input);
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
    const agent = await (options.loader ?? loadLayaAgent)(options.config);
    return new LayaDecisionEngine(agent, {
      fallback,
      timeoutMs: options.config.timeoutMs
    });
  } catch (error) {
    if (!options.config.fallbackToHeuristic) {
      throw new Error(`No se pudo cargar laya-ts: ${errorMessage(error)}`, { cause: error });
    }
    return fallback;
  }
}
