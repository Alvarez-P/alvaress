import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  detectObsidian,
  ensureObsidian,
  installObsidian
} from '../src/obsidian/installer.js';
import type { ObsidianInstallerDeps } from '../src/obsidian/installer.js';
import { makeTempDir, writeFile } from './helpers.js';

function fakeRelease(version = '1.14.5') {
  return {
    tag_name: `v${version}`,
    assets: [
      {
        name: `obsidian-${version}.tar.gz`,
        browser_download_url: `https://example.com/obsidian-${version}.tar.gz`
      }
    ]
  };
}

test('detectObsidian detecta el binario en el PATH', () => {
  const status = detectObsidian({
    platform: 'linux',
    homedir: '/home/demo',
    commandExists: (command) => command === 'obsidian',
    pathExists: () => false
  });

  assert.equal(status.installed, true);
  assert.equal(status.method, 'binary');
});

test('detectObsidian detecta una instalación Linux por escritorio y Flatpak', () => {
  const desktop = detectObsidian({
    platform: 'linux',
    homedir: '/home/demo',
    commandExists: () => false,
    pathExists: (target) => target === '/usr/share/applications/md.obsidian.Obsidian.desktop'
  });
  assert.equal(desktop.installed, true);
  assert.equal(desktop.method, 'desktop');

  const flatpak = detectObsidian({
    platform: 'linux',
    homedir: '/home/demo',
    commandExists: () => false,
    pathExists: (target) => target === '/var/lib/flatpak/app/md.obsidian.Obsidian'
  });
  assert.equal(flatpak.installed, true);
  assert.equal(flatpak.method, 'flatpak');
});

test('detectObsidian devuelve false cuando no hay instalación', () => {
  const status = detectObsidian({
    platform: 'linux',
    homedir: '/home/demo',
    commandExists: () => false,
    pathExists: () => false
  });

  assert.equal(status.installed, false);
  assert.equal(status.method, undefined);
});

test('detectObsidian detecta macOS y Windows', () => {
  const mac = detectObsidian({
    platform: 'darwin',
    homedir: '/Users/demo',
    commandExists: () => false,
    pathExists: (target) => target === '/Applications/Obsidian.app'
  });
  assert.equal(mac.installed, true);
  assert.equal(mac.method, 'macos');

  const windows = detectObsidian({
    platform: 'win32',
    homedir: 'C:\\Users\\demo',
    env: { LOCALAPPDATA: 'C:\\Users\\demo\\AppData\\Local' },
    commandExists: () => false,
    pathExists: (target) => target.includes('Obsidian.exe')
  });
  assert.equal(windows.installed, true);
  assert.equal(windows.method, 'windows');
});

test('installObsidian usa Flatpak cuando está disponible', async () => {
  const calls: string[][] = [];
  const result = await installObsidian({
    platform: 'linux',
    homedir: '/home/demo',
    commandExists: (command) => command === 'flatpak',
    runCommand: async (command, args = []) => {
      calls.push([command, ...args]);
      return { code: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.installed, true);
  assert.equal(result.method, 'flatpak');
  assert.ok(calls.some((call) => call.includes('remote-add')));
  assert.ok(calls.some((call) => call.includes('md.obsidian.Obsidian')));
});

test('installObsidian descarga y extrae el tar.gz local', async () => {
  const temp = makeTempDir('alvaress-obsidian-');
  const home = path.join(temp.path, 'home');
  fs.mkdirSync(home);

  const deps: ObsidianInstallerDeps = {
    platform: 'linux',
    arch: 'x64',
    homedir: home,
    commandExists: (command) => command === 'tar',
    fetchImpl: async () => new Response(JSON.stringify(fakeRelease()), { status: 200 }),
    downloadFile: async (_url, target) => {
      writeFile(target, 'archivo-falso');
    },
    runCommand: async (command, args = []) => {
      if (command === 'tar') {
        const index = args.indexOf('-C');
        const destination = args[index + 1] ?? '';
        writeFile(path.join(destination, 'obsidian'), '#!/bin/sh\n');
      }
      return { code: 0, stdout: '', stderr: '' };
    }
  };

  try {
    const result = await installObsidian(deps);

    assert.equal(result.installed, true);
    assert.equal(result.method, 'tarball');
    const wrapper = path.join(home, '.local', 'bin', 'obsidian');
    assert.ok(fs.existsSync(wrapper));
    assert.match(fs.readFileSync(wrapper, 'utf-8'), /--no-sandbox/);
  } finally {
    temp.cleanup();
  }
});

test('installObsidian no lanza si falla la descarga', async () => {
  const temp = makeTempDir('alvaress-obsidian-');
  try {
    const result = await installObsidian({
      platform: 'linux',
      homedir: temp.path,
      commandExists: (command) => command === 'tar',
      fetchImpl: async () => {
        throw new Error('sin conexión');
      }
    });

    assert.equal(result.installed, false);
    assert.match(result.message, /sin conexión/);
    assert.match(result.message, /obsidian\.md\/download/);
  } finally {
    temp.cleanup();
  }
});

test('ensureObsidian no reinstala si ya está detectado', async () => {
  let invoked = false;
  const result = await ensureObsidian({
    platform: 'linux',
    homedir: '/home/demo',
    commandExists: (command) => command === 'obsidian',
    runCommand: async () => {
      invoked = true;
      return { code: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.installed, true);
  assert.equal(result.method, 'binary');
  assert.equal(invoked, false);
});
