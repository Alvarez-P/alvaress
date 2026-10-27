/**
 * Carga del bundle y forward pass de Laya sobre ONNX Runtime.
 *
 * Portado de @receptron/laya (MIT, Copyright (c) 2026 Receptron), que reproduce
 * `rl_agent_api.py` del checkpoint oficial: mismo layout de secuencia, misma
 * temperatura por cardinalidad y mismo redondeo.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveModuleUrl } from '../../../utils/modules.js';
import {
  buildSequence,
  checkChoiceLabels,
  clampTemperatures,
  confidenceFromProbs,
  QTYPES,
  renderOptions,
  softmax,
  temperatureFor,
  toInternal
} from './sequence.js';
import type { BuiltSequence, InternalQuestion, SpecialIds } from './sequence.js';
import type {
  Answer,
  LayaBundleConfig,
  LayaModelOptions,
  Question,
  SystemOneResult
} from './types.js';

/** Tipos mínimos de `onnxruntime-node`, para no exigirlo en tiempo de compilación. */
interface OrtTensorLike {
  data: Float32Array | BigInt64Array | Uint8Array;
  dims: readonly number[];
}

interface OrtSessionLike {
  run(feeds: Record<string, unknown>): Promise<Record<string, OrtTensorLike | undefined>>;
  release(): Promise<void>;
}

interface OrtModuleLike {
  Tensor: new (
    type: 'int64' | 'bool' | 'float32',
    data: unknown,
    dims: readonly number[]
  ) => unknown;
  InferenceSession: {
    create(modelPath: string, options?: Record<string, unknown>): Promise<OrtSessionLike>;
  };
}

interface HfTokenizerLike {
  encode(text: string, options?: { add_special_tokens?: boolean }): { ids: number[] };
  token_to_id(token: string): number | undefined;
}

interface HfTokenizerModuleLike {
  Tokenizer: new (tokenizerJson: unknown, configJson: unknown) => HfTokenizerLike;
}

async function importRuntime(
  specifier: string,
  from: string | undefined,
  missingMessage: string
): Promise<Record<string, unknown>> {
  let namespace: Record<string, unknown> | undefined;

  if (from !== undefined) {
    const url = resolveModuleUrl(specifier, from);
    if (url !== undefined) {
      namespace = (await import(url)) as Record<string, unknown>;
    }
  }

  if (namespace === undefined) {
    try {
      namespace = (await import(specifier)) as Record<string, unknown>;
    } catch (error) {
      throw new Error(missingMessage, { cause: error });
    }
  }

  // Un paquete CommonJS importado por URL expone sus exports en `default`.
  const fallback = namespace['default'];
  return fallback !== null && typeof fallback === 'object'
    ? { ...(fallback as Record<string, unknown>), ...namespace }
    : namespace;
}

async function loadOnnxRuntime(from?: string): Promise<OrtModuleLike> {
  return (await importRuntime(
    'onnxruntime-node',
    from,
    'Falta onnxruntime-node. Ejecuta "alvaress install" o instálalo con el gestor de paquetes del proyecto.'
  )) as unknown as OrtModuleLike;
}

async function loadTokenizerModule(from?: string): Promise<HfTokenizerModuleLike> {
  return (await importRuntime(
    '@huggingface/tokenizers',
    from,
    'Falta @huggingface/tokenizers. Ejecuta "alvaress install" o instálalo con el gestor de paquetes del proyecto.'
  )) as unknown as HfTokenizerModuleLike;
}

const round4 = (value: number): number => Math.round(value * 1e4) / 1e4;

interface PreparedItem {
  question: InternalQuestion;
  sequence: BuiltSequence;
  qtype: number;
}

export class LayaModel {
  private constructor(
    private readonly session: OrtSessionLike,
    private readonly tokenizer: HfTokenizerLike,
    private readonly config: LayaBundleConfig,
    private readonly ids: SpecialIds,
    private readonly ort: OrtModuleLike,
    /** Directorio desde el que se cargó el bundle. */
    readonly modelDir: string
  ) {}

  static async load(options: LayaModelOptions): Promise<LayaModel> {
    const modelDir = path.resolve(options.dir);
    const readJson = async (file: string): Promise<unknown> =>
      JSON.parse(await readFile(path.join(modelDir, file), 'utf8'));

    const config = clampTemperatures((await readJson('laya_config.json')) as LayaBundleConfig);
    const tokenizerModule = await loadTokenizerModule(options.resolveFrom);
    const tokenizer = new tokenizerModule.Tokenizer(
      await readJson('tokenizer/tokenizer.json'),
      await readJson('tokenizer/tokenizer_config.json')
    );

    const specialId = (token: string): number => {
      const id = tokenizer.token_to_id(token);
      if (id === undefined) {
        throw new Error(`El tokenizer no contiene el token especial ${token}.`);
      }
      return id;
    };

    const ids: SpecialIds = {
      cls: specialId('[CLS]'),
      sep: specialId('[SEP]'),
      mask: specialId('[MASK]'),
      pad: specialId('[PAD]'),
      maskTok: '[MASK]'
    };

    const ort = await loadOnnxRuntime(options.resolveFrom);
    const sessionOptions: Record<string, unknown> = {
      executionProviders: options.device === 'cuda' ? ['cuda', 'cpu'] : ['cpu'],
      graphOptimizationLevel: 'all'
    };
    if (options.threads !== undefined && options.threads > 0) {
      sessionOptions.intraOpNumThreads = options.threads;
    }

    const session = await ort.InferenceSession.create(path.join(modelDir, 'laya.onnx'), sessionOptions);
    return new LayaModel(session, tokenizer, config, ids, ort, modelDir);
  }

