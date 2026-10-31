# alvaress

**Agente independiente para [OpenCode](https://opencode.ai), pensado para
trabajar con modelos baratos sin perder control.** Decide en local con
[Laya](https://github.com/convaiinnovations/laya) (ONNX, sin API key), ejecuta
con subagentes de código cuyo ciclo está inspirado en [Aider](https://aider.chat)
y valida cada cambio con [Vite-Plus](https://vite.plus) antes de cerrar una
tarea.

alvaress es un instalador de agente, no un plugin de otro asistente. Instala en
OpenCode un agente llamado **`alvaress`**, diez subagentes, quince skills y la
configuración para trabajar con [OpenSpec](https://github.com/Fission-AI/OpenSpec),
[Graphify](https://github.com/Graphify-Labs/graphify) y una bóveda de notas en
Markdown. No se integra con Claude Code, Codex ni otros asistentes y no escribe
en sus carpetas (`~/.claude`, `~/.codex`…). Cuando quieres la ruta barata,
abres OpenCode y eliges el agente `alvaress`; el resto de tus herramientas sigue
intacto.

## Contenido

- [Para qué sirve](#para-qué-sirve)
- [Conceptos del agente](#conceptos-del-agente)
- [Qué pasa con cada prompt](#qué-pasa-con-cada-prompt)
- [Subagentes: inspirados en Aider](#subagentes-inspirados-en-aider)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Comandos](#comandos)
- [Configuración](#configuración)
- [Herramientas que instala](#herramientas-que-instala)
- [Bóveda Markdown](#bóveda-markdown)
- [Skills y permisos](#skills-y-permisos)
- [Aprendizaje continuo](#aprendizaje-continuo)
- [Manifiesto `openspec.yaml`](#manifiesto-openspecyaml)
- [Confiabilidad y seguridad](#confiabilidad-y-seguridad)
- [Benchmark](#benchmark)
- [Desarrollo](#desarrollo)
- [Estructura del paquete](#estructura-del-paquete)
- [Licencia](#licencia)

## Para qué sirve

Un modelo barato programa bien si alguien le cierra el alcance, le da el contexto
justo y comprueba su trabajo. alvaress hace ese papel: antes de tocar código lee
la fuente del trabajo (una nota o una spec), decide con criterios explícitos,
delega en subagentes con permisos estrechos, valida con comandos reales y solo
entonces cierra y hace commit.

Te sirve si:

- quieres usar modelos económicos (GPT-5 mini, Gemini Flash, DeepSeek, Qwen
  Coder…) sin que improvisen;
- quieres que el agente siga una nota o una spec y no una corazonada;
- prefieres decisiones locales y privadas, sin mandar tu contexto a un servicio
  remoto;
- quieres validación real (`vp check`, `vp test`) antes de dar algo por hecho;
- quieres historial de ejecución, reportes y notas legibles en Markdown.

## Conceptos del agente

Estas son las reglas que sigue el agente `alvaress` en cada tarea. Están
escritas en su prompt, en las skills y en el propio CLI, así que no dependen de
que el modelo las recuerde.

| Concepto | Qué significa en la práctica |
| --- | --- |
| **ODD y SDD** | Dos rutas según el tamaño del trabajo (ver abajo). Laya elige; tú puedes forzarla con `--mode`. |
| **La fuente manda** | El trabajo sale de una nota ODD o de `openspec.yaml`, nunca de la memoria del modelo. Sin fuente no hay alcance cerrado. |
| **Alcance cerrado** | Antes de editar se fija la lista de archivos, los criterios de aceptación y los comandos de validación. Un diff que se sale del alcance se audita y puede detener el run. |
| **Decisión local** | Laya (ONNX int8, en tu máquina) elige ruta, complejidad, especialistas, riesgo y tipo de fallo. Si no está disponible, decide una heurística determinista. |
| **Proporcionalidad** | Un cambio trivial no paga especialistas; uno pequeño solo paga el de su dominio; los grandes y las tareas SDD suman arquitecto, tester y reviewer. |
| **Contexto mínimo** | Graphify para localizar código, rangos de líneas en vez de archivos enteros, `git diff --stat` o el diff completo según el rol, briefs recortados y como mucho tres títulos de aprendizajes. |
| **Validación determinista** | El orquestador ejecuta los comandos de validación; el subagente no se autoaprueba. El resultado real es el diff del workspace, no lo que el modelo dice que hizo. |
| **Reparación acotada** | Si la validación falla, el fixer recibe el error exacto y el diff. Máximo dos intentos; un fallo `nuclear` detiene el run. |
| **HALT antes que insistir** | Ante un fallo de alcance, de herramienta o repetido, el run se detiene en `Halted`, deja el log y espera una decisión humana. |
| **Cero comentarios nuevos** | Ni explicaciones, ni `TODO`, ni JSDoc de relleno. La auditoría del diff los detecta. |
| **Commit solo del run** | Al cerrar se hace commit únicamente de los archivos que tocó el run. Nada de `push`, `reset` ni reescritura de historial. |
| **Aprender sin ruido** | Se guardan hasta tres aprendizajes por run, en un store global o del proyecto. Nunca se inyecta el store completo al prompt. |

### ODD y SDD

**SDD (Spec-Driven Development)** escribe primero una especificación con tareas,
dependencias, archivos y validación; el agente ejecuta contra ese contrato.
**ODD (Organic Driven Development)** es el flujo ligero: se autoriza el cambio,
se explora solo lo necesario y se cierra con la evidencia mínima, sin artefactos
pesados.

| | ODD | SDD |
| --- | --- | --- |
| **Cuándo** | Cambios pequeños o medianos, un solo contexto, alcance claro. | Cambios grandes, multi-contexto, contratos, migraciones o varias tareas. |
| **Fuente** | Una nota de tarea o de proyecto: objetivo, checklist de aceptación, archivos y riesgos. Vive en la bóveda Markdown o, con `--task`, en `.harness/tasks/<TASK>.md`. | `openspec.yaml` y `.harness/tasks/<TASK>.md`. |
| **Especialistas** | Ninguno en cambios triviales; solo los de su dominio salvo en cambios grandes. | Arquitecto, tester y reviewer, más los de su dominio. |
| **Cierre** | Marca el checklist, añade una entrada a la nota y hace commit de los archivos del run. | Marca la tarea `Done`, actualiza la spec y hace commit de los archivos del run. |

## Qué pasa con cada prompt

![Flujo de trabajo del agente alvaress](assets/alvaress-flow.svg)

Cuando escribes un prompt al agente `alvaress` en OpenCode, ocurre esto:

1. **Entender (agente).** El agente comprueba que exista la infraestructura
   (`openspec.yaml`, `.harness/`; si falta ejecuta `alvaress init`), busca
   aprendizajes relevantes con `alvaress learn search` (solo títulos), lee la
   nota del proyecto con `alvaress vault status` si hay bóveda, y localiza el
   código con `graphify query/explain/path`. Si falta información crítica hace
   **una** pregunta concreta y espera.
2. **Lanzar el run.** Con el alcance claro ejecuta `alvaress run "<petición>"`
   (o `--task TASK-01` en SDD). A partir de aquí manda el CLI, que toma el lock
   de `.harness/lock` y recorre una máquina de estados:

| Estado | Qué pasa | Quién actúa |
| --- | --- | --- |
| `Exploring` | Laya decide la **ruta** (ODD/SDD) y la **complejidad**. Se lee la fuente, se cargan hasta tres títulos de aprendizajes y se cierra el alcance (archivos, criterios, validación). Después Laya decide **qué especialistas** consultar; cada uno devuelve un brief corto que alimenta al siguiente. | CLI, Laya, `alvaress-explorer` y especialistas |
| `Working` | El implementer recibe el plan, los briefs y el contenido de los archivos pequeños del alcance. Trivial o pequeño → `alvaress-implementer-lite`; mediano o grande → `alvaress-implementer`. Al terminar se compara el workspace antes/después y se audita el diff (alcance, comentarios y `TODO` nuevos, salida de depuración, `any` nuevos, tests eliminados y borrados masivos). | Subagente implementer |
| `Checking` | El CLI ejecuta la validación (`vp check`, `vp test` o los comandos de la tarea) y guarda la salida en `.laya/last_run.log`. Si aplica, el reviewer revisa el diff completo. | CLI y `alvaress-reviewer` |
| `Fixing` | Laya clasifica el fallo. Si es trivial, el fixer recibe el error exacto, el diff y la revisión; se valida de nuevo. Máximo dos intentos. | `alvaress-fixer` |
| `Ready` | Marca la tarea o el checklist, escribe el reporte en `.harness/runs/`, añade la entrada de cierre a la nota de la bóveda, guarda hasta tres aprendizajes y hace commit solo de los archivos del run. | CLI |
| `Halted` | Fallo nuclear, el mismo error dos veces, diff fuera de alcance, herramienta ausente, timeout o reparación vacía. No hay commit ni cierre: libera el lock y deja `.laya/HALT.json`. | CLI |

3. **Responder.** El agente lee el resultado: si terminó en `Ready`, te resume
   qué cambió, cómo se validó y qué riesgos quedan; si terminó en `Halted`, lee
   `.laya/last_run.log` y `.laya/HALT.json` y decide contigo si amplía el
   alcance, pregunta o cambia de estrategia. No reintenta a ciegas.

Con `alvaress run --dry-run` ves los pasos 1-2 hasta el plan sin invocar
subagentes, sin commit y sin escribir en la bóveda. `alvaress -i` muestra el log
completo del último run, incluido el consumo de tokens por fase.

## Subagentes: inspirados en Aider

El ciclo de los subagentes de código toma como referencia el de
[Aider](https://aider.chat): **alcance cerrado** (solo los archivos asignados),
**edición sobre el diff** (el resultado se mide comparando el workspace, no
interpretando la respuesta), **una sesión por run** (el implementer y el fixer
comparten sesión para reutilizar lo que ya leyeron) y **reparación con el error
exacto** (el fixer recibe la salida literal del comando que falló). alvaress
implementa ese ciclo como subagentes de OpenCode, con permisos por rol y un
orquestador que valida desde fuera.

Aider no es una dependencia y `alvaress install` no lo instala: fue la
inspiración y la línea base del benchmark (ver [Benchmark](#benchmark)).

| Subagente | Estado | Para qué sirve | Límite | Pasos |
| --- | --- | --- | --- | ---: |
| `alvaress-explorer` | `Exploring` | Solo lectura: localiza código, lee la nota y propone un alcance cerrado. | No edita, no decide, no escribe en la bóveda. | 12 |
| `alvaress-researcher` | `Exploring` | Resuelve dudas de dependencias, versiones o APIs con evidencia y fuentes. | No instala, no edita, no sale del tema. | 16 |
| `alvaress-architect` | `Exploring` | Propone límites, contratos, datos y orden de implementación. | No escribe código ni amplía el alcance. | 20 |
| `alvaress-designer` | `Exploring` | Define layout, componentes, estados y accesibilidad. | No edita archivos ni inventa un design system. | 16 |
| `alvaress-implementer` | `Working` | Implementa una tarea mediana o grande dentro del alcance. | Sin git, sin cierre, sin dependencias nuevas. | 30 |
| `alvaress-implementer-lite` | `Working` | Cambios triviales o pequeños: edita sin explorar y sin validar. | Sin shell, sin git, sin dependencias nuevas. | 10 |
| `alvaress-tester` | `Checking` | Diseña casos y diagnostica fallos con el runner existente. | No edita código ni aserciones. | 16 |
| `alvaress-verifier` | `Checking` | Ejecuta Vite-Plus y devuelve el error exacto. | No edita archivos ni toca git. | 12 |
| `alvaress-reviewer` | `Checking` | Revisa el diff contra la spec y los estándares del repo. | No reescribe; solo devuelve hallazgos. | 16 |
| `alvaress-fixer` | `Fixing` | Repara un fallo trivial, máximo dos intentos. | No toca tests ni git; devuelve `nuclear` si no es trivial. | 20 |

El orquestador no delega la decisión, la validación, el commit, el cierre de la
nota ni los aprendizajes. Los subagentes solo leen la bóveda. El contrato del
worker, el formato de los mensajes y los permisos completos están en
[docs/subagents.md](docs/subagents.md).

## Requisitos

- **Node.js 20 o superior.** Es el único requisito obligatorio.
- **OpenCode.** Lo instalas tú; alvaress añade el agente, los subagentes y las
  skills.
- **pnpm.** Recomendado. Si falta, alvaress usa npm y te avisa. Node trae
  Corepack: `corepack enable pnpm`.
- **Git.** Recomendado para el control de alcance y los commits del run.

El resto lo resuelve `alvaress install`: Laya, ONNX Runtime, tokenizers,
Vite-Plus, Graphify (con `uv`) y las dependencias de validación.

## Instalación

```bash
corepack enable pnpm
pnpm add -g alvaress
```

O sin instalación global:

```bash
pnpm dlx alvaress --help
npx alvaress --help
```

Después, dentro de tu proyecto:

```bash
alvaress install        # interactivo
alvaress install --yes  # desatendido, con la configuración existente o los defaults
```

### Checklist de componentes

```text
🧠 Laya          decisión local · ONNX Runtime, tokenizers y modelo int8 (488 MB)
⚡ Vite-Plus     vp check y vp test
📊 Graphify      grafo AST del repositorio · instala uv si falta · hooks de git
🧩 Skills        15 skills del proyecto y sus enlaces en OpenCode
🧭 Orquestador   agente alvaress en OpenCode
🤖 Subagentes    explorer, researcher, architect, designer, implementer, implementer-lite,
                 tester, verifier, reviewer, fixer
```

Todos son obligatorios: si desmarcas uno, el instalador lo restaura y avisa.
`typescript` y `@types/node` se instalan si faltan, sin ocupar casilla.

### Qué hace el instalador

1. Pregunta lo que necesita decisión humana antes del trabajo pesado: ruta de la
   bóveda, ruta del modelo de Laya y modelos de orquestador y subagentes.
2. Guarda `~/.alvaressconfig.json` para no perder tus elecciones si algo falla.
3. Instala en paralelo Graphify (`uv tool install`), las dependencias Node (una
   sola llamada a pnpm) y el bundle int8 de Laya (descarga en paralelo,
   verificada con SHA-256).
4. Activa los hooks de Graphify si el proyecto es un repositorio git: el grafo
   se reconstruye tras `commit`, `checkout`, `merge` y `rewrite`. Con husky, los
   hooks van en `.husky/` junto a los tuyos.
5. Crea `.alvaressrc.json` si aceptas overrides locales y `openspec.yaml` si el
   proyecto es un repositorio y no lo tiene.
6. Crea la bóveda y conecta `<bóveda>/Harness/` con `.harness/tasks` y
   `openspec.yaml`.
7. Escribe las skills en `.harness/skills/` y las enlaza en
   `~/.config/opencode/skills/`.
8. Instala el agente `alvaress` y sus diez subagentes en OpenCode con los
   modelos elegidos en su frontmatter.

Al final resume proyecto, rutas, configuración y modelos efectivos. Comprueba
que todo quedó bien con `alvaress doctor`.

## Inicio rápido

```bash
# 1. Instala el agente, las skills, los componentes y la configuración.
alvaress install

# 2. Abre OpenCode y elige el agente alvaress (Tab hasta verlo).
opencode
#    o directamente:
opencode run --agent alvaress "Implementa la tarea TASK-01 siguiendo la spec"
```

Dentro de OpenCode basta con pedir el trabajo:

```text
Implementa la próxima tarea pendiente de openspec.yaml.
Agrega un helper de fechas en src/fechas.ts con sus tests.
```

También puedes usar el CLI sin pasar por el agente:

```bash
alvaress run "agrega un helper de fechas" --files src/fechas.ts
```

## Comandos

| Comando | Qué hace | Opciones principales |
| --- | --- | --- |
| `alvaress run "<petición>"` | Ejecuta el flujo completo: explora, decide, trabaja, valida y cierra. | `--task`, `--files`, `--mode odd\|sdd\|auto`, `--dry-run`, `--no-commit`, `--self-check`, `--no-learn`, `--force` |
| `alvaress -i` | Muestra el log del último run (`.laya/last_run.log`). | — |
| `alvaress install` | Instala componentes, agente, subagentes, skills y configuración, y crea la bóveda. | `--yes`, `-y` |
| `alvaress init` | Repara o reinstala en un proyecto que ya tenía el arnés: `.harness/`, `openspec.yaml`, skills y agente local, sin descargar componentes. | `--no-link` |
| `alvaress apply [TASK...]` | Ejecuta tareas SDD pendientes (o las indicadas) en grupos aislados, con backup del manifiesto y reporte. | `--dry-run`, `--force`, `--update-graph`, `--no-lock` |
| `alvaress verify <TASK_ID>` | Valida una tarea y, si falla, pide reparación al fixer. | — |
| `alvaress archive <SPEC_ID>` | Archiva una spec con todas sus tareas en `Done`, con backup previo. | — |
| `alvaress vault [status\|sync\|note]` | Consulta o actualiza la bóveda y la nota del proyecto. | `--summary`, `--task`, `--from-run`, `--validation`, `--risk`, `--next` |
| `alvaress learn <subcomando>` | Guarda, busca y reutiliza aprendizajes globales y del proyecto. | `add`, `list`, `search`, `show`, `use`, `promote`, `prune`, `playbook` |
| `alvaress agent [install\|show]` | Instala el agente y sus subagentes, o imprime el prompt del orquestador. | `--no-global`, `--no-project` |
| `alvaress models [show\|set\|configure]` | Muestra o cambia los modelos de orquestador y subagentes. | `--all`, `--orchestrator`, `--subagents`, `--no-install` |
| `alvaress skills` | Reescribe las skills del proyecto y sus enlaces en OpenCode. | `--no-link` |
| `alvaress doctor` | Diagnóstico: Node, configuración, modelos, frontmatter, gestor, git, Laya, Vite-Plus, Graphify, bóveda, manifiesto, grafo y locks. | `--json` |
| `alvaress report [latest\|list\|show <id>]` | Reportes de `.harness/runs/`, con consumo de tokens. | — |
| `alvaress restore [--list\|latest\|<id>]` | Lista o restaura `openspec.yaml` desde `.harness/backups/`. | `--list` |
| `alvaress config [show\|paths]` | Configuración resuelta o rutas de configuración. | — |
| `alvaress --help` / `--version` | Ayuda y versión. | — |

Códigos de salida: `0` éxito, `1` error o tarea fallida, `130` cancelado.

### `run` en detalle

| Opción | Efecto |
| --- | --- |
| `--task TASK_ID` | Ejecuta una tarea concreta de `openspec.yaml` (SDD). |
| `--files a.ts,b.ts` | Cierra el alcance a esos archivos. |
| `--mode odd\|sdd\|auto` | Fuerza la ruta; por defecto decide Laya. |
| `--dry-run` | Explora y muestra el plan sin invocar subagentes. |
| `--no-commit` | No hace commit al terminar en `Ready`. |
| `--self-check` | Permite al implementer un autochequeo rápido (tipos/lint) antes de terminar. |
| `--no-learn` | No guarda aprendizajes ni registra usos. |
| `--force` | Ignora un lock huérfano de otra ejecución. |

### Subcomandos

| Subcomando | Qué hace |
| --- | --- |
| `vault status` | Muestra la bóveda, la nota del proyecto y los enlaces. |
| `vault sync` | Crea o repara `Harness/`, la nota y los enlaces. |
| `vault note` | Añade una entrada de cierre a `## Registro`; exige `--summary` o `--from-run`. |
| `learn add <tipo> "<título>"` | Guarda un aprendizaje (`step`, `solution`, `pitfall`, `preference`, `improvement`); Laya decide si es global o del proyecto. |
| `learn list` / `learn search "<texto>"` | Lista o busca; filtra con `--scope`, `--kind`, `--tag` y `--limit`. |
| `learn show <id>` / `learn use <id>` | Muestra un aprendizaje o marca que se reutilizó. |
| `learn promote <id>` | Copia un aprendizaje del proyecto al store global. |
| `learn prune` | Limpia por antigüedad o conserva los últimos N; `--dry-run` simula. |
| `learn playbook` | Regenera `PLAYBOOK.md`. |
| `agent install` / `agent show` | Instala el agente y los subagentes, o imprime el prompt del orquestador. |
| `models show` | Modelos efectivos de orquestador y subagentes. |
| `models set --all <provider/model>` | Cambia ambos roles y reinstala el frontmatter. |
| `models set --orchestrator <m> --subagents <m>` | Cambia roles concretos; `--no-install` solo guarda. |
| `models configure` | Flujo interactivo para elegir modelos. |
| `config show` / `config paths` | Configuración resuelta o rutas global y local. |

**Qué modelo usar.** El orquestador conversa contigo, cierra el alcance y
resuelve los HALT: gasta pocos tokens, así que conviene un modelo con buen
razonamiento. Los subagentes hacen el volumen de llamadas con alcance cerrado y
validación externa: ahí va el modelo barato con tool-calling fiable (GPT-5 mini,
Gemini Flash, DeepSeek, Qwen Coder…), sin razonamiento extendido. `alvaress
doctor` sugiere separarlos si comparten modelo.

### Ejemplos

```bash
alvaress run "agrega un helper de fechas" --files src/fechas.ts
alvaress run --task TASK-01
alvaress run "migra el repositorio de facturas" --dry-run
alvaress apply --dry-run
alvaress apply SPEC-001/TASK-01 SPEC-001/TASK-02
alvaress -i
alvaress report latest
alvaress models set --orchestrator openai/gpt-5 --subagents openai/gpt-5-mini
```

## Configuración

Precedencia **local sobre global**:

- **Global:** `~/.alvaressconfig.json`
- **Proyecto:** `.alvaressrc.json`

La ruta de la bóveda y los comandos admiten `${VARIABLE}`. No hay credenciales
en estos archivos: las maneja OpenCode.

```json
{
  "vaultPath": "/home/tu-usuario/alvaress-vault",
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
  "worker": { "timeoutMs": 600000, "selfCheck": false },
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

| Clave | Tipo | Default | Qué significa |
| --- | --- | --- | --- |
| `vaultPath` | `string` | vacío; el instalador propone `~/alvaress-vault` | Ruta de la bóveda Markdown. Vacío = sin bóveda (ODD necesitará `--task` o `--mode sdd`). |
| `packageManager` | `"pnpm" \| "npm"` | `"pnpm"` | Gestor para validación y scripts. |
| `scope` | `"strict" \| "warn" \| "off"` | `"warn"` | Control del diff en `apply`: `strict` falla fuera del alcance, `warn` avisa, `off` lo desactiva. |
| `graphify.autoUpdate` | `boolean` | `false` | Actualiza el grafo al terminar `apply` (o usa `--update-graph`). |
| `laya.enabled` | `boolean` | `true` | Con `false` decide la heurística local. |
| `laya.modelDir` | `string` | vacío = caché global | Directorio del bundle (`laya.onnx`, `laya.onnx.data`, `laya_config.json`, `tokenizer/`). |
| `laya.device` | `"cpu" \| "cuda"` | `"cpu"` | Dispositivo de ONNX Runtime. |
| `laya.threads` | `integer >= 1` | el del runtime | Hilos intra-op en CPU. |
| `laya.timeoutMs` | `integer >= 1000` | `30000` | Tiempo máximo por decisión; al agotarse cae a heurísticas. |
| `laya.fallbackToHeuristic` | `boolean` | `true` | Si Laya falla, continúa con heurísticas. |
| `vitePlus.checkCommand` / `testCommand` | `string` | `"vp check"` / `"vp test"` | Comandos de lint/tipos y de pruebas. |
| `vitePlus.fallbackToPackageManager` | `boolean` | `true` | Se acepta por compatibilidad. |
| `worker.timeoutMs` | `integer >= 1000` | `600000` | Timeout de cada invocación a un subagente. |
| `worker.selfCheck` | `boolean` | `false` | Equivale a `--self-check`. |
| `models.orchestrator.modelName` | `string` | vacío = el de OpenCode | Modelo `provider/model` del orquestador. |
| `models.subagents.modelName` | `string` | vacío = el del orquestador | Modelo `provider/model` de los diez subagentes. |
| `validation.maxAttempts` | `integer >= 1` | `3` | Intentos de reparación en `apply` y `verify` (`run` usa dos). |
| `validation.commands` | `string[]` | `vp check`, `vp test` | Validación global; una tarea puede sustituirla. |
| `validation.requireCommands` | `boolean` | `true` | Si no hay comandos de validación: fallo (`true`) o aviso (`false`). |

Si no defines `laya.modelDir`, se usa la caché global
`~/.cache/alvaress/laya-onnx-int8/<revision>`. Sin modelo, el run sigue con
heurísticas y `doctor` lo indica.

## Herramientas que instala

| Herramienta | Qué aporta | Cómo se obtiene |
| --- | --- | --- |
| **OpenCode** | Runtime del agente y los subagentes. | Lo instalas tú. |
| **Laya int8** | Decisión local: ruta, complejidad, especialistas, riesgo, triaje y scope de aprendizajes. | Bundle de ~488 MB del release `laya-int8-v1`, verificado con SHA-256. |
| **ONNX Runtime + tokenizers** | Ejecutan Laya en CPU, sin servicio remoto ni API key. | `alvaress install` (`onnxruntime-node`, `@huggingface/tokenizers`). |
| **Vite-Plus** | `vp check` y `vp test`: lint, tipos y pruebas. | `alvaress install` (`vite-plus`). |
| **TypeScript + @types/node** | `tsc` como respaldo. | `alvaress install`, sin fila propia. |
| **Graphify** | Grafo AST para localizar código sin leerlo entero. | `uv tool install graphifyy` (lo hace `alvaress install`). |
| **uv** | Entorno Python aislado para Graphify. | Instalador oficial, `brew` o `pip --user`. |
| **OpenSpec** | Formato del manifiesto y las tareas SDD. | No se instala: alvaress usa el formato y crea `openspec.yaml`. |

El detalle del artefacto int8 (hashes y mediciones) está en
[docs/laya-int8.md](docs/laya-int8.md).

## Bóveda Markdown

La bóveda es una carpeta de notas en Markdown que usan los agentes: en ODD la
nota de la tarea o del proyecto es la fuente del alcance, y al cerrar cada run se
añade una entrada de registro. Se configura con `vaultPath` (global y, si
quieres una por repo, en `.alvaressrc.json`).

```text
<bóveda>/Harness/
├── Tasks -> <proyecto>/.harness/tasks
├── openspec.yaml -> <proyecto>/openspec.yaml
└── <proyecto>.md
```

- En **ODD**, la fuente es `Harness/Tasks/<TASK>.md` o la nota del proyecto.
- En **SDD**, la bóveda es un espejo: la fuente es `openspec.yaml` y
  `.harness/tasks/`, enlazados desde `Harness/`.
- Solo el orquestador escribe en la bóveda, con `alvaress vault note`. Los
  subagentes solo leen.

```bash
alvaress vault status
alvaress vault sync
alvaress vault note --task TASK-01 --summary "Qué cambió" \
  --validation "pnpm test: 240/240" --risk "Riesgos" --next "Siguiente paso"
alvaress vault note --from-run latest --task TASK-01
```

**Verla con una app de notas.** Las notas usan enlaces `[[...]]`, así que puedes
abrir la carpeta con [Obsidian](https://obsidian.md) (**Open folder as vault**)
u otra app compatible para tener grafo, backlinks y búsqueda. alvaress no
instala ni configura ninguna app: eso queda de tu lado.

## Skills y permisos

El instalador escribe quince skills en `.harness/skills/<nombre>/SKILL.md` y las
enlaza solo en `~/.config/opencode/skills/<nombre>`. Cada subagente carga solo
las de su perfil.

| Skill | Qué hace |
| --- | --- |
| `read-spec-first` | Lee la nota ODD o la spec SDD antes de programar y resume los criterios. |
| `consult-graphify-ast` | Prioriza Graphify sobre lecturas masivas. |
| `self-healing-verify` | Valida, lee el error exacto y limita los reintentos. |
| `clean-code` | Nombres con intención, constantes, funciones cortas, DRY y cero comentarios de relleno. |
| `vault-notes` | Uso de la bóveda por fase; solo lectura para los subagentes. |
| `continuous-learning` | Consulta y guarda aprendizajes sin inflar el contexto. |
| `bounded-scope` | Mantiene al subagente en los archivos asignados y le dice cuándo parar. |
| `git-diff-context` | Usa el diff del árbol de trabajo como contexto, sin tocar el historial. |
| `vite-plus-verify` | Ejecuta `vp check`/`vp test` y devuelve el error sin ruido. |
| `failure-triage` | Clasifica un fallo como trivial o nuclear antes de repararlo. |
| `architecture-decisions` | Límites, contratos y patrones proporcionales. |
| `ui-design` | Layout, tokens, estados y accesibilidad. |
| `testing-strategy` | Nivel de prueba y casos given/when/then. |
| `code-review` | Hallazgos accionables contra la spec y los estándares. |
| `technical-research` | Versiones, APIs y migraciones con fuentes. |

### Permisos

El agente `alvaress` es `primary`: se elige con **Tab** o con
`opencode run --agent alvaress`, y no cambia tu agente por defecto. Se instala
en `~/.config/opencode/agents/` y en `.opencode/agents/` del proyecto.

Su shell tiene una allowlist: `alvaress`, `graphify`, `git status/diff/log/show`,
scripts de validación de pnpm/npm (`test`, `validate`, `build`, `lint`,
`typecheck`), `vp`, `oxlint`, `tsc`, `eslint`, `vitest`, `rg`, `grep`, `sed -n`,
`find` y `ls`. Todo lo demás pide confirmación. Están denegados:

- `git push`, `git reset`, `git clean`, `git checkout`, `git restore`, `rm`,
  `sudo`, `curl` y `wget`;
- `pnpm`/`npm publish`, `pnpm dlx`, `npm exec` y `npx --yes`;
- `find -exec`, `find -delete`, `sed -i` y `rg --pre`;
- scripts de deploy, release, publish, migración, base de datos y seed;
- leer `.env`, `.pem`, `.key`, `.p12`, `id_rsa` e `id_ed25519`;
- en los subagentes: lanzar otros subagentes, consultar la web (salvo el
  researcher) y escribir en la bóveda.

Solo el orquestador ejecuta `alvaress apply`, `verify`, `vault note`, `archive`
y `learn add`.

## Aprendizaje continuo

El agente aprende en local y sin inflar el contexto. Hay dos stores:

| Store | Ruta | Qué guarda |
| --- | --- | --- |
| **Global** | `~/.alvaress/memory/learnings.json` y `PLAYBOOK.md` | Herramientas, errores y prácticas útiles en cualquier repo. |
| **Proyecto** | `.harness/memory/learnings.json` y `PLAYBOOK.md` | Comandos, rutas, convenciones y trampas de este repo. Gana al global si coincide el `id`. |

Laya decide el store al guardar (o la heurística, si no está disponible); puedes
forzarlo con `--global` o `--scope project`, y promover con `learn promote`.

| Fase | Qué se consulta | Límite |
| --- | --- | --- |
| Entender | Títulos que coinciden con la petición, la tarea y los archivos. | 3 títulos, sin cuerpos |
| Ejecutar | Nada por defecto. | 2 |
| Validar / Fixing | `pitfall` o `solution` que coinciden con el comando y el error. | 2 |
| Cerrar | No se lee: se guardan el pitfall reparado y hasta 3 aprendizajes. | 3 |

Un aprendizaje solo se usa si es de la misma herramienta y la misma firma de
error o forma de tarea, si no contradice la spec ni el código, y si cambia la
decisión. Cuando se aplica de verdad, el orquestador ejecuta `learn use <id>`
para que `learn prune` retire lo que nunca sirvió. Los `improvement` se
proponen; el agente no edita su prompt ni sus skills sin aprobación.
`ALVARESS_MEMORY_DIR` mueve el store global.

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
        description: "Crear el repositorio de base de datos para facturas"
        status: "Pending"
        priority: 10
        estimate: "30m"
        depends_on: ["TASK-00"]
        validation:
          - "pnpm exec tsc --noEmit"
        rollback: "Revertir el repositorio y la migración"
        files:
          - "src/billing/repositories/invoice.repository.ts"
```

- `files` cierra el alcance del worker; `validation` sustituye a la global.
- `depends_on` ordena la ejecución; `priority` ordena tareas independientes.
- Estados de spec: `Proposed`, `Verified`, `Archived`, `Failed`. De tarea:
  `Pending`, `InProgress`, `Done`, `Failed`.
- Los ids admiten letras, números, punto, guion y guion bajo; los de tarea son
  únicos en todo el manifiesto.

## Confiabilidad y seguridad

- **Lock** en `.harness/lock`: impide dos ejecuciones simultáneas; un lock
  huérfano se detecta por PID o antigüedad y `--force` lo reemplaza.
- **Escritura atómica** de `openspec.yaml`, reportes, caché y notas.
- **Backups** del manifiesto en `.harness/backups/` antes de `apply` y `archive`.
- **Reportes** en `.harness/runs/`, con consumo de tokens por fase.
- **Auditoría del diff**: alcance, comentarios y `TODO` nuevos, depuración,
  `any`, tests eliminados y borrados masivos.
- **Timeouts** por subagente y por decisión de Laya.
- **Redacción de secretos** antes de enviar estado a Laya y al escribir notas.
- **CI** en Node 20/22/24 y release con `npm publish --provenance`.

## Benchmark

### Frente a Aider

La comparación se hizo a nivel de worker con el mismo `WorkPlan`, el mismo
modelo (`gemma4:31b-cloud` servido por un shim compatible con OpenAI) y
fixtures `small` y `medium` aislados, con `node --test` como validación.

| Escenario | Worker | Llamadas | Entrada | Salida | Tiempo |
| --- | --- | ---: | ---: | ---: | ---: |
| `small` | Aider | 1 | 1 292 | 93 | 5,0–5,9 s |
| `small` | `alvaress-implementer-lite` | 2 | 5 467 | 97–107 | 2,3 s |
| `medium` | Aider | 3 | 4 333–4 391 | 851–902 | 9,1–10,1 s |
| `medium` | `alvaress-implementer` | 2 | 7 839–7 858 | 858–909 | 3,8–4,0 s |

- **Paridad funcional:** ambos completaron los fixtures y pasaron la validación.
- **Velocidad:** los subagentes son 2,3-2,5 veces más rápidos.
- **Tokens:** Aider gasta menos entrada porque devuelve un diff en una llamada;
  el subagente necesita una llamada de edición y otra de cierre (~4,2× en
  `small`, ~1,8× en `medium`).
- **Optimización:** incluir los archivos pequeños en el mensaje, delegar la
  validación al orquestador y no obligar a cargar skills bajó la entrada un
  42-47 % y las llamadas de 3 a 2.

Son números de una máquina y un modelo concretos, medidos antes del diff en dos
niveles, las sesiones por especialista y el recorte de briefs.

### Qué se aprendió

- **El ahorro grande viene del modelo, no del arnés.** Un modelo barato resuelve
  las tareas acotadas con el mismo resultado que uno caro; alvaress existe para
  que lo haga con alcance cerrado, auditoría, validación determinista y commit
  controlado.
- **Los especialistas no se pagaron** en tareas acotadas (3,6-5,4× costo, 4-6×
  tiempo, mismo resultado): en ODD solo entran en cambios grandes.
- **`--self-check` no ahorró** porque no hubo reparaciones; sigue apagado.
- **Límite:** los fixtures son fáciles y no miden el ciclo de reparación.

### Correr el benchmark

`bench/` trae fixtures reproducibles (`small-slugify`, `medium-cart`,
`fix-overlap`) con proyecto, tarea y solución de referencia. El runner usa el
`HarnessCore` real con decisiones fijas y lee los tokens reales de OpenCode.
**Gasta tokens.**

```bash
pnpm bench                                   # todos los fixtures, una vez
pnpm bench --fixture medium-cart --repeat 3  # promedia tres corridas
pnpm bench --model openai/gpt-5-mini         # cambia el modelo de subagentes
pnpm bench --roles architect,reviewer        # mide el costo de especialistas
pnpm bench --self-check                      # compara con autochequeo
```

Requiere `opencode` en el `PATH` y los subagentes instalados. Guarda el detalle
en `bench/results/` (ignorado por git).

## Desarrollo

```bash
corepack enable pnpm
pnpm install
pnpm run validate   # lint + typecheck de src y test
pnpm test           # build + pruebas con node:test y tsx
pnpm run build      # limpia dist/ y compila
```

## Estructura del paquete

```text
src/
├── cli.ts
├── agent/           prompt del orquestador, subagentes e instalación
├── commands/        run, install, init, vault, learn, models, agent, doctor, report…
├── core/            contratos, máquina de estados y HALT
├── config/          loader con precedencia global/local
├── decision/        adaptador de Laya, motor vendorizado y heurísticas
├── graphify/        estado y actualización del grafo
├── memory/          aprendizajes globales y del proyecto
├── openspec/        manifiesto y tipos
├── orchestrator/    worker de subagentes, auditoría, validación, apply, reportes
├── skills/          definición e instalación de skills
├── vault/           bóveda Markdown y notas
├── ui/              colores, línea de estado y reporte final
└── utils/           args, FS, lock, procesos, gestor de paquetes, uv, redacción
test/                pruebas con node:test
bench/               benchmark reproducible de tokens
assets/              diagramas del README
docs/                spec del arnés, subagentes y artefacto de Laya
```

## Licencia

MIT. Consulta [LICENSE](LICENSE).
