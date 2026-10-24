import { listManifestBackups, restoreManifestBackup } from '../orchestrator/backup.js';
import { logger } from '../utils/logger.js';

const HELP = `alvaress restore

Uso:
  alvaress restore --list          Lista los backups de openspec.yaml.
  alvaress restore latest          Restaura el backup más reciente.
  alvaress restore <id>            Restaura un backup concreto.

Los backups se guardan en .harness/backups/.`;

export function runRestoreCommand(args: string[], root: string = process.cwd()): void {
  const [subcommand] = args;

  if (subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
    console.log(HELP);
    return;
  }

  if (subcommand === '--list' || subcommand === 'list') {
    const backups = listManifestBackups(root);
    if (backups.length === 0) {
      logger.warn('No hay backups de openspec.yaml.');
      return;
    }
    for (const backup of backups) {
      console.log(`${backup.id}  ${backup.createdAt}  ${backup.size} bytes`);
    }
    return;
  }

  const restored = restoreManifestBackup(root, subcommand);
  logger.success(`Manifiesto restaurado desde ${restored.path}`);
}
