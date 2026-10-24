import path from 'node:path';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import { updateGraph } from '../graphify/status.js';
import {
  collectWorkItems,
  contextPath,
  ensureTaskFile,
  loadManifest,
  refreshSpecStatus,
  saveManifest,
  setTaskStatus
} from '../openspec/manifest.js';
import type { OpenSpecManifest, WorkItem } from '../openspec/types.js';
import { pathExists } from '../utils/fs.js';
import { errorMessage } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { acquireProjectLock } from '../utils/lock.js';
import type { ProjectLock } from '../utils/lock.js';
import { buildAiderEnv, runAider } from './aider.js';
import { backupManifest } from './backup.js';
import { describeGroups, groupWorkItems } from './locks.js';
import { changedFiles, outOfScopeFiles } from './scope.js';
import type { ScopeMode } from './scope.js';
import { createRunReport, newRunReportId, writeRunReport } from './report.js';
import type { RunTaskReport } from './report.js';
import { verifyAndRepairTask } from './verify.js';

export type TaskOutcome = 'verified' | 'failed' | 'skipped';

export interface TaskExecutionResult {
  specId: string;
  taskId: string;
  context: string;
  group: number;
  outcome: TaskOutcome;
  error?: string;
  files?: string[];
  outOfScope?: string[];
  validation?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface ApplyReport {
  total: number;
  groups: number;
  verified: number;
  failed: number;
  skipped: number;
  results: TaskExecutionResult[];
  runId?: string;
  reportPath?: string;
  backupPath?: string;
}

export interface ApplyOptions {
  root?: string;
  taskIds?: string[];
  dryRun?: boolean;
  lock?: boolean;
  force?: boolean;
  updateGraph?: boolean;
}

interface ExecutionContext {
  root: string;
  config: HarnessConfig;
  manifest: OpenSpecManifest;
  persist: () => Promise<void>;
  runId: string;
}

function existingAssignedFiles(root: string, files: string[] | undefined): string[] {
  if (!files) {
    return [];
  }
  return files.filter((file) => pathExists(path.join(root, file)));
}

function newChanges(before: string[] | null, after: string[] | null): string[] {
  if (after === null) {
    return [];
  }
  if (before === null) {
    return after;
  }
  return after.filter((file) => !before.includes(file));
}

export async function applyTasks(options: ApplyOptions = {}): Promise<ApplyReport> {
  const root = options.root ?? process.cwd();
  const config = loadConfig(root);
  const manifest = loadManifest(root);
  const items = collectWorkItems(manifest, options.taskIds);
  const startedAt = new Date();
  const runId = newRunReportId(startedAt);
  let lock: ProjectLock | undefined;

  if (options.lock !== false) {
    lock = acquireProjectLock(root, {
      command: 'alvaress apply',
      force: options.force
    });
  }

  try {
    if (items.length === 0) {
      logger.warn('No hay tareas pendientes en openspec.yaml.');
      return { total: 0, groups: 0, verified: 0, failed: 0, skipped: 0, results: [], runId };
    }

    const groups = groupWorkItems(items);
    logger.info(`${items.length} tarea(s) pendiente(s) distribuidas en ${groups.length} grupo(s) de ejecución.`);
    for (const line of describeGroups(groups)) {
      logger.info(line);
    }

    let writeQueue: Promise<void> = Promise.resolve();
    const persist = (): Promise<void> => {
      writeQueue = writeQueue
        .then(
          () => undefined,
          () => undefined
        )
        .then(() => saveManifest(manifest, root));
      return writeQueue;
    };

    if (options.dryRun) {
      const dryRunResults: TaskExecutionResult[] = [];
      groups.forEach((group, index) => {
        for (const item of group) {
          dryRunResults.push({
            specId: item.spec.id,
            taskId: item.task.id,
            context: item.spec.context,
            group: index + 1,
            outcome: 'skipped'
          });
        }
      });
      logger.info('Modo dry-run: no se invocó a Aider ni se modificó openspec.yaml.');
      return {
        total: items.length,
        groups: groups.length,
        verified: 0,
        failed: 0,
        skipped: items.length,
        results: dryRunResults,
        runId
      };
    }

    const backup = backupManifest(root);
    if (backup !== undefined) {
      logger.info(`Backup del manifiesto: ${backup.path}`);
    }

    const context: ExecutionContext = { root, config, manifest, persist, runId };
    const perGroup = await Promise.all(
      groups.map((group, groupIndex) => runGroup(group, groupIndex + 1, context))
    );
    const results = perGroup.flat();

    await persist();

    const runReport = createRunReport(runId, startedAt, results as RunTaskReport[]);
    let reportPath: string | undefined;
    try {
      reportPath = writeRunReport(root, runReport);
      logger.info(`Reporte de ejecución: ${reportPath}`);
    } catch (error) {
      logger.warn(`No se pudo escribir el reporte de ejecución: ${errorMessage(error)}`);
    }

    if (options.updateGraph === true || config.graphify?.autoUpdate === true) {
      const graph = await updateGraph(root);
      if (graph.code === 0) {
        logger.success('Grafo de Graphify actualizado.');
      } else {
        logger.warn(`No se pudo actualizar Graphify: ${graph.error ?? graph.stderr.trim()}`);
      }
    }

    return {
      total: runReport.total,
      groups: runReport.groups,
      verified: runReport.verified,
      failed: runReport.failed,
      skipped: runReport.skipped,
      results,
      runId,
      reportPath,
      backupPath: backup?.path
    };
  } finally {
    lock?.release();
  }
}

async function runGroup(
  group: WorkItem[],
  groupNumber: number,
  context: ExecutionContext
): Promise<TaskExecutionResult[]> {
  const results: TaskExecutionResult[] = [];
  for (const item of group) {
    results.push(await executeTask(item, groupNumber, context));
  }
  return results;
}

async function executeTask(
  item: WorkItem,
  groupNumber: number,
  context: ExecutionContext
): Promise<TaskExecutionResult> {
  const { root, config, manifest, runId } = context;
  const boundedContextPath = contextPath(manifest, item.spec.context);
  const startedAt = new Date();
  const assignedFiles = existingAssignedFiles(root, item.task.files);
  const scopeMode: ScopeMode = config.scope ?? 'warn';

  try {
    ensureTaskFile(item.spec, item.task, boundedContextPath, root);
    setTaskStatus(manifest, item.task.id, 'InProgress');
    refreshSpecStatus(item.spec);
    await context.persist();

    logger.step(`[Grupo ${groupNumber}] ${item.spec.id}/${item.task.id} (${item.spec.context}) -> Aider`);

    const relativeTaskFile = path.join('.harness', 'tasks', `${item.task.id}.md`);
    const implementer = config.models.aiderImplementer;
    const before = changedFiles(root);

    const run = await runAider(implementer.modelName, {
      message: `Implementa la subtarea descrita en ${relativeTaskFile}`,
      files: assignedFiles,
      readFiles: [relativeTaskFile],
      cwd: root,
      env: buildAiderEnv(config),
      inherit: false,
      timeoutMs: config.aider?.timeoutMs,
      logFile: path.join(root, '.harness', 'runs', `${runId}-${item.task.id}.log`),
      extraArgs: config.aider?.extraArgs
    });

    if (run.code !== 0) {
      const detail = run.error ?? `Aider terminó con código ${run.code}.`;
      logger.error(`[Grupo ${groupNumber}] ${item.task.id}: ${detail}`);
      setTaskStatus(manifest, item.task.id, 'Failed');
      refreshSpecStatus(item.spec);
      await context.persist();
      return finishResult(item, groupNumber, startedAt, 'failed', {
        error: detail,
        files: assignedFiles,
        validation: 'failed'
      });
    }

    const after = changedFiles(root);
    const outOfScope = outOfScopeFiles(newChanges(before, after), assignedFiles);
    if (scopeMode === 'strict' && outOfScope.length > 0) {
      const detail = `Aider modificó archivos fuera del alcance: ${outOfScope.join(', ')}.`;
      logger.error(`[Grupo ${groupNumber}] ${item.task.id}: ${detail}`);
      setTaskStatus(manifest, item.task.id, 'Failed');
      refreshSpecStatus(item.spec);
      await context.persist();
      return finishResult(item, groupNumber, startedAt, 'failed', {
        error: detail,
        files: assignedFiles,
        outOfScope,
        validation: 'failed'
      });
    }
    if (scopeMode === 'warn' && outOfScope.length > 0) {
      logger.warn(
        `[Grupo ${groupNumber}] ${item.task.id}: cambios fuera de los archivos asignados: ${outOfScope.join(', ')}.`
      );
    }

    const verified = await verifyAndRepairTask(item.task.id, {
      root,
      files: assignedFiles,
      config,
      commands: item.task.validation,
      requireCommands: config.validation.requireCommands,
      aiderTimeoutMs: config.aider?.timeoutMs,
      logFile: path.join(root, '.harness', 'runs', `${runId}-${item.task.id}-verify.log`)
    });

    setTaskStatus(manifest, item.task.id, verified ? 'Done' : 'Failed');
    refreshSpecStatus(item.spec);
    await context.persist();

    return finishResult(item, groupNumber, startedAt, verified ? 'verified' : 'failed', {
      files: assignedFiles,
      outOfScope,
      validation: verified ? 'ok' : 'failed'
    });
  } catch (error) {
    const detail = errorMessage(error);
    logger.error(`[Grupo ${groupNumber}] ${item.task.id}: ${detail}`);
    setTaskStatus(manifest, item.task.id, 'Failed');
    refreshSpecStatus(item.spec);
    await context.persist().catch(() => undefined);
    return finishResult(item, groupNumber, startedAt, 'failed', {
      error: detail,
      files: assignedFiles,
      validation: 'failed'
    });
  }
}

function finishResult(
  item: WorkItem,
  groupNumber: number,
  startedAt: Date,
  outcome: TaskOutcome,
  extra: Partial<TaskExecutionResult> = {}
): TaskExecutionResult {
  const finishedAt = new Date();
  return {
    specId: item.spec.id,
    taskId: item.task.id,
    context: item.spec.context,
    group: groupNumber,
    outcome,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    ...extra
  };
}
