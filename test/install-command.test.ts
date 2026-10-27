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

test('install --yes usa pnpm aunque el proyecto declare npm', async () => {
  const temp = makeTempDir('alvaress-install-yes-');
  try {
    const root = path.join(temp.path, 'project');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
    const vault = path.join(temp.path, 'vault');

    const calls: string[] = [];
    let saved: HarnessConfig | undefined;
    let pipxInstalled = false;
    let pipxCalls = 0;

    const config = mergeConfig(
      {
        obsidianVaultPath: vault,
        packageManager: 'npm',
        laya: { modelDir: '/models/laya' }
      },
      {}
    );

    const runtime: Partial<InstallRuntime> = {
      commandExists: (command) => {
        if (command === 'pipx') {
          return pipxInstalled;
        }
        if (command === 'graphify' || command === 'vp') {
          return false;
        }
        return true;
      },
      moduleAvailable: () => false,
      ensureLayaBundle: async ({ dir }) => dir,
      runCommand: async (command, args = []) => {
        calls.push([command, ...args].join(' '));
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
      installPipx: async () => {
        pipxCalls += 1;
        pipxInstalled = true;
        return result(0);
      }
    };

    await runInstall(root, { yes: true, runtime });

    assert.equal(pipxCalls, 1);
    assert.ok(calls.includes('pipx install graphifyy'));
    assert.ok(
      calls.includes(
        'pnpm add -D vite-plus oxlint typescript @types/node onnxruntime-node @huggingface/tokenizers'
      ),
      calls.join('\n')
    );
    assert.equal(calls.filter((call) => call.startsWith('pnpm add -D ')).length, 1);
    assert.equal(calls.some((call) => call.includes('aider')), false);
    assert.equal(saved?.laya?.enabled, true);
    assert.equal(saved?.laya?.modelDir, '/models/laya');
    assert.equal(saved?.obsidianVaultPath, vault);
    assert.ok(fs.existsSync(path.join(root, 'openspec.yaml')));
    assert.equal(fs.existsSync(path.join(root, '.alvaressrc.json')), false);
  } finally {
    temp.cleanup();
  }
});

test('install --yes instala el runtime de Laya cuando no hay modelDir', async () => {
  const temp = makeTempDir('alvaress-install-laya-');
  try {
    const root = path.join(temp.path, 'project');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
    const vault = path.join(temp.path, 'vault');
    const calls: string[] = [];
    let saved: HarnessConfig | undefined;

    const runtime: Partial<InstallRuntime> = {
      commandExists: (command) => command !== 'pipx' && command !== 'graphify' && command !== 'vp',
      moduleAvailable: () => false,
      ensureLayaBundle: async ({ dir }) => dir,
      runCommand: async (command, args = []) => {
        calls.push([command, ...args].join(' '));
        return result(0);
      },
      loadConfig: () =>
        mergeConfig({ obsidianVaultPath: vault, validation: { maxAttempts: 1, commands: [] } }, {}),
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
      installSkills: () => ({ skillsDir: path.join(root, '.harness', 'skills'), files: [], links: [] }),
      installAgent: () => ({ name: 'alvaress', files: [], subagents: [] }),
      installPipx: async () => result(0)
    };

    await runInstall(root, { yes: true, runtime });

    assert.ok(
      calls.includes(
        'pnpm add -D vite-plus oxlint typescript @types/node onnxruntime-node @huggingface/tokenizers'
      ),
      calls.join('\n')
    );
    assert.equal(calls.filter((call) => call.startsWith('pnpm add -D ')).length, 1);
    assert.equal(saved?.laya?.enabled, true);
    assert.equal(saved?.laya?.modelDir, undefined);
  } finally {
    temp.cleanup();
  }
});

test('install --yes instala Aider cuando ya está habilitado en la configuración', async () => {
  const temp = makeTempDir('alvaress-install-aider-');
  try {
    const root = path.join(temp.path, 'project');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
    const vault = path.join(temp.path, 'vault');
    const calls: string[] = [];

    const config = mergeConfig(
      {
        obsidianVaultPath: vault,
        aider: { enabled: true }
      },
      {}
    );

    let pipxInstalled = false;
    const runtime: Partial<InstallRuntime> = {
      commandExists: (command) =>
        command === 'pipx'
          ? pipxInstalled
          : command !== 'graphify' && command !== 'vp',
      moduleAvailable: () => true,
      ensureLayaBundle: async ({ dir }) => dir,
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
      saveGlobalConfig: () => undefined,
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
      installPipx: async () => {
        pipxInstalled = true;
        return result(0);
      }
    };

    await runInstall(root, { yes: true, runtime });

    assert.ok(calls.includes('pipx install aider-chat'));
  } finally {
    temp.cleanup();
  }
});
