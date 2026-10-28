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
    description: 'Obliga al agente a leer la nota ODD o la especificación SDD antes de programar.',
    scope: 'project',
    body: `Lee la fuente antes de editar: en ODD la nota de Obsidian y el alcance acordado; en SDD \`openspec.yaml\` y \`.harness/tasks/TASK_ID.md\`. Si el orquestador ya incluyó el contenido en el mensaje, no lo releas.

- Resume los criterios de aceptación en 1-3 líneas.
- Si la fuente falta, está incompleta o contradice la solicitud, devuelve \`scope: blocked\`. No supongas.
- Lee solo la fuente y los archivos del alcance.`
  },
  {
    name: 'consult-graphify-ast',
    description: 'Minimiza el uso de tokens prohibiendo la lectura a ciegas de archivos enteros.',
    scope: 'project',
    body: `Para arquitectura y símbolos usa \`graphify query "<término>" --budget 1200\`, \`graphify explain "<concepto>"\` o \`graphify path "<A>" "<B>"\`. Usa \`graphify-out/wiki/index.md\` si existe. Abre un archivo solo si vas a editarlo o el grafo ya localizó el rango exacto.

- No leas \`graphify-out/GRAPH_REPORT.md\` ni pegues subgrafos completos; pide solo el nodo, la ruta o el rango.
- No ejecutes \`graphify update\`. Si el grafo falta o está desactualizado, dilo y usa \`rg\`, \`grep\` o \`sed -n\`.
- Si la salida se trunca, estrecha la consulta en vez de subir el presupuesto.`
  },
  {
    name: 'self-healing-verify',
    description: 'Enseña al agente a auto-corregir errores usando Vite-Plus en local.',
    scope: 'project',
    body: `Valida con Vite-Plus: \`vp check\` y \`vp test\`; fallback \`pnpm exec vp check|test\`. Usa \`npx\` solo si el proyecto declara \`packageManager: "npm"\`.

- Si el comando falla, lee el error real, corrige la causa y revalida una vez. Máximo dos ciclos.
- Si el mismo error se repite o falta una herramienta, detente y devuelve el fallo exacto; no reinstales ni cambies el gestor ni la configuración.
- Si el permiso deniega el comando, no lo reintentes: reporta \`needs-orchestrator\`.
- No silencies errores con \`--no-verify\`, \`any\` ni \`@ts-ignore\`.`
  },
  {
    name: 'universal-design-patterns',
    description: 'Respeta los patrones existentes del proyecto y evita introducir abstracciones nuevas.',
    scope: 'project',
    body: `La arquitectura existente manda: sigue estructura, nombres, capas y convenciones del módulo.

- No introduzcas Repository, Factory, Service ni capas nuevas sin necesidad.
- No muevas archivos, renombres símbolos ni refactorices fuera del alcance.
- Mantén el tipado estricto y los contratos públicos.
- No agregues comentarios al código: cero explicaciones, separadores, TODO/FIXME o JSDoc de relleno. Conserva los existentes.
- Si el patrón existente no alcanza, devuelve \`scope: blocked\`.`
  },
  {
    name: 'obsidian-sdd',
    description: 'Define cuándo y cómo usar la bóveda Obsidian en el flujo híbrido SDD/ODD.',
    scope: 'project',
    body: `Obsidian es la capa de lectura humana. En SDD manda \`openspec.yaml\` + \`.harness/tasks/\`; en ODD manda la nota de la tarea. La bóveda refleja estado, no duplica contenido.

## Para subagentes

- Solo lectura: lee la nota del proyecto o de la tarea y sus enlaces directos. No recorras la bóveda ni sigas enlaces recursivos.
- No edites \`<bóveda>/Harness/\` ni ejecutes \`alvaress obsidian note\`; el cierre es del orquestador.
- Si no hay bóveda, continúa sin ella. No envíes a Laya secretos, tokens ni datos personales.

## Para el orquestador

- Cierra con \`alvaress obsidian note --summary ... --validation ... --risk ... --next ...\`; en ODD marca \`[x]\` si la validación pasó.
- En SDD usa una nota de proyecto y enlaces \`[[Tasks/...]]\`; no crees una nota por tarea.`
  },
  {
    name: 'continuous-learning',
    description: 'Guarda aprendizajes en el store global o del proyecto y los reutiliza sin inflar el contexto.',
    scope: 'project',
    body: `Hay dos stores: \`~/.alvaress/memory/\` para lo transversal y \`.harness/memory/\` para el contexto de este repo. Sirven para no volver a resolver dos veces el mismo problema y para proponer mejoras al propio agente.

## Antes de trabajar

1. Si la tarea no es trivial o toca un tema que ya resolviste, ejecuta \`alvaress learn search "<tema>"\` con las palabras clave. No gastes una búsqueda en cambios de una línea.
2. Pasa al modelo como máximo tres títulos. Abre el cuerpo con \`alvaress learn show <id>\` solo si cambia la decisión. Nunca cargues el store completo ni \`PLAYBOOK.md\`.
3. Si un aprendizaje aplica, úsalo y regístralo con \`alvaress learn use <id>\`.
4. Descarta el aprendizaje si no coincide en herramienta, firma de error o forma de tarea, o si contradice la spec o el código actual.

## Después de cerrar

La mayoría de las tareas no producen aprendizajes nuevos. **Guardar cero es un resultado normal y correcto.** No hay cuota ni obligación de guardar algo en cada ciclo.

Guarda como máximo 3 por tarea, y solo si el aprendizaje cumple al menos uno de estos criterios:

- evitó un error que ya se repitió o que costaría depurar de nuevo;
- ahorra varios pasos o más de diez minutos en un proyecto futuro;
- cambió una decisión de arquitectura, validación o alcance;
- es una convención estable del usuario o del equipo;
- corrige una instrucción del agente, una skill o el CLI.

No guardes:

- lo obvio, lo que ya dice \`openspec.yaml\`, el README o la documentación;
- el resumen de la tarea, el diff o "seguí los pasos";
- detalles de un solo proyecto que no se repetirán;
- halagos, notas de ánimo o ideas sin evidencia.

Si dudas, no guardes. Antes de escribir, pregúntate: ¿otro proyecto se beneficiaría? ¿Lo buscaría dentro de tres meses?

## Scope

Laya decide si el aprendizaje es \`global\` o \`project\` al guardar. Si no está disponible, una heurística local usa las mismas señales: herramientas y prácticas transversales van al global; rutas, ids y configuración del repo van al proyecto. El proyecto gana si el mismo \`id\` existe en ambos.

\`\`\`sh
# Laya decide el store
alvaress learn add solution "<título>" --body "<detalle>"

# Forzar el scope
alvaress learn add solution "<título>" --body "<detalle>" --global
alvaress learn add pitfall "<título>" --body "<detalle>" --scope project

# Promover del proyecto al global
alvaress learn promote <id>
\`\`\`

Tipos:

- \`step\`: una secuencia de pasos que ahorra tiempo.
- \`solution\`: una solución concreta a un problema recurrente.
- \`pitfall\`: un error que conviene evitar y cómo detectarlo.
- \`preference\`: una convención del usuario o del equipo.
- \`improvement\`: un cambio propuesto al prompt, a una skill o al CLI.

\`\`\`sh
alvaress learn add solution "Validar migraciones en seco" \\
  --body "Ejecutar el SQL en una transacción y revertir antes de aplicar." \\
  --tag db --tag migrations --source TASK-01
\`\`\`

## Calidad

- El detalle es obligatorio y debe explicar qué hacer y por qué funciona.
- Escribe en español, con verbos de acción y sin relleno.
- No guardes secretos, tokens, rutas personales ni código propietario; el CLI rechaza entradas sospechosas.
- No dupliques: si el título coincide, \`add\` actualiza la entrada existente sin inflar el contador de usos.
- Los \`improvement\` son propuestas: no edites el agente ni las skills sin aprobación del usuario.`
  },
  {
    name: 'bounded-scope',
    description: 'Mantiene al subagente dentro de los archivos asignados y le enseña a detenerse.',
    scope: 'project',
    body: `Trabajas con alcance cerrado: la lista de archivos del orquestador es el contrato.

- Si no hay lista, pide el alcance y no empieces.
- Modifica solo los archivos listados; crea uno nuevo solo si el orquestador lo autorizó por nombre.
- Sin refactors, renombres, formateos masivos, dependencias nuevas ni cambios de CI/build.
- No toques tests para que pasen: corrige el código o reporta.
- No uses \`git checkout|restore|clean\`, \`rm\` ni \`mv\` para deshacer; reporta.
- Lee solo el rango necesario; no leas \`node_modules/\`, \`dist/\`, \`coverage/\` ni lockfiles.
- Devuelve \`scope: blocked\` con la ruta exacta si la causa está fuera del alcance, hace falta una dependencia o migración, o el error se repitió dos veces. No inventes el archivo que falta.`
  },
  {
    name: 'vite-plus-verify',
    description: 'Ejecuta Vite-Plus como validador local y devuelve el error exacto sin ruido.',
    scope: 'project',
    body: `Vite-Plus es el validador local. Filtra su salida: no vuelques logs completos.

## Comandos

1. \`vp check\`: formato, lint y tipos.
2. \`vp test\`: pruebas con Vitest.
3. Fallback: \`pnpm exec vp check|test\`; usa \`npx\` solo si el proyecto declara \`packageManager: "npm"\`.
4. Si \`vp\` no existe, reporta la herramienta ausente; no la instales.

Nunca uses modo watch, \`--fix\`, \`--update\`, \`-u\` ni \`--no-verify\`.

## Lectura del fallo

- Empieza por la primera línea de error real, no por el resumen final.
- Identifica \`archivo:línea\`, la regla o el test que falla y el primer mensaje accionable.
- Distingue un fallo de tipos, uno de lint y uno de test; no los mezcles.
- Si no puedes determinar la causa, dilo; no adivines. El orquestador puede abrir el log con \`alvaress -i\`.`
  },
  {
    name: 'failure-triage',
    description: 'Clasifica un fallo de validación como trivial o nuclear antes de repararlo.',
    scope: 'project',
    body: `Antes de tocar código, clasifica el fallo.

## Trivial (reparar)

- Error de tipos, import faltante o firma desactualizada por el cambio intencional.
- Fallo de lint o formato en un archivo del alcance.
- Error localizado en un archivo asignado y con causa evidente.

Si un test falla porque el contrato cambió, no lo edites: devuelve \`needs-orchestrator\`.

## Nuclear (HALT)

- Arquitectura, límites entre módulos o diseño de datos.
- Migración, cambio de esquema o dependencia nueva.
- El alcance no alcanza o el error está en un archivo no asignado.
- El mismo error ya se repitió en dos intentos.
- Falla una herramienta necesaria (Vite-Plus, \`opencode\`/Aider). Que Laya no esté disponible no es nuclear: el arnés cae a heurísticas. Que Obsidian falte tampoco: se continúa sin bóveda.
- No hay causa clara y el siguiente intento sería a ciegas.

## Límites

- Máximo 2 intentos por run. No edites ni borres tests, no relajes aserciones y no uses \`any\`, \`@ts-ignore\`, \`eslint-disable\` ni \`--no-verify\`.
- No cambies la configuración de validación ni reinstales dependencias.

## Contrato de respuesta

- \`verdict:\` \`fixed\`, \`needs-orchestrator\` o \`nuclear\`.
- \`cause:\` causa raíz en una frase.
- \`files:\` archivos modificados y por qué.
- \`validation:\` comando, exit code y resultado.
- \`risk:\` qué podría quedar roto o \`ninguno\`.`
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
