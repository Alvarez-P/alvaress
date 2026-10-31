import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runModelsCommand } from '../src/commands/models.js';
import { mergeConfig } from '../src/config/loader.js';
import type { HarnessConfig } from '../src/config/loader.js';

function config(): HarnessConfig {
  return mergeConfig(
    {
      models: {
        orchestrator: { modelName: 'openai/gpt-5' },
        subagents: { modelName: 'openai/gpt-5-mini' }
      }
    },
    {}
  );
}

test('models set --all guarda ambos roles y reinstala el frontmatter', async () => {
  const base = config();
  let saved: HarnessConfig | undefined;
  const installs: Array<{ orchestrator?: string; subagents?: string }> = [];

  await runModelsCommand(['set', '--all', 'google/gemini-2.5-pro'], '/repo', {
    loadConfig: () => base,
    loadGlobalConfig: () => base,
    saveGlobalConfig: (value) => {
      saved = value;
    },
    installAgent: (_root, options) => {
      installs.push(options?.models ?? {});
      return { name: 'alvaress', files: [], subagents: [] };
    },
    stdout: () => undefined
  });

  assert.equal(saved?.models.orchestrator.modelName, 'google/gemini-2.5-pro');
  assert.equal(saved?.models.subagents.modelName, 'google/gemini-2.5-pro');
  assert.deepEqual(installs, [
    { orchestrator: 'google/gemini-2.5-pro', subagents: 'google/gemini-2.5-pro' }
  ]);
});

test('models set --no-install solo guarda la configuración', async () => {
  let saved: HarnessConfig | undefined;
  let installed = false;

  await runModelsCommand(
    ['set', '--orchestrator', 'anthropic/claude-sonnet-4', '--no-install'],
    '/repo',
    {
      loadConfig: () => config(),
      loadGlobalConfig: () => config(),
      saveGlobalConfig: (value) => {
        saved = value;
      },
      installAgent: () => {
        installed = true;
        return { name: 'alvaress', files: [], subagents: [] };
      },
      stdout: () => undefined
    }
  );

  assert.equal(saved?.models.orchestrator.modelName, 'anthropic/claude-sonnet-4');
  assert.equal(installed, false);
});

test('models set rechaza modelos sin provider/model', async () => {
  await assert.rejects(
    runModelsCommand(['set', '--all', 'gpt-5'], '/repo', {
      loadConfig: () => config(),
      loadGlobalConfig: () => config(),
      saveGlobalConfig: () => undefined,
      installAgent: () => ({ name: 'alvaress', files: [], subagents: [] }),
      stdout: () => undefined
    }),
    /provider\/model/
  );
});

test('models show imprime los modelos efectivos', async () => {
  const lines: string[] = [];
  await runModelsCommand(['show'], '/repo', {
    loadConfig: () => config(),
    stdout: (line) => lines.push(line)
  });

  const shown = JSON.parse(lines.join('\n')) as Record<string, string | null>;
  assert.deepEqual(shown, {
    orchestrator: 'openai/gpt-5',
    subagents: 'openai/gpt-5-mini'
  });
});
