# Graph Report - alvaress  (2026-10-26)

## Corpus Check
- 96 files · ~88,006 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1085 nodes · 3240 edges · 39 communities (35 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7595b594`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- contracts.ts
- package.json
- install.ts
- quantize-laya.py
- pathExists
- compilerOptions
- alvaress
- reliability.test.ts
- loadConfig
- HarnessConfig
- tsconfig.test.json
- constants.ts
- modules.ts
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
- manifest.ts
- StatusLine
- laya/index.ts
- publishConfig
- RunLog
- loader.ts
- Subagentes y worker sin Aider
- doctor.ts
- process.ts
- verify.ts
- status.ts
- workers.ts
- package-manager.ts
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
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (39 total, 4 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.05
Nodes (75): renderAgent(), runCli(), runAgentCommand(), flagValue(), LearnCommandDeps, parseLimit(), printLearning(), resolvePaths() (+67 more)

### Community 1 - "contracts.ts"
Cohesion: 0.05
Nodes (54): Precisión, LayaConfig, DEFAULT_MAX_FIX_ATTEMPTS, ChangeKind, Complexity, DecisionEngine, Exploration, FailureInput (+46 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.10
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
Cohesion: 0.05
Nodes (43): alvaress, Aprendizaje continuo, Artefacto int8, Comandos, Comandos de Obsidian, Commits, Confiabilidad y seguridad, Configuración (+35 more)

### Community 8 - "reliability.test.ts"
Cohesion: 0.07
Nodes (41): agentFilePath(), AgentInstallOptions, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS, PermissionRule (+33 more)

### Community 9 - "loadConfig"
Cohesion: 0.29
Nodes (11): runConfigCommand(), InstallRuntime, getConfigPaths(), loadConfig(), maskConfig(), maskEnv(), maskValue(), saveGlobalConfig() (+3 more)

### Community 10 - "HarnessConfig"
Cohesion: 0.17
Nodes (10): Selección del worker, RunCommandDeps, HarnessConfig, Worker, ExploreContext, VerifyOptions, AiderWorker, createWorker() (+2 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.10
Nodes (19): DEFAULT_AIDER_TIMEOUT_MS, DEFAULT_MAX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_SCOPE, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, GLOBAL_CONFIG_PATH, HARNESS_CACHE_DIR (+11 more)

### Community 13 - "modules.ts"
Cohesion: 0.33
Nodes (6): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl()

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
Cohesion: 0.15
Nodes (25): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+17 more)

### Community 25 - "manifest.ts"
Cohesion: 0.06
Nodes (78): runArchiveCommand(), runRestoreCommand(), completeTask(), HARNESS_BACKUPS_DIR, HARNESS_DIR, TASKS_DIR, archiveSpec(), buildTaskDocument() (+70 more)

### Community 26 - "StatusLine"
Cohesion: 0.08
Nodes (34): CommitResult, FileChange, HarnessState, Risk, ValidationResult, HarnessRunReport, ANSI_PATTERN, background() (+26 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "RunLog"
Cohesion: 0.25
Nodes (4): LAYA_LOG_PATH, inspectLastRun(), RunLog, RunLogMeta

### Community 30 - "loader.ts"
Cohesion: 0.16
Nodes (19): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), ConfigPaths, HarnessConfigFile, isRecord() (+11 more)

### Community 31 - "Subagentes y worker sin Aider"
Cohesion: 0.05
Nodes (35): Artefacto int8 de Laya, Identidad del artefacto, Publicación pendiente, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación (+27 more)

### Community 34 - "doctor.ts"
Cohesion: 0.16
Nodes (16): check(), DoctorCheck, DoctorCommandDeps, DoctorDeps, DoctorStatus, missingBundleFiles(), runDoctor(), runDoctorCommand() (+8 more)

### Community 35 - "process.ts"
Cohesion: 0.27
Nodes (8): Validator, collectWarnings(), CommandValidator, CommandValidatorOptions, stripAnsi(), truncate(), runCommand(), runCommandChecked()

### Community 36 - "verify.ts"
Cohesion: 0.21
Nodes (13): AiderRunOptions, baseEnvironment(), buildAiderArgs(), buildAiderEnv(), runAider(), SAFE_ENV_KEYS, formatValidationFailure(), runValidationCommands() (+5 more)

### Community 37 - "status.ts"
Cohesion: 0.29
Nodes (7): GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, updateGraph(), commandExists()

### Community 39 - "workers.ts"
Cohesion: 0.24
Nodes (10): FixInput, FixResult, WorkResult, diffSnapshots(), buildFixMessage(), buildWorkMessage(), commandDetail(), existingFiles() (+2 more)

### Community 42 - "package-manager.ts"
Cohesion: 0.17
Nodes (12): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager (+4 more)

### Community 50 - "commit.ts"
Cohesion: 0.33
Nodes (9): OPENSPEC_FILENAME, RunMode, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged() (+1 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 300 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyBundle()` connect `laya/index.ts` to `contracts.ts`, `install.ts`, `alvaress`, `Subagentes y worker sin Aider`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05337078651685393 - nodes in this community are weakly interconnected._
- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051089108910891086 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Subagentes y worker sin Aider`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._