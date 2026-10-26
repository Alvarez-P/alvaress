import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempDir, writeFile, writeJson, fakeAider, baseConfig } from './helpers.js';

const CLI = path.join(process.cwd(), 'dist', 'index.js');

interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], options: { cwd?: string; home?: string; pathPrefix?: string[] } = {}): CliResult {
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (options.home) {
    env.HOME = options.home;
  }
  if (options.pathPrefix && options.pathPrefix.length > 0) {
    env.PATH = [...options.pathPrefix, env.PATH ?? ''].join(path.delimiter);
  }
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: options.cwd ?? process.cwd(),
    env,
    encoding: 'utf-8'
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function manifest(): string {
  return `specification: "1.0.0"
project: "demo-app"
bounded_contexts:
  - name: "billing"
    path: "src/billing"
specs:
  - id: "SPEC-001"
    title: "Facturación"
    status: "Proposed"
    context: "billing"
    tasks:
      - id: "TASK-01"
        description: "Crear repositorio"
        status: "Pending"
`;
}

function project(): string {
  const temp = makeTempDir('harness-cli-');
  writeFile(path.join(temp.path, 'openspec.yaml'), manifest());
  writeJson(path.join(temp.path, '.alvaressrc.json'), baseConfig());
  writeJson(path.join(temp.path, 'package.json'), { name: 'demo-app' });
  return temp.path;
}

test('--version y --help', () => {
  const version = runCli(['--version']);
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), '0.1.0');

  const help = runCli(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /alvaress install/);
  assert.match(help.stdout, /alvaress apply/);
});

test('comando desconocido termina con código 1', () => {
  const result = runCli(['no-existe']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Comando desconocido/);
});

test('init crea el manifiesto y las skills sin enlaces globales', () => {
  const temp = makeTempDir('harness-init-');
  const home = path.join(temp.path, 'home');
  const root = path.join(temp.path, 'project');
  fs.mkdirSync(home);
  fs.mkdirSync(root);
  writeJson(path.join(root, 'package.json'), { name: 'demo-app' });

  try {
    const result = runCli(['init', '--no-link'], { cwd: root, home });
    assert.equal(result.status, 0);
    assert.ok(fs.existsSync(path.join(root, 'openspec.yaml')));
    assert.ok(fs.existsSync(path.join(root, '.harness', 'skills', 'read-spec-first', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(root, '.opencode', 'agents', 'alvaress.md')));
    assert.equal(fs.existsSync(path.join(home, '.config', 'opencode', 'skills')), false);
    assert.equal(fs.existsSync(path.join(home, '.config', 'opencode', 'agents')), false);
  } finally {
    temp.cleanup();
  }
});

test('init conecta la bóveda Obsidian configurada', () => {
  const temp = makeTempDir('harness-init-vault-');
  const home = path.join(temp.path, 'home');
  const root = path.join(temp.path, 'project');
  const vault = path.join(temp.path, 'vault');
  fs.mkdirSync(home);
  fs.mkdirSync(root);
  writeJson(path.join(root, 'package.json'), { name: 'demo-app' });
  writeJson(path.join(root, '.alvaressrc.json'), baseConfig({ obsidianVaultPath: vault }));

  try {
    const result = runCli(['init', '--no-link'], { cwd: root, home });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Bóveda Obsidian conectada/);
    assert.ok(fs.lstatSync(path.join(vault, 'Harness', 'Tasks')).isSymbolicLink());
    assert.ok(fs.existsSync(path.join(vault, 'Harness', 'demo-app.md')));
    assert.ok(fs.existsSync(path.join(vault, 'Harness', 'openspec.yaml')));
  } finally {
    temp.cleanup();
  }
});

test('agent show imprime el prompt y agent install escribe las dos ubicaciones', () => {
  const temp = makeTempDir('harness-agent-');
  const home = path.join(temp.path, 'home');
  const root = path.join(temp.path, 'project');
  fs.mkdirSync(home);
  fs.mkdirSync(root);

  try {
    const show = runCli(['agent', 'show'], { cwd: root, home });
    assert.equal(show.status, 0);
    assert.match(show.stdout, /^---/);
    assert.match(show.stdout, /mode: primary/);
    assert.match(show.stdout, /alvaress run "<petición>"/);

    const install = runCli(['agent', 'install'], { cwd: root, home });
    assert.equal(install.status, 0);
    assert.ok(fs.existsSync(path.join(home, '.config', 'opencode', 'agents', 'alvaress.md')));
    assert.ok(fs.existsSync(path.join(root, '.opencode', 'agents', 'alvaress.md')));
  } finally {
    temp.cleanup();
  }
});

test('config paths y config show respetan HOME y enmascaran secretos', () => {
  const temp = makeTempDir('harness-config-');
  const home = path.join(temp.path, 'home');
  const root = path.join(temp.path, 'project');
  fs.mkdirSync(home);
  fs.mkdirSync(root);
  writeJson(path.join(home, '.alvaressconfig.json'), baseConfig({
    models: {
      aiderImplementer: { modelName: 'global-implementer', apiKey: 'implementer-secret', env: {} }
    }
  }));
  writeJson(path.join(root, '.alvaressrc.json'), baseConfig());

  try {
    const paths = runCli(['config', 'paths'], { cwd: root, home });
    assert.equal(paths.status, 0);
    const parsed = JSON.parse(paths.stdout) as { global: string; local: string };
    assert.equal(parsed.global, path.join(home, '.alvaressconfig.json'));
    assert.equal(parsed.local, path.join(root, '.alvaressrc.json'));

    const show = runCli(['config', 'show'], { cwd: root, home });
    assert.equal(show.status, 0);
    assert.match(show.stdout, /\*{8}/);
    assert.doesNotMatch(show.stdout, /implementer-secret/);
  } finally {
    temp.cleanup();
  }
});

