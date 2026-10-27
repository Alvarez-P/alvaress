import { installAgent } from '../agent/installer.js';
import { loadConfig, loadGlobalConfig, saveGlobalConfig } from '../config/loader.js';
import type { HarnessConfig } from '../config/loader.js';
import { aiderEnvFor, aiderModelFor, validateModelReference } from '../config/models.js';
import { flagEnabled, parseArgs } from '../utils/args.js';
import { logger } from '../utils/logger.js';
import { promptModels } from './install.js';

type ModelRole = 'orchestrator' | 'subagents' | 'aider';

export interface ModelsCommandDeps {
  loadConfig?: typeof loadConfig;
  loadGlobalConfig?: typeof loadGlobalConfig;
  saveGlobalConfig?: typeof saveGlobalConfig;
  installAgent?: typeof installAgent;
  promptModels?: typeof promptModels;
  stdout?: (line: string) => void;
}

function applyModel(config: HarnessConfig, role: ModelRole, value: string): HarnessConfig {
  const trimmed = value.trim();
  if (role === 'aider') {
    if (trimmed.length === 0) {
      throw new Error('El modelo de Aider no puede estar vacío.');
    }
    const modelName = aiderModelFor(trimmed);
    return {
      ...config,
      models: {
        ...config.models,
        aiderImplementer: {
          ...config.models.aiderImplementer,
          modelName,
          env: {
            ...config.models.aiderImplementer.env,
            ...(config.models.aiderImplementer.apiKey
              ? aiderEnvFor(modelName, config.models.aiderImplementer.apiKey)
              : {})
          }
        }
      }
    };
  }

  const invalid = validateModelReference(trimmed);
  if (invalid !== undefined) {
    throw new Error(invalid);
  }
  return {
    ...config,
    models: {
      ...config.models,
      [role]: { modelName: trimmed }
    }
  };
}

function installCurrentAgent(
  config: HarnessConfig,
  root: string,
  flags: Record<string, string | boolean>,
  runtime: Required<Pick<ModelsCommandDeps, 'installAgent'>>
): void {
  if (flagEnabled(flags, 'no-install')) {
    return;
  }
  const report = runtime.installAgent(root, {
    global: !flagEnabled(flags, 'no-global'),
    project: !flagEnabled(flags, 'no-project'),
    models: {
      orchestrator: config.models.orchestrator.modelName,
      subagents: config.models.subagents.modelName
    }
  });
  for (const file of report.files) {
    logger.success(`Agente instalado en ${file}`);
  }
  for (const file of report.subagents) {
    logger.success(`Subagente instalado en ${file}`);
  }
}

export async function runModelsCommand(
  args: string[],
  root: string = process.cwd(),
  deps: ModelsCommandDeps = {}
): Promise<void> {
  const runtime = {
    loadConfig: deps.loadConfig ?? loadConfig,
    loadGlobalConfig: deps.loadGlobalConfig ?? loadGlobalConfig,
    saveGlobalConfig: deps.saveGlobalConfig ?? saveGlobalConfig,
    installAgent: deps.installAgent ?? installAgent,
    promptModels: deps.promptModels ?? promptModels,
    stdout: deps.stdout ?? ((line: string) => console.log(line))
  };
  const [subcommand, ...rest] = args;

  if (subcommand === 'show') {
    const config = runtime.loadConfig(root);
    runtime.stdout(
      JSON.stringify(
        {
          orchestrator: config.models.orchestrator.modelName || null,
          subagents: config.models.subagents.modelName || null,
          aider: config.models.aiderImplementer.modelName
        },
        null,
        2
      )
    );
    return;
  }

  if (subcommand === 'set') {
    const { flags } = parseArgs(rest);
    const all = typeof flags.all === 'string' ? flags.all : undefined;
    const orchestrator = typeof flags.orchestrator === 'string' ? flags.orchestrator : all;
    const subagents = typeof flags.subagents === 'string' ? flags.subagents : all;
    const aider = typeof flags.aider === 'string' ? flags.aider : all;
    if (orchestrator === undefined && subagents === undefined && aider === undefined) {
      throw new Error(
        'Uso: alvaress models set --all <provider/model> o --orchestrator <m> --subagents <m> --aider <m>'
      );
    }

    let next = runtime.loadGlobalConfig();
    if (orchestrator !== undefined) {
      next = applyModel(next, 'orchestrator', orchestrator);
    }
    if (subagents !== undefined) {
      next = applyModel(next, 'subagents', subagents);
    }
    if (aider !== undefined) {
      next = applyModel(next, 'aider', aider);
    }

    runtime.saveGlobalConfig(next);
    logger.success('Modelos guardados en la configuración global.');
    installCurrentAgent(next, root, flags, runtime);
    return;
  }

  if (subcommand === undefined || subcommand === 'configure') {
    const next = await runtime.promptModels(runtime.loadGlobalConfig(), {
      askAiderCredentials: true
    });
    runtime.saveGlobalConfig(next);
    logger.success('Modelos guardados en la configuración global.');
    installCurrentAgent(next, root, {}, runtime);
    return;
  }

  throw new Error(
    `Subcomando de modelos desconocido: ${subcommand}. Usa "alvaress models [show|set|configure]".`
  );
}
