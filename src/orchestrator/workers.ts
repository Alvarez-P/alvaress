import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_WORKER_TIMEOUT_MS } from '../constants.js';
import type { HarnessConfig } from '../config/loader.js';
import type {
  ConsultInput,
  FileChange,
  FixInput,
  FixResult,
  Risk,
  RunUsage,
  SpecialistBrief,
  SpecialistRole,
  UsagePhase,
  WorkPlan,
  WorkResult,
  Worker
} from '../core/contracts.js';
import { heuristicVerdict } from '../decision/heuristics.js';
import { runCommand } from '../utils/process.js';
import type { CommandResult, RunOptions } from '../utils/process.js';
import { auditWorkspace, snapshotFileContents } from './audit.js';
import type { FileContents } from './audit.js';
import { diffSnapshots, scopeRisks, snapshotWorkspace } from './diff.js';
import { workingTreeDiff, workingTreeStat } from './git-diff.js';
import { changedFiles } from './scope.js';
import type { RunLog } from './run-log.js';
import { UsageLedger, formatUsage, parseOpencodeOutput } from './usage.js';
import type { OpencodeOutput } from './usage.js';

const MAX_INLINE_FILE_BYTES = 8_000;
const MAX_INLINE_TOTAL_BYTES = 16_000;
const IMPLEMENTER_AGENT = 'alvaress-implementer';
const IMPLEMENTER_LITE_AGENT = 'alvaress-implementer-lite';
const FIXER_AGENT = 'alvaress-fixer';
const MAX_BRIEF_CHARS = 3_000;
const DOCS_REQUEST = /\b(?:jsdoc|tsdoc|docstrings?|document[ae]\w*)\b/i;
const FAST_CHECK_PATTERN = /\b(?:vp\s+check|tsc|oxlint|eslint)\b/i;

export function fastCheckCommand(commands: readonly string[]): string | undefined {
  return commands.find((command) => FAST_CHECK_PATTERN.test(command));
}

/** La petición pide documentar el código: los bloques JSDoc dejan de bloquear. */
export function docsRequested(plan: Pick<WorkPlan, 'request' | 'acceptance'>): boolean {
  return [plan.request, ...plan.acceptance].some((text) => DOCS_REQUEST.test(text));
}

const SPECIALIST_AGENTS: Record<SpecialistRole, string> = {
  researcher: 'alvaress-researcher',
  architect: 'alvaress-architect',
  designer: 'alvaress-designer',
  tester: 'alvaress-tester',
  reviewer: 'alvaress-reviewer'
};

const SPECIALIST_FOCUS: Record<SpecialistRole, string> = {
  researcher: 'Resuelve solo las dudas técnicas con evidencia y fuentes; no instales nada.',
  architect: 'Decide límites, contratos, datos y orden de implementación; no escribas código.',
  designer: 'Define layout, componentes, tokens, estados, responsive y accesibilidad.',
  tester: 'Diseña casos given/when/then y el diagnóstico esperado; no cambies aserciones.',
  reviewer: 'Revisa el diff contra la spec y los estándares; prioriza blockers accionables.'
};

/**
 * Sesión estable por run: el implementer y el fixer la comparten para reutilizar
 * los archivos ya leídos. Cada especialista usa la suya (`scope`), porque una
 * sesión de OpenCode reenvía todo su historial y el implementer pagaría de nuevo
 * cada consulta previa; los briefs ya le llegan recortados en el mensaje.
 */
