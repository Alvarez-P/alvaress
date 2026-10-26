import path from 'node:path';
import { createRequire } from 'node:module';
import * as p from '@clack/prompts';
import { installAgent } from '../agent/installer.js';
import { loadConfig, getConfigPaths, saveGlobalConfig } from '../config/loader.js';
import type { HarnessConfig, HarnessConfigFile, PackageManager } from '../config/loader.js';
import {
  COMMAND_SEPARATOR,
  DEFAULT_LAYA_MODEL,
  DEFAULT_OBSIDIAN_VAULT,
  DEFAULT_PACKAGE_MANAGER,
  HARNESS_DIR,
  LAYA_TS_PACKAGE,
  VITE_PLUS_PACKAGE
} from '../constants.js';
import { detectObsidian, installObsidian } from '../obsidian/installer.js';
import { connectObsidianVault } from '../obsidian/vault.js';
import { ensureHarnessDirs, getManifestPath, inferProjectName, scaffoldManifest } from '../openspec/manifest.js';
import { installSkills } from '../skills/installer.js';
import { ensureDir, pathExists, relativeTo, writeJsonFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { runCommand } from '../utils/process.js';
import { commandExists } from '../utils/process.js';
import {
  packageManagerInstallArgs,
  resolvePackageManager
} from '../utils/package-manager.js';
import {
  ensurePipxPath,
  installPipx,
  pipxInstallHint,
  pipxInstallPlan
} from '../utils/pipx.js';
import { expandHome, joinCommandList, parseCommandList, unwrap } from '../utils/prompt.js';

const COMPONENT_VALUES = ['agent', 'laya', 'obsidian', 'graphify', 'vite-plus', 'aider', 'validation'] as const;
type Component = (typeof COMPONENT_VALUES)[number];

const REQUIRED_COMPONENTS: Component[] = [
  'agent',
  'laya',
  'obsidian',
  'graphify',
  'vite-plus',
  'validation'
];

const COMPONENTS: Array<{ value: Component; label: string; hint: string }> = [
  {
    value: 'agent',
    label: '🧭 Agente alvaress (OpenCode)',
    hint: 'instala el orquestador global y en el proyecto'
  },
  {
    value: 'laya',
    label: '🧠 laya-ts (motor de decisión local)',
    hint: 'routing ODD/SDD, riesgo y triaje de fallos en local'
  },
  {
    value: 'obsidian',
    label: '🗂️ Obsidian (Aplicación, Bóveda y Estructura)',
    hint: 'detecta o instala Obsidian y conecta la bóveda'
  },
  {
    value: 'graphify',
    label: '📊 Graphify (Mapeo AST local)',
    hint: 'instala graphify con pipx si falta'
  },
  {
    value: 'vite-plus',
    label: '⚡ Vite-Plus (vp check / vp test)',
    hint: 'instala vite-plus en el proyecto'
  },
  {
    value: 'aider',
    label: '🤖 Aider-Chat (opcional)',
    hint: 'si no se instala, el trabajo lo hacen los subagentes'
  },
  {
    value: 'validation',
    label: '🧪 Oxlint & TSC (fallback de validación)',
    hint: 'pnpm add -D oxlint typescript @types/node'
  }
];

function moduleAvailable(specifier: string): boolean {
  try {
    createRequire(import.meta.url).resolve(specifier);
    return true;
  } catch {
    return false;
  }
}

export interface InstallRuntime {
  commandExists: typeof commandExists;
  runCommand: typeof runCommand;
  moduleAvailable: (specifier: string) => boolean;
  loadConfig: typeof loadConfig;
  getConfigPaths: typeof getConfigPaths;
  saveGlobalConfig: typeof saveGlobalConfig;
  detectObsidian: typeof detectObsidian;
  installObsidian: typeof installObsidian;
  connectObsidianVault: typeof connectObsidianVault;
  installSkills: typeof installSkills;
  installAgent: typeof installAgent;
  installPipx: typeof installPipx;
}

const DEFAULT_RUNTIME: InstallRuntime = {
  commandExists,
  runCommand,
  moduleAvailable,
  loadConfig,
  getConfigPaths,
  saveGlobalConfig,
  detectObsidian,
  installObsidian,
  connectObsidianVault,
  installSkills,
  installAgent,
  installPipx
};

export interface InstallOptions {
  yes?: boolean;
  runtime?: Partial<InstallRuntime>;
}

export async function runInstall(
  root: string = process.cwd(),
  options: InstallOptions = {}
): Promise<void> {
  const runtime: InstallRuntime = { ...DEFAULT_RUNTIME, ...options.runtime };
  const yes = options.yes === true;

  p.intro('alvaress · instalador');

  ensureHarnessDirs(root);
  let config = runtime.loadConfig(root);
  const paths = runtime.getConfigPaths(root);

  const selected: Component[] = yes
    ? [...REQUIRED_COMPONENTS]
    : unwrap(
        await p.multiselect<Component>({
          message: 'Selecciona los componentes a instalar',
          options: COMPONENTS,
          initialValues: [...REQUIRED_COMPONENTS],
          required: false
        })
      );

  if (selected.length === 0) {
    p.log.warn('No seleccionaste componentes de sistema. Se configurará el proyecto igualmente.');
  }

  let obsidianVaultPath: string | undefined;
  let obsidianChanged = false;
  if (selected.includes('obsidian')) {
    await ensureObsidianInstalled(runtime);
    obsidianVaultPath = await configureObsidian(config.obsidianVaultPath, yes);
    if (obsidianVaultPath !== config.obsidianVaultPath) {
      config = { ...config, obsidianVaultPath };
      obsidianChanged = true;
    }
  }

  if (selected.includes('graphify')) {
    await installGraphify(runtime, yes);
  }

  if (selected.includes('aider') || config.aider?.enabled === true) {
    await installAider(runtime, yes);
  }

  if (selected.includes('vite-plus')) {
    await installVitePlus(root, config, runtime);
  }

  if (selected.includes('validation')) {
    await installValidationDependencies(root, config, runtime);
  }

  let layaChanged = false;
  if (selected.includes('laya')) {
    config = await configureLaya(config, yes, runtime);
    layaChanged = true;
  }

  if (!pathExists(paths.global)) {
    config = yes ? config : await promptFullConfig(config);
    runtime.saveGlobalConfig(config);
    p.log.success(`Configuración global creada en ${paths.global}`);
  } else if (layaChanged || obsidianChanged) {
    runtime.saveGlobalConfig(config);
    p.log.success('Configuración global actualizada.');
  } else {
    p.log.info(`Configuración global detectada en ${paths.global}`);
  }

  if (!yes && isRepository(root) && !pathExists(paths.local)) {
    const createLocal = unwrap(
      await p.confirm({
        message: '¿Crear .alvaressrc.json con overrides locales para este repositorio?',
        initialValue: false
      })
    );
    if (createLocal) {
      const overrides = await promptLocalOverrides(config);
      writeJsonFile(paths.local, overrides);
      p.log.success(`Configuración local creada en ${paths.local}`);
    }
  }

  if (isRepository(root) && !pathExists(getManifestPath(root))) {
    const createManifest = yes
      ? true
      : unwrap(
          await p.confirm({
            message: '¿Crear openspec.yaml con la estructura inicial del proyecto?',
            initialValue: true
          })
        );
    if (createManifest) {
      scaffoldManifest(root);
      p.log.success('openspec.yaml creado.');
    }
  }

  if (obsidianVaultPath !== undefined) {
    const connection = runtime.connectObsidianVault(root, obsidianVaultPath);
    p.log.success(`Bóveda conectada: ${connection.harnessDir}`);
    p.log.info(`Enlace de tareas: ${connection.tasksLink} (${connection.tasksLinkResult})`);
    if (connection.manifestLink !== undefined) {
      p.log.info(`Enlace del manifiesto: ${connection.manifestLink} (${connection.manifestLinkResult})`);
    }
  }

  const report = runtime.installSkills(root);
  p.log.success(`Skills del proyecto escritas en ${relativeTo(root, report.skillsDir)}`);

  const skipped = report.links.filter((link) => link.result === 'skipped');
  for (const link of skipped) {
    p.log.warn(`Se omitió el enlace ${link.link}: ya existe un archivo o directorio real.`);
  }
  const linked = report.links.length - skipped.length;
  p.log.info(`Enlaces globales de skills actualizados: ${linked}`);

  if (selected.includes('agent')) {
    const agent = runtime.installAgent(root, { global: true, project: true });
    for (const file of agent.files) {
      p.log.success(`Agente ${agent.name} instalado en ${file}`);
    }
    for (const file of agent.subagents) {
      p.log.success(`Subagente instalado en ${file}`);
    }
    p.log.info('En OpenCode, selecciona el agente "alvaress" con Tab o con --agent alvaress.');
  }

  const implementer = config.models.aiderImplementer;
  const hasImplementerKey =
    (implementer.apiKey ?? '').length > 0 ||
    Object.values(implementer.env ?? {}).some((value) => value.length > 0);
  if (config.aider?.enabled === true && yes && !hasImplementerKey) {
    p.log.warn(
      'Aider está habilitado pero no hay API key del implementador. Añádela en ~/.alvaressconfig.json o define DEEPSEEK_API_KEY.'
    );
  }

  p.note(
    [
      `Proyecto: ${inferProjectName(root)}`,
      `Directorio: ${path.join(root, HARNESS_DIR)}`,
      `Tareas: ${path.join(root, HARNESS_DIR, 'tasks')}`,
      'Siguiente paso: ejecuta "alvaress run \\"tu petición\\"" o define tareas en openspec.yaml y usa "alvaress apply".'
    ].join('\n'),
    'alvaress listo'
  );

  p.outro('Instalación completada.');
}

async function ensureObsidianInstalled(runtime: InstallRuntime): Promise<void> {
  const status = runtime.detectObsidian();
  if (status.installed) {
    p.log.success(`Obsidian detectado (${status.method ?? 'instalado'}).`);
    return;
  }

  const spinner = p.spinner();
  spinner.start('Obsidian no está instalado. Instalando Obsidian y sus dependencias');
  const result = await runtime.installObsidian();
  if (result.installed) {
    spinner.stop(result.message);
    return;
  }

  spinner.stop('No se pudo instalar Obsidian automáticamente.');
  p.log.warn(result.message);
  p.log.info('La bóveda se creará igualmente; puedes instalar Obsidian después desde https://obsidian.md/download.');
}

async function configureObsidian(currentVault: string, yes: boolean): Promise<string> {
  const suggested = currentVault.length > 0 ? currentVault : DEFAULT_OBSIDIAN_VAULT;
  const answer = yes
    ? suggested
    : unwrap(
        await p.text({
          message: 'Ruta de la bóveda Obsidian',
          placeholder: suggested,
          defaultValue: suggested,
          validate: validateWithDefault(suggested, 'La ruta de la bóveda es obligatoria.')
        })
      );

  const answerText = answer.trim().length > 0 ? answer.trim() : suggested;
  const vaultPath = path.resolve(expandHome(answerText));
  if (!pathExists(vaultPath)) {
    ensureDir(vaultPath);
    p.log.success(`Bóveda creada: ${vaultPath}`);
  } else {
    p.log.info(`Bóveda existente: ${vaultPath}`);
  }
  return vaultPath;
}

async function ensurePipx(runtime: InstallRuntime, yes: boolean): Promise<boolean> {
  if (runtime.commandExists('pipx')) {
    return true;
  }

  const plan = pipxInstallPlan(process.platform, runtime.commandExists);
  if (plan === undefined) {
    p.log.warn(`pipx no está disponible y hace falta para Aider y Graphify. ${pipxInstallHint()}`);
    return false;
  }

  const shouldInstall = yes
    ? true
    : unwrap(
        await p.confirm({
          message: 'pipx no está instalado y hace falta para Aider y Graphify. ¿Instalarlo ahora?',
          initialValue: true
        })
      );
  if (!shouldInstall) {
    p.log.warn(`Sin pipx no se pueden instalar Aider ni Graphify. ${pipxInstallHint()}`);
    return false;
  }

  const spinner = p.spinner();
  spinner.start('Instalando pipx');
  const result = await runtime.installPipx();
  if (result.code === 0) {
    ensurePipxPath();
    if (runtime.commandExists('pipx')) {
      spinner.stop('pipx instalado.');
      return true;
    }
  }

  spinner.stop('No se pudo instalar pipx automáticamente.');
  p.log.warn(result.error ?? result.stderr.trim() ?? 'Instalación cancelada.');
  p.log.info(pipxInstallHint());
  return false;
}

async function installGraphify(runtime: InstallRuntime, yes: boolean): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Comprobando Graphify');
  if (runtime.commandExists('graphify')) {
    spinner.stop('Graphify ya está instalado.');
    return;
  }
  spinner.stop('Graphify no está instalado.');
  if (!(await ensurePipx(runtime, yes))) {
    return;
  }
  const installSpinner = p.spinner();
  installSpinner.start('Instalando graphify con pipx');
  const result = await runtime.runCommand('pipx', ['install', 'graphifyy']);
  if (result.code !== 0) {
    installSpinner.error('No se pudo instalar Graphify.');
    p.log.warn(`pipx install graphifyy falló: ${result.stderr.trim() || result.stdout.trim() || result.error}`);
    return;
  }
  installSpinner.stop('Graphify instalado correctamente.');
}

