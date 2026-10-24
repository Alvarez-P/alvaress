import path from 'node:path';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import {
  appendVaultNoteEntry,
  connectObsidianVault,
  getVaultNotePath,
  getVaultTaskIndexPath
} from '../obsidian/vault.js';
import type { VaultCurrentState } from '../obsidian/vault.js';
import { inferProjectName } from '../openspec/manifest.js';
import { readRun } from '../orchestrator/report.js';
import type { RunReport, RunTaskReport } from '../orchestrator/report.js';
import { parseArgs } from '../utils/args.js';
import { pathExists } from '../utils/fs.js';
import { expandHome } from '../utils/prompt.js';

const HELP = `alvaress obsidian

Uso:
  alvaress obsidian status          Muestra la bóveda configurada, la nota y sus enlaces.
  alvaress obsidian sync            Crea o verifica la bóveda, la nota, el índice y los enlaces.
  alvaress obsidian note --summary "<texto>" [--task TASK-01]
      [--validation "<texto>"] [--risk "<texto>"] [--next "<texto>"]
      [--objective "<texto>"] [--architecture "<texto>"] [--decision "<texto>"]
      [--from-run latest|<id>]

La bóveda es un espejo de lectura: la fuente de verdad es openspec.yaml y
.harness/tasks. El orquestador usa "obsidian note" al cerrar una tarea.`;

export interface ObsidianCommandDeps {
  config?: HarnessConfig;
  stdout?: (line: string) => void;
}

function flagValue(flags: Record<string, string | boolean>, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function summarizeRun(report: RunReport, taskId?: string): {
  summary: string;
  validation?: string;
  risks?: string;
  next?: string;
} {
  const results = taskId === undefined
    ? report.results
    : report.results.filter((result) => result.taskId === taskId);
  if (taskId !== undefined && results.length === 0) {
    throw new Error(`El reporte ${report.id} no contiene la tarea ${taskId}.`);
  }
  const failed = results.filter((result) => result.outcome === 'failed');
  const verified = results.filter((result) => result.outcome === 'verified');
  const summary =
    taskId === undefined
      ? `apply ${report.id}: ${verified.length} verificadas, ${failed.length} fallidas de ${results.length}.`
      : `${taskId}: ${results[0]?.outcome ?? 'sin resultado'}${results[0]?.error ? ` (${results[0].error})` : ''}.`;
  const risks = [
    ...failed.map((result) => `${result.taskId}: ${result.error ?? 'falló'}`),
    ...results.flatMap((result) =>
      (result.outOfScope ?? []).map((file) => `${result.taskId}: cambio fuera de alcance (${file})`)
    )
  ];
  const validation = results
    .map((result) => `${result.taskId}: ${result.validation ?? result.outcome}`)
    .join('; ');
  return {
    summary,
    validation: validation.length > 0 ? validation : undefined,
    risks: risks.length > 0 ? risks.join('; ') : undefined,
    next: failed.length > 0 ? 'Revisar las tareas fallidas y volver a validar.' : 'Sin pendientes.'
  };
}

function runState(flags: Record<string, string | boolean>): VaultCurrentState | undefined {
  const state: VaultCurrentState = {
    objective: flagValue(flags, 'objective'),
    architecture: flagValue(flags, 'architecture'),
    decisions: flagValue(flags, 'decision'),
    risks: flagValue(flags, 'risk'),
    next: flagValue(flags, 'next')
  };
  return Object.values(state).some((value) => value !== undefined) ? state : undefined;
}

export function runObsidianCommand(
  args: string[],
  root: string = process.cwd(),
  deps: ObsidianCommandDeps = {}
): void {
  const stdout = deps.stdout ?? ((line: string) => console.log(line));
  const [subcommand, ...rest] = args;

  if (
    subcommand === undefined ||
    subcommand === 'help' ||
    subcommand === '--help' ||
    subcommand === '-h'
  ) {
    stdout(HELP);
    return;
  }

  const config = deps.config ?? loadConfig(root);
  const configuredPath = config.obsidianVaultPath.trim();
  if (configuredPath.length === 0) {
    throw new Error(
      'No hay bóveda Obsidian configurada. Ejecuta "alvaress install" o define obsidianVaultPath.'
    );
  }

  const vaultPath = path.resolve(root, expandHome(configuredPath));
  const projectName = inferProjectName(root);
  const notePath = getVaultNotePath(vaultPath, projectName);
  const harnessDir = path.join(vaultPath, 'Harness');
  const taskIndexPath = getVaultTaskIndexPath(vaultPath);

  if (subcommand === 'status') {
    stdout(
      JSON.stringify(
        {
          configured: true,
          vaultPath,
          exists: pathExists(vaultPath),
          harnessDir,
          notePath,
          noteExists: pathExists(notePath),
          taskIndexPath,
          taskIndexExists: pathExists(taskIndexPath),
          tasksLink: path.join(harnessDir, 'Tasks'),
          manifestLink: path.join(harnessDir, 'openspec.yaml')
        },
        null,
        2
      )
    );
    return;
  }

  if (subcommand === 'sync') {
    const connection = connectObsidianVault(root, vaultPath);
    stdout(JSON.stringify(connection, null, 2));
    return;
  }

  if (subcommand === 'note') {
    const { flags } = parseArgs(rest);
    const summaryFlag = flagValue(flags, 'summary');
    const fromRun = flagValue(flags, 'from-run');
    const task = flagValue(flags, 'task');

    let derived: ReturnType<typeof summarizeRun> | undefined;
    if (fromRun !== undefined) {
      const report = readRun(root, fromRun);
      if (report === undefined) {
        throw new Error(`No existe el reporte "${fromRun}". Ejecuta "alvaress report list".`);
      }
      derived = summarizeRun(report, task);
    }

    const summary = summaryFlag ?? derived?.summary;
    if (summary === undefined) {
      throw new Error('Uso: alvaress obsidian note --summary "<texto>" o --from-run latest');
    }

    connectObsidianVault(root, vaultPath);
    appendVaultNoteEntry(notePath, {
      summary,
      task,
      validation: flagValue(flags, 'validation') ?? derived?.validation,
      risks: flagValue(flags, 'risk') ?? derived?.risks,
      next: flagValue(flags, 'next') ?? derived?.next,
      state: runState(flags)
    });
    stdout(`[alvaress] OK: Nota de Obsidian actualizada en ${notePath}`);
    return;
  }

  throw new Error(
    `Subcomando de obsidian desconocido: ${subcommand}. Usa "alvaress obsidian status", "sync" o "note".`
  );
}

export type { RunReport, RunTaskReport };
