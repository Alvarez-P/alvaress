import { archiveSpec, loadManifest, saveManifest } from '../openspec/manifest.js';
import { backupManifest } from '../orchestrator/backup.js';
import { logger } from '../utils/logger.js';

const HELP = `alvaress archive

Uso:
  alvaress archive <SPEC_ID>     Archiva una spec cuyas tareas están todas en Done.

Antes de archivar se crea un backup de openspec.yaml en .harness/backups/.`;

export function runArchiveCommand(args: string[], root: string = process.cwd()): void {
  const [specId] = args;

  if (specId === undefined || specId === 'help' || specId === '--help' || specId === '-h') {
    console.log(HELP);
    return;
  }

  const manifest = loadManifest(root);
  archiveSpec(manifest, specId);
  const backup = backupManifest(root);
  saveManifest(manifest, root);
  logger.success(`Spec ${specId} archivada en openspec.yaml.`);
  if (backup !== undefined) {
    logger.info(`Backup previo: ${backup.path}`);
  }
}
