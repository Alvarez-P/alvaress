# Graph Report - alvaress  (2026-10-30)

## Corpus Check
- 104 files · ~89,100 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1199 nodes · 3684 edges · 60 communities (52 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `868dbf6b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- loader.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- contracts.ts
- compilerOptions
- alvaress
- helpers.ts
- obsidian/installer.ts
- LayaAgentLike
- tsconfig.test.json
- DecisionEngine
- errorMessage
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
- constants.ts
- laya/index.ts
- publishConfig
- vault.ts
- RunLog
- workers.ts
- config/models.ts
- audit.ts
- learnings.ts
- Configuración
- Comandos
- harness.ts
- git-diff.ts
- Avisos de terceros
- run.ts
- HarnessConfig
- Agente, subagentes y skills
- ensureDir
- Aprendizaje continuo
- Subagentes y worker de código
- cli.ts
- Instalación
- agent/installer.ts
- Especificación del arnés alvaress
- ref_node_fs
- package-manager.ts
- ref_node_path
- verify.ts
- pathExists
- Artefacto int8 de Laya
- run.test.ts
- modules.ts
- run-log.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 44 edges
2. `runHarnessCommand()` - 40 edges
3. `errorMessage()` - 33 edges
4. `runInstall()` - 31 edges
5. `HarnessConfig` - 31 edges
6. `loadConfig()` - 31 edges
7. `ensureDir()` - 29 edges
8. `loadManifest()` - 27 edges
9. `makeTempDir()` - 27 edges
10. `runDoctor()` - 25 edges

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

## Communities (60 total, 8 thin omitted)

### Community 0 - "loader.ts"
Cohesion: 0.10
Nodes (36): runConfigCommand(), InstallRuntime, ModelsCommandDeps, assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths (+28 more)

### Community 1 - "laya.ts"
Cohesion: 0.11
Nodes (20): LayaConfig, Complexity, FailureInput, FailureVerdict, FlowInput, RiskAssessment, RiskInput, RouteInput (+12 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.09
Nodes (45): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), CHECKLIST (+37 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "contracts.ts"
Cohesion: 0.16
Nodes (20): ChangeKind, ConsultInput, Exploration, FixResult, FlowPlan, HaltReason, ReadyInput, ReadyResult (+12 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.13
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+7 more)

### Community 8 - "helpers.ts"
Cohesion: 0.16
Nodes (17): setupProject(), git(), repo(), CLI, CliResult, manifest(), project(), baseConfig() (+9 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.15
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "DecisionEngine"
Cohesion: 0.13
Nodes (18): Precisión, Decisión, DecisionEngine, LearningScopeDecision, LearningScopeInput, HeuristicDecisionEngine, heuristicLearningScope(), choice() (+10 more)

### Community 13 - "errorMessage"
Cohesion: 0.20
Nodes (10): Validator, collectWarnings(), CommandValidator, stripAnsi(), CancelledError, DecisionError, errorMessage(), truncate() (+2 more)

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
Nodes (32): CommitResult, FileChange, HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette() (+24 more)

### Community 24 - "manifest.ts"
Cohesion: 0.05
Nodes (88): runArchiveCommand(), completeTask(), markOddDone(), HARNESS_DIR, HARNESS_LOCK_FILENAME, archiveSpec(), buildTaskDocument(), collectWorkItems() (+80 more)

### Community 25 - "orchestrator/report.ts"
Cohesion: 0.34
Nodes (13): TaskOutcome, AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports(), listRunReports(), readAnyReport(), readHarnessRun() (+5 more)

### Community 26 - "constants.ts"
Cohesion: 0.07
Nodes (36): check(), DoctorCheck, DoctorStatus, frontmatterModel(), modelLabel(), runDoctor(), CLAUDE_SKILLS_DIR, DEFAULT_LAYA_TIMEOUT_MS (+28 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (72): missingBundleFiles(), buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG (+64 more)

### Community 29 - "vault.ts"
Cohesion: 0.20
Nodes (22): flagValue(), runObsidianCommand(), runState(), summarizeRun(), closeObsidian(), appendVaultNoteEntry(), connectObsidianVault(), getVaultNotePath() (+14 more)

### Community 32 - "workers.ts"
Cohesion: 0.13
Nodes (21): FixInput, WorkResult, heuristicVerdict(), FileContents, diffSnapshots(), scopeRisks(), buildConsultMessage(), buildFixMessage() (+13 more)

### Community 34 - "audit.ts"
Cohesion: 0.08
Nodes (45): OPENSPEC_FILENAME, addedLines(), AuditOptions, auditWorkspace(), C_STYLE, CODE_COMMENTS, CommentLines, CommentSyntax (+37 more)

### Community 35 - "learnings.ts"
Cohesion: 0.08
Nodes (60): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+52 more)

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "harness.ts"
Cohesion: 0.12
Nodes (16): RunCommandDeps, HaltCode, HarnessHandlers, HarnessUI, RunMode, RunResult, ValidationCommandResult, ValidationResult (+8 more)

### Community 39 - "git-diff.ts"
Cohesion: 0.30
Nodes (13): ARTIFACT_EXCLUDES, isArtifact(), isSelected(), isTextFile(), normalize(), trackedDiff(), trackedPaths(), truncateDiff() (+5 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "run.ts"
Cohesion: 0.16
Nodes (16): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+8 more)

### Community 42 - "HarnessConfig"
Cohesion: 0.14
Nodes (11): DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, HarnessConfig, Worker, ExecutionContext, ExploreContext (+3 more)

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.50
Nodes (4): Agente, subagentes y skills, Inspiración y benchmark frente a Aider, Permisos, Skills

### Community 44 - "ensureDir"
Cohesion: 0.22
Nodes (15): AgentInstallReport, InitOptions, InitReport, VaultConnection, installSkills(), renderSkill(), SkillDefinition, skillFilePath() (+7 more)

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "Subagentes y worker de código"
Cohesion: 0.15
Nodes (13): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, Flujo de especialistas, HALT, Motor de decisión, Proporcionalidad (+5 more)

### Community 47 - "cli.ts"
Cohesion: 0.18
Nodes (20): runCli(), runAgentCommand(), runDoctorCommand(), runInit(), applyModel(), installCurrentAgent(), ModelRole, runModelsCommand() (+12 more)

### Community 48 - "Instalación"
Cohesion: 0.50
Nodes (4): Checklist de componentes, Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "agent/installer.ts"
Cohesion: 0.13
Nodes (19): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+11 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.15
Nodes (13): Bóveda Obsidian, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Orquestación, Principios (+5 more)

### Community 51 - "ref_node_fs"
Cohesion: 0.22
Nodes (5): VERSION, git(), initRepo(), pkg, root

### Community 52 - "package-manager.ts"
Cohesion: 0.11
Nodes (18): DoctorDeps, DEFAULT_PACKAGE_MANAGER, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, getGraphStatus(), GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS (+10 more)

### Community 53 - "ref_node_path"
Cohesion: 0.32
Nodes (10): enableGraphifyHooks(), ensureUv(), installGraphify(), ensureUvPath(), installUv(), shellPlan(), uvInstallHint(), uvInstallPlan (+2 more)

### Community 54 - "verify.ts"
Cohesion: 0.28
Nodes (11): ObsidianInstallerDeps, asValidationResult(), formatValidationFailure(), runValidationCommands(), ValidationFailure, verifyAndRepairTask(), createWorker(), commandOutput() (+3 more)

### Community 55 - "pathExists"
Cohesion: 0.36
Nodes (10): isDirectory(), linkDirectory(), linkFile(), linkPath(), LinkType, pathExists(), relativeTo(), removePath() (+2 more)

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 57 - "run.test.ts"
Cohesion: 0.27
Nodes (6): git(), initRepo(), manifest(), oddNote(), project(), tempDirs

### Community 58 - "modules.ts"
Cohesion: 0.33
Nodes (6): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl()

### Community 59 - "run-log.ts"
Cohesion: 0.32
Nodes (6): LAYA_LOG_PATH, assessLearning(), RunLogMeta, redactSecrets(), redactValue(), SECRET_PATTERNS

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 317 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `loader.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1024390243902439 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `install.ts` to `Artefacto int8 de Laya`, `laya.ts`, `laya/index.ts`, `alvaress`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Configuración`, `Comandos`, `Agente, subagentes y skills`, `Aprendizaje continuo`, `Instalación`, `Especificación del arnés alvaress`, `spec.md`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._