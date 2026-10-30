# Graph Report - alvaress  (2026-10-30)

## Corpus Check
- 106 files · ~90,990 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1221 nodes · 3753 edges · 49 communities (42 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `74df7735`
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
- reliability.test.ts
- obsidian/installer.ts
- manifest.ts
- tsconfig.test.json
- usage.ts
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
- apply.ts
- orchestrator/report.ts
- constants.ts
- laya/index.ts
- publishConfig
- vault.ts
- RunLog
- Worker
- workers.ts
- config/models.ts
- audit.ts
- learnings.ts
- locks.ts
- Avisos de terceros
- HarnessConfig
- ensureDir
- Subagentes y worker de código
- agent/installer.ts
- Especificación del arnés alvaress
- doctor.ts
- pathExists
- Artefacto int8 de Laya
- modules.ts
- run-log.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 44 edges
2. `runHarnessCommand()` - 41 edges
3. `errorMessage()` - 33 edges
4. `runInstall()` - 31 edges
5. `HarnessConfig` - 31 edges
6. `loadConfig()` - 31 edges
7. `ensureDir()` - 29 edges
8. `loadManifest()` - 27 edges
9. `makeTempDir()` - 27 edges
10. `runDoctor()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Inspiración y benchmark frente a Aider` --references--> `WorkPlan`  [INFERRED]
  README.md → src/core/contracts.ts
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Orquestación` --references--> `Worker`  [INFERRED]
  docs/spec.md → src/core/contracts.ts
- `Subagentes y worker de código` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Proporcionalidad` --references--> `heuristicFlow()`  [INFERRED]
  docs/subagents.md → src/decision/heuristics.ts

## Import Cycles
- None detected.

## Communities (49 total, 7 thin omitted)

### Community 0 - "loader.ts"
Cohesion: 0.12
Nodes (23): assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths, HarnessConfigFile, isRecord(), ModelSelection (+15 more)

### Community 1 - "laya.ts"
Cohesion: 0.07
Nodes (38): Precisión, Decisión, LayaConfig, Complexity, DecisionEngine, FailureInput, FailureVerdict, FlowInput (+30 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.06
Nodes (61): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), CHECKLIST (+53 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "contracts.ts"
Cohesion: 0.09
Nodes (37): RunCommandDeps, ChangeKind, CommitResult, ConsultInput, Exploration, FileChange, FlowPlan, HaltCode (+29 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.06
Nodes (36): Agente, subagentes y skills, alvaress, Aprendizaje continuo, Cada clave, Checklist de componentes, Comandos, Comandos, Confiabilidad y seguridad (+28 more)

### Community 8 - "reliability.test.ts"
Cohesion: 0.09
Nodes (33): SUBAGENTS, interpolateCommands(), interpolateEnv(), mergeConfig(), setupProject(), git(), repo(), CLI (+25 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.07
Nodes (52): GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, updateGraph(), detectObsidian(), downloadFile() (+44 more)

### Community 10 - "manifest.ts"
Cohesion: 0.15
Nodes (20): TASKS_DIR, buildTaskDocument(), createScaffoldManifest(), defaultAcceptance(), ensureHarnessDirs(), ensureTaskFile(), getTasksDir(), inferBoundedContexts() (+12 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "usage.ts"
Cohesion: 0.23
Nodes (11): RunUsage, TokenUsage, UsagePhase, addUsage(), emptyUsage(), formatUsage(), numberOf(), OpencodeOutput (+3 more)

### Community 13 - "explore.ts"
Cohesion: 0.25
Nodes (15): markOddDone(), exploreOdd(), extractAssignedFiles(), extractOpenRisks(), extractSection(), markChecklistDone(), normalize(), parseAcceptance() (+7 more)

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
Nodes (29): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+21 more)

### Community 24 - "apply.ts"
Cohesion: 0.07
Nodes (68): installAgent(), renderAgent(), runCli(), runAgentCommand(), runArchiveCommand(), runConfigCommand(), runInit(), InstallRuntime (+60 more)

### Community 25 - "orchestrator/report.ts"
Cohesion: 0.09
Nodes (38): describe(), isHarnessReport(), runReportCommand(), HARNESS_DIR, HARNESS_LOCK_FILENAME, TaskOutcome, AnyRunReport, getRunsDir() (+30 more)

### Community 26 - "constants.ts"
Cohesion: 0.09
Nodes (21): DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, HARNESS_CACHE_DIR, HARNESS_RUNS_DIR, LAYA_DIR, LAYA_FP32_MODEL_CACHE_ROOT (+13 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (72): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+64 more)

### Community 29 - "vault.ts"
Cohesion: 0.26
Nodes (17): flagValue(), runObsidianCommand(), runState(), summarizeRun(), closeObsidian(), appendVaultNoteEntry(), connectObsidianVault(), getVaultNotePath() (+9 more)

### Community 31 - "Worker"
Cohesion: 0.22
Nodes (4): Orquestación, Worker, ExecutionContext, VerifyOptions

### Community 32 - "workers.ts"
Cohesion: 0.12
Nodes (25): Contrato del worker, FixInput, FixResult, SpecialistRole, WorkPlan, WorkResult, heuristicVerdict(), FileContents (+17 more)

### Community 34 - "audit.ts"
Cohesion: 0.08
Nodes (45): OPENSPEC_FILENAME, addedLines(), AuditOptions, auditWorkspace(), C_STYLE, CODE_COMMENTS, CommentLines, CommentSyntax (+37 more)

### Community 35 - "learnings.ts"
Cohesion: 0.06
Nodes (75): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+67 more)

### Community 36 - "locks.ts"
Cohesion: 0.39
Nodes (8): createsConflict(), dependsOn(), describeGroups(), groupWorkItems(), normalizeFile(), orderGroup(), pathsOverlap(), sharesFiles()

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 42 - "HarnessConfig"
Cohesion: 0.17
Nodes (12): DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, HarnessConfig, Validator, ExploreContext, collectWarnings() (+4 more)

### Community 44 - "ensureDir"
Cohesion: 0.16
Nodes (15): AgentInstallReport, InitOptions, InitReport, CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, VaultConnection, renderSkill() (+7 more)

### Community 46 - "Subagentes y worker de código"
Cohesion: 0.15
Nodes (11): Contrato de handoff, Contrato de respuesta, Eficiencia, Flujo de especialistas, HALT, Motor de decisión, Proporcionalidad, Reparto de subagentes (+3 more)

### Community 49 - "agent/installer.ts"
Cohesion: 0.13
Nodes (14): AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installSubagents(), LEARN_READ_COMMANDS, modelLine(), PermissionRule (+6 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.17
Nodes (12): Bóveda Obsidian, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Principios, Restricciones de generación de código (+4 more)

### Community 52 - "doctor.ts"
Cohesion: 0.18
Nodes (19): agentFilePath(), subagentFilePath(), check(), DoctorCheck, DoctorDeps, DoctorStatus, frontmatterModel(), missingBundleFiles() (+11 more)

### Community 55 - "pathExists"
Cohesion: 0.31
Nodes (13): configureObsidian(), ensureDir(), isDirectory(), linkDirectory(), linkFile(), linkPath(), LinkType, pathExists() (+5 more)

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 58 - "modules.ts"
Cohesion: 0.36
Nodes (5): CONDITIONS, findPackageDir(), packageName(), pickEntry(), resolveModuleUrl()

### Community 59 - "run-log.ts"
Cohesion: 0.28
Nodes (7): writeHalt(), assessLearning(), updateCurrentState(), RunLogMeta, redactSecrets(), redactValue(), SECRET_PATTERNS

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 321 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `loader.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `install.ts` to `Artefacto int8 de Laya`, `laya.ts`, `laya/index.ts`, `alvaress`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07191316146540028 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Especificación del arnés alvaress`, `Subagentes y worker de código`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._