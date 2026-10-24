type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'step';

const PREFIXES: Record<LogLevel, string> = {
  info: '[alvaress]',
  warn: '[alvaress] AVISO:',
  error: '[alvaress] ERROR:',
  success: '[alvaress] OK:',
  step: '[alvaress] >>'
};

function emit(level: LogLevel, message: string): void {
  const line = `${PREFIXES[level]} ${message}`;
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(message: string): void {
    emit('info', message);
  },
  warn(message: string): void {
    emit('warn', message);
  },
  error(message: string): void {
    emit('error', message);
  },
  success(message: string): void {
    emit('success', message);
  },
  step(message: string): void {
    emit('step', message);
  }
};

export function truncate(text: string, maxLength = 12000): string {
  if (text.length <= maxLength) {
    return text;
  }
  const head = text.slice(0, Math.floor(maxLength * 0.7));
  const tail = text.slice(text.length - Math.floor(maxLength * 0.3));
  return `${head}\n...[salida truncada]...\n${tail}`;
}

export function commandOutput(stdout: string, stderr: string, fallback = 'Sin salida del comando.'): string {
  const output = [stdout.trim(), stderr.trim()].filter((part) => part.length > 0).join('\n');
  return output.length > 0 ? output : fallback;
}
