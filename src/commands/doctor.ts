import path from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { agentFilePath, subagentFilePath, SUBAGENTS } from '../agent/installer.js';
import { loadConfig, readConfigFile } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import { isModelReference } from '../config/models.js';
import {
  getGlobalOpencodeAgentsDir,
  getProjectOpencodeAgentsDir,
  LAYA_FP32_MODEL_CACHE_ROOT,
  LAYA_INT8_MODEL_CACHE_ROOT,
  LAYA_ONNX_RUNTIME_PACKAGE,
  LAYA_TOKENIZER_PACKAGE,
  VITE_PLUS_PACKAGE
} from '../constants.js';
import { BUNDLE_REVISION, bundleFilesFor } from '../decision/vendor/laya/index.js';
import { detectObsidian } from '../obsidian/installer.js';
import { getManifestPath, getTasksDir, loadManifest, taskFilePath } from '../openspec/manifest.js';
import { getGraphStatus } from '../graphify/status.js';
import { moduleAvailableFrom } from '../utils/modules.js';
import { commandExists, runShellCommand } from '../utils/process.js';
import { pathExists } from '../utils/fs.js';
import { readProjectLock } from '../utils/lock.js';
import { resolvePackageManager } from '../utils/package-manager.js';

export type DoctorStatus = 'ok' | 'warn' | 'error';

export interface DoctorCheck {
  name: string;
  status: DoctorStatus;
  detail: string;
}

export interface DoctorDeps {
  config?: HarnessConfig;
  commandExists?: (command: string) => boolean;
  graphStatus?: ReturnType<typeof getGraphStatus>;
  layaAvailable?: boolean;
  vitePlusAvailable?: boolean;
  agentDirs?: Array<{ scope: string; directory: string }>;
}

/** Comprobación barata: presencia y tamaño de cada archivo del bundle. */
function missingBundleFiles(dir: string): string[] {
  const problems: string[] = [];
  for (const file of bundleFilesFor(dir)) {
    try {
      if (statSync(path.join(dir, file.path)).size !== file.bytes) {
        problems.push(file.path);
      }
    } catch {
      problems.push(file.path);
    }
  }
  return problems;
}

function check(
  name: string,
  status: DoctorStatus,
  detail: string
): DoctorCheck {
  return { name, status, detail };
}

