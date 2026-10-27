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
    body: `Antes de modificar o proponer cualquier cambio, lee la fuente del modo: en ODD, la nota de Obsidian y el alcance acordado; en SDD, \`openspec.yaml\` y \`.harness/tasks/TASK_ID.md\`. No improvises.

- Resume los criterios de aceptación en 1-3 líneas; no copies la especificación completa.
- Si la fuente no existe, está incompleta o contradice la solicitud, devuelve \`scope: blocked\` con lo que falta. No rellenes huecos con suposiciones.
- Lee solo la fuente, los archivos del alcance y el contexto que ya te pasó el orquestador. No explores el proyecto entero.`
  },
  {
    name: 'consult-graphify-ast',
    description: 'Minimiza el uso de tokens prohibiendo la lectura a ciegas de archivos enteros.',
    scope: 'project',
    body: `Para entender la arquitectura o buscar definiciones de clases, métodos y decoradores, está prohibido usar \`cat\` o abrir archivos de forma masiva. Ejecuta \`graphify query <término>\`, \`graphify explain <concepto>\` o \`graphify path <A> <B>\`, y usa \`graphify-out/wiki/index.md\` si existe. Solo abre un archivo de código si vas a editarlo o si el grafo ya localizó el rango exacto.

- No ejecutes \`graphify update\` ni reconstruyas el grafo: puede ser costoso y no es parte de la tarea. Si está desactualizado, avísalo.
- Si \`graphify\` no está instalado, no lo instales; usa búsquedas localizadas (\`rg\`, \`grep\`, \`sed -n\`) y reporta la limitación.
- Filtra la salida: pide solo el nodo, la ruta o el rango que necesitas; no pegues subgrafos completos.`
  },
  {
    name: 'self-healing-verify',
    description: 'Enseña al agente a auto-corregir errores usando Vite-Plus en local.',
    scope: 'project',
    body: `Al finalizar cualquier edición, ejecuta la validación local con Vite-Plus: \`vp check\` y \`vp test\`. Usa pnpm como forma canónica: \`pnpm exec vp check\` y \`pnpm exec vp test\`. Solo si el proyecto declara \`packageManager: "npm"\` y pnpm no está disponible, usa \`npx\`.

- Si el exit code es distinto de 0, lee el error real, corrige la causa y vuelve a validar una vez.
- Máximo dos ciclos de cambio + validación. Si el mismo error se repite, detente y devuelve el fallo exacto.
- Si falla una herramienta o la configuración del proyecto (Vite-Plus ausente, script inexistente, dependencia rota), no reinstales ni cambies el gestor: reporta y devuelve \`needs-orchestrator\`.
- No reportes la tarea como lista si los comandos fallan ni silencies errores con \`--no-verify\`, \`any\` o \`@ts-ignore\`.`
  },
  {
    name: 'universal-design-patterns',
    description: 'Respeta los patrones existentes del proyecto y evita introducir abstracciones nuevas.',
    scope: 'project',
    body: `Antes de aplicar un patrón, comprueba si el proyecto ya usa uno. La arquitectura existente manda.

## Reglas

- Sigue la estructura, nombres, capas y convenciones del módulo afectado.
- No introduzcas Repository, Factory, Service ni capas nuevas solo porque suenan bien. Si el cambio no necesita una abstracción, no la crees.
- No muevas archivos, no renombres símbolos y no refactorices fuera del alcance.
- Mantén el tipado estricto y los contratos públicos existentes.
- Comenta solo lo que no sea evidente: decisiones, invariantes o workarounds. No repitas el código con comentarios.
- Si el patrón existente no alcanza, devuelve \`scope: blocked\` y explica la decisión; no improvises una arquitectura paralela.`
  },
  {
    name: 'obsidian-sdd',
    description: 'Define cuándo y cómo usar la bóveda Obsidian en el flujo híbrido SDD/ODD.',
    scope: 'project',
    body: `Obsidian es la capa de lectura humana del arnés. En SDD la fuente de verdad sigue siendo \`openspec.yaml\` y \`.harness/tasks/\`; en ODD la nota de la tarea es la fuente. La bóveda refleja el estado y no duplica contenido.

## Puntos de uso en el flujo híbrido

- **Fase 1 · Entender:** el orquestador ejecuta \`alvaress obsidian status\` y lee la nota de la tarea (ODD) o del proyecto (SDD) para recuperar contexto, decisiones y riesgos. Los subagentes de exploración pueden leer la nota y los enlaces, nunca escribir.
- **Fase 2 · Decidir:** el orquestador usa la nota para resumir el estado que enviará a Laya. No incluyas secretos. Los subagentes no consultan Laya.
- **Fase 3 · Ejecutar:** en SDD se escribe en \`.harness/tasks/\` y \`openspec.yaml\`; en ODD se implementa el alcance de la nota. La bóveda es de solo lectura para los subagentes y no se edita directamente.
- **Fase 4 · Validar:** la bóveda no sustituye la validación. El verificador ejecuta Vite-Plus y no escribe en la bóveda.
- **Fase 5 · Cerrar:** solo el orquestador actualiza la nota con \`alvaress obsidian note --summary ... --validation ... --risk ... --next ...\` y, en ODD, marca el checklist como \`[x]\` cuando la validación pasó.

## Reglas

- Si no hay bóveda configurada, continúa sin ella; no la crees desde el agente.
- No edites \`<bóveda>/Harness/\` a mano. Usa \`alvaress obsidian note\`.
- En SDD no crees una nota por tarea: usa la nota del proyecto y los enlaces \`[[Tasks/...]]\`. En ODD actualiza la nota de la tarea sin duplicar el proyecto.
- En SDD, \`openspec.yaml\` y \`.harness/tasks/\` mandan; la nota no reemplaza la especificación.
- Lee solo la nota del proyecto o de la tarea y sus enlaces directos. No recorras la bóveda completa ni sigas enlaces recursivos.
- No envíes a Laya contenido de la bóveda con secretos, tokens o datos personales.
- Al delegar en un subagente, pásale la ruta de la bóveda y la instrucción de solo lectura.`
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
    body: `Trabajas con un alcance cerrado. El orquestador te dio una lista de archivos permitidos; esa lista es el contrato.

## Contrato

- Si no recibiste una lista de archivos permitidos, no empieces: pide el alcance.
- Modifica solo los archivos listados. Puedes crear un archivo nuevo solo si el orquestador lo autorizó por nombre.
- No hagas refactors, renombres, formateos masivos ni "mejoras de paso".
- No cambies dependencias, configuración de build, CI ni scripts sin autorización explícita.
- No instales paquetes, no actualices lockfiles y no ejecutes comandos de red.
- No toques tests para que pasen: corrige el código o reporta el fallo.
- No uses \`git checkout\`, \`git restore\`, \`git clean\`, \`rm\` ni \`mv\` para deshacer; reporta.
- Si el cambio requiere un archivo, una dependencia o una migración fuera del alcance, detente.

## Cuándo detenerte

Devuelve \`scope: blocked\` y la ruta exacta cuando:

- la causa del fallo está en un archivo no asignado;
- hace falta una dependencia nueva;
- el cambio exige una migración de datos o de esquema;
- el error es de arquitectura y no se arregla con un parche local;
- el mismo error ya se repitió en dos intentos.

No inventes el archivo que falta ni lo edites "solo un poquito".

## Eficiencia

- Lee solo el rango de líneas que necesitas.
- No leas \`node_modules/\`, \`dist/\`, \`coverage/\` ni lockfiles.
- Reutiliza el contexto que ya te pasó el orquestador; no reexplores el proyecto.
- Devuelve un resumen corto, no el diff completo ni logs enteros.`
  },
  {
    name: 'vite-plus-verify',
    description: 'Ejecuta Vite-Plus como validador local y devuelve el error exacto sin ruido.',
    scope: 'project',
    body: `Vite-Plus es el validador local del arnés. No consume tokens de modelo, pero su salida sí ocupa contexto: filtra lo que devuelves.

## Comandos

1. \`vp check\`: formato, lint y tipos.
2. \`vp test\`: pruebas con Vitest.
3. Usa pnpm como forma canónica: \`pnpm exec vp check\` y \`pnpm exec vp test\`.
4. Solo si el proyecto declara \`packageManager: "npm"\` y no hay pnpm, usa \`npx\` como excepción.
5. Si \`vp\` no existe, usa \`pnpm exec vp\`; si tampoco, reporta la herramienta ausente. No la instales.

Nunca uses modo watch, \`--fix\`, \`--update\`, \`-u\` ni \`--no-verify\`. No ejecutes auto-fixes que reescriban archivos fuera del alcance.

## Lectura del fallo

- Empieza por la primera línea de error real, no por el resumen final.
- Identifica \`archivo:línea\`, la regla o el test que falla y el primer mensaje accionable.
- Distingue un fallo de tipos, uno de lint y uno de test; no los mezcles.
- Si el log es enorme, quédate con las primeras líneas relevantes y el último error de causa.
- No vuelques el log completo: el orquestador puede abrirlo con \`alvaress -i\`.

## Contrato de respuesta

Por cada comando:

- \`verdict:\` \`OK\` o \`FALLO\`.
- \`command:\` comando exacto.
- \`exit:\` código de salida.
- \`error:\` \`ruta:línea: mensaje\`.
- \`cause:\` causa raíz más probable en una frase.

Si no puedes determinar la causa, dilo; no adivines.`
  },
  {
    name: 'failure-triage',
    description: 'Clasifica un fallo de validación como trivial o nuclear antes de repararlo.',
    scope: 'project',
    body: `Antes de tocar código, clasifica el fallo. Reparar un síntoma puede romper más de lo que arregla.

## Trivial (reparar)

- Error de tipos, import faltante o firma desactualizada por el cambio intencional.
- Fallo de lint o formato en un archivo del alcance.
- Error localizado en un archivo asignado y con causa evidente.

Si un test falla porque el contrato cambió, no lo edites: devuelve \`needs-orchestrator\` para que el orquestador autorice el cambio.

## Nuclear (HALT)

- El fallo es de arquitectura, límites entre módulos o diseño de datos.
- Hace falta una migración, un cambio de esquema o una dependencia nueva.
- El alcance no alcanza o el error está en un archivo no asignado.
- El mismo error ya se repitió en dos intentos.
- Falla una herramienta necesaria para validar o ejecutar (Vite-Plus, \`opencode\`/Aider). Que Laya no esté disponible no es nuclear: el arnés cae a heurísticas. Que Obsidian falte tampoco: se continúa sin bóveda.
- No hay una causa clara y el siguiente intento sería a ciegas.

## Límites

- Máximo 2 intentos de reparación por run. Un intento = un cambio + una validación.
- No edites ni borres tests, no relajes aserciones y no uses \`any\`, \`@ts-ignore\`, \`eslint-disable\` ni \`--no-verify\`.
- No cambies la configuración de validación para que pase ni reinstales dependencias para arreglar el entorno.
- No reintentes el mismo parche con otra forma.

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