test('apply --dry-run no invoca Aider', () => {
  const temp = makeTempDir('harness-dry-');
  const home = path.join(temp.path, 'home');
  fs.mkdirSync(home);
  const root = project();

  try {
    const result = runCli(['apply', '--dry-run'], { cwd: root, home });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Modo dry-run/);
    assert.match(result.stdout, /TASK-01/);
  } finally {
    temp.cleanup();
  }
});

test('apply ejecuta Aider y verifica la tarea', () => {
  const temp = makeTempDir('harness-apply-');
  const home = path.join(temp.path, 'home');
  const bin = path.join(temp.path, 'bin');
  fs.mkdirSync(home);
  fs.mkdirSync(bin);
  fakeAider(bin, { log: path.join(temp.path, 'aider.log') });
  const root = project();

  try {
    const result = runCli(['apply'], { cwd: root, home, pathPrefix: [bin] });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Verificadas: 1/);
    assert.match(fs.readFileSync(path.join(root, 'openspec.yaml'), 'utf-8'), /status: "?Done"?/);
  } finally {
    temp.cleanup();
  }
});

test('agent install escribe también los subagentes', () => {
  const temp = makeTempDir('harness-agent-sub-');
  const home = path.join(temp.path, 'home');
  const root = path.join(temp.path, 'project');
  fs.mkdirSync(home);
  fs.mkdirSync(root);

  try {
    const result = runCli(['agent', 'install'], { cwd: root, home });
    assert.equal(result.status, 0);
    for (const name of ['alvaress-explorer', 'alvaress-implementer', 'alvaress-verifier', 'alvaress-fixer']) {
      assert.ok(fs.existsSync(path.join(home, '.config', 'opencode', 'agents', `${name}.md`)));
      assert.ok(fs.existsSync(path.join(root, '.opencode', 'agents', `${name}.md`)));
    }
  } finally {
    temp.cleanup();
  }
});

test('doctor informa del estado y devuelve JSON', () => {
  const temp = makeTempDir('harness-doctor-');
  const home = path.join(temp.path, 'home');
  fs.mkdirSync(home);
  const root = project();
  writeJson(path.join(root, '.alvaressrc.json'), baseConfig({ obsidianVaultPath: '' }));

  try {
    const result = runCli(['doctor', '--json'], { cwd: root, home });
    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout) as { checks: Array<{ name: string; status: string }> };
    assert.ok(parsed.checks.some((entry) => entry.name === 'manifest' && entry.status === 'ok'));
    assert.ok(parsed.checks.some((entry) => entry.name === 'package-manager'));
  } finally {
    temp.cleanup();
  }
});

test('report y restore list muestran los artefactos de la ejecución', () => {
  const temp = makeTempDir('harness-report-');
  const home = path.join(temp.path, 'home');
  const bin = path.join(temp.path, 'bin');
  fs.mkdirSync(home);
  fs.mkdirSync(bin);
  fakeAider(bin, { log: path.join(temp.path, 'aider.log') });
  const root = project();

  try {
    const applied = runCli(['apply'], { cwd: root, home, pathPrefix: [bin] });
    assert.equal(applied.status, 0);

    const report = runCli(['report', 'latest'], { cwd: root, home });
    assert.equal(report.status, 0);
    const parsed = JSON.parse(report.stdout) as { verified: number };
    assert.equal(parsed.verified, 1);

    const list = runCli(['report', 'list'], { cwd: root, home });
    assert.equal(list.status, 0);
    assert.match(list.stdout, /verified=1/);

    const backups = runCli(['restore', '--list'], { cwd: root, home });
    assert.equal(backups.status, 0);
    assert.match(backups.stdout, /openspec\.yaml|bytes/);
  } finally {
    temp.cleanup();
  }
});

test('archive archiva una spec completada', () => {
  const temp = makeTempDir('harness-archive-');
  const home = path.join(temp.path, 'home');
  fs.mkdirSync(home);
  const root = project();

  try {
    writeFile(
      path.join(root, 'openspec.yaml'),
      manifest().replace('status: "Pending"', 'status: "Done"')
    );
    const result = runCli(['archive', 'SPEC-001'], { cwd: root, home });
    assert.equal(result.status, 0);
    assert.match(fs.readFileSync(path.join(root, 'openspec.yaml'), 'utf-8'), /status: "?Archived"?/);
  } finally {
    temp.cleanup();
  }
});

test('verify devuelve 0 cuando la validación pasa y 1 cuando falla', () => {
  const temp = makeTempDir('harness-verify-');
  const home = path.join(temp.path, 'home');
  fs.mkdirSync(home);
  const root = project();

  try {
    const ok = runCli(['verify', 'TASK-01'], { cwd: root, home });
    assert.equal(ok.status, 0);
    assert.match(ok.stdout, /validada con éxito/);

    writeJson(path.join(root, '.alvaressrc.json'), baseConfig({
      validation: { maxAttempts: 1, commands: ['false'] }
    }));
    const failed = runCli(['verify', 'TASK-01'], { cwd: root, home });
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /no pudo ser auto-corregida/);
  } finally {
    temp.cleanup();
  }
});
