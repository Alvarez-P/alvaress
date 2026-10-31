import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Risk } from '../core/contracts.js';
import { isRunArtifact } from './diff.js';
import { changedFiles } from './scope.js';

const MAX_AUDITED_FILE_BYTES = 512 * 1024;
const MAX_DELETED_LINES = 200;
const MAX_EXAMPLES = 4;
const MAX_EXAMPLE_CHARS = 80;

const LOCKFILES = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
  'Cargo.lock',
  'poetry.lock',
  'Pipfile.lock',
  'composer.lock',
  'Gemfile.lock',
  'go.sum',
  'mix.lock',
  'pubspec.lock',
  'Package.resolved'
]);

interface CommentSyntax {
  line: string[];
  block: boolean;
}

const C_STYLE: CommentSyntax = { line: ['//'], block: true };
const HASH_STYLE: CommentSyntax = { line: ['#'], block: false };

const CODE_COMMENTS: Record<string, CommentSyntax> = {
  '.ts': C_STYLE,
  '.tsx': C_STYLE,
  '.js': C_STYLE,
  '.jsx': C_STYLE,
  '.mjs': C_STYLE,
  '.cjs': C_STYLE,
  '.java': C_STYLE,
  '.kt': C_STYLE,
  '.swift': C_STYLE,
  '.go': C_STYLE,
  '.rs': C_STYLE,
  '.c': C_STYLE,
  '.h': C_STYLE,
  '.cc': C_STYLE,
  '.cpp': C_STYLE,
  '.hpp': C_STYLE,
  '.cs': C_STYLE,
  '.php': { line: ['//', '#'], block: true },
  '.py': HASH_STYLE,
  '.rb': HASH_STYLE,
  '.sh': HASH_STYLE,
  '.bash': HASH_STYLE,
  '.zsh': HASH_STYLE,
  '.sql': { line: ['--'], block: true },
  '.scss': C_STYLE,
  '.less': C_STYLE,
  '.css': { line: [], block: true }
};

const DIRECTIVE =
  /^(?:#!|\/\/\/\s*<reference|\/\/\s*@ts-|\/\/go:|\/\/\s*nolint|(?:\/\/|\/\*)\s*(?:eslint|oxlint|biome-ignore|prettier-ignore|istanbul|c8|v8|deno-lint|@vite-ignore|webpack\w*)|#\s*(?:type:|noqa|pragma|pylint:|fmt:|-\*-|frozen_string_literal|shellcheck|rubocop:))/;

const TEST_DECLARATION = /\b(?:it|test|describe)\s*\(|\bdef test_\w+/g;
const SKIPPED_TEST =
  /\b(?:it|test|describe)\.(?:skip|todo|only)\s*\(|\bx(?:it|describe)\s*\(|@pytest\.mark\.skip/;
const DEBUG_OUTPUT = /^\s*console\.(?:log|debug)\s*\(/;
const ANY_TYPE = /\b(?::\s*any\b|as\s+any\b|<any>)/;

export type FileContents = Map<string, string | null>;

interface Finding {
  file: string;
  line?: number;
  text?: string;
  count?: number;
}

function normalize(file: string): string {
  return path.normalize(file).replaceAll('\\', '/').replace(/^\.\//, '');
}

function readText(root: string, file: string): string | null | undefined {
  try {
    const target = path.join(root, file);
    const stat = fs.statSync(target);
    if (!stat.isFile()) {
      return null;
    }
    if (stat.size > MAX_AUDITED_FILE_BYTES) {
      return undefined;
    }
    const buffer = fs.readFileSync(target);
    return buffer.includes(0) ? undefined : buffer.toString('utf8');
  } catch {
    return null;
  }
}

function readHead(root: string, file: string): string | null | undefined {
  const result = spawnSync('git', ['show', `HEAD:${file}`], {
    cwd: root,
    encoding: 'utf-8',
    timeout: 15_000,
    maxBuffer: MAX_AUDITED_FILE_BYTES
  });
  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return null;
  }
  return result.stdout;
}

function lineCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of text.split('\n')) {
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return counts;
}

function addedLines(before: string, after: string): Array<{ line: number; text: string }> {
  const remaining = lineCounts(before);
  const added: Array<{ line: number; text: string }> = [];
  const lines = after.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index] ?? '';
    const count = remaining.get(text) ?? 0;
    if (count > 0) {
      remaining.set(text, count - 1);
      continue;
    }
    added.push({ line: index + 1, text });
  }
  return added;
}

function removedLineCount(before: string, after: string): number {
  const beforeCounts = lineCounts(before);
  const afterCounts = lineCounts(after);
  let removed = 0;
  for (const [line, count] of beforeCounts) {
    removed += Math.max(0, count - (afterCounts.get(line) ?? 0));
  }
  return removed;
}

function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

function isTestFile(file: string): boolean {
  return /(^|\/)(test|tests|__tests__|spec)\//.test(file) || /\.(?:test|spec)\.[^.]+$/.test(file);
}

function isCode(file: string): boolean {
  return CODE_COMMENTS[path.extname(file)] !== undefined;
}

interface CommentLines {
  comment: Set<number>;
  doc: Set<number>;
}

function commentLines(file: string, text: string): CommentLines {
  const syntax = CODE_COMMENTS[path.extname(file)];
  const result: CommentLines = { comment: new Set(), doc: new Set() };
  if (syntax === undefined) {
    return result;
  }
  let inBlock = false;
  let inDoc = false;
  text.split('\n').forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trimStart();
    if (inBlock) {
      result.comment.add(line);
      if (inDoc) {
        result.doc.add(line);
      }
      if (trimmed.includes('*/')) {
        inBlock = false;
        inDoc = false;
      }
      return;
    }
    if (DIRECTIVE.test(trimmed)) {
      return;
    }
    if (syntax.block && trimmed.startsWith('/*')) {
      const isDoc = trimmed.startsWith('/**');
      result.comment.add(line);
      if (isDoc) {
        result.doc.add(line);
      }
      if (!trimmed.includes('*/', 2)) {
        inBlock = true;
        inDoc = isDoc;
      }
      return;
    }
    if (syntax.line.some((token) => trimmed.startsWith(token))) {
      result.comment.add(line);
    }
  });
  return result;
}

