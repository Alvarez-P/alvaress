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
  SpecialistBrief,
  SpecialistRole,
  WorkPlan,
  WorkResult,
  Worker
} from '../core/contracts.js';
import { heuristicVerdict } from '../decision/heuristics.js';
import { runCommand } from '../utils/process.js';
import type { CommandResult } from '../utils/process.js';
import { diffSnapshots, scopeRisks, snapshotWorkspace } from './diff.js';
import type { RunLog } from './run-log.js';

const MAX_INLINE_FILE_BYTES = 8_000;
const MAX_INLINE_TOTAL_BYTES = 16_000;
const IMPLEMENTER_AGENT = 'alvaress-implementer';
const IMPLEMENTER_LITE_AGENT = 'alvaress-implementer-lite';
const FIXER_AGENT = 'alvaress-fixer';

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

export interface WorkMessageOptions {
  root?: string;
  inlineContext?: boolean;
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
    'Validación final (la ejecuta el orquestador; no la ejecutes tú):',
    list(plan.validation),
    '',
    ...(inline.length > 0
      ? ['Contexto ya leído por el orquestador (no lo releas):', ...inline, '']
      : []),
    'Aprendizajes relevantes:',
    list(plan.learnings.map((learning) => `${learning.id}: ${learning.title}`)),
    '',
    'Reglas:',
    '- No toques archivos fuera del alcance permitido.',
    '- No ejecutes git commit ni git push.',
    '- No escribas en la bóveda Obsidian.',
    '- No ejecutes la validación ni comandos de test; el orquestador la ejecutará al terminar.',
    '- Si una herramienta o comando te devuelve un error de permisos, no lo reintentes: usa otra vía o devuelve el bloqueo.',
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
    ...(input.review !== undefined && input.review.trim().length > 0
      ? ['Revisión del diff (prioriza los blockers):', input.review.trim(), '']
      : []),
    'Reglas:',
    '- Corrige la causa, no silencies el error.',
    '- No agregues comentarios al código: cero explicaciones, separadores, TODO/FIXME o JSDoc de relleno. Conserva los comentarios existentes.',
    '- No toques tests ni archivos fuera del alcance salvo que el error lo exija.',
    '- No ejecutes git commit ni git push.',
    '- No escribas en la bóveda Obsidian.',
    '- Si una herramienta o comando te devuelve un error de permisos, no lo reintentes: usa otra vía o devuelve el bloqueo.'
  ].join('\n');
}

export function buildConsultMessage(role: SpecialistRole, input: ConsultInput): string {
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

  constructor(options: WorkerOptions) {
    this.root = options.root;
    this.config = options.config;
    this.log = options.log;
    this.env = options.env;
  }

  async work(plan: WorkPlan): Promise<WorkResult> {
    return this.invoke(
      implementerAgent(plan.complexity),
      buildWorkMessage(plan, { root: this.root, inlineContext: true }),
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

  async consult(role: SpecialistRole, input: ConsultInput): Promise<SpecialistBrief> {
    const run = await this.runOpenCode(
      SPECIALIST_AGENTS[role],
      buildConsultMessage(role, input),
      input.runId,
      'text'
    );
    return {
      role,
      summary: run.code === 0 ? run.stdout.trim() : commandDetail(run)
    };
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
    runId: string,
    format: 'json' | 'text' = 'json'
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
        ...(format === 'json' ? ['--format', 'json'] : []),
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
        timeout: this.config.worker?.timeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS,
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
  return new SubagentWorker(options);
}
