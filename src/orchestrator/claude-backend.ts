import { createHash } from 'node:crypto';
import type { PermissionRule, SubagentDefinition } from '../agent/installer.js';
import { SUBAGENTS } from '../agent/installer.js';
import { emptyUsage } from './usage.js';
import type { OpencodeOutput } from './usage.js';

export const DEFAULT_CLAUDE_SUBAGENT_MODEL = 'haiku';
const ANTHROPIC_PREFIX = 'anthropic/';
const READ_TOOLS = ['Read', 'Glob', 'Grep'];
const FIXER_AGENT = 'alvaress-fixer';

/**
 * Con Haiku, más de la mitad de la salida del implementer era razonamiento.
 * `low` la recortó un 27 % sin perder corridas en el benchmark. El fixer queda
 * en `medium` porque repara fallos y el benchmark no lo ejercitó.
 */
export function subagentEffort(agent: string): 'low' | 'medium' {
  return agent === FIXER_AGENT ? 'medium' : 'low';
}
const EDIT_TOOLS = ['Edit', 'Write'];

export function subagentDefinition(name: string): SubagentDefinition {
  const definition = SUBAGENTS.find((entry) => entry.name === name);
  if (definition === undefined) {
    throw new Error(`No existe el subagente ${name}.`);
  }
  return definition;
}

/**
 * Traduce `models.subagents.modelName` al argumento `--model` de Claude Code:
 * `anthropic/<id>` pierde el prefijo, un alias sin proveedor pasa tal cual y
 * cualquier otro proveedor cae al modelo ligero por defecto.
 */
export function claudeModel(modelName: string): { model: string; fallback: boolean } {
  const trimmed = modelName.trim();
  if (trimmed.startsWith(ANTHROPIC_PREFIX)) {
    return { model: trimmed.slice(ANTHROPIC_PREFIX.length), fallback: false };
  }
  if (trimmed.length > 0 && !trimmed.includes('/')) {
    return { model: trimmed, fallback: false };
  }
  return { model: DEFAULT_CLAUDE_SUBAGENT_MODEL, fallback: trimmed.length > 0 };
}

/** UUID estable a partir del id de sesión de alvaress: Claude Code exige UUID. */
export function claudeSessionUuid(session: string): string {
  const hex = createHash('sha256').update(session).digest('hex');
  const variant = ((Number.parseInt(hex[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function rulesFor(definition: SubagentDefinition, action: string, effect: PermissionRule['effect']): string[] {
  return definition.permissions
    .filter((rule) => rule.action === action && rule.effect === effect && rule.resource !== '*')
    .map((rule) => rule.resource);
}

export interface ClaudePermissions {
  tools: string[];
  allowed: string[];
  denied: string[];
}

/** Mismos límites que el frontmatter de OpenCode, expresados como reglas de Claude Code. */
export function claudePermissions(definition: SubagentDefinition, extraCommands: string[] = []): ClaudePermissions {
  const canEdit = definition.permissions.some(
    (rule) => rule.action === 'edit' && rule.resource === '*' && rule.effect === 'allow'
  );
  const commands = [...rulesFor(definition, 'shell', 'allow'), ...extraCommands];
  const tools = [...READ_TOOLS, ...(canEdit ? EDIT_TOOLS : []), ...(commands.length > 0 ? ['Bash'] : [])];
  return {
    tools,
    allowed: [
      ...READ_TOOLS,
      ...(canEdit ? EDIT_TOOLS : []),
      ...[...new Set(commands)].map((command) => `Bash(${command})`)
    ],
    denied: [
      ...rulesFor(definition, 'read', 'deny').map((pattern) => `Read(**/${pattern})`),
      ...rulesFor(definition, 'shell', 'deny').map((command) => `Bash(${command})`)
    ]
  };
}

export interface ClaudeArgsOptions {
  model: string;
  sessionUuid: string;
  resume: boolean;
  extraCommands?: string[];
}

/**
 * El prompt va justo después de `-p`: `--tools`, `--allowedTools` y
 * `--disallowedTools` son variádicos y se tragarían un posicional posterior.
 * `--setting-sources project,local` evita cargar hooks y permisos del usuario.
 */
export function claudeArgs(definition: SubagentDefinition, message: string, options: ClaudeArgsOptions): string[] {
  const permissions = claudePermissions(definition, options.extraCommands);
  return [
    '-p',
    message,
    '--output-format',
    'json',
    '--model',
    options.model,
    '--permission-mode',
    'dontAsk',
    '--setting-sources',
    'project,local',
    '--effort',
    subagentEffort(definition.name),
    '--append-system-prompt',
    definition.body,
    ...(options.resume ? ['--resume', options.sessionUuid] : ['--session-id', options.sessionUuid]),
    '--tools',
    ...permissions.tools,
    '--allowedTools',
    ...permissions.allowed,
    ...(permissions.denied.length > 0 ? ['--disallowedTools', ...permissions.denied] : [])
  ];
}

function numberOf(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/** Lee el objeto único de `claude -p --output-format json`. */
export function parseClaudeOutput(stdout: string): OpencodeOutput {
  const usage = { ...emptyUsage(), calls: 1 };
  let result: Record<string, unknown>;
  try {
    result = record(JSON.parse(stdout.trim()));
  } catch {
    return { text: '', usage, events: 0 };
  }
  const tokens = record(result.usage);
  const details = record(tokens.output_tokens_details);
  usage.input = numberOf(tokens.input_tokens);
  usage.output = numberOf(tokens.output_tokens);
  usage.reasoning = numberOf(details.thinking_tokens);
  usage.cacheRead = numberOf(tokens.cache_read_input_tokens);
  usage.cacheWrite = numberOf(tokens.cache_creation_input_tokens);
  usage.cost = numberOf(result.total_cost_usd);
  const text = typeof result.result === 'string' ? result.result.trim() : '';
  return {
    text,
    usage,
    events: 1,
    ...(result.is_error === true ? { error: text.length > 0 ? text : String(result.subtype ?? 'error') } : {})
  };
}
