import * as p from '@clack/prompts';
import type { CANCEL_SYMBOL } from '@clack/prompts';
import { COMMAND_SEPARATOR } from '../constants.js';
import { CancelledError } from './errors.js';

export function unwrap<T>(value: T | typeof CANCEL_SYMBOL, message = 'Operación cancelada.'): T {
  if (p.isCancel(value)) {
    p.cancel(message);
    throw new CancelledError(message);
  }
  return value;
}

export function parseCommandList(value: string): string[] {
  return value
    .split(COMMAND_SEPARATOR)
    .map((command) => command.trim())
    .filter((command) => command.length > 0);
}

export function joinCommandList(commands: string[]): string {
  return commands.join(` ${COMMAND_SEPARATOR} `);
}

export function expandHome(value: string): string {
  if (value === '~') {
    return process.env.HOME ?? value;
  }
  if (value.startsWith('~/')) {
    return `${process.env.HOME ?? ''}/${value.slice(2)}`;
  }
  return value;
}
