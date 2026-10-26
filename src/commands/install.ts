import path from 'node:path';
import { unlink } from 'node:fs/promises';
import * as p from '@clack/prompts';
import { installAgent } from '../agent/installer.js';
import { loadConfig, getConfigPaths, saveGlobalConfig } from '../config/loader.js';
import type { HarnessConfig, HarnessConfigFile, PackageManager } from '../config/loader.js';
import {
  COMMAND_SEPARATOR,
  DEFAULT_LAYA_TIMEOUT_MS,
  DEFAULT_OBSIDIAN_VAULT,
  DEFAULT_PACKAGE_MANAGER,
  HARNESS_DIR,
  LAYA_INT8_MODEL_CACHE_ROOT,
  LAYA_ONNX_RUNTIME_PACKAGE,
  LAYA_TOKENIZER_PACKAGE,
  VITE_PLUS_PACKAGE
} from '../constants.js';
import { detectObsidian, installObsidian } from '../obsidian/installer.js';
import { connectObsidianVault } from '../obsidian/vault.js';
import { BUNDLE_BYTES, BUNDLE_REVISION, ensureBundle, verifyBundle } from '../decision/vendor/laya/index.js';
import { errorMessage } from '../utils/errors.js';
import { moduleAvailableFrom } from '../utils/modules.js';
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
    label: '🧠 Laya (motor de decisión local)',
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

export interface InstallRuntime {
  commandExists: typeof commandExists;
  runCommand: typeof runCommand;
  /** Resuelve un módulo desde la raíz del proyecto (no desde alvaress). */
  moduleAvailable: (specifier: string, from: string) => boolean;
  loadConfig: typeof loadConfig;
  getConfigPaths: typeof getConfigPaths;
  saveGlobalConfig: typeof saveGlobalConfig;
  detectObsidian: typeof detectObsidian;
  installObsidian: typeof installObsidian;
  connectObsidianVault: typeof connectObsidianVault;
  installSkills: typeof installSkills;
  installAgent: typeof installAgent;
  installPipx: typeof installPipx;
  ensureLayaBundle: typeof ensureBundle;
}

const DEFAULT_RUNTIME: InstallRuntime = {
  commandExists,
  runCommand,
  moduleAvailable: moduleAvailableFrom,
  loadConfig,
  getConfigPaths,
  saveGlobalConfig,
  detectObsidian,
  installObsidian,
  connectObsidianVault,
  installSkills,
  installAgent,
  installPipx,
  ensureLayaBundle: ensureBundle
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
    config = await configureLaya(config, yes, runtime, root);
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
  if (runtime.commandExists('vp') || runtime.moduleAvailable(VITE_PLUS_PACKAGE, root)) {
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

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) {
    return `${(bytes / 1e9).toFixed(2)} GB`;
  }
  if (bytes >= 1e6) {
    return `${(bytes / 1e6).toFixed(0)} MB`;
  }
  return `${bytes} B`;
}

async function installLayaDependencies(
  root: string,
  config: HarnessConfig,
  runtime: InstallRuntime
): Promise<boolean> {
  if (
    runtime.moduleAvailable(LAYA_ONNX_RUNTIME_PACKAGE, root) &&
    runtime.moduleAvailable(LAYA_TOKENIZER_PACKAGE, root)
  ) {
    return true;
  }
  if (!pathExists(path.join(root, 'package.json'))) {
    p.log.warn(
      `No hay package.json. Instala ${LAYA_ONNX_RUNTIME_PACKAGE} y ${LAYA_TOKENIZER_PACKAGE} manualmente.`
    );
    return false;
  }

  const manager = resolvePackageManager(config);
  const spinner = p.spinner();
  spinner.start(`Instalando el runtime de Laya con ${manager}`);
  const result = await runtime.runCommand(
    manager,
    packageManagerInstallArgs(manager, [LAYA_ONNX_RUNTIME_PACKAGE, LAYA_TOKENIZER_PACKAGE]),
    { cwd: root }
  );
  if (result.code !== 0) {
    spinner.stop('No se pudo instalar el runtime de Laya.');
    p.log.warn(
      result.stderr.trim() ||
        result.stdout.trim() ||
        `Ejecuta "${manager} add -D ${LAYA_ONNX_RUNTIME_PACKAGE} ${LAYA_TOKENIZER_PACKAGE}" manualmente.`
    );
    return false;
  }
  spinner.stop('Runtime de Laya instalado.');
  return true;
}

