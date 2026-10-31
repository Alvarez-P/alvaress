import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merge, overlaps } from '../src/range.ts';

test('detecta rangos que se cruzan', () => {
  assert.equal(overlaps({ start: 1, end: 5 }, { start: 4, end: 8 }), true);
});

test('los rangos contiguos no se solapan porque el fin es exclusivo', () => {
  assert.equal(overlaps({ start: 1, end: 3 }, { start: 3, end: 5 }), false);
});

test('merge une solo los rangos que se solapan', () => {
  assert.deepEqual(
    merge([
      { start: 5, end: 7 },
      { start: 1, end: 3 },
      { start: 3, end: 4 },
      { start: 2, end: 3 }
    ]),
    [
      { start: 1, end: 3 },
      { start: 3, end: 4 },
      { start: 5, end: 7 }
    ]
  );
});
