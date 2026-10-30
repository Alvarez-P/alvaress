import { runCommand } from '../utils/process.js';
import { redactSecrets } from '../utils/redact.js';

const DIFF_TIMEOUT_MS = 15_000;
const DIFF_BUFFER_BYTES = 2 * 1024 * 1024;
const MAX_DIFF_CHARS = 8_000;

const ARTIFACT_EXCLUDES = ['.laya', '.harness', 'graphify-out', 'node_modules', 'dist'];

/**
 * Diff del árbol de trabajo frente a HEAD, en el estilo que usa Aider para dar
 * contexto al modelo. Devuelve `undefined` si no es un repo, falla git o no hay
 * cambios. Los artefactos del run y del grafo no se incluyen.
 */
export async function workingTreeDiff(
  root: string,
  files: readonly string[] = [],
  maxChars = MAX_DIFF_CHARS
): Promise<string | undefined> {
  const paths =
    files.length > 0
      ? [...files]
      : ['.', ...ARTIFACT_EXCLUDES.map((directory) => `:(exclude)${directory}`)];

  const result = await runCommand(
    'git',
    ['diff', '--no-color', '--no-ext-diff', '--unified=3', 'HEAD', '--', ...paths],
    { cwd: root, timeout: DIFF_TIMEOUT_MS, maxBuffer: DIFF_BUFFER_BYTES }
  );
  if (result.code !== 0) {
    return undefined;
  }

  const diff = redactSecrets(result.stdout.trim());
  if (diff.length === 0) {
    return undefined;
  }
  if (diff.length <= maxChars) {
    return diff;
  }
  const omitted = diff.length - maxChars;
  return `${diff.slice(0, maxChars)}\n[diff truncado: ${omitted} caracteres. Usa "git diff -- <archivo>" para el resto]`;
}
