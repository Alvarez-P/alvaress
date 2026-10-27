# Subagentes y worker sin Aider

Este documento define cómo el arnés híbrido SDD/ODD ejecuta cambios cuando Aider
está desactivado. La máquina de estados no cambia: solo cambia el `Worker`.

## Selección del worker

```jsonc
{
  "aider": {
    "enabled": false,
    "timeoutMs": 600000
  }
}
```

- `aider.enabled` distinto de `false` → `AiderWorker`: `alvaress apply` y
  `alvaress verify`.
- `aider.enabled: false` → `SubagentWorker`: `alvaress-implementer` y
  `alvaress-fixer`.
- El orquestador decide, cierra el alcance, hace el commit, marca Obsidian y
  escribe aprendizajes en ambos modos.

## Contrato del worker

```ts
export interface WorkPlan {
  runId: string;
  mode: 'odd' | 'sdd';
  taskId?: string;
  request: string;
  source: string;
  acceptance: string[];
  files: string[];
  validation: string[];
  learnings: Array<{ id: string; title: string }>;
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
}

export interface FixResult {
  verdict: 'fixed' | 'needs-orchestrator' | 'nuclear';
  changes: FileChange[];
  cause: string;
  risks: Risk[];
}

export interface Worker {
  readonly kind: 'aider' | 'subagent';
  work(plan: WorkPlan): Promise<WorkResult>;
  fix(input: FixInput): Promise<FixResult>;
  close?(): Promise<void>;
}
```

`SubagentWorker` no implementa el subagente: lo invoca con
`opencode run --agent <subagente> --auto --format json` y le pasa el `WorkPlan`
serializado en el mensaje. No interpreta la respuesta del subagente: compara el
workspace antes y después con snapshots SHA-1 y deriva `changes` y `risks` de ese
diff. El subagente devuelve un resumen corto para el log, pero la fuente de verdad
del resultado es el diff.

## Reparto de subagentes

| Subagente | Estado | Responsabilidad | No puede |
| --- | --- | --- | --- |
| `alvaress-explorer` | `Exploring` | Localizar código, leer la nota y proponer alcance cerrado. | Editar, escribir en la bóveda, decidir. |
| `alvaress-implementer` | `Working` | Implementar una micro-tarea ODD o una tarea SDD acotada. | Salir del alcance, git, commit, dependencias nuevas. |
| `alvaress-verifier` | `Checking` | Ejecutar `vp check`/`vp test` y devolver el error exacto. | Editar, corregir, tocar git. |
| `alvaress-fixer` | `Fixing` | Reparar un fallo trivial, máximo 2 intentos. | Ampliar alcance, borrar tests, silenciar errores. |

El orquestador no delega la decisión, el commit, el `[x]` de Obsidian ni los
aprendizajes. Los subagentes no lanzan otros subagentes ni consultan la web.

## Skills por subagente

| Subagente | Skills obligatorias |
| --- | --- |
| `alvaress-explorer` | `consult-graphify-ast`, `obsidian-sdd`, `bounded-scope` |
| `alvaress-implementer` | `read-spec-first`, `universal-design-patterns`, `bounded-scope`, `self-healing-verify` |
| `alvaress-verifier` | `vite-plus-verify`, `bounded-scope` |
| `alvaress-fixer` | `failure-triage`, `self-healing-verify`, `bounded-scope` |

El frontmatter de cada subagente limita la acción `skill` a esa lista: cualquier
otra skill se deniega.

## Seguridad y permisos

Los cuatro perfiles comparten estas medidas:

- `subagent: "*"` denegado: no pueden crear más subagentes.
- `webfetch` y `websearch` denegados: no hay salida de datos ni dependencia de red.
- `question` denegado: si falta contexto, devuelven `blocked` al orquestador.
- `execute` denegado: no usan Code Mode ni herramientas anidadas.
- Lectura de `.env`, `.pem`, `.key`, `.p12`, `id_rsa` e `id_ed25519` denegada.
- `shell: "*"` denegado al final del perfil: solo pasan los comandos permitidos.
- `external_directory` denegado en implementer, verifier y fixer: no leen ni
  escriben fuera del proyecto. El explorer lo permite para leer la bóveda y la
  memoria global, pero tiene `edit: "*"` denegado y solo debe abrir la nota del
  proyecto o de la tarea, no directorios externos arbitrarios.
- Sin `git push`, `git reset`, `git clean`, `git commit`, `git checkout`,
  `git restore`, `rm`, `sudo`, `curl` ni `wget`.
- Sin `pnpm`/`npm publish`, `pnpm dlx`, `npm exec`, `npx --yes`, `find -exec`,
  `find -delete`, `sed -i` ni `rg --pre`.
- Sin scripts de deploy, release, publish, migración, base de datos o seed.
- Sin `alvaress apply`, `alvaress verify`, `alvaress obsidian note`,
  `alvaress archive` ni `alvaress learn add`.
- La bóveda Obsidian es de solo lectura en todos los casos.

El límite de pasos (`steps`) acota el coste: 12 para explorar y verificar, 20
para reparar y 30 para implementar.

## Contrato de handoff

El orquestador pasa siempre:

1. `mode`, `taskId` y la fuente (nota ODD u `openspec.yaml` + tarea SDD).
2. Criterios de aceptación verificables.
3. Lista cerrada de archivos permitidos y archivos prohibidos.
4. Comando de validación exacto.
5. Aprendizajes relevantes (id y título), ya filtrados.
6. La instrucción: "La bóveda Obsidian es de solo lectura; devuelve el resultado
   al orquestador."

## Contrato de respuesta

Cada subagente responde en texto corto y estable. El worker lo normaliza:

- `scope:` `ok` o `blocked` + ruta exacta.
- `files:` rutas y micro-descripción.
- `validation:` comando, exit code y resultado.
- `risks:` riesgos residuales o `ninguno`.
- `verdict:` `fixed`, `needs-orchestrator`, `nuclear` o `listo`/`bloqueado`.

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
- Si Laya falla o tarda más de `laya.timeoutMs`, el arnés sigue con las
  heurísticas deterministas de `src/decision/heuristics.ts`.

## HALT

El orquestador activa el Kill Switch y no reintenta cuando:

- el fixer devuelve `nuclear`;
- el mismo error aparece dos veces;
- el alcance se viola o falta un archivo no asignado;
- falla una herramienta requerida (por ejemplo, `opencode` sin Aider o `vp`);
- el worker agota el timeout;
- el diff queda vacío tras una reparación.

En `Halted` no hay commit, no se marca `[x]`, se libera el lock y se escribe
`.laya/HALT.json` con la causa y la ruta del log.

## Eficiencia

- Una micro-tarea por subagente; nunca el proyecto completo.
- El explorer devuelve un alcance; el implementer no reexplora.
- El verifier devuelve el error exacto; el fixer no repite la validación completa
  si ya la tiene.
- Nada de logs completos en la respuesta: el orquestador usa `alvaress -i`.
- Los subagentes leen Graphify antes de `grep`/`read`.
