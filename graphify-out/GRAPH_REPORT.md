# Graph Report - alvaress  (2026-10-25)

## Corpus Check
- 97 files · ~85,999 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1063 nodes · 3218 edges · 45 communities (41 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9521e287`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- contracts.ts
- package.json
- install.ts
- quantize-laya.py
- contracts.ts
- compilerOptions
- alvaress
- reliability.test.ts
- cli.ts
- Subagentes y worker sin Aider
- tsconfig.test.json
- constants.ts
- Artefacto int8 de Laya
- ui.test.ts
- run.ts
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- diff.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
- manifest.ts
- StatusLine
- laya/index.ts
- DecisionEngine
- RunLog
- loader.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- HarnessConfig
- README.md
- doctor.ts
- process.ts
- aider.ts
- status.ts
- Modelo de decisión (Laya)
- workers.ts
- ConfigError
- Obsidian
- package-manager.ts
- mergeConfig
- Instalación

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
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Artefacto int8` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Contrato del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts
- `Contrato del worker` --references--> `risks()`  [INFERRED]
  docs/subagents.md → test/ui.test.ts

## Import Cycles
- None detected.

## Communities (45 total, 4 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.09
Nodes (46): flagValue(), LearnCommandDeps, parseLimit(), printLearning(), resolvePaths(), runLearnCommand(), GLOBAL_MEMORY_DIR, GLOBAL_MEMORY_FILENAME (+38 more)

### Community 1 - "contracts.ts"
Cohesion: 0.14
Nodes (23): ChangeKind, CommitResult, Exploration, FileChange, HaltCode, HaltReason, ReadyInput, ReadyResult (+15 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): author, description, files, keywords, license, main, name, packageManager (+12 more)

### Community 3 - "install.ts"
Cohesion: 0.06
Nodes (72): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+64 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "contracts.ts"
Cohesion: 0.17
Nodes (6): HarnessHandlers, HarnessUI, emptyValidation(), HarnessCore, HarnessCoreOptions, HarnessFixture

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.09
Nodes (22): alvaress, Aprendizaje continuo, Comandos, Commits, Confiabilidad y seguridad, Configuración, Contenido, Cómo funciona `apply` (+14 more)

### Community 8 - "reliability.test.ts"
Cohesion: 0.08
Nodes (37): SUBAGENTS, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest() (+29 more)

### Community 9 - "cli.ts"
Cohesion: 0.06
Nodes (60): agentFilePath(), AgentInstallOptions, AgentInstallReport, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+52 more)

### Community 10 - "Subagentes y worker sin Aider"
Cohesion: 0.22
Nodes (9): Contrato de handoff, Contrato de respuesta, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos, Skills por subagente (+1 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.10
Nodes (19): DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_SCOPE, DEFAULT_VALIDATION_COMMANDS, DEFAULT_VITE_PLUS_CHECK, GLOBAL_CONFIG_FILENAME, HARNESS_CACHE_DIR, HARNESS_RUNS_DIR (+11 more)

### Community 13 - "Artefacto int8 de Laya"
Cohesion: 0.25
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación pendiente, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 14 - "ui.test.ts"
Cohesion: 0.11
Nodes (23): ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground(), PaletteColor (+15 more)

### Community 15 - "run.ts"
Cohesion: 0.05
Nodes (82): describe(), isHarnessReport(), runReportCommand(), closeObsidian(), effectiveVault(), failureText(), flagValue(), markOddDone() (+74 more)

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

### Community 24 - "4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)"
Cohesion: 0.40
Nodes (5): 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), Skill 1: `read-spec-first.md`, Skill 2: `consult-graphify-ast.md`, Skill 3: `self-healing-verify.md`, Skill 4: `universal-design-patterns.md`

### Community 25 - "manifest.ts"
Cohesion: 0.06
Nodes (72): runArchiveCommand(), runRestoreCommand(), completeTask(), HARNESS_BACKUPS_DIR, archiveSpec(), buildTaskDocument(), collectWorkItems(), contextPath() (+64 more)

### Community 26 - "StatusLine"
Cohesion: 0.19
Nodes (7): HarnessState, Palette, renderCommit(), renderFinalReport(), renderValidation(), StatusLine, StatusLineOptions

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 28 - "DecisionEngine"
Cohesion: 0.09
Nodes (28): Precisión, LayaConfig, Complexity, DecisionEngine, FailureInput, FailureVerdict, RiskAssessment, RiskInput (+20 more)

### Community 30 - "loader.ts"
Cohesion: 0.13
Nodes (20): ConfigPaths, HarnessConfigFile, maskConfig(), maskEnv(), maskValue(), ModelProviderConfig, PackageManager, saveGlobalConfig() (+12 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.25
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 32 - "HarnessConfig"
Cohesion: 0.15
Nodes (12): Selección del worker, ObsidianCommandDeps, RunCommandDeps, HarnessConfig, Worker, ExecutionContext, ExploreContext, CommandValidatorOptions (+4 more)

### Community 33 - "README.md"
Cohesion: 0.25
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 34 - "doctor.ts"
Cohesion: 0.17
Nodes (16): check(), DoctorCheck, DoctorCommandDeps, DoctorDeps, DoctorStatus, missingBundleFiles(), runDoctor(), LAYA_FP32_MODEL_CACHE_ROOT (+8 more)

### Community 35 - "process.ts"
Cohesion: 0.27
Nodes (8): ValidationCommandResult, Validator, collectWarnings(), CommandValidator, stripAnsi(), truncate(), runCommand(), runCommandChecked()

### Community 36 - "aider.ts"
Cohesion: 0.39
Nodes (6): AiderRunOptions, baseEnvironment(), buildAiderArgs(), buildAiderEnv(), runAider(), SAFE_ENV_KEYS

### Community 37 - "status.ts"
Cohesion: 0.25
Nodes (8): GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, updateGraph(), packageManagerAvailable(), commandExists()

### Community 38 - "Modelo de decisión (Laya)"
Cohesion: 0.67
Nodes (3): Artefacto int8, Modelo de decisión (Laya), Privacidad

### Community 39 - "workers.ts"
Cohesion: 0.19
Nodes (13): Contrato del worker, FixInput, FixResult, WorkPlan, WorkResult, heuristicVerdict(), diffSnapshots(), buildFixMessage() (+5 more)

### Community 40 - "ConfigError"
Cohesion: 0.36
Nodes (9): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), isRecord(), readConfigFile(), validateConfigFile() (+1 more)

### Community 41 - "Obsidian"
Cohesion: 0.67
Nodes (3): Comandos de Obsidian, Obsidian, Uso en el flujo híbrido

### Community 42 - "package-manager.ts"
Cohesion: 0.31
Nodes (5): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerExec()

### Community 43 - "mergeConfig"
Cohesion: 0.47
Nodes (6): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), config(), configWith()

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 286 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09308510638297872 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `install.ts`, `DecisionEngine`, `Artefacto int8 de Laya`, `Modelo de decisión (Laya)`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14393939393939395 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `HarnessConfig` to `contracts.ts`, `workers.ts`, `reliability.test.ts`, `Subagentes y worker sin Aider`, `run.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._