  private encode = (text: string): number[] =>
    this.tokenizer.encode(text, { add_special_tokens: false }).ids;

  /** Responde todas las preguntas de un estado en un solo forward pass. */
  async systemOne(
    state: unknown,
    questions: Record<string, Question>
  ): Promise<SystemOneResult> {
    const qids = Object.keys(questions);
    if (qids.length === 0) {
      throw new Error('systemOne: hace falta al menos una pregunta.');
    }

    const items: PreparedItem[] = qids.map((qid) => {
      const definition = questions[qid];
      if (definition === undefined) {
        throw new Error(`systemOne: la pregunta ${JSON.stringify(qid)} no existe.`);
      }
      checkChoiceLabels(qid, definition);
      const question = toInternal(definition);
      const sequence = buildSequence(
        this.encode,
        this.ids,
        state,
        question,
        this.config.max_len,
        this.config.head_max_len
      );
      if (sequence.markers.length !== renderOptions(question).length) {
        throw new Error(
          `La pregunta ${JSON.stringify(qid)} no cabe en head_max_len=${this.config.head_max_len} tokens.`
        );
      }
      return { question, sequence, qtype: QTYPES[question.t] };
    });

    // rl_common.collate_items: relleno a la derecha hasta la secuencia y el
    // conjunto de opciones más largos del lote.
    const rows = items.length;
    const length = Math.max(...items.map((item) => item.sequence.ids.length));
    // Al menos 2 huecos: la cabeza `act` toma las dos probabilidades mayores, así
    // que una pregunta de una sola opción recibe un segundo hueco enmascarado.
    const options = Math.max(2, ...items.map((item) => item.sequence.markers.length));

    const inputIds = new BigInt64Array(rows * length).fill(BigInt(this.ids.pad));
    const attention = new BigInt64Array(rows * length);
    const markerPos = new BigInt64Array(rows * options);
    const markerMask = new Uint8Array(rows * options);
    const qtype = new BigInt64Array(rows);
    let tokens = 0;

    items.forEach((item, row) => {
      item.sequence.ids.forEach((value, column) => {
        inputIds[row * length + column] = BigInt(value);
        attention[row * length + column] = 1n;
      });
      tokens += item.sequence.ids.length;

      item.sequence.markers.forEach((marker, column) => {
        markerPos[row * options + column] = BigInt(marker);
        markerMask[row * options + column] = 1;
      });
      qtype[row] = BigInt(item.qtype);
    });

    const output = await this.session.run({
      input_ids: new this.ort.Tensor('int64', inputIds, [rows, length]),
      attention_mask: new this.ort.Tensor('int64', attention, [rows, length]),
      marker_pos: new this.ort.Tensor('int64', markerPos, [rows, options]),
      marker_mask: new this.ort.Tensor('bool', markerMask, [rows, options]),
      qtype: new this.ort.Tensor('int64', qtype, [rows])
    });

    const logits = output['logits']?.data;
    const act = output['act_probs'];
    if (!(logits instanceof Float32Array) || act === undefined || !(act.data instanceof Float32Array)) {
      throw new Error('Salida inesperada del modelo (se esperaban logits y act_probs en float32).');
    }

    const actData = act.data;
    const actWidth = act.dims[1] ?? 1;
    const answers: Record<string, Answer> = {};

    items.forEach((item, row) => {
      const qid = qids[row] as string;
      const k = item.sequence.markers.length;
      const temperature = temperatureFor(this.config, item.qtype, k);
      const probabilities = softmax(
        Array.from(logits.subarray(row * options, row * options + k), (value) => value / temperature)
      );

      const extra = { act_probability: actData[row * actWidth] ?? 0 };
      const answerConfidence = round4(Math.max(...probabilities));
      const question = item.question;

      if (question.t === 'choice') {
        const labels = Object.keys(question.crit as Record<string, string | null>);
        const best = probabilities.indexOf(Math.max(...probabilities));
        answers[qid] = {
          type: 'choice',
          choice: labels[best] ?? '',
          probabilities: Object.fromEntries(
            labels.map((label, index) => [label, round4(probabilities[index] ?? 0)])
          ),
          confidence: round4(confidenceFromProbs(probabilities)),
          answer_confidence: answerConfidence,
          rl_agent: extra
        };
        return;
      }

      if (question.t === 'score') {
        const levels = question.crit as string[];
        answers[qid] = {
          type: 'score',
          score: round4(probabilities.reduce((sum, value, index) => sum + index * value, 0)),
          legend: Object.fromEntries(levels.map((level, index) => [String(index), level])),
          probabilities: Object.fromEntries(
            probabilities.map((value, index) => [String(index), round4(value)])
          ),
          confidence: round4(confidenceFromProbs(probabilities)),
          answer_confidence: answerConfidence,
          rl_agent: extra
        };
        return;
      }

      answers[qid] = {
        type: 'noul',
        noul: round4(probabilities[1] ?? 0),
        answer_confidence: answerConfidence,
        rl_agent: extra
      };
    });

    return {
      model: 'laya',
      answers,
      usage: { input_tokens: tokens, output_tokens: 0 }
    };
  }

  /** Alias del contrato que consume el arnés. */
  predict(state: unknown, questions: Record<string, Question>): Promise<SystemOneResult> {
    return this.systemOne(state, questions);
  }

  /** Libera la sesión ONNX. La instancia no debe usarse después. */
  async close(): Promise<void> {
    await this.session.release();
  }
}
