import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runHarnessCommand } from '../src/commands/run.js';
import type {
  DecisionEngine,
  HarnessState,
  HarnessUI,
  RouteDecision,
  WorkPlan,
  WorkResult,
  Worker
} from '../src/core/contracts.js';
import { buildCommitMessage, commitRun } from '../src/orchestrator/commit.js';
import { listAllReports, readAnyReport } from '../src/orchestrator/report.js';
import { CommandValidator } from '../src/orchestrator/validator.js';
import { loadConfig, mergeConfig } from '../src/config/loader.js';
import { SubagentWorker } from '../src/orchestrator/workers.js';
import {
  baseConfig,
  makeTempDir,
  writeExecutable,
  writeFile,
  writeJson
} from './helpers.js';

const tempDirs: string[] = [];

process.on('exit', () => {
  for (const directory of tempDirs) {
    try {
      fs.rmSync(directory, { recursive: true, force: true });
    } catch {
      // La limpieza no debe afectar al resultado de los tests.
    }
  }
});

function git(root: string, args: string[]): string {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf-8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function initRepo(root: string): void {
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'alvaress@example.com']);
  git(root, ['config', 'user.name', 'alvaress']);
  writeFile(path.join(root, 'README.md'), '# demo\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-q', '-m', 'init']);
}

function manifest(): string {
  return `specification: "1.0.0"
project: "demo-app"
bounded_contexts:
  - name: "core"
    path: "src"
specs:
  - id: "SPEC-001"
    title: "Demo"
    status: "Proposed"
    context: "core"
    tasks:
      - id: "TASK-01"
        description: "Crear helper"
        status: "Pending"
        files:
          - "src/a.ts"
        acceptance:
          - "El helper compila"
          - "La validación pasa"
        validation:
          - "true"
`;
}

function oddNote(vault: string): string {
  const note = path.join(vault, 'Harness', 'demo-app.md');
  writeFile(
    note,
    [
      '# demo-app',
      '',
      '## Criterios de aceptación',
      '',
      '- [ ] El helper responde',
      '',
      '## Archivos asignados',
      '',
      '- src/a.ts',
      ''
    ].join('\n')
  );
  return note;
}

function fakeUi(): HarnessUI & { states: HarnessState[] } {
  const states: HarnessState[] = [];
  return {
    states,
    start(state) {
      states.push(state);
    },
    setState(state) {
      states.push(state);
    },
    stop() {}
  };
}

function fakeDecisions(mode: 'odd' | 'sdd'): DecisionEngine {
  const route: RouteDecision = {
    mode,
    complexity: 'small',
    needsGraph: false,
    needsSubagents: false,
    confidence: 0.8,
    source: 'heuristic'
  };
  return {
    async route() {
      return route;
    },
    async assessRisk() {
      return { risks: [], confidence: 0.5, source: 'heuristic' };
    },
    async classifyFailure() {
      return {
        trivial: true,
        nuclear: false,
        reason: 'fallo local',
        confidence: 0.8,
        source: 'heuristic'
      };
    },
    async decideLearningScope() {
      return {
        scope: 'project',
        confidence: 0.8,
        reason: 'aprendizaje del proyecto',
        source: 'heuristic'
      };
    }
  };
}

function fakeWorker(action: (plan: WorkPlan) => WorkResult | Promise<WorkResult>): Worker {
  return {
    kind: 'subagent',
    async work(plan) {
      return action(plan);
    },
    async fix() {
      return { verdict: 'fixed', changes: [], cause: 'sin cambios', risks: [] };
    }
  };
}

function project(options: { vault?: boolean; sdd?: boolean } = {}): {
  root: string;
  vault: string;
  config: ReturnType<typeof loadConfig>;
} {
  const temp = makeTempDir('alvaress-run-');
  tempDirs.push(temp.path);
  const root = temp.path;
  const vault = path.join(root, 'vault');
  writeJson(path.join(root, 'package.json'), { name: 'demo-app' });
  initRepo(root);
  writeFile(path.join(root, 'src', 'a.ts'), 'export const a = 1;\n');
  git(root, ['add', 'src/a.ts']);
  git(root, ['commit', '-q', '-m', 'add src']);

  if (options.sdd === true) {
    writeFile(path.join(root, 'openspec.yaml'), manifest());
    git(root, ['add', 'openspec.yaml']);
    git(root, ['commit', '-q', '-m', 'add manifest']);
  }

  writeJson(
    path.join(root, '.alvaressrc.json'),
    baseConfig({
      obsidianVaultPath: options.vault === false ? '' : vault,
      aider: { enabled: false },
      validation: { maxAttempts: 1, commands: ['true'] }
    })
  );

  if (options.vault !== false) {
    oddNote(vault);
  }

  return { root, vault, config: loadConfig(root) };
}

