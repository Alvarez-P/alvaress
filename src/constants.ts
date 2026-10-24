import os from 'node:os';
import path from 'node:path';

export const PACKAGE_NAME = 'alvaress';
export const VERSION = '0.1.0';
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
export const DECISION_MODELS = ['kev', 'laya'] as const;
export type DecisionModelName = (typeof DECISION_MODELS)[number];
export const DEFAULT_DECISION_MODEL: DecisionModelName = 'kev';
export const DEFAULT_DECISION_BASE = 'http://127.0.0.1:11434';
export const DEFAULT_DECISION_TIMEOUT_MS = 60000;
export const DEFAULT_DECISION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_DECISION_MAX_CALLS = 3;
export const DEFAULT_IMPLEMENTER_MODEL = 'deepseek/deepseek-chat';

export function isDecisionModel(value: string): boolean {
  return /^(kev|laya)(:[a-z0-9._-]+)?$/i.test(value.trim());
}
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
export const GRAPHIFY_DIR = 'graphify-out';
export const GRAPHIFY_GRAPH_FILENAME = 'graph.json';

export function getGlobalOpencodeAgentsDir(): string {
  return path.join(os.homedir(), '.config', 'opencode', OPENCODE_AGENTS_DIRNAME);
}

export function getProjectOpencodeAgentsDir(root: string): string {
  return path.join(root, OPENCODE_PROJECT_DIR, OPENCODE_AGENTS_DIRNAME);
}
