import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { commandExists, runCommand } from './process.js';
import type { CommandResult, RunOptions } from './process.js';

export interface UvInstallPlan {
  command: string;
  args: string[];
  shell: boolean;
}

export interface UvInstallDeps {
  platform?: NodeJS.Platform;
  hasCommand?: (command: string) => boolean;
  run?: (command: string, args: string[], options?: RunOptions) => Promise<CommandResult>;
  runShell?: (command: string, options?: RunOptions) => CommandResult;
}

const UV_INSTALL_SH = 'curl -LsSf https://astral.sh/uv/install.sh | sh';
const UV_INSTALL_SH_WGET = 'wget -qO- https://astral.sh/uv/install.sh | sh';
const UV_INSTALL_PS1 =
  'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"';

function shellPlan(command: string): UvInstallPlan {
  return { command, args: [], shell: true };
}

export function uvInstallPlan(
  platform: NodeJS.Platform = process.platform,
  hasCommand: (command: string) => boolean = commandExists
): UvInstallPlan | undefined {
  if (platform === 'darwin') {
    if (hasCommand('brew')) {
      return { command: 'brew', args: ['install', 'uv'], shell: false };
    }
    if (hasCommand('curl')) {
      return shellPlan(UV_INSTALL_SH);
    }
    if (hasCommand('python3')) {
      return shellPlan('python3 -m pip install --user uv');
    }
    return undefined;
  }

  if (platform === 'win32') {
    if (hasCommand('powershell')) {
      return shellPlan(UV_INSTALL_PS1);
    }
    if (hasCommand('py')) {
      return shellPlan('py -m pip install --user uv');
    }
    if (hasCommand('python')) {
      return shellPlan('python -m pip install --user uv');
    }
    return undefined;
  }

  if (platform === 'linux') {
    if (hasCommand('curl')) {
      return shellPlan(UV_INSTALL_SH);
    }
    if (hasCommand('wget')) {
      return shellPlan(UV_INSTALL_SH_WGET);
    }
    if (hasCommand('python3')) {
      return shellPlan('python3 -m pip install --user uv');
    }
    return undefined;
  }

  return undefined;
}

export async function installUv(deps: UvInstallDeps = {}): Promise<CommandResult> {
  const plan = uvInstallPlan(deps.platform, deps.hasCommand);
  if (plan === undefined) {
    return { code: 1, stdout: '', stderr: '', error: uvInstallHint() };
  }

  const timeout = 15 * 60 * 1000;
  if (plan.shell) {
    const commandLine = [plan.command, ...plan.args].join(' ');
    if (deps.runShell !== undefined) {
      return deps.runShell(commandLine, { timeout });
    }
    const result = spawnSync(commandLine, {
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

export function uvUserBinDirs(
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

export function ensureUvPath(
  platform: NodeJS.Platform = process.platform,
  homedir: string = os.homedir(),
  env: NodeJS.ProcessEnv = process.env
): string[] {
  const current = (env.PATH ?? '').split(path.delimiter).filter((entry) => entry.length > 0);
  const additions = uvUserBinDirs(platform, homedir, env).filter(
    (directory) => !current.includes(directory)
  );
  if (additions.length > 0) {
    env.PATH = [...additions, ...current].join(path.delimiter);
  }
  return additions;
}

export function uvToolInstallArgs(packageName: string): string[] {
  return ['tool', 'install', packageName];
}

export function uvInstallHint(): string {
  if (process.platform === 'darwin') {
    return 'Instala uv con "brew install uv" o "curl -LsSf https://astral.sh/uv/install.sh | sh".';
  }
  if (process.platform === 'win32') {
    return 'Instala uv con "powershell -c \\"irm https://astral.sh/uv/install.ps1 | iex\\"".';
  }
  return 'Instala uv con "curl -LsSf https://astral.sh/uv/install.sh | sh" o "python3 -m pip install --user uv".';
}
