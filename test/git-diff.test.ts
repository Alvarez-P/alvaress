import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { workingTreeDiff, workingTreeStat } from '../src/orchestrator/git-diff.js';
import { makeTempDir } from './helpers.js';

function git(root: string, args: string[]): void {
  execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], { cwd: root, stdio: 'ignore' });
}

function initRepo(root: string): void {
  fs.mkdirSync(root, { recursive: true });
  git(root, ['init']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(root, 'app.ts'), 'const value = 1;\n');
  fs.writeFileSync(path.join(root, 'other.ts'), 'const other = 1;\n');
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'init']);
}

test('workingTreeDiff devuelve el diff del archivo pedido', async () => {
  const temp = makeTempDir('alvaress-git-diff-');
  try {
    const root = path.join(temp.path, 'repo');
    initRepo(root);
    fs.writeFileSync(path.join(root, 'app.ts'), 'const value = 2;\n');

    const diff = await workingTreeDiff(root, ['app.ts']);

    assert.match(diff ?? '', /\+const value = 2/);
    assert.doesNotMatch(diff ?? '', /other\.ts/);
  } finally {
    temp.cleanup();
  }
});

test('workingTreeDiff trunca y explica cómo pedir el resto', async () => {
  const temp = makeTempDir('alvaress-git-diff-cut-');
  try {
    const root = path.join(temp.path, 'repo');
    initRepo(root);
    fs.writeFileSync(path.join(root, 'app.ts'), `const value = "${'x'.repeat(200)}";\n`);

    const diff = await workingTreeDiff(root, ['app.ts'], 60);

    assert.match(diff ?? '', /diff truncado/);
    assert.match(diff ?? '', /git diff -- <archivo>/);
  } finally {
    temp.cleanup();
  }
});

test('workingTreeDiff no devuelve nada fuera de un repositorio git', async () => {
  const temp = makeTempDir('alvaress-git-diff-none-');
  try {
    const root = path.join(temp.path, 'plain');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'app.ts'), 'const value = 1;\n');

    assert.equal(await workingTreeDiff(root, ['app.ts']), undefined);
  } finally {
    temp.cleanup();
  }
});

test('workingTreeDiff incluye archivos nuevos sin seguimiento y omite artefactos', async () => {
  const temp = makeTempDir('alvaress-git-diff-new-');
  try {
    const root = path.join(temp.path, 'repo');
    initRepo(root);
    fs.writeFileSync(path.join(root, 'nuevo.ts'), 'export const nuevo = 1;\n');
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(root, 'dist', 'out.js'), 'compiled\n');
    fs.writeFileSync(path.join(root, 'blob.bin'), Buffer.from([0, 1, 2]));

    const diff = await workingTreeDiff(root);

    assert.match(diff ?? '', /\+export const nuevo = 1/);
    assert.doesNotMatch(diff ?? '', /dist\/out\.js/);
    assert.doesNotMatch(diff ?? '', /blob\.bin/);
  } finally {
    temp.cleanup();
  }
});

test('workingTreeStat resume cambios y archivos nuevos sin el contenido', async () => {
  const temp = makeTempDir('alvaress-git-diff-stat-');
  try {
    const root = path.join(temp.path, 'repo');
    initRepo(root);
    fs.writeFileSync(path.join(root, 'app.ts'), 'const value = 2;\n');
    fs.writeFileSync(path.join(root, 'nuevo.ts'), 'export const nuevo = 1;\n');

    const stat = await workingTreeStat(root);

    assert.match(stat ?? '', /app\.ts \|/);
    assert.match(stat ?? '', /nuevo\.ts \| nuevo/);
    assert.doesNotMatch(stat ?? '', /const value = 2/);
  } finally {
    temp.cleanup();
  }
});
