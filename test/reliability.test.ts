import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { installAgent, renderSubagent, SUBAGENTS } from '../src/agent/installer.js';
import { runArchiveCommand } from '../src/commands/archive.js';
import { runDoctor, runDoctorCommand } from '../src/commands/doctor.js';
import { runObsidianCommand } from '../src/commands/obsidian.js';
import { runJevCommand } from '../src/commands/jev.js';
import { mergeConfig } from '../src/config/loader.js';
import { readJevCache, writeJevCache } from '../src/jev/cache.js';
import type { JevRequest, JevResponse } from '../src/jev/client.js';
import { loadManifest, saveManifest, scaffoldManifest } from '../src/openspec/manifest.js';
import { applyTasks } from '../src/orchestrator/apply.js';
import { backupManifest, listManifestBackups, restoreManifestBackup } from '../src/orchestrator/backup.js';
import { createRunReport, listRunReports, newRunReportId, writeRunReport } from '../src/orchestrator/report.js';
import { outOfScopeFiles } from '../src/orchestrator/scope.js';
import { acquireProjectLock, getLockPath, readProjectLock } from '../src/utils/lock.js';
import {
  defaultValidationCommands,
  resolvePackageManager
} from '../src/utils/package-manager.js';
import { redactSecrets } from '../src/utils/redact.js';
import { LockError } from '../src/utils/errors.js';
import { fakeAider, makeTempDir, writeFile, writeJson, baseConfig, withPathAsync } from './helpers.js';