async function installAider(runtime: InstallRuntime, yes: boolean): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Comprobando Aider');
  const version = await runtime.runCommand('aider', ['--version']);
  if (version.code === 0) {
    spinner.stop(`Aider ya está instalado: ${version.stdout.trim() || 'versión desconocida'}`);
    return;
  }
  spinner.stop('Aider no está instalado.');
  if (!(await ensurePipx(runtime, yes))) {
    return;
  }
  const installSpinner = p.spinner();
  installSpinner.start('Instalando aider-chat con pipx');
  const result = await runtime.runCommand('pipx', ['install', 'aider-chat']);
  if (result.code !== 0) {
    installSpinner.error('No se pudo instalar Aider.');
    p.log.warn(`pipx install aider-chat falló: ${result.stderr.trim() || result.stdout.trim() || result.error}`);
    return;
  }
  installSpinner.stop('Aider instalado correctamente.');
}

async function installValidationDependencies(
  root: string,
  config: HarnessConfig,
  runtime: InstallRuntime
): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Comprobando dependencias de validación');
  if (!pathExists(path.join(root, 'package.json'))) {
    spinner.stop('No hay package.json; se omite la instalación de oxlint y TypeScript.');
    return;
  }
  const manager = resolvePackageManager(config);
  if (!runtime.commandExists(manager)) {
    spinner.error(`${manager} no está disponible.`);
    throw new Error(
      `Instala ${manager} antes de continuar. alvaress usa pnpm por defecto; puedes cambiarlo con "packageManager" en la configuración.`
    );
  }
  spinner.message(`Instalando oxlint, typescript y @types/node con ${manager}`);
  const result = await runtime.runCommand(
    manager,
    packageManagerInstallArgs(manager, ['oxlint', 'typescript', '@types/node']),
    { cwd: root }
  );
  if (result.code !== 0) {
    spinner.error('No se pudieron instalar las dependencias de validación.');
    throw new Error(
      `${manager} falló: ${result.stderr.trim() || result.stdout.trim() || result.error}`
    );
  }
  spinner.stop('Dependencias de validación instaladas.');
}

