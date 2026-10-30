import type { HarnessConfig } from '../config/loader.js';
import { DEFAULT_PACKAGE_MANAGER } from '../constants.js';
import { commandExists } from './process.js';

export type PackageManager = 'pnpm' | 'npm';

export function resolvePackageManager(config: HarnessConfig): PackageManager {
  return config.packageManager ?? DEFAULT_PACKAGE_MANAGER;
}

/**
 * Gestor que usa el instalador para las dependencias Node.
 *
 * pnpm manda: se usa siempre que esté disponible, aunque el proyecto declare
 * npm. npm queda como fallback cuando pnpm no está en el PATH.
 */
export function resolveInstallerPackageManager(
  config: HarnessConfig,
  hasCommand: (command: string) => boolean = commandExists
): PackageManager {
  if (hasCommand('pnpm')) {
    return 'pnpm';
  }
  if (hasCommand('npm')) {
    return 'npm';
  }
  return config.packageManager ?? DEFAULT_PACKAGE_MANAGER;
}

export function packageManagerAvailable(manager: PackageManager): boolean {
  return commandExists(manager);
}

export function packageManagerInstallArgs(manager: PackageManager, packages: string[]): string[] {
  if (manager === 'pnpm') {
    return ['add', '-D', ...packages];
  }
  return ['install', '--save-dev', ...packages];
}

export function packageManagerRunScript(manager: PackageManager, script: string): string {
  return manager === 'pnpm' ? `pnpm run ${script}` : `npm run ${script}`;
}

export function packageManagerTest(manager: PackageManager): string {
  return manager === 'pnpm' ? 'pnpm test' : 'npm test';
}

export function packageManagerExec(manager: PackageManager, binary: string, args: string[] = []): string {
  const command = manager === 'pnpm' ? 'pnpm exec' : 'npx';
  return [command, binary, ...args].join(' ');
}

export function packageManagerDlx(manager: PackageManager, binary: string, args: string[] = []): string {
  const command = manager === 'pnpm' ? 'pnpm dlx' : 'npx';
  return [command, binary, ...args].join(' ');
}

export function defaultValidationCommands(
  manager: PackageManager,
  vitePlus?: { checkCommand: string; testCommand: string }
): string[] {
  if (vitePlus !== undefined) {
    return [
      localCommand(manager, vitePlus.checkCommand),
      localCommand(manager, vitePlus.testCommand)
    ];
  }
  return [packageManagerExec(manager, 'tsc', ['--noEmit'])];
}

function localCommand(manager: PackageManager, command: string): string {
  const parts = command.trim().split(/\s+/).filter((part) => part.length > 0);
  const [binary, ...args] = parts;
  if (binary === undefined) {
    return command;
  }
  if (binary === 'pnpm' || binary === 'npm' || binary === 'npx') {
    return command;
  }
  return packageManagerExec(manager, binary, args);
}
