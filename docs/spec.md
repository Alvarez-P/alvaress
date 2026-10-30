# Especificación del arnés alvaress

Documento de referencia de la arquitectura vigente. Para el uso diario, consulta
el [README](../README.md); para el contrato de los subagentes, consulta
[docs/subagents.md](./subagents.md).

## Objetivo

`alvaress` automatiza el ciclo híbrido **SDD + ODD** bajo el formato OpenSpec.
Integra una bóveda Markdown compatible con Obsidian (la app es opcional) como
espejo del estado, Graphify como mapa AST, Laya como motor de decisión local,
Vite-Plus como compuerta de validación y subagentes de OpenCode como ejecutores.

El orquestador conserva siempre cuatro responsabilidades que no delega:

1. cerrar el alcance y los permisos;
2. validar con los comandos de la tarea;
3. decidir el commit y el cierre de Obsidian;
4. registrar aprendizajes.

## Principios

- **La fuente manda.** La nota ODD o `openspec.yaml` definen el trabajo; la
  memoria del modelo no.
- **Proporcionalidad.** Un cambio trivial no paga arquitectura ni revisión. Los
  especialistas entran solo cuando su dominio cambia la decisión.
- **Alcance cerrado.** El worker edita únicamente los archivos asignados y se
  detiene con `blocked` si el alcance no alcanza.
- **Validación real.** El run no termina en `Ready` sin ejecutar los comandos
  configurados.
- **Local primero.** Laya, los aprendizajes y el grafo viven en disco; el único
  tráfico externo es el del modelo que elijas para los subagentes.
- **Código limpio.** Sin `any` ni `as` injustificados, sin magic strings o
  numbers, sin comentarios de relleno y sin abstracciones especulativas.

## Configuración

Precedencia local sobre global:

- Global: `~/.alvaressconfig.json`.
- Local: `.alvaressrc.json`.

```json
{
  "obsidianVaultPath": "/ruta/a/la/boveda",
  "packageManager": "pnpm",
  "scope": "warn",
  "graphify": { "autoUpdate": false },
  "laya": {
    "enabled": true,
    "modelDir": "",
    "device": "cpu",
    "threads": 4,
    "timeoutMs": 30000,
    "fallbackToHeuristic": true
  },
  "vitePlus": {
    "checkCommand": "vp check",
    "testCommand": "vp test",
    "fallbackToPackageManager": true
  },
  "worker": { "timeoutMs": 600000 },
  "models": {
    "orchestrator": { "modelName": "" },
    "subagents": { "modelName": "" }
  },
  "validation": {
    "maxAttempts": 3,
    "commands": ["pnpm exec vp check", "pnpm exec vp test"],
    "requireCommands": true
  }
}
```

Reglas de fusión:

- Los escalares locales sustituyen a los globales.
- La ruta de la bóveda y los comandos admiten `${VARIABLE}`.
- `alvaress config show` muestra la configuración resuelta; las credenciales viven en OpenCode.

## Bóveda Obsidian

La bóveda es una carpeta de Markdown con enlaces `[[...]]`, legible por Obsidian
y por cualquier editor. `alvaress install` la crea y la conecta siempre; la app
Obsidian no se instala por defecto y solo aporta la capa visual (grafo,
backlinks). El instalador la muestra como única casilla opcional de su checklist;
el resto de componentes son obligatorios y se restauran si se desmarcan. La ruta
se configura en global (`obsidianVaultPath`) y se puede sobrescribir por proyecto
en `.alvaressrc.json`.

## Manifiesto `openspec.yaml`

```yaml
specification: "1.0.0"
project: "mi-app"
bounded_contexts:
  - name: "billing"
    path: "src/billing"
specs:
  - id: "SPEC-001"
    title: "Crear endpoint de facturación"
    status: "Proposed"
    context: "billing"
    tasks:
      - id: "TASK-01"
        description: "Crear el repositorio de facturas"
        status: "Pending"
        priority: 10
        depends_on: []
        validation:
          - "pnpm exec tsc --noEmit"
        rollback: "Revertir el repositorio y la migración"
        files:
          - "src/billing/invoice.repository.ts"
```

- `depends_on` ordena la ejecución dentro del grupo.
- `priority` ordena tareas independientes.
- `validation` sustituye a los comandos globales.
- `files` cierra el alcance del worker.
- Estados de spec: `Proposed`, `Verified`, `Archived`, `Failed`.
- Estados de tarea: `Pending`, `InProgress`, `Done`, `Failed`.

## Flujo del run

```text
route → explore → planFlow → consultas → work → check → review → fix → ready
```

