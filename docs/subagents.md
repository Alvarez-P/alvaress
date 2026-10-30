# Subagentes y worker de código

Este documento define cómo el arnés híbrido SDD/ODD ejecuta cambios con el
worker de subagentes. La máquina de estados no cambia: el `Worker` implementa la
edición y el orquestador conserva el alcance, los permisos, la validación y el
commit.

## Contrato del worker

```ts
export interface WorkPlan {
  runId: string;
  mode: 'odd' | 'sdd';
  complexity?: 'trivial' | 'small' | 'medium' | 'large';
  taskId?: string;
  request: string;
  source: string;
  acceptance: string[];
  files: string[];
  validation: string[];
  learnings: Array<{ id: string; title: string }>;
  briefs?: SpecialistBrief[];
  vaultPath?: string;
}

export interface WorkResult {
  status: 'done' | 'blocked' | 'failed';
  changes: FileChange[];
  risks: Risk[];
  blockedBy?: string;
  detail?: string;
}

export interface FixInput {
  runId: string;
  attempt: number;
  files: string[];
  failure: ValidationResult;
  error: string;
  review?: string;
}

export interface FixResult {
  verdict: 'fixed' | 'needs-orchestrator' | 'nuclear';
  changes: FileChange[];
  cause: string;
  risks: Risk[];
}

export interface Worker {
  work(plan: WorkPlan): Promise<WorkResult>;
  fix(input: FixInput): Promise<FixResult>;
  consult?(role: SpecialistRole, input: ConsultInput): Promise<SpecialistBrief>;
  close?(): Promise<void>;
}
```

`SubagentWorker` no implementa el subagente: lo invoca con
`opencode run --agent <subagente> --auto --session <run>`. La implementación y la
reparación piden `--format json`; las consultas de especialistas usan texto
porque su brief es la respuesta. El worker pasa el `WorkPlan` serializado en el
mensaje, junto con la fuente y los archivos pequeños del alcance (≤8 KB por
archivo, ≤16 KB en total) para ahorrar la llamada de lectura. Si
`models.subagents.modelName` no está vacío, añade `--model`; la misma sesión se
reutiliza entre especialistas, implementación y reparación. Para la
implementación y la reparación no interpreta la respuesta: compara el workspace
antes y después con snapshots SHA-1 y deriva `changes` y `risks` de ese diff. El
subagente devuelve un resumen corto para el log, pero la fuente de verdad del
resultado es el diff.

El estado del árbol de trabajo se envía en dos niveles para ahorrar tokens: el
implementer y los especialistas previos reciben `git diff --stat`; el reviewer y
el fixer, el diff completo (máx. 8 000 caracteres). Ambos incluyen los archivos
nuevos sin seguimiento, así que nadie necesita `git status`. Cada brief de
especialista se recorta a 3 000 caracteres. El log del run anota el tamaño de
cada prompt para medir el consumo.

Con `--self-check` (o `worker.selfCheck: true`), el `alvaress-implementer` (no la
variante lite) puede ejecutar una vez el primer comando rápido de la validación
(`vp check`, `tsc`, `oxlint` o `eslint`) antes de terminar. Está desactivado por
defecto: ahorra una ronda de reparación cuando hay errores de tipos, a cambio de
una llamada más dentro del turno. El log registra el comando usado.

## Flujo de especialistas

Laya participa en dos momentos del run:

1. **Antes de explorar (`route`)**: elige ODD o SDD, la complejidad, si conviene
   consultar Graphify y si el trabajo se reparte.
2. **Después de cerrar el alcance (`planFlow`)**: decide qué especialistas
   aportan contexto antes de implementar y si conviene una revisión final.

```text
explore → planFlow → researcher → architect → designer → tester
        → implement → check → reviewer → fix (si falla) → ready
```

- Cada especialista recibe los briefs anteriores y devuelve texto corto. Su
  salida no edita archivos: el orquestador la acumula y la pasa al implementer
  en `WorkPlan.briefs`.
