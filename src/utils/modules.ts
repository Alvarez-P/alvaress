import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CONDITIONS = ['import', 'node', 'default', 'require'] as const;

function packageName(specifier: string): string | undefined {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Busca `node_modules/<paquete>` subiendo desde la raíz del proyecto. */
function findPackageDir(specifier: string, from: string): string | undefined {
  const name = packageName(specifier);
  if (name === undefined || name.length === 0) {
    return undefined;
  }

  let dir = path.resolve(from);
  for (;;) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

/** Elige la entrada ESM de un campo `exports` (puede tener condiciones anidadas). */
function pickEntry(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if ('.' in record) {
    const root = pickEntry(record['.']);
    if (root !== undefined) {
      return root;
    }
  }
  for (const condition of CONDITIONS) {
    const entry = pickEntry(record[condition]);
    if (entry !== undefined) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Resuelve la entrada ESM de un paquete desde la raíz del proyecto.
 *
 * El runtime de Laya se instala en el `package.json` del proyecto, así que un
 * `import()` relativo a alvaress no lo encontraría cuando el CLI vive en una
 * instalación global. Se resuelve primero la entrada ESM (condición `import`) y
 * se cae a `require.resolve` para paquetes que solo publican CommonJS.
 */
export function resolveModuleUrl(specifier: string, from: string): string | undefined {
  const dir = findPackageDir(specifier, from);
  if (dir !== undefined) {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
        exports?: unknown;
        module?: unknown;
        main?: unknown;
      };
      const entry =
        pickEntry(manifest.exports) ??
        (typeof manifest.module === 'string' ? manifest.module : undefined) ??
        (typeof manifest.main === 'string' ? manifest.main : undefined);
      if (entry !== undefined) {
        return pathToFileURL(path.resolve(dir, entry)).href;
      }
    } catch {
      // Sigue con `require.resolve`.
    }
  }

  try {
    const require = createRequire(path.join(path.resolve(from), 'package.json'));
    return pathToFileURL(require.resolve(specifier)).href;
  } catch {
    return undefined;
  }
}

/** Comprueba si un módulo se puede resolver desde la raíz del proyecto. */
export function moduleAvailableFrom(specifier: string, from: string): boolean {
  return resolveModuleUrl(specifier, from) !== undefined;
}
