import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aiderEnvFor,
  aiderEnvKey,
  aiderModelFor,
  isModelReference,
  providerOf,
  validateModelReference
} from '../src/config/models.js';

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

test('providerOf y aiderEnvKey mapean proveedores', () => {
  assert.equal(providerOf('openai/gpt-5'), 'openai');
  assert.equal(providerOf('local'), '');
  assert.equal(aiderEnvKey('openai/gpt-5'), 'OPENAI_API_KEY');
  assert.equal(aiderEnvKey('deepseek/deepseek-chat'), 'DEEPSEEK_API_KEY');
  assert.equal(aiderEnvKey('anthropic/claude-sonnet-4'), 'ANTHROPIC_API_KEY');
  assert.equal(aiderEnvKey('google/gemini-2.5-pro'), 'GEMINI_API_KEY');
  assert.equal(aiderEnvKey('openrouter/anthropic/claude-3.5'), 'OPENROUTER_API_KEY');
  assert.equal(aiderEnvKey('ollama/llama3'), '');
  assert.equal(aiderEnvKey('desconocido/modelo'), 'OPENAI_API_KEY');
});

test('aiderModelFor traduce google a gemini', () => {
  assert.equal(aiderModelFor('google/gemini-2.5-pro'), 'gemini/gemini-2.5-pro');
  assert.equal(aiderModelFor('openai/gpt-5'), 'openai/gpt-5');
});

test('aiderEnvFor omite claves vacías', () => {
  assert.deepEqual(aiderEnvFor('anthropic/claude-sonnet-4', 'sk-ant'), {
    ANTHROPIC_API_KEY: 'sk-ant'
  });
  assert.deepEqual(aiderEnvFor('anthropic/claude-sonnet-4', ''), {});
  assert.deepEqual(aiderEnvFor('ollama/llama3', 'sk-x'), {});
});
