import { PACKAGE_NAME, VERSION } from './constants.js';
import { runAgentCommand } from './commands/agent.js';
import { runConfigCommand } from './commands/config.js';
import { runInit } from './commands/init.js';
import { runInstall } from './commands/install.js';
import { runJevCommand } from './commands/jev.js';
import { runObsidianCommand } from './commands/obsidian.js';
import { runSkillsCommand } from './commands/skills.js';
import { findWorkItem, loadManifest } from './openspec/manifest.js';
import { applyTasks } from './orchestrator/apply.js';
import { verifyAndRepairTask } from './orchestrator/verify.js';
import { flagEnabled, parseArgs } from './utils/args.js';
import { logger } from './utils/logger.js';

const HELP = `${PACKAGE_NAME} ${VERSION}

Uso:
  alvaress install                    Instalador interactivo de componentes, agente y configuración.
  alvaress init [--no-link]          Inicializa .harness, openspec.yaml, skills y agente del proyecto.
  alvaress apply [TASK...]           Ejecuta tareas pendientes (o las indicadas) con Aider.
  alvaress apply --dry-run            Muestra los grupos de ejecución sin invocar a Aider.
  alvaress verify <TASK_ID>           Ejecuta el bucle self-healing sobre una tarea.
  alvaress skills [--no-link]         Reinstala las skills del proyecto y sus enlaces globales.
  alvaress agent [install|show]       Instala o muestra el agente orquestador alvaress.
  alvaress obsidian [status|sync|note]  Consulta o actualiza la bóveda Obsidian.
  alvaress jev <predict|choose|score|ask|models>  Consulta las decisiones tipadas de JEV.
  alvaress config [show|paths]        Muestra la configuración resuelta o las rutas de configuración.

Ejemplos:
  alvaress install
  alvaress init
  alvaress apply
  alvaress apply SPEC-001/TASK-01 --dry-run
  alvaress verify TASK-01
  alvaress agent install
  alvaress jev predict --state "Cambio pequeño en un archivo" --question "¿Puedo implementarlo directamente?" --threshold 0.7
`;

export async function runCli(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;

  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    console.log(HELP);
    return;
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    console.log(VERSION);
    return;
  }

  switch (command) {
    case 'install': {
      await runInstall(process.cwd());
      return;
    }
    case 'init': {
      const { flags } = parseArgs(rest);
      const report = runInit(process.cwd(), { linkSkills: !flagEnabled(flags, 'no-link') });
      if (report.manifestCreated) {
        logger.success(`openspec.yaml creado en ${report.manifestPath}`);
      } else {
        logger.info(`openspec.yaml ya existía en ${report.manifestPath}`);
      }
      logger.success(`Skills escritas en ${report.skills.skillsDir}`);
      for (const file of report.agent.files) {
        logger.success(`Agente ${report.agent.name} instalado en ${file}`);
      }
      if (report.obsidian !== undefined) {
        logger.success(`Bóveda Obsidian conectada en ${report.obsidian.harnessDir}`);
      }
      return;
    }
    case 'apply': {
      const { positional, flags } = parseArgs(rest);
      const report = await applyTasks({
        root: process.cwd(),
        taskIds: positional.length > 0 ? positional : undefined,
        dryRun: flagEnabled(flags, 'dry-run')
      });
      for (const result of report.results) {
        logger.info(`${result.taskId} (${result.context}) -> ${result.outcome} [grupo ${result.group}]`);
      }
      logger.success(
        `Total: ${report.total} · Verificadas: ${report.verified} · Fallidas: ${report.failed} · Omitidas: ${report.skipped}`
      );
      if (report.failed > 0) {
        process.exitCode = 1;
      }
      return;
    }
    case 'verify': {
      const taskId = rest[0];
      if (taskId === undefined) {
        throw new Error('Uso: alvaress verify <TASK_ID>');
      }
      const manifest = loadManifest(process.cwd());
      const item = findWorkItem(manifest, taskId);
      const verified = await verifyAndRepairTask(taskId, {
        root: process.cwd(),
        files: item.task.files
      });
      if (!verified) {
        process.exitCode = 1;
      }
      return;
    }
    case 'skills': {
      runSkillsCommand(rest, process.cwd());
      return;
    }
    case 'agent': {
      runAgentCommand(rest, process.cwd());
      return;
    }
    case 'obsidian': {
      runObsidianCommand(rest, process.cwd());
      return;
    }
    case 'jev': {
      const code = await runJevCommand(rest, process.cwd());
      if (code !== 0) {
        process.exitCode = code;
      }
      return;
    }
    case 'config': {
      runConfigCommand(rest, process.cwd());
      return;
    }
    default: {
      throw new Error(`Comando desconocido: ${command}. Usa "alvaress --help".`);
    }
  }
}