test('run ODD termina en Ready, valida y cierra el checklist de Obsidian', async () => {
  const fixture = project();
  const note = path.join(fixture.vault, 'Harness', 'demo-app.md');
  const ui = fakeUi();
  let received: WorkPlan | undefined;

  const code = await runHarnessCommand(['agrega un helper', '--no-commit'], fixture.root, {
    config: fixture.config,
    decisions: fakeDecisions('odd'),
    worker: fakeWorker((plan) => {
      received = plan;
      writeFile(path.join(fixture.root, 'src', 'a.ts'), 'export const a = 2;\n');
      return {
        status: 'done',
        changes: [{ path: 'src/a.ts', change: 'ajustó el helper', kind: 'modified' }],
        risks: []
      };
    }),
    ui,
    lock: false
  });

  assert.equal(code, 0);
  assert.equal(received?.mode, 'odd');
  assert.deepEqual(received?.files, ['src/a.ts']);
  assert.deepEqual(ui.states, ['Exploring', 'Working', 'Checking', 'Ready']);
  assert.match(fs.readFileSync(note, 'utf-8'), /- \[x\] El helper responde/);
  assert.ok(fs.existsSync(path.join(fixture.root, '.laya', 'last_run.log')));
  assert.match(
    fs.readFileSync(path.join(fixture.root, '.laya', 'last_run.log'), 'utf-8'),
    /resultado: Ready/
  );
});

test('run SDD con --task marca la tarea Done y hace commit solo de los archivos del run', async () => {
  const fixture = project({ sdd: true });
  writeFile(path.join(fixture.root, 'otro.txt'), 'no debe entrar\n');

  const code = await runHarnessCommand(['--task', 'TASK-01', '--mode', 'sdd'], fixture.root, {
    config: fixture.config,
    decisions: fakeDecisions('sdd'),
    worker: fakeWorker(() => {
      writeFile(path.join(fixture.root, 'src', 'a.ts'), 'export const a = 3;\n');
      return {
        status: 'done',
        changes: [{ path: 'src/a.ts', change: 'implementó el helper', kind: 'modified' }],
        risks: []
      };
    }),
    ui: fakeUi(),
    lock: false
  });

  assert.equal(code, 0);
  const manifestText = fs.readFileSync(path.join(fixture.root, 'openspec.yaml'), 'utf-8');
  assert.match(manifestText, /status: "?Done"?/);

  const committed = git(fixture.root, ['show', '--name-only', '--format=', 'HEAD']);
  assert.match(committed, /src\/a\.ts/);
  assert.match(committed, /openspec\.yaml/);
  assert.doesNotMatch(committed, /otro\.txt/);
  assert.match(git(fixture.root, ['log', '-1', '--format=%s']), /^chore\(alvaress\): completa TASK-01/);

  const status = git(fixture.root, ['status', '--porcelain']);
  assert.match(status, /\?\? otro\.txt/);
});

test('run HALT escribe .laya/HALT.json y devuelve código 1', async () => {
  const fixture = project({ sdd: true });

  const code = await runHarnessCommand(['--task', 'TASK-01'], fixture.root, {
    config: fixture.config,
    decisions: fakeDecisions('sdd'),
    worker: fakeWorker(() => ({
      status: 'failed',
      changes: [],
      risks: [],
      detail: 'el subagente se cayó'
    })),
    ui: fakeUi(),
    lock: false
  });

  assert.equal(code, 1);
  const halt = JSON.parse(
    fs.readFileSync(path.join(fixture.root, '.laya', 'HALT.json'), 'utf-8')
  ) as { code: string; detail: string; runId: string };
  assert.equal(halt.code, 'worker');
  assert.match(halt.detail, /subagente/);
  assert.ok(halt.runId.startsWith('run-'));
  assert.match(
    fs.readFileSync(path.join(fixture.root, 'openspec.yaml'), 'utf-8'),
    /status: "?Failed"?/
  );
});

