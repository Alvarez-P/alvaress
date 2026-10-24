import { DEFAULT_JEV_BASE, DEFAULT_JEV_TIMEOUT_MS, DEFAULT_ORCHESTRATOR_MODEL } from '../constants.js';
import type { HarnessConfig } from '../config/loader.js';
import { JevError } from '../utils/errors.js';

export type JevQuestion =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] };

export interface JevAnswerNoul {
  type: 'noul';
  noul: number;
}

export interface JevAnswerChoice {
  type: 'choice';
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface JevAnswerScore {
  type: 'score';
  score: number;
  confidence: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
}

export type JevAnswer = JevAnswerNoul | JevAnswerChoice | JevAnswerScore;

export interface JevRequest {
  model?: string;
  state: unknown;
  questions: Record<string, JevQuestion>;
}

export interface JevResponse {
  model: string;
  answers: Record<string, JevAnswer>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export interface JevModelMetadata {
  name: string;
  description: string;
  release_date: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface JevClientOptions {
  apiKey?: string;
  apiBase?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}

export interface ResolvedJevClient {
  apiKey: string;
  apiBase: string;
  model: string;
  timeoutMs: number;
  fetchImpl: FetchLike;
}

export function noul(instructions: string): JevQuestion {
  return { type: 'noul', instructions };
}

export function choice(instructions: string, criteria: Record<string, string>): JevQuestion {
  return { type: 'choice', instructions, criteria };
}

export function score(instructions: string, criteria: string[]): JevQuestion {
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

export function resolveJevClient(
  config: HarnessConfig,
  options: JevClientOptions = {}
): ResolvedJevClient {
  const orchestrator = config.models.jevOrchestrator;
  const apiKey = firstNonEmpty(
    options.apiKey,
    orchestrator.apiKey,
    orchestrator.env?.TYPESAFE_API_KEY,
    process.env.TYPESAFE_API_KEY
  );

  if (apiKey.length === 0) {
    throw new JevError(
      'JEV necesita una API key de TypeSafe. Configura models.jevOrchestrator.apiKey, la variable TYPESAFE_API_KEY o ejecuta "alvaress install".'
    );
  }

  return {
    apiKey,
    apiBase: firstNonEmpty(
      options.apiBase,
      orchestrator.apiBase,
      process.env.TYPESAFE_BASE_URL,
      DEFAULT_JEV_BASE
    ),
    model: firstNonEmpty(options.model, orchestrator.modelName, DEFAULT_ORCHESTRATOR_MODEL),
    timeoutMs: options.timeoutMs ?? DEFAULT_JEV_TIMEOUT_MS,
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

export function modelsEndpoint(apiBase: string): string {
  const base = apiBase.trim().replace(/\/+$/, '');
  if (base.endsWith('/systemone')) {
    return `${base.slice(0, -10)}/models`;
  }
  if (base.endsWith('/v1')) {
    return `${base}/models`;
  }
  return `${base}/v1/models`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertAnswer(key: string, value: unknown): asserts value is JevAnswer {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new JevError(`JEV devolvió una respuesta inválida para la pregunta "${key}".`);
  }
  if (value.type === 'noul' && typeof value.noul !== 'number') {
    throw new JevError(`JEV devolvió una probabilidad inválida para la pregunta "${key}".`);
  }
  if (value.type === 'choice' && typeof value.choice !== 'string') {
    throw new JevError(`JEV devolvió una elección inválida para la pregunta "${key}".`);
  }
  if (value.type === 'score' && typeof value.score !== 'number') {
    throw new JevError(`JEV devolvió un score inválido para la pregunta "${key}".`);
  }
}

export function parseJevResponse(value: unknown): JevResponse {
  if (!isRecord(value) || !isRecord(value.answers)) {
    throw new JevError('JEV devolvió una respuesta sin el campo "answers".');
  }
  const answers: Record<string, JevAnswer> = {};
  for (const [key, answer] of Object.entries(value.answers)) {
    assertAnswer(key, answer);
    answers[key] = answer;
  }
  return {
    model: typeof value.model === 'string' ? value.model : 'desconocido',
    answers,
    usage: isRecord(value.usage) ? (value.usage as JevResponse['usage']) : undefined
  };
}

function parseModels(value: unknown): JevModelMetadata[] {
  if (!isRecord(value) || !Array.isArray(value.models)) {
    throw new JevError('JEV devolvió una lista de modelos inválida.');
  }
  return value.models.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.name !== 'string') {
      throw new JevError(`JEV devolvió un modelo inválido en la posición ${index}.`);
    }
    return {
      name: entry.name,
      description: typeof entry.description === 'string' ? entry.description : '',
      release_date: typeof entry.release_date === 'string' ? entry.release_date : ''
    };
  });
}

export async function requestJev(
  request: JevRequest,
  client: ResolvedJevClient
): Promise<JevResponse> {
  let response: Response;
  try {
    response = await client.fetchImpl(systemOneEndpoint(client.apiBase), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model ?? client.model,
        state: request.state,
        questions: request.questions
      }),
      signal: AbortSignal.timeout(client.timeoutMs)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new JevError(`No se pudo contactar con JEV: ${message}`);
  }

  const raw = await response.text();
  if (!response.ok) {
    throw new JevError(`JEV respondió con HTTP ${response.status}: ${raw.slice(0, 500)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new JevError(`JEV devolvió JSON inválido: ${raw.slice(0, 200)}`);
  }
  return parseJevResponse(parsed);
}

export async function listJevModels(client: ResolvedJevClient): Promise<JevModelMetadata[]> {
  let response: Response;
  try {
    response = await client.fetchImpl(modelsEndpoint(client.apiBase), {
      method: 'GET',
      headers: { Authorization: `Bearer ${client.apiKey}` },
      signal: AbortSignal.timeout(client.timeoutMs)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new JevError(`No se pudo contactar con JEV: ${message}`);
  }

  const raw = await response.text();
  if (!response.ok) {
    throw new JevError(`JEV respondió con HTTP ${response.status}: ${raw.slice(0, 500)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new JevError(`JEV devolvió JSON inválido: ${raw.slice(0, 200)}`);
  }
  return parseModels(parsed);
}

export function noulAnswer(response: JevResponse, key: string): JevAnswerNoul {
  const answer = response.answers[key];
  if (answer === undefined || answer.type !== 'noul') {
    throw new JevError(`JEV no devolvió una respuesta de tipo "noul" para "${key}".`);
  }
  return answer;
}

export function choiceAnswer(response: JevResponse, key: string): JevAnswerChoice {
  const answer = response.answers[key];
  if (answer === undefined || answer.type !== 'choice') {
    throw new JevError(`JEV no devolvió una respuesta de tipo "choice" para "${key}".`);
  }
  return answer;
}

export function scoreAnswer(response: JevResponse, key: string): JevAnswerScore {
  const answer = response.answers[key];
  if (answer === undefined || answer.type !== 'score') {
    throw new JevError(`JEV no devolvió una respuesta de tipo "score" para "${key}".`);
  }
  return answer;
}
