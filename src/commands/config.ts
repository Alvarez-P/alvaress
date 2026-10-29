import { getConfigPaths, loadConfig, displayConfig } from '../config/loader.js';

export function runConfigCommand(args: string[], root: string = process.cwd()): void {
  const [subcommand] = args;
  const paths = getConfigPaths(root);

  if (subcommand === 'paths') {
    console.log(JSON.stringify(paths, null, 2));
    return;
  }

  if (subcommand === undefined || subcommand === 'show') {
    console.log(JSON.stringify(displayConfig(loadConfig(root)), null, 2));
    return;
  }

  throw new Error(`Subcomando de configuración desconocido: ${subcommand}`);
}
