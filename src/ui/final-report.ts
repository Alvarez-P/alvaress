import type { CommitResult, FileChange, Risk, RunResult, ValidationResult } from '../core/contracts.js';
import { defaultPalette } from './colors.js';
import type { Palette } from './colors.js';

export interface ReportTask {
  title: string;
  description: string;
  highlight?: boolean;
}

export interface FinalReportInput {
  state: 'Ready' | 'Halted';
  changes: FileChange[];
  tasks?: ReportTask[];
  risks: Risk[];
  validation?: ValidationResult;
  commit?: CommitResult;
  halt?: { message: string; detail?: string };
  logPath?: string;
  palette?: Palette;
  command?: string;
}

export interface SelectedChange {
  label: string;
}

export interface ChangeSelection {
  items: SelectedChange[];
  omitted: number;
  source: 'files' | 'tasks';
}

const SEPARATOR_WIDTH = 70;

function normalized(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function dedupeTasks(tasks: ReportTask[]): ReportTask[] {
  const seenTitles = new Set<string>();
  const seenDescriptions = new Set<string>();
  const result: ReportTask[] = [];

  for (const task of tasks) {
    const title = task.title.trim();
    const description = task.description.trim();
    if (title.length === 0) {
      continue;
    }

    const titleKey = normalized(title);
    const descriptionKey = normalized(description);
    if (seenTitles.has(titleKey)) {
      continue;
    }
    if (descriptionKey.length > 0 && seenDescriptions.has(descriptionKey)) {
      continue;
    }

    seenTitles.add(titleKey);
    if (descriptionKey.length > 0) {
      seenDescriptions.add(descriptionKey);
    }
    result.push({
      title,
      description,
      ...(task.highlight !== undefined ? { highlight: task.highlight } : {})
    });
  }

  return result;
}

export function selectChanges(changes: FileChange[], tasks: ReportTask[] = []): ChangeSelection {
  if (changes.length < 5) {
    return {
      items: changes.map((change) => ({ label: `${change.path} -> ${change.change}` })),
      omitted: 0,
      source: 'files'
    };
  }

  const cleanTasks = dedupeTasks(tasks);
  if (cleanTasks.length > 0) {
    const highlights = cleanTasks.filter((task) => task.highlight === true);
    const selected =
      cleanTasks.length > 5 && highlights.length > 0 ? highlights : cleanTasks.slice(0, 5);
    return {
      items: selected.map((task) => ({ label: `${task.title} -> ${task.description}` })),
      omitted: cleanTasks.length - selected.length,
      source: 'tasks'
    };
  }

  const selected = changes.slice(0, 5);
  return {
    items: selected.map((change) => ({ label: `${change.path} -> ${change.change}` })),
    omitted: changes.length - selected.length,
    source: 'files'
  };
}

function renderValidation(validation: ValidationResult | undefined, palette: Palette): string[] {
  if (validation === undefined || validation.commands.length === 0) {
    return [];
  }

  const lines = [palette.text('Validación:')];
  for (const command of validation.commands) {
    const status = command.code === 0 ? 'OK' : `FALLO (${command.code})`;
    lines.push(`${palette.accent('  •')} ${palette.text(`${command.command} -> ${status}`)}`);
  }
  lines.push('');
  return lines;
}

function renderCommit(commit: CommitResult | undefined, palette: Palette): string[] {
  if (commit === undefined || !commit.committed) {
    return [];
  }

  const sha = commit.sha ?? 'creado';
  const count = `${commit.files.length} archivo(s)`;
  return ['', `${palette.text('Commit:')} ${palette.text(sha)} ${palette.dim(`(${count})`)}`];
}

export function renderFinalReport(input: FinalReportInput): string {
  const palette = input.palette ?? defaultPalette();
  const command = input.command ?? 'alvaress';
  const lines: string[] = [];
  const border = palette.border('='.repeat(SEPARATOR_WIDTH));

  lines.push(border);
  lines.push(
    input.state === 'Ready'
      ? palette.accent(`[${command}] READY`)
      : palette.warning(`[${command}] HALTED`)
  );
  lines.push(border);

  if (input.state === 'Halted' && input.halt !== undefined) {
    lines.push(palette.text('Motivo:'));
    lines.push(`${palette.warning('  •')} ${palette.warning(input.halt.message)}`);
    if (input.halt.detail !== undefined && input.halt.detail.length > 0) {
      lines.push(`${palette.warning('  •')} ${palette.warning(input.halt.detail)}`);
    }
    lines.push('');
  }

  const selection = selectChanges(input.changes, input.tasks ?? []);
  lines.push(palette.text('Cambios Realizados:'));
  if (selection.items.length === 0) {
    lines.push(`${palette.text('  •')} ${palette.text('Sin cambios registrados.')}`);
  } else {
    for (const item of selection.items) {
      lines.push(`${palette.accent('  •')} ${palette.text(item.label)}`);
    }
  }
  if (selection.omitted > 0) {
    const noun = selection.source === 'tasks' ? 'tarea(s)' : 'archivo(s)';
    lines.push(palette.dim(`  … ${selection.omitted} ${noun} más (ver log)`));
  }
  lines.push('');

  lines.push(...renderValidation(input.validation, palette));

  lines.push(palette.surface('Riesgos Detectados:'));
  if (input.risks.length === 0) {
    lines.push(`${palette.text('  •')} ${palette.text('Sin riesgos detectados.')}`);
  } else {
    for (const risk of input.risks) {
      const label = risk.description !== undefined ? `${risk.title} -> ${risk.description}` : risk.title;
      lines.push(`${palette.warning('  •')} ${palette.warning(label)}`);
    }
  }

  lines.push(...renderCommit(input.commit, palette));
  lines.push('');
  lines.push(palette.border('-'.repeat(SEPARATOR_WIDTH)));
  const logHint = `${palette.text('💡 Para inspeccionar el log completo ejecute:')} ${palette.accent(`${command} -i`)}`;
  const logPath = input.logPath !== undefined ? ` ${palette.dim(`(${input.logPath})`)}` : '';
  lines.push(`${logHint}${logPath}`);
  lines.push(border);

  return lines.join('\n');
}

export function finalReportFromRun(result: RunResult, tasks: ReportTask[] = []): FinalReportInput {
  return {
    state: result.state,
    changes: result.changes,
    tasks,
    risks: result.risks,
    validation: result.validation,
    ...(result.commit !== undefined ? { commit: result.commit } : {}),
    ...(result.halt !== undefined
      ? { halt: { message: result.halt.message, ...(result.halt.detail !== undefined ? { detail: result.halt.detail } : {}) } }
      : {}),
    logPath: result.logPath
  };
}

export interface PrintReportOptions {
  clear?: boolean;
  stream?: NodeJS.WriteStream;
}

export function printFinalReport(input: FinalReportInput, options: PrintReportOptions = {}): void {
  const stream = options.stream ?? process.stdout;
  if (options.clear !== false && stream.isTTY) {
    console.clear();
  }
  stream.write(`${renderFinalReport(input)}\n`);
}
