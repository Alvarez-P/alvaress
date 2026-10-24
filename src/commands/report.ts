import { listRunReports, readLatestRun, readRun } from '../orchestrator/report.js';
import { logger } from '../utils/logger.js';

const HELP = `alvaress report

Uso:
  alvaress report                 Muestra el último reporte de ejecución (JSON).
  alvaress report list            Lista los reportes disponibles.
  alvaress report show <id>       Muestra un reporte concreto (JSON).

Los reportes se guardan en .harness/runs/<id>-apply.json.`;

export function runReportCommand(args: string[], root: string = process.cwd()): void {
  const [subcommand, id] = args;

  if (subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
    console.log(HELP);
    return;
  }

  if (subcommand === undefined || subcommand === 'latest') {
    const report = readLatestRun(root);
    if (report === undefined) {
      logger.warn('No hay reportes de ejecución en .harness/runs.');
      return;
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (subcommand === 'list') {
    const reports = listRunReports(root);
    if (reports.length === 0) {
      logger.warn('No hay reportes de ejecución en .harness/runs.');
      return;
    }
    for (const report of reports) {
      console.log(
        `${report.id}  ${report.startedAt}  total=${report.total} verified=${report.verified} failed=${report.failed} skipped=${report.skipped}`
      );
    }
    return;
  }

  if (subcommand === 'show') {
    if (id === undefined) {
      throw new Error('Uso: alvaress report show <id>');
    }
    const report = readRun(root, id);
    if (report === undefined) {
      throw new Error(`No existe el reporte "${id}". Usa "alvaress report list".`);
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  throw new Error(`Subcomando de report desconocido: ${subcommand}. Usa "latest", "list" o "show".`);
}
