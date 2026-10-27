# Graph Report - alvaress  (2026-10-26)

## Corpus Check
- 96 files · ~89,740 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1086 nodes · 3241 edges · 50 communities (44 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d6d67db`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- pathExists
- compilerOptions
- alvaress
- reliability.test.ts
- loader.ts
- Subagentes y worker sin Aider
- tsconfig.test.json
- constants.ts
- core-harness.test.ts
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- diff.ts
- obsidian/installer.ts
- apply.ts
- StatusLine
- laya/index.ts
- publishConfig
- RunLog
- ConfigError
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- run.ts
- agent/installer.ts
- doctor.ts
- process.ts
- verify.ts
- openspec/types.ts
- contracts.ts
- workers.ts
- README.md
- Artefacto int8 de Laya
- package-manager.ts
- El agente `alvaress`
- mergeConfig
- El instalador
- Modelo de decisión (Laya)
- Obsidian
- Instalación
- commit.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 49 edges
2. `runHarnessCommand()` - 37 edges
3. `errorMessage()` - 32 edges
4. `ensureDir()` - 31 edges
5. `HarnessConfig` - 29 edges
6. `loadManifest()` - 27 edges
7. `alvaress` - 27 edges
8. `loadConfig()` - 25 edges
9. `connectObsidianVault()` - 25 edges
10. `runInstall()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Artefacto int8` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Qué descarga y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Contrato del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts

## Import Cycles
- None detected.

## Communities (50 total, 6 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.09
Nodes (46): flagValue(), LearnCommandDeps, parseLimit(), printLearning(), resolvePaths(), runLearnCommand(), GLOBAL_MEMORY_DIR, GLOBAL_MEMORY_FILENAME (+38 more)

### Community 1 - "laya.ts"
Cohesion: 0.10
Nodes (23): Precisión, LayaConfig, DecisionEngine, RiskAssessment, RiskInput, HeuristicDecisionEngine, choice(), createDecisionEngine() (+15 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.09
Nodes (44): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+36 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "pathExists"
Cohesion: 0.06
Nodes (84): AgentInstallReport, InitOptions, InitReport, runInit(), flagValue(), ObsidianCommandDeps, runObsidianCommand(), runState() (+76 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.09
Nodes (23): alvaress, Aprendizaje continuo, Comandos, Commits, Confiabilidad y seguridad, Configuración, Contenido, Cómo funciona `apply` (+15 more)

### Community 8 - "reliability.test.ts"
Cohesion: 0.07
Nodes (32): VERSION, CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl(), setupProject() (+24 more)

### Community 9 - "loader.ts"
Cohesion: 0.15
Nodes (23): runConfigCommand(), InstallRuntime, ConfigPaths, getConfigPaths(), HarnessConfigFile, loadConfig(), maskConfig(), maskEnv() (+15 more)

### Community 10 - "Subagentes y worker sin Aider"
Cohesion: 0.11
Nodes (15): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos (+7 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.10
Nodes (20): DEFAULT_IMPLEMENTER_MODEL, DEFAULT_LAYA_TIMEOUT_MS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, DEFAULT_VITE_PLUS_CHECK, GLOBAL_CONFIG_FILENAME, GLOBAL_CONFIG_PATH, HARNESS_CACHE_DIR (+12 more)

### Community 13 - "core-harness.test.ts"
Cohesion: 0.10
Nodes (21): DEFAULT_MAX_FIX_ATTEMPTS, LAYA_LOG_PATH, Exploration, HaltReason, HarnessHandlers, HarnessUI, ReadyInput, ReadyResult (+13 more)

### Community 14 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

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
Cohesion: 0.24
Nodes (15): hashFile(), IGNORED_PREFIXES, isRunArtifact(), normalize(), outOfScope(), scopeRisks(), snapshotWorkspace(), WorkspaceSnapshot (+7 more)

### Community 24 - "obsidian/installer.ts"
Cohesion: 0.14
Nodes (25): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+17 more)

### Community 25 - "apply.ts"
Cohesion: 0.06
Nodes (72): runCli(), runAgentCommand(), runArchiveCommand(), runDoctorCommand(), describe(), isHarnessReport(), runReportCommand(), runRestoreCommand() (+64 more)

### Community 26 - "StatusLine"
Cohesion: 0.11
Nodes (19): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+11 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 30 - "ConfigError"
Cohesion: 0.42
Nodes (8): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), isRecord(), validateConfigFile(), ConfigError

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.15
Nodes (13): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local (+5 more)

### Community 32 - "run.ts"
Cohesion: 0.11
Nodes (25): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+17 more)

### Community 33 - "agent/installer.ts"
Cohesion: 0.13
Nodes (20): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+12 more)

### Community 34 - "doctor.ts"
Cohesion: 0.12
Nodes (20): check(), DoctorCheck, DoctorCommandDeps, DoctorDeps, DoctorStatus, missingBundleFiles(), runDoctor(), GRAPHIFY_DIR (+12 more)

### Community 35 - "process.ts"
Cohesion: 0.22
Nodes (11): HarnessConfig, Validator, ExploreContext, collectWarnings(), CommandValidator, CommandValidatorOptions, WorkerOptions, stripAnsi() (+3 more)

### Community 36 - "verify.ts"
Cohesion: 0.22
Nodes (14): AiderRunOptions, baseEnvironment(), buildAiderArgs(), buildAiderEnv(), runAider(), SAFE_ENV_KEYS, formatValidationFailure(), runValidationCommands() (+6 more)

### Community 37 - "openspec/types.ts"
Cohesion: 0.15
Nodes (18): BoundedContext, OpenSpecManifest, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, ExecutionContext (+10 more)

### Community 38 - "contracts.ts"
Cohesion: 0.17
Nodes (16): ChangeKind, CommitResult, Complexity, FailureInput, FailureVerdict, FileChange, HaltCode, Risk (+8 more)

### Community 39 - "workers.ts"
Cohesion: 0.20
Nodes (12): FixInput, FixResult, WorkResult, heuristicVerdict(), diffSnapshots(), buildFixMessage(), buildWorkMessage(), commandDetail() (+4 more)

### Community 40 - "README.md"
Cohesion: 0.25
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "Artefacto int8 de Laya"
Cohesion: 0.25
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación pendiente, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 42 - "package-manager.ts"
Cohesion: 0.25
Nodes (7): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), commandExists()

### Community 43 - "El agente `alvaress`"
Cohesion: 0.29
Nodes (7): Contrato de respuesta, Cómo trabaja: estados, El agente `alvaress`, Herramientas que usa, Permisos, Qué se instala, Subagentes

### Community 44 - "mergeConfig"
Cohesion: 0.47
Nodes (6): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), config(), configWith()

### Community 45 - "El instalador"
Cohesion: 0.40
Nodes (5): El instalador, Qué descarga y por qué, Qué escribe, Qué hace, paso a paso, Qué no hace

### Community 46 - "Modelo de decisión (Laya)"
Cohesion: 0.67
Nodes (3): Artefacto int8, Modelo de decisión (Laya), Privacidad

### Community 47 - "Obsidian"
Cohesion: 0.67
Nodes (3): Comandos de Obsidian, Obsidian, Uso en el flujo híbrido

### Community 50 - "commit.ts"
Cohesion: 0.33
Nodes (8): RunMode, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest()

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 301 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyBundle()` connect `laya/index.ts` to `laya.ts`, `install.ts`, `Artefacto int8 de Laya`, `El instalador`, `Modelo de decisión (Laya)`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09308510638297872 - nodes in this community are weakly interconnected._
- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10104529616724739 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `README.md`, `El agente `alvaress``, `El instalador`, `Modelo de decisión (Laya)`, `Obsidian`, `Instalación`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._