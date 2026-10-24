# Graph Report - alvaress  (2026-10-23)

## Corpus Check
- 68 files · ~40,212 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 628 nodes · 1949 edges · 22 communities (19 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `73c75187`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent/installer.ts
- obsidian/installer.ts
- package.json
- types.ts
- loader.ts
- cli.ts
- compilerOptions
- harness-stack
- ref_node_path
- install.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- tsconfig.test.json
- decide.ts
- install.ts
- apply.ts
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 41 edges
2. `errorMessage()` - 27 edges
3. `ensureDir()` - 27 edges
4. `runInstall()` - 26 edges
5. `loadConfig()` - 25 edges
6. `runDecideCommand()` - 23 edges
7. `HarnessConfig` - 23 edges
8. `connectObsidianVault()` - 23 edges
9. `runCli()` - 21 edges
10. `loadManifest()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Desarrollo` --references--> `score()`  [INFERRED]
  README.md → src/decision/client.ts
- ``score` (rubrica ordenada)` --references--> `score()`  [INFERRED]
  README.md → src/decision/client.ts
- `Cómo encaja todo` --references--> `noul()`  [INFERRED]
  README.md → src/decision/client.ts
- `Cómo encaja todo` --references--> `choice()`  [INFERRED]
  README.md → src/decision/client.ts
- `Cómo encaja todo` --references--> `score()`  [INFERRED]
  README.md → src/decision/client.ts

## Import Cycles
- None detected.

## Communities (22 total, 3 thin omitted)

### Community 0 - "agent/installer.ts"
Cohesion: 0.21
Nodes (16): agentFilePath(), AgentInstallOptions, installAgent(), installSubagents(), renderAgent(), renderSubagent(), shellAllow(), shellDeny() (+8 more)

### Community 1 - "obsidian/installer.ts"
Cohesion: 0.15
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): author, description, files, keywords, license, main, name, packageManager (+12 more)

### Community 3 - "types.ts"
Cohesion: 0.18
Nodes (15): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, createsConflict(), dependsOn() (+7 more)

### Community 4 - "loader.ts"
Cohesion: 0.07
Nodes (44): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), ConfigPaths, DecisionConfig, HarnessConfigFile (+36 more)

### Community 5 - "cli.ts"
Cohesion: 0.12
Nodes (25): runCli(), runAgentCommand(), runDoctorCommand(), runRestoreCommand(), runSkillsCommand(), AiderRunOptions, baseEnvironment(), buildAiderArgs() (+17 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "harness-stack"
Cohesion: 0.07
Nodes (26): alvaress, `ask` (petición completa), `choose` (elegir entre opciones), Comandos, Comandos de Obsidian, Commits, Confiabilidad y seguridad, Configuración (+18 more)

### Community 8 - "ref_node_path"
Cohesion: 0.10
Nodes (26): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), config(), setupProject(), CLI, CliResult (+18 more)

### Community 9 - "install.ts"
Cohesion: 0.06
Nodes (98): @clack/prompts, AgentInstallReport, runArchiveCommand(), InitOptions, InitReport, runInit(), askDecisionModel(), askMaxAttempts() (+90 more)

### Community 10 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.14
Nodes (13): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local (+5 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "decide.ts"
Cohesion: 0.08
Nodes (53): Cómo encaja todo, buildDecideRequest(), ChoiceOption, DEFAULT_COMPLEXITY_LEVELS, DEFAULT_PATH_OPTIONS, maybeRedact(), ParsedDecisionArgs, parseDecisionArgs() (+45 more)

### Community 13 - "install.ts"
Cohesion: 0.06
Nodes (67): runConfigCommand(), DecideCommandDeps, check(), DoctorCheck, DoctorCommandDeps, DoctorDeps, DoctorStatus, runDoctor() (+59 more)

### Community 14 - "apply.ts"
Cohesion: 0.09
Nodes (45): runReportCommand(), updateGraph(), contextPath(), refreshSpecStatus(), ApplyOptions, ApplyReport, applyTasks(), executeTask() (+37 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 187 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `yaml` connect `package.json` to `install.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `loader.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06938020351526364 - nodes in this community are weakly interconnected._
- **Why does `score()` connect `decide.ts` to `harness-stack`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `cli.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12375533428165007 - nodes in this community are weakly interconnected._