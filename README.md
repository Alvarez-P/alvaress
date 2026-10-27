# alvaress

**Arnés híbrido SDD + ODD para [OpenCode](https://opencode.ai).** Decide en local
con [Laya](https://github.com/convaiinnovations/laya) (ONNX, sin API key),
ejecuta con [Aider](https://aider.chat) si lo habilitas o con subagentes
especializados si no, y valida cada cambio con [Vite-Plus](https://vite.plus)
antes de cerrar una tarea.

`alvaress` no reemplaza a tu agente: le da un entorno de trabajo ordenado.
Instala un agente de OpenCode llamado **`alvaress`**, sus skills y la
configuración necesaria para trabajar con [OpenSpec](https://github.com/Fission-AI/OpenSpec),
[Obsidian](https://obsidian.md) y [Graphify](https://github.com/Graphify-Labs/graphify).

## Contenido

- [Qué es alvaress](#qué-es-alvaress)
- [SDD y ODD](#sdd-y-odd)
- [Flujo del agente](#flujo-del-agente)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Comandos](#comandos)
- [Configuración](#configuración)
- [Herramientas que instala y por qué](#herramientas-que-instala-y-por-qué)
- [Agente, subagentes y skills](#agente-subagentes-y-skills)
- [Obsidian](#obsidian)
- [Aprendizaje continuo](#aprendizaje-continuo)
- [Manifiesto `openspec.yaml`](#manifiesto-openspecyaml)
- [Confiabilidad y seguridad](#confiabilidad-y-seguridad)
- [Desarrollo](#desarrollo)
- [Estructura del paquete](#estructura-del-paquete)
- [Licencia](#licencia)

## Qué es alvaress

Es un arnés para que el agente no improvise. Antes de tocar código lee la fuente
del trabajo (una nota ODD o una spec SDD), cierra el alcance, decide con
criterios explícitos, ejecuta cambios acotados y comprueba que todo sigue
funcionando.

Te puede servir si:

- quieres que el agente siga una nota o una spec y no una corazonada;
- prefieres decisiones locales y privadas, sin mandar tu contexto a un servicio
  remoto;
- quieres validación real (`vp check`, `vp test`) antes de cerrar una tarea;
- quieres historial de ejecución, reportes y una nota de proyecto en Obsidian.

El flujo es híbrido: **ODD** para trabajo ligero y **SDD** para cambios grandes
o multi-contexto. Laya elige la ruta; tú puedes forzarla con `--mode`.

## SDD y ODD

**SDD (Spec-Driven Development)** escribe primero una especificación con tareas,
dependencias, archivos y validación; el agente ejecuta contra ese contrato.
**ODD (Organic Driven Development)** es el flujo ligero: se autoriza el cambio,
se explora solo lo necesario y se cierra con la evidencia mínima, sin crear
artefactos pesados. En alvaress, la fuente ODD es una nota de tarea o de
proyecto; la fuente SDD es `openspec.yaml` más la tarea.

| | ODD | SDD |
| --- | --- | --- |
| **Qué es** | **Organic Driven Development**: flujo orgánico y orientado al resultado. El contexto mínimo necesario, sin ceremonia extra. | **Spec-Driven Development**: especificación formal con tareas, dependencias, archivos y validación. |
| **Cuándo** | Cambios pequeños o medianos, un solo contexto, alcance claro. | Cambios grandes, multi-contexto, contratos, migraciones o varias tareas. |
| **Fuente** | Una nota de tarea o de proyecto: objetivo, checklist de aceptación, archivos asignados y riesgos. En alvaress vive en Obsidian o, con `--task`, en `.harness/tasks/<TASK>.md`. | `openspec.yaml` y `.harness/tasks/<TASK>.md`. |
| **Cierre** | Marca el checklist, actualiza la nota y hace commit de los archivos del run. | Marca la tarea `Done`, actualiza el spec y hace commit de los archivos del run. |

En ambos modos el agente escribe el código, valida y deja rastro. La diferencia
es cuánta estructura necesita el trabajo, no quién manda: la fuente siempre es
la nota o la spec, nunca la memoria del modelo.

## Flujo del agente

![Flujo de trabajo del agente alvaress](assets/alvaress-flow.svg)

El agente avanza por cinco fases. En cada una usa una herramienta distinta y
cierra el alcance antes de pasar a la siguiente.

| Fase | Qué pasa | Herramienta |
| --- | --- | --- |
| **1 · Entender** | Detecta ODD o SDD, lee la nota o `openspec.yaml`, consulta el grafo, carga solo los aprendizajes relevantes y cierra archivos, criterios y comandos de validación. | Graphify, OpenSpec, Obsidian, memoria |
| **2 · Decidir** | Elige la ruta, estima complejidad y clasifica riesgos. Si Laya no está disponible, usa heurísticas. | Laya ONNX int8 |
| **3 · Ejecutar** | Implementa el cambio con Aider o con los subagentes. El worker no hace commits ni escribe en la bóveda. | Aider o subagentes |
| **4 · Validar** | Ejecuta `vp check` y `vp test` (o los comandos de la tarea). Si falla, busca un pitfall que coincida, repara y vuelve a validar. | Vite-Plus, memoria |
| **5 · Cerrar** | Marca la tarea o el checklist, escribe el reporte, actualiza la nota, guarda hasta tres aprendizajes y hace commit solo con los archivos del run. | OpenSpec, Obsidian, Git, memoria |

### Estados de un `run`

| Estado | Qué pasa | Quién actúa |
| --- | --- | --- |
| `Exploring` | Detecta el modo, lee la fuente, consulta Graphify, carga los aprendizajes relevantes y cierra el alcance. | Orquestador y `alvaress-explorer` |
| `Working` | Implementa el cambio. | Aider o `alvaress-implementer` |
| `Checking` | Ejecuta la validación y guarda stdout/stderr en `.laya/last_run.log`. | Orquestador o `alvaress-verifier` |
| `Fixing` | Busca un pitfall que coincida con el error, repara la causa y vuelve a validar. Máximo dos intentos. | `alvaress-fixer` o Aider |
| `Ready` | Marca el cierre, escribe el reporte y la nota, guarda aprendizajes y hace commit de los archivos del run. | Orquestador |
| `Halted` | Fallo nuclear, de alcance o de herramienta. No hay commit ni cierre. | Orquestador |

Se detiene en `Halted` cuando el fixer devuelve `nuclear`, el mismo error
aparece dos veces, el diff se sale del alcance, falta una herramienta requerida,
el worker agota el timeout o una reparación deja el diff vacío. En `Halted` no
insiste: libera el lock, conserva `.laya/HALT.json` y el log, y espera una
decisión humana.

## Requisitos

- **Node.js 20 o superior.** Es el único requisito obligatorio.
- **pnpm.** Es el gestor recomendado y el que usa el instalador para las
  dependencias Node. **No es obligatorio:** si falta, alvaress cae a npm y te
  avisa. Node 20 trae Corepack, así que puedes activarlo sin instalar nada más:

  ```bash
  corepack enable pnpm
  # o, si prefieres instalarlo global:
  npm install -g pnpm
  ```

- **Git.** Recomendado para el control de alcance y los commits del run.
- **OpenCode.** Lo instalas tú; alvaress añade el agente y sus skills.

El resto lo resuelve `alvaress install`: Laya, ONNX Runtime, tokenizers,
Vite-Plus, Graphify, Obsidian (si se puede) y las dependencias de validación.

## Instalación

La vía recomendada es pnpm:

```bash
corepack enable pnpm
pnpm add -g alvaress
```

También puedes probarlo sin instalación global:

```bash
pnpm dlx alvaress --help
# o, si prefieres npm:
npx alvaress --help
```

Si tu proyecto usa npm, no pasa nada: `alvaress install` seguirá usando pnpm
para sus dependencias Node y solo usará npm si pnpm no está en el PATH.

### Instalación desatendida

Para dejar el equipo listo sin preguntas:

```bash
alvaress install --yes
```

`--yes` instala el set completo (agente, Laya, Obsidian, Graphify, Vite-Plus y
validación), usa la configuración existente o los valores por defecto y no
pregunta nada. Instala lo que falte, crea `openspec.yaml` si el proyecto es un
repositorio y no crea `.alvaressrc.json`. Aider solo se instala si ya está
habilitado en la configuración.

### Qué hace el instalador

1. Selecciona componentes (agente, Laya, Obsidian, Graphify, Vite-Plus y
   validación; Aider es opcional).
2. Pregunta lo que necesita decisión humana antes del trabajo pesado: bóveda,
   ruta del modelo de Laya y modelos de orquestador, subagentes y Aider.
3. Guarda `~/.alvaressconfig.json` para no perder tus elecciones si algo falla.
4. Instala en paralelo Obsidian, Graphify, Aider, las dependencias Node y el
   bundle int8 de Laya. Las dependencias Node van en una sola llamada a pnpm;
   los archivos pequeños del bundle se bajan en paralelo y el progreso es
   agregado.
5. Crea o actualiza `.alvaressrc.json` si aceptas overrides locales.
6. Crea `openspec.yaml` si el proyecto es un repositorio y no lo tiene.
7. Conecta `<bóveda>/Harness/` con enlaces a `.harness/tasks` y `openspec.yaml`.
8. Escribe las skills en `.harness/skills/` y sus enlaces globales.
9. Instala el agente `alvaress` y sus cuatro subagentes en OpenCode con el
   modelo elegido en su frontmatter.

Al final el instalador resume proyecto, rutas, configuración y los modelos
efectivos, para que no tengas que abrir el JSON.

Comprueba cómo quedó todo con:

```bash
alvaress doctor
alvaress doctor --json
```

## Inicio rápido

```bash
# 1. Instalador: agente, skills, componentes, modelos y configuración.
alvaress install

# 2. Abre OpenCode y selecciona el agente alvaress.
opencode
#    Pulsa Tab hasta ver "alvaress" o ejecuta:
opencode run --agent alvaress "Implementa la tarea TASK-01 siguiendo la spec"
```

`alvaress init` sigue existiendo para reparar o reinstalar en un proyecto que ya
tenía el arnés: crea `.harness/`, `openspec.yaml`, skills y agente local sin
volver a descargar componentes. No hace falta en una instalación nueva.

Dentro de OpenCode, basta con pedirle:

```text
Implementa la próxima tarea pendiente de openspec.yaml.
```

Él leerá la spec, consultará el modelo de decisión si hace falta, ejecutará
Aider o editará directamente, validará y actualizará el estado de la tarea.

## Comandos

| Comando | Qué hace | Opciones principales |
| --- | --- | --- |
| `alvaress run "<petición>"` | Ejecuta el arnés de principio a fin: explora, decide, trabaja, valida y cierra. | `--task`, `--files`, `--mode odd\|sdd\|auto`, `--dry-run`, `--no-commit`, `--no-learn`, `--force` |
| `alvaress -i` / `--inspect-last-run` | Muestra el log completo del último run (`.laya/last_run.log`). | — |
| `alvaress install` | Instala agente, Laya, Obsidian, Graphify, Vite-Plus y dependencias. | `--yes`, `-y` |
| `alvaress init` | Crea `.harness/`, `openspec.yaml`, skills y agente del proyecto. | `--no-link` |
| `alvaress apply [TASK...]` | Ejecuta tareas pendientes (o las indicadas) con Aider. | `--dry-run`, `--force`, `--update-graph`, `--no-lock` |
| `alvaress verify <TASK_ID>` | Ejecuta la validación de la tarea y, si falla, pide reparación automática. | — |
| `alvaress archive <SPEC_ID>` | Archiva una spec con todas sus tareas en `Done`. Antes crea un backup. | — |
| `alvaress doctor` | Diagnóstico de Node, configuración, modelos, frontmatter del agente, gestor, git, Laya, Vite-Plus, Aider, Graphify, Obsidian, manifiesto, grafo y locks. | `--json` |
| `alvaress report [latest\|list\|show <id>]` | Muestra los reportes de `.harness/runs/`. | — |
| `alvaress restore [--list\|latest\|<id>]` | Lista o restaura `openspec.yaml` desde `.harness/backups/`. | `--list` |
| `alvaress skills` | Reinstala las skills del proyecto y sus enlaces globales. | `--no-link` |
| `alvaress learn <subcomando>` | Guarda, busca y reutiliza aprendizajes globales y del proyecto. | `add`, `list`, `search`, `show`, `use`, `promote`, `prune`, `playbook` |
| `alvaress agent [install\|show]` | Instala el agente y sus subagentes, o imprime el prompt del orquestador. | `--no-global`, `--no-project` |
| `alvaress models [show\|set\|configure]` | Muestra o cambia los modelos de orquestador, subagentes y Aider sin reinstalar. | `--all`, `--orchestrator`, `--subagents`, `--aider`, `--no-install` |
| `alvaress obsidian [status\|sync\|note]` | Consulta o actualiza la bóveda y la nota del proyecto. | `--summary`, `--task`, `--from-run`, `--validation`, `--risk`, `--next` |
| `alvaress config [show\|paths]` | Muestra la configuración resuelta (secretos enmascarados) o sus rutas. | — |
| `alvaress --help` / `--version` | Ayuda y versión. | — |

Códigos de salida: `0` éxito, `1` error o tarea fallida, `130` operación
cancelada.

### Subcomandos

| Subcomando | Qué hace |
| --- | --- |
| `alvaress learn add <tipo> "<título>"` | Guarda un aprendizaje (`step`, `solution`, `pitfall`, `preference` o `improvement`); Laya decide si va al global o al proyecto. |
| `alvaress learn list` | Lista aprendizajes; filtra con `--scope`, `--kind`, `--tag` y `--limit`. |
| `alvaress learn search "<texto>"` | Busca por relevancia; filtra con `--scope`, `--kind`, `--tag` y `--limit`. |
| `alvaress learn show <id>` | Muestra un aprendizaje concreto con su store y contador de usos. |
| `alvaress learn use <id>` | Marca un aprendizaje como reutilizado en el store donde vive. |
| `alvaress learn promote <id>` | Copia un aprendizaje del proyecto al store global. |
| `alvaress learn prune` | Limpia por antigüedad o conserva los últimos N; `--scope` elige el store y `--dry-run` simula. |
| `alvaress learn playbook` | Regenera `PLAYBOOK.md`; el del proyecto incluye lo global relevante. |
| `alvaress agent install` | Instala el agente y sus subagentes; `--no-global` y `--no-project` limitan las ubicaciones. |
| `alvaress agent show` | Imprime el prompt del orquestador. |
| `alvaress models show` | Muestra los modelos efectivos de orquestador, subagentes y Aider. |
| `alvaress models set --all <provider/model>` | Cambia los tres roles de una vez y reinstala el frontmatter. |
| `alvaress models set --orchestrator <m> --subagents <m> --aider <m>` | Cambia roles concretos; `--no-install` solo guarda la configuración. |
| `alvaress models configure` | Flujo interactivo para elegir un modelo o uno por rol. |
| `alvaress obsidian status` | Muestra la bóveda, la nota y los enlaces. |
| `alvaress obsidian sync` | Crea o repara `Harness/`, la nota y los enlaces. |
| `alvaress obsidian note` | Añade una entrada de cierre; exige `--summary` o `--from-run`. |
| `alvaress config show` | Muestra la configuración resuelta con secretos enmascarados. |
| `alvaress config paths` | Muestra las rutas global y local. |

### Ejemplos

```bash
# Un cambio pequeño con alcance explícito.
alvaress run "agrega un helper de fechas" --files src/fechas.ts

# Una tarea SDD concreta.
alvaress run --task TASK-01

# Ver el plan sin tocar código.
alvaress run "migra el repositorio de facturas" --dry-run

# Ejecutar un lote de tareas.
alvaress apply --dry-run
alvaress apply SPEC-001/TASK-01 SPEC-001/TASK-02

# Revisar el último run.
alvaress -i
alvaress report latest
```

## Configuración

La configuración se resuelve con precedencia **local sobre global**:

- **Global:** `~/.alvaressconfig.json`
- **Local del proyecto:** `.alvaressrc.json`

Los campos escalares del archivo local sustituyen a los globales. Los objetos
`env` se fusionan y el local gana en claves repetidas. Las cadenas admiten
`${VARIABLE}` para interpolar variables de entorno. `alvaress config show`
enmascara `apiKey` y las variables cuyo nombre contiene `KEY`, `TOKEN`, `SECRET`
o `PASS`.

### JSON completo

```json
{
  "obsidianVaultPath": "/home/tu-usuario/Obsidian",
  "packageManager": "pnpm",
  "scope": "warn",
  "graphify": {
    "autoUpdate": false
  },
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
  "aider": {
    "enabled": false,
    "timeoutMs": 600000,
    "extraArgs": [],
    "inheritEnv": true
  },
  "models": {
    "orchestrator": {
      "modelName": ""
    },
    "subagents": {
      "modelName": ""
    },
    "aiderImplementer": {
      "modelName": "deepseek/deepseek-chat",
      "apiKey": "${DEEPSEEK_API_KEY}",
      "apiBase": "",
      "env": {
        "DEEPSEEK_API_KEY": "${DEEPSEEK_API_KEY}"
      }
    }
  },
  "validation": {
    "maxAttempts": 3,
    "commands": [
      "pnpm exec vp check",
      "pnpm exec vp test"
    ],
    "requireCommands": true
  }
}
```

### Cada clave

| Clave | Tipo | Default | Qué significa |
| --- | --- | --- | --- |
| `obsidianVaultPath` | `string` | vacío; el instalador propone `~/Obsidian` | Ruta de la bóveda Obsidian. Vacío = trabajar sin bóveda (ODD necesitará una nota local o `--mode sdd`). |
| `packageManager` | `"pnpm" \| "npm"` | `"pnpm"` | Gestor para comandos de validación y scripts del proyecto. El instalador siempre prefiere pnpm y usa npm solo como fallback. |
| `scope` | `"strict" \| "warn" \| "off"` | `"warn"` | Control del diff en `apply`: `strict` falla si se toca un archivo fuera del alcance, `warn` solo avisa, `off` lo desactiva. |
| `graphify.autoUpdate` | `boolean` | `false` | Actualiza el grafo al terminar `apply`. También puedes usar `apply --update-graph`. |
| `laya.enabled` | `boolean` | `true` | Activa Laya. Si está en `false`, el arnés usa heurísticas locales. |
| `laya.modelDir` | `string` | vacío = caché global | Directorio con el bundle (`laya.onnx`, `laya.onnx.data`, `laya_config.json` y `tokenizer/`). |
| `laya.device` | `"cpu" \| "cuda"` | `"cpu"` | Dispositivo de ONNX Runtime. `cuda` requiere un runtime compatible con CUDA. |
| `laya.threads` | `integer >= 1` | sin límite explícito | Hilos intra-op de ONNX Runtime en CPU. Omítelo para el valor del runtime. |
| `laya.timeoutMs` | `integer >= 1000` | `30000` | Tiempo máximo por llamada a Laya. Al agotarse, cae a heurísticas si `fallbackToHeuristic` está activo. |
| `laya.fallbackToHeuristic` | `boolean` | `true` | Si Laya falla o no está instalado, continúa con heurísticas deterministas. |
| `vitePlus.checkCommand` | `string` | `"vp check"` | Comando de lint, formato y tipos. |
| `vitePlus.testCommand` | `string` | `"vp test"` | Comando de pruebas. |
| `vitePlus.fallbackToPackageManager` | `boolean` | `true` | Se acepta por compatibilidad. La resolución actual de comandos ya usa el gestor configurado. |
| `aider.enabled` | `boolean` | `false` | Usa Aider como worker. Si está en `false`, trabajan los subagentes. |
| `aider.timeoutMs` | `integer >= 1000` | `600000` | Timeout de Aider (10 min por defecto). |
| `aider.extraArgs` | `string[]` | `[]` | Argumentos extra para Aider. |
| `aider.inheritEnv` | `boolean` | `true` | Hereda el entorno. En `false`, solo pasa las variables permitidas y las de `env`. |
| `models.orchestrator.modelName` | `string` | vacío = heredar el de OpenCode | Modelo `provider/model` del agente orquestador. Se escribe en el frontmatter del agente instalado. |
| `models.subagents.modelName` | `string` | vacío = heredar el del orquestador | Modelo `provider/model` de los cuatro subagentes. Se escribe en cada frontmatter. |
| `models.aiderImplementer.modelName` | `string` | `"deepseek/deepseek-chat"` | Modelo del implementador para Aider. |
| `models.aiderImplementer.apiKey` | `string` | vacío | Se expone a Aider con la variable del proveedor del modelo (`OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, etc.). Admite `${VAR}`. |
| `models.aiderImplementer.apiBase` | `string` | vacío | Se expone como `OPENAI_API_BASE`. Útil para endpoints compatibles con OpenAI; en ese caso la clave también se publica como `OPENAI_API_KEY`. |
| `models.aiderImplementer.env` | `Record<string, string>` | `{}` | Variables adicionales para Aider. Se fusionan con las globales y el local gana. |
| `validation.maxAttempts` | `integer >= 1` | `3` | Intentos de reparación en `apply` y `verify`. `run` usa su propio límite de dos reparaciones. |
| `validation.commands` | `string[]` | `pnpm exec vp check`, `pnpm exec vp test` | Comandos globales de validación. Una tarea puede sustituirlos con su propio `validation`. |
| `validation.requireCommands` | `boolean` | `true` | Si es `true`, no tener comandos de validación es un fallo. Si es `false`, se avisa y se continúa. |

Aider recibe la credencial según el proveedor del `modelName`:

| Prefijo del modelo | Variable para Aider |
| --- | --- |
| `openai/*` | `OPENAI_API_KEY` |
| `deepseek/*` | `DEEPSEEK_API_KEY` |
| `anthropic/*` | `ANTHROPIC_API_KEY` |
| `gemini/*`, `google/*` | `GEMINI_API_KEY` |
| `openrouter/*` | `OPENROUTER_API_KEY` |
| `mistral/*`, `groq/*`, `xai/*` | `MISTRAL_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY` |
| proveedor desconocido o endpoint custom | `OPENAI_API_KEY` (+ `OPENAI_API_BASE`) |

`google/*` se traduce a `gemini/*` al escribir el modelo de Aider, porque OpenCode
y Aider no usan el mismo prefijo. Si heredas el entorno, las claves de proveedor
que ya tengas en el shell se conservan; solo se eliminan secretos de alvaress,
npm, GitHub y AWS.

### Valores por defecto y ejemplos

```bash
alvaress config show    # configuración resuelta, secretos enmascarados
alvaress config paths   # rutas global y local
alvaress models show    # modelos efectivos
alvaress models set --all openai/gpt-5
alvaress models set --orchestrator openai/gpt-5 --subagents openai/gpt-5-mini --aider deepseek/deepseek-chat
```

`models set` guarda en la configuración global y reinstala el frontmatter del
agente y sus subagentes. Con `--no-install` solo guarda; con `--no-global` o
`--no-project` limita dónde se reescribe el frontmatter.

Si no defines `laya.modelDir`, alvaress usa la caché global
`~/.cache/alvaress/laya-onnx-int8/<revision>`. Si existe un bundle fp32 de una
instalación anterior, lo reutiliza para no volver a descargar nada. Si falta el
modelo, el run sigue con heurísticas y `doctor` lo indica.

## Herramientas que instala y por qué

| Herramienta | Qué aporta | Cómo se obtiene |
| --- | --- | --- |
| **Node.js 20+** | Runtime de la CLI y de los subagentes. | Lo instalas tú. |
| **pnpm** | Gestor recomendado para dependencias, scripts y binarios. | Corepack o `npm install -g pnpm`. npm es el fallback. |
| **Git** | Control de alcance del diff y commits del run. | Lo instalas tú. |
| **OpenCode** | Runtime donde viven el agente y los subagentes. | Lo instalas tú; alvaress añade el agente y las skills. |
| **Laya int8** | Motor de decisión local: ruta ODD/SDD, complejidad, riesgo y triaje. | Bundle de ~488 MB desde el release `laya-int8-v1`; se verifica con SHA-256 y queda en caché global. |
| **ONNX Runtime** | Ejecuta el modelo de Laya en CPU, sin servicio remoto ni API key. | `pnpm add -D onnxruntime-node` (lo hace `alvaress install`). |
| **Hugging Face Tokenizers** | Tokeniza el resumen de estado que recibe Laya. | `pnpm add -D @huggingface/tokenizers` (lo hace `alvaress install`). |
| **Vite-Plus** | `vp check` y `vp test`: lint, tipos y pruebas en un solo comando. | `pnpm add -D vite-plus` (lo hace `alvaress install`). |
| **oxlint + TypeScript** | Validación de respaldo para proyectos sin Vite-Plus. | `pnpm add -D oxlint typescript @types/node` (lo hace `alvaress install`). |
| **Graphify** | Grafo AST del repositorio para localizar código sin leerlo entero. | `pipx install graphifyy` (lo hace `alvaress install`). |
| **Aider (opcional)** | Worker multiarchivo cuando `aider.enabled` está activo. | `pipx install aider-chat`, solo si lo habilitas. |
| **Obsidian (opcional)** | Nota ODD y espejo del estado SDD. | Aplicación del sistema; el instalador intenta instalarla. |
| **pipx** | Instala Graphify y Aider en entornos Python aislados. | Gestor del sistema o `python3 -m pip install --user pipx`. |
| **OpenSpec** | Formato de manifiesto y tareas SDD. | No se instala: alvaress usa el formato y crea `openspec.yaml`. |

Las dependencias Node se instalan con **pnpm**. pipx solo se usa para Graphify y
Aider, que son herramientas de Python. El bundle int8 se baja del release
`laya-int8-v1` de `Alvarez-P/alvaress`; los assets van planos porque GitHub no
admite `/` en sus nombres y el instalador los coloca en `tokenizer/` al
guardarlos. El manifiesto `laya_int8.json` se escribe al final y es la fuente de
verdad para `verifyBundle` y `doctor`.

## Agente, subagentes y skills

El instalador escribe el agente en dos sitios:

- **Global:** `~/.config/opencode/agents/alvaress.md`
- **Proyecto:** `.opencode/agents/alvaress.md`

Es un agente `primary`, seleccionable con **Tab** en OpenCode o con
`opencode run --agent alvaress`. No cambia tu agente por defecto.

| Subagente | Estado | Para qué sirve | Límite | Pasos |
| --- | --- | --- | --- | ---: |
| `alvaress-explorer` | `Exploring` | Solo lectura: localiza código, lee la nota y propone un alcance cerrado. | No edita, no decide, no escribe en la bóveda. | 12 |
| `alvaress-implementer` | `Working` | Implementa una micro-tarea ODD o una tarea SDD dentro del alcance. | Sin git, sin cierre, sin dependencias nuevas. | 30 |
| `alvaress-verifier` | `Checking` | Ejecuta Vite-Plus y devuelve el error exacto. | No edita archivos ni toca git. | 12 |
| `alvaress-fixer` | `Fixing` | Repara un fallo trivial, máximo dos intentos. | No toca tests ni git; devuelve `nuclear` si no es trivial. | 20 |

El orquestador no delega la decisión, el commit, el cierre de Obsidian ni los
aprendizajes. La bóveda es de solo lectura para los cuatro subagentes.

Aider y los subagentes tienen prohibido agregar comentarios al código: ni
explicaciones, ni separadores, ni `TODO`/`FIXME`, ni JSDoc de relleno. Conservan
solo los comentarios que ya existían. El orquestador revisa el diff y rechaza
cualquier comentario nuevo antes de validar y commitear.

### Skills

El instalador escribe nueve skills en `.harness/skills/<nombre>/SKILL.md` y crea
enlaces en `~/.config/opencode/skills/<nombre>` y `~/.claude/skills/<nombre>`:

| Skill | Qué hace |
| --- | --- |
| `read-spec-first` | Lee la nota ODD o la spec SDD antes de programar y resume los criterios. |
| `consult-graphify-ast` | Evita lecturas masivas y prioriza Graphify. |
| `self-healing-verify` | Valida con Vite-Plus tras cada edición y limita los ciclos de reparación. |
| `universal-design-patterns` | Respeta los patrones existentes, evita abstracciones nuevas y no agrega comentarios al código. |
| `obsidian-sdd` | Define el uso de Obsidian por fase y el acceso de solo lectura de los subagentes. |
| `continuous-learning` | Consulta títulos relevantes y guarda aprendizajes en el store global o del proyecto sin inflar el contexto. |
| `bounded-scope` | Mantiene al subagente en los archivos asignados y le enseña a detenerse. |
| `vite-plus-verify` | Ejecuta `vp check`/`vp test` y devuelve el error exacto sin ruido. |
| `failure-triage` | Clasifica un fallo como trivial o nuclear antes de repararlo. |

Cada subagente carga solo las skills de su perfil. El detalle de permisos,
límites y comandos denegados está en [docs/subagents.md](docs/subagents.md).

### Permisos

El agente `primary` puede leer, buscar, editar y usar skills. El shell tiene una
allowlist: `alvaress`, `graphify`, `aider`, `git status/diff/log/show`,
`pnpm test`, `pnpm run validate/build/lint/typecheck/test`,
`pnpm exec vp/oxlint/tsc/eslint/vitest`, `vp`, `npx vp`, `npm test`,
`npm run validate/build/lint/typecheck/test`, `npx oxlint/tsc`, `rg`, `grep`,
`sed -n`, `find` y `ls`. Todo lo demás pide confirmación.

Están denegados de forma explícita:

- `git push`, `git reset`, `git clean`, `git checkout`, `git restore`, `rm`,
  `sudo`, `curl` y `wget`;
- `pnpm`/`npm publish`, `pnpm dlx`, `npm exec` y `npx --yes`;
- `find -exec`, `find -delete`, `sed -i` y `rg --pre`;
- scripts de deploy, release, publish, migración, base de datos y seed;
- que los subagentes lancen otros subagentes o consulten la web;
- `execute` y `question` en los subagentes;
- la lectura de `.env`, `.pem`, `.key`, `.p12`, `id_rsa` e `id_ed25519`;
- escribir en la bóveda Obsidian desde un subagente.

El orquestador es el único que ejecuta `alvaress apply`, `alvaress verify`,
`alvaress obsidian note`, `alvaress archive` y `alvaress learn add`.

## Obsidian

Obsidian es opcional. Si lo seleccionas, `alvaress install`:

1. Comprueba si está instalado (binario, escritorio, Flatpak, Snap, AppImage,
   `.app` de macOS o instalación de Windows).
2. Si falta, intenta instalarlo con el gestor del sistema o el paquete oficial.
3. Usa la bóveda configurada o `~/Obsidian`, la crea si no existe y la conecta
   al proyecto.

Si la instalación automática falla, el instalador avisa y continúa: la bóveda se
crea igualmente y puedes instalar Obsidian después desde
[obsidian.md/download](https://obsidian.md/download).

Dentro de la bóveda se crea:

```text
Harness/
├── Tasks -> <proyecto>/.harness/tasks
├── openspec.yaml -> <proyecto>/openspec.yaml
└── <proyecto>.md
```

- En **ODD**, la nota de la tarea o del proyecto es la fuente de alcance y se
  actualiza al cerrar.
- En **SDD**, Obsidian es un espejo: la fuente es `openspec.yaml` y
  `.harness/tasks/`, y la bóveda refleja los cambios con enlaces.
- Solo el orquestador escribe en la bóveda, siempre con `alvaress obsidian note`.
- Los subagentes solo leen. No edites `<bóveda>/Harness/` a mano.

```bash
alvaress obsidian status
alvaress obsidian sync
alvaress obsidian note \
  --task TASK-01 \
  --summary "Qué cambió" \
  --validation "pnpm test: 240/240" \
  --risk "Riesgos pendientes" \
  --next "Siguiente paso"

alvaress obsidian note --from-run latest --task TASK-01
```

- `status` muestra la bóveda, la nota y los enlaces.
- `sync` crea o repara la estructura `Harness/`, la nota y los enlaces.
- `note` exige `--summary` y añade una entrada a la sección `## Registro`.

## Aprendizaje continuo

El agente aprende sin mandar nada a la nube y sin inflar el contexto. Hay dos
stores separados:

| Store | Ruta | Qué guarda |
| --- | --- | --- |
| **Global** | `~/.alvaress/memory/learnings.json` y `PLAYBOOK.md` | Herramientas, errores y prácticas que sirven en cualquier repositorio. |
| **Proyecto** | `<proyecto>/.harness/memory/learnings.json` y `PLAYBOOK.md` | Comandos, rutas, convenciones y trampas propias de este repo. |

### Quién decide el scope

Al guardar, **Laya** clasifica el aprendizaje como `global` o `project` usando el
tipo, el título, el detalle, los tags y el nombre del proyecto. Si Laya no está
disponible, una heurística local aplica las mismas señales: herramientas y
prácticas transversales → global; rutas, ids y configuración del repo →
proyecto.

Puedes saltarte la decisión:

```bash
alvaress learn add solution "Validar migraciones en seco" --global
alvaress learn add pitfall "El endpoint de facturas exige migración" --scope project
```

Y promover lo que nació local y demostró servir fuera:

```bash
alvaress learn promote L-1a2b3c4d
```

El store del proyecto siempre gana si el mismo `id` existe en ambos.

### Dónde se consultan en el flujo

| Fase | Qué se revisa | Límite |
| --- | --- | --- |
| **1 · Entender** | Solo títulos que coincidan con la petición, la tarea y los archivos, en ambos stores. | 3 títulos, sin cuerpos |
| **3 · Ejecutar** | Nada por defecto. El implementador solo pide un aprendizaje si la tarea lo amerita. | 2 |
| **4 · Validar / Fixing** | Solo `pitfall` o `solution` que coincidan con el comando y la firma del error. | 2 |
| **5 · Cerrar** | No se lee: se guarda el pitfall reparado y hasta 3 aprendizajes nuevos. | 3 |

Regla de oro: **el store completo y el `PLAYBOOK.md` nunca se inyectan al
prompt.** Se consultan por búsqueda y se pasan solo ids y títulos; el cuerpo se
abre con `learn show` únicamente si hace falta. El objetivo es que un
aprendizaje ocupe contexto solo cuando cambia la decisión.

### Cómo decidir si un aprendizaje aplica

Se toma en cuenta solo si cumple estas condiciones:

1. **Misma herramienta, comando o stack.** Un pitfall de `pnpm` no aplica a un
   error de `pip`.
2. **Misma firma de error o misma forma de tarea.** Si el mensaje o el contexto
   no coinciden, no se usa.
3. **El proyecto gana al global.** Ante conflicto, manda el store del proyecto.
4. **La spec o la nota ganan a todo.** Si el aprendizaje contradice la fuente
   del trabajo o el código actual, se descarta.
5. **Usos y fecha solo desempatan.** No son motivo suficiente para meter
   contexto.
6. **Si no cambia la decisión, no se usa.** Un aprendizaje que no altera el
   plan es ruido.

El orquestador ejecuta `alvaress learn use <id>` solo cuando el aprendizaje se
aplicó de verdad. Así el contador prioriza lo útil y `learn prune` puede retirar
lo que nunca se usó.

### Tipos

| Tipo | Para qué sirve |
| --- | --- |
| `step` | Una secuencia de pasos que ahorra tiempo. |
| `solution` | Una solución concreta a un problema recurrente. |
| `pitfall` | Un error que conviene evitar y cómo detectarlo. |
| `preference` | Una convención del usuario o del equipo. |
| `improvement` | Una mejora propuesta al prompt, a una skill o al CLI. |

### Comandos

```bash
alvaress learn search "migraciones" --scope all --limit 5
alvaress learn add solution "Validar migraciones en seco" \
  --body "Ejecutar el SQL en una transacción y revertir antes de aplicar." \
  --tag db --tag migrations --source TASK-01
alvaress learn list --kind pitfall --scope project
alvaress learn show L-1a2b3c4d
alvaress learn use L-1a2b3c4d
alvaress learn promote L-1a2b3c4d
alvaress learn playbook --scope all
alvaress learn prune --scope all --keep 100 --dry-run
```

- `--scope all|global|project` filtra lectura, limpieza y playbook.
- `learn prune` limpia ambos stores por defecto; usa `--scope` para acotarlo.
- Los `improvement` son propuestas: el agente los menciona y no edita su propio
  prompt ni sus skills sin aprobación.
- `ALVARESS_MEMORY_DIR` mueve el store global; el del proyecto siempre vive en
  `.harness/memory/`.

## Manifiesto `openspec.yaml`

```yaml
specification: "1.0.0"
project: "mi-app-nestjs"
bounded_contexts:
  - name: "catalog"
    path: "src/catalog"
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

- `depends_on` ordena la ejecución real dentro del grupo.
- `validation` sustituye a los comandos globales para esa tarea.
- `priority` ordena tareas independientes.
- `estimate` y `rollback` documentan coste y vuelta atrás.
- `files` cierra el alcance del worker.

Estados admitidos:

- **Spec:** `Proposed`, `Verified`, `Archived`, `Failed`.
- **Tarea:** `Pending`, `InProgress`, `Done`, `Failed`.

Los ids de specs y tareas solo admiten letras, números, punto, guion y guion
bajo. Los ids de tarea deben ser únicos en todo el manifiesto.

## Confiabilidad y seguridad

- **Lock global** en `.harness/lock`: impide dos `apply` simultáneos. Un lock
  huérfano se detecta por PID o por antigüedad; `--force` lo reemplaza.
- **Escritura atómica** de `openspec.yaml`, reportes, caché y nota de Obsidian.
- **Backups** del manifiesto en `.harness/backups/` antes de `apply` y `archive`.
- **Reportes** en `.harness/runs/<id>-apply.json` y `<id>-run.json`.
- **Control de alcance** con `git status` (`scope`).
- **Timeouts** para Aider y Laya, con terminación controlada.
- **Entorno saneado** para Aider: no hereda credenciales de npm ni GitHub.
- **Redacción de secretos** antes de enviar estado a Laya y al escribir la nota.
- **Permisos estrictos** en el agente y los subagentes.
- **CI** con pnpm en Node 20/22/24, smoke test del tarball y release con
  `pnpm publish --provenance`.

## Desarrollo

Todo el desarrollo se hace con pnpm. Si clonas el repositorio y no lo tienes:

```bash
corepack enable pnpm
pnpm install
pnpm run validate   # lint + typecheck de src y test
pnpm test           # build + pruebas con node:test y tsx
pnpm run build      # limpia dist/ y compila
```

El build limpia `dist/` antes de compilar para que no queden comandos retirados
en el paquete. Las pruebas cubren configuración, manifiesto, agrupación,
argumentos, FS, enlaces, skills, agente y permisos, verificación y
self-healing, `apply`, Laya y heurísticas, bundle vendorizado, caché, redacción,
lock, backups, reportes, alcance, `doctor`, `report`, `restore`, `archive`,
Obsidian, pipx y la CLI de extremo a extremo.

## Estructura del paquete

```text
src/
├── cli.ts
├── agent/           prompt, subagentes e instalación
├── commands/        install, init, agent, obsidian, skills, config, doctor, report, restore, archive
├── core/            contratos, máquina de estados y HALT
├── config/          loader con precedencia global/local
├── decision/        adaptador de Laya, motor vendorizado y heurísticas
├── ui/              paleta TrueColor, loader de estados y reporte final
├── graphify/        estado y actualización del grafo
├── openspec/        manifiesto y tipos
├── orchestrator/    agrupación, Aider, verificación, apply, backups, reportes y alcance
├── skills/          definición e instalación de skills
├── obsidian/        conexión con la bóveda
└── utils/           args, errores, FS, lock, gestor de paquetes, pipx, redacción, logger y procesos
test/                pruebas con node:test
assets/              animación y diagramas SVG del README
docs/laya-int8.md    artefacto int8, hashes y mediciones
docs/subagents.md    contrato y permisos de los subagentes
docs/spec.md         prompt histórico de generación; no es referencia de uso
```

## Licencia

MIT. Consulta [LICENSE](LICENSE).
