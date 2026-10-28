# SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

> **Nota histórica.** Este documento es el prompt original con el que se generó el
> proyecto. La arquitectura vigente es un arnés híbrido **SDD + ODD** que usa
> `Laya` como motor de decisión local, [Vite-Plus](https://vite.plus) para
> validar y **subagentes de código** por defecto (Aider queda como worker legacy
> opcional, no como dependencia).
> Los ejemplos de configuración que aparecen más abajo son históricos y pueden
> no coincidir con el esquema actual. Consulta el [README](../README.md) y
> [docs/subagents.md](./subagents.md) para la referencia viva.

Actúa como un Ingeniero de Software Principal experto en Herramientas de CLI Core y Automatización de Agentes de IA. Tu objetivo es generar el código fuente completo en TypeScript (compatible con Node.js/Bun) para una herramienta CLI open-source llamada `alvaress`.

Esta herramienta automatiza el ciclo de desarrollo híbrido **SDD + ODD** bajo el estándar OpenSpec, integrando Obsidian como frontend, Graphify como mapa de código, `Laya` como motor de decisión local, Vite-Plus como compuerta de validación y subagentes especializados como ejecutores (con Aider como baseline legacy opcional).

---

## 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS)
El sistema debe ser capaz de inicializar, leer y escribir exactamente los siguientes formatos de archivos sin alterar su estructura de llaves:

### Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`)
```json
{
  "obsidianVaultPath": "/ruta/a/tu/boveda/obsidian",
  "models": {
    "aiderImplementer": {
      "modelName": "deepseek/deepseek-chat",
      "apiKey": "sk-deepseek-clave-aqui",
      "apiBase": "",
      "env": {
        "DEEPSEEK_API_KEY": "sk-deepseek-clave-aqui"
      }
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

### Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec)
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
    status: "Proposed" # Valores: Proposed, Verified, Archived, Failed
    context: "billing"
    tasks:
      - id: "TASK-01"
        description: "Crear el repositorio de base de datos para facturas"
        status: "Pending"
        files:
          - "src/billing/repositories/invoice.repository.ts"
```

---

## 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA
Escribe el código para `src/config/loader.ts`. Este módulo debe cargar la configuración resolviendo la precedencia de ámbitos: la configuración local del proyecto (`.alvaressrc.json` en la raíz del repositorio actual) sobreescribe completamente los valores de la configuración global del sistema (`~/.alvaressconfig.json`).

Implementa exactamente esta interfaz y lógica de fusión:

```typescript
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ModelProviderConfig {
  modelName: string;
  apiKey?: string;
  apiBase?: string;
  env?: Record<string, string>;
}

export interface HarnessConfig {
  obsidianVaultPath: string;
  models: {
    aiderImplementer: ModelProviderConfig;
  };
  validation: {
    maxAttempts: number;
    commands: string[];
  };
}

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.alvaressconfig.json');
const LOCAL_CONFIG_FILENAME = '.alvaressrc.json';

export function loadConfig(): HarnessConfig {
  let globalConfig: Partial<HarnessConfig> = {};
  let localConfig: Partial<HarnessConfig> = {};

  if (fs.existsSync(GLOBAL_CONFIG_PATH)) {
    globalConfig = JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf-8'));
  }

  const localConfigPath = path.join(process.cwd(), LOCAL_CONFIG_FILENAME);
  if (fs.existsSync(localConfigPath)) {
    localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf-8'));
  }

  return {
    obsidianVaultPath: localConfig.obsidianVaultPath || globalConfig.obsidianVaultPath || '',
    models: {
      aiderImplementer: {
        modelName: localConfig.models?.aiderImplementer?.modelName || globalConfig.models?.aiderImplementer?.modelName || 'deepseek/deepseek-chat',
        apiKey: localConfig.models?.aiderImplementer?.apiKey || globalConfig.models?.aiderImplementer?.apiKey || '',
        apiBase: localConfig.models?.aiderImplementer?.apiBase || globalConfig.models?.aiderImplementer?.apiBase || '',
        env: { ...globalConfig.models?.aiderImplementer?.env, ...localConfig.models?.aiderImplementer?.env }
      }
    },
    validation: {
      maxAttempts: localConfig.validation?.maxAttempts || globalConfig.validation?.maxAttempts || 3,
      commands: localConfig.validation?.commands || globalConfig.validation?.commands || [
        'npx oxlint --deny=correctness --deny=suspicious',
        'npx tsc --noEmit'
      ]
    }
  };
}
```

---

## 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI)
Escribe el código para `src/commands/install.ts` utilizando la librería `@clack/prompts`. Debe mostrar un menú de selección múltiple interactivo:
- "🧠 Obsidian (Conexión de Bóveda y Estructura)" -> Al finalizar, inicializa el directorio `.harness/tasks/` en el proyecto y solicita la ruta de Obsidian para crear los enlaces simbólicos.
- "📊 Graphify (Mapeo AST local)" -> Comprueba si existe en el PATH con `which graphify`. Si no, ejecuta `uv tool install graphifyy` mediante un subproceso visual controlado por un `spinner()`.
- "🤖 Aider-Chat (worker legacy opcional)" -> No se instala; el flujo normal usa subagentes de OpenCode.
- "⚡ Oxlint & TSC (Validación local)" -> Lanza de manera automática `npm install -D oxlint typescript @types/node` en el repositorio objetivo.

Al terminar de instalar las dependencias de sistema, si no existe el archivo global `~/.alvaressconfig.json`, el script debe estructurarlo de manera interactiva pidiendo los nombres de los modelos locales o externos y guardando el JSON de forma limpia. Si se ejecuta dentro de un repositorio de código, debe ofrecer la creación del archivo local `.alvaressrc.json` para definir *overrides*.

---

## 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
Escribe el código para `src/skills/installer.ts`. Este módulo debe crear automáticamente los siguientes archivos Markdown con metadatos de frontmatter YAML rígidos y enlazarlos mediante enlaces simbólicos de nodo (`fs.symlinkSync`) desde la carpeta del proyecto hacia las rutas del sistema global donde OpenCode y Claude Code leen sus habilidades nativas (`~/.config/opencode/skills/` y `~/.claude/skills/`).

Crea exactamente estas 4 habilidades con su contenido de texto literal:

### Skill 1: `read-spec-first.md`
```markdown
---
name: read-spec-first
description: Obliga al agente a leer la especificación de SDD antes de programar.
scope: project
---
Antes de modificar o proponer cualquier cambio en el código, estás obligado a leer el archivo `.harness/tasks/TASK_ID.md` o el archivo general `openspec.yaml`. No improvises. Lista los criterios de aceptación en tu memoria interna antes de escribir código.
```

### Skill 2: `consult-graphify-ast.md`
```markdown
---
name: consult-graphify-ast
description: Minimiza el uso de tokens prohibiendo la lectura a ciegas de archivos enteros.
scope: project
---
Para entender la arquitectura o buscar definiciones de clases, métodos y decoradores, está estrictamente prohibido usar `cat` o abrir archivos de forma masiva. Debes ejecutar `graphify query <término>` o leer `GRAPH_REPORT.md`. Solo abrirás un archivo de código si vas a editarlo directamente.
```

### Skill 3: `self-healing-verify.md`
```markdown
---
name: self-healing-verify
description: Enseña al agente a auto-corregir errores usando el linter y compilador local.
scope: project
---
Al finalizar cualquier edición, debes ejecutar en la terminal `npx oxlint --deny=correctness` y `npx tsc --noEmit`. Si el código de salida (exit code) es diferente de 0, lee el log de error, corrige el archivo inmediatamente y vuelve a validar. No reportes la tarea como lista si los comandos fallan.
```

### Skill 4: `universal-design-patterns.md`
```markdown
---
name: universal-design-patterns
description: Forzar patrones de diseño y restricciones críticas de estilo de código.
scope: project
---
Aplica patrones de diseño universales (como el patrón Repository para la capa de datos) a lo largo de toda la arquitectura del subdominio afectado. Genera código limpio, modular y altamente escalable. Restricción absoluta: No incluyas comentarios explicativos dentro del código generado bajo ninguna circunstancia.
```

---

## 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD)
Escribe el código para `src/orchestrator/apply.ts`. Este módulo procesa las tareas atómicas declaradas dentro de `openspec.yaml`.

Sigue rigurosamente estos pasos técnicos para la ejecución asíncrona:
1. **Detección de Colisiones (Locks basados en Bounded Contexts):** Agrupa las tareas pendientes por el campo `context`. Si dos tareas pertenecen al mismo subdominio o modifican los mismos archivos físicos en disco, secuéncialas (una tras otra). Si pertenecen a contextos aislados, lánzalas en paralelo utilizando promesas concurrentes (`Promise.all`).
Usa el código con precaución.
2. Inyección de Credenciales Dinámicas y Entorno: Para cada tarea concurrente a ejecutar por Aider, carga el objeto de configuración resuelto de loadConfig(). Genera un entorno de ejecución clonando process.env y propagando las llaves y endpoints parametrizados:
   typescript const config = loadConfig(); const implementer = config.models.aiderImplementer; const subprocessEnv = { ...process.env, ...(implementer.apiKey ? { DEEPSEEK_API_KEY: implementer.apiKey, OPENAI_API_KEY: implementer.apiKey } : {}), ...(implementer.apiBase ? { OPENAI_API_BASE: implementer.apiBase } : {}), ...implementer.env };
3. Aislamiento de Contexto con Aider: Ejecuta Aider como un subproceso no interactivo inyectando únicamente los archivos asignados a la tarea mediante comandos de add para proteger la ventana de contexto:
aider --model ${implementer.modelName} --message "Implementa la subtarea descrita en .harness/tasks/TASK_ID.md" --no-auto-commits

6. PIPELINE DE AUTOMATIZACIÓN DE VALIDACIÓN LOCAL (BUCLE SELF-HEALING)

Escribe el código para src/orchestrator/verify.ts. Inmediatamente después de que un proceso de Aider finaliza de escribir archivos, el orquestador intercepta el control y ejecuta de manera totalmente automatizada los comandos configurados secuencialmente en un bucle cerrado de reparación.
Implementa de forma estricta el siguiente algoritmo de subprocesos:
```typescript
import { execSync } from 'child_process';
import { loadConfig } from '../config/loader';
export async function verifyAndRepairTask(taskId: string): Promise {
const config = loadConfig();
let attempts = 0;
const maxAttempts = config.validation.maxAttempts;
const commands = config.validation.commands;
while (attempts < maxAttempts) {
  let hasFailed = false;
  let accumulatedError = '';
  for (const cmd of commands) {
    try {
      // Ejecución secuencial y silenciosa de la validación local configurada
      execSync(cmd, { stdio: 'pipe' });
    } catch (error: any) {
      hasFailed = true;
      accumulatedError += Comando fallido: ${cmd}\nLog de error:\n${error.stdout?.toString() || error.stderr?.toString() || error.message}\n;
      break; // Rompe el pipeline de comandos ante el primer error para iniciar la auto-corrección
    }
  }
    if (!hasFailed) {
      console.log([Self-Healing] Tarea ${taskId} validada con éxito (Exit Code 0).);
      return true; // Pasa la compuerta de validación
    }
    attempts++;
    if (attempts >= maxAttempts) {
      break;
    }
    // Ciclo automático de reparación: Re-alimentar a Aider con las variables de entorno correctas
    console.log(`[Self-Healing] Errores detectados en la tarea ${taskId}. Iniciando intento de reparación automática ${attempts}/${maxAttempts}...`);
    const implementer = config.models.aiderImplementer;
    const subprocessEnv = {
    ...process.env,
    ...(implementer.apiKey ? { DEEPSEEK_API_KEY: implementer.apiKey, OPENAI_API_KEY: implementer.apiKey } : {}),
    ...(implementer.apiBase ? { OPENAI_API_BASE: implementer.apiBase } : {}),
    ...implementer.env
    };
    const repairMessage = `El código generado falló las pruebas lógicas locales con el siguiente reporte de error:\n\n${accumulatedError}\nPor favor, analiza el error, modifica los archivos necesarios para resolverlo y mantén el tipado estricto de TypeScript y decoradores de NestJS sin añadir comentarios explicativos en el código.`;
    try {
      execSync(aider --model ${implementer.modelName} --message "${repairMessage}" --no-auto-commits, {
        env: subprocessEnv,
        stdio: 'inherit'
      });
    } catch (aiderError) {
      console.error([Error] Fallo crítico al invocar el proceso de reparación de Aider.);
    }
  }
  console.error([Self-Healing] La tarea ${taskId} no pudo ser auto-corregida tras ${maxAttempts} intentos.);
  return false; // La tarea se etiqueta como fallida
}
```

RESTRICCIONES DE GENERACIÓN DE CÓDIGO (MANDATORIAS)

• No agregues explicaciones teóricas ni introducciones conversacionales. Genera directamente los archivos TypeScript con código limpio, modular y listo para producción.
• Maneja de forma explícita los bloques try/catch en cada ejecución de comandos de terminal, capturando detalladamente los buffers de stdout y stderr para pasárselos al bucle de auto-corrección.
• Asegúrate de que el código generado sea totalmente limpio, fácil de leer para un LLM local, y no incluyas comentarios explicativos dentro del propio código generado bajo ninguna circunstancia.

---

### Siguientes Pasos con tu LLM Local

1. **Alimentación del Modelo:** Introduce este prompt completo en tu instancia local. Si notas que la ventana de generación de salida de tu modelo se corta antes de terminar todos los módulos, puedes pedirle: *"Genera primero el módulo 2 y el esquema del archivo A del módulo 1"*, y luego ir pidiendo el resto de secciones de manera secuencial siguiendo las mismas reglas estrictas.
2. **Estructura del Proyecto Local:** Inicializa tu carpeta local antes de compilar el código generado por la IA corriendo:
   ```bash
   npm init -y
   npm install typescript @types/node @clack/prompts yaml
   npx tsc --init