export function subagentSessionId(runId: string, scope?: string): string {
  const id = scope !== undefined ? `${runId}-${scope}` : runId;
  return `ses_alvaress${id.replace(/[^a-zA-Z0-9]/g, '')}`;
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

export interface WorkMessageOptions {
  root?: string;
  inlineContext?: boolean;
  diff?: string;
  stat?: string;
  selfCheck?: string;
}

/**
 * Incluye el contenido de los archivos del alcance para que el subagente no
 * gaste una llamada leyéndolos. Solo aplica a archivos pequeños: si el archivo
 * supera el límite, el agente lo leerá con la herramienta `read`.
 */
function inlineSections(root: string, files: string[]): string[] {
  const base = path.resolve(root);
  const sections: string[] = [];
  const seen = new Set<string>();
  let total = 0;

  for (const file of files) {
    const full = path.resolve(base, file);
    if (full !== base && !full.startsWith(`${base}${path.sep}`)) {
      continue;
    }
    if (seen.has(full)) {
      continue;
    }
    seen.add(full);

    try {
      const stats = fs.lstatSync(full);
      if (!stats.isFile() || stats.size > MAX_INLINE_FILE_BYTES) {
        continue;
      }
      if (total + stats.size > MAX_INLINE_TOTAL_BYTES) {
        continue;
      }
      const content = fs.readFileSync(full, 'utf-8').trimEnd();
      if (content.includes('\0')) {
        continue;
      }
      sections.push(`### ${file}\n\`\`\`\n${content}\n\`\`\``);
      total += stats.size;
    } catch {
      // El archivo aún no existe o no se puede leer: el agente lo resolverá.
    }
  }

  return sections;
}

export function buildWorkMessage(plan: WorkPlan, options: WorkMessageOptions = {}): string {
  const inline =
    options.inlineContext === true && options.root !== undefined
      ? inlineSections(options.root, [plan.source, ...plan.files])
      : [];

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
    ...(plan.briefs !== undefined && plan.briefs.length > 0
      ? [
          'Briefs de especialistas (contexto de solo lectura, no los repitas):',
          ...plan.briefs.map((brief) => `### ${brief.role}\n${brief.summary}`),
          ''
        ]
      : []),
    ...(options.selfCheck !== undefined
      ? [
          'Autochequeo permitido (una sola vez, antes de terminar):',
          `- \`${options.selfCheck}\``,
          ''
        ]
      : []),
    'Validación final (la ejecuta el orquestador; no la ejecutes tú):',
    list(plan.validation),
    '',
    ...(inline.length > 0
      ? ['Contexto ya leído por el orquestador (no lo releas):', ...inline, '']
      : []),
    ...(options.diff !== undefined && options.diff.trim().length > 0
      ? [
          'Diff actual del árbol de trabajo (solo lectura; intégralo, no lo repitas):',
          '```diff',
          options.diff.trim(),
          '```',
          ''
        ]
      : []),
    ...(options.stat !== undefined && options.stat.trim().length > 0
      ? [
          'Cambios actuales del árbol de trabajo (git diff --stat, incluye archivos nuevos; usa `git diff -- <archivo>` solo si necesitas el detalle):',
          '```',
          options.stat.trimEnd(),
          '```',
          ''
        ]
      : []),
    'Aprendizajes relevantes:',
    list(plan.learnings.map((learning) => `${learning.id}: ${learning.title}`)),
    '',
    'Reglas:',
    '- No toques archivos fuera del alcance permitido.',
    '- No ejecutes git commit ni git push.',
    '- No escribas en la bóveda.',
    ...(options.selfCheck !== undefined
      ? [
          '- Puedes ejecutar solo el autochequeo indicado, una vez. No ejecutes tests ni repitas el comando.'
        ]
      : ['- No ejecutes la validación ni comandos de test; el orquestador la ejecutará al terminar.']),
    '- Si una herramienta o comando te devuelve un error de permisos, no lo reintentes: usa otra vía o devuelve el bloqueo.',
    docsRequested(plan)
      ? '- Agrega JSDoc/docstrings solo donde la petición lo pide. Ningún otro comentario: cero explicaciones, separadores o TODO/FIXME. Conserva los comentarios existentes.'
      : '- No agregues comentarios al código: cero explicaciones, separadores, TODO/FIXME o JSDoc de relleno. Conserva los comentarios existentes.',
    '- Devuelve un resumen breve de los archivos modificados.'
  ].join('\n');
}

