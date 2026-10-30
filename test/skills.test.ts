import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SKILLS, installSkills, renderSkill, skillFilePath } from '../src/skills/installer.js';
import { makeTempDir } from './helpers.js';

test('define las skills del estándar híbrido SDD/ODD', () => {
  assert.deepEqual(
    SKILLS.map((skill) => skill.name),
    [
      'read-spec-first',
      'consult-graphify-ast',
      'self-healing-verify',
      'clean-code',
      'obsidian-sdd',
      'continuous-learning',
      'bounded-scope',
      'git-diff-context',
      'vite-plus-verify',
      'failure-triage',
      'architecture-decisions',
      'ui-design',
      'testing-strategy',
      'code-review',
      'technical-research'
    ]
  );
  for (const skill of SKILLS) {
    assert.equal(skill.scope, 'project');
    assert.ok(skill.description.length > 0);
    assert.ok(skill.body.length > 0);
  }
});

test('renderSkill genera frontmatter YAML y cuerpo literal', () => {
  const skill = SKILLS[0]!;
  const rendered = renderSkill(skill);

  assert.equal(
    rendered,
    [
      '---',
      'name: read-spec-first',
      'description: Obliga al agente a leer la nota ODD o la especificación SDD antes de programar.',
      'scope: project',
      '---',
      'Lee la fuente antes de editar: en ODD la nota de Obsidian y el alcance acordado; en SDD `openspec.yaml` y `.harness/tasks/TASK_ID.md`. Si el orquestador ya incluyó el contenido en el mensaje, no lo releas.',
      '',
      '- Resume los criterios de aceptación en 1-3 líneas.',
      '- Si la fuente falta, está incompleta o contradice la solicitud, devuelve `scope: blocked`. No supongas.',
      '- Lee solo la fuente y los archivos del alcance.',
      ''
    ].join('\n')
  );
});

test('installSkills escribe SKILL.md y enlaza las skills globales', () => {
  const temp = makeTempDir();
  try {
    const targets = [path.join(temp.path, 'opencode'), path.join(temp.path, 'claude')];
    const report = installSkills(temp.path, { targets });

    assert.equal(report.files.length, SKILLS.length);
    for (const skill of SKILLS) {
      const file = skillFilePath(skill, report.skillsDir);
      assert.ok(fs.existsSync(file));
      assert.match(fs.readFileSync(file, 'utf-8'), new RegExp(`name: ${skill.name}`));
    }

    assert.equal(report.links.length, SKILLS.length * targets.length);
    assert.ok(report.links.every((link) => link.result === 'created'));
    for (const target of targets) {
      for (const skill of SKILLS) {
        assert.ok(fs.lstatSync(path.join(target, skill.name)).isSymbolicLink());
      }
    }
  } finally {
    temp.cleanup();
  }
});

test('installSkills es idempotente', () => {
  const temp = makeTempDir();
  try {
    const targets = [path.join(temp.path, 'opencode')];
    installSkills(temp.path, { targets });
    const second = installSkills(temp.path, { targets });

    assert.ok(second.links.every((link) => link.result === 'unchanged'));
  } finally {
    temp.cleanup();
  }
});

test('installSkills omite enlaces cuando el destino es real', () => {
  const temp = makeTempDir();
  try {
    const target = path.join(temp.path, 'opencode');
    const real = path.join(target, 'read-spec-first');
    fs.mkdirSync(real, { recursive: true });

    const report = installSkills(temp.path, { targets: [target] });

    assert.equal(report.links.length, SKILLS.length);
    assert.equal(report.links.filter((link) => link.result === 'skipped').length, 1);
  } finally {
    temp.cleanup();
  }
});

test('la skill obsidian-sdd separa la política de subagentes y orquestador', () => {
  const skill = SKILLS.find((entry) => entry.name === 'obsidian-sdd');
  assert.ok(skill !== undefined);

  assert.match(skill.body, /## Para subagentes/);
  assert.match(skill.body, /## Para el orquestador/);
  assert.match(skill.body, /el cierre es del orquestador/i);
  assert.match(skill.body, /solo lectura/i);
  assert.match(skill.body, /alvaress obsidian note/);
  assert.match(skill.body, /openspec\.yaml/);
});

test('las skills evitan sobreingeniería y no confunden fallos de herramienta con HALT', () => {
  const patterns = SKILLS.find((entry) => entry.name === 'clean-code');
  const triage = SKILLS.find((entry) => entry.name === 'failure-triage');
  const learning = SKILLS.find((entry) => entry.name === 'continuous-learning');
  const graphify = SKILLS.find((entry) => entry.name === 'consult-graphify-ast');
  const verify = SKILLS.find((entry) => entry.name === 'self-healing-verify');

  assert.ok(patterns !== undefined);
  assert.ok(triage !== undefined);
  assert.ok(learning !== undefined);
  assert.ok(graphify !== undefined);
  assert.ok(verify !== undefined);

  assert.match(patterns.body, /magic strings/i);
  assert.match(patterns.body, /nombra por intención/i);
  assert.match(patterns.body, /TODO\/FIXME/);
  assert.doesNotMatch(patterns.body, /altamente escalable/i);

  assert.match(triage.body, /needs-orchestrator/);
  assert.match(triage.body, /Laya no esté disponible no es nuclear/i);
  assert.match(triage.body, /no edites ni borres tests/i);

  assert.match(learning.body, /no gastes una búsqueda en cambios de una línea/i);
  assert.match(learning.body, /\.harness\/memory\//);
  assert.match(learning.body, /--scope project/);
  assert.match(learning.body, /alvaress learn promote/);
  assert.match(graphify.body, /No ejecutes `graphify update`/);
  assert.match(verify.body, /Máximo dos ciclos/i);
  assert.match(verify.body, /no reinstales ni cambies el gestor/i);
});

test('las skills de subagente definen alcance, Vite-Plus y triaje', () => {
  const bounded = SKILLS.find((entry) => entry.name === 'bounded-scope');
  const vite = SKILLS.find((entry) => entry.name === 'vite-plus-verify');
  const triage = SKILLS.find((entry) => entry.name === 'failure-triage');

  assert.ok(bounded !== undefined);
  assert.ok(vite !== undefined);
  assert.ok(triage !== undefined);

  assert.match(bounded.body, /scope: blocked/);
  assert.match(bounded.body, /No inventes el archivo que falta/);
  assert.match(vite.body, /vp check/);
  assert.match(vite.body, /vp test/);
  assert.match(vite.body, /pnpm exec vp/);
  assert.match(vite.body, /--no-verify/);
  assert.match(triage.body, /Máximo 2 intentos/);
  assert.match(triage.body, /nuclear/i);
  assert.match(triage.body, /--no-verify/);
});

test('installSkills con linkGlobal=false no crea enlaces', () => {
  const temp = makeTempDir();
  try {
    const report = installSkills(temp.path, { linkGlobal: false });

    assert.equal(report.links.length, 0);
    assert.equal(report.files.length, SKILLS.length);
  } finally {
    temp.cleanup();
  }
});
