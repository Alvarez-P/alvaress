import path from 'node:path';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
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
import { buildAiderEnv, runAider } from './aider.js';
import { describeGroups, groupWorkItems } from './locks.js';
import { verifyAndRepairTask } from './verify.js';

export type TaskOutcome = 'verified' | 'failed' | 'skipped';

export interface TaskExecutionResult {
  specId: string;
  taskId: string;
  context: string;
  group: number;
  outcome: TaskOutcome;
  error?: string;
}

export interface ApplyReport {
  total: number;
  groups: number;
  verified: number;
  failed: number;
  skipped: number;
  results: TaskExecutionResult[];
}

export interface ApplyOptions {
  root?: string;
  taskIds?: string[];
  dryRun?: boolean;
}

interface ExecutionContext {
  root: string;
  config: HarnessConfig;
  manifest: OpenSpecManifest;
  persist: () => Promise<void>;
}

function existingAssignedFiles(root: string, files: string[] | undefined): string[] {
  if (!files) {
    return [];
  }
  return files.filter((file) => pathExists(path.join(root, file)));
}

export async function applyTasks(options: ApplyOptions = {}): Promise<ApplyReport> {
  const root = options.root ?? process.cwd();
  const config = loadConfig(root);
  const manifest = loadManifest(root);
  const items = collectWorkItems(manifest, options.taskIds);

  if (items.length === 0) {
    logger.warn('No hay tareas pendientes en openspec.yaml.');
    return { total: 0, groups: 0, verified: 0, failed: 0, skipped: 0, results: [] };
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
      results: dryRunResults
    };
  }

  const context: ExecutionContext = { root, config, manifest, persist };
  const perGroup = await Promise.all(
    groups.map((group, groupIndex) => runGroup(group, groupIndex + 1, context))
  );
  const results = perGroup.flat();

  await persist();

  const verified = results.filter((result) => result.outcome === 'verified').length;
  const failed = results.filter((result) => result.outcome === 'failed').length;
  const skipped = results.filter((result) => result.outcome === 'skipped').length;

  return { total: items.length, groups: groups.length, verified, failed, skipped, results };
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
  const { root, config, manifest } = context;
  const boundedContextPath = contextPath(manifest, item.spec.context);

  try {
    ensureTaskFile(item.spec, item.task, boundedContextPath, root);
    setTaskStatus(manifest, item.task.id, 'InProgress');
    refreshSpecStatus(item.spec);
    await context.persist();

    logger.step(`[Grupo ${groupNumber}] ${item.spec.id}/${item.task.id} (${item.spec.context}) -> Aider`);

    const relativeTaskFile = path.join('.harness', 'tasks', `${item.task.id}.md`);
    const assignedFiles = existingAssignedFiles(root, item.task.files);
    const implementer = config.models.aiderImplementer;

    const run = await runAider(implementer.modelName, {
      message: `Implementa la subtarea descrita en ${relativeTaskFile}`,
      files: assignedFiles,
      readFiles: [relativeTaskFile],
      cwd: root,
      env: buildAiderEnv(config),
      inherit: true
    });

    if (run.code !== 0) {
      const detail = run.error ?? `Aider terminó con código ${run.code}.`;
      logger.error(`[Grupo ${groupNumber}] ${item.task.id}: ${detail}`);
      setTaskStatus(manifest, item.task.id, 'Failed');
      refreshSpecStatus(item.spec);
      await context.persist();
      return {
        specId: item.spec.id,
        taskId: item.task.id,
        context: item.spec.context,
        group: groupNumber,
        outcome: 'failed',
        error: detail
      };
    }

    const verified = await verifyAndRepairTask(item.task.id, {
      root,
      files: assignedFiles,
      config
    });

    setTaskStatus(manifest, item.task.id, verified ? 'Done' : 'Failed');
    refreshSpecStatus(item.spec);
    await context.persist();

    return {
      specId: item.spec.id,
      taskId: item.task.id,
      context: item.spec.context,
      group: groupNumber,
      outcome: verified ? 'verified' : 'failed'
    };
  } catch (error) {
    const detail = errorMessage(error);
    logger.error(`[Grupo ${groupNumber}] ${item.task.id}: ${detail}`);
    setTaskStatus(manifest, item.task.id, 'Failed');
    refreshSpecStatus(item.spec);
    await context.persist().catch(() => undefined);
    return {
      specId: item.spec.id,
      taskId: item.task.id,
      context: item.spec.context,
      group: groupNumber,
      outcome: 'failed',
      error: detail
    };
  }
}
