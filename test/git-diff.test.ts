import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { workingTreeDiff } from '../src/orchestrator/git-diff.js';
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
