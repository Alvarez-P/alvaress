import path from 'node:path';
import * as p from '@clack/prompts';
import { installAgent } from '../agent/installer.js';
import { loadConfig, getConfigPaths, saveGlobalConfig } from '../config/loader.js';
import type { HarnessConfig, HarnessConfigFile, PackageManager } from '../config/loader.js';
import {
  COMMAND_SEPARATOR,
  DECISION_MODELS,
  DEFAULT_DECISION_BASE,
  DEFAULT_DECISION_MODEL,
  DEFAULT_OBSIDIAN_VAULT,
  DEFAULT_PACKAGE_MANAGER,
  HARNESS_DIR
} from '../constants.js';
import type { DecisionModelName } from '../constants.js';
import {
  detectOllama,
  hasOllamaModel,
  ollamaInstallHint,
  ollamaStartHint,
  pullOllamaModel
} from '../decision/ollama.js';
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
import { expandHome, joinCommandList, parseCommandList, unwrap } from '../utils/prompt.js';

const COMPONENT_VALUES = ['agent', 'decision', 'obsidian', 'graphify', 'aider', 'validation'] as const;
type Component = (typeof COMPONENT_VALUES)[number];

const COMPONENTS: Array<{ value: Component; label: string; hint: string }> = [
  {
    value: 'agent',
    label: '🧭 Agente alvaress (OpenCode)',
    hint: 'instala el orquestador global y en el proyecto'
  },
  {
    value: 'decision',
    label: '🧠 Modelo de decisión (kev o laya vía Ollama)',
    hint: 'elige el modelo y descarga lo que falte'
  },
  {
    value: 'obsidian',
    label: '🧠 Obsidian (Aplicación, Bóveda y Estructura)',
    hint: 'detecta o instala Obsidian y conecta la bóveda'
  },
  {
    value: 'graphify',
    label: '📊 Graphify (Mapeo AST local)',
    hint: 'instala graphify con pipx si falta'
  },
  {
    value: 'aider',
    label: '🤖 Aider-Chat (Agente de código local)',
    hint: 'instala aider-chat con pipx si falta'
  },
  {
    value: 'validation',
    label: '⚡ Oxlint & TSC (Validación local)',
    hint: 'pnpm add -D oxlint typescript @types/node'
  }
];

export async function runInstall(root: string = process.cwd()): Promise<void> {
  p.intro('alvaress · instalador');

  ensureHarnessDirs(root);
  let config = loadConfig(root);
  const paths = getConfigPaths(root);

  const selected = unwrap(
    await p.multiselect<Component>({
      message: 'Selecciona los componentes a instalar',
      options: COMPONENTS,
      initialValues: [...COMPONENT_VALUES],
      required: false
    })
  );

  if (selected.length === 0) {
    p.log.warn('No seleccionaste componentes de sistema. Se configurará el proyecto igualmente.');
  }

  let obsidianVaultPath: string | undefined;
  if (selected.includes('obsidian')) {
    await ensureObsidianInstalled();
    obsidianVaultPath = await configureObsidian(config.obsidianVaultPath);
    if (obsidianVaultPath !== config.obsidianVaultPath) {
      config = { ...config, obsidianVaultPath };
      if (pathExists(paths.global)) {
        saveGlobalConfig(config);
        p.log.success('Ruta de la bóveda actualizada en la configuración global.');
      }
    }
  }

  if (selected.includes('graphify')) {
    await installGraphify();
  }

  if (selected.includes('aider')) {
    await installAider();
  }

  if (selected.includes('validation')) {
    await installValidationDependencies(root, config);
  }

  let decisionChanged = false;
  if (selected.includes('decision')) {
    config = await configureDecision(config);
    decisionChanged = true;
  }

  if (!pathExists(paths.global)) {
    config = await promptFullConfig(config);
    saveGlobalConfig(config);
    p.log.success(`Configuración global creada en ${paths.global}`);
  } else {
    if (decisionChanged) {
      saveGlobalConfig(config);
      p.log.success('Modelo de decisión actualizado en la configuración global.');
    }
    p.log.info(`Configuración global detectada en ${paths.global}`);
  }

  if (isRepository(root) && !pathExists(paths.local)) {
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
    const createManifest = unwrap(
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
    const connection = connectObsidianVault(root, obsidianVaultPath);
    p.log.success(`Bóveda conectada: ${connection.harnessDir}`);
    p.log.info(`Enlace de tareas: ${connection.tasksLink} (${connection.tasksLinkResult})`);
    if (connection.manifestLink !== undefined) {
      p.log.info(`Enlace del manifiesto: ${connection.manifestLink} (${connection.manifestLinkResult})`);
    }
  }

  const report = installSkills(root);
  p.log.success(`Skills del proyecto escritas en ${relativeTo(root, report.skillsDir)}`);

  const skipped = report.links.filter((link) => link.result === 'skipped');
  for (const link of skipped) {
    p.log.warn(`Se omitió el enlace ${link.link}: ya existe un archivo o directorio real.`);
  }
  const linked = report.links.length - skipped.length;
  p.log.info(`Enlaces globales de skills actualizados: ${linked}`);

  if (selected.includes('agent')) {
    const agent = installAgent(root, { global: true, project: true });
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
      'Siguiente paso: define tareas en openspec.yaml y ejecuta "alvaress apply".'
    ].join('\n'),
    'alvaress listo'
  );

  p.outro('Instalación completada.');
}

