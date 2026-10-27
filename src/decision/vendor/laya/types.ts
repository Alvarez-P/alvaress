/**
 * Tipos del bundle ONNX de Laya.
 *
 * Portado de @receptron/laya (MIT, Copyright (c) 2026 Receptron), que a su vez
 * reproduce `rl_agent_api.py` del checkpoint oficial. Ver THIRD_PARTY_NOTICES.
 */

export type QuestionType = 'choice' | 'score' | 'noul';

export interface ChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string> | string[];
}

export interface ScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria?: { false?: string; true?: string };
}

export type Question = ChoiceQuestion | ScoreQuestion | NoulQuestion;

export interface AnswerBase {
  /** Confianza normalizada: 1 - entropía. Solo choice y score la incluyen. */
  confidence?: number;
  /** max(p): la cantidad para la que se calibraron las temperaturas. */
  answer_confidence: number;
  rl_agent: { act_probability: number };
}

export interface ChoiceAnswer extends AnswerBase {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
}

export interface ScoreAnswer extends AnswerBase {
  type: 'score';
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
}

export interface NoulAnswer extends AnswerBase {
  type: 'noul';
  noul: number;
}

export type Answer = ChoiceAnswer | ScoreAnswer | NoulAnswer;

export interface SystemOneResult {
  model: string;
  answers: Record<string, Answer>;
  usage: { input_tokens: number; output_tokens: number };
}

/** `laya_config.json` del bundle. */
export interface LayaBundleConfig {
  max_len: number;
  head_max_len: number;
  temperature: number[];
  temperature_by_options?: Record<string, number>;
}

export interface LayaModelOptions {
  /** Directorio con laya.onnx, laya.onnx.data, laya_config.json y tokenizer/. */
  dir: string;
  device?: 'cpu' | 'cuda';
  /** Hilos intra-op para CPU. Por defecto deja que ONNX Runtime decida. */
  threads?: number;
  /** Raíz del proyecto donde viven onnxruntime-node y @huggingface/tokenizers. */
  resolveFrom?: string;
}
