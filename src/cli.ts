import { PACKAGE_NAME, VERSION } from './constants.js';
import { runAgentCommand } from './commands/agent.js';
import { runArchiveCommand } from './commands/archive.js';
import { runConfigCommand } from './commands/config.js';
import { runDecideCommand } from './commands/decide.js';
import { runDoctorCommand } from './commands/doctor.js';
import { runInit } from './commands/init.js';
import { runInstall } from './commands/install.js';
import { runModelCommand } from './commands/model.js';
import { runObsidianCommand } from './commands/obsidian.js';
import { runReportCommand } from './commands/report.js';
import { runRestoreCommand } from './commands/restore.js';
import { runSkillsCommand } from './commands/skills.js';
import { loadConfig } from './config/loader.js';
import { findWorkItem, loadManifest } from './openspec/manifest.js';
import { applyTasks } from './orchestrator/apply.js';
import { verifyAndRepairTask } from './orchestrator/verify.js';
import { flagEnabled, parseArgs } from './utils/args.js';
import { logger } from './utils/logger.js';

const HELP = `${PACKAGE_NAME} ${VERSION}

Uso:
  alvaress install [--yes]            Instalador interactivo de componentes, agente y configuración.
  alvaress init [--no-link]          Inicializa .harness, openspec.yaml, skills y agente del proyecto.
  alvaress apply [TASK...]           Ejecuta tareas pendientes (o las indicadas) con Aider.
  alvaress apply --dry-run            Muestra los grupos de ejecución sin invocar a Aider.
  alvaress apply --force              Ignora un lock huérfano de otra ejecución.
  alvaress apply --update-graph       Actualiza Graphify al terminar.
  alvaress verify <TASK_ID>           Ejecuta el bucle self-healing sobre una tarea.
  alvaress archive <SPEC_ID>          Archiva una spec con todas sus tareas en Done.
  alvaress skills [--no-link]         Reinstala las skills del proyecto y sus enlaces globales.
  alvaress agent [install|show]       Instala o muestra el agente orquestador alvaress y sus subagentes.
  alvaress obsidian [status|sync|note]  Consulta o actualiza la bóveda Obsidian.
  alvaress decide [predict|choose|score|ask]  Consulta decisiones tipadas (kev o laya en Ollama).
  alvaress model [status|list|kev|laya]  Elige o inspecciona el modelo de decisión local.
  alvaress doctor [--json]            Diagnóstico previo: configuración, herramientas, grafo y lock.
  alvaress report [latest|list|show]  Reportes de ejecución de .harness/runs.
  alvaress restore [latest|<id>]      Restaura openspec.yaml desde .harness/backups.
  alvaress config [show|paths]        Muestra la configuración resuelta o las rutas de configuración.

Ejemplos:
  alvaress install
  alvaress init
  alvaress doctor
  alvaress apply
  alvaress apply SPEC-001/TASK-01 --dry-run
  alvaress verify TASK-01
  alvaress report latest
  alvaress agent install
  alvaress model kev
  alvaress decide --state "Cambio pequeño en un archivo" --gate
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
      const { flags } = parseArgs(rest);
      await runInstall(process.cwd(), {
        yes: flagEnabled(flags, 'yes') || flagEnabled(flags, 'y')
      });
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
      for (const file of report.agent.subagents) {
        logger.success(`Subagente instalado en ${file}`);
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
        dryRun: flagEnabled(flags, 'dry-run'),
        force: flagEnabled(flags, 'force'),
        lock: !flagEnabled(flags, 'no-lock'),
        updateGraph: flagEnabled(flags, 'update-graph')
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
      const config = loadConfig(process.cwd());
      const manifest = loadManifest(process.cwd());
      const item = findWorkItem(manifest, taskId);
      const verified = await verifyAndRepairTask(taskId, {
        root: process.cwd(),
        files: item.task.files,
        config,
        commands: item.task.validation,
        requireCommands: config.validation.requireCommands
      });
      if (!verified) {
        process.exitCode = 1;
      }
      return;
    }
    case 'archive': {
      runArchiveCommand(rest, process.cwd());
      return;
    }
    case 'doctor': {
      const code = runDoctorCommand(rest, process.cwd());
      if (code !== 0) {
        process.exitCode = code;
      }
      return;
    }
    case 'report': {
      runReportCommand(rest, process.cwd());
      return;
    }
    case 'restore': {
      runRestoreCommand(rest, process.cwd());
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
    case 'decide': {
      const code = await runDecideCommand(rest, process.cwd());
      if (code !== 0) {
        process.exitCode = code;
      }
      return;
    }
    case 'model': {
      const code = await runModelCommand(rest, process.cwd());
      if (code !== 0) {
        process.exitCode = code;
      }
      return;
    }
    case 'jev': {
      throw new Error(
        'El comando "jev" se reemplazó por "decide". Usa "alvaress decide --help".'
      );
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
