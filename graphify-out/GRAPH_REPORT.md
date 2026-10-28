# Graph Report - alvaress  (2026-10-27)

## Corpus Check
- 102 files · ~80,701 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1139 nodes · 3495 edges · 59 communities (53 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f3bb8a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- lock.ts
- compilerOptions
- alvaress
- ref_node_path
- obsidian/installer.ts
- run.ts
- tsconfig.test.json
- constants.ts
- fs.ts
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- final-report.ts
- HarnessConfig
- orchestrator/report.ts
- errorMessage
- laya/index.ts
- publishConfig
- cli.ts
- apply.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- package-manager.ts
- loader.ts
- vault.ts
- Configuración
- Comandos
- contracts.ts
- workers.ts
- Avisos de terceros
- RunLog
- explore.ts
- Agente, subagentes y skills
- prompt.ts
- Aprendizaje continuo
- openspec/types.ts
- validator.ts
- Instalación
- doctor.ts
- diff.ts
- commit.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
- manifest.ts
- pipx.ts
- Flujo del agente
- Artefacto int8 de Laya
- Subagentes y worker sin Aider
- CommandResult

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 47 edges
2. `runHarnessCommand()` - 40 edges
3. `HarnessConfig` - 34 edges
4. `errorMessage()` - 33 edges
5. `loadConfig()` - 31 edges
6. `ensureDir()` - 31 edges
7. `runInstall()` - 30 edges
8. `loadManifest()` - 27 edges
9. `runDoctor()` - 25 edges
10. `connectObsidianVault()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts
- `Contrato del worker` --references--> `risks()`  [INFERRED]
  docs/subagents.md → test/ui.test.ts

## Import Cycles
- None detected.

## Communities (59 total, 6 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.08
Nodes (61): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+53 more)

### Community 1 - "laya.ts"
Cohesion: 0.09
Nodes (30): Precisión, LayaConfig, DecisionEngine, FailureInput, FailureVerdict, LearningScopeDecision, LearningScopeInput, RiskAssessment (+22 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.14
Nodes (24): Component, COMPONENT_VALUES, ComponentResult, DEFAULT_RUNTIME, describeModel(), downloadLayaBundle(), FIXED_COMPONENT_SUMMARY, formatBytes() (+16 more)

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
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estructura del paquete, Herramientas que instala y por qué, Inicio rápido, Licencia (+7 more)

### Community 8 - "ref_node_path"
Cohesion: 0.09
Nodes (31): SUBAGENTS, interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), config(), setupProject(), CLI (+23 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.16
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 10 - "run.ts"
Cohesion: 0.18
Nodes (14): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+6 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.07
Nodes (38): ConfigPaths, HarnessConfigFile, maskConfig(), maskEnv(), maskValue(), ModelProviderConfig, ModelSelection, PackageManager (+30 more)

### Community 13 - "fs.ts"
Cohesion: 0.13
Nodes (22): AgentInstallReport, InitOptions, InitReport, CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, VaultConnection, installSkills() (+14 more)

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
Nodes (31): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+23 more)

### Community 24 - "HarnessConfig"
Cohesion: 0.13
Nodes (14): Selección del worker, DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, RunCommandDeps, HarnessConfig, Worker (+6 more)

### Community 25 - "orchestrator/report.ts"
Cohesion: 0.14
Nodes (30): describe(), isHarnessReport(), runReportCommand(), writeHalt(), HARNESS_RUNS_DIR, CommitResult, FileChange, HaltCode (+22 more)

### Community 26 - "errorMessage"
Cohesion: 0.17
Nodes (17): runArchiveCommand(), archiveSpec(), getManifestPath(), parseManifest(), saveManifest(), backupId(), backupManifest(), backupsDir() (+9 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "cli.ts"
Cohesion: 0.10
Nodes (41): installAgent(), renderAgent(), runCli(), runAgentCommand(), runConfigCommand(), InstallRuntime, applyModel(), installCurrentAgent() (+33 more)

### Community 30 - "apply.ts"
Cohesion: 0.17
Nodes (20): completeTask(), updateGraph(), collectWorkItems(), contextPath(), findWorkItem(), refreshSpecStatus(), setTaskStatus(), OpenSpecManifest (+12 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.25
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 32 - "package-manager.ts"
Cohesion: 0.25
Nodes (7): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), commandExists()

### Community 33 - "loader.ts"
Cohesion: 0.42
Nodes (9): assertBoolean(), assertModel(), assertModelSelection(), assertPositiveInteger(), assertString(), assertStringList(), isRecord(), validateConfigFile() (+1 more)

### Community 34 - "vault.ts"
Cohesion: 0.19
Nodes (20): flagValue(), runObsidianCommand(), runState(), summarizeRun(), closeObsidian(), OPENSPEC_FILENAME, appendVaultNoteEntry(), connectObsidianVault() (+12 more)

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "contracts.ts"
Cohesion: 0.10
Nodes (24): DEFAULT_MAX_FIX_ATTEMPTS, ChangeKind, Complexity, Exploration, HaltReason, HarnessHandlers, HarnessUI, ReadyInput (+16 more)

### Community 39 - "workers.ts"
Cohesion: 0.18
Nodes (16): Contrato del worker, FixInput, FixResult, WorkPlan, WorkResult, heuristicVerdict(), runAider(), diffSnapshots() (+8 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "RunLog"
Cohesion: 0.25
Nodes (4): LAYA_LOG_PATH, inspectLastRun(), RunLog, RunLogMeta

### Community 42 - "explore.ts"
Cohesion: 0.22
Nodes (20): markOddDone(), loadManifest(), exploreOdd(), exploreRequest(), exploreSdd(), extractAssignedFiles(), extractOpenRisks(), extractSection() (+12 more)

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 44 - "prompt.ts"
Cohesion: 0.17
Nodes (20): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands() (+12 more)

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "openspec/types.ts"
Cohesion: 0.18
Nodes (15): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, createsConflict(), dependsOn() (+7 more)

### Community 47 - "validator.ts"
Cohesion: 0.27
Nodes (8): ValidationCommandResult, Validator, collectWarnings(), CommandValidator, stripAnsi(), truncate(), runCommand(), runCommandChecked()

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "doctor.ts"
Cohesion: 0.06
Nodes (45): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installSubagents(), LEARN_READ_COMMANDS, modelLine() (+37 more)

### Community 50 - "diff.ts"
Cohesion: 0.25
Nodes (14): hashFile(), IGNORED_PREFIXES, isRunArtifact(), normalize(), outOfScope(), snapshotWorkspace(), WorkspaceSnapshot, changedFiles() (+6 more)

### Community 51 - "commit.ts"
Cohesion: 0.39
Nodes (8): RunMode, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest()

### Community 52 - "4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)"
Cohesion: 0.40
Nodes (5): 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), Skill 1: `read-spec-first.md`, Skill 2: `consult-graphify-ast.md`, Skill 3: `self-healing-verify.md`, Skill 4: `universal-design-patterns.md`

### Community 53 - "manifest.ts"
Cohesion: 0.29
Nodes (13): runInit(), buildTaskDocument(), createScaffoldManifest(), defaultAcceptance(), ensureHarnessDirs(), ensureTaskFile(), inferBoundedContexts(), inferProjectName() (+5 more)

### Community 54 - "pipx.ts"
Cohesion: 0.42
Nodes (7): ensurePipx(), ensurePipxPath(), installPipx(), pipxInstallHint(), pipxInstallPlan, pipxUserBinDirs(), withSudo()

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 57 - "Subagentes y worker sin Aider"
Cohesion: 0.22
Nodes (9): Contrato de handoff, Contrato de respuesta, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos, Skills por subagente (+1 more)

### Community 58 - "CommandResult"
Cohesion: 0.33
Nodes (6): ObsidianInstallerDeps, ValidationFailure, subagentSessionId(), PipxInstallDeps, CommandResult, RunOptions

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 302 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `prompt.ts` to `package.json`, `install.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07731694828469023 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `Artefacto int8 de Laya`, `laya.ts`, `install.ts`, `alvaress`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08686868686868687 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `HarnessConfig` to `contracts.ts`, `workers.ts`, `ref_node_path`, `run.ts`, `Subagentes y worker sin Aider`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._