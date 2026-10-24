# Graph Report - alvaress  (2026-10-23)

## Corpus Check
- 51 files · ~26,636 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 441 nodes · 1248 edges · 14 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- manifest.ts
- obsidian/installer.ts
- package.json
- install.ts
- loader.ts
- verify.ts
- compilerOptions
- harness-stack
- ref_node_path
- cli.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- tsconfig.test.json
- client.ts
- install.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 29 edges
2. `runInstall()` - 25 edges
3. `runJevCommand()` - 20 edges
4. `JevError` - 20 edges
5. `loadConfig()` - 19 edges
6. `connectObsidianVault()` - 19 edges
7. `errorMessage()` - 18 edges
8. `HarnessConfig` - 17 edges
9. `compilerOptions` - 17 edges
10. `ensureDir()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Desarrollo` --references--> `score()`  [INFERRED]
  README.md → src/jev/client.ts
- ``score` (rubrica ordenada)` --references--> `score()`  [INFERRED]
  README.md → src/jev/client.ts
- `Cómo encaja todo` --references--> `noul()`  [INFERRED]
  README.md → src/jev/client.ts
- `Cómo encaja todo` --references--> `choice()`  [INFERRED]
  README.md → src/jev/client.ts
- `Cómo encaja todo` --references--> `score()`  [INFERRED]
  README.md → src/jev/client.ts

## Import Cycles
- None detected.

## Communities (14 total, 0 thin omitted)

### Community 0 - "manifest.ts"
Cohesion: 0.10
Nodes (39): buildTaskDocument(), collectWorkItems(), contextPath(), createScaffoldManifest(), defaultAcceptance(), ensureTaskFile(), findWorkItem(), inferBoundedContexts() (+31 more)

### Community 1 - "obsidian/installer.ts"
Cohesion: 0.14
Nodes (28): ensureObsidianInstalled(), detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac() (+20 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (39): author, bin, alvaress, dependencies, @clack/prompts, yaml, description, devDependencies (+31 more)

### Community 3 - "install.ts"
Cohesion: 0.11
Nodes (41): AgentInstallReport, InitOptions, InitReport, runInit(), isRepository(), runInstall(), CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR (+33 more)

### Community 4 - "loader.ts"
Cohesion: 0.09
Nodes (36): runConfigCommand(), assertModel(), assertString(), ConfigPaths, getConfigPaths(), HarnessConfigFile, isRecord(), loadConfig() (+28 more)

### Community 5 - "verify.ts"
Cohesion: 0.19
Nodes (18): installAider(), installGraphify(), installValidationDependencies(), AiderRunOptions, buildAiderArgs(), buildAiderEnv(), runAider(), formatValidationFailure() (+10 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "harness-stack"
Cohesion: 0.08
Nodes (23): alvaress, `ask` (petición completa), `choose` (elegir entre opciones), Comandos, Comandos de Obsidian, Configuración, Cómo funciona `apply`, Desarrollo (+15 more)

### Community 8 - "ref_node_path"
Cohesion: 0.11
Nodes (25): ObsidianCommandDeps, HarnessConfig, mergeConfig(), ExecutionContext, VerifyOptions, config(), setupProject(), CLI (+17 more)

### Community 9 - "cli.ts"
Cohesion: 0.16
Nodes (21): agentFilePath(), AgentInstallOptions, installAgent(), renderAgent(), runCli(), runAgentCommand(), flagValue(), runObsidianCommand() (+13 more)

### Community 10 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.14
Nodes (13): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local (+5 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "client.ts"
Cohesion: 0.10
Nodes (40): Cómo encaja todo, ChoiceOption, JevCommandDeps, ParsedJevArgs, parseJevArgs(), parseNumber(), parseOption(), readRequest() (+32 more)

### Community 13 - "install.ts"
Cohesion: 0.20
Nodes (19): @clack/prompts, askMaxAttempts(), askRequired(), askSecret(), askText(), askValidationCommands(), Component, COMPONENT_VALUES (+11 more)

## Knowledge Gaps
- **5 isolated node(s):** `@types/node`, `oxlint`, `tsx`, `typescript`, `./tsconfig.json`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 146 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `@types/node`, `oxlint`, `tsx` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `manifest.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09948979591836735 - nodes in this community are weakly interconnected._
- **Why does `score()` connect `client.ts` to `harness-stack`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `obsidian/installer.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14039408866995073 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `harness-stack` to `client.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._