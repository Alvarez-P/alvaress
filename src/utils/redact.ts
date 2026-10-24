const SECRET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g, replacement: '[REDACTED_API_KEY]' },
  { pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, replacement: '[REDACTED_AWS_KEY]' },
  { pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/gi, replacement: 'Bearer [REDACTED_TOKEN]' },
  {
    pattern: /\b(?:api[_-]?key|access[_-]?token|secret|password|passwd)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}["']?/gi,
    replacement: '[REDACTED_SECRET]'
  },
  { pattern: /\b[A-Fa-f0-9]{64,}\b/g, replacement: '[REDACTED_HASH]' }
];

export function redactSecrets(value: string): string {
  let result = value;
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactSecrets(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry));
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = redactValue(entry);
    }
    return result;
  }
  return value;
}
