/**
 * Layout de secuencia, temperaturas y decodificación de Laya.
 *
 * Portado de @receptron/laya (MIT, Copyright (c) 2026 Receptron). Las funciones
 * son puras y no tocan red ni disco, así que se pueden probar sin el modelo.
 */

import type { LayaBundleConfig, Question, QuestionType } from './types.js';

export const QTYPES: Record<QuestionType, number> = { choice: 0, score: 1, noul: 2 };

const QTYPE_NAMES: readonly QuestionType[] = ['choice', 'score', 'noul'];

export const TEMP_MIN = 0.5;
export const TEMP_MAX = 5;

/** Representación interna de una pregunta ya normalizada. */
export interface InternalQuestion {
  t: QuestionType;
  ins: string;
  crit: Record<string, string | null> | string[] | { false?: string; true?: string } | undefined;
}

export interface SpecialIds {
  cls: number;
  sep: number;
  mask: number;
  pad: number;
  maskTok: string;
}

export type Encode = (text: string) => number[];

export interface BuiltSequence {
  ids: number[];
  markers: number[];
}

/** Python's json.dumps(obj, ensure_ascii=False): separadores ", " / ": ", orden de inserción. */
export function pyJsonDumps(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : JSON.stringify(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (Array.isArray(value)) {
    return `[${value.map(pyJsonDumps).join(', ')}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => `${JSON.stringify(key)}: ${pyJsonDumps(item)}`)
    .join(', ')}}`;
}

export function serializeState(state: unknown): string {
  return typeof state === 'string' ? state : pyJsonDumps(state);
}

/** RLAgent._to_internal. */
export function toInternal(question: Question): InternalQuestion {
  let crit: InternalQuestion['crit'] = question.criteria as InternalQuestion['crit'];
  if (question.type === 'choice' && Array.isArray(crit)) {
    crit = Object.fromEntries(crit.map((label) => [label, null]));
  }
  return {
    t: question.type,
    ins: typeof question.instructions === 'string' ? question.instructions : pyJsonDumps(question.instructions),
    crit
  };
}

/** Rechaza etiquetas nulas o duplicadas en un `choice`. */
export function checkChoiceLabels(qid: string, question: Question): void {
  if (question.type !== 'choice' || !Array.isArray(question.criteria)) {
    return;
  }
  const seen = new Map<string, number>();
  question.criteria.forEach((label, index) => {
    if (label === null || label === undefined) {
      throw new Error(
        `question ${JSON.stringify(qid)}: choice label ${index} is null; every label must be a string`
      );
    }
    const key = String(label);
    const first = seen.get(key);
    if (first !== undefined) {
      throw new Error(
        `question ${JSON.stringify(qid)}: choice label ${index} (${JSON.stringify(label)}) repeats label ${first}`
      );
    }
    seen.set(key, index);
  });
}

/** Textos de cada opción en orden de índice. Noul siempre es [false, true], así que p[1] == noul. */
export function renderOptions(question: InternalQuestion): string[] {
  if (question.t === 'choice') {
    const crit = (question.crit ?? {}) as Record<string, string | null>;
    return Object.entries(crit).map(([label, description]) =>
      description ? `${label}: ${description}` : label
    );
  }
  if (question.t === 'score') {
    return (question.crit as string[]).map((level, index) => `level ${index}: ${level}`);
  }
  const crit = (question.crit ?? {}) as { false?: string; true?: string };
  return [
    `false: ${crit.false || 'no, the statement does not hold'}`,
    `true: ${crit.true || 'yes, the statement holds'}`
  ];
}

function sizeBucket(k: number): string {
  if (k <= 2) {
    return '2';
  }
  if (k <= 5) {
    return '3-5';
  }
  if (k <= 10) {
    return '6-10';
  }
  return '11+';
}

/** Clave de temperatura por cardinalidad: un noul de 2 opciones y un choice de 20 escalan distinto. */
export function tempBucket(qtype: number, k: number): string {
  return `${QTYPE_NAMES[qtype] ?? String(qtype)}:${sizeBucket(k)}`;
}

/** Temperatura finita dentro del rango soportado. */
export function clampTemperature(value: unknown, fallback = 1): number {
  const temperature = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(TEMP_MAX, Math.max(TEMP_MIN, temperature));
}

/** Resuelve y recorta la temperatura justo antes de usarla con los logits. */
export function temperatureFor(config: LayaBundleConfig, qtype: number, k: number): number {
  const bucket = config.temperature_by_options?.[tempBucket(qtype, k)];
  const base = config.temperature[qtype];
  const bucketIsFinite = typeof bucket === 'number' && Number.isFinite(bucket);
  const baseIsFinite = typeof base === 'number' && Number.isFinite(base);
  return clampTemperature(bucketIsFinite ? bucket : baseIsFinite ? base : 1);
}

/** Comprueba que un valor sea un número finito. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Suma de longitudes de una lista de listas. */
function totalLength(lists: number[][]): number {
  return lists.reduce((sum, list) => sum + list.length, 0);
}

/** Recorta las temperaturas del checkpoint sin mutar el objeto de entrada. */
export function clampTemperatures(config: LayaBundleConfig): LayaBundleConfig {
  const changed: string[] = [];
  const clamp = (key: string, value: unknown): number => {
    const next = clampTemperature(value);
    if (next !== value) {
      changed.push(`${key} ${String(value)} -> ${next}`);
    }
    return next;
  };

  const temperature = (config.temperature ?? []).map((value, index) =>
    clamp(QTYPE_NAMES[index] ?? String(index), value)
  );

  const entries = Object.entries(config.temperature_by_options ?? {});
  for (const [key, value] of entries) {
    if (!isFiniteNumber(value)) {
      changed.push(`${key} ${String(value)} -> qtype temperature`);
    }
  }

  const temperature_by_options = Object.fromEntries(
    entries
      .filter((entry): entry is [string, number] => isFiniteNumber(entry[1]))
      .map(([key, value]) => [key, clamp(key, value)])
  );

  if (changed.length > 0) {
    process.stderr.write(
      `laya: el checkpoint trae temperaturas inválidas o fuera de rango: ${changed.join(', ')}. ` +
        'La confianza de esas entradas no está calibrada.\n'
    );
  }

  return { ...config, temperature, temperature_by_options };
}

/** Confianza estilo Jev: 1 - entropía normalizada de la distribución. */
export function confidenceFromProbs(probabilities: number[]): number {
  const k = probabilities.length;
  if (k < 2) {
    return 1;
  }
  let entropy = 0;
  for (const p of probabilities) {
    entropy -= p * Math.log(Math.max(p, 1e-12));
  }
  return 1 - entropy / Math.log(k);
}

export function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exp = logits.map((value) => Math.exp(value - max));
  const sum = exp.reduce((total, value) => total + value, 0);
  return exp.map((value) => value / sum);
}

/**
 * rl_common.build_sequence:
 *   [CLS] <type> question: instructions [SEP] [MASK] opt0 [MASK] opt1 ... [SEP] state [SEP]
 *
 * Devuelve los ids y la posición del marcador [MASK] de cada opción. Un estado
 * conversación (lista) conserva su final más reciente cuando no cabe, como en
 * entrenamiento (truncate_left=True).
 */
export function buildSequence(
  encode: Encode,
  ids: SpecialIds,
  state: unknown,
  question: InternalQuestion,
  maxLen: number,
  headMaxLen: number
): BuiltSequence {
  const scrub = (text: string): string => text.split(ids.maskTok).join(' ');
  const options = renderOptions(question);

  let headIds = encode(`${question.t} question: ${scrub(question.ins)}`);
  let optionIds = options.map((option) => [ids.mask, ...encode(` ${scrub(option)}`).slice(0, 48)]);

  let optionBudget = headMaxLen - totalLength(optionIds);

  if (optionBudget < 16) {
    // Demasiadas opciones o demasiado largas: encoge cada texto por igual.
    const per = Math.max(4, Math.floor((headMaxLen - 16) / Math.max(1, optionIds.length)));
    optionIds = optionIds.map((option) => option.slice(0, per));
    optionBudget = headMaxLen - totalLength(optionIds);
  }

  headIds = headIds.slice(0, Math.max(8, optionBudget));

  const sequence = [ids.cls, ...headIds, ids.sep];
  const markers: number[] = [];
  for (const option of optionIds) {
    markers.push(sequence.length);
    sequence.push(...option);
  }
  sequence.push(ids.sep);

  const room = Math.max(0, maxLen - sequence.length - 1);
  const stateIds = encode(scrub(serializeState(state)));
  const truncated = Array.isArray(state)
    ? stateIds.slice(Math.max(0, stateIds.length - room))
    : stateIds.slice(0, room);

  sequence.push(...truncated, ids.sep);
  return { ids: sequence.slice(0, maxLen), markers: markers.filter((marker) => marker < maxLen) };
}
