import path from 'node:path';
import type { HarnessConfig } from '../config/loader.js';
import type {
  FileChange,
  FixInput,
  FixResult,
  Risk,
  WorkPlan,
  WorkResult,
  Worker
} from '../core/contracts.js';
import { heuristicVerdict } from '../decision/heuristics.js';
import { pathExists } from '../utils/fs.js';
import { runCommand } from '../utils/process.js';
import type { CommandResult } from '../utils/process.js';
import { buildAiderEnv, runAider } from './aider.js';
import { diffSnapshots, scopeRisks, snapshotWorkspace } from './diff.js';
import type { RunLog } from './run-log.js';

const DEFAULT_WORKER_TIMEOUT_MS = 10 * 60 * 1000;
const IMPLEMENTER_AGENT = 'alvaress-implementer';
const IMPLEMENTER_LITE_AGENT = 'alvaress-implementer-lite';
const FIXER_AGENT = 'alvaress-fixer';

/** Sesión estable por run para reutilizar prompt, skills y archivos leídos. */
export function subagentSessionId(runId: string): string {
  return `ses_alvaress${runId.replace(/[^a-zA-Z0-9]/g, '')}`;
}

function implementerAgent(complexity: WorkPlan['complexity']): string {
  return complexity === 'trivial' || complexity === 'small'
    ? IMPLEMENTER_LITE_AGENT
    : IMPLEMENTER_AGENT;
}

export interface WorkerOptions {
  root: string;
  config: HarnessConfig;
  log?: RunLog;
  env?: NodeJS.ProcessEnv;
}

function list(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- (sin elementos)';
}

export function buildWorkMessage(plan: WorkPlan): string {
  return [
    'Implementa el cambio solicitado por el arnés alvaress.',
    '',
    `Modo: ${plan.mode}`,
    ...(plan.complexity !== undefined ? [`Complejidad: ${plan.complexity}`] : []),
    `Run: ${plan.runId}`,
    ...(plan.taskId !== undefined ? [`Tarea: ${plan.taskId}`] : []),
    `Fuente: ${plan.source}`,
    '',
    'Petición:',
    plan.request,
    '',
    'Criterios de aceptación:',
    list(plan.acceptance),
    '',
    'Archivos permitidos (alcance cerrado):',
    list(plan.files),
    '',
    'Validación obligatoria:',
    list(plan.validation),
    '',
    'Aprendizajes relevantes:',
    list(plan.learnings.map((learning) => `${learning.id}: ${learning.title}`)),
    '',
    'Reglas:',
    '- No toques archivos fuera del alcance permitido.',
    '- No ejecutes git commit ni git push.',
    '- No escribas en la bóveda Obsidian.',
    '- No agregues comentarios al código: cero explicaciones, separadores, TODO/FIXME o JSDoc de relleno. Conserva los comentarios existentes.',
    '- Devuelve un resumen breve de los archivos modificados.'
  ].join('\n');
}

export function buildFixMessage(input: FixInput): string {
  const failure = input.failure.commands.find((command) => command.code !== 0);
  const output = [failure?.stdout ?? '', failure?.stderr ?? '', input.error]
    .filter((part) => part.trim().length > 0)
    .join('\n');

  return [
    `Repara el fallo de validación del run ${input.runId} (intento ${input.attempt}).`,
    '',
    `Comando fallido: ${failure?.command ?? input.error}`,
    `Código de salida: ${failure?.code ?? 1}`,
    '',
    'Error exacto:',
    output.slice(0, 12_000),
    '',
    'Archivos del alcance:',
    list(input.files),
    '',
    'Reglas:',
    '- Corrige la causa, no silencies el error.',
    '- No agregues comentarios al código: cero explicaciones, separadores, TODO/FIXME o JSDoc de relleno. Conserva los comentarios existentes.',
    '- No toques tests ni archivos fuera del alcance salvo que el error lo exija.',
    '- No ejecutes git commit ni git push.',
    '- No escribas en la bóveda Obsidian.'
  ].join('\n');
}

function existingFiles(root: string, files: string[]): string[] {
  return files.filter((file) => pathExists(path.join(root, file)));
}

function taskDocument(plan: WorkPlan): string[] {
  if (plan.taskId === undefined) {
    return [];
  }
  const target = path.join('.harness', 'tasks', `${plan.taskId}.md`);
  return [target];
}

function commandDetail(result: CommandResult): string {
  if (result.error !== undefined && result.error.length > 0) {
    return result.error;
  }
  const output = [result.stderr.trim(), result.stdout.trim()].filter((part) => part.length > 0).join('\n');
  return output.length > 0 ? output.slice(-4000) : `El worker terminó con código ${result.code}.`;
}

function fixVerdict(
  result: CommandResult,
  input: FixInput,
  changes: FileChange[]
): { verdict: FixResult['verdict']; cause: string } {
  if (result.code === 0) {
    if (changes.length === 0) {
      return {
        verdict: 'needs-orchestrator',
        cause: 'El reparador terminó sin cambios; la validación volvería a fallar.'
      };
    }
    return { verdict: 'fixed', cause: 'El reparador aplicó cambios locales.' };
  }

  const failure = input.failure.commands.find((command) => command.code !== 0);
  const verdict = heuristicVerdict({
    command: failure?.command ?? 'validación',
    exitCode: result.code,
    error: commandDetail(result),
    attempt: input.attempt
  });

  return verdict.nuclear
    ? { verdict: 'nuclear', cause: verdict.reason }
    : { verdict: 'needs-orchestrator', cause: verdict.reason };
}