- El `reviewer` se ejecuta después de la primera validación. Su revisión se
  registra en el cierre y, si la validación falla, se pasa al fixer en
  `FixInput.review`.
- Si un especialista falla o devuelve un brief vacío, el run continúa y anota un
  riesgo de severidad baja.

### Proporcionalidad

| Complejidad | Especialistas por defecto |
| --- | --- |
| `trivial` (ODD) | Ninguno. `explorer` → `implementer-lite` → validación. |
| `small` (ODD) | Solo el especialista de dominio que mencione la petición (UI, dependencias, tests). Sin arquitecto ni reviewer. |
| `medium` (ODD) | `architect` y `reviewer`; se suman `designer`, `researcher` o `tester` si el texto lo pide. |
| `large` o SDD | Laya suma los que correspondan por dominio. La heurística añade `architect`, `tester` y `reviewer`. |

Laya no puede cambiar el alcance ni los archivos: solo selecciona roles. El
orquestador impone la regla anterior. Si Laya falla o su confianza es menor que
`0.6`, el flujo lo decide `heuristicFlow` con los mismos criterios y un plan
conservador.

## Reparto de subagentes

| Subagente | Estado | Responsabilidad | No puede |
| --- | --- | --- | --- |
| `alvaress-explorer` | `Exploring` | Localizar código, leer la nota y proponer alcance cerrado. | Editar, escribir en la bóveda, decidir. |
| `alvaress-researcher` | `Exploring` | Resolver dependencias, versiones, APIs y migraciones con fuentes. | Instalar, editar, salirse del tema. |
| `alvaress-architect` | `Exploring` | Proponer límites, contratos, datos y orden de implementación. | Escribir código o ampliar el alcance. |
| `alvaress-designer` | `Exploring` | Definir layout, componentes, tokens, estados y accesibilidad. | Editar archivos o inventar un design system. |
| `alvaress-implementer` | `Working` | Implementar una micro-tarea ODD o una tarea SDD acotada. | Salir del alcance, git, commit, dependencias nuevas. |
| `alvaress-implementer-lite` | `Working` | Cambios triviales o pequeños: edita sin explorar y sin validar. | Shell, git, commit, dependencias nuevas. |
| `alvaress-tester` | `Checking` | Diseñar casos y diagnosticar fallos con el runner existente. | Editar código o aserciones. |
| `alvaress-verifier` | `Checking` | Ejecutar `vp check`/`vp test` y devolver el error exacto. | Editar, corregir, tocar git. |
| `alvaress-reviewer` | `Checking` | Revisar el diff contra la spec y los estándares. | Reescribir; solo devuelve hallazgos. |
| `alvaress-fixer` | `Fixing` | Reparar un fallo trivial, máximo 2 intentos. | Ampliar alcance, borrar tests, silenciar errores. |

El orquestador no delega la decisión, el commit, el `[x]` de Obsidian ni los
aprendizajes. Los subagentes no lanzan otros subagentes.

Los subagentes reciben una regla explícita: cero comentarios en el código
generado (nada de explicaciones, separadores, `TODO`/`FIXME` ni JSDoc de
relleno); solo conservan los comentarios que ya existían. El orquestador revisa
el diff y rechaza cualquier comentario nuevo antes de validar y commitear.

Esa revisión es una auditoría determinista (`src/orchestrator/audit.ts`), sin
tokens: compara las líneas añadidas en archivos de código desde el inicio del
run. Bloquean (cuentan como fallo de validación y pasan al fixer) los
comentarios nuevos, `TODO`/`FIXME`, tests con `.skip`/`.only`, archivos de test
eliminados y cambios en lockfiles. Solo se reportan como riesgo `console.log`,
tipos `any`, menos casos de prueba y borrados de más de 200 líneas.

