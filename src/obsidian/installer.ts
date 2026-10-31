import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { errorMessage } from '../utils/errors.js';
import { ensureDir, pathExists, writeTextFile } from '../utils/fs.js';
import { commandExists, runCommand } from '../utils/process.js';
import type { CommandResult, RunOptions } from '../utils/process.js';

const RELEASE_API = 'https://api.github.com/repos/obsidianmd/obsidian-releases/releases/latest';
/** Página oficial de descarga; la app es opcional y el usuario la instala a mano. */
export const OBSIDIAN_DOWNLOAD_URL = 'https://obsidian.md/download';

export type ObsidianInstallMethod =
  | 'binary'
  | 'flatpak'
  | 'snap'
  | 'desktop'
  | 'appimage'
  | 'tarball'
  | 'macos'
  | 'windows';

export interface ObsidianStatus {
  installed: boolean;
  method?: ObsidianInstallMethod;
  path?: string;
}

export interface ObsidianInstallResult extends ObsidianStatus {
  message: string;
}

export interface ObsidianInstallerDeps {
  platform?: NodeJS.Platform;
  arch?: string;
  homedir?: string;
  env?: NodeJS.ProcessEnv;
  commandExists?: (command: string) => boolean;
  pathExists?: (target: string) => boolean;
  runCommand?: (command: string, args?: string[], options?: RunOptions) => Promise<CommandResult>;
  fetchImpl?: typeof fetch;
  downloadFile?: (url: string, target: string) => Promise<void>;
}

interface ReleaseAsset {
  name: string;
  url: string;
}

