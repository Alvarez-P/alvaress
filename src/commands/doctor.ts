import path from 'node:path';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import { detectObsidian } from '../obsidian/installer.js';
import { getManifestPath, getTasksDir, loadManifest, taskFilePath } from '../openspec/manifest.js';
import { getGraphStatus } from '../graphify/status.js';
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

  for (const tool of ['aider', 'graphify']) {
    checks.push(
      hasCommand(tool)
        ? check(tool, 'ok', `${tool} disponible.`)
        : check(tool, 'warn', `${tool} no está instalado; el flujo continuará con menos automatización.`)
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
  stdout?: (line: string) => void;
}

export function runDoctorCommand(
  args: string[],
  root: string = process.cwd(),
  deps: DoctorCommandDeps = {}
): number {
  const stdout = deps.stdout ?? ((line: string) => console.log(line));
  const json = args.includes('--json');
  const checks = runDoctor(root, { config: deps.config });

  if (json) {
    stdout(JSON.stringify({ checks, errors: checks.filter((entry) => entry.status === 'error').length }, null, 2));
  } else {
    for (const entry of checks) {
      stdout(`[${entry.status.toUpperCase()}] ${entry.name}: ${entry.detail}`);
    }
  }

  return checks.some((entry) => entry.status === 'error') ? 1 : 0;
}
