import {
  DEFAULT_DECISION_BASE,
  DEFAULT_DECISION_MODEL,
  DEFAULT_DECISION_TIMEOUT_MS,
  isDecisionModel
} from '../constants.js';
import type { HarnessConfig } from '../config/loader.js';
import { DecisionError } from '../utils/errors.js';

export type DecisionQuestion =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] };

export interface DecisionAnswerNoul {
  type: 'noul';
  noul: number;
}

export interface DecisionAnswerChoice {
  type: 'choice';
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface DecisionAnswerScore {
  type: 'score';
  score: number;
  confidence: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
}

export type DecisionAnswer = DecisionAnswerNoul | DecisionAnswerChoice | DecisionAnswerScore;

export interface DecisionRequest {
  model?: string;
  state: unknown;
  questions: Record<string, DecisionQuestion>;
}

export interface DecisionResponse {
  model: string;
  answers: Record<string, DecisionAnswer>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface DecisionClientOptions {
  apiKey?: string;
  apiBase?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}

export interface ResolvedDecisionClient {
  apiKey: string;
  apiBase: string;
  model: string;
  timeoutMs: number;
  fetchImpl: FetchLike;
}

export function noul(instructions: string): DecisionQuestion {
  return { type: 'noul', instructions };
}

export function choice(instructions: string, criteria: Record<string, string>): DecisionQuestion {
  return { type: 'choice', instructions, criteria };
}

export function score(instructions: string, criteria: string[]): DecisionQuestion {
  return { type: 'score', instructions, criteria };
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (value !== undefined && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

export function normalizeDecisionModel(value: string | undefined): string | undefined {
  const model = value?.trim().toLowerCase();
  if (model === undefined || model.length === 0) {
    return undefined;
  }
  return isDecisionModel(model) ? model : undefined;
}

export function assertDecisionModel(value: string): string {
  const model = normalizeDecisionModel(value);
  if (model === undefined) {
    throw new DecisionError(
      `Modelo de decisión inválido: "${value}". Usa "kev" o "laya" (opcionalmente con etiqueta, por ejemplo "kev:9b").`
    );
  }
  return model;
}

export function resolveDecisionClient(
  config: HarnessConfig,
  options: DecisionClientOptions = {}
): ResolvedDecisionClient {
  const decision = config.decision;

  return {
    apiKey: firstNonEmpty(
      options.apiKey,
      decision.apiKey,
      process.env.ALVARESS_DECISION_API_KEY
    ),
    apiBase: firstNonEmpty(
      options.apiBase,
      decision.apiBase,
      process.env.ALVARESS_OLLAMA_BASE,
      DEFAULT_DECISION_BASE
    ),
    model: firstNonEmpty(
      options.model,
      decision.model,
      process.env.ALVARESS_DECISION_MODEL,
      DEFAULT_DECISION_MODEL
    ),
    timeoutMs: options.timeoutMs ?? decision.timeoutMs ?? DEFAULT_DECISION_TIMEOUT_MS,
    fetchImpl: options.fetchImpl ?? fetch
  };
}

export function systemOneEndpoint(apiBase: string): string {
  const base = apiBase.trim().replace(/\/+$/, '');
  if (base.endsWith('/systemone')) {
    return base;
  }
  if (base.endsWith('/v1')) {
    return `${base}/systemone`;
  }
  return `${base}/v1/systemone`;
}

export function tagsEndpoint(apiBase: string): string {
  const base = apiBase.trim().replace(/\/+$/, '');
  if (base.endsWith('/v1')) {
    return `${base.slice(0, -3)}/api/tags`;
  }
  return `${base}/api/tags`;
}

export function versionEndpoint(apiBase: string): string {
  const base = apiBase.trim().replace(/\/+$/, '');
  if (base.endsWith('/v1')) {
    return `${base.slice(0, -3)}/api/version`;
  }
  return `${base}/api/version`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertAnswer(key: string, value: unknown): asserts value is DecisionAnswer {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new DecisionError(`El modelo de decisión devolvió una respuesta inválida para "${key}".`);
  }
  if (value.type === 'noul' && typeof value.noul !== 'number') {
    throw new DecisionError(`El modelo de decisión devolvió una probabilidad inválida para "${key}".`);
  }
  if (value.type === 'choice' && typeof value.choice !== 'string') {
    throw new DecisionError(`El modelo de decisión devolvió una elección inválida para "${key}".`);
  }
  if (value.type === 'score' && typeof value.score !== 'number') {
    throw new DecisionError(`El modelo de decisión devolvió un score inválido para "${key}".`);
  }
}

export function parseDecisionResponse(value: unknown): DecisionResponse {
  if (!isRecord(value) || !isRecord(value.answers)) {
    throw new DecisionError('El modelo de decisión devolvió una respuesta sin el campo "answers".');
  }
  const answers: Record<string, DecisionAnswer> = {};
  for (const [key, answer] of Object.entries(value.answers)) {
    assertAnswer(key, answer);
    answers[key] = answer;
  }
  return {
    model: typeof value.model === 'string' ? value.model : 'desconocido',
    answers,
    usage: isRecord(value.usage) ? (value.usage as DecisionResponse['usage']) : undefined
  };
}

export async function requestDecision(
  request: DecisionRequest,
  client: ResolvedDecisionClient
): Promise<DecisionResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (client.apiKey.length > 0) {
    headers.Authorization = `Bearer ${client.apiKey}`;
  }

  let response: Response;
  try {
    response = await client.fetchImpl(systemOneEndpoint(client.apiBase), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: request.model ?? client.model,
        state: request.state,
        questions: request.questions
      }),
      signal: AbortSignal.timeout(client.timeoutMs)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DecisionError(
      `No se pudo contactar con Ollama en ${client.apiBase}: ${message}. ¿Está corriendo "ollama serve"?`
    );
  }

  const raw = await response.text();
  if (!response.ok) {
    throw new DecisionError(
      `El modelo de decisión respondió con HTTP ${response.status}: ${raw.slice(0, 500)}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DecisionError(`El modelo de decisión devolvió JSON inválido: ${raw.slice(0, 200)}`);
  }
  return parseDecisionResponse(parsed);
}

export function noulAnswer(response: DecisionResponse, key: string): DecisionAnswerNoul {
  const answer = response.answers[key];
  if (answer === undefined || answer.type !== 'noul') {
    throw new DecisionError(`El modelo de decisión no devolvió una respuesta "noul" para "${key}".`);
  }
  return answer;
}

export function choiceAnswer(response: DecisionResponse, key: string): DecisionAnswerChoice {
  const answer = response.answers[key];
  if (answer === undefined || answer.type !== 'choice') {
    throw new DecisionError(`El modelo de decisión no devolvió una respuesta "choice" para "${key}".`);
  }
  return answer;
}

export function scoreAnswer(response: DecisionResponse, key: string): DecisionAnswerScore {
  const answer = response.answers[key];
  if (answer === undefined || answer.type !== 'score') {
    throw new DecisionError(`El modelo de decisión no devolvió una respuesta "score" para "${key}".`);
  }
  return answer;
}
