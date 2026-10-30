import type { RunUsage, TokenUsage, UsagePhase } from '../core/contracts.js';

export function emptyUsage(): TokenUsage {
  return { calls: 0, input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
}

export function addUsage(left: TokenUsage, right: TokenUsage): TokenUsage {
  return {
    calls: left.calls + right.calls,
    input: left.input + right.input,
    output: left.output + right.output,
    reasoning: left.reasoning + right.reasoning,
    cacheRead: left.cacheRead + right.cacheRead,
    cacheWrite: left.cacheWrite + right.cacheWrite,
    cost: left.cost + right.cost
  };
}

function numberOf(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export interface OpencodeOutput {
  text: string;
  usage: TokenUsage;
  events: number;
  error?: string;
}

/**
 * Lee la salida de `opencode run --format json`: una línea JSON por evento con
 * `{ type, timestamp, sessionID, part }`. Suma los tokens de cada `step_finish`
 * y concatena los `text` para recuperar la respuesta del subagente. Si el
 * proveedor falla (límite de uso, 429, credenciales), devuelve su mensaje.
 */
export function parseOpencodeOutput(stdout: string): OpencodeOutput {
  const usage = { ...emptyUsage(), calls: 1 };
  const texts: string[] = [];
  const errors: string[] = [];
  let events = 0;

  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) {
      continue;
    }
    let event: Record<string, unknown>;
    try {
      event = record(JSON.parse(trimmed));
    } catch {
      continue;
    }
    events += 1;
    const part = record(event.part);
    const message = record(event.error).message;
    if (event.type === 'error' && typeof message === 'string') {
      errors.push(message);
    }
    if (event.type === 'text' && typeof part.text === 'string') {
      texts.push(part.text);
    }
    if (event.type === 'step_finish') {
      const tokens = record(part.tokens);
      const cache = record(tokens.cache);
      usage.input += numberOf(tokens.input);
      usage.output += numberOf(tokens.output);
      usage.reasoning += numberOf(tokens.reasoning);
      usage.cacheRead += numberOf(cache.read);
      usage.cacheWrite += numberOf(cache.write);
      usage.cost += numberOf(part.cost);
    }
  }

  return {
    text: texts.join('\n').trim(),
    usage,
    events,
    ...(errors.length > 0 ? { error: errors.join('\n') } : {})
  };
}

export class UsageLedger {
  private readonly phases = new Map<UsagePhase, TokenUsage>();

  add(phase: UsagePhase, usage: TokenUsage): void {
    this.phases.set(phase, addUsage(this.phases.get(phase) ?? emptyUsage(), usage));
  }

  snapshot(): RunUsage | undefined {
    if (this.phases.size === 0) {
      return undefined;
    }
    const phases: RunUsage['phases'] = {};
    let total = emptyUsage();
    for (const [phase, usage] of this.phases) {
      phases[phase] = usage;
      total = addUsage(total, usage);
    }
    return { phases, total };
  }
}

export function formatUsage(usage: TokenUsage): string {
  const cache = usage.cacheRead > 0 ? `, caché ${usage.cacheRead}` : '';
  const reasoning = usage.reasoning > 0 ? `, razonamiento ${usage.reasoning}` : '';
  const cost = usage.cost > 0 ? `, $${usage.cost.toFixed(4)}` : '';
  return `${usage.calls} llamada(s): entrada ${usage.input}, salida ${usage.output}${reasoning}${cache}${cost}`;
}
