import fs from 'node:fs';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import { DEFAULT_JEV_CACHE_TTL_MS } from '../constants.js';
import { readJevCache, writeJevCache } from '../jev/cache.js';
import {
  choice,
  choiceAnswer,
  listJevModels,
  noul,
  noulAnswer,
  requestJev,
  resolveJevClient,
  score,
  scoreAnswer
} from '../jev/client.js';
import type { FetchLike, JevQuestion, JevRequest, JevResponse } from '../jev/client.js';
import { errorMessage, JevError } from '../utils/errors.js';
import { redactValue } from '../utils/redact.js';

const HELP = `alvaress jev

Uso:
  alvaress jev decide  --state "<texto>" [--state-file <ruta>] [--gate]
  alvaress jev predict --state "<texto>" --question "<pregunta>" [--threshold 0.8]
  alvaress jev choose  --state "<texto>" --question "<pregunta>" --option clave="descripción" --option ...
  alvaress jev score   --state "<texto>" --question "<pregunta>" --level "nivel 0" --level "nivel 1" ...
  alvaress jev ask     --request-file peticion.json
  alvaress jev ask     --request '{"state":...,"questions":{...}}'
  alvaress jev models

Entrada de estado:
  --state "<texto>"        Estado en texto plano.
  --state-json "<json>"    Estado estructurado (JSON).
  --state-file <ruta>      Lee el estado de un archivo ("-" = stdin).

Opciones:
  --format json|text       Salida JSON (por defecto) o solo el valor.
  --model <modelo>         Sobrescribe el modelo (por defecto jev-latest).
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

JEV es opcional: si no hay TYPESAFE_API_KEY, el agente alvaress continúa con heurísticas locales.`;

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

interface ParsedJevArgs {
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

export interface JevCommandDeps {
  config?: HarnessConfig;
  fetchImpl?: FetchLike;
  stdout?: (line: string) => void;
  stderr?: (line: string) => void;
  readStdin?: () => Promise<string>;
}

function parseNumber(value: string, flag: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new JevError(`${flag} necesita un número válido.`);
  }
  return parsed;
}

function parseOption(value: string): ChoiceOption {
  const separator = value.indexOf('=');
  if (separator <= 0) {
    throw new JevError('Cada --option debe tener el formato clave="descripción".');
  }
  const key = value.slice(0, separator).trim();
  const description = value.slice(separator + 1).trim();
  if (key.length === 0 || description.length === 0) {
    throw new JevError('Cada --option necesita una clave y una descripción no vacías.');
  }
  return { key, description };
}

function parseJevArgs(args: string[]): ParsedJevArgs {
  const parsed: ParsedJevArgs = {
    options: [],
    levels: [],
    format: 'json',
    help: false
  };

  const take = (index: number, flag: string): [string, number] => {
    const value = args[index + 1];
    if (value === undefined) {
      throw new JevError(`Falta el valor de ${flag}.`);
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
          throw new JevError('--format solo admite "json" o "text".');
        }
        parsed.format = value;
        index = next;
        break;
      }
      case '--model': {
        const [value, next] = take(index, argument);
        parsed.model = value;
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
        throw new JevError(`Opción desconocida para jev: ${argument}`);
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
  parsed: ParsedJevArgs,
  readStdin: () => Promise<string>
): Promise<unknown> {
  const provided = [parsed.state, parsed.stateJson, parsed.stateFile].filter(
    (value) => value !== undefined
  ).length;
  if (provided === 0) {
    throw new JevError('Falta el estado: usa --state, --state-json o --state-file.');
  }
  if (provided > 1) {
    throw new JevError('Usa solo uno de --state, --state-json o --state-file.');
  }
  if (parsed.stateJson !== undefined) {
    try {
      return JSON.parse(parsed.stateJson);
    } catch {
      throw new JevError('--state-json no contiene JSON válido.');
    }
  }
  if (parsed.stateFile !== undefined) {
    if (parsed.stateFile === '-') {
      return readStdin();
    }
    try {
      return fs.readFileSync(parsed.stateFile, 'utf-8');
    } catch (error) {
      throw new JevError(`No se pudo leer el estado de ${parsed.stateFile}: ${errorMessage(error)}`);
    }
  }
  return parsed.state;
}

function requireQuestion(parsed: ParsedJevArgs): string {
  if (parsed.question === undefined || parsed.question.trim().length === 0) {
    throw new JevError('Falta --question.');
  }
  return parsed.question;
}

async function readRequest(
  parsed: ParsedJevArgs,
  readStdin: () => Promise<string>
): Promise<JevRequest> {
  const provided = [parsed.request, parsed.requestFile].filter((value) => value !== undefined).length;
  if (provided === 0) {
    throw new JevError('Falta --request o --request-file para "jev ask".');
  }
  if (provided > 1) {
    throw new JevError('Usa solo uno de --request o --request-file.');
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
      throw new JevError(`No se pudo leer ${parsed.requestFile}: ${errorMessage(error)}`);
    }
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new JevError('La petición de "jev ask" no contiene JSON válido.');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new JevError('La petición de "jev ask" debe ser un objeto JSON.');
  }
  const request = value as Record<string, unknown>;
  if (request.state === undefined) {
    throw new JevError('La petición de "jev ask" necesita "state".');
  }
  if (typeof request.questions !== 'object' || request.questions === null || Array.isArray(request.questions)) {
    throw new JevError('La petición de "jev ask" necesita "questions" como objeto.');
  }
  return {
    state: request.state,
    questions: request.questions as Record<string, JevQuestion>,
    model: typeof request.model === 'string' ? request.model : undefined
  };
}

