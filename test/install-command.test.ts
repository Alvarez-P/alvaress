import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runInstall } from '../src/commands/install.js';
import type { InstallRuntime } from '../src/commands/install.js';
import { mergeConfig } from '../src/config/loader.js';
import type { HarnessConfig } from '../src/config/loader.js';
import type { CommandResult } from '../src/utils/process.js';
import { makeTempDir } from './helpers.js';

function result(code = 0): CommandResult {
  return { code, stdout: '', stderr: '' };
}

test('install --yes instala componentes y descarga el modelo sin preguntar', async () => {
  const temp = makeTempDir('alvaress-install-yes-');
  try {
    const root = path.join(temp.path, 'project');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
    const vault = path.join(temp.path, 'vault');

    const calls: string[] = [];
    const pulled: string[] = [];
    let saved: HarnessConfig | undefined;

    const config = mergeConfig(
      {
        obsidianVaultPath: vault,
        decision: { model: 'laya', apiBase: 'http://127.0.0.1:11434' }
      },
      {}
    );

    const runtime: Partial<InstallRuntime> = {
      commandExists: (command) => command === 'pipx' || command === 'pnpm',
      runCommand: async (command, args = []) => {
        calls.push([command, ...args].join(' '));
        if (command === 'aider' && args[0] === '--version') {
          return result(1);
        }
        return result(0);
      },
      loadConfig: () => config,
      getConfigPaths: () => ({
        global: path.join(temp.path, 'global.json'),
        local: path.join(root, '.alvaressrc.json')
      }),
      saveGlobalConfig: (value) => {
        saved = value;
      },
      detectObsidian: () => ({ installed: true, method: 'binary' }),
      installObsidian: async () => ({ installed: true, message: 'ok' }),
      connectObsidianVault: () => ({
        vaultPath: vault,
        harnessDir: path.join(vault, 'Harness'),
        tasksLink: path.join(vault, 'Harness', 'Tasks'),
        tasksLinkResult: 'created',
        notePath: path.join(vault, 'Harness', 'demo.md')
      }),
      installSkills: () => ({
        skillsDir: path.join(root, '.harness', 'skills'),
        files: [],
        links: []
      }),
      installAgent: () => ({ name: 'alvaress', files: [], subagents: [] }),
      detectOllama: async () => ({ installed: false, running: false, models: [] }),
      installOllama: async () => result(0),
      waitForOllama: async () => ({
        installed: true,
        running: true,
        version: '0.40.4',
        models: []
      }),
      ensureOllamaRunning: async () => ({
        installed: true,
        running: true,
        version: '0.40.4',
        models: []
      }),
      pullOllamaModel: async (model) => {
        pulled.push(model);
        return result(0);
      }
    };

    await runInstall(root, { yes: true, runtime });

    assert.ok(calls.includes('pipx install graphifyy'));
    assert.ok(calls.includes('pipx install aider-chat'));
    assert.ok(calls.some((call) => call.startsWith('pnpm add ')));
    assert.deepEqual(pulled, ['laya']);
    assert.equal(saved?.decision.model, 'laya');
    assert.equal(saved?.obsidianVaultPath, vault);
    assert.ok(fs.existsSync(path.join(root, 'openspec.yaml')));
    assert.equal(fs.existsSync(path.join(root, '.alvaressrc.json')), false);
  } finally {
    temp.cleanup();
  }
});
