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
export const DEFAULT_ORCHESTRATOR_MODEL = 'jev-latest';
export const DEFAULT_IMPLEMENTER_MODEL = 'deepseek/deepseek-chat';
export const DEFAULT_JEV_BASE = 'https://api.typesafe.ai/v1';
export const DEFAULT_JEV_TIMEOUT_MS = 30000;
export const DEFAULT_VALIDATION_COMMANDS = ['npx oxlint --deny=correctness --deny=suspicious', 'npx tsc --noEmit'];
export const DEFAULT_MAX_ATTEMPTS = 3;
export const COMMAND_SEPARATOR = ';;';

export function getGlobalOpencodeAgentsDir(): string {
  return path.join(os.homedir(), '.config', 'opencode', OPENCODE_AGENTS_DIRNAME);
}

export function getProjectOpencodeAgentsDir(root: string): string {
  return path.join(root, OPENCODE_PROJECT_DIR, OPENCODE_AGENTS_DIRNAME);
}
