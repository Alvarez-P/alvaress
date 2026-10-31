import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { auditWorkspace, snapshotFileContents } from '../src/orchestrator/audit.js';
import { makeTempDir, writeFile } from './helpers.js';

function git(root: string, args: string[]): void {
  execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], { cwd: root, stdio: 'ignore' });
}

function repo(files: Record<string, string>): { root: string; cleanup: () => void } {
  const temp = makeTempDir('alvaress-audit-');
  const root = temp.path;
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test']);
  for (const [file, content] of Object.entries(files)) {
    writeFile(path.join(root, file), content);
  }
  git(root, ['add', '.']);
  git(root, ['commit', '-q', '-m', 'init']);
  return { root, cleanup: temp.cleanup };
}

function titles(
  root: string,
  files: string[],
  change: () => void,
  options: { allowDocs?: boolean } = {}
): string[] {
  const before = snapshotFileContents(root, files);
  change();
  return auditWorkspace(root, before, [], options).map((risk) => `${risk.severity}: ${risk.title}`);
}

test('auditWorkspace bloquea comentarios y TODO nuevos en código', () => {
  const { root, cleanup } = repo({ 'src/a.ts': '// existente\nexport const a = 1;\n' });
  try {
    const found = titles(root, ['src/a.ts'], () => {
      writeFile(path.join(root, 'src/a.ts'), '// existente\n// TODO: revisar\nexport const a = 2;\n');
    });

    assert.ok(found.includes('high: La auditoría detectó comentarios nuevos'));
    assert.ok(found.includes('high: La auditoría detectó TODO/FIXME nuevos'));
  } finally {
    cleanup();
  }
});

test('auditWorkspace ignora comentarios previos y archivos que no son código', () => {
  const { root, cleanup } = repo({ 'src/a.ts': '// existente\nexport const a = 1;\n', 'notas.md': '# notas\n' });
  try {
    const found = titles(root, ['src/a.ts', 'notas.md'], () => {
      writeFile(path.join(root, 'src/a.ts'), '// existente\nexport const a = 2;\n');
      writeFile(path.join(root, 'notas.md'), '# notas\n- TODO: documentar\n');
      writeFile(path.join(root, 'run.log'), 'TODO/FIXME en un log\n');
    });

    assert.deepEqual(found, []);
  } finally {
    cleanup();
  }
});

test('auditWorkspace detecta tests omitidos, borrados y lockfiles', () => {
  const { root, cleanup } = repo({
    'test/a.test.ts': "test('uno', () => {});\ntest('dos', () => {});\n",
    'test/b.test.ts': "test('tres', () => {});\n",
    'pnpm-lock.yaml': 'lockfileVersion: 9\n'
  });
  try {
    const found = titles(root, ['test/a.test.ts', 'test/b.test.ts', 'pnpm-lock.yaml'], () => {
      writeFile(path.join(root, 'test/a.test.ts'), "test.skip('uno', () => {});\n");
      fs.rmSync(path.join(root, 'test/b.test.ts'));
      writeFile(path.join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 10\n');
    });

    assert.ok(found.includes('high: La auditoría detectó tests omitidos o enfocados'));
    assert.ok(found.includes('high: La auditoría detectó archivos de test eliminados'));
    assert.ok(found.includes('high: La auditoría detectó cambios en lockfiles'));
    assert.ok(found.includes('medium: La auditoría detectó menos casos de prueba'));
  } finally {
    cleanup();
  }
});

test('auditWorkspace reporta console.log y any como riesgo medio', () => {
  const { root, cleanup } = repo({ 'src/a.ts': 'export const a = 1;\n' });
  try {
    const found = titles(root, ['src/a.ts'], () => {
      writeFile(path.join(root, 'src/a.ts'), 'export const a = 1 as any;\nconsole.log(a);\n');
    });

    assert.deepEqual(found.toSorted(), [
      'medium: La auditoría detectó salida de depuración',
      'medium: La auditoría detectó tipos any nuevos'
    ]);
  } finally {
    cleanup();
  }
});

test('auditWorkspace no confunde continuaciones con * ni directivas con comentarios', () => {
  const { root, cleanup } = repo({ 'src/a.ts': 'export const a = 1;\n' });
  try {
    const found = titles(root, ['src/a.ts'], () => {
      writeFile(
        path.join(root, 'src/a.ts'),
        [
          '// @ts-expect-error valor externo',
          'export const a = 1',
          '  * 2;',
          '/* eslint-disable no-console */',
          '#!/not-a-comment-in-ts',
          ''
        ].join('\n')
      );
    });

    assert.deepEqual(found, []);
  } finally {
    cleanup();
  }
});

test('auditWorkspace permite JSDoc solo cuando la tarea lo pide', () => {
  const after = '/**\n * Suma dos números.\n */\nexport const a = 1;\n// extra\n';
  const { root, cleanup } = repo({ 'src/a.ts': 'export const a = 1;\n' });
  try {
    const before = snapshotFileContents(root, ['src/a.ts']);
    writeFile(path.join(root, 'src/a.ts'), after);
    const comments = (allowDocs: boolean): string =>
      auditWorkspace(root, before, [], { allowDocs }).find(
        (risk) => risk.title === 'La auditoría detectó comentarios nuevos'
      )?.description ?? '';

    assert.match(comments(false), /src\/a\.ts:1/);
    assert.doesNotMatch(comments(true), /src\/a\.ts:[123] /);
    assert.match(comments(true), /src\/a\.ts:5 \(\/\/ extra\)/);
  } finally {
    cleanup();
  }
});
