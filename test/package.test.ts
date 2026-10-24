import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { VERSION } from '../src/constants.js';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8')) as {
  name: string;
  version: string;
  license: string;
  bin: Record<string, string>;
  files: string[];
  engines: Record<string, string>;
  scripts: Record<string, string>;
};

test('package.json publica el binario y la versión correctos', () => {
  assert.equal(pkg.name, 'alvaress');
  assert.equal(pkg.version, VERSION);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.engines.node, '>=20');
  assert.deepEqual(pkg.bin, {
    alvaress: 'dist/index.js'
  });
  assert.ok(pkg.files.includes('dist'));
});

test('dist/index.js existe, tiene shebang y es el entrypoint', () => {
  const entry = path.join(root, 'dist', 'index.js');
  assert.ok(fs.existsSync(entry));
  assert.equal(fs.readFileSync(entry, 'utf-8').split('\n')[0], '#!/usr/bin/env node');
  assert.ok(fs.existsSync(path.join(root, 'dist', 'index.d.ts')));
});

test('incluye README, LICENSE y scripts de publicación', () => {
  assert.ok(fs.existsSync(path.join(root, 'README.md')));
  assert.ok(fs.existsSync(path.join(root, 'LICENSE')));
  assert.ok(pkg.scripts.test !== undefined);
  assert.ok(pkg.scripts.validate !== undefined);
  assert.match(pkg.scripts.prepublishOnly ?? '', /validate/);
  assert.match(pkg.scripts.prepublishOnly ?? '', /test/);
});
