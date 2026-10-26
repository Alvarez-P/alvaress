# Graph Report - alvaress  (2026-10-25)

## Corpus Check
- 86 files · ~76,146 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 923 nodes · 2847 edges · 34 communities (32 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 65 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `79d858aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- types.ts
- package.json
- install.ts
- loadConfig
- harness.ts
- compilerOptions
- alvaress
- reliability.test.ts
- fs.ts
- core-harness.test.ts
- tsconfig.test.json
- constants.ts
- contracts.ts
- final-report.ts
- manifest.ts
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- workers.ts
- doctor.ts
- package-manager.ts
- obsidian/installer.ts
- lock.ts
- DecisionEngine
- loader.ts
- pipx.ts
- runHarnessCommand
- process.ts
- ConfigError

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 48 edges
2. `runHarnessCommand()` - 37 edges
3. `ensureDir()` - 31 edges
4. `errorMessage()` - 30 edges
5. `HarnessConfig` - 29 edges
6. `loadManifest()` - 27 edges
7. `loadConfig()` - 25 edges
8. `connectObsidianVault()` - 25 edges
9. `alvaress` - 25 edges
10. `RunLog` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Selección del worker` --references--> `AiderWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts
- `Contrato del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts
- `Selección del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts

## Import Cycles
- None detected.

## Communities (34 total, 2 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.11
Nodes (42): flagValue(), LearnCommandDeps, parseLimit(), printLearning(), resolvePaths(), runLearnCommand(), addLearning(), AddLearningInput (+34 more)

### Community 1 - "types.ts"
Cohesion: 0.18
Nodes (15): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, createsConflict(), dependsOn() (+7 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): author, description, files, keywords, license, main, name, packageManager (+12 more)

### Community 3 - "install.ts"
Cohesion: 0.13
Nodes (29): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+21 more)

### Community 4 - "loadConfig"
Cohesion: 0.27
Nodes (11): runConfigCommand(), InstallRuntime, getConfigPaths(), loadConfig(), maskConfig(), maskEnv(), maskValue(), readConfigFile() (+3 more)

### Community 5 - "harness.ts"
Cohesion: 0.12
Nodes (15): failureText(), DEFAULT_MAX_FIX_ATTEMPTS, HarnessHandlers, HarnessUI, RunMode, ValidationCommandResult, createRunId(), emptyValidation() (+7 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.04
Nodes (42): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local (+34 more)

### Community 8 - "reliability.test.ts"
Cohesion: 0.07
Nodes (45): agentFilePath(), AgentInstallOptions, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS, PermissionRule (+37 more)

### Community 9 - "fs.ts"
Cohesion: 0.05
Nodes (100): AgentInstallReport, InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand(), runState(), summarizeRun() (+92 more)

### Community 10 - "core-harness.test.ts"
Cohesion: 0.19
Nodes (9): Exploration, FixResult, HaltReason, ReadyInput, ReadyResult, RunRequest, FixtureOptions, HarnessFixture (+1 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.07
Nodes (26): DEFAULT_AIDER_TIMEOUT_MS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, DEFAULT_VITE_PLUS_TEST, GLOBAL_CONFIG_FILENAME, GLOBAL_MEMORY_DIR, GLOBAL_MEMORY_FILENAME, GLOBAL_PLAYBOOK_FILENAME (+18 more)

### Community 13 - "contracts.ts"
Cohesion: 0.18
Nodes (16): ChangeKind, CommitResult, Complexity, FailureInput, FailureVerdict, FileChange, HaltCode, Risk (+8 more)

### Community 14 - "final-report.ts"
Cohesion: 0.08
Nodes (30): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+22 more)

### Community 15 - "manifest.ts"
Cohesion: 0.07
Nodes (60): runCli(), runAgentCommand(), runArchiveCommand(), describe(), isHarnessReport(), runReportCommand(), runSkillsCommand(), updateGraph() (+52 more)

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

### Community 21 - "lint-staged"
Cohesion: 0.67
Nodes (3): lint-staged, src/**/*.{ts,tsx,js,mjs,cjs}, test/**/*.{ts,tsx,js,mjs,cjs}

### Community 23 - "workers.ts"
Cohesion: 0.06
Nodes (48): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Reparto de subagentes, Seguridad y permisos, Selección del worker (+40 more)

### Community 24 - "doctor.ts"
Cohesion: 0.21
Nodes (13): check(), DoctorCheck, DoctorDeps, DoctorStatus, moduleAvailable(), runDoctor(), runDoctorCommand(), LAYA_TS_PACKAGE (+5 more)

### Community 25 - "package-manager.ts"
Cohesion: 0.19
Nodes (11): installValidationDependencies(), installVitePlus(), DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec() (+3 more)

### Community 26 - "obsidian/installer.ts"
Cohesion: 0.16
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 27 - "lock.ts"
Cohesion: 0.21
Nodes (13): HARNESS_DIR, HARNESS_LOCK_FILENAME, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile(), getLockPath(), isProcessAlive() (+5 more)

### Community 28 - "DecisionEngine"
Cohesion: 0.11
Nodes (19): LayaConfig, DecisionEngine, RiskAssessment, RiskInput, HeuristicDecisionEngine, choice(), createDecisionEngine(), CreateDecisionEngineOptions (+11 more)

### Community 30 - "loader.ts"
Cohesion: 0.12
Nodes (18): ConfigPaths, HarnessConfigFile, interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), ModelProviderConfig, PackageManager, ScopeMode (+10 more)

### Community 31 - "pipx.ts"
Cohesion: 0.26
Nodes (12): ensurePipx(), ObsidianInstallerDeps, ValidationFailure, ensurePipxPath(), installPipx(), PipxInstallDeps, pipxInstallHint(), pipxInstallPlan (+4 more)

### Community 33 - "runHarnessCommand"
Cohesion: 0.10
Nodes (23): DoctorCommandDeps, ObsidianCommandDeps, flagValue(), parseFileList(), parseMode(), printDryRun(), reportTasks(), runHarnessCommand() (+15 more)

### Community 34 - "process.ts"
Cohesion: 0.28
Nodes (7): GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, runCommand(), runCommandChecked()

### Community 36 - "ConfigError"
Cohesion: 0.42
Nodes (8): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), isRecord(), validateConfigFile(), ConfigError

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 260 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Worker` connect `workers.ts` to `reliability.test.ts`, `fs.ts`, `contracts.ts`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10676532769556026 - nodes in this community are weakly interconnected._
- **Why does `Subagentes y worker sin Aider` connect `workers.ts` to `alvaress`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._