async function ensureObsidianInstalled(): Promise<void> {
  const status = detectObsidian();
  if (status.installed) {
    p.log.success(`Obsidian detectado (${status.method ?? 'instalado'}).`);
    return;
  }

  const spinner = p.spinner();
  spinner.start('Obsidian no está instalado. Instalando Obsidian y sus dependencias');
  const result = await installObsidian();
  if (result.installed) {
    spinner.stop(result.message);
    return;
  }

  spinner.stop('No se pudo instalar Obsidian automáticamente.');
  p.log.warn(result.message);
  p.log.info('La bóveda se creará igualmente; puedes instalar Obsidian después desde https://obsidian.md/download.');
}

async function configureObsidian(currentVault: string): Promise<string> {
  const suggested = currentVault.length > 0 ? currentVault : DEFAULT_OBSIDIAN_VAULT;
  const answer = unwrap(
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

async function installGraphify(): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Comprobando Graphify');
  if (commandExists('graphify')) {
    spinner.stop('Graphify ya está instalado.');
    return;
  }
  if (!commandExists('pipx')) {
    spinner.error('pipx no está disponible.');
    throw new Error('Instala pipx antes de continuar: https://pipx.pypa.io');
  }
  spinner.message('Instalando graphify con pipx');
  const result = await runCommand('pipx', ['install', 'graphify']);
  if (result.code !== 0) {
    spinner.error('No se pudo instalar Graphify.');
    throw new Error(`pipx install graphify falló: ${result.stderr.trim() || result.stdout.trim() || result.error}`);
  }
  spinner.stop('Graphify instalado correctamente.');
}

async function installAider(): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Comprobando Aider');
  const version = await runCommand('aider', ['--version']);
  if (version.code === 0) {
    spinner.stop(`Aider ya está instalado: ${version.stdout.trim() || 'versión desconocida'}`);
    return;
  }
  if (!commandExists('pipx')) {
    spinner.error('pipx no está disponible.');
    throw new Error('Instala pipx antes de continuar: https://pipx.pypa.io');
  }
  spinner.message('Instalando aider-chat con pipx');
  const result = await runCommand('pipx', ['install', 'aider-chat']);
  if (result.code !== 0) {
    spinner.error('No se pudo instalar Aider.');
    throw new Error(`pipx install aider-chat falló: ${result.stderr.trim() || result.stdout.trim() || result.error}`);
  }
  spinner.stop('Aider instalado correctamente.');
}

async function installValidationDependencies(root: string, config: HarnessConfig): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Comprobando dependencias de validación');
  if (!pathExists(path.join(root, 'package.json'))) {
    spinner.stop('No hay package.json; se omite la instalación de oxlint y TypeScript.');
    return;
  }
  const manager = resolvePackageManager(config);
  if (!commandExists(manager)) {
    spinner.error(`${manager} no está disponible.`);
    throw new Error(
      `Instala ${manager} antes de continuar. alvaress usa pnpm por defecto; puedes cambiarlo con "packageManager" en la configuración.`
    );
  }
  spinner.message(`Instalando oxlint, typescript y @types/node con ${manager}`);
  const result = await runCommand(
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

async function configureDecision(base: HarnessConfig): Promise<HarnessConfig> {
  const model = await askDecisionModel(base.decision.model);
  const apiBase = base.decision.apiBase || DEFAULT_DECISION_BASE;
  const status = await detectOllama(apiBase);

  if (!status.running) {
    p.log.warn(`Ollama no responde en ${apiBase}.`);
    p.log.info(status.installed ? ollamaStartHint() : ollamaInstallHint());
  } else {
    p.log.success(`Ollama disponible${status.version ? ` (${status.version})` : ''}.`);
    if (hasOllamaModel(status.models, model)) {
      p.log.success(`Modelo ${model} ya instalado.`);
    } else {
      const pull = unwrap(
        await p.confirm({
          message: `¿Descargar ${model} con "ollama pull ${model}"?`,
          initialValue: true
        })
      );
      if (pull) {
        const spinner = p.spinner();
        spinner.start(`Descargando ${model}`);
        const result = await pullOllamaModel(model);
        if (result.code === 0) {
          spinner.stop(`Modelo ${model} descargado.`);
        } else {
          spinner.stop(`No se pudo descargar ${model}.`);
          p.log.warn(
            result.stderr.trim() || result.error || `Ejecuta "ollama pull ${model}" manualmente.`
          );
        }
      } else {
        p.log.warn(`Recuerda descargarlo: ollama pull ${model}`);
      }
    }
  }

  return { ...base, decision: { ...base.decision, model, apiBase } };
}

async function askDecisionModel(defaultValue: string): Promise<DecisionModelName> {
  const initial = (DECISION_MODELS as readonly string[]).includes(defaultValue)
    ? (defaultValue as DecisionModelName)
    : DEFAULT_DECISION_MODEL;

  return unwrap(
    await p.select<DecisionModelName>({
      message: 'Modelo de decisión local (Ollama)',
      options: [
        {
          value: 'kev',
          label: 'kev',
          hint: 'Qwen3.5 calibrado; equilibrio entre precisión y velocidad'
        },
        {
          value: 'laya',
          label: 'laya',
          hint: 'ModernBERT encoder; muy rápido en CPU'
        }
      ],
      initialValue: initial
    })
  );
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
  const decisionModel = await askDecisionModel(base.decision.model);
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
    decision: { model: decisionModel },
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
