import { installAgent, renderAgent } from '../agent/installer.js';
import { flagEnabled, parseArgs } from '../utils/args.js';
import { logger } from '../utils/logger.js';

export function runAgentCommand(args: string[], root: string = process.cwd()): void {
  const [subcommand, ...rest] = args;

  if (subcommand === 'show') {
    console.log(renderAgent());
    return;
  }

  if (subcommand === undefined || subcommand === 'install') {
    const { flags } = parseArgs(subcommand === undefined ? [] : rest);
    const report = installAgent(root, {
      global: !flagEnabled(flags, 'no-global'),
      project: !flagEnabled(flags, 'no-project')
    });
    if (report.files.length === 0) {
      logger.warn('No se instaló el agente: todas las ubicaciones están desactivadas.');
      return;
    }
    for (const file of report.files) {
      logger.success(`Agente ${report.name} instalado en ${file}`);
    }
    for (const file of report.subagents) {
      logger.success(`Subagente instalado en ${file}`);
    }
    logger.info('Selecciónalo en OpenCode con Tab o con --agent alvaress.');
    return;
  }

  throw new Error(`Subcomando de agente desconocido: ${subcommand}. Usa "alvaress agent install" o "alvaress agent show".`);
}
