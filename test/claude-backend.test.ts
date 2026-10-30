import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mergeConfig } from '../src/config/loader.js';
import type { WorkPlan } from '../src/core/contracts.js';
import {
  claudeArgs,
  claudeModel,
  claudePermissions,
  claudeSessionUuid,
  parseClaudeOutput,
  subagentDefinition
} from '../src/orchestrator/claude-backend.js';
import { createWorker } from '../src/orchestrator/workers.js';
import { makeTempDir, writeExecutable, writeFile } from './helpers.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('claudeModel traduce el modelo configurado al alias de Claude Code', () => {
  assert.deepEqual(claudeModel('anthropic/claude-haiku-5-5'), { model: 'claude-haiku-5-5', fallback: false });
  assert.deepEqual(claudeModel('sonnet'), { model: 'sonnet', fallback: false });
  assert.deepEqual(claudeModel(''), { model: 'haiku', fallback: false });
  assert.deepEqual(claudeModel('opencode/deepseek-v4.1-flash-free'), { model: 'haiku', fallback: true });
});

test('claudeSessionUuid es un UUID v4 estable por sesión', () => {
  const first = claudeSessionUuid('ses_alvaressrun1');

  assert.match(first, UUID);
  assert.equal(claudeSessionUuid('ses_alvaressrun1'), first);
  assert.notEqual(claudeSessionUuid('ses_alvaressrun1architect'), first);
});

test('claudePermissions conserva los límites del subagente', () => {
  const implementer = claudePermissions(subagentDefinition('alvaress-implementer'), ['node --test x']);
  const reviewer = claudePermissions(subagentDefinition('alvaress-reviewer'));

  assert.ok(implementer.tools.includes('Edit'));
  assert.ok(implementer.allowed.includes('Bash(git diff *)'));
  assert.ok(implementer.allowed.includes('Bash(node --test x)'));
  assert.ok(implementer.denied.includes('Bash(git push *)'));
  assert.ok(implementer.denied.includes('Read(**/*.env)'));
  assert.ok(!reviewer.tools.includes('Edit'));
  assert.ok(!reviewer.allowed.includes('Write'));
});

test('claudeArgs pone el prompt antes de las opciones variádicas y retoma sesiones', () => {
  const definition = subagentDefinition('alvaress-fixer');
  const fresh = claudeArgs(definition, 'repara', { model: 'haiku', sessionUuid: 'u', resume: false });
  const resumed = claudeArgs(definition, 'repara', { model: 'haiku', sessionUuid: 'u', resume: true });

  assert.deepEqual(fresh.slice(0, 2), ['-p', 'repara']);
  assert.ok(fresh.indexOf('--tools') > fresh.indexOf('--append-system-prompt'));
  assert.equal(fresh[fresh.indexOf('--session-id') + 1], 'u');
  assert.equal(resumed[resumed.indexOf('--resume') + 1], 'u');
  assert.ok(!resumed.includes('--session-id'));
  assert.ok(fresh.includes('dontAsk'));
  assert.equal(fresh[fresh.indexOf('--effort') + 1], 'medium');
  const implementer = claudeArgs(subagentDefinition('alvaress-implementer'), 'x', {
    model: 'haiku',
    sessionUuid: 'u',
    resume: false
  });
  assert.equal(implementer[implementer.indexOf('--effort') + 1], 'low');
});

test('parseClaudeOutput lee tokens, caché, costo y errores', () => {
  const ok = parseClaudeOutput(
    JSON.stringify({
      result: 'listo',
      is_error: false,
      total_cost_usd: 0.002,
      usage: {
        input_tokens: 6,
        output_tokens: 800,
        cache_read_input_tokens: 24000,
        cache_creation_input_tokens: 8000,
        output_tokens_details: { thinking_tokens: 300 }
      }
    })
  );
  const failed = parseClaudeOutput(JSON.stringify({ result: 'Credit balance is too low', is_error: true }));

  assert.equal(ok.text, 'listo');
  assert.deepEqual(ok.usage, {
    calls: 1,
    input: 6,
    output: 800,
    reasoning: 300,
    cacheRead: 24000,
    cacheWrite: 8000,
    cost: 0.002
  });
  assert.equal(ok.error, undefined);
  assert.equal(failed.error, 'Credit balance is too low');
  assert.equal(parseClaudeOutput('no es json').events, 0);
});

test('SubagentWorker con backend claude invoca claude -p y retoma la sesión en el fixer', async () => {
  const temp = makeTempDir('alvaress-claude-worker-');
  try {
    const bin = path.join(temp.path, 'bin');
    const log = path.join(temp.path, 'claude.log');
    const result = JSON.stringify({ result: 'ok', is_error: false, total_cost_usd: 0.001, usage: { input_tokens: 5, output_tokens: 7 } });
    writeExecutable(
      path.join(bin, 'claude'),
      [
        '#!/bin/sh',
        `printf '%s' "$*" | tr '\\n' ' ' >> '${log}'`,
        `echo >> '${log}'`,
        `printf '%s' '${result}'`,
        ''
      ].join('\n')
    );
    writeFile(path.join(temp.path, 'src', 'helper.ts'), 'export const a = 1;\n');
    const base = mergeConfig({}, {});
    const worker = createWorker({
      root: temp.path,
      config: {
        ...base,
        worker: { ...base.worker, backend: 'claude' },
        models: { ...base.models, subagents: { modelName: 'anthropic/claude-haiku-5-5' } }
      },
      env: { PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });
    const plan: WorkPlan = {
      runId: 'run-1',
      mode: 'odd',
      request: 'cambia el helper',
      source: 'nota',
      acceptance: [],
      files: ['src/helper.ts'],
      validation: ['node --test'],
      learnings: []
    };

    await worker.work(plan);
    await worker.fix({
      runId: 'run-1',
      attempt: 1,
      files: plan.files,
      failure: { ok: false, commands: [{ command: 'node --test', code: 1 }], warnings: [] },
      error: 'falló'
    });

    const [work, fix] = fs.readFileSync(log, 'utf-8').trim().split('\n');
    assert.match(work ?? '', /^-p Implementa el cambio/);
    assert.match(work ?? '', /--model claude-haiku-5-5/);
    assert.match(work ?? '', /--session-id [0-9a-f-]{36}/);
    assert.match(fix ?? '', /--resume [0-9a-f-]{36}/);
    assert.match(fix ?? '', /Bash\(node --test\)/);
    assert.equal(worker.usage?.()?.total.output, 14);
  } finally {
    temp.cleanup();
  }
});