function example(finding: Finding): string {
  const location = finding.line !== undefined ? `${finding.file}:${finding.line}` : finding.file;
  if (finding.text === undefined) {
    return location;
  }
  const text = finding.text.trim().slice(0, MAX_EXAMPLE_CHARS);
  return `${location} (${text})`;
}

function describe(findings: Finding[], label: string): string {
  const head = findings
    .slice(0, MAX_EXAMPLES)
    .map((finding) => example(finding))
    .join(', ');
  const rest = findings.length - MAX_EXAMPLES;
  return rest > 0 ? `${label}: ${head} y ${rest} más.` : `${label}: ${head}.`;
}

function risk(title: string, description: string, severity: Risk['severity']): Risk {
  return { title, description, source: 'audit', severity };
}

export function snapshotFileContents(root: string, files: readonly string[]): FileContents {
  const snapshot: FileContents = new Map();
  for (const file of new Set(files.map(normalize))) {
    if (file.length === 0 || isRunArtifact(file)) {
      continue;
    }
    const content = readText(root, file);
    if (content !== undefined) {
      snapshot.set(file, content);
    }
  }
  return snapshot;
}

/**
 * Revisa el diff acumulado desde `before` y devuelve riesgos mecánicos. No
 * ejecuta validación ni consume tokens: compara líneas añadidas por archivo.
 */
export interface AuditOptions {
  allowDocs?: boolean;
}