function maybeRedact(state: unknown, parsed: ParsedJevArgs): unknown {
  return parsed.redact === false ? state : redactValue(state);
}

function buildDecideRequest(state: unknown): JevRequest {
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
  const complexity = result.complexity.legend[String(result.complexity.score)] ?? String(result.complexity.score);
  return [
    `Claridad: ${result.clarity.probability.toFixed(3)} (${result.clarity.pass ? 'OK' : 'preguntar'})`,
    `Camino: ${result.path.choice} (${result.path.confidence.toFixed(3)}, ${result.path.pass ? 'OK' : 'revisar'})`,
    `Complejidad: ${complexity} (${result.complexity.score})`
  ].join('\n');
}

async function runDecide(
  state: unknown,
  parsed: ParsedJevArgs,
  config: HarnessConfig,
  root: string,
  client: ReturnType<typeof resolveJevClient>,
  stdout: (line: string) => void
): Promise<number> {
  const request = buildDecideRequest(state);
  const cacheEnabled = parsed.cache !== false && (config.jev?.cache ?? true);
  const ttl = parsed.cacheTtlMs ?? config.jev?.cacheTtlMs ?? DEFAULT_JEV_CACHE_TTL_MS;
  let response: JevResponse | undefined = cacheEnabled
    ? readJevCache(root, request, ttl)
    : undefined;
  const cached = response !== undefined;
  if (response === undefined) {
    response = await requestJev(request, client);
    if (cacheEnabled) {
      writeJevCache(root, request, response);
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

export async function runJevCommand(
  args: string[],
  root: string = process.cwd(),
  deps: JevCommandDeps = {}
): Promise<number> {
  const stdout = deps.stdout ?? ((line: string) => console.log(line));
  const stderr = deps.stderr ?? ((line: string) => console.error(line));
  const readStdin = deps.readStdin ?? readStdinDefault;

  const [subcommand, ...rest] = args;
  if (subcommand === undefined || subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
    stdout(HELP);
    return 0;
  }

  let parsed: ParsedJevArgs;
  try {
    parsed = parseJevArgs(rest);
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
    const client = resolveJevClient(config, {
      model: parsed.model,
      fetchImpl: deps.fetchImpl
    });

    if (subcommand === 'models') {
      const models = await listJevModels(client);
      stdout(
        parsed.format === 'text'
          ? models.map((model) => `${model.name}\t${model.description}`).join('\n')
          : JSON.stringify({ models })
      );
      return 0;
    }

    if (subcommand === 'ask') {
      const request = await readRequest(parsed, readStdin);
      const effectiveRequest =
        parsed.redact === false
          ? request
          : { ...request, state: redactValue(request.state) };
      const response = await requestJev(effectiveRequest, client);
      stdout(JSON.stringify(response));
      return 0;
    }

    const state = maybeRedact(await readState(parsed, readStdin), parsed);

    if (subcommand === 'decide') {
      return await runDecide(state, parsed, config, root, client, stdout);
    }

    const question = requireQuestion(parsed);

    if (subcommand === 'predict' || subcommand === 'will' || subcommand === 'noul') {
      const response = await requestJev(
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
        throw new JevError('"jev choose" necesita al menos dos --option.');
      }
      const criteria: Record<string, string> = {};
      for (const option of parsed.options) {
        if (criteria[option.key] !== undefined) {
          throw new JevError(`La opción "${option.key}" está repetida.`);
        }
        criteria[option.key] = option.description;
      }
      const response = await requestJev(
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
        throw new JevError('"jev score" necesita al menos dos --level.');
      }
      const response = await requestJev(
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

    throw new JevError(`Subcomando de jev desconocido: ${subcommand}`);
  } catch (error) {
    stderr(`[alvaress] ERROR: ${errorMessage(error)}`);
    return 2;
  }
}
