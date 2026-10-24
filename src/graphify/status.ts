import fs from 'node:fs';
import path from 'node:path';
import { GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME } from '../constants.js';
import { commandExists, runCommand } from '../utils/process.js';
import type { CommandResult } from '../utils/process.js';

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  '.harness',
  'graphify-out',
  'vendor',
  'target'
]);

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.rb',
  '.php',
  '.cs',
  '.swift',
  '.c',
  '.cc',
  '.cpp',
  '.h',
  '.hpp'
]);

export interface GraphStatus {
  exists: boolean;
  path: string;
  graphMtime?: string;
  newestSourceMtime?: string;
  stale: boolean;
}

function walkNewest(directory: string, current?: number): number | undefined {
  let newest = current;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return newest;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      newest = walkNewest(path.join(directory, entry.name), newest);
      continue;
    }
    if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }
    try {
      const mtime = fs.statSync(path.join(directory, entry.name)).mtimeMs;
      if (newest === undefined || mtime > newest) {
        newest = mtime;
      }
    } catch {
      // Ignora archivos que desaparecen durante el recorrido.
    }
  }
  return newest;
}

export function getGraphStatus(root: string = process.cwd()): GraphStatus {
  const graphPath = path.join(root, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME);
  if (!fs.existsSync(graphPath)) {
    return { exists: false, path: graphPath, stale: true };
  }
  const graphMtime = fs.statSync(graphPath).mtimeMs;
  const newest = walkNewest(root);
  return {
    exists: true,
    path: graphPath,
    graphMtime: new Date(graphMtime).toISOString(),
    newestSourceMtime: newest === undefined ? undefined : new Date(newest).toISOString(),
    stale: newest !== undefined && newest > graphMtime + 1000
  };
}

export async function updateGraph(root: string = process.cwd()): Promise<CommandResult> {
  if (!commandExists('graphify')) {
    return { code: 1, stdout: '', stderr: '', error: 'Graphify no está instalado.' };
  }
  return runCommand('graphify', ['update', '.'], { cwd: root, timeout: 5 * 60 * 1000 });
}
