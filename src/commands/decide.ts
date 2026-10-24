import fs from 'node:fs';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import { DEFAULT_DECISION_CACHE_TTL_MS } from '../constants.js';
import { readDecisionCache, writeDecisionCache } from '../decision/cache.js';
import {
  assertDecisionModel,
  choice,
  choiceAnswer,
  noul,
  noulAnswer,
  requestDecision,
  resolveDecisionClient,
  score,
  scoreAnswer
} from '../decision/client.js';
import type {
  DecisionQuestion,
  DecisionRequest,
  DecisionResponse,
  FetchLike
} from '../decision/client.js';
import { DecisionError, errorMessage } from '../utils/errors.js';
import { redactValue } from '../utils/redact.js';

const HELP = `alvaress decide

Uso:
  alvaress decide --state "<texto>" [--state-file <ruta>] [--gate]
  alvaress decide predict --state "<texto>" --question "<pregunta>" [--threshold 0.8]
  alvaress decide choose  --state "<texto>" --question "<pregunta>" --option clave="descripción" --option ...
  alvaress decide score   --state "<texto>" --question "<pregunta>" --level "nivel 0" --level "nivel 1" ...
  alvaress decide ask     --request-file peticion.json
  alvaress decide ask     --request '{"state":...,"questions":{...}}'

Entrada de estado:
  --state "<texto>"        Estado en texto plano.
  --state-json "<json>"    Estado estructurado (JSON).
  --state-file <ruta>      Lee el estado de un archivo ("-" = stdin).

Opciones:
  --format json|text       Salida JSON (por defecto) o solo el valor.
  --model <modelo>         Sobrescribe el modelo: kev o laya (admite etiquetas, p. ej. kev:9b).
  --threshold <0..1>       En predict/decide, exige claridad mínima.
  --min-confidence <0..1>  En choose/decide, exige confianza mínima.
  --gate                   En decide, devuelve exit 1 si no se superan los umbrales.
  --no-cache               No lee ni escribe la caché local de decisiones.
  --cache-ttl <ms>         TTL de la caché en milisegundos.
  --no-redact              No redacta secretos del estado antes de enviarlo.

Códigos de salida:
  0  Éxito (y gate superado, si existe).
  1  Gate no superado (la respuesta se imprime igualmente).
  2  Error de configuración, red o API.

El modelo de decisión corre en Ollama (/v1/systemone). Es opcional: si Ollama no
responde, el agente alvaress continúa con heurísticas locales.`;

const DEFAULT_CLARITY_QUESTION =
  '¿La solicitud es suficientemente clara y completa para implementarse sin preguntas adicionales?';
const DEFAULT_PATH_QUESTION = '¿Cuál es el siguiente paso más eficiente para resolver la solicitud?';
const DEFAULT_COMPLEXITY_QUESTION = '¿Qué complejidad tiene el cambio?';
const DEFAULT_PATH_OPTIONS: Record<string, string> = {
  spec: 'Crear o actualizar la especificación y las tareas SDD',
  apply: 'Ejecutar tareas pendientes con Aider',
  direct: 'Implementar un cambio pequeño directamente',
  verify: 'Validar y reparar una tarea existente',
  answer: 'Responder sin modificar código'
};
const DEFAULT_COMPLEXITY_LEVELS = [
  'trivial: un archivo, cambio local y reversible',
  'media: varios archivos de un mismo bounded context',
  'alta: varios contextos, migraciones o cambios de arquitectura'
];

interface ChoiceOption {
  key: string;
  description: string;
}

interface ParsedDecisionArgs {
  state?: string;
  stateJson?: string;
  stateFile?: string;
  question?: string;
  options: ChoiceOption[];
  levels: string[];
  threshold?: number;
  minConfidence?: number;
  format: 'json' | 'text';
  model?: string;
  request?: string;
  requestFile?: string;
  cache?: boolean;
  cacheTtlMs?: number;
  redact?: boolean;
  gate?: boolean;
  help: boolean;
}

export interface DecideCommandDeps {
  config?: HarnessConfig;
  fetchImpl?: FetchLike;
  stdout?: (line: string) => void;
  stderr?: (line: string) => void;
  readStdin?: () => Promise<string>;
}

function parseNumber(value: string, flag: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new DecisionError(`${flag} necesita un número válido.`);
  }
  return parsed;
}