function modelLabel(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function frontmatterModel(file: string): string | undefined {
  let content: string;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
  if (!content.startsWith('---')) {
    return undefined;
  }
  const end = content.indexOf('\n---', 3);
  const frontmatter = end === -1 ? content : content.slice(0, end);
  const match = /^model:\s*(.+)$/m.exec(frontmatter);
  return match?.[1]?.trim();
}

export function runDoctor(root: string = process.cwd(), deps: DoctorDeps = {}): DoctorCheck[] {
  const checks: DoctorCheck[] = [];
  const hasCommand = deps.commandExists ?? commandExists;
  let config: HarnessConfig | undefined = deps.config;

  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  checks.push(
    nodeMajor >= 20
      ? check('node', 'ok', `Node ${process.versions.node}`)
      : check('node', 'error', `Node ${process.versions.node}; se requiere >=20.`)
  );

  try {
    config = config ?? loadConfig(root);
    checks.push(check('config', 'ok', 'Configuración cargada correctamente.'));
  } catch (error) {
    checks.push(check('config', 'error', error instanceof Error ? error.message : String(error)));
  }

  if (config !== undefined) {
    const invalid = [
      ['orchestrator', config.models.orchestrator.modelName],
      ['subagents', config.models.subagents.modelName]
    ]
      .filter(([, value]) => !isModelReference(value))
      .map(([name]) => name);
    checks.push(
      invalid.length === 0
        ? check(
            'models',
            'ok',
            `Orquestador: ${modelLabel(config.models.orchestrator.modelName, 'hereda')} · ` +
              `Subagentes: ${modelLabel(config.models.subagents.modelName, 'heredan')}` +
              (config.aider?.enabled === true
                ? ` · Aider legacy: ${config.models.aiderImplementer.modelName}`
                : '')
          )
        : check(
            'models',
            'error',
            `Formato inválido en ${invalid.join(', ')}; usa provider/model.`
          )
    );

    const agentDirs =
      deps.agentDirs ??
      [
        { scope: 'global', directory: getGlobalOpencodeAgentsDir() },
        { scope: 'proyecto', directory: getProjectOpencodeAgentsDir(root) }
      ];
    const present = agentDirs.filter(({ directory }) => pathExists(agentFilePath(directory)));
    if (present.length === 0) {
      checks.push(
        check('agent', 'warn', 'No se encontró el agente alvaress. Ejecuta "alvaress agent install".')
      );
    } else {
      const mismatches: string[] = [];
      for (const { scope, directory } of present) {
        const model = frontmatterModel(agentFilePath(directory));
        if ((model ?? '') !== config.models.orchestrator.modelName.trim()) {
          mismatches.push(`${scope}: ${model ?? 'sin modelo'}`);
        }
        for (const subagent of SUBAGENTS) {
          const file = subagentFilePath(directory, subagent.name);
          if (!pathExists(file)) {
            mismatches.push(`${scope}/${subagent.name}: falta`);
            continue;
          }
          const subagentModel = frontmatterModel(file);
          if ((subagentModel ?? '') !== config.models.subagents.modelName.trim()) {
            mismatches.push(`${scope}/${subagent.name}: ${subagentModel ?? 'sin modelo'}`);
          }
        }
      }
      checks.push(
        mismatches.length === 0
          ? check(
              'agent',
              'ok',
              `Agente y subagentes coherentes en ${present.map(({ scope }) => scope).join(' y ')}.`
            )
          : check(
              'agent',
              'warn',
              `El frontmatter no coincide con la config (${mismatches.join(', ')}). Ejecuta "alvaress agent install".`
            )
      );
    }

    try {
      const localConfig = readConfigFile(path.join(root, '.alvaressrc.json'));
      const hasLocalModels =
        localConfig.models?.orchestrator !== undefined ||
        localConfig.models?.subagents !== undefined ||
        localConfig.models?.aiderImplementer !== undefined;
      if (hasLocalModels) {
        checks.push(
          check(
            'models-local',
            'warn',
            `El proyecto define modelos en .alvaressrc.json; ganan sobre los globales.`
          )
        );
      }
    } catch {
      // El check "config" ya reporta los errores del archivo local.
    }
  }

  const packageManager = config === undefined ? 'pnpm' : resolvePackageManager(config);
  checks.push(
    hasCommand(packageManager)
      ? check('package-manager', 'ok', `${packageManager} disponible.`)
      : check('package-manager', 'error', `${packageManager} no está en el PATH.`)
  );

  checks.push(
    hasCommand('git')
      ? check('git', 'ok', 'git disponible.')
      : check('git', 'warn', 'git no está instalado; el control de alcance del diff se desactiva.')
  );

  const layaEnabled = config?.laya?.enabled ?? true;
  const configuredDir = config?.laya?.modelDir;
  const hasConfiguredDir = configuredDir !== undefined && configuredDir.trim().length > 0;
  const modelDir = hasConfiguredDir
    ? path.resolve(root, configuredDir.trim())
    : path.join(LAYA_INT8_MODEL_CACHE_ROOT, BUNDLE_REVISION);
  const legacyDir = path.join(LAYA_FP32_MODEL_CACHE_ROOT, BUNDLE_REVISION);

  if (!layaEnabled) {
    checks.push(check('laya', 'warn', 'Laya está deshabilitado; se usarán heurísticas locales.'));
  } else if (deps.layaAvailable !== undefined) {
    // Inyectado (tests o integraciones): `true` significa que Laya está listo.
    checks.push(
      deps.layaAvailable
        ? check('laya', 'ok', `Laya listo en ${modelDir}.`)
        : check(
            'laya',
            'warn',
            'Laya no está disponible; se usarán heurísticas locales hasta ejecutar "alvaress install".'
          )
    );
  } else if (
    !moduleAvailableFrom(LAYA_ONNX_RUNTIME_PACKAGE, root) ||
    !moduleAvailableFrom(LAYA_TOKENIZER_PACKAGE, root)
  ) {
    checks.push(
      check(
        'laya',
        'warn',
        `Falta el runtime de Laya (${LAYA_ONNX_RUNTIME_PACKAGE} o ${LAYA_TOKENIZER_PACKAGE}); se usarán heurísticas locales hasta ejecutar "alvaress install".`
      )
    );
  } else {
    const missing = missingBundleFiles(modelDir);
    const legacyMissing = hasConfiguredDir ? undefined : missingBundleFiles(legacyDir);
    if (missing.length === 0) {
      checks.push(check('laya', 'ok', `Laya listo en ${modelDir}.`));
    } else if (legacyMissing !== undefined && legacyMissing.length === 0) {
      checks.push(check('laya', 'ok', `Laya listo en ${legacyDir} (bundle heredado).`));
    } else {
      checks.push(
        check(
          'laya',
          'warn',
          `Modelo de Laya incompleto en ${modelDir} (faltan ${missing.join(', ')}); ejecuta "alvaress install".`
        )
      );
    }
  }

  const vitePlusAvailable = deps.vitePlusAvailable ?? hasCommand('vp');
  checks.push(
    vitePlusAvailable
      ? check('vite-plus', 'ok', 'Vite-Plus (vp) disponible.')
      : check(
          'vite-plus',
          'warn',
          `Vite-Plus no está instalado; se usará el fallback de ${config?.packageManager ?? 'pnpm'}. Instala ${VITE_PLUS_PACKAGE}.`
        )
  );

  checks.push(
    hasCommand('graphify')
      ? check('graphify', 'ok', 'graphify disponible.')
      : check(
          'graphify',
          'warn',
          'Graphify no está instalado; ejecuta "alvaress install" o "uv tool install graphifyy".'
        )
  );

  // Aider es legacy: solo se revisa si alguien lo habilitó explícitamente.
  if (config?.aider?.enabled === true) {
    checks.push(
      hasCommand('aider')
        ? check('aider', 'ok', 'Aider legacy disponible.')
        : check(
            'aider',
            'warn',
            'Aider legacy está habilitado pero no está instalado; instálalo aparte o usa aider.enabled=false.'
          )
    );
  }

  const vaultPath = config?.obsidianVaultPath.trim() ?? '';
  if (vaultPath.length === 0) {
    checks.push(check('obsidian', 'warn', 'No hay bóveda configurada; el flujo continuará sin Obsidian.'));
  } else {
    const resolvedVault = path.resolve(root, vaultPath);
    const obsidian = detectObsidian();
    checks.push(
      obsidian.installed
        ? check('obsidian', 'ok', `Aplicación detectada (${obsidian.method ?? 'instalada'}).`)
        : check('obsidian', 'warn', 'La aplicación Obsidian no está instalada.')
    );
    if (!pathExists(resolvedVault)) {
      checks.push(check('vault', 'error', `La bóveda configurada no existe: ${resolvedVault}.`));
    } else {
      checks.push(check('vault', 'ok', `Bóveda disponible en ${resolvedVault}.`));
      const tasksLink = path.join(resolvedVault, 'Harness', 'Tasks');
      checks.push(
        pathExists(tasksLink)
          ? check('vault-tasks', 'ok', 'Enlace Tasks presente.')
          : check('vault-tasks', 'warn', `Falta el enlace ${tasksLink}. Ejecuta "alvaress obsidian sync".`)
      );
    }
  }

  const manifestPath = getManifestPath(root);
  if (!pathExists(manifestPath)) {
    checks.push(check('manifest', 'error', `No existe ${manifestPath}. Ejecuta "alvaress init".`));
  } else {
    try {
      const manifest = loadManifest(root);
      checks.push(
        check('manifest', 'ok', `${manifest.specs.length} spec(s) y ${manifest.specs.reduce((total, spec) => total + spec.tasks.length, 0)} tarea(s).`)
      );
      const missingFiles = manifest.specs.flatMap((spec) =>
        spec.tasks.flatMap((task) =>
          (task.files ?? []).filter((file) => !pathExists(path.join(root, file))).map((file) => `${task.id}: ${file}`)
        )
      );
      checks.push(
        missingFiles.length === 0
          ? check('manifest-files', 'ok', 'Todos los archivos asignados existen.')
          : check('manifest-files', 'warn', `Archivos asignados que no existen: ${missingFiles.join(', ')}.`)
      );
      const missingTaskDocs = manifest.specs.flatMap((spec) =>
        spec.tasks.filter((task) => !pathExists(taskFilePath(task.id, root))).map((task) => task.id)
      );
      checks.push(
        missingTaskDocs.length === 0
          ? check('task-docs', 'ok', 'Documentos de tarea presentes.')
          : check('task-docs', 'warn', `Faltan documentos de tarea: ${missingTaskDocs.join(', ')}.`)
      );
      checks.push(
        manifest.specs.length > 0
          ? check('specs', 'ok', 'El manifiesto contiene specs.')
          : check('specs', 'warn', 'El manifiesto no contiene specs todavía.')
      );
    } catch (error) {
      checks.push(check('manifest', 'error', error instanceof Error ? error.message : String(error)));
    }
  }

  const commands = config?.validation.commands ?? [];
  if (commands.length === 0) {
    checks.push(
      check(
        'validation',
        config?.validation.requireCommands === false ? 'warn' : 'error',
        'No hay comandos de validación configurados.'
      )
    );
  } else {
    checks.push(check('validation', 'ok', `${commands.length} comando(s) de validación.`));
  }

  const graph = deps.graphStatus ?? getGraphStatus(root);
  if (!graph.exists) {
    checks.push(check('graphify-graph', 'warn', `No existe ${graph.path}; ejecuta "graphify update .".`));
  } else if (graph.stale) {
    checks.push(
      check(
        'graphify-graph',
        'warn',
        `El grafo está desactualizado (${graph.graphMtime ?? 'sin fecha'}). Ejecuta "graphify update .".`
      )
    );
  } else {
    checks.push(check('graphify-graph', 'ok', 'Grafo actualizado.'));
  }

  const lock = readProjectLock(root);
  if (lock !== undefined) {
    checks.push(check('lock', 'warn', `Hay un lock activo de PID ${lock.pid} (${lock.command}).`));
  } else {
    checks.push(check('lock', 'ok', 'Sin locks activos.'));
  }

  if (hasCommand('git')) {
    const status = runShellCommand('git status --porcelain', { cwd: root, timeout: 15000 });
    if (status.code === 0) {
      checks.push(
        status.stdout.trim().length === 0
          ? check('git-status', 'ok', 'Árbol de trabajo limpio.')
          : check('git-status', 'warn', 'Hay cambios sin commitear; el control de alcance puede ser menos preciso.')
      );
    }
  }

  const tasksDir = getTasksDir(root);
  if (!pathExists(tasksDir)) {
    checks.push(check('harness', 'warn', `No existe ${tasksDir}. Ejecuta "alvaress init".`));
  }

  return checks;
}

export interface DoctorCommandDeps {
  config?: HarnessConfig;
  layaAvailable?: boolean;
  vitePlusAvailable?: boolean;
  agentDirs?: Array<{ scope: string; directory: string }>;
  stdout?: (line: string) => void;
}

export function runDoctorCommand(
  args: string[],
  root: string = process.cwd(),
  deps: DoctorCommandDeps = {}
): number {
  const stdout = deps.stdout ?? ((line: string) => console.log(line));
  const json = args.includes('--json');
  const checks = runDoctor(root, {
    config: deps.config,
    layaAvailable: deps.layaAvailable,
    vitePlusAvailable: deps.vitePlusAvailable,
    agentDirs: deps.agentDirs
  });

  if (json) {
    stdout(JSON.stringify({ checks, errors: checks.filter((entry) => entry.status === 'error').length }, null, 2));
  } else {
    for (const entry of checks) {
      stdout(`[${entry.status.toUpperCase()}] ${entry.name}: ${entry.detail}`);
    }
  }

  return checks.some((entry) => entry.status === 'error') ? 1 : 0;
}
