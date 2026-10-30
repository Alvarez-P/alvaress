import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slug.ts';

test('pasa a minúsculas y une palabras con guiones', () => {
  assert.equal(slugify('Hola Mundo'), 'hola-mundo');
});

test('quita acentos y la eñe', () => {
  assert.equal(slugify('Canción del Año'), 'cancion-del-ano');
});

test('colapsa separadores y recorta extremos', () => {
  assert.equal(slugify('  ¡Hola,   mundo!  '), 'hola-mundo');
});

test('devuelve vacío si no hay letras ni números', () => {
  assert.equal(slugify(' -- '), '');
});