export function buildFixMessage(input: FixInput, diff?: string): string {
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
    ...(diff !== undefined && diff.trim().length > 0
      ? [
          'Diff actual del alcance (solo lectura; intégralo, no lo repitas):',
          '```diff',
          diff.trim(),
          '```',
          ''
        ]
      : []),
    ...(input.review !== undefined && input.review.trim().length > 0
      ? ['Revisión del diff (prioriza los blockers):', input.review.trim(), '']
      : []),
    'Reglas:',
    '- Corrige la causa, no silencies el error.',
    '- No agregues comentarios al código: cero explicaciones, separadores, TODO/FIXME o JSDoc de relleno. Conserva los comentarios existentes.',
    '- No toques tests ni archivos fuera del alcance salvo que el error lo exija.',
    '- No ejecutes git commit ni git push.',
    '- No escribas en la bóveda.',
    '- Si una herramienta o comando te devuelve un error de permisos, no lo reintentes: usa otra vía o devuelve el bloqueo.'
  ].join('\n');
}

export function buildConsultMessage(
  role: SpecialistRole,
  input: ConsultInput,
  diff?: string,
  stat?: string
): string {
  const changes = input.changes
    .map((change) => `${change.kind ?? 'modified'} ${change.path}: ${change.change}`)
    .join('\n');

  return [
    `Consultoría ${role} para el run ${input.runId}.`,
    '',
    `Rol: ${SPECIALIST_FOCUS[role]}`,
    `Modo: ${input.mode}`,
    `Complejidad: ${input.complexity}`,
    `Fuente: ${input.source}`,
    '',
    'Petición:',
    input.request,
    '',
    'Criterios de aceptación:',
    list(input.acceptance),
    '',
    'Archivos del alcance:',
    list(input.files),
    '',
    'Validación prevista:',
    list(input.validation),
    '',
    ...(changes.length > 0 ? ['Cambios implementados:', changes, ''] : []),
    ...(diff !== undefined && diff.trim().length > 0
      ? ['Diff del árbol de trabajo (solo lectura):', '```diff', diff.trim(), '```', '']
      : []),
    ...(stat !== undefined && stat.trim().length > 0
      ? ['Cambios del árbol de trabajo (git diff --stat, solo lectura):', '```', stat.trimEnd(), '```', '']
      : []),
    ...(input.briefs.length > 0
      ? [
          'Briefs anteriores (no los repitas, intégralos):',
          ...input.briefs.map((brief) => `### ${brief.role}\n${brief.summary}`),
          ''
        ]
      : []),
    ...(input.focus !== undefined && input.focus.trim().length > 0
      ? ['Foco de esta consulta:', input.focus.trim(), '']
      : []),
    'Reglas:',
    '- No edites archivos ni ejecutes git.',
    '- No ejecutes la validación; la ejecuta el orquestador.',
    '- Responde en texto breve y accionable; no repitas el contexto.'
  ].join('\n');
}

