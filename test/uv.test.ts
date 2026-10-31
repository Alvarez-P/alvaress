import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  ensureUvPath,
  installUv,
  uvInstallHint,
  uvInstallPlan,
  uvToolInstallArgs,
  uvUserBinDirs
} from '../src/utils/uv.js';

test('uvInstallPlan prefiere brew en macOS', () => {
  const plan = uvInstallPlan('darwin', (command) => command === 'brew' || command === 'curl');
  assert.deepEqual(plan, { command: 'brew', args: ['install', 'uv'], shell: false });
});

test('uvInstallPlan usa el instalador oficial cuando macOS no tiene brew', () => {
  const plan = uvInstallPlan('darwin', (command) => command === 'curl');
  assert.deepEqual(plan, {
    command: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
    args: [],
    shell: true
  });
});

test('uvInstallPlan usa el instalador oficial en Linux', () => {
  const plan = uvInstallPlan('linux', (command) => command === 'curl');
  assert.deepEqual(plan, {
    command: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
    args: [],
    shell: true
  });
});

test('uvInstallPlan cae a wget y luego a python3 en Linux', () => {
  assert.deepEqual(uvInstallPlan('linux', (command) => command === 'wget'), {
    command: 'wget -qO- https://astral.sh/uv/install.sh | sh',
    args: [],
    shell: true
  });
  assert.deepEqual(uvInstallPlan('linux', (command) => command === 'python3'), {
    command: 'python3 -m pip install --user uv',
    args: [],
    shell: true
  });
});

test('uvInstallPlan usa PowerShell en Windows', () => {
  const plan = uvInstallPlan('win32', (command) => command === 'powershell');
  assert.equal(plan?.shell, true);
  assert.match(plan?.command ?? '', /astral\.sh\/uv\/install\.ps1/);
});

test('uvInstallPlan devuelve undefined sin alternativas', () => {
  assert.equal(uvInstallPlan('linux', () => false), undefined);
  assert.equal(uvInstallPlan('win32', () => false), undefined);
  assert.equal(uvInstallPlan('aix', () => true), undefined);
});

test('ensureUvPath añade el directorio de uv al PATH sin duplicarlo', () => {
  const homedir = path.join('/home', 'demo');
  const binDir = path.join(homedir, '.local', 'bin');
  const env: NodeJS.ProcessEnv = { PATH: '/usr/bin' };
  const additions = ensureUvPath('linux', homedir, env);
  assert.deepEqual(additions, [binDir]);
  assert.equal(env.PATH, `${binDir}:/usr/bin`);

  assert.deepEqual(ensureUvPath('linux', homedir, env), []);
  assert.equal(env.PATH, `${binDir}:/usr/bin`);
});

test('uvUserBinDirs incluye Scripts de APPDATA en Windows', () => {
  const dirs = uvUserBinDirs('win32', 'C:\\Users\\demo', {
    APPDATA: 'C:\\Users\\demo\\AppData\\Roaming'
  });
  assert.deepEqual(dirs, [
    path.join('C:\\Users\\demo\\AppData\\Roaming', 'Python', 'Scripts'),
    path.join('C:\\Users\\demo', '.local', 'bin')
  ]);
});

test('uvToolInstallArgs instala la herramienta en un entorno aislado', () => {
  assert.deepEqual(uvToolInstallArgs('graphifyy'), ['tool', 'install', 'graphifyy']);
});

test('uvInstallHint siempre propone una vía de instalación', () => {
  assert.ok(uvInstallHint().includes('uv'));
});

test('installUv ejecuta la línea completa cuando el plan usa shell', async () => {
  let executed = '';
  const result = await installUv({
    platform: 'linux',
    hasCommand: (command) => command === 'curl',
    runShell: (command) => {
      executed = command;
      return { code: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.code, 0);
  assert.equal(executed, 'curl -LsSf https://astral.sh/uv/install.sh | sh');
});

test('installUv ejecuta el comando sin shell cuando el plan lo permite', async () => {
  const calls: string[] = [];
  const result = await installUv({
    platform: 'darwin',
    hasCommand: (command) => command === 'brew',
    run: async (command, args) => {
      calls.push([command, ...args].join(' '));
      return { code: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.code, 0);
  assert.deepEqual(calls, ['brew install uv']);
});