test('run --dry-run explora y no invoca al worker ni escribe en Obsidian', async () => {
  const fixture = project();
  const note = path.join(fixture.vault, 'Harness', 'demo-app.md');
  const before = fs.readFileSync(note, 'utf-8');
  const chunks: string[] = [];
  const stdout = {
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    }
  } as unknown as NodeJS.WriteStream;

  let called = false;
  const code = await runHarnessCommand(['agrega un helper', '--dry-run'], fixture.root, {
    config: fixture.config,
    decisions: fakeDecisions('odd'),
    worker: fakeWorker(() => {
      called = true;
      return { status: 'done', changes: [], risks: [] };
    }),
    ui: fakeUi(),
    stdout,
    lock: false
  });

  assert.equal(code, 0);
  assert.equal(called, false);
  assert.equal(fs.readFileSync(note, 'utf-8'), before);
  assert.match(chunks.join(''), /DRY-RUN/);
  assert.match(chunks.join(''), /No se invocó al worker/);
});

test('run -i muestra el log del último run', async () => {
  const fixture = project();
  await runHarnessCommand(['agrega un helper', '--no-commit'], fixture.root, {
    config: fixture.config,
    decisions: fakeDecisions('odd'),
    worker: fakeWorker(() => {
      writeFile(path.join(fixture.root, 'src', 'a.ts'), 'export const a = 4;\n');
      return {
        status: 'done',
        changes: [{ path: 'src/a.ts', change: 'ajustó', kind: 'modified' }],
        risks: []
      };
    }),
    ui: fakeUi(),
    lock: false
  });

  const chunks: string[] = [];
  const stdout = {
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    }
  } as unknown as NodeJS.WriteStream;

  const code = await runHarnessCommand(['-i'], fixture.root, { stdout });
  assert.equal(code, 0);
  assert.match(chunks.join(''), /# alvaress run/);
  assert.match(chunks.join(''), /resultado: Ready/);
});

test('SubagentWorker invoca opencode con el subagente y detecta el diff', async () => {
  const fixture = project();
  const bin = path.join(fixture.root, 'bin');
  const log = path.join(fixture.root, 'opencode.log');
  fs.mkdirSync(bin, { recursive: true });
  writeExecutable(
    path.join(bin, 'opencode'),
    [
      '#!/bin/sh',
      `printf '%s\\n' "$*" >> '${log}'`,
      `printf 'export const a = 5;\\n' > '${path.join(fixture.root, 'src', 'a.ts')}'`,
      'exit 0',
      ''
    ].join('\n')
  );

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}`
  };

  const code = await runHarnessCommand(['agrega un helper', '--no-commit'], fixture.root, {
    config: fixture.config,
    decisions: fakeDecisions('odd'),
    env,
    ui: fakeUi(),
    lock: false
  });

  assert.equal(code, 0);
  const args = fs.readFileSync(log, 'utf-8');
  assert.match(args, /run --agent alvaress-implementer-lite --auto/);
  assert.equal(fs.readFileSync(path.join(fixture.root, 'src', 'a.ts'), 'utf-8'), 'export const a = 5;\n');
});

test('SubagentWorker pasa el modelo y reutiliza la sesión del run', async () => {
  const temp = makeTempDir('alvaress-subagent-session-');
  try {
    const root = path.join(temp.path, 'project');
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    writeFile(path.join(root, 'src', 'a.ts'), 'export const a = 1;\n');
    const bin = path.join(temp.path, 'bin');
    const log = path.join(temp.path, 'opencode.log');
    fs.mkdirSync(bin, { recursive: true });
    writeExecutable(
      path.join(bin, 'opencode'),
      [
        '#!/bin/sh',
        `printf '%s\\n' "$*" >> '${log}'`,
        `n=$(cat '${temp.path}/n' 2>/dev/null || echo 0)`,
        `n=$((n+1)); printf '%s' "$n" > '${temp.path}/n'`,
        `printf 'export const a = %s;\\n' "$n" > '${root}/src/a.ts'`,
        'exit 0',
        ''
      ].join('\n')
    );

    const config = mergeConfig(
      { models: { subagents: { modelName: 'openai/gpt-5-mini' } } },
      {}
    );
    const worker = new SubagentWorker({
      root,
      config,
      env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}` }
    });

    const plan: WorkPlan = {
      runId: 'run-20261027120000-abc123',
      mode: 'odd',
      complexity: 'small',
      request: 'cambia el helper',
      source: 'nota',
      acceptance: ['compila'],
      files: ['src/a.ts'],
      validation: ['true'],
      learnings: []
    };

    await worker.work(plan);
    await worker.work({ ...plan, complexity: 'medium' });
    await worker.fix({
      runId: plan.runId,
      attempt: 1,
      files: ['src/a.ts'],
      failure: { ok: false, commands: [{ command: 'true', code: 1 }], warnings: [] },
      error: 'falló'
    });

    const lines = fs
      .readFileSync(log, 'utf-8')
      .split('\n')
      .filter((line) => line.startsWith('run '));
    assert.equal(lines.length, 3);
    assert.match(lines[0] ?? '', /--agent alvaress-implementer-lite/);
    assert.match(lines[1] ?? '', /--agent alvaress-implementer /);
    assert.match(lines[2] ?? '', /--agent alvaress-fixer/);
    for (const line of lines) {
      assert.match(line, /--model openai\/gpt-5-mini/);
    }
    const sessions = lines.map((line) => /--session (\S+)/.exec(line)?.[1]);
    assert.equal(sessions[0], sessions[1]);
    assert.equal(sessions[1], sessions[2]);
  } finally {
    temp.cleanup();
  }
});

