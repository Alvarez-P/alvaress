export class CancelledError extends Error {
  constructor(message = 'Operación cancelada.') {
    super(message);
    this.name = 'CancelledError';
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManifestError';
  }
}

export class DecisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecisionError';
  }
}

export class LockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockError';
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
