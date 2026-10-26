# Graph Report - alvaress  (2026-10-25)

## Corpus Check
- 95 files · ~82,446 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1017 nodes · 3130 edges · 44 communities (41 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e68f0f11`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- locks.ts
- package.json
- install.ts
- DecisionEngine
- harness.ts
- compilerOptions
- alvaress
- reliability.test.ts
- pathExists
- core-harness.test.ts
- tsconfig.test.json
- constants.ts
- final-report.ts
- ui.test.ts
- orchestrator/report.ts
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- diff.ts
- doctor.ts
- package-manager.ts
- obsidian/installer.ts
- laya/index.ts
- DecisionEngine
- cli.ts
- loader.ts
- reliability.test.ts
- run.ts
- HarnessConfig
- workers.ts
- process.ts
- apply.ts
- manifest.ts
- skills/installer.ts
- Subagentes y worker sin Aider
- openspec/types.ts
- mergeConfig
- RunLog
- ConfigError

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 49 edges
2. `runHarnessCommand()` - 37 edges
3. `errorMessage()` - 32 edges
4. `ensureDir()` - 31 edges
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

## Communities (44 total, 3 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.07
Nodes (62): flagValue(), LearnCommandDeps, parseLimit(), printLearning(), resolvePaths(), runLearnCommand(), GLOBAL_MEMORY_DIR, GLOBAL_MEMORY_FILENAME (+54 more)

### Community 1 - "locks.ts"
Cohesion: 0.46
Nodes (7): createsConflict(), dependsOn(), groupWorkItems(), normalizeFile(), orderGroup(), pathsOverlap(), sharesFiles()

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): author, description, files, keywords, license, main, name, packageManager (+12 more)

### Community 3 - "install.ts"
Cohesion: 0.10
Nodes (44): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+36 more)

### Community 4 - "DecisionEngine"
Cohesion: 0.16
Nodes (10): DecisionEngine, choice(), describeRisk(), LayaAgentLike, LayaDecisionEngine, noul(), readBoolean(), readChoice() (+2 more)

### Community 5 - "harness.ts"
Cohesion: 0.13
Nodes (8): RunCommandDeps, HarnessHandlers, HarnessUI, emptyValidation(), HarnessCore, HarnessCoreOptions, warningsToRisks(), makeFixture()

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.04
Nodes (45): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local (+37 more)

### Community 8 - "reliability.test.ts"
Cohesion: 0.09
Nodes (30): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl(), setupProject(), CLI (+22 more)

### Community 9 - "pathExists"
Cohesion: 0.14
Nodes (36): flagValue(), runObsidianCommand(), runState(), summarizeRun(), closeObsidian(), markOddDone(), writeHalt(), appendVaultNoteEntry() (+28 more)

### Community 10 - "core-harness.test.ts"
Cohesion: 0.22
Nodes (9): Exploration, FixResult, HaltReason, ReadyInput, ReadyResult, RunRequest, WorkPlan, FixtureOptions (+1 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.10
Nodes (19): DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, HARNESS_BACKUPS_DIR, HARNESS_CACHE_DIR, HARNESS_LOCK_FILENAME, HARNESS_RUNS_DIR (+11 more)

### Community 13 - "final-report.ts"
Cohesion: 0.24
Nodes (15): CommitResult, FileChange, HaltCode, Risk, RunMode, RunResult, ValidationCommandResult, ValidationResult (+7 more)

### Community 14 - "ui.test.ts"
Cohesion: 0.09
Nodes (24): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+16 more)

### Community 15 - "orchestrator/report.ts"
Cohesion: 0.22
Nodes (21): describe(), isHarnessReport(), runReportCommand(), TaskOutcome, AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports() (+13 more)

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

### Community 23 - "diff.ts"
Cohesion: 0.18
Nodes (15): OPENSPEC_FILENAME, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest() (+7 more)

### Community 24 - "doctor.ts"
Cohesion: 0.13
Nodes (16): check(), DoctorCheck, DoctorDeps, DoctorStatus, missingBundleFiles(), GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, LAYA_MODEL_CACHE_ROOT (+8 more)

### Community 25 - "package-manager.ts"
Cohesion: 0.25
Nodes (7): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), commandExists()

### Community 26 - "obsidian/installer.ts"
Cohesion: 0.16
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.06
Nodes (60): BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_REPO, BUNDLE_REVISION, BundleFile, BundleProgress, bundleUrl(), ensureBundle() (+52 more)

### Community 28 - "DecisionEngine"
Cohesion: 0.14
Nodes (20): LayaConfig, ChangeKind, Complexity, FailureInput, FailureVerdict, RiskAssessment, RiskInput, RiskSeverity (+12 more)

### Community 29 - "cli.ts"
Cohesion: 0.08
Nodes (42): agentFilePath(), AgentInstallOptions, AgentInstallReport, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+34 more)

### Community 30 - "loader.ts"
Cohesion: 0.12
Nodes (21): ConfigPaths, HarnessConfigFile, maskConfig(), maskEnv(), maskValue(), ModelProviderConfig, PackageManager, saveGlobalConfig() (+13 more)

### Community 31 - "reliability.test.ts"
Cohesion: 0.17
Nodes (13): HARNESS_DIR, DecisionError, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile(), getLockPath(), isProcessAlive() (+5 more)

### Community 32 - "run.ts"
Cohesion: 0.17
Nodes (16): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+8 more)

### Community 33 - "HarnessConfig"
Cohesion: 0.20
Nodes (8): DoctorCommandDeps, ObsidianCommandDeps, HarnessConfig, Validator, ExploreContext, CommandValidator, VerifyOptions, WorkerOptions

### Community 34 - "workers.ts"
Cohesion: 0.23
Nodes (11): FixInput, WorkResult, heuristicVerdict(), diffSnapshots(), scopeRisks(), buildFixMessage(), buildWorkMessage(), commandDetail() (+3 more)

### Community 35 - "process.ts"
Cohesion: 0.19
Nodes (13): LAYA_LOG_PATH, ObsidianInstallerDeps, RunLogMeta, collectWarnings(), CommandValidatorOptions, ValidationFailure, stripAnsi(), truncate() (+5 more)

### Community 36 - "apply.ts"
Cohesion: 0.10
Nodes (36): completeTask(), updateGraph(), contextPath(), refreshSpecStatus(), setTaskStatus(), OpenSpecManifest, AiderRunOptions, baseEnvironment() (+28 more)

### Community 37 - "manifest.ts"
Cohesion: 0.16
Nodes (25): runArchiveCommand(), runDoctor(), archiveSpec(), buildTaskDocument(), collectWorkItems(), createScaffoldManifest(), defaultAcceptance(), ensureHarnessDirs() (+17 more)

### Community 38 - "skills/installer.ts"
Cohesion: 0.20
Nodes (10): CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, renderSkill(), SkillDefinition, skillFilePath(), SkillInstallOptions, SkillLink (+2 more)

### Community 39 - "Subagentes y worker sin Aider"
Cohesion: 0.11
Nodes (16): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos (+8 more)

### Community 40 - "openspec/types.ts"
Cohesion: 0.23
Nodes (9): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, describeGroups(), item() (+1 more)

### Community 41 - "mergeConfig"
Cohesion: 0.43
Nodes (6): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), config(), configWith()

### Community 43 - "ConfigError"
Cohesion: 0.36
Nodes (9): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), isRecord(), readConfigFile(), validateConfigFile() (+1 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 273 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Subagentes y worker sin Aider` connect `Subagentes y worker sin Aider` to `alvaress`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06971153846153846 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `Subagentes y worker sin Aider` to `run.ts`, `workers.ts`, `harness.ts`, `reliability.test.ts`, `DecisionEngine`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._