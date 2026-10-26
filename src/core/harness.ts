import { DEFAULT_MAX_FIX_ATTEMPTS, LAYA_LOG_PATH } from '../constants.js';
import { errorMessage } from '../utils/errors.js';
import type {
  DecisionEngine,
  Exploration,
  FileChange,
  HaltCode,
  HaltReason,
  HarnessHandlers,
  HarnessUI,
  Risk,
  RouteDecision,
  RunMode,
  RunRequest,
  RunResult,
  ValidationCommandResult,
  ValidationResult,
  WorkPlan
} from './contracts.js';

export interface HarnessCoreOptions {
  handlers: HarnessHandlers;
  decisions: DecisionEngine;
  ui: HarnessUI;
  maxFixAttempts?: number;
  runId?: () => string;
  logPath?: string;
}

export function emptyValidation(): ValidationResult {
  return { ok: true, commands: [], warnings: [] };
}

export function firstFailure(validation: ValidationResult): ValidationCommandResult | undefined {
  return validation.commands.find((command) => command.code !== 0);
}

export function mergeChanges(...groups: FileChange[][]): FileChange[] {
  const byPath = new Map<string, FileChange>();
  for (const group of groups) {
    for (const change of group) {
      byPath.set(change.path, change);
    }
  }
  return [...byPath.values()];
}