export class AiderWorker implements Worker {
  readonly kind = 'aider' as const;
  private readonly root: string;
  private readonly config: HarnessConfig;
  private readonly log: RunLog | undefined;
  private readonly env: NodeJS.ProcessEnv | undefined;

  constructor(options: WorkerOptions) {
    this.root = options.root;
    this.config = options.config;
    this.log = options.log;
    this.env = options.env;
  }

  async work(plan: WorkPlan): Promise<WorkResult> {
    const before = snapshotWorkspace(this.root, plan.files);
    const run = await runAider(this.config.models.aiderImplementer.modelName, {
      message: buildWorkMessage(plan),
      files: existingFiles(this.root, plan.files),
      readFiles: existingFiles(this.root, taskDocument(plan)),
      cwd: this.root,
      env: { ...buildAiderEnv(this.config), ...this.env },
      inherit: false,
      timeoutMs: this.config.aider?.timeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS,
      extraArgs: this.config.aider?.extraArgs
    });
    const after = snapshotWorkspace(this.root, plan.files);
    const changes = diffSnapshots(before, after, 'Aider');
    const risks = scopeRisks(plan.files, changes, this.config.scope ?? 'warn');
    this.log?.command('aider', run);

    if (run.code !== 0) {
      return { status: 'failed', changes, risks, detail: commandDetail(run) };
    }
    return { status: 'done', changes, risks };
  }

  async fix(input: FixInput): Promise<FixResult> {
    const before = snapshotWorkspace(this.root, input.files);
    const run = await runAider(this.config.models.aiderImplementer.modelName, {
      message: buildFixMessage(input),
      files: existingFiles(this.root, input.files),
      cwd: this.root,
      env: { ...buildAiderEnv(this.config), ...this.env },
      inherit: false,
      timeoutMs: this.config.aider?.timeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS,
      extraArgs: this.config.aider?.extraArgs
    });
    const after = snapshotWorkspace(this.root, input.files);
    const changes = diffSnapshots(before, after, 'Aider');
    const risks = scopeRisks(input.files, changes, this.config.scope ?? 'warn');
    const verdict = fixVerdict(run, input, changes);
    this.log?.command('aider (reparación)', run);

    return { ...verdict, changes, risks };
  }
}

export class SubagentWorker implements Worker {
  readonly kind = 'subagent' as const;
  private readonly root: string;
  private readonly config: HarnessConfig;
  private readonly log: RunLog | undefined;
  private readonly env: NodeJS.ProcessEnv | undefined;

  constructor(options: WorkerOptions) {
    this.root = options.root;
    this.config = options.config;
    this.log = options.log;
    this.env = options.env;
  }

  async work(plan: WorkPlan): Promise<WorkResult> {
    return this.invoke(
      implementerAgent(plan.complexity),
      buildWorkMessage(plan),
      plan.files,
      'subagente',
      plan.runId
    );
  }

  async fix(input: FixInput): Promise<FixResult> {
    const before = snapshotWorkspace(this.root, input.files);
    const run = await this.runOpenCode(FIXER_AGENT, buildFixMessage(input), input.runId);
    const after = snapshotWorkspace(this.root, input.files);
    const changes = diffSnapshots(before, after, 'El subagente');
    const risks = scopeRisks(input.files, changes, this.config.scope ?? 'warn');
    const verdict = fixVerdict(run, input, changes);
    return { ...verdict, changes, risks };
  }

  private async invoke(
    agent: string,
    message: string,
    files: string[],
    label: string,
    runId: string
  ): Promise<WorkResult> {
    const before = snapshotWorkspace(this.root, files);
    const run = await this.runOpenCode(agent, message, runId);
    const after = snapshotWorkspace(this.root, files);
    const changes = diffSnapshots(before, after, 'El subagente');
    const risks: Risk[] = scopeRisks(files, changes, this.config.scope ?? 'warn');

    if (run.code !== 0) {
      return {
        status: 'failed',
        changes,
        risks,
        detail: `El ${label} ${agent} falló: ${commandDetail(run)}`
      };
    }

    return { status: 'done', changes, risks };
  }

  private async runOpenCode(
    agent: string,
    message: string,
    runId: string
  ): Promise<CommandResult> {
    const model = this.config.models.subagents.modelName.trim();
    const session = subagentSessionId(runId);
    const result = await runCommand(
      'opencode',
      [
        'run',
        '--agent',
        agent,
        '--auto',
        '--format',
        'json',
        ...(model.length > 0 ? ['--model', model] : []),
        '--session',
        session,
        '--title',
        `alvaress ${runId}`,
        message
      ],
      {
        cwd: this.root,
        env: this.env ?? process.env,
        timeout: this.config.aider?.timeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024
      }
    );
    this.log?.command(
      `opencode run --agent ${agent}${model.length > 0 ? ` --model ${model}` : ''} --session ${session}`,
      result
    );
    return result;
  }
}

export function createWorker(options: WorkerOptions): Worker {
  return options.config.aider?.enabled === true
    ? new AiderWorker(options)
    : new SubagentWorker(options);
}

export function workerSource(worker: Worker): string {
  return worker.kind === 'aider' ? 'Aider' : 'subagentes de OpenCode';
}
