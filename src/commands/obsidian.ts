import path from 'node:path';
import { loadConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import {
  appendVaultNoteEntry,
  connectObsidianVault,
  getVaultNotePath
} from '../obsidian/vault.js';
import { inferProjectName } from '../openspec/manifest.js';
import { parseArgs } from '../utils/args.js';
import { pathExists } from '../utils/fs.js';
import { expandHome } from '../utils/prompt.js';

const HELP = `alvaress obsidian

Uso:
  alvaress obsidian status          Muestra la bóveda configurada, la nota y sus enlaces.
  alvaress obsidian sync            Crea o verifica la bóveda, la nota y los enlaces.
  alvaress obsidian note --summary "<texto>" [--task TASK-01]
      [--validation "<texto>"] [--risk "<texto>"] [--next "<texto>"]

La bóveda es un espejo de lectura: la fuente de verdad es openspec.yaml y
.harness/tasks. El orquestador usa "obsidian note" al cerrar una tarea.`;

export interface ObsidianCommandDeps {
  config?: HarnessConfig;
  stdout?: (line: string) => void;
}

function flagValue(flags: Record<string, string | boolean>, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function runObsidianCommand(
  args: string[],
  root: string = process.cwd(),
  deps: ObsidianCommandDeps = {}
): void {
  const stdout = deps.stdout ?? ((line: string) => console.log(line));
  const [subcommand, ...rest] = args;

  if (
    subcommand === undefined ||
    subcommand === 'help' ||
    subcommand === '--help' ||
    subcommand === '-h'
  ) {
    stdout(HELP);
    return;
  }

  const config = deps.config ?? loadConfig(root);
  const configuredPath = config.obsidianVaultPath.trim();
  if (configuredPath.length === 0) {
    throw new Error(
      'No hay bóveda Obsidian configurada. Ejecuta "alvaress install" o define obsidianVaultPath.'
    );
  }

  const vaultPath = path.resolve(root, expandHome(configuredPath));
  const projectName = inferProjectName(root);
  const notePath = getVaultNotePath(vaultPath, projectName);
  const harnessDir = path.join(vaultPath, 'Harness');

  if (subcommand === 'status') {
    stdout(
      JSON.stringify(
        {
          configured: true,
          vaultPath,
          exists: pathExists(vaultPath),
          harnessDir,
          notePath,
          noteExists: pathExists(notePath),
          tasksLink: path.join(harnessDir, 'Tasks'),
          manifestLink: path.join(harnessDir, 'openspec.yaml')
        },
        null,
        2
      )
    );
    return;
  }

  if (subcommand === 'sync') {
    const connection = connectObsidianVault(root, vaultPath);
    stdout(JSON.stringify(connection, null, 2));
    return;
  }

  if (subcommand === 'note') {
    const { flags } = parseArgs(rest);
    const summary = flagValue(flags, 'summary');
    if (summary === undefined) {
      throw new Error('Uso: alvaress obsidian note --summary "<texto>" [opciones]');
    }

    connectObsidianVault(root, vaultPath);
    appendVaultNoteEntry(notePath, {
      summary,
      task: flagValue(flags, 'task'),
      validation: flagValue(flags, 'validation'),
      risks: flagValue(flags, 'risk'),
      next: flagValue(flags, 'next')
    });
    stdout(`[alvaress] OK: Nota de Obsidian actualizada en ${notePath}`);
    return;
  }

  throw new Error(
    `Subcomando de obsidian desconocido: ${subcommand}. Usa "alvaress obsidian status", "sync" o "note".`
  );
}
