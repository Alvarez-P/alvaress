import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  ensurePipxPath,
  installPipx,
  pipxInstallHint,
  pipxInstallPlan,
  pipxUserBinDirs
} from '../src/utils/pipx.js';

test('pipxInstallPlan prefiere brew en macOS', () => {
  const plan = pipxInstallPlan('darwin', (command) => command === 'brew' || command === 'python3');
  assert.deepEqual(plan, { command: 'brew', args: ['install', 'pipx'], shell: false });
});

test('pipxInstallPlan usa python3 cuando macOS no tiene brew', () => {
  const plan = pipxInstallPlan('darwin', (command) => command === 'python3');
  assert.deepEqual(plan, {
    command: 'python3 -m pip install --user pipx',
    args: [],
    shell: true
  });
});

test('pipxInstallPlan usa el gestor de la distro con sudo si existe', () => {
  const plan = pipxInstallPlan('linux', (command) => command === 'sudo' || command === 'apt-get');
  assert.deepEqual(plan, {
    command: 'sudo apt-get',
    args: ['install', '-y', 'pipx'],
    shell: true
  });
});

test('pipxInstallPlan cae a python3 en Linux sin gestor de paquetes', () => {
  const plan = pipxInstallPlan('linux', (command) => command === 'python3');
  assert.deepEqual(plan, {
    command: 'python3 -m pip install --user pipx',
    args: [],
    shell: true
  });
});

test('pipxInstallPlan devuelve undefined sin alternativas', () => {
  assert.equal(pipxInstallPlan('linux', () => false), undefined);
  assert.equal(pipxInstallPlan('win32', () => false), undefined);
  assert.equal(pipxInstallPlan('aix', () => true), undefined);
});

test('ensurePipxPath añade el directorio de pipx al PATH sin duplicarlo', () => {
  const homedir = path.join('/home', 'demo');
  const binDir = path.join(homedir, '.local', 'bin');
  const env: NodeJS.ProcessEnv = { PATH: '/usr/bin' };
  const additions = ensurePipxPath('linux', homedir, env);
  assert.deepEqual(additions, [binDir]);
  assert.equal(env.PATH, `${binDir}:/usr/bin`);

  assert.deepEqual(ensurePipxPath('linux', homedir, env), []);
  assert.equal(env.PATH, `${binDir}:/usr/bin`);
});

test('pipxUserBinDirs incluye Scripts de APPDATA en Windows', () => {
  const dirs = pipxUserBinDirs('win32', 'C:\\Users\\demo', { APPDATA: 'C:\\Users\\demo\\AppData\\Roaming' });
  assert.deepEqual(dirs, [
    path.join('C:\\Users\\demo\\AppData\\Roaming', 'Python', 'Scripts'),
    path.join('C:\\Users\\demo', '.local', 'bin')
  ]);
});

test('pipxInstallHint siempre propone una vía de instalación', () => {
  assert.ok(pipxInstallHint().includes('pipx'));
});

test('installPipx ejecuta la línea completa cuando el plan usa shell', async () => {
  let executed = '';
  const result = await installPipx({
    platform: 'linux',
    hasCommand: (command) => command === 'sudo' || command === 'apt-get',
    runShell: (command) => {
      executed = command;
      return { code: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.code, 0);
  assert.equal(executed, 'sudo apt-get install -y pipx');
});

test('installPipx ejecuta el comando sin shell cuando el plan lo permite', async () => {
  const calls: string[] = [];
  const result = await installPipx({
    platform: 'darwin',
    hasCommand: (command) => command === 'brew',
    run: async (command, args) => {
      calls.push([command, ...args].join(' '));
      return { code: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.code, 0);
  assert.deepEqual(calls, ['brew install pipx']);
});