function parseOption(value: string): ChoiceOption {
  const separator = value.indexOf('=');
  if (separator <= 0) {
    throw new DecisionError('Cada --option debe tener el formato clave="descripción".');
  }
  const key = value.slice(0, separator).trim();
  const description = value.slice(separator + 1).trim();
  if (key.length === 0 || description.length === 0) {
    throw new DecisionError('Cada --option necesita una clave y una descripción no vacías.');
  }
  return { key, description };
}

function parseDecisionArgs(args: string[]): ParsedDecisionArgs {
  const parsed: ParsedDecisionArgs = {
    options: [],
    levels: [],
    format: 'json',
    help: false
  };

  const take = (index: number, flag: string): [string, number] => {
    const value = args[index + 1];
    if (value === undefined) {
      throw new DecisionError(`Falta el valor de ${flag}.`);
    }
    return [value, index + 1];
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index] ?? '';
    switch (argument) {
      case '--state': {
        const [value, next] = take(index, argument);
        parsed.state = value;
        index = next;
        break;
      }
      case '--state-json': {
        const [value, next] = take(index, argument);
        parsed.stateJson = value;
        index = next;
        break;
      }
      case '--state-file': {
        const [value, next] = take(index, argument);
        parsed.stateFile = value;
        index = next;
        break;
      }
      case '--question': {
        const [value, next] = take(index, argument);
        parsed.question = value;
        index = next;
        break;
      }
      case '--option': {
        const [value, next] = take(index, argument);
        parsed.options.push(parseOption(value));
        index = next;
        break;
      }
      case '--level': {
        const [value, next] = take(index, argument);
        parsed.levels.push(value);
        index = next;
        break;
      }
      case '--threshold': {
        const [value, next] = take(index, argument);
        parsed.threshold = parseNumber(value, argument);
        index = next;
        break;
      }
      case '--min-confidence': {
        const [value, next] = take(index, argument);
        parsed.minConfidence = parseNumber(value, argument);
        index = next;
        break;
      }
      case '--format': {
        const [value, next] = take(index, argument);
        if (value !== 'json' && value !== 'text') {
          throw new DecisionError('--format solo admite "json" o "text".');
        }
        parsed.format = value;
        index = next;
        break;
      }
      case '--model': {
        const [value, next] = take(index, argument);
        parsed.model = assertDecisionModel(value);
        index = next;
        break;
      }
      case '--request': {
        const [value, next] = take(index, argument);
        parsed.request = value;
        index = next;
        break;
      }
      case '--request-file': {
        const [value, next] = take(index, argument);
        parsed.requestFile = value;
        index = next;
        break;
      }
      case '--cache-ttl': {
        const [value, next] = take(index, argument);
        parsed.cacheTtlMs = parseNumber(value, argument);
        index = next;
        break;
      }
      case '--no-cache':
        parsed.cache = false;
        break;
      case '--no-redact':
        parsed.redact = false;
        break;
      case '--gate':
        parsed.gate = true;
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
      default:
        throw new DecisionError(`Opción desconocida para decide: ${argument}`);
    }
  }

  return parsed;
}

