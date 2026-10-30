export interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

const BOOLEAN_FLAGS = new Set([
  'dry-run',
  'no-link',
  'no-global',
  'no-project',
  'force',
  'no-lock',
  'update-graph',
  'gate',
  'no-cache',
  'no-redact',
  'no-commit',
  'no-learn',
  'self-check',
  'direct',
  'keep',
  'inspect-last-run',
  'with-obsidian',
  'yes',
  'json',
  'no-install'
]);

export function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument.startsWith('--')) {
      const separator = argument.indexOf('=');
      if (separator !== -1) {
        flags[argument.slice(2, separator)] = argument.slice(separator + 1);
        continue;
      }
      const key = argument.slice(2);
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
        continue;
      }
      const next = args[index + 1];
      if (next !== undefined && !next.startsWith('-')) {
        flags[key] = next;
        index += 1;
        continue;
      }
      flags[key] = true;
      continue;
    }
    if (argument.startsWith('-') && argument.length > 1) {
      flags[argument.slice(1)] = true;
      continue;
    }
    positional.push(argument);
  }

  return { positional, flags };
}

export function flagEnabled(flags: Record<string, string | boolean>, name: string): boolean {
  return flags[name] === true || flags[name] === 'true';
}
