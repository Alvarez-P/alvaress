import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { agentFilePath, installAgent, renderAgent } from '../src/agent/installer.js';
import { makeTempDir } from './helpers.js';

test('renderAgent define un agente primario llamado alvaress', () => {
  const rendered = renderAgent();

  assert.match(rendered, /^---\n/);
  assert.match(rendered, /mode: primary/);
  assert.match(rendered, /description: .*alvaress/);
  assert.match(rendered, /# alvaress/);
  assert.match(rendered, /alvaress decide predict/);
  assert.match(rendered, /alvaress decide choose/);
  assert.match(rendered, /alvaress decide score/);
  assert.match(rendered, /alvaress decide --state/);
  assert.match(rendered, /alvaress model status/);
  assert.match(rendered, /alvaress apply --dry-run/);
  assert.match(rendered, /alvaress verify <TASK_ID>/);
  assert.match(rendered, /graphify query/);
  assert.match(rendered, /No envíes secretos al modelo de decisión/);
  assert.match(rendered, /Bóveda Obsidian/);
  assert.match(rendered, /Obsidian es un espejo/);
  assert.match(rendered, /Personalidad y estilo de respuesta/);
  assert.match(rendered, /modismos mexicanos ligeros/);
  assert.match(rendered, /máximo 3 líneas de texto/);
  assert.match(rendered, /Lista de cambios principales/);
  assert.match(rendered, /no pegues logs completos/i);
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