| Fase | Responsable | Resultado |
| --- | --- | --- |
| `route` | Laya o heurística | Modo, complejidad, necesidad de grafo y de reparto. |
| `explore` | Orquestador y explorer | Fuente, criterios, archivos y validación. |
| `planFlow` | Laya o heurística | Especialistas y revisión final. |
| `consultas` | Researcher, architect, designer, tester | Briefs encadenados. |
| `work` | Implementer o implementer-lite | Cambios dentro del alcance. |
| `check` | Orquestador o verifier | Comandos de validación. |
| `review` | Reviewer | Hallazgos contra la spec y los estándares. |
| `fix` | Fixer | Reparación acotada con el error exacto y la revisión. |
| `ready` | Orquestador | Estado, reporte, nota, aprendizajes y commit. |

Estados visibles: `Exploring`, `Working`, `Checking`, `Fixing`, `Ready` y
`Halted`.

## Decisión

`DecisionEngine` expone cinco decisiones y ninguna puede cambiar el alcance:

1. `route`: ODD/SDD, complejidad, Graphify y reparto.
2. `planFlow`: especialistas proporcionales y revisión final.
3. `assessRisk`: riesgo residual del diff.
4. `classifyFailure`: fallo trivial, de orquestador o nuclear.
5. `decideLearningScope`: aprendizaje global o del proyecto.

Implementaciones:

- `LayaDecisionEngine`: preguntas `choice`/`noul` al modelo ONNX local.
- `HeuristicDecisionEngine`: patrones deterministas cuando Laya falla, tarda más
  de `laya.timeoutMs` o su confianza es menor que `0.6`.

## Skills

El instalador escribe quince skills y las enlaza en las rutas de OpenCode y
Claude:

| Skill | Propósito |
| --- | --- |
| `read-spec-first` | Leer la fuente y resumir criterios antes de programar. |
| `consult-graphify-ast` | Consultar el grafo antes de `grep` o `read`. |
| `self-healing-verify` | Validar, leer el error exacto y limitar los reintentos. |
| `clean-code` | Nombres, constantes, funciones y DRY sin comentarios de relleno. |
| `obsidian-sdd` | Uso de la bóveda por fase y solo lectura para subagentes. |
| `continuous-learning` | Consultar y guardar aprendizajes sin inflar el contexto. |
| `bounded-scope` | Mantener el alcance cerrado y detenerse a tiempo. |
| `git-diff-context` | Leer el diff del árbol de trabajo sin tocar el historial. |
| `vite-plus-verify` | Ejecutar `vp check`/`vp test` sin ruido. |
| `failure-triage` | Clasificar un fallo como trivial o nuclear. |
| `architecture-decisions` | Límites, contratos y patrones proporcionales. |
| `ui-design` | Layout, tokens, estados y accesibilidad. |
| `testing-strategy` | Nivel de prueba y casos given/when/then. |
| `code-review` | Hallazgos accionables contra spec y estándares. |
| `technical-research` | Versiones, APIs y migraciones con fuentes. |

## Orquestación

`alvaress run` ejecuta el ciclo completo con un worker de subagentes y el flujo
de especialistas que decide Laya. `alvaress apply` procesa el manifiesto en
grupos aislados: las tareas del mismo contexto se serializan y las de contextos
distintos corren en paralelo. `alvaress verify` ejecuta la validación de una
tarea y delega la reparación al fixer. `apply` y `verify` comparten el mismo
`Worker` para implementar y reparar, sin repetir la fase de consultas.

Reglas de `apply`:

- Agrupar por `context` y por archivos compartidos.
- Respetar `depends_on` dentro del grupo.
- Guardar el manifiesto después de cada cambio de estado.
- Hacer backup antes de empezar y reporte al terminar.
- Si `scope` es `strict`, un archivo fuera del alcance marca la tarea como
  fallida.

## Validación y self-healing

```ts
while (attempts < maxAttempts) {
  const failure = runValidationCommands(commands, root);
  if (!failure) return true;
  attempts += 1;
  if (attempts >= maxAttempts) break;
  const repair = await worker.fix({ runId, attempt, files, failure });
  if (repair.verdict !== 'fixed') break;
}
return false;
```

- La salida de cada comando se guarda en `.laya/last_run.log`.
- `validation.maxAttempts` gobierna `apply` y `verify`; `run` usa su propio
  límite de dos reparaciones.
- Un fallo nuclear no se reintenta: termina en `Halted`.
- El fixer no toca tests ni silencia errores; corrige la causa.

## Restricciones de generación de código

- Sin explicaciones conversacionales ni comentarios dentro del código generado.
- Manejo explícito de errores con stdout y stderr capturados.
- Tipos estrictos: sin `any`, sin `as` injustificado y sin `@ts-ignore`.
- Nombres con intención, constantes con nombre y funciones pequeñas.
- Sin dependencias nuevas salvo que la tarea lo pida y el orquestador lo apruebe.
