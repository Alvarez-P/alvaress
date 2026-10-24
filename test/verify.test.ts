import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mergeConfig } from '../src/config/loader.js';
import type { HarnessConfig } from '../src/config/loader.js';
import {
  formatValidationFailure,
  runValidationCommands,
  verifyAndRepairTask
} from '../src/orchestrator/verify.js';
import { makeTempDir, fakeAider } from './helpers.js';

function configWith(commands: string[], maxAttempts = 1): HarnessConfig {
  const base = mergeConfig({}, {});
  return {
    ...base,
    validation: { maxAttempts, commands }
  };
}

test('runValidationCommands devuelve null cuando todo pasa', () => {
  const temp = makeTempDir();
  try {
    assert.equal(runValidationCommands(['true', 'node -e "process.exit(0)"'], temp.path), null);
  } finally {
    temp.cleanup();
  }
});

test('runValidationCommands se detiene en el primer fallo', () => {
  const temp = makeTempDir();
  try {
    const marker = path.join(temp.path, 'second-command-ran');
    const failure = runValidationCommands(
      ['false', `touch ${JSON.stringify(marker)}`],
      temp.path
    );

    assert.ok(failure !== null);
    assert.equal(failure.command, 'false');
    assert.equal(fs.existsSync(marker), false);
  } finally {
    temp.cleanup();
  }
});

test('runValidationCommands ignora comandos vacíos', () => {
  const temp = makeTempDir();
  try {
    assert.equal(runValidationCommands(['', '   ', 'true'], temp.path), null);
  } finally {
    temp.cleanup();
  }
});

test('formatValidationFailure incluye comando, código y salida', () => {
  const formatted = formatValidationFailure({
    command: 'npx tsc --noEmit',
    result: { code: 2, stdout: 'stdout-detail', stderr: 'stderr-detail' }
  });

  assert.match(formatted, /Comando fallido: npx tsc --noEmit/);
  assert.match(formatted, /Código de salida: 2/);
  assert.match(formatted, /stdout-detail/);
  assert.match(formatted, /stderr-detail/);
});

test('verifyAndRepairTask valida sin invocar Aider cuando no hay errores', async () => {
  const temp = makeTempDir();
  try {
    const bin = path.join(temp.path, 'bin');
    fs.mkdirSync(bin);
    const log = path.join(temp.path, 'aider.log');
    fakeAider(bin, { log });

    const verified = await verifyAndRepairTask('TASK-01', {
      root: temp.path,
      config: configWith(['true']),
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });

    assert.equal(verified, true);
    assert.equal(fs.existsSync(log), false);
  } finally {
    temp.cleanup();
  }
});

test('verifyAndRepairTask devuelve true sin comandos configurados', async () => {
  const temp = makeTempDir();
  try {
    const verified = await verifyAndRepairTask('TASK-01', {
      root: temp.path,
      config: configWith([], 3),
      requireCommands: false
    });
    assert.equal(verified, true);
  } finally {
    temp.cleanup();
  }
});

test('verifyAndRepairTask falla sin reparar cuando maxAttempts es 1', async () => {
  const temp = makeTempDir();
  try {
    const bin = path.join(temp.path, 'bin');
    fs.mkdirSync(bin);
    const log = path.join(temp.path, 'aider.log');
    fakeAider(bin, { log });

    const verified = await verifyAndRepairTask('TASK-01', {
      root: temp.path,
      config: configWith(['node -e "process.exit(1)"'], 1),
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });

    assert.equal(verified, false);
    assert.equal(fs.existsSync(log), false);
  } finally {
    temp.cleanup();
  }
});

test('verifyAndRepairTask repara con Aider y vuelve a validar', async () => {
  const temp = makeTempDir();
  try {
    const bin = path.join(temp.path, 'bin');
    fs.mkdirSync(bin);
    const log = path.join(temp.path, 'aider.log');
    const marker = path.join(temp.path, 'fixed');
    fakeAider(bin, { log, action: `touch '${marker}'` });

    const command = `node -e "process.exit(require('node:fs').existsSync('${marker.replaceAll('\\', '\\\\')}') ? 0 : 1)"`;
    const verified = await verifyAndRepairTask('TASK-01', {
      root: temp.path,
      config: configWith([command], 3),
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });

    assert.equal(verified, true);
    assert.equal(fs.existsSync(marker), true);
    const calls = fs.readFileSync(log, 'utf-8').trim().split('\n');
    assert.equal(calls.length, 1);
    assert.match(calls[0] ?? '', /--model deepseek\/deepseek-chat/);
    assert.match(calls[0] ?? '', /--no-auto-commits/);
  } finally {
    temp.cleanup();
  }
});

test('verifyAndRepairTask falla tras agotar los intentos', async () => {
  const temp = makeTempDir();
  try {
    const bin = path.join(temp.path, 'bin');
    fs.mkdirSync(bin);
    const log = path.join(temp.path, 'aider.log');
    fakeAider(bin, { log });

    const verified = await verifyAndRepairTask('TASK-01', {
      root: temp.path,
      config: configWith(['false'], 3),
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });

    assert.equal(verified, false);
    assert.equal(fs.readFileSync(log, 'utf-8').trim().split('\n').length, 2);
  } finally {
    temp.cleanup();
  }
});
