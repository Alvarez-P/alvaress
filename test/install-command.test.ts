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
    let uvInstalled = false;
    let uvCalls = 0;

    const config = mergeConfig(
      {
        vaultPath: vault,
        packageManager: 'npm',
        laya: { modelDir: '/models/laya' }
      },
      {}
    );

    const runtime: Partial<InstallRuntime> = {
      commandExists: (command) => {
        if (command === 'uv') {
          return uvInstalled;
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
      connectVault: () => ({
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
      installUv: async () => {
        uvCalls += 1;
        uvInstalled = true;
        return result(0);
      }
    };

    await runInstall(root, { yes: true, runtime });

    assert.equal(uvCalls, 1);
    assert.ok(calls.includes('uv tool install graphifyy'));
    assert.ok(
      calls.includes(
        'pnpm add -D vite-plus typescript @types/node onnxruntime-node @huggingface/tokenizers'
      ),
      calls.join('\n')
    );
    assert.equal(calls.filter((call) => call.startsWith('pnpm add -D ')).length, 1);
    assert.equal(saved?.laya?.enabled, true);
    assert.equal(saved?.laya?.modelDir, '/models/laya');
    assert.equal(saved?.vaultPath, vault);
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
      commandExists: (command) => command !== 'uv' && command !== 'graphify' && command !== 'vp',
      moduleAvailable: () => false,
      ensureLayaBundle: async ({ dir }) => dir,
      runCommand: async (command, args = []) => {
        calls.push([command, ...args].join(' '));
        return result(0);
      },
      loadConfig: () =>
        mergeConfig({ vaultPath: vault, validation: { maxAttempts: 1, commands: [] } }, {}),
      getConfigPaths: () => ({
        global: path.join(temp.path, 'global.json'),
        local: path.join(root, '.alvaressrc.json')
      }),
      saveGlobalConfig: (value) => {
        saved = value;
      },
      connectVault: () => ({
        vaultPath: vault,
        harnessDir: path.join(vault, 'Harness'),
        tasksLink: path.join(vault, 'Harness', 'Tasks'),
        tasksLinkResult: 'created',
        notePath: path.join(vault, 'Harness', 'demo.md')
      }),
      installSkills: () => ({ skillsDir: path.join(root, '.harness', 'skills'), files: [], links: [] }),
      installAgent: () => ({ name: 'alvaress', files: [], subagents: [] }),
      installUv: async () => result(0)
    };

    await runInstall(root, { yes: true, runtime });

    assert.ok(
      calls.includes(
        'pnpm add -D vite-plus typescript @types/node onnxruntime-node @huggingface/tokenizers'
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

test('install conecta la bóveda y activa los hooks de Graphify', async () => {
  const temp = makeTempDir('alvaress-install-vault-');
  try {
    const root = path.join(temp.path, 'project');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
    fs.mkdirSync(path.join(root, '.git'));
    const vault = path.join(temp.path, 'vault');

    const calls: string[] = [];
    let vaultConnections = 0;

    const runtime: Partial<InstallRuntime> = {
      commandExists: () => true,
      moduleAvailable: () => true,
      ensureLayaBundle: async ({ dir }) => dir,
      runCommand: async (command, args = []) => {
        calls.push([command, ...args].join(' '));
        return result(0);
      },
      loadConfig: () =>
        mergeConfig({ vaultPath: vault, laya: { enabled: false } }, {}),
      getConfigPaths: () => ({
        global: path.join(temp.path, 'global.json'),
        local: path.join(root, '.alvaressrc.json')
      }),
      saveGlobalConfig: () => undefined,
      connectVault: () => {
        vaultConnections += 1;
        return {
          vaultPath: vault,
          harnessDir: path.join(vault, 'Harness'),
          tasksLink: path.join(vault, 'Harness', 'Tasks'),
          tasksLinkResult: 'created',
          notePath: path.join(vault, 'Harness', 'demo.md')
        };
      },
      installSkills: () => ({ skillsDir: path.join(root, '.harness', 'skills'), files: [], links: [] }),
      installAgent: () => ({ name: 'alvaress', files: [], subagents: [] }),
      installUv: async () => result(0)
    };

    await runInstall(root, { yes: true, runtime });

    assert.equal(vaultConnections, 1);
    assert.ok(calls.includes('graphify hook install'), calls.join('\n'));
  } finally {
    temp.cleanup();
  }
});
