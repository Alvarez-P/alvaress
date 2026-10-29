# Graph Report - alvaress  (2026-10-28)

## Corpus Check
- 100 files · ~83,321 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1137 nodes · 3505 edges · 60 communities (54 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5472c80c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- DecisionEngine
- package.json
- install.ts
- quantize-laya.py
- lock.ts
- compilerOptions
- alvaress
- ref_node_path
- obsidian/installer.ts
- status.ts
- tsconfig.test.json
- cli.ts
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
- constants.ts
- loadManifest
- contracts.ts
- diff.ts
- init.ts
- Configuración
- Comandos
- core-harness.test.ts
- workers.ts
- Avisos de terceros
- run.ts
- apply.ts
- Agente, subagentes y skills
- fs.ts
- Aprendizaje continuo
- Subagentes y worker de código
- validator.ts
- Instalación
- agent/installer.ts
- Especificación del arnés alvaress
- HarnessConfig
- package-manager.ts
- RunLog
- pathExists
- loadConfig
- Artefacto int8 de Laya
- verify.ts
- DecisionEngine
- effectiveVault

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 43 edges
2. `runHarnessCommand()` - 40 edges
3. `errorMessage()` - 33 edges
4. `HarnessConfig` - 31 edges
5. `loadConfig()` - 31 edges
6. `runInstall()` - 29 edges
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
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker de código` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (60 total, 6 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.07
Nodes (62): flagValue(), LearnCommandDeps, parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine() (+54 more)

### Community 1 - "DecisionEngine"
Cohesion: 0.10
Nodes (24): LayaConfig, Complexity, FailureInput, FailureVerdict, FlowInput, LearningScopeDecision, LearningScopeInput, RiskAssessment (+16 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.11
Nodes (31): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), Component (+23 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "lock.ts"
Cohesion: 0.21
Nodes (13): HARNESS_DIR, HARNESS_LOCK_FILENAME, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile(), getLockPath(), isProcessAlive() (+5 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.13
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+7 more)

### Community 8 - "ref_node_path"
Cohesion: 0.06
Nodes (54): SUBAGENTS, ensureUv(), installGraphify(), interpolateCommands(), interpolateEnv(), mergeConfig(), ObsidianInstallerDeps, buildCommitMessage() (+46 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.16
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 10 - "status.ts"
Cohesion: 0.29
Nodes (6): GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, walkNewest()

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "cli.ts"
Cohesion: 0.25
Nodes (15): renderAgent(), runCli(), runAgentCommand(), runDoctorCommand(), applyModel(), installCurrentAgent(), ModelRole, runModelsCommand() (+7 more)

### Community 13 - "explore.ts"
Cohesion: 0.20
Nodes (21): markOddDone(), contextPath(), ensureTaskFile(), taskFilePath(), exploreOdd(), exploreRequest(), exploreSdd(), extractAssignedFiles() (+13 more)

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
Cohesion: 0.08
Nodes (30): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+22 more)

### Community 24 - "manifest.ts"
Cohesion: 0.13
Nodes (22): buildTaskDocument(), collectWorkItems(), createScaffoldManifest(), defaultAcceptance(), findWorkItem(), inferBoundedContexts(), parseManifest(), refreshSpecStatus() (+14 more)

### Community 25 - "orchestrator/report.ts"
Cohesion: 0.20
Nodes (22): describe(), isHarnessReport(), runReportCommand(), TaskOutcome, AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports() (+14 more)

### Community 26 - "reliability.test.ts"
Cohesion: 0.15
Nodes (18): check(), DoctorCheck, DoctorCommandDeps, DoctorDeps, DoctorStatus, frontmatterModel(), missingBundleFiles(), modelLabel() (+10 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "vault.ts"
Cohesion: 0.20
Nodes (23): runInit(), flagValue(), ObsidianCommandDeps, runObsidianCommand(), runState(), summarizeRun(), closeObsidian(), appendVaultNoteEntry() (+15 more)

### Community 30 - "constants.ts"
Cohesion: 0.06
Nodes (42): assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths, HarnessConfigFile, isRecord(), ModelSelection (+34 more)

### Community 32 - "loadManifest"
Cohesion: 0.28
Nodes (13): runArchiveCommand(), completeTask(), OPENSPEC_FILENAME, archiveSpec(), getManifestPath(), loadManifest(), saveManifest(), backupId() (+5 more)

### Community 33 - "contracts.ts"
Cohesion: 0.14
Nodes (27): ChangeKind, CommitResult, ConsultInput, Exploration, FileChange, FixResult, FlowPlan, HaltCode (+19 more)

### Community 34 - "diff.ts"
Cohesion: 0.23
Nodes (14): hashFile(), IGNORED_PREFIXES, isRunArtifact(), normalize(), outOfScope(), snapshotWorkspace(), WorkspaceSnapshot, changedFiles() (+6 more)

### Community 35 - "init.ts"
Cohesion: 0.53
Nodes (5): AgentInstallReport, InitOptions, InitReport, VaultConnection, SkillInstallReport

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "core-harness.test.ts"
Cohesion: 0.12
Nodes (11): RunCommandDeps, HarnessHandlers, HarnessUI, RunMode, RunResult, emptyValidation(), HarnessCore, HarnessCoreOptions (+3 more)

### Community 39 - "workers.ts"
Cohesion: 0.16
Nodes (15): FixInput, diffSnapshots(), scopeRisks(), buildConsultMessage(), buildFixMessage(), buildWorkMessage(), commandDetail(), fixVerdict() (+7 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "run.ts"
Cohesion: 0.23
Nodes (10): failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks(), runHarnessCommand() (+2 more)

### Community 42 - "apply.ts"
Cohesion: 0.18
Nodes (19): updateGraph(), ApplyOptions, ApplyReport, applyTasks(), executeTask(), existingAssignedFiles(), finishResult(), newChanges() (+11 more)

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.50
Nodes (4): Agente, subagentes y skills, Inspiración y benchmark frente a Aider, Permisos, Skills

### Community 44 - "fs.ts"
Cohesion: 0.16
Nodes (23): CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, installSkills(), renderSkill(), SkillDefinition, skillFilePath(), SkillInstallOptions (+15 more)

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "Subagentes y worker de código"
Cohesion: 0.15
Nodes (13): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, Flujo de especialistas, HALT, Motor de decisión, Proporcionalidad (+5 more)

### Community 47 - "validator.ts"
Cohesion: 0.20
Nodes (10): Validator, collectWarnings(), CommandValidator, CommandValidatorOptions, stripAnsi(), LogLevel, PREFIXES, truncate() (+2 more)

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "agent/installer.ts"
Cohesion: 0.12
Nodes (19): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+11 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.17
Nodes (12): Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Orquestación, Principios, Restricciones de generación de código (+4 more)

### Community 51 - "HarnessConfig"
Cohesion: 0.22
Nodes (6): HarnessConfig, Worker, ExecutionContext, ExploreContext, VerifyOptions, WorkerOptions

### Community 52 - "package-manager.ts"
Cohesion: 0.21
Nodes (9): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), packageManagerInstallArgs(), resolveInstallerPackageManager() (+1 more)

### Community 53 - "RunLog"
Cohesion: 0.27
Nodes (3): inspectLastRun(), RunLog, RunLogMeta

### Community 54 - "pathExists"
Cohesion: 0.39
Nodes (9): configureObsidian(), downloadLayaBundle(), formatBytes(), installNodeDependencies(), isRepository(), promptLaya(), runInstall(), errorMessage() (+1 more)

### Community 55 - "loadConfig"
Cohesion: 0.29
Nodes (11): runConfigCommand(), InstallRuntime, ModelsCommandDeps, displayConfig(), getConfigPaths(), loadConfig(), loadGlobalConfig(), readConfigFile() (+3 more)

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 57 - "verify.ts"
Cohesion: 0.39
Nodes (8): asValidationResult(), formatValidationFailure(), runValidationCommands(), ValidationFailure, verifyAndRepairTask(), createWorker(), commandOutput(), CommandResult

### Community 58 - "DecisionEngine"
Cohesion: 0.13
Nodes (16): Precisión, Decisión, DecisionEngine, HeuristicDecisionEngine, choice(), createDecisionEngine(), describeFlow(), describeRisk() (+8 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 303 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07287093942054433 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `DecisionEngine`, `install.ts`, `alvaress`, `pathExists`, `Artefacto int8 de Laya`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `DecisionEngine` be split into smaller, more focused modules?**
  _Cohesion score 0.1006006006006006 - nodes in this community are weakly interconnected._
- **Why does `yaml` connect `package.json` to `manifest.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._