import path from 'node:path';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import {
  LAYA_DIR,
  LAYA_HALT_FILENAME,
  OPENSPEC_FILENAME
} from '../constants.js';
import type {
  CommitResult,
  DecisionEngine,
  Exploration,
  FileChange,
  FixResult,
  HarnessHandlers,
  HarnessUI,
  HaltReason,
  ReadyInput,
  ReadyResult,
  Risk,
  RouteDecision,
  RunMode,
  RunRequest,
  RunResult,
  ValidationResult,
  WorkPlan,
  WorkResult,
  Worker
} from '../core/contracts.js';
import { HarnessCore, createRunId, firstFailure } from '../core/harness.js';
import { HeuristicDecisionEngine } from '../decision/heuristics.js';
import { createDecisionEngine } from '../decision/laya.js';
import {
  addLearning,
  getMemoryStores,
  loadScopedLearnings,
  rebuildPlaybook,
  recordScopedLearningUse
} from '../memory/learnings.js';
import { appendVaultNoteEntry, connectObsidianVault, getVaultNotePath } from '../obsidian/vault.js';
import {
  inferProjectName,
  loadManifest,
  refreshSpecStatus,
  saveManifest,
  setTaskStatus
} from '../openspec/manifest.js';
import { finalReportFromRun, printFinalReport } from '../ui/final-report.js';
import type { ReportTask } from '../ui/final-report.js';
import { StatusLine } from '../ui/status-line.js';
import { flagEnabled, parseArgs } from '../utils/args.js';
import { errorMessage } from '../utils/errors.js';
import { readTextFile, writeJsonFileAtomic, writeTextFileAtomic } from '../utils/fs.js';
import { acquireProjectLock } from '../utils/lock.js';
import type { ProjectLock } from '../utils/lock.js';
import { expandHome } from '../utils/prompt.js';
import { redactSecrets } from '../utils/redact.js';
import { backupManifest } from '../orchestrator/backup.js';
import { commitRun } from '../orchestrator/commit.js';
import { exploreRequest, markChecklistDone, resolveOddNote } from '../orchestrator/explore.js';
import { writeHarnessRunReport } from '../orchestrator/report.js';
import { RunLog, inspectLastRun } from '../orchestrator/run-log.js';
import { CommandValidator } from '../orchestrator/validator.js';
import { createWorker } from '../orchestrator/workers.js';

export interface RunCommandDeps {
  config?: HarnessConfig;
  decisions?: DecisionEngine;
  worker?: Worker;
  ui?: HarnessUI;
  stdout?: NodeJS.WriteStream;
  env?: NodeJS.ProcessEnv;
  lock?: boolean;
  noVerify?: boolean;
  commit?: boolean;
}

const MODES: RunMode[] = ['odd', 'sdd'];

const RUN_HELP = `alvaress run

Ejecuta el arnés híbrido SDD/ODD de principio a fin.

Uso:
  alvaress run "<petición>" [opciones]
  alvaress run --task TASK_ID [opciones]
  alvaress run -i | --inspect-last-run

Opciones:
  --task TASK_ID        Ejecuta una tarea concreta de openspec.yaml.
  --files a.ts,b.ts     Cierra el alcance a esos archivos.
  --mode odd|sdd|auto   Fuerza el modo; por defecto decide Laya.
  --dry-run             Explora y muestra el plan sin invocar al worker.
  --no-commit           No hace commit automático al terminar en Ready.
  --no-learn            No registra aprendizajes ni usos en este run.
  --force               Ignora un lock huérfano de otra ejecución.
  -i, --inspect-last-run  Muestra el log completo del último run.

El log se guarda en .laya/last_run.log y el HALT en .laya/HALT.json.`;

