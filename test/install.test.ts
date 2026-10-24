import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWithDefault } from '../src/commands/install.js';

test('validateWithDefault acepta vacío cuando existe valor por defecto', () => {
  const validate = validateWithDefault('/tmp/vault', 'La ruta es obligatoria.');

  assert.equal(validate(undefined), undefined);
  assert.equal(validate(''), undefined);
  assert.equal(validate('   '), undefined);
  assert.equal(validate('/otra/ruta'), undefined);
});

test('validateWithDefault exige valor cuando no hay valor por defecto', () => {
  const validate = validateWithDefault('', 'Este valor es obligatorio.');

  assert.equal(validate(undefined), 'Este valor es obligatorio.');
  assert.equal(validate(''), 'Este valor es obligatorio.');
  assert.equal(validate('   '), 'Este valor es obligatorio.');
  assert.equal(validate('valor'), undefined);
});
