# Graph Report - alvaress  (2026-10-27)

## Corpus Check
- 102 files · ~79,984 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1137 nodes · 3488 edges · 57 communities (50 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `78a3de74`
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
- .run
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
- pathExists
- StatusLine
- laya/index.ts
- publishConfig
- verify.ts
- manifest.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- package-manager.ts
- loader.ts
- reliability.test.ts
- Configuración
- Comandos
- contracts.ts
- workers.ts
- Avisos de terceros
- RunLog
- config/models.ts
- Agente, subagentes y skills
- prompt.ts
- Aprendizaje continuo
- mergeConfig
- validator.ts
- Instalación
- agent/installer.ts
- diff.ts
- commit.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
- status.ts
- loadConfig
- Flujo del agente
- Subagentes y worker sin Aider

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
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts

## Import Cycles
- None detected.

## Communities (57 total, 7 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.06
Nodes (74): runCli(), runAgentCommand(), flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope() (+66 more)

### Community 1 - "laya.ts"
Cohesion: 0.07
Nodes (40): Artefacto int8 de Laya, Identidad del artefacto, Precisión, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad (+32 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.11
Nodes (37): askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), buildAiderConfig() (+29 more)

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
Cohesion: 0.07
Nodes (36): ensurePipx(), CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl(), ensurePipxPath() (+28 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.16
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 10 - "run.ts"
Cohesion: 0.19
Nodes (14): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+6 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.08
Nodes (24): DEFAULT_AIDER_TIMEOUT_MS, DEFAULT_IMPLEMENTER_MODEL, DEFAULT_MAX_ATTEMPTS, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_SCOPE, DEFAULT_VALIDATION_COMMANDS, DEFAULT_VITE_PLUS_CHECK, DEFAULT_VITE_PLUS_TEST (+16 more)

### Community 13 - ".run"
Cohesion: 0.16
Nodes (6): HarnessHandlers, HarnessUI, emptyValidation(), HarnessCore, HarnessCoreOptions, makeFixture()

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
Cohesion: 0.13
Nodes (19): ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground(), PaletteColor (+11 more)

### Community 24 - "HarnessConfig"
Cohesion: 0.12
Nodes (15): Selección del worker, DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, RunCommandDeps, HarnessConfig, Worker (+7 more)

### Community 25 - "pathExists"
Cohesion: 0.06
Nodes (78): AgentInstallReport, InitOptions, InitReport, runInit(), configureObsidian(), flagValue(), runObsidianCommand(), runState() (+70 more)

### Community 26 - "StatusLine"
Cohesion: 0.17
Nodes (9): HarnessState, Palette, renderCommit(), renderFinalReport(), renderValidation(), STATE_LABEL, StatusLine, StatusLineOptions (+1 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "verify.ts"
Cohesion: 0.15
Nodes (20): LAYA_LOG_PATH, ObsidianInstallerDeps, AiderRunOptions, baseEnvironment(), buildAiderArgs(), buildAiderEnv(), runAider(), SAFE_ENV_KEYS (+12 more)

### Community 30 - "manifest.ts"
Cohesion: 0.06
Nodes (73): runArchiveCommand(), completeTask(), OPENSPEC_FILENAME, updateGraph(), archiveSpec(), buildTaskDocument(), collectWorkItems(), contextPath() (+65 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.25
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 32 - "package-manager.ts"
Cohesion: 0.23
Nodes (8): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), resolveInstallerPackageManager(), commandExists()

### Community 33 - "loader.ts"
Cohesion: 0.22
Nodes (17): assertBoolean(), assertModel(), assertModelSelection(), assertPositiveInteger(), assertString(), assertStringList(), ConfigPaths, HarnessConfigFile (+9 more)

### Community 34 - "reliability.test.ts"
Cohesion: 0.16
Nodes (17): SUBAGENTS, check(), DoctorCheck, DoctorStatus, frontmatterModel(), missingBundleFiles(), modelLabel(), runDoctor() (+9 more)

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "contracts.ts"
Cohesion: 0.14
Nodes (25): ChangeKind, CommitResult, Exploration, FileChange, HaltCode, HaltReason, ReadyInput, ReadyResult (+17 more)

### Community 39 - "workers.ts"
Cohesion: 0.20
Nodes (12): FixInput, FixResult, WorkResult, heuristicVerdict(), diffSnapshots(), scopeRisks(), buildFixMessage(), buildWorkMessage() (+4 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 42 - "config/models.ts"
Cohesion: 0.44
Nodes (8): applyModel(), aiderEnvFor(), aiderEnvKey(), aiderModelFor(), isModelReference(), PROVIDER_ENV_KEYS, providerOf(), validateModelReference()

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 44 - "prompt.ts"
Cohesion: 0.32
Nodes (5): @clack/prompts, COMMAND_SEPARATOR, CancelledError, joinCommandList(), parseCommandList()

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "mergeConfig"
Cohesion: 0.36
Nodes (7): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), config(), config(), configWith()

### Community 47 - "validator.ts"
Cohesion: 0.36
Nodes (4): Validator, collectWarnings(), CommandValidator, stripAnsi()

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "agent/installer.ts"
Cohesion: 0.13
Nodes (20): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+12 more)

### Community 50 - "diff.ts"
Cohesion: 0.25
Nodes (14): hashFile(), IGNORED_PREFIXES, isRunArtifact(), normalize(), outOfScope(), snapshotWorkspace(), WorkspaceSnapshot, changedFiles() (+6 more)

### Community 51 - "commit.ts"
Cohesion: 0.43
Nodes (7): buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest()

### Community 52 - "4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)"
Cohesion: 0.40
Nodes (5): 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), Skill 1: `read-spec-first.md`, Skill 2: `consult-graphify-ast.md`, Skill 3: `self-healing-verify.md`, Skill 4: `universal-design-patterns.md`

### Community 53 - "status.ts"
Cohesion: 0.25
Nodes (8): DoctorDeps, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, getGraphStatus(), GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, walkNewest()

### Community 54 - "loadConfig"
Cohesion: 0.23
Nodes (14): runConfigCommand(), InstallRuntime, ModelsCommandDeps, getConfigPaths(), loadConfig(), loadGlobalConfig(), maskConfig(), maskEnv() (+6 more)

### Community 57 - "Subagentes y worker sin Aider"
Cohesion: 0.18
Nodes (11): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos (+3 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 302 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `prompt.ts` to `package.json`, `install.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06106442577030812 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `laya.ts`, `install.ts`, `alvaress`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06573426573426573 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `HarnessConfig` to `contracts.ts`, `workers.ts`, `ref_node_path`, `run.ts`, `Subagentes y worker sin Aider`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._