async function installVitePlus(
  root: string,
  config: HarnessConfig,
  runtime: InstallRuntime
): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Comprobando Vite-Plus');
  if (runtime.commandExists('vp') || runtime.moduleAvailable(VITE_PLUS_PACKAGE)) {
    spinner.stop('Vite-Plus ya está disponible.');
    return;
  }
  if (!pathExists(path.join(root, 'package.json'))) {
    spinner.stop('No hay package.json; se omite Vite-Plus.');
    p.log.warn(`Vite-Plus es requerido. Instálalo con "pnpm add -D ${VITE_PLUS_PACKAGE}".`);
    return;
  }

  const manager = resolvePackageManager(config);
  spinner.message(`Instalando ${VITE_PLUS_PACKAGE} con ${manager}`);
  const result = await runtime.runCommand(
    manager,
    packageManagerInstallArgs(manager, [VITE_PLUS_PACKAGE]),
    { cwd: root }
  );
  if (result.code !== 0) {
    spinner.stop('No se pudo instalar Vite-Plus automáticamente.');
    p.log.warn(
      result.stderr.trim() ||
        result.stdout.trim() ||
        `Ejecuta "${manager} add -D ${VITE_PLUS_PACKAGE}" manualmente.`
    );
    return;
  }
  spinner.stop('Vite-Plus instalado.');
}