interface ReleaseInfo {
  version: string;
  assets: ReleaseAsset[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRelease(value: unknown): ReleaseInfo {
  if (!isRecord(value) || typeof value.tag_name !== 'string' || !Array.isArray(value.assets)) {
    throw new Error('GitHub devolvió una release inválida.');
  }
  const assets: ReleaseAsset[] = [];
  for (const entry of value.assets) {
    if (!isRecord(entry) || typeof entry.name !== 'string' || typeof entry.browser_download_url !== 'string') {
      continue;
    }
    assets.push({ name: entry.name, url: entry.browser_download_url });
  }
  return { version: value.tag_name.replace(/^v/, ''), assets };
}

async function fetchRelease(fetchImpl: typeof fetch): Promise<ReleaseInfo> {
  const response = await fetchImpl(RELEASE_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'alvaress'
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub respondió HTTP ${response.status}.`);
  }
  return parseRelease(await response.json());
}

async function downloadFile(url: string, target: string): Promise<void> {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`La descarga respondió HTTP ${response.status}.`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  ensureDir(path.dirname(target));
  await fs.promises.writeFile(target, buffer, { mode: 0o755 });
}

function matchesArch(name: string, arch: string): boolean {
  const lower = name.toLowerCase();
  if (arch === 'arm64') {
    return lower.includes('arm64');
  }
  if (arch === 'x64' || arch === 'amd64') {
    return !lower.includes('arm64');
  }
  return false;
}

function pickAsset(
  release: ReleaseInfo,
  extension: string,
  arch: string
): ReleaseAsset | undefined {
  const candidates = release.assets.filter((asset) => asset.name.endsWith(extension));
  if (extension === '.tar.gz') {
    return candidates.find((asset) => matchesArch(asset.name, arch));
  }
  return candidates[0];
}

function linuxDesktopPaths(home: string): string[] {
  return [
    '/usr/share/applications/md.obsidian.Obsidian.desktop',
    '/usr/share/applications/obsidian.desktop',
    '/var/lib/flatpak/exports/share/applications/md.obsidian.Obsidian.desktop',
    path.join(home, '.local', 'share', 'applications', 'md.obsidian.Obsidian.desktop'),
    path.join(home, '.local', 'share', 'applications', 'obsidian.desktop'),
    path.join(home, '.local', 'share', 'flatpak', 'exports', 'share', 'applications', 'md.obsidian.Obsidian.desktop')
  ];
}

function linuxFlatpakPaths(home: string): string[] {
  return [
    '/var/lib/flatpak/app/md.obsidian.Obsidian',
    path.join(home, '.local', 'share', 'flatpak', 'app', 'md.obsidian.Obsidian')
  ];
}

function linuxBinaryPaths(home: string): string[] {
  return [
    path.join(home, '.local', 'bin', 'obsidian'),
    '/usr/bin/obsidian',
    '/opt/Obsidian/obsidian',
    path.join(home, 'Applications', 'Obsidian.AppImage')
  ];
}

function windowsPaths(env: NodeJS.ProcessEnv): string[] {
  const candidates = [
    env.LOCALAPPDATA === undefined ? undefined : path.join(env.LOCALAPPDATA, 'Obsidian', 'Obsidian.exe'),
    env.LOCALAPPDATA === undefined
      ? undefined
      : path.join(env.LOCALAPPDATA, 'Programs', 'obsidian', 'Obsidian.exe'),
    env.PROGRAMFILES === undefined ? undefined : path.join(env.PROGRAMFILES, 'Obsidian', 'Obsidian.exe'),
    env['PROGRAMFILES(X86)'] === undefined
      ? undefined
      : path.join(env['PROGRAMFILES(X86)'], 'Obsidian', 'Obsidian.exe')
  ];
  return candidates.filter((candidate): candidate is string => candidate !== undefined);
}

export function detectObsidian(deps: ObsidianInstallerDeps = {}): ObsidianStatus {
  const platform = deps.platform ?? process.platform;
  const home = deps.homedir ?? os.homedir();
  const env = deps.env ?? process.env;
  const hasCommand = deps.commandExists ?? commandExists;
  const exists = deps.pathExists ?? pathExists;

  if (hasCommand('obsidian')) {
    return { installed: true, method: 'binary', path: 'obsidian' };
  }

  if (platform === 'darwin') {
    for (const candidate of [
      '/Applications/Obsidian.app',
      path.join(home, 'Applications', 'Obsidian.app')
    ]) {
      if (exists(candidate)) {
        return { installed: true, method: 'macos', path: candidate };
      }
    }
    return { installed: false };
  }

  if (platform === 'win32') {
    for (const candidate of windowsPaths(env)) {
      if (exists(candidate)) {
        return { installed: true, method: 'windows', path: candidate };
      }
    }
    return { installed: false };
  }

  if (platform === 'linux') {
    for (const candidate of linuxDesktopPaths(home)) {
      if (exists(candidate)) {
        return { installed: true, method: 'desktop', path: candidate };
      }
    }
    for (const candidate of linuxFlatpakPaths(home)) {
      if (exists(candidate)) {
        return { installed: true, method: 'flatpak', path: candidate };
      }
    }
    for (const candidate of linuxBinaryPaths(home)) {
      if (exists(candidate)) {
        return {
          installed: true,
          method: candidate.endsWith('.AppImage') ? 'appimage' : 'binary',
          path: candidate
        };
      }
    }
    if (exists('/snap/obsidian')) {
      return { installed: true, method: 'snap', path: '/snap/obsidian' };
    }
  }

  return { installed: false };
}

function manualMessage(detail: string): string {
  return `${detail} Instálalo manualmente desde ${OBSIDIAN_DOWNLOAD_URL}.`;
}

async function installLinux(deps: ObsidianInstallerDeps): Promise<ObsidianInstallResult> {
  const hasCommand = deps.commandExists ?? commandExists;
  const run = deps.runCommand ?? runCommand;

  if (hasCommand('flatpak')) {
    await run('flatpak', [
      'remote-add',
      '--user',
      '--if-not-exists',
      'flathub',
      'https://flathub.org/repo/flathub.flatpakrepo'
    ]);
    const install = await run('flatpak', ['install', '--user', '-y', 'flathub', 'md.obsidian.Obsidian']);
    if (install.code === 0) {
      return {
        installed: true,
        method: 'flatpak',
        message: 'Obsidian instalado con Flatpak.'
      };
    }
  }

  return installLinuxTarball(deps);
}

async function installLinuxTarball(deps: ObsidianInstallerDeps): Promise<ObsidianInstallResult> {
  const home = deps.homedir ?? os.homedir();
  const arch = deps.arch ?? process.arch;
  const hasCommand = deps.commandExists ?? commandExists;
  const exists = deps.pathExists ?? pathExists;
  const run = deps.runCommand ?? runCommand;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const download = deps.downloadFile ?? downloadFile;

  if (!hasCommand('tar')) {
    return {
      installed: false,
      message: manualMessage('No se encontró tar para extraer el paquete de Obsidian.')
    };
  }

  const release = await fetchRelease(fetchImpl);
  const asset = pickAsset(release, '.tar.gz', arch);
  if (asset === undefined) {
    return {
      installed: false,
      message: manualMessage(`No hay un paquete de Obsidian compatible con ${arch}.`)
    };
  }

  const cacheDir = path.join(home, '.cache', 'alvaress', 'obsidian');
  const archive = path.join(cacheDir, asset.name);
  await download(asset.url, archive);

  const installDir = path.join(home, '.local', 'opt', 'obsidian', release.version);
  ensureDir(installDir);
  const extract = await run('tar', ['-xzf', archive, '-C', installDir, '--strip-components=1']);
  if (extract.code !== 0) {
    return {
      installed: false,
      message: manualMessage(
        `No se pudo extraer Obsidian: ${extract.stderr.trim() || extract.error || 'error desconocido'}.`
      )
    };
  }

  const binary = path.join(installDir, 'obsidian');
  if (!exists(binary)) {
    return {
      installed: false,
      message: manualMessage('El paquete de Obsidian no contiene el ejecutable esperado.')
    };
  }

  const wrapper = path.join(home, '.local', 'bin', 'obsidian');
  writeTextFile(wrapper, `#!/bin/sh\nexec "${binary}" --no-sandbox "$@"\n`);
  fs.chmodSync(wrapper, 0o755);

  return {
    installed: true,
    method: 'tarball',
    path: wrapper,
    message: `Obsidian ${release.version} instalado en ${wrapper}.`
  };
}

async function installMac(deps: ObsidianInstallerDeps): Promise<ObsidianInstallResult> {
  const home = deps.homedir ?? os.homedir();
  const arch = deps.arch ?? process.arch;
  const hasCommand = deps.commandExists ?? commandExists;
  const run = deps.runCommand ?? runCommand;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const download = deps.downloadFile ?? downloadFile;

  if (hasCommand('brew')) {
    const brew = await run('brew', ['install', '--cask', 'obsidian']);
    if (brew.code === 0) {
      return {
        installed: true,
        method: 'macos',
        message: 'Obsidian instalado con Homebrew.'
      };
    }
  }

  if (!hasCommand('hdiutil')) {
    return {
      installed: false,
      message: manualMessage('No se encontró hdiutil para montar el DMG de Obsidian.')
    };
  }

  const release = await fetchRelease(fetchImpl);
  const asset = pickAsset(release, '.dmg', arch);
  if (asset === undefined) {
    return {
      installed: false,
      message: manualMessage(`No hay un DMG de Obsidian compatible con ${arch}.`)
    };
  }

  const cacheDir = path.join(home, '.cache', 'alvaress', 'obsidian');
  const dmg = path.join(cacheDir, asset.name);
  const mount = path.join(cacheDir, 'mount');
  await download(asset.url, dmg);
  ensureDir(mount);

  const attach = await run('hdiutil', ['attach', dmg, '-nobrowse', '-noautoopen', '-mountpoint', mount]);
  if (attach.code !== 0) {
    return {
      installed: false,
      message: manualMessage('No se pudo montar el DMG de Obsidian.')
    };
  }

  const appsDir = path.join(home, 'Applications');
  ensureDir(appsDir);
  const target = path.join(appsDir, 'Obsidian.app');
  const copy = await run('cp', ['-R', path.join(mount, 'Obsidian.app'), target]);
  await run('hdiutil', ['detach', mount]);

  if (copy.code !== 0) {
    return {
      installed: false,
      message: manualMessage('No se pudo copiar Obsidian.app a ~/Applications.')
    };
  }

  return {
    installed: true,
    method: 'macos',
    path: target,
    message: `Obsidian ${release.version} instalado en ${target}.`
  };
}

async function installWindows(deps: ObsidianInstallerDeps): Promise<ObsidianInstallResult> {
  const hasCommand = deps.commandExists ?? commandExists;
  const run = deps.runCommand ?? runCommand;

  if (!hasCommand('winget')) {
    return {
      installed: false,
      message: manualMessage('No se encontró winget para instalar Obsidian.')
    };
  }

  const result = await run('winget', [
    'install',
    '--id',
    'Obsidian.Obsidian',
    '-e',
    '--accept-source-agreements',
    '--accept-package-agreements'
  ]);
  if (result.code !== 0) {
    return {
      installed: false,
      message: manualMessage(
        `winget falló: ${result.stderr.trim() || result.error || 'error desconocido'}.`
      )
    };
  }

  return {
    installed: true,
    method: 'windows',
    message: 'Obsidian instalado con winget.'
  };
}

export async function installObsidian(
  deps: ObsidianInstallerDeps = {}
): Promise<ObsidianInstallResult> {
  const platform = deps.platform ?? process.platform;
  try {
    if (platform === 'linux') {
      return await installLinux(deps);
    }
    if (platform === 'darwin') {
      return await installMac(deps);
    }
    if (platform === 'win32') {
      return await installWindows(deps);
    }
    return {
      installed: false,
      message: manualMessage(`La instalación automática no está soportada en ${platform}.`)
    };
  } catch (error) {
    return {
      installed: false,
      message: manualMessage(`No se pudo instalar Obsidian: ${errorMessage(error)}.`)
    };
  }
}

export async function ensureObsidian(
  deps: ObsidianInstallerDeps = {}
): Promise<ObsidianInstallResult> {
  const status = detectObsidian(deps);
  if (status.installed) {
    return {
      ...status,
      message: `Obsidian ya está instalado (${status.method ?? 'detectado'}).`
    };
  }
  return installObsidian(deps);
}
