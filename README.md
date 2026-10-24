# alvaress

Orquestador **Spec-Driven Development (SDD)** para [OpenCode](https://opencode.ai) que
decide con modelos locales [kev o laya](https://ollama.com/search?c=decision) servidos
por [Ollama](https://ollama.com), ejecuta con [Aider](https://aider.chat) cuando
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
  ├─ kev / laya (Ollama)   decisiones tipadas y probabilidades
  ├─ Graphify              localizar código sin leer el repo entero
  ├─ OpenSpec              openspec.yaml + .harness/tasks/*.md
  ├─ Aider                 ejecución de tareas SDD y reparaciones
  ├─ Obsidian (opcional)   espejo de solo lectura del estado SDD
  └─ Validación local      oxlint + tsc (configurable)
```

`kev` y `laya` no generan texto: reciben un `state` y preguntas tipadas (`noul`,
`choice`, `score`) y devuelven probabilidades calibradas. `alvaress` los usa para
decidir si la solicitud está clara, qué camino tomar y qué complejidad tiene el
cambio. Si Ollama no está disponible, el agente sigue funcionando con heurísticas.

## Requisitos

Solo hay dos dependencias que debes instalar tú; el resto lo resuelve
`alvaress install`:

- **Node.js 20 o superior** y **pnpm** (gestor por defecto; npm solo si el
  proyecto lo exige).
- **pipx** (con Python 3.10+) para que el instalador pueda instalar Aider y
  Graphify. Si no está, el instalador se detiene y te dice cómo instalarlo.

El instalador se encarga de lo demás:

- **Aider**: instala `aider-chat` con `pipx` si falta.
- **Graphify**: instala el paquete `graphifyy` con `pipx` si falta.
- **Ollama**: lo instala si falta (brew, winget o el script oficial de Linux),
  lo arranca si está apagado y descarga el modelo elegido (`kev` o `laya`).
  `kev` necesita Ollama 0.40.4 o superior; `laya`, 0.40.0 o superior.
- **Obsidian**: lo detecta y, si falta, intenta instalarlo; la bóveda se crea
  igualmente (`~/Obsidian` por defecto).
- **Oxlint, TypeScript y `@types/node`** en el proyecto, si hay `package.json`.

Git es recomendado: el instalador detecta repositorios por `.git` o
`package.json`.

## Instalación

```bash
pnpm add -g alvaress
```

También puedes ejecutarlo sin instalación global:

```bash
pnpm dlx alvaress --help
```

### Instalación desatendida

`alvaress install --yes` selecciona todos los componentes, usa la configuración
existente o los valores por defecto y no hace ninguna pregunta. Instala lo que
falte (Aider, Graphify, Ollama y el modelo de decisión), crea `openspec.yaml` si
el proyecto es un repositorio y no crea `.alvaressrc.json`. Si no hay API key del
implementador, avisa al terminar para que la añadas antes de usar Aider.

## Inicio rápido

```bash
# 1. Instalador interactivo: agente, skills, componentes y configuración
#    Elige kev o laya cuando te pregunte por el modelo de decisión.
alvaress install

# Sin preguntas (CI o setup desatendido): instala todo con los valores actuales
# o los defaults, incluido Ollama y el modelo de decisión.
alvaress install --yes

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

Él leerá la spec, consultará el modelo de decisión si hace falta, ejecutará Aider
o editará directamente, validará y actualizará el estado de la tarea.

## El agente `alvaress`

El instalador escribe el agente en dos sitios:

- Global: `~/.config/opencode/agents/alvaress.md`
- Proyecto: `.opencode/agents/alvaress.md`

Es un agente `primary`, seleccionable con **Tab** en OpenCode o con
`opencode run --agent alvaress`. No cambia tu agente por defecto.

Además instala tres subagentes `subagent` en la misma carpeta:

- `alvaress-explorer`: solo lectura, para localizar código y contexto.
- `alvaress-implementer`: implementa una tarea SDD dentro de un alcance cerrado.
- `alvaress-verifier`: ejecuta la validación y devuelve el error exacto sin editar.

Los tres tienen la bóveda Obsidian como solo lectura y no pueden hacer `git push`,
`git reset --hard` ni `rm -rf`. El orquestador es el único que ejecuta
`alvaress apply`, `alvaress obsidian note` y `alvaress archive`.

Su prompt incluye:

- El flujo SDD obligatorio: entender → decidir → ejecutar → validar → cerrar.
- El uso del modelo de decisión (kev o laya) en los puntos de decisión (máximo 3
  llamadas por solicitud).
- La política de ejecución: Aider para tareas SDD y cambios multi-archivo;
  edición directa para cambios triviales.
- La prohibición de enviar secretos o código completo al modelo de decisión.
- Reglas de eficiencia de tokens: Graphify antes de `grep`/`read`, lecturas
  localizadas y resúmenes en lugar de logs completos.
- Personalidad amigable, con modismos mexicanos ligeros y ocasionales, y
  respuestas cortas por defecto: estado, cambios principales y validación. El
  detalle solo se explica si el usuario lo pide.

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
| `alvaress install [--yes]` | Instalador de agente, Obsidian, Graphify, Aider, Ollama, modelo de decisión y dependencias de validación. Detecta o instala lo que falte, crea la bóveda, y genera la configuración global y, si procede, la local y `openspec.yaml`. `--yes` no pregunta nada. |
| `alvaress init [--no-link]` | Crea `.harness/tasks`, `.harness/skills`, `openspec.yaml` (si falta), las skills y el agente del proyecto. Si `obsidianVaultPath` está configurado, conecta la bóveda. Con `--no-link` no crea enlaces ni agente global. |
| `alvaress apply [TASK...] [--dry-run] [--force] [--update-graph]` | Ejecuta las tareas pendientes (o los ids indicados) con Aider. `--dry-run` muestra los grupos sin invocar a Aider ni modificar el manifiesto. `--force` ignora un lock huérfano y `--update-graph` actualiza Graphify al terminar. |
| `alvaress verify <TASK_ID>` | Ejecuta los comandos de validación (los de la tarea o los del proyecto) y, si fallan, pide a Aider una reparación automática. |
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

Códigos de salida: `0` éxito, `1` error o tarea fallida, `2` error del modelo de
decisión u Ollama, `130` operación cancelada.

## Modelo de decisión (kev o laya)

`alvaress` habla con el endpoint `/v1/systemone` de Ollama. No hay API key ni
servicio remoto: el modelo corre en tu máquina. Elige uno:

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

### `score` (rubrica ordenada)

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
respuestas se cachean en `.harness/cache/decision/` durante 24 h por defecto; usa
`--no-cache` para forzar una llamada nueva.

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
prompt del agente `alvaress` ya lo exige y `alvaress` redacta secretos por defecto.

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
- **Redacción de secretos** antes de enviar al modelo de decisión y al escribir la
  nota de Obsidian.
- **CI** con pnpm en Node 20/22/24 y release con `pnpm publish --provenance`.

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
        priority: 10
        estimate: "30m"
        depends_on: ["TASK-00"]
        validation:
          - "pnpm exec tsc --noEmit"
        rollback: "Revertir el repositorio y la migración"
        files:
          - "src/billing/repositories/invoice.repository.ts"
```

`depends_on` ordena la ejecución real dentro del grupo; `validation` sustituye a
los comandos globales para esa tarea; `priority` ordena tareas independientes;
`estimate` y `rollback` documentan coste y vuelta atrás.

Estados admitidos:

- Spec: `Proposed`, `Verified`, `Archived`, `Failed`.
- Tarea: `Pending`, `InProgress`, `Done`, `Failed`.

Los ids de specs y tareas solo admiten letras, números, punto, guion y guion bajo.
Los ids de tarea deben ser únicos en todo el manifiesto.

## Cómo funciona `apply`

1. Adquiere el lock `.harness/lock` y crea un backup de `openspec.yaml`.
2. Lee las tareas con estado `Pending` (o los ids indicados) y las agrupa.
3. Las tareas del mismo `context` o que comparten archivos (incluidos archivos
   dentro de un mismo directorio) se ejecutan **secuencialmente**, respetando
   `depends_on` y `priority`.
4. Los grupos aislados se ejecutan **en paralelo** con `Promise.all`.
5. Para cada tarea genera `.harness/tasks/<TASK_ID>.md`, marca la tarea como
   `InProgress` y llama a Aider con el mensaje de la tarea y los archivos asignados.
6. Al terminar Aider, comprueba el alcance del diff y ejecuta la validación local.
   Si falla, lanza un bucle de reparación con Aider hasta `validation.maxAttempts`.
7. Actualiza la tarea a `Done` o `Failed`, recalcula el estado del spec y escribe
   el reporte en `.harness/runs/`.

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

- `status` muestra en JSON la bóveda configurada, si existe, la ruta de la nota y
  los enlaces.
- `sync` crea o repara la estructura `Harness/`, la nota y los enlaces.
- `note` exige `--summary` y añade una entrada a la sección `## Registro` de la
  nota del proyecto.

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

- Configuración, manifiesto, agrupación y colisiones.
- Argumentos, utilidades de FS, enlaces simbólicos y skills.
- Verificación y bucle self-healing con Aider simulado.
- `apply` con grupos paralelos/secuenciales, fallos y dry-run.
- Cliente de decisión y comandos `decide`/`predict`/`choose`/`score`/`ask` con `fetch` simulado.
- Selección de modelo (`model status|list|kev|laya`) y detección de Ollama.
- Caché de decisión, redacción de secretos, lock, backups, reportes y alcance del diff.
- `doctor`, `report`, `restore`, `archive` y subagentes.
- Detección e instalación de Obsidian, bóveda, nota y comandos `obsidian`.
- Instalación del agente global, de proyecto y de subagentes.
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
└── utils/           args, errores, FS, lock, gestor de paquetes, redacción, logger y procesos
test/                pruebas con node:test
docs/spec.md         prompt original de generación del proyecto
```

## Licencia

MIT. Consulta [LICENSE](LICENSE).
