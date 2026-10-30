import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { FIXTURES_DIR, listFixtures, readTask, runFixture, summarize } from '../bench/runner.js';
import { fakeOpencode, makeTempDir } from './helpers.js';

function fixtureEnv(bin: string): NodeJS.ProcessEnv {
  const { NODE_TEST_CONTEXT: _nested, ...env } = process.env;
  return { ...env, PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` };
}

const STEP =
  '{"type":"step_finish","sessionID":"s","part":{"cost":0,"tokens":{"input":1000,"output":50,"reasoning":0,"cache":{"read":200,"write":0}}}}';

test('los fixtures del benchmark declaran tarea, alcance y validación', () => {
  const fixtures = listFixtures();

  assert.ok(fixtures.length >= 3);
  for (const fixture of fixtures) {
    const task = readTask(fixture);
    assert.ok(task.request.length > 0, fixture);
    assert.ok(task.files.length > 0, fixture);
    assert.ok(task.validation.some((command) => command.includes('node --test')), fixture);
    assert.ok(task.validation.every((command) => !command.includes('{{tsc}}')), fixture);
  }
});

test('runFixture recorre el HarnessCore real y mide los tokens del subagente', async () => {
  const temp = makeTempDir('alvaress-bench-test-');
  try {
    const bin = path.join(temp.path, 'bin');
    const solution = path.join(FIXTURES_DIR, 'fix-overlap', 'solution');
    fakeOpencode(bin, { action: `cp -R '${solution}/.' . && printf '%s\\n' '${STEP}'` });

    const result = await runFixture('fix-overlap', {
      roles: [],
      selfCheck: false,
      env: fixtureEnv(bin)
    });

    assert.equal(result.state, 'Ready', result.halt);
    assert.equal(result.fixes, 0);
    assert.equal(result.auditFindings, 0);
    assert.equal(result.usage?.phases['implementación']?.input, 1000);
    assert.match(summarize([result]), /\| fix-overlap \| 1\/1 \| 1 \| 1000 \| 50 \| 200 \| 0\.0 \|/);
  } finally {
    temp.cleanup();
  }
});

test('runFixture repara cuando el primer intento no pasa la validación', async () => {
  const temp = makeTempDir('alvaress-bench-fix-');
  try {
    const bin = path.join(temp.path, 'bin');
    const solution = path.join(FIXTURES_DIR, 'fix-overlap', 'solution');
    const action = [
      `if printf '%s' "$*" | grep -q alvaress-fixer; then cp -R '${solution}/.' .;`,
      `else printf 'export const roto = 1;\\n' >> src/range.ts; fi`,
      `printf '%s\\n' '${STEP}'`
    ].join('\n');
    fakeOpencode(bin, { action });

    const result = await runFixture('fix-overlap', {
      roles: [],
      selfCheck: false,
      env: fixtureEnv(bin)
    });

    assert.equal(result.state, 'Ready', result.halt);
    assert.equal(result.fixes, 1);
    assert.equal(result.usage?.phases['reparación']?.calls, 1);
    assert.equal(result.usage?.total.calls, 2);
  } finally {
    temp.cleanup();
  }
});

test('runFixture termina en HALT si el subagente no resuelve la tarea', async () => {
  const temp = makeTempDir('alvaress-bench-halt-');
  try {
    const bin = path.join(temp.path, 'bin');
    fakeOpencode(bin, { action: `printf 'export const intento = 1;\\n' >> src/range.ts` });

    const result = await runFixture('fix-overlap', { roles: [], selfCheck: false, env: fixtureEnv(bin) });

    assert.equal(result.state, 'Halted');
    assert.equal(result.fixes, 2);
  } finally {
    temp.cleanup();
  }
});
