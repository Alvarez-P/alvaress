# Graph Report - alvaress  (2026-10-23)

## Corpus Check
- 64 files · ~36,757 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 579 nodes · 1766 edges · 16 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cbf2ecff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- manifest.ts
- obsidian/installer.ts
- package.json
- reliability.test.ts
- loader.ts
- apply.ts
- compilerOptions
- harness-stack
- ref_node_path
- pathExists
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- tsconfig.test.json
- client.ts
- install.ts
- types.ts
- agent/installer.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 41 edges
2. `ensureDir()` - 27 edges
3. `runInstall()` - 25 edges
4. `errorMessage()` - 25 edges
5. `runJevCommand()` - 24 edges
6. `loadConfig()` - 23 edges
7. `connectObsidianVault()` - 23 edges
8. `HarnessConfig` - 21 edges
9. `loadManifest()` - 21 edges
10. `runCli()` - 20 edges

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

## Communities (16 total, 0 thin omitted)

### Community 0 - "manifest.ts"
Cohesion: 0.12
Nodes (38): runCli(), runAgentCommand(), runArchiveCommand(), runDoctorCommand(), runInit(), runRestoreCommand(), runSkillsCommand(), archiveSpec() (+30 more)

### Community 1 - "obsidian/installer.ts"
Cohesion: 0.14
Nodes (25): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+17 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (41): author, bin, alvaress, dependencies, @clack/prompts, yaml, description, devDependencies (+33 more)

### Community 3 - "reliability.test.ts"
Cohesion: 0.11
Nodes (32): runReportCommand(), HARNESS_CACHE_DIR, cacheDirectory(), CacheEntry, jevRequestHash(), readJevCache(), writeJevCache(), JevRequest (+24 more)

### Community 4 - "loader.ts"
Cohesion: 0.07
Nodes (51): runConfigCommand(), assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), ConfigPaths, getConfigPaths() (+43 more)

### Community 5 - "apply.ts"
Cohesion: 0.07
Nodes (53): check(), DoctorCheck, DoctorCommandDeps, DoctorDeps, DoctorStatus, runDoctor(), ObsidianCommandDeps, HarnessConfig (+45 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "harness-stack"
Cohesion: 0.08
Nodes (23): alvaress, `ask` (petición completa), `choose` (elegir entre opciones), Comandos, Comandos de Obsidian, Confiabilidad y seguridad, Configuración, Cómo funciona `apply` (+15 more)

### Community 8 - "ref_node_path"
Cohesion: 0.16
Nodes (17): setupProject(), CLI, CliResult, manifest(), project(), baseConfig(), fakeAider(), makeTempDir() (+9 more)

### Community 9 - "pathExists"
Cohesion: 0.10
Nodes (47): AgentInstallReport, InitOptions, InitReport, flagValue(), runObsidianCommand(), runState(), summarizeRun(), CLAUDE_SKILLS_DIR (+39 more)

### Community 10 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.14
Nodes (13): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local (+5 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "client.ts"
Cohesion: 0.07
Nodes (53): Cómo encaja todo, Desarrollo, `score` (rubrica ordenada), buildDecideRequest(), ChoiceOption, DEFAULT_COMPLEXITY_LEVELS, DEFAULT_PATH_OPTIONS, JevCommandDeps (+45 more)

### Community 13 - "install.ts"
Cohesion: 0.10
Nodes (36): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+28 more)

### Community 14 - "types.ts"
Cohesion: 0.17
Nodes (16): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, createsConflict(), dependsOn() (+8 more)

### Community 15 - "agent/installer.ts"
Cohesion: 0.21
Nodes (15): agentFilePath(), AgentInstallOptions, installAgent(), installSubagents(), renderAgent(), renderSubagent(), shellAllow(), shellDeny() (+7 more)

## Knowledge Gaps
- **5 isolated node(s):** `@types/node`, `oxlint`, `tsx`, `typescript`, `./tsconfig.json`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 171 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `@types/node`, `oxlint`, `tsx` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `manifest.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11843137254901961 - nodes in this community are weakly interconnected._
- **Why does `yaml` connect `package.json` to `manifest.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `obsidian/installer.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `reliability.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10569105691056911 - nodes in this community are weakly interconnected._