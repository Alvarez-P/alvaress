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
  assert.match(rendered, /Bóveda Markdown/);
  assert.match(rendered, /La bóveda es un espejo/);
  assert.match(rendered, /Personalidad y estilo de respuesta/);
  assert.match(rendered, /modismos mexicanos ligeros/);
  assert.match(rendered, /máximo 3 líneas de texto/);
  assert.match(rendered, /Lista de cambios principales/);
  assert.match(rendered, /no pegues logs completos/i);
  assert.match(rendered, /Worker de código: diez subagentes de OpenCode/);
  for (const subagent of SUBAGENTS) {
    assert.ok(rendered.includes(`\`${subagent.name}\``));
  }
  assert.match(rendered, /Aprendizajes del proyecto: `\.harness\/memory\/learnings\.json`/);
  assert.match(rendered, /Laya decide el scope/);
  assert.match(rendered, /alvaress learn promote/);
  assert.match(rendered, /Cero comentarios en el código generado/);
  assert.match(rendered, /revisa el diff/);
  assert.match(rendered, /alvaress-fixer/);
  assert.match(rendered, /resource: "pnpm run validate \*"/);
  assert.doesNotMatch(rendered, /resource: "pnpm run \*"/);
  assert.doesNotMatch(rendered, /resource: "pnpm exec \*"/);
  assert.match(rendered, /resource: "pnpm publish \*"\n    effect: deny/);
  assert.match(rendered, /resource: "find \* -exec \*"\n    effect: deny/);
  assert.match(rendered, /resource: "rm \*"\n    effect: deny/);
});

test('renderAgent y renderSubagent escriben el modelo configurado', () => {
  const agent = renderAgent('openai/gpt-5');
  assert.match(agent, /^model: openai\/gpt-5$/m);

  const subagent = SUBAGENTS.find((entry) => entry.name === 'alvaress-implementer');
  assert.ok(subagent !== undefined);
  const rendered = renderSubagent(subagent, 'openai/gpt-5-mini');
  assert.match(rendered, /^model: openai\/gpt-5-mini$/m);
});

test('renderAgent omite model cuando no hay modelo configurado', () => {
  assert.doesNotMatch(renderAgent(''), /^model:/m);
  assert.doesNotMatch(renderAgent('   '), /^model:/m);
});

test('installAgent propaga el modelo a agentes y subagentes', () => {
  const temp = makeTempDir('alvaress-agent-models-');
  try {
    const globalDir = path.join(temp.path, 'global');
    const projectDir = path.join(temp.path, 'project');

    installAgent(temp.path, {
      globalDir,
      projectDir,
      models: {
        orchestrator: 'anthropic/claude-sonnet-5-5',
        subagents: 'anthropic/claude-haiku-5-5'
      }
    });

    assert.match(
      fs.readFileSync(agentFilePath(globalDir), 'utf-8'),
      /^model: anthropic\/claude-sonnet-5-5$/m
    );
    const implementer = SUBAGENTS.find((entry) => entry.name === 'alvaress-implementer');
    assert.ok(implementer !== undefined);
    assert.match(
      fs.readFileSync(subagentFilePath(globalDir, implementer.name), 'utf-8'),
      /^model: anthropic\/claude-haiku-5-5$/m
    );
  } finally {
    temp.cleanup();
  }
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

test('define los subagentes especializados del flujo SDD/ODD', () => {
  assert.deepEqual(
    SUBAGENTS.map((subagent) => subagent.name),
    [
      'alvaress-explorer',
      'alvaress-researcher',
      'alvaress-architect',
      'alvaress-designer',
      'alvaress-implementer',
      'alvaress-implementer-lite',
      'alvaress-tester',
      'alvaress-verifier',
      'alvaress-reviewer',
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
  const lite = SUBAGENTS.find((subagent) => subagent.name === 'alvaress-implementer-lite');
  const verifier = SUBAGENTS.find((subagent) => subagent.name === 'alvaress-verifier');
  const fixer = SUBAGENTS.find((subagent) => subagent.name === 'alvaress-fixer');

  assert.ok(explorer !== undefined);
  assert.ok(implementer !== undefined);
  assert.ok(lite !== undefined);
  assert.ok(verifier !== undefined);
  assert.ok(fixer !== undefined);

  const liteRendered = renderSubagent(lite);
  assert.match(liteRendered, /steps: 10/);
  assert.match(liteRendered, /action: edit\n    resource: "\*"\n    effect: allow/);
  assert.doesNotMatch(liteRendered, /resource: "vp check \*"/);
  assert.doesNotMatch(liteRendered, /`architecture-decisions`/);

  const explorerRendered = renderSubagent(explorer);
  assert.match(explorerRendered, /steps: 12/);
  assert.match(explorerRendered, /## Skills disponibles/);
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
  assert.match(implementerRendered, /resource: "node --test \*"/);
  assert.match(implementerRendered, /no lo reintentes/i);
  assert.match(implementerRendered, /No agregues comentarios al código/);

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
  assert.match(fixerRendered, /No agregues comentarios al código/);
});

test('installAgent escribe los diez subagentes junto al agente', () => {
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
