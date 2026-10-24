# alvaress

Orquestador **Spec-Driven Development (SDD)** para [OpenCode](https://opencode.ai) que
decide con [JEV](https://typesafe.ai), ejecuta con [Aider](https://aider.chat) cuando
conviene y valida cada cambio con las herramientas locales del proyecto.

`alvaress` instala un agente de OpenCode llamado **`alvaress`**, sus skills y la
configuración necesaria para trabajar sobre [OpenSpec](https://github.com/Fission-AI/OpenSpec),
[Obsidian](https://obsidian.md) y [Graphify](https://github.com/Graphify-Labs/graphify).

La idea es la de Gentle AI: no sustituir a tu agente, sino darle un entorno de
trabajo determinista. En OpenCode seleccionas `alvaress` y él decide cuándo crear
una spec, cuándo delegar en Aider, cuándo editar directamente y cuándo validar.

## Cómo encaja todo

```text
Usuario
  │
  ▼
OpenCode · agente alvaress
  ├─ JEV (TypeSafe)        decisiones tipadas y probabilidades
  ├─ Graphify              localizar código sin leer el repo entero
  ├─ OpenSpec              openspec.yaml + .harness/tasks/*.md
  ├─ Aider                 ejecución de tareas SDD y reparaciones
  ├─ Obsidian (opcional)   espejo de solo lectura del estado SDD
  └─ Validación local      oxlint + tsc (configurable)
```

JEV no genera texto: recibe un `state` y preguntas tipadas (`noul`, `choice`,
`score`) y devuelve probabilidades calibradas. `alvaress` lo usa para decidir si
la solicitud está clara, qué camino tomar y qué complejidad tiene el cambio.
Si no hay API key de TypeSafe, el agente sigue funcionando con heurísticas.

## Requisitos

- Node.js 20 o superior y npm.
- Git recomendado; el instalador detecta repositorios por `.git` o `package.json`.
- `aider` en el `PATH` para ejecutar tareas con Aider.
- Opcional: `pipx` y Python para que el instalador instale `aider-chat` y `graphify`.
- Opcional: una API key de TypeSafe para usar JEV.
- Opcional: Obsidian. El instalador lo detecta y, si falta, intenta instalarlo y
  crea la bóveda global (`~/Obsidian` por defecto).

## Instalación

```bash
npm install -g alvaress
```

También puedes ejecutarlo sin instalación global:

```bash
npx alvaress --help
```

## Inicio rápido

```bash
# 1. Instalador interactivo: agente, skills, componentes y configuración
alvaress install

# 2. Inicializa el proyecto (manifiesto, tareas, skills y agente local)
alvaress init

# 3. Abre OpenCode en el proyecto y selecciona el agente alvaress
opencode
#    Pulsa Tab hasta ver "alvaress" o ejecuta:
opencode run --agent alvaress "Implementa la tarea TASK-01 siguiendo la spec"
```

Dentro de OpenCode, el agente `alvaress` ya sabe qué hacer:

```text
Implementa la próxima tarea pendiente de openspec.yaml.
```

Él leerá la spec, consultará a JEV si hace falta, ejecutará Aider o editará
directamente, validará y actualizará el estado de la tarea.

## El agente `alvaress`

El instalador escribe el agente en dos sitios:

- Global: `~/.config/opencode/agents/alvaress.md`
- Proyecto: `.opencode/agents/alvaress.md`

Es un agente `primary`, seleccionable con **Tab** en OpenCode o con
`opencode run --agent alvaress`. No cambia tu agente por defecto.

Su prompt incluye:

- El flujo SDD obligatorio: entender → decidir → ejecutar → validar → cerrar.
- El uso de JEV en los puntos de decisión (máximo 3 llamadas por solicitud).
- La política de ejecución: Aider para tareas SDD y cambios multi-archivo;
  edición directa para cambios triviales.
- La prohibición de enviar secretos o código completo a JEV.
- Reglas de eficiencia de tokens: Graphify antes de `grep`/`read`, lecturas
  localizadas y resúmenes en lugar de logs completos.

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
| `alvaress install` | Instalador interactivo de agente, Obsidian, Graphify, Aider y dependencias de validación. Detecta o instala Obsidian, crea la bóveda si falta, y genera la configuración global y, si procede, la local y `openspec.yaml`. |
| `alvaress init [--no-link]` | Crea `.harness/tasks`, `.harness/skills`, `openspec.yaml` (si falta), las skills y el agente del proyecto. Si `obsidianVaultPath` está configurado, conecta la bóveda. Con `--no-link` no crea enlaces ni agente global. |
| `alvaress apply [TASK...] [--dry-run]` | Ejecuta las tareas pendientes (o los ids indicados) con Aider. `--dry-run` muestra los grupos sin invocar a Aider ni modificar el manifiesto. |
| `alvaress verify <TASK_ID>` | Ejecuta los comandos de validación y, si fallan, pide a Aider una reparación automática. |
| `alvaress skills [--no-link]` | Reinstala las skills del proyecto y sus enlaces globales. |
| `alvaress agent [install\|show]` | Instala el agente `alvaress` en OpenCode o imprime su prompt. |
| `alvaress obsidian [status\|sync\|note]` | Consulta la bóveda y la nota del proyecto (`status`), las crea o repara (`sync`), o registra el cierre de una tarea en la nota (`note`). |
| `alvaress jev <predict\|choose\|score\|ask>` | Consulta las decisiones tipadas de JEV. |
| `alvaress config [show\|paths]` | Muestra la configuración resuelta (con secretos enmascarados) o las rutas de configuración. |

Códigos de salida: `0` éxito, `1` error o tarea fallida, `2` error de JEV, `130`
operación cancelada.

## JEV

`alvaress` habla directamente con la API System One de TypeSafe; no necesitas
instalar el CLI `jev` ni Rust.

Configura la API key en `~/.alvaressconfig.json`:

```json
{
  "models": {
    "jevOrchestrator": {
      "modelName": "jev-latest",
      "apiKey": "tu-api-key-de-typesafe",
      "apiBase": "https://api.typesafe.ai/v1",
      "env": {
        "TYPESAFE_API_KEY": "tu-api-key-de-typesafe"
      }
    }
  }
}
```

También puedes usar la variable de entorno `TYPESAFE_API_KEY`. La precedencia es:
flag de CLI → configuración → entorno.

### `predict` (sí/no)

```bash
alvaress jev predict \
  --state "Cambio en un solo archivo, función pura y con tests existentes" \
  --question "¿Es seguro implementarlo directamente?" \
  --threshold 0.7
```

Salida:

```json
{"type":"noul","probability":0.93,"threshold":0.7,"pass":true,"model":"jev-1.13.0"}
```

Si la probabilidad no alcanza el umbral, el comando devuelve exit code `1` y la
respuesta se imprime igualmente. Así el agente puede usar el exit code como gate.

### `choose` (elegir entre opciones)

```bash
alvaress jev choose \
  --state "Tres tareas pendientes con archivos definidos" \
  --question "¿Cuál es el siguiente paso más eficiente?" \
  --option "spec=Actualizar la especificación" \
  --option "apply=Ejecutar con Aider" \
  --option "direct=Editar directamente" \
  --min-confidence 0.55
```

Salida:

```json
{"type":"choice","choice":"apply","confidence":0.84,"probabilities":{"spec":0.1,"apply":0.84,"direct":0.06},"minConfidence":0.55,"pass":true,"model":"jev-1.13.0"}
```

### `score` (rubrica ordenada)

```bash
alvaress jev score \
  --state "Cambio en varios módulos y una migración de base de datos" \
  --question "¿Qué complejidad tiene?" \
  --level "trivial: un archivo" \
  --level "media: varios archivos de un contexto" \
  --level "alta: varios contextos o migraciones"
```

### `ask` (petición completa)

```bash
alvaress jev ask --request-file peticion.json
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

### `models` (modelos disponibles)

```bash
alvaress jev models
alvaress jev models --format text
```

### Privacidad

El `state` se envía a la API de TypeSafe. No incluyas claves, tokens, datos
personales ni código propietario completo. Usa un resumen de 1-3 frases. El
prompt del agente `alvaress` ya lo exige.

## Configuración

La configuración se resuelve con precedencia **local sobre global**:

- Global: `~/.alvaressconfig.json`
- Local del proyecto: `.alvaressrc.json`

Los campos escalares del archivo local sustituyen a los globales; los objetos
`env` se fusionan (el local gana en claves repetidas). Si un campo no existe en
ninguno de los dos, se aplica el valor por defecto.

```json
{
  "obsidianVaultPath": "/ruta/a/tu/boveda/obsidian",
  "models": {
    "jevOrchestrator": {
      "modelName": "jev-latest",
      "apiKey": "sk-typesafe",
      "apiBase": "https://api.typesafe.ai/v1",
      "env": { "TYPESAFE_API_KEY": "sk-typesafe" }
    },
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
      "npx oxlint --deny=correctness --deny=suspicious",
      "npx tsc --noEmit"
    ]
  }
}
```

Valores por defecto:

| Campo | Valor |
| --- | --- |
| `models.jevOrchestrator.modelName` | `jev-latest` |
| `models.jevOrchestrator.apiBase` | `https://api.typesafe.ai/v1` |
| `models.aiderImplementer.modelName` | `deepseek/deepseek-chat` |
| `validation.maxAttempts` | `3` |
| `validation.commands` | `npx oxlint --deny=correctness --deny=suspicious`, `npx tsc --noEmit` |

El implementador recibe `DEEPSEEK_API_KEY` y `OPENAI_API_KEY` con `apiKey`, y
`OPENAI_API_BASE` con `apiBase`. Las variables de `env` se añaden al subproceso de
Aider.

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
        files:
          - "src/billing/repositories/invoice.repository.ts"
```

Estados admitidos:

- Spec: `Proposed`, `Verified`, `Archived`, `Failed`.
- Tarea: `Pending`, `InProgress`, `Done`, `Failed`.

Los ids de specs y tareas solo admiten letras, números, punto, guion y guion bajo.
Los ids de tarea deben ser únicos en todo el manifiesto.

## Cómo funciona `apply`

1. Lee las tareas con estado `Pending` (o los ids indicados) y las agrupa.
2. Las tareas del mismo `context` o que comparten archivos (incluidos archivos
   dentro de un mismo directorio) se ejecutan **secuencialmente**.
3. Los grupos aislados se ejecutan **en paralelo** con `Promise.all`.
4. Para cada tarea genera `.harness/tasks/<TASK_ID>.md`, marca la tarea como
   `InProgress` y llama a Aider con el mensaje de la tarea y los archivos asignados.
5. Al terminar Aider, ejecuta la validación local. Si falla, lanza un bucle de
   reparación con Aider hasta `validation.maxAttempts`.
6. Actualiza la tarea a `Done` o `Failed` y recalcula el estado del spec.

El agente `alvaress` usa `apply --dry-run` antes de lanzar un lote y elige solo
las tareas necesarias. Para cambios triviales evita Aider y edita directamente.

## Skills

El instalador escribe cinco skills en `.harness/skills/<nombre>/SKILL.md` y crea
enlaces simbólicos en:

- `~/.config/opencode/skills/<nombre>`
- `~/.claude/skills/<nombre>`

Skills incluidas:

- `read-spec-first`: obliga a leer la especificación antes de programar.
- `consult-graphify-ast`: evita lecturas masivas de código y prioriza Graphify.
- `self-healing-verify`: exige validar con oxlint y TypeScript tras cada edición.
- `universal-design-patterns`: fuerza patrones de diseño y prohíbe comentarios en el
  código generado.
- `obsidian-sdd`: define en qué fases del flujo SDD usa Obsidian el orquestador y
  qué pueden hacer los subagentes (solo lectura).

Claude Code consume las mismas skills y los mismos artefactos SDD; el agente
`alvaress` es nativo de OpenCode.

## Obsidian

Al seleccionar el componente Obsidian, `alvaress install`:

1. Comprueba si Obsidian está instalado (binario, escritorio, Flatpak, Snap,
   AppImage, `.app` de macOS o instalación de Windows).
2. Si no lo está, intenta instalarlo con dependencias:
   - Linux: Flatpak de usuario si está disponible; si no, descarga el `tar.gz`
     oficial, lo extrae en `~/.local/opt/obsidian` y crea un lanzador en
     `~/.local/bin/obsidian`.
   - macOS: Homebrew (`brew install --cask obsidian`) o el DMG oficial.
   - Windows: `winget`.
3. Usa la bóveda global configurada o `~/Obsidian`, la crea si no existe y la
   conecta al proyecto.

Si la instalación automática falla, el instalador avisa y continúa: la bóveda se
crea igualmente y puedes instalar Obsidian después desde
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
estado SDD: el agente escribe siempre en `.harness/tasks/` y `openspec.yaml`, y la
bóveda refleja los cambios mediante enlaces simbólicos. No hay que sincronizar
nada a mano ni duplicar contenido.

### Uso en el flujo SDD

La skill `obsidian-sdd` define el uso por fase:

| Fase | Orquestador | Subagentes |
| --- | --- | --- |
| 1 · Entender | Ejecuta `alvaress obsidian status` y lee la nota del proyecto para recuperar contexto, decisiones y riesgos. | Los de exploración pueden leer la nota y los enlaces. |
| 2 · Decidir | Usa la nota para resumir el estado que envía a JEV. Sin secretos. | No consultan JEV ni escriben en la bóveda. |
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
  --validation "npm test: 123/123" \
  --risk "Riesgos pendientes" \
  --next "Siguiente paso"
```

- `status` muestra en JSON la bóveda configurada, si existe, la ruta de la nota y
  los enlaces.
- `sync` crea o repara la estructura `Harness/`, la nota y los enlaces.
- `note` exige `--summary` y añade una entrada a la sección `## Registro` de la
  nota del proyecto.

## Desarrollo

```bash
npm install
npm run validate   # lint + typecheck de src y test
npm test           # build + pruebas con node:test y tsx
npm run build      # compila a dist/
```

Pruebas incluidas:

- Configuración, manifiesto, agrupación y colisiones.
- Argumentos, utilidades de FS, enlaces simbólicos y skills.
- Verificación y bucle self-healing con Aider simulado.
- `apply` con grupos paralelos/secuenciales, fallos y dry-run.
- Cliente JEV y comandos `predict`/`choose`/`score`/`ask` con `fetch` simulado.
- Detección e instalación de Obsidian, bóveda, nota y comandos `obsidian`.
- Instalación del agente global y de proyecto.
- CLI de extremo a extremo con `dist/`.

## Estructura del paquete

```text
src/
├── cli.ts
├── agent/           prompt e instalación del agente alvaress
├── commands/        install, init, agent, jev, obsidian, skills, config
├── config/          loader con precedencia global/local
├── jev/             cliente de TypeSafe System One
├── openspec/        manifiesto y tipos
├── orchestrator/    agrupación, Aider, verificación y apply
├── skills/          definición e instalación de skills
├── obsidian/        conexión con la bóveda
└── utils/           args, errores, FS, logger, procesos y prompts
test/                pruebas con node:test
docs/spec.md         prompt original de generación del proyecto
```

## Licencia

MIT. Consulta [LICENSE](LICENSE).