async function configureLaya(
  base: HarnessConfig,
  yes: boolean,
  runtime: InstallRuntime
): Promise<HarnessConfig> {
  const current = base.laya ?? {
    enabled: true,
    model: DEFAULT_LAYA_MODEL,
    subfolder: 'multilingual',
    device: 'cpu' as const,
    timeoutMs: 30_000,
    fallbackToHeuristic: true
  };
  const enabled = yes
    ? true
    : unwrap(
        await p.confirm({
          message: '¿Activar laya-ts como motor de decisión?',
          initialValue: current.enabled
        })
      );

  if (!enabled) {
    p.log.warn('laya-ts desactivado; alvaress usará heurísticas locales.');
    return { ...base, laya: { ...current, enabled: false } };
  }

  const model = yes
    ? current.model
    : unwrap(
        await p.text({
          message: 'Modelo o ruta local de laya-ts',
          placeholder: current.model,
          defaultValue: current.model,
          validate: validateWithDefault(current.model, 'El modelo es obligatorio.')
        })
      ).trim();

  const resolvedModel = model.length > 0 ? model : current.model;
  if (runtime.moduleAvailable(LAYA_TS_PACKAGE)) {
    p.log.success('laya-ts está instalado.');
  } else {
    p.log.warn(
      `laya-ts no está instalado. Instálalo con "pnpm add -D github:NandhaKishorM/laya#path:/laya-ts" o desde ${LAYA_TS_PACKAGE}.`
    );
  }

  return {
    ...base,
    laya: {
      ...current,
      enabled: true,
      model: resolvedModel
    }
  };
}