export function mergeRisks(...groups: Risk[][]): Risk[] {
  const seen = new Set<string>();
  const result: Risk[] = [];
  for (const group of groups) {
    for (const risk of group) {
      const key = `${risk.source}:${risk.title}:${risk.description ?? ''}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(risk);
    }
  }
  return result;
}

export function warningsToRisks(warnings: string[]): Risk[] {
  return warnings.map((warning) => ({
    title: warning,
    source: 'linter',
    severity: 'low'
  }));
}

export function createRunId(now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `run-${stamp}-${Math.random().toString(36).slice(2, 8)}`;
}

export class HarnessCore {
  private readonly handlers: HarnessHandlers;
  private readonly decisions: DecisionEngine;
  private readonly ui: HarnessUI;
  private readonly maxFixAttempts: number;
  private readonly nextRunId: () => string;
  private readonly logPath: string;

  constructor(options: HarnessCoreOptions) {
    this.handlers = options.handlers;
    this.decisions = options.decisions;
    this.ui = options.ui;
    this.maxFixAttempts = options.maxFixAttempts ?? DEFAULT_MAX_FIX_ATTEMPTS;
    this.nextRunId = options.runId ?? (() => createRunId());
    this.logPath = options.logPath ?? LAYA_LOG_PATH;
  }

  async run(request: RunRequest): Promise<RunResult> {
    const runId = this.nextRunId();
    const changes: FileChange[] = [];
    const risks: Risk[] = [];
    let validation = emptyValidation();
    let mode: RunMode = request.mode === 'sdd' ? 'sdd' : 'odd';
    let exploration: Exploration | undefined;

    this.ui.start('Exploring');

    try {
      const requestedMode = request.mode !== undefined && request.mode !== 'auto' ? request.mode : undefined;
      const route = this.applyRequestedMode(
        await this.decisions.route({
          request: request.request,
          mode: requestedMode ?? 'auto',
          files: request.files
        }),
        requestedMode
      );
      mode = route.mode;

      exploration = await this.handlers.explore(request, route);
      risks.push(...exploration.risks);

      if (exploration.blockedBy !== undefined) {
        return await this.halt('scope', 'La exploración no pudo cerrar el alcance.', {
          runId,
          mode,
          changes,
          risks,
          validation,
          detail: exploration.blockedBy
        });
      }

      const plan = this.toWorkPlan(runId, request, route, exploration);

      this.ui.setState('Working');
      const work = await this.handlers.work(plan);
      changes.push(...work.changes);
      risks.push(...work.risks);

      if (work.status === 'blocked') {
        return await this.halt('scope', 'El worker no pudo completar el alcance.', {
          runId,
          mode,
          changes,
          risks,
          validation,
          detail: work.blockedBy ?? work.detail
        });
      }
      if (work.status === 'failed') {
        return await this.halt('worker', 'El worker falló antes de validar.', {
          runId,
          mode,
          changes,
          risks,
          validation,
          detail: work.detail
        });
      }
      if (work.changes.length === 0) {
        return await this.halt('empty-diff', 'El run terminó sin cambios en el workspace.', {
          runId,
          mode,
          changes,
          risks,
          validation
        });
      }

      this.ui.setState('Checking');
      validation = await this.handlers.check(work);
      risks.push(...warningsToRisks(validation.warnings));

      let attempt = 0;
      while (!validation.ok) {
        const failure = firstFailure(validation);
        if (failure === undefined) {
          return await this.halt('validation', 'La validación falló sin un comando identificable.', {
            runId,
            mode,
            changes,
            risks,
            validation
          });
        }

        const verdict = await this.decisions.classifyFailure({
          command: failure.command,
          exitCode: failure.code,
          error: failure.stderr ?? failure.stdout ?? '',
          attempt: attempt + 1
        });

        if (verdict.nuclear) {
          return await this.halt('nuclear', 'Laya detectó un fallo nuclear de arquitectura.', {
            runId,
            mode,
            changes,
            risks,
            validation,
            detail: verdict.reason
          });
        }

        if (attempt >= this.maxFixAttempts) {
          return await this.halt(
            'validation',
            `La validación sigue fallando tras ${this.maxFixAttempts} intento(s) de reparación.`,
            { runId, mode, changes, risks, validation }
          );
        }

        attempt += 1;
        this.ui.setState('Fixing');
        const fix = await this.handlers.fix(validation, attempt, work);
        changes.push(...fix.changes);
        risks.push(...fix.risks);

        if (fix.verdict === 'nuclear') {
          return await this.halt('nuclear', 'El reparador detectó un fallo nuclear.', {
            runId,
            mode,
            changes,
            risks,
            validation,
            detail: fix.cause
          });
        }
        if (fix.verdict === 'needs-orchestrator') {
          return await this.halt('scope', 'La reparación requiere una decisión del orquestador.', {
            runId,
            mode,
            changes,
            risks,
            validation,
            detail: fix.cause
          });
        }

        this.ui.setState('Checking');
        validation = await this.handlers.check(work);
        risks.push(...warningsToRisks(validation.warnings));
      }

      this.ui.setState('Ready');
      const ready = await this.handlers.ready({
        runId,
        mode,
        request,
        exploration,
        changes: mergeChanges(changes),
        risks: mergeRisks(risks),
        validation
      });

      return {
        runId,
        state: 'Ready',
        mode,
        changes: ready.changes ?? mergeChanges(changes),
        risks: ready.risks ?? mergeRisks(risks),
        validation,
        ...(ready.commit !== undefined ? { commit: ready.commit } : {}),
        logPath: ready.logPath ?? this.logPath
      };
    } catch (error) {
      return await this.halt('tool', 'El run se detuvo por un error inesperado.', {
        runId,
        mode,
        changes,
        risks,
        validation,
        detail: errorMessage(error)
      });
    } finally {
      this.ui.stop();
      await this.closeQuietly();
    }
  }

  private applyRequestedMode(route: RouteDecision, requestedMode: RunMode | undefined): RouteDecision {
    if (requestedMode === undefined) {
      return route;
    }
    return { ...route, mode: requestedMode };
  }

  private toWorkPlan(
    runId: string,
    request: RunRequest,
    route: RouteDecision,
    exploration: Exploration
  ): WorkPlan {
    return {
      runId,
      mode: route.mode,
      request: request.request,
      ...(request.taskId !== undefined || exploration.taskId !== undefined
        ? { taskId: request.taskId ?? exploration.taskId }
        : {}),
      source: exploration.source,
      acceptance: exploration.acceptance,
      files: exploration.files,
      validation: exploration.validation,
      learnings: exploration.learnings
    };
  }

  private async halt(
    code: HaltCode,
    message: string,
    context: {
      runId: string;
      mode: RunMode;
      changes: FileChange[];
      risks: Risk[];
      validation: ValidationResult;
      detail?: string;
    }
  ): Promise<RunResult> {
    const reason: HaltReason = {
      code,
      message,
      ...(context.detail !== undefined ? { detail: context.detail } : {})
    };

    this.ui.setState('Halted');
    try {
      await this.handlers.halt(reason);
    } catch {
      // El HALT no debe romper el cierre del run.
    }

    return {
      runId: context.runId,
      state: 'Halted',
      mode: context.mode,
      changes: mergeChanges(context.changes),
      risks: mergeRisks(context.risks),
      validation: context.validation,
      halt: reason,
      logPath: this.logPath
    };
  }

  private async closeQuietly(): Promise<void> {
    try {
      await this.handlers.close?.();
    } catch {
      // El cierre no debe enmascarar el resultado del run.
    }
    try {
      await this.decisions.close?.();
    } catch {
      // El motor es opcional en tests y en el modo heurístico.
    }
  }
}
