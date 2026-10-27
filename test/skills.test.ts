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
      'universal-design-patterns',
      'obsidian-sdd',
      'continuous-learning',
      'bounded-scope',
      'vite-plus-verify',
      'failure-triage'
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
      'Antes de modificar o proponer cualquier cambio, lee la fuente del modo: en ODD, la nota de Obsidian y el alcance acordado; en SDD, `openspec.yaml` y `.harness/tasks/TASK_ID.md`. No improvises.',
      '',
      '- Resume los criterios de aceptación en 1-3 líneas; no copies la especificación completa.',
      '- Si la fuente no existe, está incompleta o contradice la solicitud, devuelve `scope: blocked` con lo que falta. No rellenes huecos con suposiciones.',
      '- Lee solo la fuente, los archivos del alcance y el contexto que ya te pasó el orquestador. No explores el proyecto entero.',
      ''
    ].join('\n')
  );
});

test('installSkills escribe SKILL.md y enlaza las skills globales', () => {
  const temp = makeTempDir();
  try {
    const targets = [path.join(temp.path, 'opencode'), path.join(temp.path, 'claude')];
    const report = installSkills(temp.path, { targets });

    assert.equal(report.files.length, 9);
    for (const skill of SKILLS) {
      const file = skillFilePath(skill, report.skillsDir);
      assert.ok(fs.existsSync(file));
      assert.match(fs.readFileSync(file, 'utf-8'), new RegExp(`name: ${skill.name}`));
    }

    assert.equal(report.links.length, 18);
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

    assert.equal(report.links.length, 9);
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

test('las skills evitan sobreingeniería y no confunden fallos de herramienta con HALT', () => {
  const patterns = SKILLS.find((entry) => entry.name === 'universal-design-patterns');
  const triage = SKILLS.find((entry) => entry.name === 'failure-triage');
  const learning = SKILLS.find((entry) => entry.name === 'continuous-learning');
  const graphify = SKILLS.find((entry) => entry.name === 'consult-graphify-ast');
  const verify = SKILLS.find((entry) => entry.name === 'self-healing-verify');

  assert.ok(patterns !== undefined);
  assert.ok(triage !== undefined);
  assert.ok(learning !== undefined);
  assert.ok(graphify !== undefined);
  assert.ok(verify !== undefined);

  assert.match(patterns.body, /no introduzcas/i);
  assert.match(patterns.body, /comenta solo/i);
  assert.doesNotMatch(patterns.body, /altamente escalable/i);

  assert.match(triage.body, /needs-orchestrator/);
  assert.match(triage.body, /Laya no esté disponible no es nuclear/i);
  assert.match(triage.body, /no edites ni borres tests/i);

  assert.match(learning.body, /no gastes una búsqueda en cambios de una línea/i);
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
    assert.equal(report.files.length, 9);
  } finally {
    temp.cleanup();
  }
});
