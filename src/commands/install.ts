import path from 'node:path';
import { unlink } from 'node:fs/promises';
import * as p from '@clack/prompts';
import { installAgent, SUBAGENTS } from '../agent/installer.js';
import { loadConfig, getConfigPaths, readConfigFile, saveGlobalConfig } from '../config/loader.js';
import type {
  HarnessConfig,
  HarnessConfigFile,
  PackageManager
} from '../config/loader.js';
import { validateModelReference } from '../config/models.js';
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
import { detectObsidian, installObsidian, OBSIDIAN_DOWNLOAD_URL } from '../obsidian/installer.js';
import { connectObsidianVault } from '../obsidian/vault.js';
import { BUNDLE_BYTES, BUNDLE_REVISION, ensureBundle, verifyBundle } from '../decision/vendor/laya/index.js';
import { errorMessage } from '../utils/errors.js';
import { moduleAvailableFrom } from '../utils/modules.js';
import { ensureHarnessDirs, getManifestPath, inferProjectName, scaffoldManifest } from '../openspec/manifest.js';
import { installSkills, SKILLS } from '../skills/installer.js';
import { ensureDir, pathExists, relativeTo, writeJsonFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { runCommand } from '../utils/process.js';
import { commandExists } from '../utils/process.js';
import {
  packageManagerInstallArgs,
  resolveInstallerPackageManager
} from '../utils/package-manager.js';
import {
  ensureUvPath,
  installUv,
  uvInstallHint,
  uvInstallPlan,
  uvToolInstallArgs
} from '../utils/uv.js';
import { expandHome, joinCommandList, parseCommandList, unwrap } from '../utils/prompt.js';

const COMPONENT_VALUES = ['agent', 'laya', 'skills', 'obsidian', 'graphify', 'vite-plus', 'validation'] as const;
type Component = (typeof COMPONENT_VALUES)[number];

/** La app Obsidian es opcional; la bóveda Markdown se crea siempre. */
const OBSIDIAN_APP_COMPONENT: Component = 'obsidian';

/** Fila del checklist: `components` es lo que instala, `id` es lo que se marca. */
type ChecklistId =
  | 'laya'
  | 'vite-plus'
  | 'graphify'
  | 'skills'
  | 'orchestrator'
  | 'subagents'
  | 'obsidian';

interface ChecklistEntry {
  id: ChecklistId;
  components: Component[];
  label: string;
  hint: string;
  required: boolean;
}

const SUBAGENT_ROLES = SUBAGENTS.map(({ name }) => name.replace(/^alvaress-/, '')).join(', ');

/** Requisitos implícitos: se instalan siempre y no ocupan fila en el checklist. */
const IMPLICIT_COMPONENTS: Component[] = ['validation'];

const CHECKLIST: ChecklistEntry[] = [
  {
    id: 'laya',
    components: ['laya'],
    label: '🧠 Laya',
    hint: `decisión local · ONNX Runtime, tokenizers y modelo int8 (${formatBytes(BUNDLE_BYTES)})`,
    required: true
  },
  {
    id: 'vite-plus',
    components: ['vite-plus'],
    label: '⚡ Vite-Plus',
    hint: 'vp check y vp test',
    required: true
  },
  {
    id: 'graphify',
    components: ['graphify'],
    label: '📊 Graphify',
    hint: 'grafo AST del repositorio · instala uv si falta',
    required: true
  },
  {
    id: 'skills',
    components: ['skills'],
    label: '🧩 Skills',
    hint: `${SKILLS.length} skills del proyecto y sus enlaces globales`,
    required: true
  },
  {
    id: 'orchestrator',
    components: ['agent'],
    label: '🧭 Orquestador',
    hint: 'agente alvaress en OpenCode',
    required: true
  },
  {
    id: 'subagents',
    components: ['agent'],
    label: '🤖 Subagentes',
    hint: SUBAGENT_ROLES,
    required: true
  },
  {
    id: 'obsidian',
    components: ['obsidian'],
    label: '🗂️ Obsidian',
    hint: '(solo para que tú visualices; los agentes no lo usan)',
    required: false
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
  installUv: typeof installUv;
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
  installUv,
  ensureLayaBundle: ensureBundle
};

export interface InstallOptions {
  yes?: boolean;
  /** Fuerza la instalación de la app Obsidian; por defecto se pregunta o se omite. */
  withObsidian?: boolean;
  runtime?: Partial<InstallRuntime>;
}

interface ComponentResult {
  info?: string[];
  warn?: string[];
}

interface LayaPlan {
  config: HarnessConfig;
  enabled: boolean;
  download: boolean;
  cacheDir: string;
  corrupt: string[];
}

interface NodePlan {
  packages: string[];
  labels: string[];
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
  const hadGlobalConfig = pathExists(paths.global);
  let configDirty = !hadGlobalConfig;

  const localModels = readConfigFile(paths.local).models;
  if (localModels?.orchestrator !== undefined || localModels?.subagents !== undefined) {
    p.log.warn(
      'Este proyecto define modelos en .alvaressrc.json; ganan sobre los globales que guarde el instalador.'
    );
  }

  const selected = await pickComponents(options.withObsidian, yes);
  const installObsidianApp = selected.has(OBSIDIAN_APP_COMPONENT);

  const obsidianVaultPath = await configureObsidian(config.obsidianVaultPath, yes);
  if (obsidianVaultPath !== config.obsidianVaultPath) {
    config = { ...config, obsidianVaultPath };
    configDirty = true;
  }

  let layaPlan: LayaPlan | undefined;
  if (selected.has('laya')) {
    layaPlan = await promptLaya(config, yes, root);
    config = layaPlan.config;
    configDirty = true;
  }

  if (!yes) {
    const configureModels = unwrap(
      await p.confirm({
        message: '¿Configurar los modelos de orquestador y subagentes ahora?',
        initialValue: true
      })
    );
    if (configureModels) {
      config = await promptModels(config);
      configDirty = true;
    }
  }

  if (!hadGlobalConfig) {
    config = yes ? config : await promptFullConfig(config);
    configDirty = true;
  }

  if (configDirty) {
    runtime.saveGlobalConfig(config);
    p.log.success(
      hadGlobalConfig
        ? 'Configuración global actualizada.'
        : `Configuración global creada en ${paths.global}`
    );
  } else {
    p.log.info(`Configuración global detectada en ${paths.global}`);
  }

  const manager = resolveInstallerPackageManager(config, runtime.commandExists);
  if (manager !== 'pnpm') {
    p.log.warn(
      `pnpm no está disponible; el instalador usará ${manager}. Para priorizar pnpm: "corepack enable pnpm" o "npm install -g pnpm".`
    );
  }

  const needsUv = selected.has('graphify');
  const uvReady = needsUv ? await ensureUv(runtime, yes) : false;

  const nodePlan = planNodeDependencies(root, runtime, {
    vitePlus: selected.has('vite-plus'),
    validation: selected.has('validation'),
    laya: layaPlan?.enabled === true
  });

  if (nodePlan.packages.length > 0 && !runtime.commandExists(manager)) {
    throw new Error(
      `Instala ${manager} antes de continuar: "corepack enable pnpm" o "npm install -g pnpm". alvaress usa pnpm por defecto.`
    );
  }

  const spinner = p.spinner();
  const status = new Map<string, string>();
  const update = (key: string, value: string): void => {
    status.set(key, `${key}: ${value}`);
    spinner.message([...status.values()].join(' · '));
  };
  spinner.start('Instalando componentes en paralelo');

  const tasks: Array<Promise<ComponentResult | undefined>> = [];
  if (selected.has('obsidian')) {
    tasks.push(installObsidianComponent(runtime, update));
  }
  if (selected.has('graphify')) {
    tasks.push(installGraphify(root, runtime, uvReady, update));
  }
  if (nodePlan.packages.length > 0) {
    tasks.push(installNodeDependencies(root, manager, runtime, nodePlan, update));
  } else if (
    selected.has('vite-plus') ||
    selected.has('validation') ||
    layaPlan?.enabled === true
  ) {
    update('Node', 'sin cambios');
  }
  const layaRuntimeReady =
    runtime.moduleAvailable(LAYA_ONNX_RUNTIME_PACKAGE, root) &&
    runtime.moduleAvailable(LAYA_TOKENIZER_PACKAGE, root);
  const canInstallLayaDeps = pathExists(path.join(root, 'package.json'));
  if (layaPlan?.download === true) {
    if (layaRuntimeReady || canInstallLayaDeps) {
      tasks.push(downloadLayaBundle(layaPlan.cacheDir, layaPlan.corrupt, runtime, update));
    } else {
      update('Laya', 'omitido');
      tasks.push(
        Promise.resolve({
          warn: [
            `No hay package.json para instalar el runtime de Laya; se omite la descarga del modelo (${formatBytes(BUNDLE_BYTES)}).`
          ]
        })
      );
    }
  }

  const results = await Promise.allSettled(tasks);
  spinner.stop('Componentes listos.');

  for (const result of results) {
    if (result.status === 'rejected') {
      p.log.warn(errorMessage(result.reason));
      continue;
    }
    for (const line of result.value?.info ?? []) {
      p.log.info(line);
    }
    for (const line of result.value?.warn ?? []) {
      p.log.warn(line);
    }
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

  const connection = runtime.connectObsidianVault(root, obsidianVaultPath);
  p.log.success(`Bóveda conectada: ${connection.harnessDir}`);
  p.log.info(`Enlace de tareas: ${connection.tasksLink} (${connection.tasksLinkResult})`);
  if (connection.manifestLink !== undefined) {
    p.log.info(`Enlace del manifiesto: ${connection.manifestLink} (${connection.manifestLinkResult})`);
  }
  if (!installObsidianApp && !runtime.detectObsidian().installed) {
    p.log.info(obsidianAppHint(connection.harnessDir));
  }

  if (selected.has('skills')) {
    const report = runtime.installSkills(root);
    p.log.success(`Skills del proyecto escritas en ${relativeTo(root, report.skillsDir)}`);

    const skipped = report.links.filter((link) => link.result === 'skipped');
    for (const link of skipped) {
      p.log.warn(`Se omitió el enlace ${link.link}: ya existe un archivo o directorio real.`);
    }
    const linked = report.links.length - skipped.length;
    p.log.info(`Enlaces globales de skills actualizados: ${linked}`);
  }

  if (selected.has('agent')) {
    const agent = runtime.installAgent(root, {
      global: true,
      project: true,
      models: {
        orchestrator: config.models.orchestrator.modelName,
        subagents: config.models.subagents.modelName
      }
    });
    for (const file of agent.files) {
      p.log.success(`Agente ${agent.name} instalado en ${file}`);
    }
    for (const file of agent.subagents) {
      p.log.success(`Subagente instalado en ${file}`);
    }
    p.log.info('En OpenCode, selecciona el agente "alvaress" con Tab o con --agent alvaress.');
  }

  p.note(
    [
      `Proyecto: ${inferProjectName(root)}`,
      `Directorio: ${path.join(root, HARNESS_DIR)}`,
      `Tareas: ${path.join(root, HARNESS_DIR, 'tasks')}`,
      `Config: ${paths.global}`,
      `Orquestador: ${describeModel(config.models.orchestrator.modelName, 'hereda el de OpenCode')}`,
      `Subagentes: ${describeModel(config.models.subagents.modelName, 'heredan el del orquestador')}`,
      ...(selected.has('agent')
        ? []
        : ['Modelos guardados; ejecuta "alvaress agent install" para aplicarlos al frontmatter.']),
      'Siguiente paso: ejecuta "alvaress run \\"tu petición\\"" o define tareas en openspec.yaml y usa "alvaress run --task <TASK_ID>".'
    ].join('\n'),
    'alvaress listo'
  );

  p.outro('Instalación completada.');
}

async function installObsidianComponent(
  runtime: InstallRuntime,
  update: (key: string, value: string) => void
): Promise<ComponentResult> {
  update('Obsidian', 'comprobando');
  const status = runtime.detectObsidian();
  if (status.installed) {
    update('Obsidian', 'listo');
    return { info: [`Obsidian detectado (${status.method ?? 'instalado'}).`] };
  }

  update('Obsidian', 'instalando');
  const result = await runtime.installObsidian();
  if (result.installed) {
    update('Obsidian', 'listo');
    return { info: [result.message] };
  }

  update('Obsidian', 'omitido');
  return {
    warn: [
      result.message,
      'La bóveda se creará igualmente; puedes instalar Obsidian después desde https://obsidian.md/download.'
    ]
  };
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

async function ensureUv(runtime: InstallRuntime, yes: boolean): Promise<boolean> {
  if (runtime.commandExists('uv')) {
    return true;
  }

  const plan = uvInstallPlan(process.platform, runtime.commandExists);
  if (plan === undefined) {
    p.log.warn(`uv no está disponible y hace falta para instalar Graphify. ${uvInstallHint()}`);
    return false;
  }

  const shouldInstall = yes
    ? true
    : unwrap(
        await p.confirm({
          message: 'uv no está instalado y hace falta para instalar Graphify. ¿Instalarlo ahora?',
          initialValue: true
        })
      );
  if (!shouldInstall) {
    p.log.warn(`Sin uv no se puede instalar Graphify. ${uvInstallHint()}`);
    return false;
  }

  const spinner = p.spinner();
  spinner.start('Instalando uv');
  const result = await runtime.installUv();
  if (result.code === 0) {
    ensureUvPath();
    if (runtime.commandExists('uv')) {
      spinner.stop('uv instalado.');
      return true;
    }
  }

  spinner.stop('No se pudo instalar uv automáticamente.');
  p.log.warn(result.error ?? result.stderr.trim() ?? 'Instalación cancelada.');
  p.log.info(uvInstallHint());
  return false;
}

async function installGraphify(
  root: string,
  runtime: InstallRuntime,
  uvReady: boolean,
  update: (key: string, value: string) => void
): Promise<ComponentResult> {
  update('Graphify', 'comprobando');
  const alreadyInstalled = runtime.commandExists('graphify');

  if (!alreadyInstalled) {
    if (!uvReady) {
      update('Graphify', 'omitido');
      return { warn: ['Sin uv no se puede instalar Graphify.'] };
    }

    update('Graphify', 'instalando');
    const result = await runtime.runCommand('uv', uvToolInstallArgs('graphifyy'));
    if (result.code !== 0) {
      update('Graphify', 'falló');
      return {
        warn: [
          `uv tool install graphifyy falló: ${result.stderr.trim() || result.stdout.trim() || result.error}`
        ]
      };
    }
    ensureUvPath();
  }

  const hooks = await enableGraphifyHooks(root, runtime);
  update('Graphify', 'listo');
  return {
    info: [alreadyInstalled ? 'Graphify ya está instalado.' : 'Graphify instalado correctamente.', ...hooks]
  };
}

/** Deja el grafo actualizado tras commit, checkout, merge y rewrite. */
async function enableGraphifyHooks(root: string, runtime: InstallRuntime): Promise<string[]> {
  if (!pathExists(path.join(root, '.git'))) {
    return ['Sin repositorio git: hooks de Graphify omitidos.'];
  }
  if (!runtime.commandExists('graphify')) {
    return ['Graphify no está en PATH: ejecuta "graphify hook install" cuando lo esté.'];
  }

  const result = await runtime.runCommand('graphify', ['hook', 'install'], { cwd: root });
  if (result.code !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || result.error || `código ${result.code}`;
    return [`graphify hook install falló: ${detail}`];
  }
  return ['Hooks de Graphify activos: el grafo se actualiza al cambiar de rama o commitear.'];
}

function obsidianAppHint(harnessDir: string): string {
  return [
    'Obsidian (app) no instalada: las notas son Markdown compatible y el flujo funciona sin ella.',
    `Si quieres la UI (grafo, backlinks), instálala desde ${OBSIDIAN_DOWNLOAD_URL} y abre ${harnessDir}.`
  ].join('\n');
}

function componentsFor(ids: readonly ChecklistId[]): Set<Component> {
  const chosen = new Set(ids);
  const components = CHECKLIST.filter((entry) => chosen.has(entry.id)).flatMap(
    (entry) => entry.components
  );
  return new Set([...components, ...IMPLICIT_COMPONENTS]);
}

function requiredChecklistIds(): ChecklistId[] {
  return CHECKLIST.filter((entry) => entry.required).map((entry) => entry.id);
}

async function pickComponents(
  withObsidian: boolean | undefined,
  yes: boolean
): Promise<Set<Component>> {
  const defaults = requiredChecklistIds();
  if (withObsidian === true) {
    defaults.push('obsidian');
  }

  if (yes) {
    return componentsFor(defaults);
  }

  const answer = unwrap(
    await p.multiselect<ChecklistId>({
      message: 'Componentes a instalar · los obligatorios no se pueden desmarcar',
      options: CHECKLIST.map((entry) => ({
        value: entry.id,
        label: entry.label,
        hint: entry.required ? `${entry.hint} · obligatorio` : entry.hint
      })),
      initialValues: defaults,
      required: true
    })
  );

  const restored = CHECKLIST.filter((entry) => entry.required && !answer.includes(entry.id));
  if (restored.length > 0) {
    p.log.warn(`Obligatorios restaurados: ${restored.map((entry) => entry.label).join(', ')}.`);
  }

  return componentsFor([...answer, ...restored.map((entry) => entry.id)]);
}

function planNodeDependencies(
  root: string,
  runtime: InstallRuntime,
  needs: { vitePlus: boolean; validation: boolean; laya: boolean }
): NodePlan {
  const packages = new Set<string>();
  const labels: string[] = [];

  if (
    needs.vitePlus &&
    !runtime.commandExists('vp') &&
    !runtime.moduleAvailable(VITE_PLUS_PACKAGE, root)
  ) {
    packages.add(VITE_PLUS_PACKAGE);
    labels.push('Vite-Plus');
  }

  if (needs.validation && !validationReady(root, runtime)) {
    for (const dependency of ['typescript', '@types/node']) {
      packages.add(dependency);
    }
    labels.push('validación');
  }

  if (
    needs.laya &&
    (!runtime.moduleAvailable(LAYA_ONNX_RUNTIME_PACKAGE, root) ||
      !runtime.moduleAvailable(LAYA_TOKENIZER_PACKAGE, root))
  ) {
    packages.add(LAYA_ONNX_RUNTIME_PACKAGE);
    packages.add(LAYA_TOKENIZER_PACKAGE);
    labels.push('Laya');
  }

  return { packages: [...packages], labels };
}

function validationReady(root: string, runtime: InstallRuntime): boolean {
  return (
    runtime.moduleAvailable('typescript', root) && runtime.moduleAvailable('@types/node', root)
  );
}

async function installNodeDependencies(
  root: string,
  manager: PackageManager,
  runtime: InstallRuntime,
  plan: NodePlan,
  update: (key: string, value: string) => void
): Promise<ComponentResult> {
  if (!pathExists(path.join(root, 'package.json'))) {
    update('Node', 'omitido');
    return {
      warn: [
        `No hay package.json; se omiten ${plan.labels.join(', ')}. Instálalos manualmente con ${manager}.`
      ]
    };
  }

  update('Node', `instalando ${plan.labels.join(', ')}`);
  const result = await runtime.runCommand(
    manager,
    packageManagerInstallArgs(manager, plan.packages),
    { cwd: root }
  );
  if (result.code !== 0) {
    update('Node', 'falló');
    return {
      warn: [
        `${manager} falló al instalar ${plan.packages.join(', ')}: ${
          result.stderr.trim() || result.stdout.trim() || result.error
        }`
      ]
    };
  }

  update('Node', 'listo');
  return { info: [`Dependencias Node instaladas: ${plan.packages.join(', ')}.`] };
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

async function downloadLayaBundle(
  dir: string,
  corrupt: string[],
  runtime: InstallRuntime,
  update: (key: string, value: string) => void
): Promise<ComponentResult> {
  // Un archivo corrupto con el tamaño correcto no se re-descargaría: bórralo.
  await Promise.all(corrupt.map((file) => unlink(path.join(dir, file)).catch(() => undefined)));

  update('Laya', `0% (${formatBytes(BUNDLE_BYTES)})`);
  let lastPercent = -1;
  try {
    await runtime.ensureLayaBundle({
      dir,
      onProgress: ({ received, total, overallReceived, overallTotal }) => {
        const done = overallReceived ?? received;
        const goal = overallTotal ?? total ?? 0;
        const percent = goal === 0 ? 0 : Math.floor((done / goal) * 100);
        if (percent !== lastPercent) {
          lastPercent = percent;
          update('Laya', `${percent}% (${formatBytes(done)} de ${formatBytes(goal)})`);
        }
      }
    });
  } catch (error) {
    update('Laya', 'falló');
    return { warn: [errorMessage(error)] };
  }

  // Cada archivo descargado ya se verificó por SHA-256; el chequeo previo fue
  // profundo, así que aquí basta confirmar tamaños y que no falte nada.
  const finalCheck = await verifyBundle(dir);
  if (!finalCheck.ok) {
    update('Laya', 'incompleto');
    return {
      warn: [
        `El modelo de Laya quedó incompleto (${[...finalCheck.missing, ...finalCheck.corrupt].join(', ')}).`
      ]
    };
  }

  update('Laya', 'listo');
  return { info: [`Modelo de Laya listo en ${dir}.`] };
}

async function promptLaya(
  base: HarnessConfig,
  yes: boolean,
  root: string
): Promise<LayaPlan> {
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
  const cacheDir = path.join(LAYA_INT8_MODEL_CACHE_ROOT, BUNDLE_REVISION);

  if (!enabled) {
    p.log.warn('Laya desactivado; alvaress usará heurísticas locales.');
    return {
      config: { ...base, laya: { ...current, enabled: false } },
      enabled: false,
      download: false,
      cacheDir,
      corrupt: []
    };
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
    return {
      config: { ...base, laya: { ...current, enabled: true, modelDir: trimmed } },
      enabled: true,
      download: false,
      cacheDir,
      corrupt: []
    };
  }

  const check = await verifyBundle(cacheDir, { deep: true });
  if (check.ok) {
    p.log.success(`Modelo de Laya listo en ${cacheDir}.`);
    return {
      config: { ...base, laya: { ...current, enabled: true, modelDir: undefined } },
      enabled: true,
      download: false,
      cacheDir,
      corrupt: []
    };
  }

  const download = yes
    ? true
    : unwrap(
        await p.confirm({
          message: `¿Descargar el modelo de Laya int8 (${formatBytes(BUNDLE_BYTES)}) en ${cacheDir}?`,
          initialValue: true
        })
      );
  if (!download) {
    p.log.warn('Modelo de Laya omitido; alvaress usará heurísticas hasta que se descargue.');
  }

  return {
    config: { ...base, laya: { ...current, enabled: true, modelDir: undefined } },
    enabled: true,
    download,
    cacheDir,
    corrupt: check.corrupt
  };
}

async function promptFullConfig(base: HarnessConfig): Promise<HarnessConfig> {
  const vaultPath =
    base.obsidianVaultPath.length > 0
      ? base.obsidianVaultPath
      : await askRequired('Ruta de la bóveda Obsidian', DEFAULT_OBSIDIAN_VAULT);

  const maxAttempts = await askMaxAttempts(base.validation.maxAttempts);
  const commands = await askValidationCommands(base.validation.commands);
  const packageManager = await askPackageManager(base.packageManager ?? DEFAULT_PACKAGE_MANAGER);

  return {
    ...base,
    obsidianVaultPath: path.resolve(expandHome(vaultPath)),
    packageManager,
    validation: { maxAttempts, commands }
  };
}

async function promptLocalOverrides(base: HarnessConfig): Promise<HarnessConfigFile> {
  const vaultPath = await askText(
    'Ruta de la bóveda Obsidian (local; vacío = usar la global)',
    ''
  );
  const layaModelDir = await askText(
    'Directorio local del modelo de Laya (vacío = usar el global)',
    ''
  );
  const maxAttempts = await askMaxAttempts(base.validation.maxAttempts);
  const commands = await askValidationCommands(base.validation.commands);
  const packageManager = await askPackageManager(base.packageManager ?? DEFAULT_PACKAGE_MANAGER);

  return {
    ...(vaultPath.trim().length > 0
      ? { obsidianVaultPath: path.resolve(expandHome(vaultPath)) }
      : {}),
    packageManager,
    ...(layaModelDir.trim().length > 0 ? { laya: { modelDir: layaModelDir.trim() } } : {}),
    validation: { maxAttempts, commands }
  };
}

export const MODEL_RECOMMENDATION = [
  'Orquestador: el modelo más capaz que tengas (familia Opus, GPT-5 o equivalente).',
  '  Conversa contigo, cierra el alcance y resuelve los HALT; gasta pocos tokens,',
  '  así que aquí la calidad rinde más que el precio.',
  'Subagentes: un modelo rápido y barato con tool-calling fiable (familia Haiku,',
  '  GPT-5 mini, Gemini Flash, DeepSeek o Qwen Coder). Implementan con alcance',
  '  cerrado, contexto en el mensaje y validación del orquestador.',
  'Evita razonamiento extendido en subagentes: encarece cada llamada sin mejorar',
  '  ediciones acotadas. Un solo modelo para todo solo conviene si es barato o local.'
].join('\n');

export async function promptModels(base: HarnessConfig): Promise<HarnessConfig> {
  p.note(MODEL_RECOMMENDATION, 'Recomendación de modelos');
  const mode = unwrap(
    await p.select<'single' | 'per-role'>({
      message: '¿Cómo quieres configurar los modelos?',
      options: [
        {
          value: 'per-role',
          label: 'Un modelo por rol (recomendado)',
          hint: 'orquestador capaz y subagentes rápidos'
        },
        {
          value: 'single',
          label: 'Un solo modelo para orquestador y subagentes',
          hint: 'mismo modelo para ambos roles'
        }
      ],
      initialValue: 'per-role'
    })
  );

  if (mode === 'single') {
    const model = await askModel(
      'Modelo para orquestador y subagentes',
      base.models.orchestrator.modelName || base.models.subagents.modelName,
      { required: true }
    );

    return {
      ...base,
      models: {
        orchestrator: { modelName: model },
        subagents: { modelName: model }
      }
    };
  }

  const orchestrator = await askModel(
    'Modelo del orquestador (vacío = heredar el de OpenCode)',
    base.models.orchestrator.modelName,
    { required: false }
  );
  const subagents = await askModel(
    'Modelo de los subagentes (vacío = heredar el del orquestador)',
    base.models.subagents.modelName,
    { required: false }
  );

  return {
    ...base,
    models: {
      orchestrator: { modelName: orchestrator },
      subagents: { modelName: subagents }
    }
  };
}

async function askModel(
  message: string,
  defaultValue: string,
  options: { required: boolean }
): Promise<string> {
  const value = unwrap(
    await p.text({
      message,
      placeholder:
        defaultValue.length > 0 ? defaultValue : options.required ? 'provider/model' : 'heredar',
      defaultValue,
      validate: (input) => {
        const trimmed = (input ?? '').trim();
        if (!options.required && isInheritInput(trimmed)) {
          return undefined;
        }
        if (trimmed.length === 0) {
          if (options.required && defaultValue.trim().length === 0) {
            return 'Este valor es obligatorio.';
          }
          return validateModelReference(defaultValue.trim());
        }
        return validateModelReference(trimmed);
      }
    })
  );
  const trimmed = value.trim();
  if (!options.required && isInheritInput(trimmed)) {
    return '';
  }
  return trimmed.length > 0 ? trimmed : defaultValue.trim();
}

function isInheritInput(value: string): boolean {
  const normalized = value.toLowerCase();
  return value === '-' || normalized === 'heredar' || normalized === 'inherit';
}

function describeModel(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
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
