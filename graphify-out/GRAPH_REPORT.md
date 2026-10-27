# Graph Report - alvaress  (2026-10-26)

## Corpus Check
- 98 files · ~75,918 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1105 nodes · 3355 edges · 57 communities (53 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7e8fcf10`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- orchestrator/report.ts
- compilerOptions
- alvaress
- ref_node_path
- loader.ts
- Subagentes y worker sin Aider
- tsconfig.test.json
- constants.ts
- .run
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- verify.ts
- explore.ts
- pathExists
- StatusLine
- laya/index.ts
- publishConfig
- RunLog
- apply.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- run.ts
- agent/installer.ts
- doctor.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
- Configuración
- Comandos
- contracts.ts
- workers.ts
- Avisos de terceros
- Artefacto int8 de Laya
- package-manager.ts
- Agente, subagentes y skills
- openspec/types.ts
- Aprendizaje continuo
- mergeConfig
- manifest.ts
- Instalación
- harness.ts
- diff.ts
- errorMessage
- lock.ts
- init.ts
- ConfigError
- commit.ts
- loadConfig

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 49 edges
2. `runHarnessCommand()` - 40 edges
3. `errorMessage()` - 32 edges
4. `HarnessConfig` - 31 edges
5. `ensureDir()` - 31 edges
6. `loadConfig()` - 27 edges
7. `loadManifest()` - 27 edges
8. `connectObsidianVault()` - 25 edges
9. `runLearnCommand()` - 24 edges
10. `runInstall()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Precisión` --references--> `choice()`  [INFERRED]
  docs/laya-int8.md → src/decision/laya.ts

## Import Cycles
- None detected.

## Communities (57 total, 4 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.07
Nodes (65): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+57 more)

### Community 1 - "laya.ts"
Cohesion: 0.08
Nodes (30): Precisión, LayaConfig, Complexity, DecisionEngine, FailureInput, LearningScopeDecision, LearningScopeInput, RiskAssessment (+22 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.05
Nodes (78): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+70 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "orchestrator/report.ts"
Cohesion: 0.20
Nodes (22): describe(), isHarnessReport(), runReportCommand(), TaskOutcome, AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports() (+14 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.12
Nodes (16): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+8 more)

### Community 8 - "ref_node_path"
Cohesion: 0.09
Nodes (29): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl(), setupProject(), CLI (+21 more)

### Community 9 - "loader.ts"
Cohesion: 0.14
Nodes (17): ConfigPaths, HarnessConfigFile, ModelProviderConfig, PackageManager, saveGlobalConfig(), saveLocalConfig(), ScopeMode, toConfigFile() (+9 more)

### Community 10 - "Subagentes y worker sin Aider"
Cohesion: 0.11
Nodes (16): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos (+8 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.09
Nodes (21): AGENT_NAME, DEFAULT_LAYA_TIMEOUT_MS, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, DEFAULT_VITE_PLUS_CHECK, GLOBAL_CONFIG_FILENAME, HARNESS_BACKUPS_DIR (+13 more)

### Community 13 - ".run"
Cohesion: 0.13
Nodes (8): RunCommandDeps, HarnessHandlers, HarnessUI, emptyValidation(), HarnessCore, HarnessCoreOptions, warningsToRisks(), makeFixture()

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

### Community 23 - "verify.ts"
Cohesion: 0.15
Nodes (20): DoctorCommandDeps, LearnCommandDeps, ObsidianCommandDeps, HarnessConfig, AiderRunOptions, baseEnvironment(), buildAiderArgs(), buildAiderEnv() (+12 more)

### Community 24 - "explore.ts"
Cohesion: 0.22
Nodes (19): OPENSPEC_FILENAME, collectWorkItems(), findWorkItem(), exploreOdd(), exploreRequest(), exploreSdd(), extractAssignedFiles(), extractOpenRisks() (+11 more)

### Community 25 - "pathExists"
Cohesion: 0.17
Nodes (31): flagValue(), runObsidianCommand(), runState(), summarizeRun(), closeObsidian(), markOddDone(), appendVaultNoteEntry(), connectObsidianVault() (+23 more)

### Community 26 - "StatusLine"
Cohesion: 0.09
Nodes (25): collectWarnings(), ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+17 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "RunLog"
Cohesion: 0.21
Nodes (4): Validator, inspectLastRun(), RunLog, CommandValidator

### Community 30 - "apply.ts"
Cohesion: 0.18
Nodes (18): completeTask(), contextPath(), ensureTaskFile(), refreshSpecStatus(), setTaskStatus(), OpenSpecManifest, ApplyOptions, ApplyReport (+10 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.20
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 32 - "run.ts"
Cohesion: 0.18
Nodes (15): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+7 more)

### Community 33 - "agent/installer.ts"
Cohesion: 0.08
Nodes (40): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+32 more)

### Community 34 - "doctor.ts"
Cohesion: 0.13
Nodes (19): check(), DoctorCheck, DoctorDeps, DoctorStatus, missingBundleFiles(), runDoctor(), GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME (+11 more)

### Community 35 - "4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)"
Cohesion: 0.40
Nodes (5): 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), Skill 1: `read-spec-first.md`, Skill 2: `consult-graphify-ast.md`, Skill 3: `self-healing-verify.md`, Skill 4: `universal-design-patterns.md`

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "contracts.ts"
Cohesion: 0.19
Nodes (15): ChangeKind, Exploration, FailureVerdict, FixResult, HaltReason, HarnessState, ReadyInput, ReadyResult (+7 more)

### Community 39 - "workers.ts"
Cohesion: 0.20
Nodes (11): FixInput, WorkResult, heuristicVerdict(), diffSnapshots(), scopeRisks(), buildFixMessage(), buildWorkMessage(), commandDetail() (+3 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 42 - "package-manager.ts"
Cohesion: 0.27
Nodes (6): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec()

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 44 - "openspec/types.ts"
Cohesion: 0.18
Nodes (15): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, createsConflict(), dependsOn() (+7 more)

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "mergeConfig"
Cohesion: 0.47
Nodes (6): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), config(), configWith()

### Community 47 - "manifest.ts"
Cohesion: 0.27
Nodes (12): runArchiveCommand(), archiveSpec(), buildTaskDocument(), createScaffoldManifest(), defaultAcceptance(), inferBoundedContexts(), loadManifest(), parseManifest() (+4 more)

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "harness.ts"
Cohesion: 0.24
Nodes (15): CommitResult, FileChange, HaltCode, Risk, RunMode, RunResult, ValidationCommandResult, ValidationResult (+7 more)

### Community 50 - "diff.ts"
Cohesion: 0.27
Nodes (13): hashFile(), IGNORED_PREFIXES, isRunArtifact(), normalize(), outOfScope(), snapshotWorkspace(), WorkspaceSnapshot, changedFiles() (+5 more)

### Community 51 - "errorMessage"
Cohesion: 0.22
Nodes (11): runRestoreCommand(), getManifestPath(), backupId(), backupManifest(), backupsDir(), listManifestBackups(), ManifestBackup, restoreManifestBackup() (+3 more)

### Community 52 - "lock.ts"
Cohesion: 0.21
Nodes (13): HARNESS_DIR, HARNESS_LOCK_FILENAME, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile(), getLockPath(), isProcessAlive() (+5 more)

### Community 53 - "init.ts"
Cohesion: 0.29
Nodes (9): AgentInstallReport, InitOptions, InitReport, runInit(), VaultConnection, ensureHarnessDirs(), getTasksDir(), taskFilePath() (+1 more)

### Community 54 - "ConfigError"
Cohesion: 0.36
Nodes (9): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), isRecord(), readConfigFile(), validateConfigFile() (+1 more)

### Community 55 - "commit.ts"
Cohesion: 0.43
Nodes (7): buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest()

### Community 56 - "loadConfig"
Cohesion: 0.52
Nodes (6): runConfigCommand(), getConfigPaths(), loadConfig(), maskConfig(), maskEnv(), maskValue()

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 298 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0697980684811238 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `Artefacto int8 de Laya`, `install.ts`, `laya.ts`, `alvaress`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08484848484848485 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Configuración`, `Comandos`, `Agente, subagentes y skills`, `Aprendizaje continuo`, `Instalación`, `SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._