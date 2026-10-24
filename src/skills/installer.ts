import path from 'node:path';
import { CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR } from '../constants.js';
import { ensureDir, linkDirectory, writeTextFile } from '../utils/fs.js';
import type { LinkResult } from '../utils/fs.js';

export interface SkillDefinition {
  name: string;
  description: string;
  scope: 'project';
  body: string;
}

export const SKILLS: SkillDefinition[] = [
  {
    name: 'read-spec-first',
    description: 'Obliga al agente a leer la especificación de SDD antes de programar.',
    scope: 'project',
    body: 'Antes de modificar o proponer cualquier cambio en el código, estás obligado a leer el archivo `.harness/tasks/TASK_ID.md` o el archivo general `openspec.yaml`. No improvises. Lista los criterios de aceptación en tu memoria interna antes de escribir código.'
  },
  {
    name: 'consult-graphify-ast',
    description: 'Minimiza el uso de tokens prohibiendo la lectura a ciegas de archivos enteros.',
    scope: 'project',
    body: 'Para entender la arquitectura o buscar definiciones de clases, métodos y decoradores, está estrictamente prohibido usar `cat` o abrir archivos de forma masiva. Debes ejecutar `graphify query <término>` o leer `GRAPH_REPORT.md`. Solo abrirás un archivo de código si vas a editarlo directamente.'
  },
  {
    name: 'self-healing-verify',
    description: 'Enseña al agente a auto-corregir errores usando el linter y compilador local.',
    scope: 'project',
    body: 'Al finalizar cualquier edición, debes ejecutar en la terminal `pnpm exec oxlint --deny=correctness` y `pnpm exec tsc --noEmit` (o el gestor indicado en `packageManager`). Si el código de salida (exit code) es diferente de 0, lee el log de error, corrige el archivo inmediatamente y vuelve a validar. No reportes la tarea como lista si los comandos fallan.'
  },
  {
    name: 'universal-design-patterns',
    description: 'Forzar patrones de diseño y restricciones críticas de estilo de código.',
    scope: 'project',
    body: 'Aplica patrones de diseño universales (como el patrón Repository para la capa de datos) a lo largo de toda la arquitectura del subdominio afectado. Genera código limpio, modular y altamente escalable. Restricción absoluta: No incluyas comentarios explicativos dentro del código generado bajo ninguna circunstancia.'
  },
  {
    name: 'obsidian-sdd',
    description: 'Define cuándo y cómo usar la bóveda Obsidian en el flujo SDD, para el orquestador y los subagentes.',
    scope: 'project',
    body: `Obsidian es la capa de lectura humana del SDD. La fuente de verdad sigue siendo \`openspec.yaml\` y \`.harness/tasks/\`; la bóveda los refleja con enlaces. No dupliques contenido.

## Puntos de uso en el flujo SDD

- **Fase 1 · Entender:** el orquestador ejecuta \`alvaress obsidian status\` y lee la nota del proyecto para recuperar contexto, decisiones y riesgos. Los subagentes de exploración pueden leer la nota y los enlaces, nunca escribir.
- **Fase 2 · Decidir:** el orquestador usa la nota para resumir el estado que enviará al modelo de decisión (kev o laya). No incluyas secretos. Los subagentes no consultan el modelo de decisión.
- **Fase 3 · Ejecutar:** el orquestador y los subagentes escriben en \`.harness/tasks/\` y \`openspec.yaml\`. La bóveda es de solo lectura para los subagentes y no se edita directamente.
- **Fase 4 · Validar:** la bóveda no sustituye la validación. Los subagentes de verificación ejecutan los comandos locales y no escriben en la bóveda.
- **Fase 5 · Cerrar:** solo el orquestador actualiza la nota con \`alvaress obsidian note --summary ... --validation ... --risk ... --next ...\`.

## Reglas

- Si no hay bóveda configurada, continúa sin ella; no la crees desde el agente.
- No edites \`<bóveda>/Harness/\` a mano. Usa \`alvaress obsidian note\`.
- No crees una nota por tarea: usa la nota del proyecto y los enlaces \`[[Tasks/...]]\`.
- No envíes al modelo de decisión contenido de la bóveda con secretos, tokens o datos personales.
- Al delegar en un subagente, pásale la ruta de la bóveda y la instrucción de solo lectura.`
  }
];

export interface SkillLink {
  target: string;
  link: string;
  result: LinkResult;
}

export interface SkillInstallReport {
  skillsDir: string;
  files: string[];
  links: SkillLink[];
}

export interface SkillInstallOptions {
  linkGlobal?: boolean;
  targets?: string[];
}

export function renderSkill(skill: SkillDefinition): string {
  return [
    '---',
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    `scope: ${skill.scope}`,
    '---',
    skill.body,
    ''
  ].join('\n');
}

export function skillFilePath(skill: SkillDefinition, skillsDir: string): string {
  return path.join(skillsDir, skill.name, 'SKILL.md');
}

export function installSkills(
  projectRoot: string = process.cwd(),
  options: SkillInstallOptions = {}
): SkillInstallReport {
  const skillsDir = path.join(projectRoot, SKILLS_DIR);
  ensureDir(skillsDir);

  const files = SKILLS.map((skill) => {
    const file = skillFilePath(skill, skillsDir);
    writeTextFile(file, renderSkill(skill));
    return file;
  });

  const links: SkillLink[] = [];
  if (options.linkGlobal !== false) {
    const targets = options.targets ?? [OPENCODE_SKILLS_DIR, CLAUDE_SKILLS_DIR];
    for (const targetRoot of targets) {
      for (const skill of SKILLS) {
        const source = path.join(skillsDir, skill.name);
        const link = path.join(targetRoot, skill.name);
        links.push({ target: source, link, result: linkDirectory(source, link) });
      }
    }
  }

  return { skillsDir, files, links };
}
