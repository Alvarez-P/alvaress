import { getConfigPaths, loadConfig, readConfigFile } from '../config/loader.js';
import type { HarnessConfig, HarnessConfigFile } from '../config/loader.js';
import { assertDecisionModel } from '../decision/client.js';
import type { FetchLike } from '../decision/client.js';
import {
  detectOllama,
  hasOllamaModel,
  ollamaInstallHint,
  ollamaStartHint,
  ollamaVersionWarning
} from '../decision/ollama.js';
import type { OllamaStatus } from '../decision/ollama.js';
import { errorMessage } from '../utils/errors.js';
import { writeJsonFile } from '../utils/fs.js';

const HELP = `alvaress model

Uso:
  alvaress model                 Muestra el modelo de decisión actual y su estado.
  alvaress model status [--json] Igual que el comando anterior, en JSON si se pide.
  alvaress model list [--json]   Lista los modelos instalados en Ollama.
  alvaress model kev             Usa kev en la configuración global.
  alvaress model laya            Usa laya en la configuración global.
  alvaress model kev --local     Usa kev solo en este proyecto (.alvaressrc.json).
  alvaress model <modelo>:<tag>  Usa una etiqueta concreta, p. ej. kev:9b.

El modelo corre en Ollama y se sirve en /v1/systemone. Si falta, descárgalo con
"ollama pull <modelo>".`;

export interface ModelCommandDeps {
  config?: HarnessConfig;
  ollama?: OllamaStatus;
  fetchImpl?: FetchLike;
  stdout?: (line: string) => void;
  stderr?: (line: string) => void;
}

function renderStatus(
  model: string,
  apiBase: string,
  status: OllamaStatus,
  installed: boolean,
  json: boolean,
  stdout: (line: string) => void
): void {
  if (json) {
    stdout(
      JSON.stringify(
        {
          model,
          apiBase,
          installed,
          ollama: {
            installed: status.installed,
            running: status.running,
            version: status.version ?? null,
            models: status.models
          }
        },
        null,
        2
      )
    );
    return;
  }

  stdout(`Modelo: ${model}`);
  stdout(`Ollama: ${apiBase}`);
  if (!status.running) {
    stdout('Estado: no responde');
    stdout(status.installed ? ollamaStartHint() : ollamaInstallHint());
    return;
  }
  stdout(`Estado: disponible${status.version ? ` (${status.version})` : ''}`);
  stdout(`Modelo ${model}: ${installed ? 'instalado' : 'no instalado'}`);
  const warning = ollamaVersionWarning(status.version, model);
  if (warning !== undefined) {
    stdout(warning);
  }
  if (!installed) {
    stdout(`Siguiente paso: ollama pull ${model}`);
  }
}

export async function runModelCommand(
  args: string[],
  root: string = process.cwd(),
  deps: ModelCommandDeps = {}
): Promise<number> {
  const stdout = deps.stdout ?? ((line: string) => console.log(line));
  const stderr = deps.stderr ?? ((line: string) => console.error(line));
  const json = args.includes('--json');
  const positional = args.filter((argument) => !argument.startsWith('-'));
  const subcommand = positional[0];

  if (subcommand === 'help' || args.includes('--help') || args.includes('-h')) {
    stdout(HELP);
    return 0;
  }

  try {
    const config = deps.config ?? loadConfig(root);
    const status =
      deps.ollama ?? (await detectOllama(config.decision.apiBase, deps.fetchImpl));

    if (subcommand === undefined || subcommand === 'status') {
      const installed = hasOllamaModel(status.models, config.decision.model);
      renderStatus(
        config.decision.model,
        config.decision.apiBase,
        status,
        installed,
        json,
        stdout
      );
      return status.running && installed ? 0 : 1;
    }

    if (subcommand === 'list') {
      if (!status.running) {
        stderr(`[alvaress] ERROR: Ollama no responde en ${config.decision.apiBase}. ${ollamaStartHint()}`);
        return 2;
      }
      stdout(json ? JSON.stringify({ models: status.models }, null, 2) : status.models.join('\n'));
      return 0;
    }

    const model = assertDecisionModel(subcommand);
    const local = args.includes('--local');
    const paths = getConfigPaths(root);
    const target = local ? paths.local : paths.global;
    const current = readConfigFile(target);
    const next: HarnessConfigFile = {
      ...current,
      decision: { ...current.decision, model }
    };
    writeJsonFile(target, next);

    const installed = hasOllamaModel(status.models, model);
    if (json) {
      stdout(
        JSON.stringify(
          { model, config: target, installed, ollamaRunning: status.running },
          null,
          2
        )
      );
    } else {
      stdout(`Modelo de decisión: ${model}`);
      stdout(`Configuración: ${target}`);
      if (!status.running) {
        stdout(status.installed ? ollamaStartHint() : ollamaInstallHint());
      } else if (!installed) {
        stdout(`Falta descargarlo: ollama pull ${model}`);
      }
    }
    return 0;
  } catch (error) {
    stderr(`[alvaress] ERROR: ${errorMessage(error)}`);
    return 2;
  }
}
