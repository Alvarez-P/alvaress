# alvaress

<p align="center">
  <img src="assets/alvaress-logo.svg" alt="alvaress: SDD harness para OpenCode" width="420">
</p>

**Tu copiloto SDD para [OpenCode](https://opencode.ai):** decide en local con
[kev o laya](https://ollama.com/search?c=decision), ejecuta con
[Aider](https://aider.chat) cuando conviene y valida cada cambio antes de dar
una tarea por terminada.

`alvaress` no reemplaza a tu agente: le da un entorno de trabajo ordenado.
Instala un agente de OpenCode llamado **`alvaress`**, sus skills y la
configuración necesaria para trabajar con [OpenSpec](https://github.com/Fission-AI/OpenSpec),
[Obsidian](https://obsidian.md) y [Graphify](https://github.com/Graphify-Labs/graphify).

> **En corto:** instalas alvaress → ejecutas `alvaress install` → `alvaress init`
> → abres OpenCode → eliges el agente `alvaress` → le pides la siguiente tarea.
> Él lee la spec, decide, ejecuta, valida y registra el resultado.

## Contenido

- [¿Qué es alvaress?](#qué-es-alvaress)
- [El nombre](#el-nombre)
- [El flujo en una imagen](#el-flujo-en-una-imagen)
- [Cómo funciona, en 5 pasos](#cómo-funciona-en-5-pasos)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [El agente `alvaress`](#el-agente-alvaress)
- [Comandos](#comandos)
- [Modelo de decisión (kev o laya)](#modelo-de-decisión-kev-o-laya)
- [Configuración](#configuración)
- [Manifiesto `openspec.yaml`](#manifiesto-openspecyaml)
- [Cómo funciona `apply`](#cómo-funciona-apply)
- [Skills](#skills)
- [Obsidian](#obsidian)
- [Confiabilidad y seguridad](#confiabilidad-y-seguridad)
- [Diagramas](#diagramas)
- [Commits](#commits)
- [Desarrollo](#desarrollo)
- [Estructura del paquete](#estructura-del-paquete)
- [Licencia](#licencia)

## ¿Qué es alvaress?

Un orquestador **Spec-Driven Development (SDD)**. Su trabajo es que el agente
no improvise: que lea la especificación, decida con criterios explícitos,
ejecute cambios acotados y compruebe que todo sigue funcionando.

La idea es la de Gentle AI: no sustituir a tu agente, sino darle reglas,
herramientas y un registro de lo que va pasando.

Te puede servir si:

- quieres que el agente siga una spec y no una corazonada;
- prefieres decisiones locales y privadas, sin mandar tu contexto a un servicio
  remoto;
- quieres validación real (lint, tipos, tests) antes de cerrar una tarea;
- quieres un historial de ejecución y una nota de proyecto en Obsidian.

## El nombre

<p align="center">
  <img src="assets/alvaress-intro.gif" alt="Alvarez + Harness = Alvaress" width="640">
</p>

`alvaress` nace de **Alvarez** + **Harness**: tu apellido y el entorno de
trabajo. La animación muestra cómo la `z` de *Alvarez* se va y las `ss` de
*Harness* se quedan para formar **Alvaress**.

## El flujo en una imagen

![Flujo de trabajo del agente alvaress](assets/alvaress-flow.svg)

De izquierda a derecha: el agente avanza por cinco fases y, en cada una, usa
una herramienta distinta. Obsidian solo refleja el estado; el orquestador es
el único que escribe en la bóveda.

## Cómo funciona, en 5 pasos

1. **Entender.** Lee `openspec.yaml`, la tarea asignada, el grafo de Graphify y
   la nota del proyecto en Obsidian. No empieza a programar a ciegas.
2. **Decidir.** Consulta a `kev` o `laya` (máximo 3 llamadas por solicitud) si
   la petición está clara, qué camino conviene y qué complejidad tiene. Si
   Ollama no está disponible, sigue con heurísticas locales.
3. **Ejecutar.** Usa Aider para tareas SDD y cambios multiarchivo; para cambios
   triviales edita directamente. El alcance está acotado por la tarea.
4. **Validar.** Ejecuta los comandos de validación del proyecto o de la tarea.
   Si fallan, lanza un bucle de reparación con Aider hasta agotar
   `validation.maxAttempts`.
5. **Cerrar.** Actualiza el estado en `openspec.yaml`, escribe el reporte de
   ejecución y registra el cierre en Obsidian con `alvaress obsidian note`.

## Requisitos

Solo necesitas instalar dos cosas; el resto lo resuelve `alvaress install`.

| Tú instalas | El instalador resuelve |
| --- | --- |
| **Node.js 20 o superior** | Aider (`aider-chat`) |
| **pnpm** (gestor por defecto) | Graphify (`graphifyy`) |
| Git (recomendado) | pipx, si falta |
| | Ollama y el modelo `kev` o `laya` |
| | Obsidian, si se puede instalar |
| | `oxlint`, TypeScript y `@types/node` en el proyecto |

**Sobre pipx:** si falta, el instalador lo instala con el gestor de tu sistema
(`brew`, `apt-get`, `dnf`, `pacman`, `zypper`, `apk`) o con
`python3 -m pip install --user pipx`. Solo si no encuentra ninguna vía te pide
instalarlo a mano.

**Sobre Ollama:** `kev` necesita Ollama 0.40.4 o superior; `laya`, 0.40.0 o
superior. El instalador lo arranca si está apagado y descarga el modelo elegido.

## Instalación

```bash
pnpm add -g alvaress
```

También puedes probarlo sin instalación global:

```bash
pnpm dlx alvaress --help
```

### Instalación desatendida

Para CI o para dejar el equipo listo sin preguntas:

```bash
alvaress install --yes
```

`--yes` selecciona todos los componentes, usa la configuración existente o los
valores por defecto y no pregunta nada. Instala lo que falte (Aider, Graphify,
Ollama y el modelo de decisión), crea `openspec.yaml` si el proyecto es un
repositorio y no crea `.alvaressrc.json`. Si no hay API key del implementador,
avisa al terminar para que la añadas antes de usar Aider.

## Inicio rápido

```bash
# 1. Instalador: agente, skills, componentes y configuración.
#    Elige kev o laya cuando te pregunte por el modelo de decisión.
alvaress install

# 2. Prepara el proyecto: manifiesto, tareas, skills y agente local.
alvaress init

# 3. Abre OpenCode y selecciona el agente alvaress.
opencode
#    Pulsa Tab hasta ver "alvaress" o ejecuta:
opencode run --agent alvaress "Implementa la tarea TASK-01 siguiendo la spec"
```

Dentro de OpenCode, basta con pedirle:

```text
Implementa la próxima tarea pendiente de openspec.yaml.
```

Él leerá la spec, consultará el modelo de decisión si hace falta, ejecutará
Aider o editará directamente, validará y actualizará el estado de la tarea.

## El agente `alvaress`

El instalador escribe el agente en dos sitios:

- **Global:** `~/.config/opencode/agents/alvaress.md`
- **Proyecto:** `.opencode/agents/alvaress.md`

Es un agente `primary`, seleccionable con **Tab** en OpenCode o con
`opencode run --agent alvaress`. No cambia tu agente por defecto.

Además instala tres subagentes `subagent` en la misma carpeta:

| Subagente | Para qué sirve |
| --- | --- |
| `alvaress-explorer` | Solo lectura: localiza código y contexto. |
| `alvaress-implementer` | Implementa una tarea SDD dentro de un alcance cerrado. |
| `alvaress-verifier` | Ejecuta la validación y devuelve el error exacto sin editar. |

Los tres tienen la bóveda Obsidian como solo lectura y no pueden hacer
`git push`, `git reset --hard` ni `rm -rf`. El orquestador es el único que
ejecuta `alvaress apply`, `alvaress obsidian note` y `alvaress archive`.

Su prompt incluye:

- el flujo SDD obligatorio: entender → decidir → ejecutar → validar → cerrar;
- el uso del modelo de decisión en los puntos clave (máximo 3 llamadas por
  solicitud);
- la política de ejecución: Aider para tareas SDD y cambios multiarchivo;
  edición directa para cambios triviales;
- la prohibición de enviar secretos o código completo al modelo de decisión;
- reglas de eficiencia de tokens: Graphify antes de `grep`/`read`, lecturas
  localizadas y resúmenes en lugar de logs completos;
- una personalidad amigable, con modismos mexicanos ligeros y ocasionales, y
  respuestas cortas por defecto: estado, cambios principales y validación. El
  detalle solo se explica si lo pides.

Puedes ver o reinstalar el agente sin ejecutar el instalador interactivo:

```bash
alvaress agent show
alvaress agent install
alvaress agent install --no-global
alvaress agent install --no-project
```

## Comandos

| Comando | Descripción |
| --- | --- |
| `alvaress install [--yes]` | Instala agente, Obsidian, Graphify, Aider, Ollama, modelo de decisión y dependencias de validación. Detecta o instala lo que falte, crea la bóveda y genera la configuración global y, si procede, la local y `openspec.yaml`. `--yes` no pregunta nada. |
| `alvaress init [--no-link]` | Crea `.harness/tasks`, `.harness/skills`, `openspec.yaml` (si falta), las skills y el agente del proyecto. Si `obsidianVaultPath` está configurado, conecta la bóveda. Con `--no-link` no crea enlaces ni agente global. |
| `alvaress apply [TASK...] [--dry-run] [--force] [--update-graph]` | Ejecuta las tareas pendientes (o los ids indicados) con Aider. `--dry-run` muestra los grupos sin invocar a Aider ni modificar el manifiesto. `--force` ignora un lock huérfano y `--update-graph` actualiza Graphify al terminar. |
| `alvaress verify <TASK_ID>` | Ejecuta la validación de la tarea o del proyecto y, si falla, pide a Aider una reparación automática. |
| `alvaress archive <SPEC_ID>` | Archiva una spec con todas sus tareas en `Done`; antes crea un backup del manifiesto. |
| `alvaress doctor [--json]` | Diagnóstico previo: Node, configuración, gestor de paquetes, git, Aider, Graphify, Ollama, modelo de decisión, Obsidian, manifiesto, comandos de validación, frescura del grafo y locks. |
| `alvaress report [latest\|list\|show <id>]` | Muestra los reportes de ejecución guardados en `.harness/runs/`. |
| `alvaress restore [--list\|latest\|<id>]` | Lista o restaura `openspec.yaml` desde `.harness/backups/`. |
| `alvaress skills [--no-link]` | Reinstala las skills del proyecto y sus enlaces globales. |
| `alvaress agent [install\|show]` | Instala el agente `alvaress` y sus subagentes en OpenCode, o imprime el prompt del orquestador. |
| `alvaress obsidian [status\|sync\|note]` | Consulta la bóveda y la nota del proyecto (`status`), las crea o repara (`sync`), o registra el cierre de una tarea (`note`, también con `--from-run latest`). |
| `alvaress decide [predict\|choose\|score\|ask]` | Consulta las decisiones tipadas del modelo local. Sin subcomando combina claridad, camino y complejidad en una sola llamada con caché. |
| `alvaress model [status\|list\|kev\|laya]` | Inspecciona o cambia el modelo de decisión (`kev` o `laya`) y comprueba el estado de Ollama. |
| `alvaress config [show\|paths]` | Muestra la configuración resuelta (con secretos enmascarados) o las rutas de configuración. |

Códigos de salida: `0` éxito, `1` error o tarea fallida, `2` error del modelo
de decisión u Ollama, `130` operación cancelada.

## Modelo de decisión (kev o laya)

`alvaress` habla con el endpoint `/v1/systemone` de Ollama. No hay API key ni
servicio remoto: el modelo corre en tu máquina.

`kev` y `laya` no generan texto. Reciben un `state` y preguntas tipadas
(`noul`, `choice`, `score`) y devuelven probabilidades calibradas. `alvaress`
los usa para decidir si la solicitud está clara, qué camino tomar y qué
complejidad tiene el cambio.

| Modelo | Base | Cuándo conviene |
| --- | --- | --- |
| `kev` | Qwen3.5 calibrado | Equilibrio entre precisión y velocidad. |
| `laya` | ModernBERT | Muy rápido en CPU y con poca memoria. |

`alvaress install` te pregunta cuál usar, instala Ollama si falta (con
confirmación) y descarga el modelo. Si está instalado pero apagado, intenta
arrancarlo con `ollama serve`. Para cambiarlo después:

```bash
alvaress model               # estado actual
alvaress model list          # modelos instalados en Ollama
alvaress model kev           # cambia el modelo global
alvaress model laya --local  # solo este proyecto
```

La configuración vive en `~/.alvaressconfig.json`:

```json
{
  "decision": {
    "model": "kev",
    "apiBase": "http://127.0.0.1:11434",
    "timeoutMs": 60000,
    "cache": true,
    "cacheTtlMs": 86400000,
    "maxCalls": 3
  }
}
```

Variables de entorno: `ALVARESS_OLLAMA_BASE` (endpoint) y
`ALVARESS_DECISION_MODEL` (modelo). La precedencia es: flag de CLI →
configuración → entorno. Si usas un Ollama remoto con autenticación, define
`decision.apiKey` o `ALVARESS_DECISION_API_KEY`.

### `predict` (sí/no)

```bash
alvaress decide predict \
  --state "Cambio en un solo archivo, función pura y con tests existentes" \
  --question "¿Es seguro implementarlo directamente?" \
  --threshold 0.7
```

Salida:

```json
{"type":"noul","probability":0.93,"threshold":0.7,"pass":true,"model":"kev"}
```

Si la probabilidad no alcanza el umbral, el comando devuelve exit code `1` y la
respuesta se imprime igualmente. Así el agente puede usar el exit code como gate.

### `choose` (elegir entre opciones)

```bash
alvaress decide choose \
  --state "Tres tareas pendientes con archivos definidos" \
  --question "¿Cuál es el siguiente paso más eficiente?" \
  --option "spec=Actualizar la especificación" \
  --option "apply=Ejecutar con Aider" \
  --option "direct=Editar directamente" \
  --min-confidence 0.55
```

Salida:

```json
{"type":"choice","choice":"apply","confidence":0.84,"probabilities":{"spec":0.1,"apply":0.84,"direct":0.06},"minConfidence":0.55,"pass":true,"model":"kev"}
```

### `score` (rúbrica ordenada)

```bash
alvaress decide score \
  --state "Cambio en varios módulos y una migración de base de datos" \
  --question "¿Qué complejidad tiene?" \
  --level "trivial: un archivo" \
  --level "media: varios archivos de un contexto" \
  --level "alta: varios contextos o migraciones"
```

### `ask` (petición completa)

```bash
alvaress decide ask --request-file peticion.json
```

```json
{
  "state": { "tarea": "..." },
  "questions": {
    "clara": { "type": "noul", "instructions": "¿La tarea está bien definida?" },
    "riesgo": { "type": "score", "instructions": "¿Qué riesgo tiene?", "criteria": ["bajo", "medio", "alto"] }
  }
}
```

### `model list` (modelos disponibles)

```bash
alvaress model list
alvaress model list --json
```

### Decisión compuesta con caché

Sin subcomando, una sola llamada resuelve claridad, camino y complejidad. Las
respuestas se cachean en `.harness/cache/decision/` durante 24 h por defecto;
usa `--no-cache` para forzar una llamada nueva.

```bash
alvaress decide --state "Tres tareas pendientes con archivos definidos" --gate
```

- `--gate` devuelve exit code `1` si la claridad o la confianza no superan los
  umbrales.
- `--threshold` (claridad) y `--min-confidence` (camino) ajustan los umbrales.
- `--model kev|laya` sobrescribe el modelo configurado para esa llamada.
- El `state` se redacta antes de enviarse: claves, tokens y contraseñas se
  sustituyen por `[REDACTED_*]`. Usa `--no-redact` solo si controlas el estado.

### Privacidad

El `state` se envía a tu instancia de Ollama. No incluyas claves, tokens, datos
personales ni código propietario completo. Usa un resumen de 1-3 frases. El
prompt del agente `alvaress` ya lo exige y `alvaress` redacta secretos por
defecto.

## Configuración

La configuración se resuelve con precedencia **local sobre global**:

- **Global:** `~/.alvaressconfig.json`
- **Local del proyecto:** `.alvaressrc.json`

Los campos escalares del archivo local sustituyen a los globales; los objetos
`env` se fusionan (el local gana en claves repetidas). Si un campo no existe en
ninguno de los dos, se aplica el valor por defecto.

```json
{
  "obsidianVaultPath": "/ruta/a/tu/boveda/obsidian",
  "packageManager": "pnpm",
  "scope": "warn",
  "graphify": { "autoUpdate": false },
  "aider": { "timeoutMs": 600000, "extraArgs": [], "inheritEnv": true },
  "decision": {
    "model": "kev",
    "apiBase": "http://127.0.0.1:11434",
    "timeoutMs": 60000,
    "cache": true,
    "cacheTtlMs": 86400000,
    "maxCalls": 3
  },
  "models": {
    "aiderImplementer": {
      "modelName": "deepseek/deepseek-chat",
      "apiKey": "sk-deepseek",
      "apiBase": "",
      "env": { "DEEPSEEK_API_KEY": "sk-deepseek" }
    }
  },
  "validation": {
    "maxAttempts": 3,
    "commands": [
      "pnpm exec oxlint --deny=correctness --deny=suspicious",
      "pnpm exec tsc --noEmit"
    ]
  }
}
```

Valores por defecto:

| Campo | Valor |
| --- | --- |
| `decision.model` | `kev` |
| `decision.apiBase` | `http://127.0.0.1:11434` |
| `decision.timeoutMs` | `60000` (1 min) |
| `decision.cacheTtlMs` | `86400000` (24 h) |
| `models.aiderImplementer.modelName` | `deepseek/deepseek-chat` |
| `packageManager` | `pnpm` |
| `scope` | `warn` |
| `aider.timeoutMs` | `600000` (10 min) |
| `validation.maxAttempts` | `3` |
| `validation.commands` | `pnpm exec oxlint --deny=correctness --deny=suspicious`, `pnpm exec tsc --noEmit` |

El implementador recibe `DEEPSEEK_API_KEY` y `OPENAI_API_KEY` con `apiKey`, y
`OPENAI_API_BASE` con `apiBase`. Las variables de `env` se añaden al subproceso
de Aider.

`alvaress config show` enmascara `apiKey` y las variables de entorno cuyo nombre
contiene `KEY`, `TOKEN`, `SECRET` o `PASS`.

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

Estados admitidos:

- **Spec:** `Proposed`, `Verified`, `Archived`, `Failed`.
- **Tarea:** `Pending`, `InProgress`, `Done`, `Failed`.

Los ids de specs y tareas solo admiten letras, números, punto, guion y guion
bajo. Los ids de tarea deben ser únicos en todo el manifiesto.

## Cómo funciona `apply`

1. Adquiere el lock `.harness/lock` y crea un backup de `openspec.yaml`.
2. Lee las tareas `Pending` (o los ids indicados) y las agrupa.
3. Las tareas del mismo `context` o que comparten archivos (incluidos archivos
   dentro de un mismo directorio) se ejecutan **secuencialmente**, respetando
   `depends_on` y `priority`.
4. Los grupos aislados se ejecutan **en paralelo** con `Promise.all`.
5. Para cada tarea genera `.harness/tasks/<TASK_ID>.md`, la marca como
   `InProgress` y llama a Aider con el mensaje de la tarea y los archivos
   asignados.
6. Al terminar Aider, comprueba el alcance del diff y ejecuta la validación
   local. Si falla, lanza un bucle de reparación con Aider hasta
   `validation.maxAttempts`.
7. Actualiza la tarea a `Done` o `Failed`, recalcula el estado del spec y
   escribe el reporte en `.harness/runs/`.

El agente `alvaress` usa `apply --dry-run` antes de lanzar un lote y elige solo
las tareas necesarias. Para cambios triviales evita Aider y edita directamente.

## Skills

El instalador escribe cinco skills en `.harness/skills/<nombre>/SKILL.md` y crea
enlaces simbólicos en:

- `~/.config/opencode/skills/<nombre>`
- `~/.claude/skills/<nombre>`

Skills incluidas:

| Skill | Qué hace |
| --- | --- |
| `read-spec-first` | Obliga a leer la especificación antes de programar. |
| `consult-graphify-ast` | Evita lecturas masivas de código y prioriza Graphify. |
| `self-healing-verify` | Exige validar con oxlint y TypeScript tras cada edición. |
| `universal-design-patterns` | Fuerza patrones de diseño y prohíbe comentarios en el código generado. |
| `obsidian-sdd` | Define en qué fases del flujo SDD usa Obsidian el orquestador y qué pueden hacer los subagentes (solo lectura). |

Claude Code consume las mismas skills y los mismos artefactos SDD; el agente
`alvaress` es nativo de OpenCode.

## Obsidian

Al seleccionar el componente Obsidian, `alvaress install`:

1. Comprueba si Obsidian está instalado (binario, escritorio, Flatpak, Snap,
   AppImage, `.app` de macOS o instalación de Windows).
2. Si no lo está, intenta instalarlo con dependencias:
   - **Linux:** Flatpak de usuario si está disponible; si no, descarga el
     `tar.gz` oficial, lo extrae en `~/.local/opt/obsidian` y crea un lanzador
     en `~/.local/bin/obsidian`.
   - **macOS:** Homebrew (`brew install --cask obsidian`) o el DMG oficial.
   - **Windows:** `winget`.
3. Usa la bóveda global configurada o `~/Obsidian`, la crea si no existe y la
   conecta al proyecto.

Si la instalación automática falla, el instalador avisa y continúa: la bóveda
se crea igualmente y puedes instalar Obsidian después desde
[obsidian.md/download](https://obsidian.md/download).

`alvaress init` también conecta la bóveda cuando `obsidianVaultPath` ya está
configurado. Dentro de la bóveda se crea:

```text
Harness/
├── Tasks -> <proyecto>/.harness/tasks
├── openspec.yaml -> <proyecto>/openspec.yaml
└── <proyecto>.md
```

La nota incluye enlaces a las tareas y al manifiesto. Obsidian es un espejo del
estado SDD: el agente escribe siempre en `.harness/tasks/` y `openspec.yaml`, y
la bóveda refleja los cambios mediante enlaces simbólicos. No hay que
sincronizar nada a mano ni duplicar contenido.

### Uso en el flujo SDD

La skill `obsidian-sdd` define el uso por fase:

| Fase | Orquestador | Subagentes |
| --- | --- | --- |
| 1 · Entender | Ejecuta `alvaress obsidian status` y lee la nota del proyecto para recuperar contexto, decisiones y riesgos. | Los de exploración pueden leer la nota y los enlaces. |
| 2 · Decidir | Usa la nota para resumir el estado que envía al modelo de decisión. Sin secretos. | No consultan el modelo de decisión ni escriben en la bóveda. |
| 3 · Ejecutar | Escribe en `.harness/tasks/` y `openspec.yaml`. | Escriben solo en el proyecto; la bóveda es de solo lectura. |
| 4 · Validar | Ejecuta la validación local. | Ejecutan los comandos locales y no tocan la bóveda. |
| 5 · Cerrar | Registra el cierre con `alvaress obsidian note`. | Devuelven el resultado al orquestador. |

Reglas clave:

- Solo el orquestador actualiza la nota, y siempre con `alvaress obsidian note`;
  nunca editando `<bóveda>/Harness/` a mano.
- Los subagentes reciben la instrucción explícita de no escribir en la bóveda.
- Si no hay bóveda configurada, el flujo continúa sin ella.
- No se crea una nota por tarea: se usa la nota del proyecto y los enlaces
  `[[Tasks/...]]`.

### Comandos de Obsidian

```bash
alvaress obsidian status
alvaress obsidian sync
alvaress obsidian note \
  --task TASK-01 \
  --summary "Qué cambió" \
  --validation "pnpm test: 141/141" \
  --risk "Riesgos pendientes" \
  --next "Siguiente paso"

alvaress obsidian note --from-run latest --task TASK-01
```

- `status` muestra en JSON la bóveda configurada, si existe, la ruta de la nota
  y los enlaces.
- `sync` crea o repara la estructura `Harness/`, la nota y los enlaces.
- `note` exige `--summary` y añade una entrada a la sección `## Registro` de la
  nota del proyecto.

## Confiabilidad y seguridad

- **Lock global** en `.harness/lock`: impide dos `apply` simultáneos. Si el PID
  dueño ya no existe o el lock supera 4 h, se considera huérfano; `--force` lo
  reemplaza de forma explícita.
- **Escritura atómica** de `openspec.yaml`, reportes, caché y nota de Obsidian
  mediante archivo temporal + `rename`.
- **Backups** del manifiesto en `.harness/backups/` antes de cada `apply` y
  `archive`. `alvaress restore latest` recupera el último.
- **Reportes de ejecución** en `.harness/runs/<id>-apply.json` con estado,
  duración, archivos, alcance y validación de cada tarea. Los logs de Aider se
  guardan junto al reporte.
- **Control de alcance** con `git status`: `scope: "strict"` falla la tarea si
  Aider toca archivos fuera de los asignados; `"warn"` (por defecto) solo avisa;
  `"off"` lo desactiva.
- **Timeout de Aider** configurable (`aider.timeoutMs`, 10 min por defecto) con
  terminación `SIGTERM` y luego `SIGKILL`.
- **Entorno saneado** para Aider: no hereda credenciales de Ollama, npm ni GitHub.
- **Caché de decisión** por hash de la petición y TTL configurable
  (`decision.cacheTtlMs`).
- **Frescura de Graphify** comprobada por `doctor`; `apply --update-graph` o
  `graphify.autoUpdate: true` lo actualizan al terminar.
- **Permisos estrictos** en el agente y los subagentes: shell con allowlist,
  `git push`/`reset --hard`/`rm -rf` denegados y bóveda de solo lectura para
  subagentes.
- **Redacción de secretos** antes de enviar al modelo de decisión y al escribir
  la nota de Obsidian.
- **CI** con pnpm en Node 20/22/24 y release con `pnpm publish --provenance`.

## Diagramas

El diagrama de este README se dibujó con la skill
[`svg-diagram`](https://github.com/bybit-exchange/svg-diagram), incluida solo
para este proyecto en `.agents/skills/svg-diagram`. El SVG vive en
`assets/alvaress-flow.svg`.

El logo está en `assets/alvaress-logo.svg` y la animación del nombre en
`assets/alvaress-intro.gif`.

Si cambias el flujo, actualiza el SVG y valida que siga el estilo de la casa:

```bash
node .agents/skills/svg-diagram/tools/svg-lint/bin/svg-lint.mjs assets/alvaress-flow.svg
```

El linter no debe reportar errores ni advertencias.

## Commits

El repositorio usa **Conventional Commits** y los valida con husky + commitlint:

- `pre-commit`: lint-staged ejecuta `oxlint` solo sobre los archivos TS/JS staged.
- `commit-msg`: commitlint rechaza mensajes que no sigan el formato.
- CI valida los commits de cada pull request.

Formato:

```text
<tipo>(<scope opcional>): <descripción corta>
```

Tipos habituales: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`,
`ci`, `perf` y `style`.

```bash
git commit -m "feat(decision): añadir caché de decisiones"
git commit -m "fix(apply): liberar el lock al fallar"
```

Validar un rango manualmente:

```bash
pnpm run commitlint --from HEAD~3 --to HEAD
```

## Desarrollo

```bash
pnpm install
pnpm run validate   # lint + typecheck de src y test
pnpm test           # build + pruebas con node:test y tsx
pnpm run build      # compila a dist/
```

Pruebas incluidas:

- configuración, manifiesto, agrupación y colisiones;
- argumentos, utilidades de FS, enlaces simbólicos y skills;
- verificación y bucle self-healing con Aider simulado;
- `apply` con grupos paralelos/secuenciales, fallos y dry-run;
- cliente de decisión y comandos `decide`/`predict`/`choose`/`score`/`ask` con
  `fetch` simulado;
- selección de modelo (`model status|list|kev|laya`) y detección de Ollama;
- caché de decisión, redacción de secretos, lock, backups, reportes y alcance
  del diff;
- `doctor`, `report`, `restore`, `archive` y subagentes;
- detección e instalación de Obsidian, bóveda, nota y comandos `obsidian`;
- instalación del agente global, de proyecto y de subagentes;
- instalación automática de pipx y de las dependencias de Python;
- CLI de extremo a extremo con `dist/`.

## Estructura del paquete

```text
src/
├── cli.ts
├── agent/           prompt, subagentes e instalación
├── commands/        install, init, agent, decide, model, obsidian, skills, config, doctor, report, restore, archive
├── config/          loader con precedencia global/local
├── decision/        cliente de Ollama System One, detección y caché
├── graphify/        estado y actualización del grafo
├── openspec/        manifiesto y tipos
├── orchestrator/    agrupación, Aider, verificación, apply, backups, reportes y alcance
├── skills/          definición e instalación de skills
├── obsidian/        conexión con la bóveda
└── utils/           args, errores, FS, lock, gestor de paquetes, pipx, redacción, logger y procesos
test/                pruebas con node:test
assets/              logo, animación y diagramas SVG del README
.agents/skills/      skills locales del proyecto (svg-diagram)
docs/spec.md         prompt original de generación del proyecto
```

## Licencia

MIT. Consulta [LICENSE](LICENSE).
