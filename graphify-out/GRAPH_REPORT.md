# Graph Report - alvaress  (2026-10-23)

## Corpus Check
- 65 files · ~37,201 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 593 nodes · 1779 edges · 23 communities (20 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fad5e070`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- manifest.ts
- obsidian/installer.ts
- package.json
- reliability.test.ts
- loader.ts
- verify.ts
- compilerOptions
- harness-stack
- ref_node_path
- pathExists
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- tsconfig.test.json
- client.ts
- install.ts
- apply.ts
- orchestrator/report.ts
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged

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

## Communities (23 total, 3 thin omitted)

### Community 0 - "manifest.ts"
Cohesion: 0.14
Nodes (29): runCli(), runAgentCommand(), runArchiveCommand(), runConfigCommand(), runRestoreCommand(), runSkillsCommand(), getConfigPaths(), loadConfig() (+21 more)

### Community 1 - "obsidian/installer.ts"
Cohesion: 0.14
Nodes (25): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+17 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): author, description, files, keywords, license, main, name, packageManager (+12 more)

### Community 3 - "reliability.test.ts"
Cohesion: 0.10
Nodes (29): check(), DoctorCheck, DoctorDeps, DoctorStatus, runDoctor(), runDoctorCommand(), GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME (+21 more)

### Community 4 - "loader.ts"
Cohesion: 0.07
Nodes (47): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), ConfigPaths, HarnessConfigFile, interpolateCommands() (+39 more)

### Community 5 - "verify.ts"
Cohesion: 0.14
Nodes (22): DoctorCommandDeps, ObsidianCommandDeps, HarnessConfig, AiderRunOptions, baseEnvironment(), buildAiderArgs(), buildAiderEnv(), runAider() (+14 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "harness-stack"
Cohesion: 0.07
Nodes (26): alvaress, `ask` (petición completa), `choose` (elegir entre opciones), Comandos, Comandos de Obsidian, Commits, Confiabilidad y seguridad, Configuración (+18 more)

### Community 8 - "ref_node_path"
Cohesion: 0.07
Nodes (34): agentFilePath(), AgentInstallOptions, installAgent(), installSubagents(), renderAgent(), renderSubagent(), shellAllow(), shellDeny() (+26 more)

### Community 9 - "pathExists"
Cohesion: 0.10
Nodes (49): AgentInstallReport, InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand(), runState(), summarizeRun() (+41 more)

### Community 10 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.14
Nodes (13): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local (+5 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "client.ts"
Cohesion: 0.07
Nodes (57): Cómo encaja todo, buildDecideRequest(), ChoiceOption, DEFAULT_COMPLEXITY_LEVELS, DEFAULT_PATH_OPTIONS, JevCommandDeps, maybeRedact(), ParsedJevArgs (+49 more)

### Community 13 - "install.ts"
Cohesion: 0.14
Nodes (33): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+25 more)

### Community 14 - "apply.ts"
Cohesion: 0.09
Nodes (42): TASKS_DIR, buildTaskDocument(), contextPath(), createScaffoldManifest(), defaultAcceptance(), ensureTaskFile(), inferBoundedContexts(), refreshSpecStatus() (+34 more)

### Community 15 - "orchestrator/report.ts"
Cohesion: 0.25
Nodes (14): runReportCommand(), HARNESS_RUNS_DIR, TaskOutcome, createRunReport(), getRunsDir(), listRunReports(), newRunReportId(), readLatestRun() (+6 more)

### Community 16 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, commitlint, dev, lint, prepack, prepare, prepublishOnly (+6 more)

### Community 17 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @commitlint/cli, @commitlint/config-conventional, husky, lint-staged, oxlint, tsx, @types/node (+1 more)

### Community 18 - "dependencies"
Cohesion: 0.67
Nodes (3): dependencies, @clack/prompts, yaml

### Community 19 - "engines"
Cohesion: 0.67
Nodes (3): engines, node, pnpm

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 184 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `manifest.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13940256045519203 - nodes in this community are weakly interconnected._
- **Why does `yaml` connect `package.json` to `apply.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `obsidian/installer.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._
- **Why does `score()` connect `client.ts` to `harness-stack`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._