test('CommandValidator recoge warnings y se detiene en el primer fallo', async () => {
  const config = loadConfig(process.cwd());
  const ok = await new CommandValidator({
    root: process.cwd(),
    config,
    commands: ['echo "warning: revisa el import"']
  }).validate([]);
  assert.equal(ok.ok, true);
  assert.equal(ok.warnings.length, 1);
  assert.match(ok.warnings[0] ?? '', /revisa el import/);

  const failed = await new CommandValidator({
    root: process.cwd(),
    config,
    commands: ['false', 'true']
  }).validate([]);
  assert.equal(failed.ok, false);
  assert.equal(failed.commands.length, 1);
  assert.equal(failed.commands[0]?.code, 1);
});

test('run escribe un reporte JSON en .harness/runs y report lo lista', async () => {
  const fixture = project();

  const code = await runHarnessCommand(['agrega un helper', '--no-commit'], fixture.root, {
    config: fixture.config,
    decisions: fakeDecisions('odd'),
    worker: fakeWorker(() => {
      writeFile(path.join(fixture.root, 'src', 'a.ts'), 'export const a = 7;\n');
      return {
        status: 'done',
        changes: [{ path: 'src/a.ts', change: 'ajustó', kind: 'modified' }],
        risks: []
      };
    }),
    ui: fakeUi(),
    lock: false
  });

  assert.equal(code, 0);
  const reports = listAllReports(fixture.root);
  assert.equal(reports.length, 1);
  const report = reports[0];
  assert.equal(report?.command, 'run');
  assert.equal(report?.state, 'Ready');
  assert.equal(report?.mode, 'odd');
  assert.deepEqual(
    report?.changes.map((change) => change.path),
    ['src/a.ts']
  );

  const id = report?.id ?? '';
  const loaded = readAnyReport(fixture.root, id);
  assert.equal(loaded?.id, id);
  assert.ok(fs.existsSync(path.join(fixture.root, '.harness', 'runs', `${id}-run.json`)));
});

test('buildCommitMessage usa Conventional Commits y commitRun no hace push', () => {
  assert.equal(
    buildCommitMessage({ request: 'arregla el helper', taskId: 'TASK-01', mode: 'sdd' }).split('\n')[0],
    'chore(alvaress): completa TASK-01 - arregla el helper'
  );

  const fixture = project();
  writeFile(path.join(fixture.root, 'src', 'a.ts'), 'export const a = 6;\n');
  const result = commitRun({
    root: fixture.root,
    files: ['src/a.ts'],
    request: 'ajusta el helper',
    mode: 'odd'
  });
  assert.equal(result.committed, true);
  assert.deepEqual(result.files, ['src/a.ts']);
  assert.ok(result.sha !== undefined);
});
