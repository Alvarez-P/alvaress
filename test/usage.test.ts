import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UsageLedger, formatUsage, parseOpencodeOutput } from '../src/orchestrator/usage.js';

const STEP = (input: number, output: number): string =>
  JSON.stringify({
    type: 'step_finish',
    timestamp: 1,
    sessionID: 's',
    part: { cost: 0.002, tokens: { input, output, reasoning: 5, cache: { read: 10, write: 2 } } }
  });

test('parseOpencodeOutput suma los step_finish y concatena el texto', () => {
  const stdout = [
    JSON.stringify({ type: 'step_start', sessionID: 's', part: {} }),
    JSON.stringify({ type: 'text', sessionID: 's', part: { text: 'hola' } }),
    STEP(100, 10),
    'línea que no es json',
    JSON.stringify({ type: 'text', sessionID: 's', part: { text: 'mundo' } }),
    STEP(200, 20)
  ].join('\n');

  const output = parseOpencodeOutput(stdout);

  assert.equal(output.text, 'hola\nmundo');
  assert.equal(output.events, 5);
  assert.deepEqual(output.usage, {
    calls: 1,
    input: 300,
    output: 30,
    reasoning: 10,
    cacheRead: 20,
    cacheWrite: 4,
    cost: 0.004
  });
});

test('parseOpencodeOutput tolera salida en texto plano', () => {
  const output = parseOpencodeOutput('respuesta sin eventos');

  assert.equal(output.events, 0);
  assert.equal(output.usage.input, 0);
  assert.equal(output.usage.calls, 1);
});

test('UsageLedger agrupa por fase y calcula el total', () => {
  const ledger = new UsageLedger();
  assert.equal(ledger.snapshot(), undefined);

  ledger.add('implementación', parseOpencodeOutput(STEP(100, 10)).usage);
  ledger.add('reparación', parseOpencodeOutput(STEP(50, 5)).usage);
  ledger.add('reparación', parseOpencodeOutput(STEP(50, 5)).usage);

  const usage = ledger.snapshot();
  assert.equal(usage?.phases['reparación']?.calls, 2);
  assert.equal(usage?.phases['reparación']?.input, 100);
  assert.equal(usage?.total.input, 200);
  assert.equal(usage?.total.calls, 3);
  assert.match(formatUsage(usage!.total), /3 llamada\(s\): entrada 200, salida 20/);
});
