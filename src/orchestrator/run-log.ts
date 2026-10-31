import fs from 'node:fs';
import path from 'node:path';
import { LAYA_LOG_PATH } from '../constants.js';
import type { RunResult, RunUsage } from '../core/contracts.js';
import { ensureDir } from '../utils/fs.js';
import { redactSecrets } from '../utils/redact.js';
import type { CommandResult } from '../utils/process.js';
import { formatUsage } from './usage.js';

export interface RunLogMeta {
  command: string;
  request?: string;
  runId?: string;
  mode?: string;
}

export class RunLog {
  readonly path: string;
  readonly relativePath: string;
  private initialized = false;

  constructor(root: string, relativePath: string = LAYA_LOG_PATH) {
    this.path = path.join(root, relativePath);
    this.relativePath = relativePath;
  }

  begin(meta: RunLogMeta): void {
    ensureDir(path.dirname(this.path));
    const lines = [
      '# alvaress run',
      `Fecha: ${new Date().toISOString()}`,
      `Comando: ${meta.command}`,
      ...(meta.runId !== undefined ? [`Run: ${meta.runId}`] : []),
      ...(meta.mode !== undefined ? [`Modo: ${meta.mode}`] : []),
      ...(meta.request !== undefined ? [`Petición: ${meta.request}`] : []),
      ''
    ];
    fs.writeFileSync(this.path, `${lines.join('\n')}\n`, 'utf-8');
    this.initialized = true;
  }

  section(title: string): void {
    this.append(`\n## ${title}`);
  }

  line(text = ''): void {
    this.append(text);
  }

  command(command: string, result: CommandResult): void {
    this.section(`$ ${command}`);
    this.append(`exit: ${result.code}`);
    if (result.error !== undefined && result.error.length > 0) {
      this.append(`error: ${result.error}`);
    }
    if (result.stdout.trim().length > 0) {
      this.append(`stdout:\n${result.stdout.trimEnd()}`);
    }
    if (result.stderr.trim().length > 0) {
      this.append(`stderr:\n${result.stderr.trimEnd()}`);
    }
  }

  text(title: string, value: string): void {
    this.section(title);
    this.append(value.trimEnd());
  }

  finish(result: RunResult): void {
    this.section(`resultado: ${result.state}`);
    this.append(`run: ${result.runId}`);
    this.append(`modo: ${result.mode}`);
    this.append(`log: ${result.logPath}`);
    if (result.halt !== undefined) {
      this.append(`halt: ${result.halt.code}`);
      this.append(`motivo: ${result.halt.message}`);
      if (result.halt.detail !== undefined) {
        this.append(`detalle: ${result.halt.detail}`);
      }
    }
    if (result.commit !== undefined) {
      this.append(
        result.commit.committed
          ? `commit: ${result.commit.sha ?? 'creado'} (${result.commit.files.length} archivo(s))`
          : `commit: no realizado (${result.commit.message ?? 'sin detalle'})`
      );
    }
    this.append(`cambios: ${result.changes.length}`);
    this.append(`riesgos: ${result.risks.length}`);
  }

  usage(usage: RunUsage | undefined): void {
    if (usage === undefined) {
      return;
    }
    this.section('consumo de tokens');
    for (const [phase, value] of Object.entries(usage.phases)) {
      this.append(`${phase}: ${formatUsage(value)}`);
    }
    this.append(`total: ${formatUsage(usage.total)}`);
  }

  read(): string {
    if (!fs.existsSync(this.path)) {
      return '';
    }
    return fs.readFileSync(this.path, 'utf-8');
  }

  exists(): boolean {
    return fs.existsSync(this.path);
  }

  private append(text: string): void {
    if (!this.initialized) {
      this.begin({ command: 'alvaress' });
    }
    fs.appendFileSync(this.path, `${redactSecrets(text)}\n`, 'utf-8');
  }
}

export function inspectLastRun(root: string, stream: NodeJS.WriteStream = process.stdout): number {
  const log = new RunLog(root);
  if (!log.exists()) {
    stream.write(`No hay ejecuciones registradas en ${log.relativePath}. Ejecuta "alvaress run" primero.\n`);
    return 1;
  }

  const content = log.read();
  stream.write(content.endsWith('\n') ? content : `${content}\n`);
  return 0;
}