function manifestWithTasks(tasks: string): string {
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
${tasks}
`;
}

function projectWithManifest(manifest: string, config: Record<string, unknown> = baseConfig()): string {
  const temp = makeTempDir('alvaress-reliability-');
  writeFile(path.join(temp.path, 'openspec.yaml'), manifest);
  writeJson(path.join(temp.path, 'package.json'), { name: 'demo-app' });
  writeJson(path.join(temp.path, '.alvaressrc.json'), config);
  return temp.path;
}

function cleanup(root: string): void {
  fs.rmSync(root, { recursive: true, force: true });
}

test('el lock impide ejecuciones simultáneas y se libera', () => {
  const root = makeTempDir('alvaress-lock-').path;
  try {
    const lock = acquireProjectLock(root, { command: 'test' });
    assert.equal(readProjectLock(root)?.pid, process.pid);
    assert.throws(() => acquireProjectLock(root, { command: 'test' }), LockError);
    lock.release();
    assert.equal(fs.existsSync(getLockPath(root)), false);

    const forced = acquireProjectLock(root, { command: 'test', force: true });
    forced.release();
  } finally {
    cleanup(root);
  }
});

test('applyTasks falla si hay un lock activo', async () => {
  const root = projectWithManifest(
    manifestWithTasks('      - id: "TASK-01"\n        description: "Tarea"\n        status: "Pending"')
  );
  const lock = acquireProjectLock(root, { command: 'otra-ejecucion' });
  try {
    await assert.rejects(() => applyTasks({ root }), LockError);
  } finally {
    lock.release();
    cleanup(root);
  }
});

test('backup y restore conservan el manifiesto original', () => {
  const root = projectWithManifest(manifestWithTasks('      - id: "TASK-01"\n        description: "Tarea"\n        status: "Pending"'));
  try {
    const original = fs.readFileSync(path.join(root, 'openspec.yaml'), 'utf-8');
    const backup = backupManifest(root);
    assert.ok(backup !== undefined);
    assert.equal(listManifestBackups(root).length, 1);

    writeFile(path.join(root, 'openspec.yaml'), 'specification: "2.0.0"\n');
    const restored = restoreManifestBackup(root, 'latest');

    assert.equal(restored.id, backup?.id);
    assert.equal(fs.readFileSync(path.join(root, 'openspec.yaml'), 'utf-8'), original);
  } finally {
    cleanup(root);
  }
});

test('los reportes de ejecución se escriben y se leen', () => {
  const root = makeTempDir('alvaress-report-').path;
  try {
    const id = newRunReportId(new Date('2026-01-02T03:04:05.006Z'));
    const report = createRunReport(
      id,
      new Date('2026-01-02T03:04:05.006Z'),
      [
        {
          specId: 'SPEC-001',
          taskId: 'TASK-01',
          context: 'billing',
          group: 1,
          outcome: 'verified',
          validation: 'ok'
        }
      ]
    );
    const target = writeRunReport(root, report);

    assert.ok(fs.existsSync(target));
    assert.equal(listRunReports(root).length, 1);
    assert.equal(listRunReports(root)[0]?.verified, 1);
  } finally {
    cleanup(root);
  }
});

test('outOfScopeFiles respeta archivos y directorios asignados', () => {
  assert.deepEqual(
    outOfScopeFiles(['src/billing/a.ts', 'src/catalog/b.ts', 'README.md'], ['src/billing']),
    ['src/catalog/b.ts', 'README.md']
  );
  assert.deepEqual(outOfScopeFiles(['src/billing/a.ts'], []), []);
  assert.deepEqual(outOfScopeFiles(['src/billing/a.ts'], ['src/billing/a.ts']), []);
});

test('redactSecrets elimina claves y tokens habituales', () => {
  const redacted = redactSecrets(
    'key sk-abcdefghijklmnopqrstuvwxyz token ghp_abcdefghijklmnopqrstuvwxyz password=supersecret1234'
  );
  assert.doesNotMatch(redacted, /sk-abcdefghijklmnopqrstuvwxyz/);
  assert.doesNotMatch(redacted, /ghp_abcdefghijklmnopqrstuvwxyz/);
  assert.doesNotMatch(redacted, /supersecret1234/);
  assert.match(redacted, /REDACTED/);
});

test('pnpm es el gestor y los comandos de validación por defecto', () => {
  const config = mergeConfig({}, {});
  assert.equal(resolvePackageManager(config), 'pnpm');
  assert.deepEqual(defaultValidationCommands('pnpm'), [
    'pnpm exec oxlint --deny=correctness --deny=suspicious',
    'pnpm exec tsc --noEmit'
  ]);
  assert.deepEqual(defaultValidationCommands('npm'), [
    'npx oxlint --deny=correctness --deny=suspicious',
    'npx tsc --noEmit'
  ]);
  assert.equal(resolvePackageManager(mergeConfig({ packageManager: 'npm' }, {})), 'npm');
});

test('installAgent instala los subagentes con modo subagent', () => {
  const temp = makeTempDir('alvaress-subagents-');
  try {
    const directory = path.join(temp.path, 'agents');
    const report = installAgent(temp.path, { globalDir: directory, project: false });

    assert.equal(report.subagents.length, SUBAGENTS.length);
    for (const subagent of SUBAGENTS) {
      const file = path.join(directory, `${subagent.name}.md`);
      assert.ok(fs.existsSync(file));
      const content = fs.readFileSync(file, 'utf-8');
      assert.match(content, /mode: subagent/);
      assert.match(content, /solo lectura/i);
    }
    const explorer = fs.readFileSync(path.join(directory, 'alvaress-explorer.md'), 'utf-8');
    assert.match(explorer, /action: edit\n    resource: "\*"\n    effect: deny/);
    assert.equal(renderSubagent(SUBAGENTS[0]), fs.readFileSync(path.join(directory, 'alvaress-explorer.md'), 'utf-8'));
  } finally {
    temp.cleanup();
  }
});

test('archive marca la spec como Archived y rechaza tareas pendientes', () => {
  const root = makeTempDir('alvaress-archive-').path;
  try {
    scaffoldManifest(root);
    const manifest = loadManifest(root);
    manifest.specs = [
      {
        id: 'SPEC-001',
        title: 'Demo',
        status: 'Proposed',
        context: 'billing',
        tasks: [{ id: 'TASK-01', description: 'Hecha', status: 'Done' }]
      }
    ];
    saveManifest(manifest, root);

    runArchiveCommand(['SPEC-001'], root);
    assert.equal(loadManifest(root).specs[0]?.status, 'Archived');
  } finally {
    cleanup(root);
  }

  const pendingRoot = makeTempDir('alvaress-archive-pending-').path;
  try {
    scaffoldManifest(pendingRoot);
    const manifest = loadManifest(pendingRoot);
    manifest.specs = [
      {
        id: 'SPEC-002',
        title: 'Demo',
        status: 'Proposed',
        context: 'billing',
        tasks: [{ id: 'TASK-02', description: 'Pendiente', status: 'Pending' }]
      }
    ];
    saveManifest(manifest, pendingRoot);
    assert.throws(() => runArchiveCommand(['SPEC-002'], pendingRoot), /no están en estado Done/);
  } finally {
    cleanup(pendingRoot);
  }
});

test('doctor detecta configuración, gestor y grafo', () => {
  const root = projectWithManifest(
    manifestWithTasks('      - id: "TASK-01"\n        description: "Tarea"\n        status: "Pending"')
  );
  try {
    const checks = runDoctor(root, {
      config: mergeConfig(
        { obsidianVaultPath: '', validation: { maxAttempts: 1, commands: ['true'] } },
        {}
      ),
      commandExists: () => true,
      graphStatus: { exists: true, path: path.join(root, 'graphify-out', 'graph.json'), stale: false }
    });
    const byName = new Map(checks.map((entry) => [entry.name, entry]));
    assert.equal(byName.get('node')?.status, 'ok');
    assert.equal(byName.get('package-manager')?.status, 'ok');
    assert.equal(byName.get('graphify-graph')?.status, 'ok');
    assert.equal(byName.get('manifest')?.status, 'ok');
    assert.equal(checks.some((entry) => entry.status === 'error'), false);

    const lines: string[] = [];
    const code = runDoctorCommand(['--json'], root, {
      config: mergeConfig({ obsidianVaultPath: '' }, {}),
      stdout: (line) => lines.push(line)
    });
    assert.equal(code, 0);
    assert.match(lines.join('\n'), /"checks"/);
  } finally {
    cleanup(root);
  }
});

test('la caché de JEV reutiliza respuestas y respeta el TTL', () => {
  const root = makeTempDir('alvaress-jev-cache-').path;
  const request: JevRequest = {
    state: 'estado',
    questions: { q: { type: 'noul', instructions: '¿Sí?' } }
  };
  const response: JevResponse = {
    model: 'jev-latest',
    answers: { q: { type: 'noul', noul: 0.9 } }
  };
  try {
    assert.equal(readJevCache(root, request, 60_000), undefined);
    writeJevCache(root, request, response);
    assert.deepEqual(readJevCache(root, request, 60_000), response);
    assert.equal(readJevCache(root, { ...request, state: 'otro' }, 60_000), undefined);
  } finally {
    cleanup(root);
  }
});

test('jev decide devuelve una decisión compuesta y aplica el gate', async () => {
  const root = makeTempDir('alvaress-jev-decide-').path;
  const config = mergeConfig(
    {
      obsidianVaultPath: '',
      models: {
        jevOrchestrator: { modelName: 'jev-latest', apiKey: 'test-key' },
        aiderImplementer: { modelName: 'implementer' }
      }
    },
    {}
  );
  let payload: JevResponse = {
    model: 'jev-latest',
    answers: {
      clarity: { type: 'noul', noul: 0.9 },
      path: { type: 'choice', choice: 'apply', confidence: 0.8, probabilities: { apply: 0.8 } },
      complexity: { type: 'score', score: 1, confidence: 0.7, legend: { '1': 'media' }, probabilities: {} }
    }
  };
  const fetchImpl = async (): Promise<Response> =>
    new Response(JSON.stringify(payload), { status: 200 });

  try {
    const lines: string[] = [];
    const code = await runJevCommand(['decide', '--state', 'cambio', '--no-cache'], root, {
      config,
      fetchImpl,
      stdout: (line) => lines.push(line)
    });
    assert.equal(code, 0);
    const result = JSON.parse(lines.join('\n')) as { path: { choice: string }; cached: boolean };
    assert.equal(result.path.choice, 'apply');
    assert.equal(result.cached, false);

    payload = {
      ...payload,
      answers: { ...payload.answers, clarity: { type: 'noul', noul: 0.2 } }
    };
    const gated = await runJevCommand(['decide', '--state', 'cambio', '--no-cache', '--gate'], root, {
      config,
      fetchImpl,
      stdout: () => undefined
    });
    assert.equal(gated, 1);
  } finally {
    cleanup(root);
  }
});

test('obsidian note --from-run deriva el cierre del reporte y redacta secretos', () => {
  const temp = makeTempDir('alvaress-obsidian-run-');
  const root = path.join(temp.path, 'project');
  const vault = path.join(temp.path, 'vault');
  fs.mkdirSync(root, { recursive: true });
  writeJson(path.join(root, 'package.json'), { name: 'demo-app' });
  writeFile(
    path.join(root, 'openspec.yaml'),
    'specification: "1.0.0"\nproject: demo-app\nspecs: []\n'
  );
  const config = mergeConfig({ obsidianVaultPath: vault }, {});
  try {
    const report = createRunReport(
      newRunReportId(new Date('2026-02-03T04:05:06.007Z')),
      new Date('2026-02-03T04:05:06.007Z'),
      [
        {
          specId: 'SPEC-001',
          taskId: 'TASK-01',
          context: 'billing',
          group: 1,
          outcome: 'failed',
          error: 'falló con sk-abcdefghijklmnopqrstuvwxyz',
          validation: 'failed'
        }
      ]
    );
    writeRunReport(root, report);

    runObsidianCommand(['note', '--from-run', 'latest', '--task', 'TASK-01'], root, {
      config,
      stdout: () => undefined
    });

    const notePath = path.join(vault, 'Harness', 'demo-app.md');
    const note = fs.readFileSync(notePath, 'utf-8');
    assert.match(note, /TASK-01/);
    assert.match(note, /failed/);
    assert.doesNotMatch(note, /sk-abcdefghijklmnopqrstuvwxyz/);
    assert.ok(fs.existsSync(path.join(vault, 'Harness', 'Tasks Index.md')));
  } finally {
    temp.cleanup();
  }
});

test('apply escribe reporte, backup y respeta el alcance estricto', async () => {
  const root = makeTempDir('alvaress-apply-report-');
  const bin = path.join(root.path, 'bin');
  fs.mkdirSync(bin);
  fakeAider(bin, { action: 'touch fuera.txt' });
  writeFile(
    path.join(root.path, 'openspec.yaml'),
    manifestWithTasks(
      '      - id: "TASK-01"\n        description: "Tarea"\n        status: "Pending"\n        files:\n          - "src/billing/a.ts"'
    )
  );
  writeJson(path.join(root.path, 'package.json'), { name: 'demo-app' });
  writeJson(
    path.join(root.path, '.alvaressrc.json'),
    baseConfig({ scope: 'strict' })
  );
  writeFile(path.join(root.path, 'src', 'billing', 'a.ts'), 'export const a = 1;\n');
  execFileSync('git', ['init'], { cwd: root.path, stdio: 'ignore' });
  try {
    const report = await withPathAsync([bin], () => applyTasks({ root: root.path }));

    assert.equal(report.failed, 1);
    assert.ok(report.results[0]?.outOfScope?.includes('fuera.txt'));
    assert.ok(report.reportPath !== undefined && fs.existsSync(report.reportPath));
    assert.ok(report.backupPath !== undefined && fs.existsSync(report.backupPath));
    assert.ok(fs.existsSync(path.join(root.path, '.harness', 'runs')));
  } finally {
    root.cleanup();
  }
});