No cuentan como comentario las directivas funcionales (`// @ts-expect-error`,
`/// <reference>`, `eslint-disable`, `# noqa`, `# type:`, shebangs…) ni las
líneas que empiezan con `*` fuera de un bloque `/* */`. Si la petición o los
criterios piden documentar (`JSDoc`, `TSDoc`, `docstring`, `documenta…`), el
prompt permite JSDoc donde se pide y la auditoría no bloquea los bloques `/** */`;
cualquier otro comentario sigue bloqueando.

## Skills por subagente

| Subagente | Skills disponibles |
| --- | --- |
| `alvaress-explorer` | `consult-graphify-ast`, `obsidian-sdd`, `git-diff-context`, `bounded-scope` |
| `alvaress-researcher` | `technical-research`, `consult-graphify-ast`, `bounded-scope` |
| `alvaress-architect` | `read-spec-first`, `architecture-decisions`, `consult-graphify-ast`, `bounded-scope` |
| `alvaress-designer` | `read-spec-first`, `ui-design`, `clean-code`, `bounded-scope` |
| `alvaress-implementer` | `read-spec-first`, `clean-code`, `git-diff-context`, `bounded-scope`, `self-healing-verify` |
| `alvaress-implementer-lite` | `read-spec-first`, `clean-code`, `bounded-scope` |
| `alvaress-tester` | `read-spec-first`, `testing-strategy`, `vite-plus-verify`, `bounded-scope` |
| `alvaress-verifier` | `vite-plus-verify`, `bounded-scope` |
| `alvaress-reviewer` | `read-spec-first`, `code-review`, `clean-code`, `git-diff-context`, `bounded-scope` |
| `alvaress-fixer` | `failure-triage`, `clean-code`, `git-diff-context`, `self-healing-verify`, `bounded-scope` |

El frontmatter de cada subagente limita la acción `skill` a esa lista: cualquier
otra skill se deniega. No es obligatorio cargarlas: el mensaje del worker ya
incluye el contrato, los briefs y el contexto de los archivos pequeños. Cuando
`models.orchestrator` o `models.subagents` están configurados, el instalador
escribe `model: provider/model` en el frontmatter correspondiente; si están
vacíos, OpenCode hereda el modelo de la sesión.

## Seguridad y permisos

Los diez perfiles comparten estas medidas:

- `subagent: "*"` denegado: no pueden crear más subagentes.
- `webfetch` y `websearch` denegados, salvo en `alvaress-researcher`: el resto no
  depende de la red ni exfiltra contexto.
- `question` denegado: si falta contexto, devuelven `blocked` al orquestador.
- `execute` denegado: no usan Code Mode ni herramientas anidadas.
- Lectura de `.env`, `.pem`, `.key`, `.p12`, `id_rsa` e `id_ed25519` denegada.
- `shell: "*"` denegado al final del perfil: solo pasan los comandos permitidos.
- `external_directory` denegado en los perfiles de escritura y validación: no
  leen ni escriben fuera del proyecto. El explorer lo permite para leer la
  bóveda y los stores de memoria global y del proyecto, pero tiene `edit: "*"`
  denegado y solo debe abrir la nota del proyecto o de la tarea.
- Sin `git push`, `git reset`, `git clean`, `git commit`, `git checkout`,
  `git restore`, `rm`, `sudo`, `curl` ni `wget`.
- Sin `pnpm`/`npm publish`, `pnpm dlx`, `npm exec`, `npx --yes`, `find -exec`,
  `find -delete`, `sed -i` ni `rg --pre`.
- Sin scripts de deploy, release, publish, migración, base de datos o seed.
- Sin `alvaress apply`, `alvaress verify`, `alvaress obsidian note`,
  `alvaress archive` ni `alvaress learn add`.
- La bóveda Obsidian es de solo lectura en todos los casos.

El límite de pasos (`steps`) acota el coste: 10 para el implementer-lite, 12 para
explorar y verificar, 16 para investigar, diseñar, probar y revisar, 20 para
arquitectura y reparación, y 30 para implementar.

## Contrato de handoff

El orquestador pasa siempre:

