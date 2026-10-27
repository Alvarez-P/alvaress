import path from 'node:path';
import { installAgent } from '../agent/installer.js';
import type { AgentInstallReport } from '../agent/installer.js';
import { loadConfig } from '../config/loader.js';
import { connectObsidianVault } from '../obsidian/vault.js';
import type { VaultConnection } from '../obsidian/vault.js';
import { getManifestPath, ensureHarnessDirs, inferProjectName, loadManifest, scaffoldManifest } from '../openspec/manifest.js';
import { installSkills } from '../skills/installer.js';
import type { SkillInstallReport } from '../skills/installer.js';
import { pathExists } from '../utils/fs.js';
import { expandHome } from '../utils/prompt.js';

export interface InitReport {
  root: string;
  projectName: string;
  manifestPath: string;
  manifestCreated: boolean;
  skills: SkillInstallReport;
  agent: AgentInstallReport;
  obsidian?: VaultConnection;
}

export interface InitOptions {
  linkSkills?: boolean;
}

export function runInit(root: string = process.cwd(), options: InitOptions = {}): InitReport {
  ensureHarnessDirs(root);

  let manifestCreated = false;
  const manifestPath = getManifestPath(root);
  if (pathExists(manifestPath)) {
    loadManifest(root);
  } else {
    manifestCreated = scaffoldManifest(root);
  }

  const skills = installSkills(root, { linkGlobal: options.linkSkills !== false });
  const config = loadConfig(root);
  const agent = installAgent(root, {
    global: options.linkSkills !== false,
    project: true,
    models: {
      orchestrator: config.models.orchestrator.modelName,
      subagents: config.models.subagents.modelName
    }
  });

  const vaultPath = config.obsidianVaultPath.trim();
  const obsidian =
    vaultPath.length > 0
      ? connectObsidianVault(root, path.resolve(root, expandHome(vaultPath)))
      : undefined;

  return {
    root,
    projectName: inferProjectName(root),
    manifestPath: path.join(root, 'openspec.yaml'),
    manifestCreated,
    skills,
    agent,
    obsidian
  };
}
