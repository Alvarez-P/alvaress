import os from 'node:os';
import path from 'node:path';

export const PACKAGE_NAME = 'alvaress';
export const VERSION = '0.2.0';
export const AGENT_NAME = 'alvaress';

export const GLOBAL_CONFIG_FILENAME = '.alvaressconfig.json';
export const GLOBAL_CONFIG_PATH = path.join(os.homedir(), GLOBAL_CONFIG_FILENAME);
export const LOCAL_CONFIG_FILENAME = '.alvaressrc.json';

export const OPENSPEC_FILENAME = 'openspec.yaml';
export const HARNESS_DIR = '.harness';
export const TASKS_DIRNAME = 'tasks';
export const SKILLS_DIRNAME = 'skills';
export const TASKS_DIR = path.join(HARNESS_DIR, TASKS_DIRNAME);
export const SKILLS_DIR = path.join(HARNESS_DIR, SKILLS_DIRNAME);

export const OPENCODE_SKILLS_DIR = path.join(os.homedir(), '.config', 'opencode', 'skills');
export const CLAUDE_SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills');
export const OPENCODE_PROJECT_DIR = '.opencode';
export const OPENCODE_AGENTS_DIRNAME = 'agents';

export const DEFAULT_OBSIDIAN_VAULT = path.join(os.homedir(), 'Obsidian');
export const DEFAULT_IMPLEMENTER_MODEL = 'deepseek/deepseek-chat';
export const DEFAULT_VALIDATION_COMMANDS = ['pnpm exec oxlint --deny=correctness --deny=suspicious', 'pnpm exec tsc --noEmit'];
export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_PACKAGE_MANAGER = 'pnpm';
export const DEFAULT_SCOPE = 'warn';
export const DEFAULT_AIDER_TIMEOUT_MS = 10 * 60 * 1000;
export const COMMAND_SEPARATOR = ';;';

export const HARNESS_LOCK_FILENAME = 'lock';
export const HARNESS_RUNS_DIR = path.join(HARNESS_DIR, 'runs');
export const HARNESS_BACKUPS_DIR = path.join(HARNESS_DIR, 'backups');
export const HARNESS_CACHE_DIR = path.join(HARNESS_DIR, 'cache');

export const LAYA_DIR = '.laya';
export const LAYA_LOG_FILENAME = 'last_run.log';
export const LAYA_LOG_PATH = path.join(LAYA_DIR, LAYA_LOG_FILENAME);
export const LAYA_HALT_FILENAME = 'HALT.json';
export const DEFAULT_MAX_FIX_ATTEMPTS = 2;
export const LAYA_ONNX_RUNTIME_PACKAGE = 'onnxruntime-node';
export const LAYA_TOKENIZER_PACKAGE = '@huggingface/tokenizers';
/** Caché global del artefacto int8: un solo modelo compartido entre proyectos. */
export const LAYA_INT8_MODEL_CACHE_ROOT = path.join(
  process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache'),
  'alvaress',
  'laya-onnx-int8'
);
/** Caché histórica del bundle fp32; se acepta si ya existe para no re-descargar. */
export const LAYA_FP32_MODEL_CACHE_ROOT = path.join(
  process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache'),
  'alvaress',
  'laya-onnx'
);
export const DEFAULT_LAYA_TIMEOUT_MS = 30_000;

export const VITE_PLUS_PACKAGE = 'vite-plus';
export const DEFAULT_VITE_PLUS_CHECK = 'vp check';
export const DEFAULT_VITE_PLUS_TEST = 'vp test';

export const GRAPHIFY_DIR = 'graphify-out';
export const GRAPHIFY_GRAPH_FILENAME = 'graph.json';

export const MEMORY_DIR_ENV = 'ALVARESS_MEMORY_DIR';
export const GLOBAL_MEMORY_DIR = path.join(os.homedir(), '.alvaress', 'memory');
export const GLOBAL_MEMORY_FILENAME = 'learnings.json';
export const GLOBAL_PLAYBOOK_FILENAME = 'PLAYBOOK.md';

export function getGlobalOpencodeAgentsDir(): string {
  return path.join(os.homedir(), '.config', 'opencode', OPENCODE_AGENTS_DIRNAME);
}

export function getProjectOpencodeAgentsDir(root: string): string {
  return path.join(root, OPENCODE_PROJECT_DIR, OPENCODE_AGENTS_DIRNAME);
}