export function capBrief(summary: string, maxChars = MAX_BRIEF_CHARS): string {
  const trimmed = summary.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars).trimEnd()}\n[brief recortado: ${trimmed.length - maxChars} caracteres]`;
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

export class SubagentWorker implements Worker {
  private readonly root: string;
  private readonly config: HarnessConfig;
  private readonly log: RunLog | undefined;
  private readonly env: NodeJS.ProcessEnv | undefined;
  private auditBaseline: FileContents | undefined;
  private allowDocs = false;
  private readonly ledger = new UsageLedger();

  constructor(options: WorkerOptions) {
    this.root = options.root;
    this.config = options.config;
    this.log = options.log;
    this.env = options.env;
  }

  async work(plan: WorkPlan): Promise<WorkResult> {
    this.auditBaseline = snapshotFileContents(this.root, [
      ...plan.files,
      ...(changedFiles(this.root) ?? [])
    ]);
    this.allowDocs = docsRequested(plan);
    const stat = await workingTreeStat(this.root, plan.files);
    const agent = implementerAgent(plan.complexity);
    const selfCheck =
      this.config.worker?.selfCheck === true && agent === IMPLEMENTER_AGENT
        ? fastCheckCommand(plan.validation)
        : undefined;
    if (selfCheck !== undefined) {
      this.log?.line(`autochequeo: ${selfCheck}`);
    }
    return this.invoke(
      agent,
      buildWorkMessage(plan, {
        root: this.root,
        inlineContext: true,
        ...(stat !== undefined ? { stat } : {}),
        ...(selfCheck !== undefined ? { selfCheck } : {})
      }),
      plan.files,
      'subagente',
      plan.runId
    );
  }

  async fix(input: FixInput): Promise<FixResult> {
    this.auditBaseline ??= snapshotFileContents(this.root, input.files);
    const before = snapshotWorkspace(this.root, input.files);
    const diff = await workingTreeDiff(this.root, input.files);
    const { result: run } = await this.runSubagent(
      FIXER_AGENT,
      buildFixMessage(input, diff),
      subagentSessionId(input.runId),
      'reparación'
    );
    const after = snapshotWorkspace(this.root, input.files);
    const changes = diffSnapshots(before, after, 'El subagente');
    const risks = this.collectRisks(input.files, changes);
    const verdict = fixVerdict(run, input, changes);
    return { ...verdict, changes, risks };
  }

  async consult(role: SpecialistRole, input: ConsultInput): Promise<SpecialistBrief> {
    const message =
      role === 'reviewer'
        ? buildConsultMessage(role, input, await workingTreeDiff(this.root, input.files))
        : buildConsultMessage(role, input, undefined, await workingTreeStat(this.root, input.files));
    const { result: run, text } = await this.runSubagent(
      SPECIALIST_AGENTS[role],
      message,
      subagentSessionId(input.runId, role),
      role === 'reviewer' ? 'revisión' : 'especialistas'
    );
    return {
      role,
      summary: run.code === 0 ? capBrief(text) : commandDetail(run)
    };
  }

  usage(): RunUsage | undefined {
    return this.ledger.snapshot();
  }

  private collectRisks(files: string[], changes: FileChange[]): Risk[] {
    const scope = scopeRisks(files, changes, this.config.scope ?? 'warn');
    if (this.auditBaseline === undefined) {
      return scope;
    }
    return [
      ...scope,
      ...auditWorkspace(
        this.root,
        this.auditBaseline,
        changes.map((change) => change.path),
        { allowDocs: this.allowDocs }
      )
    ];
  }

  private async invoke(
    agent: string,
    message: string,
    files: string[],
    label: string,
    runId: string
  ): Promise<WorkResult> {
    const before = snapshotWorkspace(this.root, files);
    const { result: run } = await this.runSubagent(
      agent,
      message,
      subagentSessionId(runId),
      'implementación'
    );
    const after = snapshotWorkspace(this.root, files);
    const changes = diffSnapshots(before, after, 'El subagente');
    const risks = this.collectRisks(files, changes);

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

  private async runSubagent(
    agent: string,
    message: string,
    session: string,
    phase: UsagePhase
  ): Promise<{ result: CommandResult; text: string }> {
    const { result, output } = await this.runOpenCode(agent, message, session);
    this.ledger.add(phase, output.usage);
    this.log?.line(`prompt: ${message.length} caracteres`);
    this.log?.line(`tokens (${phase}): ${formatUsage(output.usage)}`);
    const spawnError = result.error !== undefined && result.error.length > 0 ? result.error : undefined;
    const error = spawnError ?? output.error;
    return {
      result: error !== undefined ? { ...result, error } : result,
      text: output.events > 0 ? output.text : result.stdout.trim()
    };
  }

  private commandOptions(): RunOptions {
    return {
      cwd: this.root,
      env: this.env ?? process.env,
      timeout: this.config.worker?.timeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS,
      maxBuffer: 4 * 1024 * 1024
    };
  }

  private async runOpenCode(
    agent: string,
    message: string,
    session: string
  ): Promise<{ result: CommandResult; output: OpencodeOutput }> {
    const model = this.config.models.subagents.modelName.trim();
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
        `alvaress ${session}`,
        message
      ],
      this.commandOptions()
    );
    this.log?.command(
      `opencode run --agent ${agent}${model.length > 0 ? ` --model ${model}` : ''} --session ${session}`,
      result
    );
    return { result, output: parseOpencodeOutput(result.stdout) };
  }
}

export function createWorker(options: WorkerOptions): Worker {
  return new SubagentWorker(options);
}
