# Graph Report - alvaress  (2026-10-29)

## Corpus Check
- 102 files · ~85,496 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1167 nodes · 3553 edges · 64 communities (54 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21c8e314`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- loader.ts
- DecisionEngine
- package.json
- install.ts
- quantize-laya.py
- reliability.test.ts
- compilerOptions
- alvaress
- ref_node_path
- obsidian/installer.ts
- process.ts
- tsconfig.test.json
- backup.ts
- explore.ts
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- final-report.ts
- manifest.ts
- orchestrator/report.ts
- reliability.test.ts
- laya/index.ts
- publishConfig
- vault.ts
- RunLog
- workers.ts
- config/models.ts
- diff.ts
- learnings.ts
- Configuración
- Comandos
- core-harness.test.ts
- HarnessConfig
- Avisos de terceros
- run.ts
- apply.ts
- Agente, subagentes y skills
- fs.ts
- Aprendizaje continuo
- Subagentes y worker de código
- constants.ts
- Instalación
- agent/installer.ts
- Especificación del arnés alvaress
- package-manager.ts
- redactSecrets
- Artefacto int8 de Laya
- contracts.ts
- .run
- verify.ts
- modules.ts
- status.ts
- commit.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 44 edges
2. `runHarnessCommand()` - 40 edges
3. `errorMessage()` - 33 edges
4. `runInstall()` - 31 edges
5. `HarnessConfig` - 31 edges
6. `loadConfig()` - 31 edges
7. `ensureDir()` - 29 edges
8. `loadManifest()` - 27 edges
9. `runDoctor()` - 25 edges
10. `DecisionEngine` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Inspiración y benchmark frente a Aider` --references--> `WorkPlan`  [INFERRED]
  README.md → src/core/contracts.ts
- `Orquestación` --references--> `Worker`  [INFERRED]
  docs/spec.md → src/core/contracts.ts
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Subagentes y worker de código` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (64 total, 10 thin omitted)

### Community 0 - "loader.ts"
Cohesion: 0.12
Nodes (24): assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths, HarnessConfigFile, interpolateCommands(), interpolateEnv() (+16 more)

### Community 1 - "DecisionEngine"
Cohesion: 0.09
Nodes (28): Precisión, Decisión, LayaConfig, DecisionEngine, FailureInput, FailureVerdict, HeuristicDecisionEngine, heuristicVerdict() (+20 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (22): author, description, files, homepage, keywords, license, main, name (+14 more)

### Community 3 - "install.ts"
Cohesion: 0.08
Nodes (43): askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), CHECKLIST, ChecklistEntry (+35 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "reliability.test.ts"
Cohesion: 0.21
Nodes (13): HARNESS_DIR, HARNESS_LOCK_FILENAME, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile(), getLockPath(), isProcessAlive() (+5 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.13
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+7 more)

### Community 8 - "ref_node_path"
Cohesion: 0.07
Nodes (38): SUBAGENTS, ensureUv(), mergeConfig(), RunOptions, ensureUvPath(), installUv(), shellPlan(), UvInstallDeps (+30 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.15
Nodes (24): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+16 more)

### Community 10 - "process.ts"
Cohesion: 0.24
Nodes (9): ValidationCommandResult, Validator, collectWarnings(), CommandValidator, CommandValidatorOptions, stripAnsi(), truncate(), runCommand() (+1 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "backup.ts"
Cohesion: 0.32
Nodes (11): runRestoreCommand(), HARNESS_BACKUPS_DIR, getManifestPath(), saveManifest(), backupId(), backupManifest(), backupsDir(), listManifestBackups() (+3 more)

### Community 13 - "explore.ts"
Cohesion: 0.23
Nodes (18): markOddDone(), exploreOdd(), exploreRequest(), exploreSdd(), extractAssignedFiles(), extractOpenRisks(), extractSection(), markChecklistDone() (+10 more)

### Community 14 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 16 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, clean, commitlint, dev, lint, prepack, prepare (+7 more)

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

### Community 23 - "final-report.ts"
Cohesion: 0.09
Nodes (24): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+16 more)

### Community 24 - "manifest.ts"
Cohesion: 0.12
Nodes (25): completeTask(), buildTaskDocument(), createScaffoldManifest(), defaultAcceptance(), ensureTaskFile(), findWorkItem(), inferBoundedContexts(), loadManifest() (+17 more)

### Community 25 - "orchestrator/report.ts"
Cohesion: 0.25
Nodes (19): describe(), isHarnessReport(), runReportCommand(), AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports(), listRunReports() (+11 more)

### Community 26 - "reliability.test.ts"
Cohesion: 0.16
Nodes (15): agentFilePath(), check(), DoctorCheck, DoctorStatus, frontmatterModel(), missingBundleFiles(), modelLabel(), runDoctor() (+7 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "vault.ts"
Cohesion: 0.15
Nodes (29): AgentInstallReport, InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand(), runState(), summarizeRun() (+21 more)

### Community 30 - "RunLog"
Cohesion: 0.21
Nodes (8): flagValue(), parseFileList(), parseMode(), printDryRun(), reportTasks(), runHarnessCommand(), inspectLastRun(), RunLog

### Community 32 - "workers.ts"
Cohesion: 0.15
Nodes (17): DEFAULT_WORKER_TIMEOUT_MS, FixInput, WorkResult, diffSnapshots(), scopeRisks(), buildConsultMessage(), buildFixMessage(), buildWorkMessage() (+9 more)

### Community 34 - "diff.ts"
Cohesion: 0.25
Nodes (14): hashFile(), IGNORED_PREFIXES, isRunArtifact(), normalize(), outOfScope(), snapshotWorkspace(), WorkspaceSnapshot, changedFiles() (+6 more)

### Community 35 - "learnings.ts"
Cohesion: 0.05
Nodes (88): installAgent(), renderAgent(), runCli(), runAgentCommand(), runArchiveCommand(), runConfigCommand(), runDoctorCommand(), InstallRuntime (+80 more)

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "core-harness.test.ts"
Cohesion: 0.17
Nodes (16): ConsultInput, Exploration, FlowPlan, HaltReason, ReadyInput, ReadyResult, RouteDecision, RunRequest (+8 more)

### Community 39 - "HarnessConfig"
Cohesion: 0.15
Nodes (11): DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, RunCommandDeps, HarnessConfig, Worker, ExecutionContext (+3 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "run.ts"
Cohesion: 0.14
Nodes (22): effectiveVault(), failureText(), MODES, withVault(), CommitResult, FileChange, HaltCode, Risk (+14 more)

### Community 42 - "apply.ts"
Cohesion: 0.13
Nodes (25): updateGraph(), collectWorkItems(), contextPath(), ApplyOptions, ApplyReport, applyTasks(), executeTask(), existingAssignedFiles() (+17 more)

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.50
Nodes (4): Agente, subagentes y skills, Inspiración y benchmark frente a Aider, Permisos, Skills

### Community 44 - "fs.ts"
Cohesion: 0.16
Nodes (24): configureObsidian(), CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, installSkills(), renderSkill(), SkillDefinition, skillFilePath() (+16 more)

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "Subagentes y worker de código"
Cohesion: 0.15
Nodes (13): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, Flujo de especialistas, HALT, Motor de decisión, Proporcionalidad (+5 more)

### Community 47 - "constants.ts"
Cohesion: 0.11
Nodes (17): COMMAND_SEPARATOR, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, HARNESS_CACHE_DIR, HARNESS_RUNS_DIR, LAYA_DIR (+9 more)

### Community 48 - "Instalación"
Cohesion: 0.50
Nodes (4): Checklist de componentes, Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "agent/installer.ts"
Cohesion: 0.13
Nodes (15): AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installSubagents(), LEARN_READ_COMMANDS, modelLine(), PermissionRule (+7 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.15
Nodes (13): Bóveda Obsidian, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Orquestación, Principios (+5 more)

### Community 52 - "package-manager.ts"
Cohesion: 0.21
Nodes (9): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), resolveInstallerPackageManager(), resolvePackageManager() (+1 more)

### Community 54 - "redactSecrets"
Cohesion: 0.23
Nodes (9): writeHalt(), LAYA_LOG_PATH, assessLearning(), ARTIFACT_EXCLUDES, workingTreeDiff(), RunLogMeta, redactSecrets(), redactValue() (+1 more)

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 58 - "contracts.ts"
Cohesion: 0.15
Nodes (16): ChangeKind, Complexity, FixResult, FlowInput, LearningScopeDecision, LearningScopeInput, RiskAssessment, RiskInput (+8 more)

### Community 59 - ".run"
Cohesion: 0.16
Nodes (4): HarnessHandlers, HarnessUI, emptyValidation(), HarnessCoreOptions

### Community 60 - "verify.ts"
Cohesion: 0.33
Nodes (9): ObsidianInstallerDeps, asValidationResult(), formatValidationFailure(), runValidationCommands(), ValidationFailure, verifyAndRepairTask(), createWorker(), commandOutput() (+1 more)

### Community 61 - "modules.ts"
Cohesion: 0.33
Nodes (6): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl()

### Community 62 - "status.ts"
Cohesion: 0.25
Nodes (8): DoctorDeps, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, getGraphStatus(), GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, walkNewest()

### Community 63 - "commit.ts"
Cohesion: 0.39
Nodes (8): RunMode, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest()

## Knowledge Gaps
- **9 isolated node(s):** `./tsconfig.json`, `@commitlint/cli`, `@commitlint/config-conventional`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 321 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `package.json` to `install.ts`, `vault.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `./tsconfig.json`, `@commitlint/cli`, `@commitlint/config-conventional` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `loader.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `Artefacto int8 de Laya`, `DecisionEngine`, `alvaress`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `DecisionEngine` be split into smaller, more focused modules?**
  _Cohesion score 0.08597285067873303 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `HarnessConfig` to `workers.ts`, `ref_node_path`, `run.ts`, `apply.ts`, `Subagentes y worker de código`, `Especificación del arnés alvaress`, `contracts.ts`, `verify.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._