import type { HarnessConfig } from '../config/loader.js';
import { DEFAULT_PACKAGE_MANAGER } from '../constants.js';
import { commandExists } from './process.js';

export type PackageManager = 'pnpm' | 'npm';

export function resolvePackageManager(config: HarnessConfig): PackageManager {
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

export function defaultValidationCommands(manager: PackageManager): string[] {
  return [
    packageManagerExec(manager, 'oxlint', ['--deny=correctness', '--deny=suspicious']),
    packageManagerExec(manager, 'tsc', ['--noEmit'])
  ];
}
