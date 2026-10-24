import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { commandExists, runCommand } from './process.js';
import type { CommandResult, RunOptions } from './process.js';

export interface PipxInstallPlan {
  command: string;
  args: string[];
  shell: boolean;
}

export interface PipxInstallDeps {
  platform?: NodeJS.Platform;
  hasCommand?: (command: string) => boolean;
  run?: (command: string, args: string[], options?: RunOptions) => Promise<CommandResult>;
  runShell?: (command: string, options?: RunOptions) => CommandResult;
}

function withSudo(
  command: string,
  args: string[],
  hasCommand: (value: string) => boolean
): PipxInstallPlan {
  const prefix = hasCommand('sudo') ? 'sudo ' : '';
  return { command: `${prefix}${command}`, args, shell: true };
}

export function pipxInstallPlan(
  platform: NodeJS.Platform = process.platform,
  hasCommand: (command: string) => boolean = commandExists
): PipxInstallPlan | undefined {
  if (platform === 'darwin') {
    if (hasCommand('brew')) {
      return { command: 'brew', args: ['install', 'pipx'], shell: false };
    }
    if (hasCommand('python3')) {
      return { command: 'python3 -m pip install --user pipx', args: [], shell: true };
    }
    return undefined;
  }

  if (platform === 'win32') {
    if (hasCommand('py')) {
      return { command: 'py -m pip install --user pipx', args: [], shell: true };
    }
    if (hasCommand('python')) {
      return { command: 'python -m pip install --user pipx', args: [], shell: true };
    }
    return undefined;
  }

  if (platform === 'linux') {
    if (hasCommand('apt-get')) {
      return withSudo('apt-get', ['install', '-y', 'pipx'], hasCommand);
    }
    if (hasCommand('dnf')) {
      return withSudo('dnf', ['install', '-y', 'pipx'], hasCommand);
    }
    if (hasCommand('pacman')) {
      return withSudo('pacman', ['-S', '--noconfirm', 'pipx'], hasCommand);
    }
    if (hasCommand('zypper')) {
      return withSudo('zypper', ['install', '-y', 'pipx'], hasCommand);
    }
    if (hasCommand('apk')) {
      return withSudo('apk', ['add', 'pipx'], hasCommand);
    }
    if (hasCommand('python3')) {
      return { command: 'python3 -m pip install --user pipx', args: [], shell: true };
    }
    return undefined;
  }

  return undefined;
}

export async function installPipx(deps: PipxInstallDeps = {}): Promise<CommandResult> {
  const plan = pipxInstallPlan(deps.platform, deps.hasCommand);
  if (plan === undefined) {
    return { code: 1, stdout: '', stderr: '', error: pipxInstallHint() };
  }

  const timeout = 15 * 60 * 1000;
  if (plan.shell) {
    if (deps.runShell !== undefined) {
      return deps.runShell(plan.command, { timeout });
    }
    const result = spawnSync(plan.command, {
      shell: true,
      stdio: 'inherit',
      timeout
    });
    return {
      code: result.status ?? 1,
      stdout: '',
      stderr: '',
      error: result.error ? result.error.message : undefined
    };
  }
  const run = deps.run ?? runCommand;
  return run(plan.command, plan.args, { timeout });
}

export function pipxUserBinDirs(
  platform: NodeJS.Platform = process.platform,
  homedir: string = os.homedir(),
  env: NodeJS.ProcessEnv = process.env
): string[] {
  const dirs = [path.join(homedir, '.local', 'bin')];
  if (platform === 'win32' && env.APPDATA !== undefined) {
    dirs.unshift(path.join(env.APPDATA, 'Python', 'Scripts'));
  }
  return dirs;
}

export function ensurePipxPath(
  platform: NodeJS.Platform = process.platform,
  homedir: string = os.homedir(),
  env: NodeJS.ProcessEnv = process.env
): string[] {
  const current = (env.PATH ?? '').split(path.delimiter).filter((entry) => entry.length > 0);
  const additions = pipxUserBinDirs(platform, homedir, env).filter(
    (directory) => !current.includes(directory)
  );
  if (additions.length > 0) {
    env.PATH = [...additions, ...current].join(path.delimiter);
  }
  return additions;
}

export function pipxInstallHint(): string {
  if (process.platform === 'darwin') {
    return 'Instala pipx con "brew install pipx" o "python3 -m pip install --user pipx".';
  }
  if (process.platform === 'win32') {
    return 'Instala pipx con "py -m pip install --user pipx".';
  }
  return 'Instala pipx con el gestor de tu distro o "python3 -m pip install --user pipx".';
}
