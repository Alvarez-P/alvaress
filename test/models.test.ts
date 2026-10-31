import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isModelReference, validateModelReference } from '../src/config/models.js';

test('isModelReference exige provider/model y permite vacío', () => {
  assert.equal(isModelReference(''), true);
  assert.equal(isModelReference('openai/gpt-5'), true);
  assert.equal(isModelReference('openrouter/anthropic/claude-3.5'), true);
  assert.equal(isModelReference('openai/gpt-5#high'), true);
  assert.equal(isModelReference('gpt-5'), false);
  assert.equal(isModelReference('openai/'), false);
  assert.equal(isModelReference('/gpt-5'), false);
  assert.equal(isModelReference('openai/gpt 5'), false);
});

test('validateModelReference devuelve un mensaje útil', () => {
  assert.equal(validateModelReference('openai/gpt-5'), undefined);
  assert.match(validateModelReference('gpt-5') ?? '', /provider\/model/);
});
