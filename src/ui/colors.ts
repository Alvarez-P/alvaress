export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const RGB = {
  accent: { r: 68, g: 94, b: 161 },
  text: { r: 200, g: 200, b: 200 },
  border: { r: 26, g: 41, b: 70 },
  surface: { r: 31, g: 35, b: 46 },
  warning: { r: 209, g: 154, b: 102 }
} as const satisfies Record<string, Rgb>;

export type PaletteColor = keyof typeof RGB;

export const RESET = '\x1b[0m';

function foreground(color: Rgb): string {
  return `\x1b[38;2;${color.r};${color.g};${color.b}m`;
}

function background(color: Rgb): string {
  return `\x1b[48;2;${color.r};${color.g};${color.b}m`;
}

export interface Palette {
  readonly enabled: boolean;
  accent(value: string): string;
  text(value: string): string;
  border(value: string): string;
  warning(value: string): string;
  surface(value: string): string;
  bold(value: string): string;
  dim(value: string): string;
}

export function createPalette(enabled: boolean): Palette {
  const wrap = (prefix: string, value: string): string =>
    enabled ? `${prefix}${value}${RESET}` : value;

  return {
    enabled,
    accent: (value) => wrap(foreground(RGB.accent), value),
    text: (value) => wrap(foreground(RGB.text), value),
    border: (value) => wrap(foreground(RGB.border), value),
    warning: (value) => wrap(foreground(RGB.warning), value),
    surface: (value) =>
      enabled ? `${background(RGB.surface)}${foreground(RGB.text)}${value}${RESET}` : value,
    bold: (value) => (enabled ? `\x1b[1m${value}${RESET}` : value),
    dim: (value) => (enabled ? `\x1b[2m${value}${RESET}` : value)
  };
}

export function colorEnabled(
  stream: Pick<NodeJS.WriteStream, 'isTTY'> = process.stdout,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') {
    return false;
  }
  if (env.FORCE_COLOR === '0') {
    return false;
  }
  if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== '') {
    return true;
  }
  return Boolean(stream.isTTY);
}

export function defaultPalette(): Palette {
  return createPalette(colorEnabled());
}

const ESCAPE = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESCAPE}\\[[0-9;]*m`, 'g');

export function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, '');
}
