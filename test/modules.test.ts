import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { moduleAvailableFrom, resolveModuleUrl } from '../src/utils/modules.js';
import { makeTempDir, writeFile, writeJson } from './helpers.js';

test('resolveModuleUrl elige la condición import desde la raíz del proyecto', () => {
  const temp = makeTempDir('alvaress-modules-');
  try {
    writeJson(path.join(temp.path, 'node_modules', 'paquete-esm', 'package.json'), {
      name: 'paquete-esm',
      type: 'module',
      exports: {
        '.': {
          node: { require: './dist/index.cjs', import: './dist/index.mjs' },
          default: './dist/index.mjs'
        }
      }
    });
    writeFile(path.join(temp.path, 'node_modules', 'paquete-esm', 'dist', 'index.mjs'), 'export const ok = true;\n');

    const url = resolveModuleUrl('paquete-esm', temp.path);

    assert.ok(url?.endsWith('/node_modules/paquete-esm/dist/index.mjs'));
    assert.equal(moduleAvailableFrom('paquete-esm', temp.path), true);
    assert.equal(moduleAvailableFrom('paquete-inexistente', temp.path), false);
  } finally {
    temp.cleanup();
  }
});

test('resolveModuleUrl sube por los directorios padre como Node', () => {
  const temp = makeTempDir('alvaress-modules-');
  try {
    writeJson(path.join(temp.path, 'node_modules', 'paquete-cjs', 'package.json'), {
      name: 'paquete-cjs',
      main: 'index.js'
    });
    writeFile(path.join(temp.path, 'node_modules', 'paquete-cjs', 'index.js'), 'module.exports = {};\n');
    const nested = path.join(temp.path, 'src', 'interno');

    assert.ok(resolveModuleUrl('paquete-cjs', nested)?.endsWith('/node_modules/paquete-cjs/index.js'));
  } finally {
    temp.cleanup();
  }
});