async function downloadLayaBundle(
  dir: string,
  yes: boolean,
  runtime: InstallRuntime
): Promise<boolean> {
  // En el instalador se audita el hash completo; en cada `run` basta el tamaño.
  const check = await verifyBundle(dir, { deep: true });
  if (check.ok) {
    p.log.success(`Modelo de Laya listo en ${dir}.`);
    return true;
  }

  if (!yes) {
    const proceed = unwrap(
      await p.confirm({
        message: `¿Descargar el modelo de Laya int8 (${formatBytes(BUNDLE_BYTES)}) en ${dir}?`,
        initialValue: true
      })
    );
    if (!proceed) {
      p.log.warn('Modelo de Laya omitido; alvaress usará heurísticas hasta que se descargue.');
      return false;
    }
  }

  // Un archivo corrupto con el tamaño correcto no se re-descargaría: bórralo.
  await Promise.all(
    check.corrupt.map((file) => unlink(path.join(dir, file)).catch(() => undefined))
  );

  const spinner = p.spinner();
  spinner.start(`Descargando el modelo de Laya int8 (${formatBytes(BUNDLE_BYTES)})`);
  let lastFile = '';
  let lastPercent = -1;

  try {
    await runtime.ensureLayaBundle({
      dir,
      onProgress: ({ file, received, total }) => {
        const percent = total === null ? 0 : Math.floor((received / total) * 100);
        if (file !== lastFile || percent !== lastPercent) {
          lastFile = file;
          lastPercent = percent;
          spinner.message(
            `${file} ${percent}% (${formatBytes(received)} de ${formatBytes(total ?? 0)})`
          );
        }
      }
    });
  } catch (error) {
    spinner.stop('No se pudo descargar el modelo de Laya.');
    p.log.warn(errorMessage(error));
    return false;
  }

  const finalCheck = await verifyBundle(dir, { deep: true });
  if (!finalCheck.ok) {
    spinner.stop('El modelo de Laya quedó incompleto.');
    p.log.warn(
      `Archivos con problemas: ${[...finalCheck.missing, ...finalCheck.corrupt].join(', ')}.`
    );
    return false;
  }

  spinner.stop(`Modelo de Laya listo en ${dir}.`);
  return true;
}

async function configureLaya(
  base: HarnessConfig,
  yes: boolean,
  runtime: InstallRuntime,
  root: string
): Promise<HarnessConfig> {
  const current = base.laya ?? {
    enabled: true,
    device: 'cpu' as const,
    timeoutMs: DEFAULT_LAYA_TIMEOUT_MS,
    fallbackToHeuristic: true
  };
  const enabled = yes
    ? true
    : unwrap(
        await p.confirm({
          message: '¿Activar Laya como motor de decisión local?',
          initialValue: current.enabled
        })
      );

  if (!enabled) {
    p.log.warn('Laya desactivado; alvaress usará heurísticas locales.');
    return { ...base, laya: { ...current, enabled: false } };
  }

  const modelDir = yes
    ? (current.modelDir ?? '')
    : unwrap(
        await p.text({
          message: 'Directorio local del modelo de Laya (vacío = caché gestionada)',
          placeholder: current.modelDir ?? 'vacío',
          defaultValue: current.modelDir ?? ''
        })
      ).trim();

  const trimmed = modelDir.trim();
  const depsReady = await installLayaDependencies(root, base, runtime);
  if (!depsReady) {
    p.log.warn('Laya quedará en heurísticas hasta que instales el runtime.');
  }

  if (trimmed.length > 0) {
    const resolved = path.resolve(root, expandHome(trimmed));
    const result = await verifyBundle(resolved);
    if (result.ok) {
      p.log.success(`Bundle de Laya verificado en ${resolved}.`);
    } else {
      const problems = [...result.missing, ...result.corrupt];
      p.log.warn(
        `El bundle de ${resolved} está incompleto (${problems.join(', ')}). Ejecuta "alvaress doctor" para revisarlo.`
      );
    }
    return { ...base, laya: { ...current, enabled: true, modelDir: trimmed } };
  }

  if (depsReady) {
    await downloadLayaBundle(path.join(LAYA_INT8_MODEL_CACHE_ROOT, BUNDLE_REVISION), yes, runtime);
  }

  return { ...base, laya: { ...current, enabled: true, modelDir: undefined } };
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
  const layaModelDir = await askText(
    'Directorio local del modelo de Laya (vacío = caché gestionada)',
    base.laya?.modelDir ?? ''
  );
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
    laya: { modelDir: layaModelDir.trim() },
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
