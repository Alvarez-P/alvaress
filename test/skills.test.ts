import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SKILLS, installSkills, renderSkill, skillFilePath } from '../src/skills/installer.js';
import { makeTempDir } from './helpers.js';

test('define exactamente las cinco skills del estándar', () => {
  assert.deepEqual(
    SKILLS.map((skill) => skill.name),
    [
      'read-spec-first',
      'consult-graphify-ast',
      'self-healing-verify',
      'universal-design-patterns',
      'obsidian-sdd'
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
      'description: Obliga al agente a leer la especificación de SDD antes de programar.',
      'scope: project',
      '---',
      'Antes de modificar o proponer cualquier cambio en el código, estás obligado a leer el archivo `.harness/tasks/TASK_ID.md` o el archivo general `openspec.yaml`. No improvises. Lista los criterios de aceptación en tu memoria interna antes de escribir código.',
      ''
    ].join('\n')
  );
});

test('installSkills escribe SKILL.md y enlaza las skills globales', () => {
  const temp = makeTempDir();
  try {
    const targets = [path.join(temp.path, 'opencode'), path.join(temp.path, 'claude')];
    const report = installSkills(temp.path, { targets });

    assert.equal(report.files.length, 5);
    for (const skill of SKILLS) {
      const file = skillFilePath(skill, report.skillsDir);
      assert.ok(fs.existsSync(file));
      assert.match(fs.readFileSync(file, 'utf-8'), new RegExp(`name: ${skill.name}`));
    }

    assert.equal(report.links.length, 10);
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

    assert.equal(report.links.length, 5);
    assert.equal(report.links.filter((link) => link.result === 'skipped').length, 1);
  } finally {
    temp.cleanup();
  }
});

test('la skill obsidian-sdd define las fases y la política de subagentes', () => {
  const skill = SKILLS.find((entry) => entry.name === 'obsidian-sdd');
  assert.ok(skill !== undefined);

  for (const phase of ['Fase 1', 'Fase 2', 'Fase 3', 'Fase 4', 'Fase 5']) {
    assert.match(skill.body, new RegExp(phase));
  }
  assert.match(skill.body, /solo el orquestador/i);
  assert.match(skill.body, /solo lectura/i);
  assert.match(skill.body, /alvaress obsidian note/);
  assert.match(skill.body, /openspec\.yaml/);
});

test('installSkills con linkGlobal=false no crea enlaces', () => {
  const temp = makeTempDir();
  try {
    const report = installSkills(temp.path, { linkGlobal: false });

    assert.equal(report.links.length, 0);
    assert.equal(report.files.length, 5);
  } finally {
    temp.cleanup();
  }
});
