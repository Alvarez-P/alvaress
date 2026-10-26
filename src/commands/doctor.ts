import path from 'node:path';
import { statSync } from 'node:fs';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import {
  LAYA_MODEL_CACHE_ROOT,
  LAYA_ONNX_RUNTIME_PACKAGE,
  LAYA_TOKENIZER_PACKAGE,
  VITE_PLUS_PACKAGE
} from '../constants.js';
import { BUNDLE_FILES, BUNDLE_REVISION } from '../decision/vendor/laya/index.js';
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
}

/** Comprobación barata: presencia y tamaño de cada archivo del bundle. */
function missingBundleFiles(dir: string): string[] {
  const problems: string[] = [];
  for (const file of BUNDLE_FILES) {
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
  const modelDir =
    configuredDir !== undefined && configuredDir.trim().length > 0
      ? path.resolve(root, configuredDir.trim())
      : path.join(LAYA_MODEL_CACHE_ROOT, BUNDLE_REVISION);

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
    checks.push(
      missing.length > 0
        ? check(
            'laya',
            'warn',
            `Modelo de Laya incompleto en ${modelDir} (faltan ${missing.join(', ')}); ejecuta "alvaress install".`
          )
        : check('laya', 'ok', `Laya listo en ${modelDir}.`)
    );
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

  for (const tool of ['aider', 'graphify']) {
    const optional = tool === 'aider' && config?.aider?.enabled !== true;
    checks.push(
      hasCommand(tool)
        ? check(tool, 'ok', `${tool} disponible.`)
        : check(
            tool,
            'warn',
            optional
              ? 'Aider no está instalado; el modo sin Aider usará subagentes especializados.'
              : `${tool} no está instalado; el flujo continuará con menos automatización.`
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
    vitePlusAvailable: deps.vitePlusAvailable
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
