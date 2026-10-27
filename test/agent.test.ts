import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  agentFilePath,
  installAgent,
  renderAgent,
  renderSubagent,
  SUBAGENTS,
  subagentFilePath
} from '../src/agent/installer.js';
import { makeTempDir } from './helpers.js';

test('renderAgent define un agente primario llamado alvaress', () => {
  const rendered = renderAgent();

  assert.match(rendered, /^---\n/);
  assert.match(rendered, /mode: primary/);
  assert.match(rendered, /description: .*alvaress/);
  assert.match(rendered, /# alvaress/);
  assert.match(rendered, /alvaress run "<petición>"/);
  assert.match(rendered, /alvaress run --task TASK-01/);
  assert.match(rendered, /alvaress run "<petición>" --dry-run/);
  assert.match(rendered, /alvaress -i/);
  assert.match(rendered, /Laya/);
  assert.match(rendered, /Vite-Plus/);
  assert.match(rendered, /alvaress verify <TASK_ID>/);
  assert.match(rendered, /\.laya\/HALT\.json/);
  assert.match(rendered, /graphify query/);
  assert.match(rendered, /No envíes secretos a Laya/);
  assert.match(rendered, /Bóveda Obsidian/);
  assert.match(rendered, /Obsidian es un espejo/);
  assert.match(rendered, /Personalidad y estilo de respuesta/);
  assert.match(rendered, /modismos mexicanos ligeros/);
  assert.match(rendered, /máximo 3 líneas de texto/);
  assert.match(rendered, /Lista de cambios principales/);
  assert.match(rendered, /no pegues logs completos/i);
  assert.match(rendered, /Aider es opcional/);
  assert.match(rendered, /alvaress-explorer/);
  assert.match(rendered, /Aprendizajes del proyecto: `\.harness\/memory\/learnings\.json`/);
  assert.match(rendered, /Laya decide el scope/);
  assert.match(rendered, /alvaress learn promote/);
  assert.match(rendered, /alvaress-fixer/);
  assert.match(rendered, /resource: "pnpm run validate \*"/);
  assert.doesNotMatch(rendered, /resource: "pnpm run \*"/);
  assert.doesNotMatch(rendered, /resource: "pnpm exec \*"/);
  assert.match(rendered, /resource: "pnpm publish \*"\n    effect: deny/);
  assert.match(rendered, /resource: "find \* -exec \*"\n    effect: deny/);
  assert.match(rendered, /resource: "rm \*"\n    effect: deny/);
});

test('installAgent escribe el agente global y el del proyecto', () => {
  const temp = makeTempDir('alvaress-agent-');
  try {
    const globalDir = path.join(temp.path, 'home', '.config', 'opencode', 'agents');
    const projectDir = path.join(temp.path, 'project', '.opencode', 'agents');

    const report = installAgent(path.join(temp.path, 'project'), { globalDir, projectDir });

    assert.equal(report.name, 'alvaress');
    assert.deepEqual(report.files, [agentFilePath(globalDir), agentFilePath(projectDir)]);
    for (const file of report.files) {
      assert.ok(fs.existsSync(file));
      assert.equal(fs.readFileSync(file, 'utf-8'), renderAgent());
    }
  } finally {
    temp.cleanup();
  }
});

test('installAgent permite desactivar ubicaciones', () => {
  const temp = makeTempDir('alvaress-agent-');
  try {
    const globalDir = path.join(temp.path, 'global');
    const projectDir = path.join(temp.path, 'project');
    const onlyProject = installAgent(temp.path, { global: false, globalDir, projectDir });

    assert.deepEqual(onlyProject.files, [agentFilePath(projectDir)]);
    assert.equal(fs.existsSync(globalDir), false);
  } finally {
    temp.cleanup();
  }
});

test('define los cuatro subagentes del modo sin Aider', () => {
  assert.deepEqual(
    SUBAGENTS.map((subagent) => subagent.name),
    [
      'alvaress-explorer',
      'alvaress-implementer',
      'alvaress-verifier',
      'alvaress-fixer'
    ]
  );

  for (const subagent of SUBAGENTS) {
    assert.equal(subagent.mode, 'subagent');
    assert.ok(subagent.steps > 0);
    assert.ok(subagent.skills.length > 0);
    assert.ok(subagent.permissions.some((rule) => rule.action === 'subagent' && rule.effect === 'deny'));
    assert.ok(subagent.permissions.some((rule) => rule.action === 'skill' && rule.effect === 'deny'));
    for (const skill of subagent.skills) {
      assert.ok(
        subagent.permissions.some(
          (rule) => rule.action === 'skill' && rule.resource === skill && rule.effect === 'allow'
        )
      );
    }
  }
});

test('renderSubagent declara skills, pasos y permisos restrictivos', () => {
  const explorer = SUBAGENTS.find((subagent) => subagent.name === 'alvaress-explorer');
  const implementer = SUBAGENTS.find((subagent) => subagent.name === 'alvaress-implementer');
  const verifier = SUBAGENTS.find((subagent) => subagent.name === 'alvaress-verifier');
  const fixer = SUBAGENTS.find((subagent) => subagent.name === 'alvaress-fixer');

  assert.ok(explorer !== undefined);
  assert.ok(implementer !== undefined);
  assert.ok(verifier !== undefined);
  assert.ok(fixer !== undefined);

  const explorerRendered = renderSubagent(explorer);
  assert.match(explorerRendered, /steps: 12/);
  assert.match(explorerRendered, /## Skills obligatorias/);
  assert.match(explorerRendered, /`consult-graphify-ast`/);
  assert.match(explorerRendered, /action: edit\n    resource: "\*"\n    effect: deny/);
  assert.match(explorerRendered, /action: external_directory\n    resource: "\*"\n    effect: allow/);

  const implementerRendered = renderSubagent(implementer);
  assert.match(implementerRendered, /`bounded-scope`/);
  assert.match(implementerRendered, /action: external_directory\n    resource: "\*"\n    effect: deny/);
  const shellDenyIndex = implementerRendered.indexOf(
    'action: shell\n    resource: "*"\n    effect: deny'
  );
  const shellAllowIndex = implementerRendered.indexOf('resource: "vp check *"');
  assert.ok(shellDenyIndex >= 0);
  assert.ok(shellAllowIndex > shellDenyIndex);
  assert.doesNotMatch(implementerRendered, /resource: "git commit \*"/);
  assert.doesNotMatch(implementerRendered, /resource: "pnpm run \*"/);
  assert.match(implementerRendered, /resource: "pnpm run validate \*"/);

  for (const subagent of SUBAGENTS) {
    const rendered = renderSubagent(subagent);
    assert.match(rendered, /resource: "rm \*"\n    effect: deny/);
    assert.match(rendered, /resource: "find \* -exec \*"\n    effect: deny/);
    assert.match(rendered, /resource: "pnpm publish \*"\n    effect: deny/);
  }

  const verifierRendered = renderSubagent(verifier);
  assert.match(verifierRendered, /`vite-plus-verify`/);
  assert.match(verifierRendered, /action: edit\n    resource: "\*"\n    effect: deny/);

  const fixerRendered = renderSubagent(fixer);
  assert.match(fixerRendered, /`failure-triage`/);
  assert.match(fixerRendered, /action: edit\n    resource: "\*"\n    effect: allow/);
});

test('installAgent escribe los cuatro subagentes junto al agente', () => {
  const temp = makeTempDir('alvaress-agent-');
  try {
    const globalDir = path.join(temp.path, 'home', '.config', 'opencode', 'agents');
    const report = installAgent(temp.path, { globalDir, project: false });

    assert.equal(report.subagents.length, SUBAGENTS.length);
    for (const subagent of SUBAGENTS) {
      const file = subagentFilePath(globalDir, subagent.name);
      assert.ok(fs.existsSync(file));
      assert.equal(fs.readFileSync(file, 'utf-8'), renderSubagent(subagent));
    }
  } finally {
    temp.cleanup();
  }
});