async function readStdinDefault(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function readState(
  parsed: ParsedDecisionArgs,
  readStdin: () => Promise<string>
): Promise<unknown> {
  const provided = [parsed.state, parsed.stateJson, parsed.stateFile].filter(
    (value) => value !== undefined
  ).length;
  if (provided === 0) {
    throw new DecisionError('Falta el estado: usa --state, --state-json o --state-file.');
  }
  if (provided > 1) {
    throw new DecisionError('Usa solo uno de --state, --state-json o --state-file.');
  }
  if (parsed.stateJson !== undefined) {
    try {
      return JSON.parse(parsed.stateJson);
    } catch {
      throw new DecisionError('--state-json no contiene JSON válido.');
    }
  }
  if (parsed.stateFile !== undefined) {
    if (parsed.stateFile === '-') {
      return readStdin();
    }
    try {
      return fs.readFileSync(parsed.stateFile, 'utf-8');
    } catch (error) {
      throw new DecisionError(`No se pudo leer el estado de ${parsed.stateFile}: ${errorMessage(error)}`);
    }
  }
  return parsed.state;
}

function requireQuestion(parsed: ParsedDecisionArgs): string {
  if (parsed.question === undefined || parsed.question.trim().length === 0) {
    throw new DecisionError('Falta --question.');
  }
  return parsed.question;
}

async function readRequest(
  parsed: ParsedDecisionArgs,
  readStdin: () => Promise<string>
): Promise<DecisionRequest> {
  const provided = [parsed.request, parsed.requestFile].filter((value) => value !== undefined).length;
  if (provided === 0) {
    throw new DecisionError('Falta --request o --request-file para "decide ask".');
  }
  if (provided > 1) {
    throw new DecisionError('Usa solo uno de --request o --request-file.');
  }

  let raw: string;
  if (parsed.request !== undefined) {
    raw = parsed.request;
  } else if (parsed.requestFile === '-') {
    raw = await readStdin();
  } else {
    try {
      raw = fs.readFileSync(parsed.requestFile ?? '', 'utf-8');
    } catch (error) {
      throw new DecisionError(`No se pudo leer ${parsed.requestFile}: ${errorMessage(error)}`);
    }
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new DecisionError('La petición de "decide ask" no contiene JSON válido.');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DecisionError('La petición de "decide ask" debe ser un objeto JSON.');
  }
  const request = value as Record<string, unknown>;
  if (request.state === undefined) {
    throw new DecisionError('La petición de "decide ask" necesita "state".');
  }
  if (typeof request.questions !== 'object' || request.questions === null || Array.isArray(request.questions)) {
    throw new DecisionError('La petición de "decide ask" necesita "questions" como objeto.');
  }
  return {
    state: request.state,
    questions: request.questions as Record<string, DecisionQuestion>,
    model: typeof request.model === 'string' ? request.model : undefined
  };
}

function maybeRedact(state: unknown, parsed: ParsedDecisionArgs): unknown {
  return parsed.redact === false ? state : redactValue(state);
}

function buildDecideRequest(state: unknown): DecisionRequest {
  return {
    state,
    questions: {
      clarity: noul(DEFAULT_CLARITY_QUESTION),
      path: choice(DEFAULT_PATH_QUESTION, DEFAULT_PATH_OPTIONS),
      complexity: score(DEFAULT_COMPLEXITY_QUESTION, DEFAULT_COMPLEXITY_LEVELS)
    }
  };
}

function renderDecideText(result: {
  clarity: { probability: number; pass: boolean };
  path: { choice: string; confidence: number; pass: boolean };
  complexity: { score: number; legend: Record<string, string> };
}): string {
  const complexity =
    result.complexity.legend[String(result.complexity.score)] ?? String(result.complexity.score);
  return [
    `Claridad: ${result.clarity.probability.toFixed(3)} (${result.clarity.pass ? 'OK' : 'preguntar'})`,
    `Camino: ${result.path.choice} (${result.path.confidence.toFixed(3)}, ${result.path.pass ? 'OK' : 'revisar'})`,
    `Complejidad: ${complexity} (${result.complexity.score})`
  ].join('\n');
}

async function runDecide(
  state: unknown,
  parsed: ParsedDecisionArgs,
  config: HarnessConfig,
  root: string,
  client: ReturnType<typeof resolveDecisionClient>,
  stdout: (line: string) => void
): Promise<number> {
  const request = buildDecideRequest(state);
  const cacheEnabled = parsed.cache !== false && config.decision.cache;
  const ttl = parsed.cacheTtlMs ?? config.decision.cacheTtlMs ?? DEFAULT_DECISION_CACHE_TTL_MS;
  let response: DecisionResponse | undefined = cacheEnabled
    ? readDecisionCache(root, request, ttl)
    : undefined;
  const cached = response !== undefined;
  if (response === undefined) {
    response = await requestDecision(request, client);
    if (cacheEnabled) {
      writeDecisionCache(root, request, response);
    }
  }

  const clarity = noulAnswer(response, 'clarity');
  const pathAnswer = choiceAnswer(response, 'path');
  const complexity = scoreAnswer(response, 'complexity');
  const clarityThreshold = parsed.threshold ?? 0.7;
  const minConfidence = parsed.minConfidence ?? 0.55;
  const result = {
    type: 'decide' as const,
    clarity: {
      probability: clarity.noul,
      threshold: clarityThreshold,
      pass: clarity.noul >= clarityThreshold
    },
    path: {
      choice: pathAnswer.choice,
      confidence: pathAnswer.confidence,
      minConfidence,
      pass: pathAnswer.confidence >= minConfidence,
      probabilities: pathAnswer.probabilities
    },
    complexity: {
      score: complexity.score,
      confidence: complexity.confidence,
      legend: complexity.legend,
      probabilities: complexity.probabilities
    },
    model: response.model,
    cached
  };

  stdout(parsed.format === 'text' ? renderDecideText(result) : JSON.stringify(result));
  if (parsed.gate === true && (!result.clarity.pass || !result.path.pass)) {
    return 1;
  }
  return 0;
}

export async function runDecideCommand(
  args: string[],
  root: string = process.cwd(),
  deps: DecideCommandDeps = {}
): Promise<number> {
  const stdout = deps.stdout ?? ((line: string) => console.log(line));
  const stderr = deps.stderr ?? ((line: string) => console.error(line));
  const readStdin = deps.readStdin ?? readStdinDefault;

  const first = args[0];
  if (first === 'help' || first === '--help' || first === '-h') {
    stdout(HELP);
    return 0;
  }

  const composite = first === undefined || first === 'decide' || first.startsWith('-');
  const subcommand = composite ? 'decide' : first;
  const rest = composite ? (first === 'decide' ? args.slice(1) : args) : args.slice(1);

  let parsed: ParsedDecisionArgs;
  try {
    parsed = parseDecisionArgs(rest);
  } catch (error) {
    stderr(`[alvaress] ERROR: ${errorMessage(error)}`);
    return 2;
  }
  if (parsed.help) {
    stdout(HELP);
    return 0;
  }

  try {
    const config = deps.config ?? loadConfig(root);
    const client = resolveDecisionClient(config, {
      model: parsed.model,
      fetchImpl: deps.fetchImpl
    });

    if (subcommand === 'ask') {
      const request = await readRequest(parsed, readStdin);
      const effectiveRequest =
        parsed.redact === false
          ? request
          : { ...request, state: redactValue(request.state) };
      const response = await requestDecision(effectiveRequest, client);
      stdout(JSON.stringify(response));
      return 0;
    }

    const state = maybeRedact(await readState(parsed, readStdin), parsed);

    if (subcommand === 'decide') {
      return await runDecide(state, parsed, config, root, client, stdout);
    }

    const question = requireQuestion(parsed);

    if (subcommand === 'predict' || subcommand === 'will' || subcommand === 'noul') {
      const response = await requestDecision(
        { state, questions: { decision: noul(question) } },
        client
      );
      const answer = noulAnswer(response, 'decision');
      const pass = parsed.threshold === undefined ? null : answer.noul >= parsed.threshold;
      const result = {
        type: 'noul' as const,
        probability: answer.noul,
        threshold: parsed.threshold ?? null,
        pass,
        model: response.model
      };
      stdout(parsed.format === 'text' ? String(answer.noul) : JSON.stringify(result));
      return pass === false ? 1 : 0;
    }

    if (subcommand === 'choose' || subcommand === 'pick') {
      if (parsed.options.length < 2) {
        throw new DecisionError('"decide choose" necesita al menos dos --option.');
      }
      const criteria: Record<string, string> = {};
      for (const option of parsed.options) {
        if (criteria[option.key] !== undefined) {
          throw new DecisionError(`La opción "${option.key}" está repetida.`);
        }
        criteria[option.key] = option.description;
      }
      const response = await requestDecision(
        { state, questions: { decision: choice(question, criteria) } },
        client
      );
      const answer = choiceAnswer(response, 'decision');
      const pass =
        parsed.minConfidence === undefined ? null : answer.confidence >= parsed.minConfidence;
      const result = {
        type: 'choice' as const,
        choice: answer.choice,
        confidence: answer.confidence,
        probabilities: answer.probabilities,
        minConfidence: parsed.minConfidence ?? null,
        pass,
        model: response.model
      };
      stdout(parsed.format === 'text' ? answer.choice : JSON.stringify(result));
      return pass === false ? 1 : 0;
    }

    if (subcommand === 'score' || subcommand === 'rate') {
      if (parsed.levels.length < 2) {
        throw new DecisionError('"decide score" necesita al menos dos --level.');
      }
      const response = await requestDecision(
        { state, questions: { decision: score(question, parsed.levels) } },
        client
      );
      const answer = scoreAnswer(response, 'decision');
      const result = {
        type: 'score' as const,
        score: answer.score,
        confidence: answer.confidence,
        legend: answer.legend,
        probabilities: answer.probabilities,
        model: response.model
      };
      stdout(parsed.format === 'text' ? String(answer.score) : JSON.stringify(result));
      return 0;
    }

    throw new DecisionError(`Subcomando de decide desconocido: ${subcommand}`);
  } catch (error) {
    stderr(`[alvaress] ERROR: ${errorMessage(error)}`);
    return 2;
  }
}