async function promptFullConfig(base: HarnessConfig): Promise<HarnessConfig> {
  const vaultPath =
    base.obsidianVaultPath.length > 0
      ? base.obsidianVaultPath
      : await askRequired('Ruta de la bóveda Obsidian', DEFAULT_OBSIDIAN_VAULT);

  const implementerModel = await askRequired(
    'Modelo del implementador (Aider)',
    base.models.aiderImplementer.modelName
  );
  const implementerBase = await askText(
    'API base del implementador',
    base.models.aiderImplementer.apiBase ?? ''
  );
  const implementerKey = await askSecret(
    base.models.aiderImplementer.apiKey ? 'API key del implementador (Enter conserva la actual)' : 'API key del implementador (Enter para vacío)'
  );

  const maxAttempts = await askMaxAttempts(base.validation.maxAttempts);
  const commands = await askValidationCommands(base.validation.commands);
  const packageManager = await askPackageManager(base.packageManager ?? DEFAULT_PACKAGE_MANAGER);

  return {
    ...base,
    obsidianVaultPath: path.resolve(expandHome(vaultPath)),
    packageManager,
    models: {
      aiderImplementer: {
        modelName: implementerModel,
        apiKey: implementerKey ?? base.models.aiderImplementer.apiKey ?? '',
        apiBase: implementerBase,
        env: {
          ...base.models.aiderImplementer.env,
          ...(implementerKey ? { DEEPSEEK_API_KEY: implementerKey } : {})
        }
      }
    },
    validation: { maxAttempts, commands }
  };
}