function flagValue(flags: Record<string, string | boolean>, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseFileList(value: string | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  return [...new Set(value.split(',').map((file) => file.trim()).filter((file) => file.length > 0))];
}

function parseMode(value: string | undefined): 'auto' | RunMode {
  if (value === undefined || value === 'auto') {
    return 'auto';
  }
  if (!MODES.includes(value as RunMode)) {
    throw new Error('El valor de --mode solo admite "odd", "sdd" o "auto".');
  }
  return value as RunMode;
}

function effectiveVault(config: HarnessConfig, root: string): string {
  const configured = config.obsidianVaultPath.trim();
  return configured.length > 0 ? path.resolve(root, expandHome(configured)) : '';
}

function withVault(config: HarnessConfig, root: string): HarnessConfig {
  return { ...config, obsidianVaultPath: effectiveVault(config, root) };
}

function validationSummary(validation: ValidationResult): string {
  return validation.commands
    .map((command) => `${command.command} -> ${command.code === 0 ? 'OK' : `FALLO (${command.code})`}`)
    .join('; ');
}

function changesSummary(changes: Array<{ path: string; change: string }>): string {
  if (changes.length === 0) {
    return 'Sin cambios registrados.';
  }
  return changes.map((change) => `${change.path}: ${change.change}`).join('; ');
}

function riskSummary(risks: Array<{ title: string; description?: string }>): string {
  if (risks.length === 0) {
    return 'Sin riesgos detectados.';
  }
  return risks
    .map((risk) => (risk.description !== undefined ? `${risk.title} -> ${risk.description}` : risk.title))
    .join('; ');
}

function reportTasks(result: RunResult, exploration: Exploration | undefined): ReportTask[] {
  if (exploration === undefined || result.mode !== 'sdd') {
    return [];
  }
  return exploration.acceptance.map((criterion, index) => ({
    title: `${exploration.taskId ?? 'SDD'} · criterio ${index + 1}`,
    description: criterion,
    highlight: index < 3
  }));
}

function failureText(validation: ValidationResult): string {
  const failure = firstFailure(validation);
  if (failure === undefined) {
    return 'La validación falló sin un comando identificable.';
  }
  return [failure.stderr ?? '', failure.stdout ?? ''].filter((part) => part.trim().length > 0).join('\n');
}

function writeHalt(
  root: string,
  reason: HaltReason,
  context: {
    runId: string;
    mode: RunMode;
    taskId?: string;
    changes: Array<{ path: string; change: string }>;
    risks: Array<{ title: string; description?: string }>;
    logPath: string;
  }
): string {
  const target = path.join(root, LAYA_DIR, LAYA_HALT_FILENAME);
  writeJsonFileAtomic(target, {
    code: reason.code,
    message: redactSecrets(reason.message),
    ...(reason.detail !== undefined ? { detail: redactSecrets(reason.detail) } : {}),
    runId: context.runId,
    mode: context.mode,
    ...(context.taskId !== undefined ? { taskId: context.taskId } : {}),
    createdAt: new Date().toISOString(),
    changes: context.changes.map((change) => ({
      path: change.path,
      change: redactSecrets(change.change)
    })),
    risks: context.risks.map((risk) => ({
      title: redactSecrets(risk.title),
      ...(risk.description !== undefined ? { description: redactSecrets(risk.description) } : {})
    })),
    logPath: context.logPath
  });
  return target;
}

function closeObsidian(
  root: string,
  config: HarnessConfig,
  entry: {
    summary: string;
    task?: string;
    validation?: string;
    risks?: string;
    next?: string;
  }
): string | undefined {
  const vault = config.obsidianVaultPath.trim();
  if (vault.length === 0) {
    return undefined;
  }

  connectObsidianVault(root, vault);
  const notePath = getVaultNotePath(vault, inferProjectName(root));
  appendVaultNoteEntry(notePath, {
    ...entry,
    state: {
      objective: entry.summary,
      risks: entry.risks,
      next: entry.next
    }
  });
  return notePath;
}

function markOddDone(
  root: string,
  config: HarnessConfig,
  taskId: string | undefined,
  acceptance: string[]
): string | undefined {
  const notePath = resolveOddNote(root, config.obsidianVaultPath, taskId);
  if (notePath === undefined) {
    return undefined;
  }
  const note = readTextFile(notePath);
  const updated = markChecklistDone(note, acceptance);
  if (updated !== note) {
    writeTextFileAtomic(notePath, updated);
  }
  return notePath;
}

function completeTask(
  root: string,
  taskId: string | undefined,
  mode: RunMode,
  status: 'Done' | 'Failed'
): string | undefined {
  if (taskId === undefined || mode !== 'sdd') {
    return undefined;
  }
  const manifest = loadManifest(root);
  setTaskStatus(manifest, taskId, status);
  const item = manifest.specs
    .flatMap((spec) => spec.tasks.map((task) => ({ spec, task })))
    .find((candidate) => candidate.task.id === taskId);
  if (item !== undefined) {
    refreshSpecStatus(item.spec);
  }
  backupManifest(root);
  saveManifest(manifest, root);
  return taskId;
}

function printDryRun(
  stream: NodeJS.WriteStream,
  request: RunRequest,
  exploration: Exploration
): void {
  const lines = [
    '[alvaress] DRY-RUN',
    `Modo: ${exploration.mode}`,
    `Fuente: ${exploration.source}`,
    `Petición: ${request.request}`,
    `Tarea: ${exploration.taskId ?? request.taskId ?? '(auto)'}`,
    '',
    'Archivos:',
    ...(exploration.files.length > 0 ? exploration.files.map((file) => `- ${file}`) : ['- (sin archivos)']),
    '',
    'Criterios de aceptación:',
    ...(exploration.acceptance.length > 0
      ? exploration.acceptance.map((criterion) => `- ${criterion}`)
      : ['- (sin criterios)']),
    '',
    'Validación:',
    ...(exploration.validation.length > 0
      ? exploration.validation.map((command) => `- ${command}`)
      : ['- (sin comandos)']),
    '',
    'Aprendizajes relevantes:',
    ...(exploration.learnings.length > 0
      ? exploration.learnings.map((learning) => `- ${learning.id}: ${learning.title}`)
      : ['- (ninguno)']),
    '',
    'Riesgos:',
    ...(exploration.risks.length > 0
      ? exploration.risks.map((risk) => `- ${risk.title}`)
      : ['- (ninguno)']),
    '',
    'No se invocó al worker, no se hizo commit y no se escribió en Obsidian.'
  ];
  stream.write(`${lines.join('\n')}\n`);
}

export async function runHarnessCommand(
  args: string[],
  root: string = process.cwd(),
  deps: RunCommandDeps = {}
): Promise<number> {
  const stdout = deps.stdout ?? process.stdout;
  const { positional, flags } = parseArgs(args);

  if (flagEnabled(flags, 'help') || flagEnabled(flags, 'h')) {
    stdout.write(`${RUN_HELP}\n`);
    return 0;
  }

  if (flagEnabled(flags, 'inspect-last-run') || flagEnabled(flags, 'i')) {
    return inspectLastRun(root, stdout);
  }

  const taskId = flagValue(flags, 'task');
  const files = parseFileList(flagValue(flags, 'files'));
  const requestText = (flagValue(flags, 'request') ?? positional.join(' ')).trim();
  if (requestText.length === 0 && taskId === undefined) {
    throw new Error(
      'Uso: alvaress run "<petición>" [--task TASK_ID] [--files a.ts,b.ts] [--mode odd|sdd] [--dry-run] [--no-commit] [--no-learn]'
    );
  }

  const config = withVault(deps.config ?? loadConfig(root), root);
  const mode = parseMode(flagValue(flags, 'mode'));
  const request: RunRequest = {
    request: requestText.length > 0 ? requestText : `Completa la tarea ${taskId ?? ''}`.trim(),
    ...(taskId !== undefined ? { taskId } : {}),
    ...(files.length > 0 ? { files } : {}),
    mode,
    dryRun: flagEnabled(flags, 'dry-run'),
    commit: deps.commit !== false && !flagEnabled(flags, 'no-commit'),
    learn: !flagEnabled(flags, 'no-learn')
  };

  let lock: ProjectLock | undefined;
  if (deps.lock !== false) {
    lock = acquireProjectLock(root, {
      command: 'alvaress run',
      force: flagEnabled(flags, 'force')
    });
  }

  const log = new RunLog(root);
  const runId = createRunId();
  const startedAt = new Date();
  log.begin({
    command: 'alvaress run',
    request: request.request,
    runId,
    mode: request.mode ?? 'auto'
  });

  let reportTaskId = request.taskId;

  const persistReport = (result: RunResult): void => {
    try {
      const finishedAt = new Date();
      writeHarnessRunReport(root, {
        id: result.runId,
        command: 'run',
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        state: result.state,
        mode: result.mode,
        request: redactSecrets(request.request),
        ...(reportTaskId !== undefined ? { taskId: reportTaskId } : {}),
        changes: result.changes.map((change) => ({
          path: change.path,
          change: redactSecrets(change.change),
          ...(change.kind !== undefined ? { kind: change.kind } : {})
        })),
        risks: result.risks.map((risk) => ({
          title: redactSecrets(risk.title),
          ...(risk.description !== undefined ? { description: redactSecrets(risk.description) } : {}),
          source: risk.source,
          ...(risk.severity !== undefined ? { severity: risk.severity } : {})
        })),
        validation: {
          ok: result.validation.ok,
          commands: result.validation.commands.map((command) => ({
            command: redactSecrets(command.command),
            code: command.code,
            ...(command.stdout !== undefined ? { stdout: redactSecrets(command.stdout) } : {}),
            ...(command.stderr !== undefined ? { stderr: redactSecrets(command.stderr) } : {})
          })),
          warnings: result.validation.warnings.map((warning) => redactSecrets(warning))
        },
        ...(result.commit !== undefined
          ? {
              commit: {
                ...result.commit,
                ...(result.commit.message !== undefined
                  ? { message: redactSecrets(result.commit.message) }
                  : {}),
                files: result.commit.files.map((file) => redactSecrets(file))
              }
            }
          : {}),
        ...(result.halt !== undefined
          ? {
              halt: {
                code: result.halt.code,
                message: redactSecrets(result.halt.message),
                ...(result.halt.detail !== undefined ? { detail: redactSecrets(result.halt.detail) } : {})
              }
            }
          : {}),
        logPath: result.logPath
      });
    } catch (error) {
      log.text('Reporte', `No se pudo escribir el reporte JSON: ${errorMessage(error)}`);
    }
  };

  let decisions: DecisionEngine | undefined;
  let worker: Worker | undefined;
  const ui = deps.ui ?? new StatusLine({ stream: stdout });

  try {
    decisions =
      deps.decisions ??
      (config.laya?.enabled === false
        ? new HeuristicDecisionEngine()
        : await createDecisionEngine({
            root,
            config: config.laya ?? {
              enabled: false,
              device: 'cpu',
              timeoutMs: 30_000,
              fallbackToHeuristic: true
            }
          }));

    if (request.dryRun === true) {
      ui.start('Exploring');
      let exploration: Exploration | undefined;
      try {
        const requestedMode = request.mode !== undefined && request.mode !== 'auto' ? request.mode : undefined;
        const route = await decisions.route({
          request: request.request,
          mode: requestedMode ?? 'auto',
          ...(request.files !== undefined ? { files: request.files } : {})
        });
        const effectiveRoute: RouteDecision =
          requestedMode !== undefined ? { ...route, mode: requestedMode } : route;
        exploration = await exploreRequest(request, effectiveRoute, { root, config, log });
      } finally {
        ui.stop();
      }

      if (exploration === undefined) {
        throw new Error('La exploración no devolvió un resultado.');
      }

      reportTaskId = exploration.taskId ?? request.taskId;
      log.text('Dry-run', JSON.stringify({ request, exploration }, null, 2));

      if (exploration.blockedBy !== undefined) {
        const halted: RunResult = {
          runId,
          state: 'Halted',
          mode: exploration.mode,
          changes: [],
          risks: exploration.risks,
          validation: { ok: true, commands: [], warnings: [] },
          halt: {
            code: 'scope',
            message: 'La exploración no pudo cerrar el alcance.',
            detail: exploration.blockedBy
          },
          logPath: log.relativePath
        };
        log.finish(halted);
        persistReport(halted);
        printFinalReport(finalReportFromRun(halted, []), { stream: stdout });
        return 1;
      }

      printDryRun(stdout, request, exploration);
      const dryRunResult: RunResult = {
        runId,
        state: 'Ready',
        mode: exploration.mode,
        changes: [],
        risks: exploration.risks,
        validation: { ok: true, commands: [], warnings: [] },
        logPath: log.relativePath
      };
      log.finish(dryRunResult);
      persistReport(dryRunResult);
      return 0;
    }

    worker = deps.worker ?? createWorker({ root, config, log, ...(deps.env !== undefined ? { env: deps.env } : {}) });

    let exploration: Exploration | undefined;
    let lastFix: { command: string; error: string } | undefined;
    let workStarted = false;
    const accumulatedChanges: FileChange[] = [];
    const accumulatedRisks: Risk[] = [];

    const handlers: HarnessHandlers = {
      async explore(current, route): Promise<Exploration> {
        const result = await exploreRequest(current, route, { root, config, log });
        exploration = result;
        reportTaskId = result.taskId ?? current.taskId;
        accumulatedRisks.push(...result.risks);
        log.section('Exploración');
        log.text('Fuente', result.source);
        log.text('Archivos', result.files.join('\n') || '(sin archivos)');
        log.text('Aceptación', result.acceptance.join('\n') || '(sin criterios)');
        log.text('Validación', result.validation.join('\n') || '(sin comandos)');
        if (result.blockedBy !== undefined) {
          log.text('Bloqueo', result.blockedBy);
        }
        return result;
      },

      async work(plan: WorkPlan): Promise<WorkResult> {
        workStarted = true;
        log.section('Plan de trabajo');
        log.text('Plan', JSON.stringify(plan, null, 2));
        const result = await worker?.work(plan);
        if (result === undefined) {
          return { status: 'failed', changes: [], risks: [], detail: 'No hay worker configurado.' };
        }
        accumulatedChanges.push(...result.changes);
        accumulatedRisks.push(...result.risks);
        log.text(
          'Resultado del worker',
          `${result.status}\n${changesSummary(result.changes)}\n${riskSummary(result.risks)}`
        );
        return result;
      },

      async check(work: WorkResult): Promise<ValidationResult> {
        const commands =
          exploration !== undefined && exploration.validation.length > 0
            ? exploration.validation
            : config.validation.commands;
        const validator = new CommandValidator({
          root,
          config,
          commands,
          log,
          ...(deps.env !== undefined ? { env: deps.env } : {})
        });
        const result = await validator.validate(work.changes.map((change) => change.path));
        log.text('Validación', validationSummary(result) || '(sin comandos)');
        return result;
      },

      async fix(failure: ValidationResult, attempt: number, work: WorkResult): Promise<FixResult> {
        const first = firstFailure(failure);
        lastFix = {
          command: first?.command ?? 'validación',
          error: failureText(failure)
        };
        const scopeFiles =
          exploration !== undefined && exploration.files.length > 0
            ? exploration.files
            : work.changes.map((change) => change.path);
        const result = await worker?.fix({
          runId,
          attempt,
          files: scopeFiles,
          failure,
          error: failureText(failure)
        });
        if (result === undefined) {
          return {
            verdict: 'needs-orchestrator',
            changes: [],
            cause: 'No hay worker configurado para reparar.',
            risks: []
          };
        }
        accumulatedChanges.push(...result.changes);
        accumulatedRisks.push(...result.risks);
        log.text('Reparación', `${result.verdict}: ${result.cause}`);
        return result;
      },

      async ready(input: ReadyInput): Promise<ReadyResult> {
        const risks = [...input.risks];
        const effectiveTaskId = input.exploration.taskId ?? input.request.taskId;

        try {
          completeTask(root, effectiveTaskId, input.mode, 'Done');
        } catch (error) {
          risks.push({
            title: `No se pudo actualizar ${OPENSPEC_FILENAME}: ${errorMessage(error)}`,
            source: 'harness',
            severity: 'medium'
          });
        }

        if (input.mode === 'odd') {
          try {
            markOddDone(root, config, effectiveTaskId, input.exploration.acceptance);
          } catch (error) {
            risks.push({
              title: `No se pudo marcar el checklist ODD: ${errorMessage(error)}`,
              source: 'harness',
              severity: 'low'
            });
          }
        }

        let commit: CommitResult | undefined;
        if (input.request.commit !== false) {
          const result = commitRun({
            root,
            files: input.changes.map((change) => change.path),
            extraFiles: [OPENSPEC_FILENAME],
            request: input.request.request,
            ...(effectiveTaskId !== undefined ? { taskId: effectiveTaskId } : {}),
            mode: input.mode,
            noVerify: deps.noVerify === true
          });
          commit = result;
          log.text(
            'Commit',
            result.committed
              ? `${result.sha ?? 'creado'} (${result.files.length} archivo(s))`
              : (result.message ?? 'no realizado')
          );
          if (!result.committed && result.files.length > 0) {
            risks.push({
              title: `El commit automático no se completó: ${result.message ?? 'sin detalle'}`,
              source: 'harness',
              severity: 'medium'
            });
          }
        }

        try {
          const note = closeObsidian(root, config, {
            summary: `${input.mode.toUpperCase()} ${runId}: ${changesSummary(input.changes)}`,
            ...(effectiveTaskId !== undefined ? { task: effectiveTaskId } : {}),
            validation: validationSummary(input.validation) || 'sin comandos',
            risks: riskSummary(risks),
            next: 'Sin pendientes.'
          });
          if (note !== undefined) {
            log.text('Obsidian', note);
          }
        } catch (error) {
          risks.push({
            title: `No se pudo cerrar la nota de Obsidian: ${errorMessage(error)}`,
            source: 'harness',
            severity: 'low'
          });
        }

        if (input.request.learn !== false) {
          const stores = getMemoryStores(root);
          for (const learning of input.exploration.learnings) {
            try {
              recordScopedLearningUse(learning.id, stores);
            } catch {
              // Un aprendizaje eliminado no debe bloquear el cierre.
            }
          }

          if (lastFix !== undefined) {
            try {
              const project = inferProjectName(root);
              const title = `Fallo de ${lastFix.command} reparado en ${project}`.slice(0, 120);
              const body = `El comando ${lastFix.command} falló durante el run ${runId} y se reparó con un cambio acotado. Error inicial: ${lastFix.error.slice(0, 600)}`;
              const tags = ['validacion', input.mode];
              const scopeDecision =
                decisions !== undefined
                  ? await decisions.decideLearningScope({
                      kind: 'pitfall',
                      title,
                      body,
                      tags,
                      project
                    })
                  : {
                      scope: 'project' as const,
                      confidence: 0.5,
                      reason: 'Sin motor de decisión; se guarda en el proyecto.',
                      source: 'heuristic' as const
                    };
              const target =
                scopeDecision.scope === 'global' ? stores.global : stores.project;
              addLearning(
                {
                  kind: 'pitfall',
                  title,
                  body,
                  tags,
                  project,
                  source: runId
                },
                target
              );
              rebuildPlaybook(
                target,
                scopeDecision.scope === 'global'
                  ? loadScopedLearnings(stores, 'global')
                  : loadScopedLearnings(stores, 'all'),
                new Date(),
                scopeDecision.scope
              );
              log.text(
                'Aprendizaje',
                `Fallo reparado guardado como pitfall en el store ${scopeDecision.scope} (${scopeDecision.source}).`
              );
            } catch (error) {
              log.text('Aprendizaje', `Omitido: ${errorMessage(error)}`);
            }
          }
        }

        return {
          changes: input.changes,
          risks,
          ...(commit !== undefined ? { commit } : {}),
          logPath: log.relativePath
        };
      },

      async halt(reason: HaltReason): Promise<void> {
        const effectiveTaskId = exploration?.taskId ?? request.taskId;
        try {
          const target = writeHalt(root, reason, {
            runId,
            mode: exploration?.mode ?? (request.mode === 'sdd' ? 'sdd' : 'odd'),
            ...(effectiveTaskId !== undefined ? { taskId: effectiveTaskId } : {}),
            changes: accumulatedChanges,
            risks: accumulatedRisks,
            logPath: log.relativePath
          });
          log.text('HALT', `${reason.code}: ${reason.message}\n${target}`);
        } catch (error) {
          log.text('HALT', `No se pudo escribir el HALT: ${errorMessage(error)}`);
        }

        if (workStarted) {
          try {
            completeTask(
              root,
              effectiveTaskId,
              exploration?.mode ?? (request.mode === 'sdd' ? 'sdd' : 'odd'),
              'Failed'
            );
          } catch {
            // El HALT no debe fallar por un manifiesto inválido.
          }
        }

        try {
          closeObsidian(root, config, {
            summary: `HALTED ${reason.code}: ${reason.message}`,
            ...(effectiveTaskId !== undefined ? { task: effectiveTaskId } : {}),
            ...(reason.detail !== undefined ? { risks: reason.detail } : {}),
            next: 'Revisar el log y decidir si se reintenta.'
          });
        } catch {
          // La nota es un espejo; su fallo no cambia el HALT.
        }
      },

      async close(): Promise<void> {
        await worker?.close?.();
      }
    };

    const core = new HarnessCore({
      handlers,
      decisions,
      ui,
      runId: () => runId,
      logPath: log.relativePath
    });

    const result = await core.run(request);
    log.finish(result);
    persistReport(result);
    printFinalReport(finalReportFromRun(result, reportTasks(result, exploration)), { stream: stdout });
    return result.state === 'Ready' ? 0 : 1;
  } finally {
    try {
      await decisions?.close?.();
    } catch {
      // El cierre del motor no debe romper el comando.
    }
    lock?.release();
  }
}
