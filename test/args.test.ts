import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flagEnabled, parseArgs } from '../src/utils/args.js';
import { expandHome, joinCommandList, parseCommandList } from '../src/utils/prompt.js';

test('parseArgs separa posicionales y flags', () => {
  assert.deepEqual(parseArgs(['SPEC-001/TASK-01', '--dry-run', '--model', 'qwen']), {
    positional: ['SPEC-001/TASK-01'],
    flags: { 'dry-run': true, model: 'qwen' }
  });
});

test('parseArgs admite --flag=valor y flags cortos', () => {
  assert.deepEqual(parseArgs(['--model=qwen', '-v']), {
    positional: [],
    flags: { model: 'qwen', v: true }
  });
});

test('parseArgs mantiene booleanos conocidos sin consumir el siguiente argumento', () => {
  assert.deepEqual(parseArgs(['--no-link', 'TASK-01']), {
    positional: ['TASK-01'],
    flags: { 'no-link': true }
  });
  assert.deepEqual(parseArgs(['--force', '--update-graph', '--no-lock', 'TASK-01']), {
    positional: ['TASK-01'],
    flags: { force: true, 'update-graph': true, 'no-lock': true }
  });
  assert.deepEqual(parseArgs(['--yes', 'TASK-01']), {
    positional: ['TASK-01'],
    flags: { yes: true }
  });
});

test('flagEnabled interpreta true y "true"', () => {
  assert.equal(flagEnabled({ 'dry-run': true }, 'dry-run'), true);
  assert.equal(flagEnabled({ 'dry-run': 'true' }, 'dry-run'), true);
  assert.equal(flagEnabled({ 'dry-run': 'false' }, 'dry-run'), false);
  assert.equal(flagEnabled({}, 'dry-run'), false);
});

test('parseCommandList divide por el separador y limpia espacios', () => {
  assert.deepEqual(parseCommandList('npx tsc --noEmit ;;  npx oxlint  ;; '), [
    'npx tsc --noEmit',
    'npx oxlint'
  ]);
  assert.deepEqual(parseCommandList('   '), []);
});

test('joinCommandList usa el separador esperado', () => {
  assert.equal(joinCommandList(['a', 'b']), 'a ;; b');
  assert.deepEqual(parseCommandList(joinCommandList(['a', 'b'])), ['a', 'b']);
});

test('expandHome resuelve ~ y ~/', () => {
  const original = process.env.HOME;
  process.env.HOME = '/home/tester';
  try {
    assert.equal(expandHome('~'), '/home/tester');
    assert.equal(expandHome('~/vault'), '/home/tester/vault');
    assert.equal(expandHome('/absolute'), '/absolute');
    assert.equal(expandHome('relative'), 'relative');
  } finally {
    process.env.HOME = original;
  }
});