async function promptLocalOverrides(base: HarnessConfig): Promise<HarnessConfigFile> {
  const vaultPath = await askRequired('Ruta de la bóveda Obsidian (local)', base.obsidianVaultPath);
  const layaModel = await askRequired('Modelo o ruta local de laya-ts', base.laya?.model ?? DEFAULT_LAYA_MODEL);
  const implementerModel = await askRequired(
    'Modelo del implementador (local)',
    base.models.aiderImplementer.modelName
  );
  const maxAttempts = await askMaxAttempts(base.validation.maxAttempts);
  const commands = await askValidationCommands(base.validation.commands);
  const packageManager = await askPackageManager(base.packageManager ?? DEFAULT_PACKAGE_MANAGER);

  return {
    obsidianVaultPath: path.resolve(expandHome(vaultPath)),
    packageManager,
    laya: { model: layaModel },
    models: {
      aiderImplementer: { modelName: implementerModel }
    },
    validation: { maxAttempts, commands }
  };
}

export function validateWithDefault(
  defaultValue: string,
  message: string
): (input: string | undefined) => string | undefined {
  return (input) => {
    const value = (input ?? '').trim();
    if (value.length > 0 || defaultValue.trim().length > 0) {
      return undefined;
    }
    return message;
  };
}

async function askText(message: string, defaultValue: string): Promise<string> {
  const value = unwrap(
    await p.text({
      message,
      placeholder: defaultValue,
      defaultValue
    })
  );
  return value.trim();
}

async function askRequired(message: string, defaultValue: string): Promise<string> {
  const value = unwrap(
    await p.text({
      message,
      placeholder: defaultValue,
      defaultValue,
      validate: validateWithDefault(defaultValue, 'Este valor es obligatorio.')
    })
  );
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : defaultValue.trim();
}

async function askSecret(message: string): Promise<string | undefined> {
  const value = unwrap(await p.password({ message }));
  return value.trim().length > 0 ? value.trim() : undefined;
}

async function askPackageManager(defaultValue: PackageManager): Promise<PackageManager> {
  const answer = unwrap(
    await p.select<PackageManager>({
      message: 'Gestor de paquetes del proyecto',
      options: [
        { value: 'pnpm', label: 'pnpm', hint: 'recomendado y opción por defecto' },
        { value: 'npm', label: 'npm', hint: 'solo si el proyecto lo exige' }
      ],
      initialValue: defaultValue
    })
  );
  return answer;
}

async function askMaxAttempts(defaultValue: number): Promise<number> {
  const raw = await askRequired('Intentos máximos de auto-corrección', String(defaultValue));
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    logger.warn('Valor inválido; se usa 3 como número de intentos.');
    return 3;
  }
  return parsed;
}

async function askValidationCommands(defaultValue: string[]): Promise<string[]> {
  const raw = await askRequired(
    `Comandos de validación separados por "${COMMAND_SEPARATOR}"`,
    joinCommandList(defaultValue)
  );
  const commands = parseCommandList(raw);
  if (commands.length === 0) {
    logger.warn('No se configuraron comandos de validación.');
  }
  return commands;
}

function isRepository(root: string): boolean {
  return pathExists(path.join(root, '.git')) || pathExists(path.join(root, 'package.json'));
}