1. `mode`, `taskId` y la fuente (nota ODD u `openspec.yaml` + tarea SDD).
2. Criterios de aceptación verificables.
3. Lista cerrada de archivos permitidos y archivos prohibidos.
4. Comando de validación exacto.
5. Aprendizajes relevantes (id y título), ya filtrados.
6. Los briefs de los especialistas anteriores, en orden.
7. La instrucción: "La bóveda Obsidian es de solo lectura; devuelve el resultado
   al orquestador."

## Contrato de respuesta

Cada subagente responde en texto corto y estable. El worker no necesita parsear
la implementación porque el diff manda; el contrato sirve para el log y para los
briefs de especialistas:

- `scope:` `ok` o `blocked` + ruta exacta.
- `files:` rutas y micro-descripción.
- `validation:` comando, exit code y resultado.
- `risks:` riesgos residuales o `ninguno`.
- `verdict:` `fixed`, `needs-orchestrator`, `nuclear` o `listo`/`bloqueado`.
- Especialistas: `layout:`, `components:`, `plan:`, `blockers:`, `sources:` o el
  bloque que pida su skill, siempre en 20-25 líneas como máximo.

## Motor de decisión

El orquestador decide con Laya, un modelo ONNX local. El motor vive vendorizado
en `src/decision/vendor/laya` (port MIT de `@receptron/laya`) y se carga desde
una caché global compartida:

```text
~/.cache/alvaress/laya-onnx-int8/<revision>/
├── laya.onnx
├── laya.onnx.data
├── laya_config.json
└── tokenizer/
```

- Si falta el bundle, el instalador lo descarga y verifica cada archivo con
  SHA-256. `alvaress doctor` avisa si falta el runtime, el tokenizer o algún
  archivo del modelo.
- `laya.modelDir` permite usar un bundle propio; `laya.threads` limita los
  hilos intra-op de ONNX Runtime.
- Los subagentes nunca llaman a Laya. Solo el orquestador le envía un resumen
  redactado del estado, con un máximo de tres llamadas por solicitud.
- Laya decide ruta, flujo de especialistas, riesgo residual, triaje de fallos y
  scope de aprendizajes. Ninguna de esas decisiones cambia el alcance, los
  permisos, los tests ni el commit.
- Si Laya falla o tarda más de `laya.timeoutMs`, el arnés sigue con las
  heurísticas deterministas de `src/decision/heuristics.ts`.

## HALT

El orquestador activa el Kill Switch y no reintenta cuando:

- el fixer devuelve `nuclear`;
- el mismo error aparece dos veces;
- el alcance se viola o falta un archivo no asignado;
- falla una herramienta requerida (por ejemplo, `opencode` o `vp`);
- el worker agota el timeout;
- el diff queda vacío tras una reparación.

En `Halted` no hay commit, no se marca `[x]`, se libera el lock y se escribe
`.laya/HALT.json` con la causa y la ruta del log.

## Eficiencia

- Una sesión OpenCode por run: especialistas, implementación y reparación
  comparten prompt y archivos leídos en vez de recargarlos.
- El mensaje del worker incluye la fuente, los briefs y los archivos pequeños
  del alcance, y deja la validación al orquestador. Así el subagente pasa de
  tres llamadas (leer, editar, cerrar) a dos (editar, cerrar).
- Complejidad `trivial` o `small` usa `alvaress-implementer-lite`: sin shell, sin
  validación y sin carga obligatoria de skills; el orquestador valida al final.
- Los especialistas solo se convocan cuando su dominio cambia la decisión.
- Una micro-tarea por subagente; nunca el proyecto completo.
- El explorer devuelve un alcance; el implementer no reexplora.
- El verifier devuelve el error exacto; el fixer no repite la validación completa
  si ya la tiene.
- Nada de logs completos en la respuesta: el orquestador usa `alvaress -i`.
- Los subagentes consultan Graphify con `--budget 1200` antes de `grep`/`read` y
  no leen `GRAPH_REPORT.md`.
