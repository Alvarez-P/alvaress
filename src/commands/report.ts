import { listAllReports, readAnyReport } from '../orchestrator/report.js';
import type { AnyRunReport, HarnessRunReport, RunReport } from '../orchestrator/report.js';
import { logger } from '../utils/logger.js';

const HELP = `alvaress report

Uso:
  alvaress report                 Muestra el último reporte de ejecución (JSON).
  alvaress report list            Lista los reportes disponibles.
  alvaress report show <id>       Muestra un reporte concreto (JSON).

Los reportes se guardan en .harness/runs:
  <id>-apply.json   ejecuciones de "alvaress apply"
  <id>-run.json     ejecuciones de "alvaress run"`;

function isHarnessReport(report: AnyRunReport): report is HarnessRunReport {
  return report.command === 'run';
}

function describe(report: AnyRunReport): string {
  if (isHarnessReport(report)) {
    const task = report.taskId !== undefined ? ` task=${report.taskId}` : '';
    return `${report.id}  ${report.startedAt}  run ${report.state} mode=${report.mode}${task} changes=${report.changes.length}`;
  }
  const apply = report as RunReport;
  return `${apply.id}  ${apply.startedAt}  total=${apply.total} verified=${apply.verified} failed=${apply.failed} skipped=${apply.skipped}`;
}

export function runReportCommand(args: string[], root: string = process.cwd()): void {
  const [subcommand, id] = args;

  if (subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
    console.log(HELP);
    return;
  }

  if (subcommand === undefined || subcommand === 'latest') {
    const report = readAnyReport(root, 'latest');
    if (report === undefined) {
      logger.warn('No hay reportes de ejecución en .harness/runs.');
      return;
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (subcommand === 'list') {
    const reports = listAllReports(root);
    if (reports.length === 0) {
      logger.warn('No hay reportes de ejecución en .harness/runs.');
      return;
    }
    for (const report of reports) {
      console.log(describe(report));
    }
    return;
  }

  if (subcommand === 'show') {
    if (id === undefined) {
      throw new Error('Uso: alvaress report show <id>');
    }
    const report = readAnyReport(root, id);
    if (report === undefined) {
      throw new Error(`No existe el reporte "${id}". Usa "alvaress report list".`);
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  throw new Error(`Subcomando de report desconocido: ${subcommand}. Usa "latest", "list" o "show".`);
}