export function auditWorkspace(
  root: string,
  before: FileContents,
  extraFiles: readonly string[] = [],
  options: AuditOptions = {}
): Risk[] {
  const files = new Set<string>([
    ...before.keys(),
    ...extraFiles.map(normalize),
    ...(changedFiles(root) ?? [])
  ]);

  const comments: Finding[] = [];
  const todos: Finding[] = [];
  const debug: Finding[] = [];
  const unsafeTypes: Finding[] = [];
  const skippedTests: Finding[] = [];
  const deletedTests: Finding[] = [];
  const reducedTests: Finding[] = [];
  const lockfiles: Finding[] = [];
  const largeDeletions: Finding[] = [];

  for (const file of files) {
    if (file.length === 0 || isRunArtifact(file)) {
      continue;
    }

    const after = readText(root, file);
    if (after === undefined) {
      continue;
    }
    const beforeText = before.has(file) ? before.get(file) ?? null : readHead(root, file);
    if (beforeText === undefined) {
      continue;
    }

    if (LOCKFILES.has(path.basename(file)) && beforeText !== after) {
      lockfiles.push({ file });
      continue;
    }

    const beforeContent = beforeText ?? '';
    if (after === null) {
      if (isTestFile(file)) {
        deletedTests.push({ file });
      }
      const removed = beforeContent.length > 0 ? beforeContent.split('\n').length : 0;
      if (removed > MAX_DELETED_LINES) {
        largeDeletions.push({ file, count: removed });
      }
      continue;
    }

    const added = isCode(file) ? addedLines(beforeContent, after) : [];
    const lines: CommentLines =
      added.length > 0 ? commentLines(file, after) : { comment: new Set(), doc: new Set() };
    for (const entry of added) {
      if (/\b(?:TODO|FIXME)\b/.test(entry.text)) {
        todos.push({ file, ...entry });
      }
      if (lines.comment.has(entry.line) && !(options.allowDocs === true && lines.doc.has(entry.line))) {
        comments.push({ file, ...entry });
      }
      if (DEBUG_OUTPUT.test(entry.text)) {
        debug.push({ file, ...entry });
      }
      if (ANY_TYPE.test(entry.text)) {
        unsafeTypes.push({ file, ...entry });
      }
      if (isTestFile(file) && SKIPPED_TEST.test(entry.text)) {
        skippedTests.push({ file, ...entry });
      }
    }

    if (isTestFile(file)) {
      const beforeTests = countMatches(beforeContent, TEST_DECLARATION);
      const afterTests = countMatches(after, TEST_DECLARATION);
      if (afterTests < beforeTests) {
        reducedTests.push({ file, count: beforeTests - afterTests });
      }
    }

    const removed = removedLineCount(beforeContent, after);
    if (removed > MAX_DELETED_LINES) {
      largeDeletions.push({ file, count: removed });
    }
  }

  const risks: Risk[] = [];
  if (comments.length > 0) {
    risks.push(
      risk('La auditoría detectó comentarios nuevos', describe(comments, 'Comentarios añadidos'), 'high')
    );
  }
  if (todos.length > 0) {
    risks.push(risk('La auditoría detectó TODO/FIXME nuevos', describe(todos, 'Pendientes añadidos'), 'high'));
  }
  if (skippedTests.length > 0) {
    risks.push(
      risk(
        'La auditoría detectó tests omitidos o enfocados',
        describe(skippedTests, 'Tests añadidos'),
        'high'
      )
    );
  }
  if (deletedTests.length > 0) {
    risks.push(
      risk(
        'La auditoría detectó archivos de test eliminados',
        describe(deletedTests, 'Archivos eliminados'),
        'high'
      )
    );
  }
  if (lockfiles.length > 0) {
    risks.push(
      risk(
        'La auditoría detectó cambios en lockfiles',
        describe(lockfiles, 'Archivos modificados'),
        'high'
      )
    );
  }
  if (debug.length > 0) {
    risks.push(
      risk('La auditoría detectó salida de depuración', describe(debug, 'Líneas añadidas'), 'medium')
    );
  }
  if (unsafeTypes.length > 0) {
    risks.push(
      risk('La auditoría detectó tipos any nuevos', describe(unsafeTypes, 'Líneas añadidas'), 'medium')
    );
  }
  if (reducedTests.length > 0) {
    const details = reducedTests
      .map((finding) => `${finding.file} (${finding.count ?? 0} menos)`)
      .slice(0, MAX_EXAMPLES)
      .join(', ');
    risks.push(
      risk('La auditoría detectó menos casos de prueba', `Archivos afectados: ${details}.`, 'medium')
    );
  }
  if (largeDeletions.length > 0) {
    const details = largeDeletions
      .map((finding) => `${finding.file} (${finding.count ?? 0} líneas)`)
      .slice(0, MAX_EXAMPLES)
      .join(', ');
    risks.push(
      risk('La auditoría detectó borrados masivos', `Archivos afectados: ${details}.`, 'medium')
    );
  }
  return risks;
}
