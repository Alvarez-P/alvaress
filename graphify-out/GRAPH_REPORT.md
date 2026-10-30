# Graph Report - alvaress  (2026-10-30)

## Corpus Check
- 145 files · ~101,114 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1418 nodes · 4123 edges · 86 communities (73 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3dcca397`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- orchestrator/report.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- contracts.ts
- compilerOptions
- alvaress
- workers.ts
- obsidian/installer.ts
- manifest.ts
- tsconfig.test.json
- reliability.test.ts
- claude-backend.ts
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- final-report.ts
- ref_node_path
- apply.ts
- commands/run.ts
- laya/index.ts
- publishConfig
- pathExists
- fs.ts
- RunLog
- usage.ts
- solution/src/cart.ts
- audit.ts
- learnings.ts
- compilerOptions
- errorMessage
- .run
- lock.ts
- Avisos de terceros
- cli.ts
- compilerOptions
- package-manager.ts
- explore.ts
- loader.ts
- Subagentes y worker de código
- Aprendizaje continuo
- Agente, subagentes y skills
- agent/installer.ts
- Especificación del arnés alvaress
- Configuración
- doctor.ts
- Instalación
- git-diff.ts
- loadConfig
- compilerOptions
- commit.ts
- runner.ts
- Worker
- clean-code/SKILL.md
- fix-overlap/project/package.json
- solution/src/range.ts
- medium-cart/project/package.json
- small-slugify/project/package.json
- failure-triage/SKILL.md
- architecture-decisions/SKILL.md
- code-review/SKILL.md
- continuous-learning/SKILL.md
- technical-research/SKILL.md
- testing-strategy/SKILL.md
- ui-design/SKILL.md
- git-diff-context/SKILL.md
- self-healing-verify/SKILL.md
- config/models.ts
- obsidian-sdd/SKILL.md
- vite-plus-verify/SKILL.md
- StatusLine
- WorkPlan
- verify.ts
- Comandos

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 44 edges
2. `runHarnessCommand()` - 41 edges
3. `loadConfig()` - 35 edges
4. `errorMessage()` - 33 edges
5. `HarnessConfig` - 32 edges
6. `runInstall()` - 31 edges
7. `ensureDir()` - 29 edges
8. `makeTempDir()` - 29 edges
9. `loadManifest()` - 27 edges
10. `runDoctor()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Orquestación` --references--> `Worker`  [INFERRED]
  docs/spec.md → src/core/contracts.ts
- `Correr el benchmark` --references--> `HarnessCore`  [INFERRED]
  README.md → src/core/harness.ts
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Nombres` --references--> `loadConfig()`  [INFERRED]
  .harness/skills/clean-code/SKILL.md → src/config/loader.ts
- `Subagentes y worker de código` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (86 total, 13 thin omitted)

### Community 0 - "orchestrator/report.ts"
Cohesion: 0.23
Nodes (19): describe(), isHarnessReport(), runReportCommand(), HARNESS_RUNS_DIR, AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports() (+11 more)

### Community 1 - "laya.ts"
Cohesion: 0.06
Nodes (49): fixedDecisions(), Artefacto int8 de Laya, Identidad del artefacto, Precisión, Publicación, Qué cuantiza, Regenerar el artefacto, Uso (+41 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.07
Nodes (49): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), CHECKLIST (+41 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "contracts.ts"
Cohesion: 0.18
Nodes (14): ChangeKind, CommitResult, FileChange, FixResult, HaltCode, ReadyResult, Risk, RiskSeverity (+6 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.13
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+7 more)

### Community 8 - "workers.ts"
Cohesion: 0.14
Nodes (18): FixInput, FileContents, diffSnapshots(), buildConsultMessage(), buildFixMessage(), buildWorkMessage(), capBrief(), commandDetail() (+10 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.15
Nodes (24): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+16 more)

### Community 10 - "manifest.ts"
Cohesion: 0.14
Nodes (23): TASKS_DIR, buildTaskDocument(), collectWorkItems(), createScaffoldManifest(), defaultAcceptance(), ensureTaskFile(), findWorkItem(), inferBoundedContexts() (+15 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "reliability.test.ts"
Cohesion: 0.26
Nodes (14): runArchiveCommand(), runRestoreCommand(), completeTask(), HARNESS_BACKUPS_DIR, archiveSpec(), getManifestPath(), saveManifest(), backupId() (+6 more)

### Community 13 - "claude-backend.ts"
Cohesion: 0.22
Nodes (14): claudeArgs(), ClaudeArgsOptions, claudeModel(), claudePermissions, claudeSessionUuid(), DEFAULT_CLAUDE_SUBAGENT_MODEL, EDIT_TOOLS, numberOf() (+6 more)

### Community 14 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 16 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, bench, build, clean, commitlint, dev, lint, prepack (+8 more)

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
Nodes (27): ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground(), Palette (+19 more)

### Community 24 - "ref_node_path"
Cohesion: 0.06
Nodes (46): merge(), overlaps(), Range, Cart, CartItem, cart(), slugify(), SUBAGENTS (+38 more)

### Community 25 - "apply.ts"
Cohesion: 0.14
Nodes (24): updateGraph(), refreshSpecStatus(), ApplyOptions, ApplyReport, applyTasks(), executeTask(), existingAssignedFiles(), finishResult() (+16 more)

### Community 26 - "commands/run.ts"
Cohesion: 0.17
Nodes (14): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+6 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (78): missingBundleFiles(), downloadLayaBundle(), formatBytes(), promptLaya(), buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND (+70 more)

### Community 29 - "pathExists"
Cohesion: 0.17
Nodes (27): AgentInstallReport, InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand(), runState(), summarizeRun() (+19 more)

### Community 30 - "fs.ts"
Cohesion: 0.14
Nodes (27): configureObsidian(), installNodeDependencies(), isRepository(), runInstall(), CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, installSkills() (+19 more)

### Community 31 - "RunLog"
Cohesion: 0.32
Nodes (3): runFixture(), inspectLastRun(), RunLog

### Community 32 - "usage.ts"
Cohesion: 0.13
Nodes (19): BenchResult, LAYA_LOG_PATH, RunUsage, TokenUsage, UsagePhase, ObsidianInstallerDeps, RunLogMeta, addUsage() (+11 more)

### Community 33 - "solution/src/cart.ts"
Cohesion: 0.28
Nodes (6): Cart, CartItem, assertValidCoupon(), Coupon, discountFor(), InvalidCouponError

### Community 34 - "audit.ts"
Cohesion: 0.09
Nodes (38): addedLines(), AuditOptions, auditWorkspace(), C_STYLE, CODE_COMMENTS, CommentLines, CommentSyntax, countMatches() (+30 more)

### Community 35 - "learnings.ts"
Cohesion: 0.07
Nodes (66): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+58 more)

### Community 36 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 37 - "errorMessage"
Cohesion: 0.20
Nodes (10): Validator, collectWarnings(), CommandValidator, stripAnsi(), CancelledError, DecisionError, errorMessage(), truncate() (+2 more)

### Community 38 - ".run"
Cohesion: 0.10
Nodes (23): ConsultInput, Exploration, FlowPlan, HaltReason, HarnessHandlers, HarnessUI, ReadyInput, RouteDecision (+15 more)

### Community 39 - "lock.ts"
Cohesion: 0.21
Nodes (13): HARNESS_DIR, HARNESS_LOCK_FILENAME, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile(), getLockPath(), isProcessAlive() (+5 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "cli.ts"
Cohesion: 0.23
Nodes (16): renderAgent(), runCli(), runAgentCommand(), runDoctorCommand(), applyModel(), installCurrentAgent(), ModelRole, runModelsCommand() (+8 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 43 - "package-manager.ts"
Cohesion: 0.19
Nodes (10): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), packageManagerInstallArgs(), resolveInstallerPackageManager() (+2 more)

### Community 44 - "explore.ts"
Cohesion: 0.22
Nodes (19): markOddDone(), contextPath(), loadManifest(), exploreOdd(), exploreRequest(), exploreSdd(), extractAssignedFiles(), extractOpenRisks() (+11 more)

### Community 45 - "loader.ts"
Cohesion: 0.09
Nodes (33): assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths, isRecord(), ModelSelection, ScopeMode (+25 more)

### Community 46 - "Subagentes y worker de código"
Cohesion: 0.18
Nodes (11): Contrato de handoff, Contrato de respuesta, Eficiencia, Flujo de especialistas, HALT, Motor de decisión, Proporcionalidad, Reparto de subagentes (+3 more)

### Community 47 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 48 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 49 - "agent/installer.ts"
Cohesion: 0.13
Nodes (14): AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installSubagents(), LEARN_READ_COMMANDS, modelLine(), PermissionRule (+6 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.15
Nodes (13): Bóveda Obsidian, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Orquestación, Principios (+5 more)

### Community 51 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 52 - "doctor.ts"
Cohesion: 0.12
Nodes (23): agentFilePath(), installAgent(), check(), DoctorCheck, DoctorDeps, DoctorStatus, frontmatterModel(), modelLabel() (+15 more)

### Community 53 - "Instalación"
Cohesion: 0.50
Nodes (4): Checklist de componentes, Instalación, Instalación desatendida, Qué hace el instalador

### Community 55 - "git-diff.ts"
Cohesion: 0.30
Nodes (13): ARTIFACT_EXCLUDES, isArtifact(), isSelected(), isTextFile(), normalize(), trackedDiff(), trackedPaths(), truncateDiff() (+5 more)

### Community 56 - "loadConfig"
Cohesion: 0.29
Nodes (11): runConfigCommand(), InstallRuntime, ModelsCommandDeps, displayConfig(), getConfigPaths(), loadConfig(), loadGlobalConfig(), readConfigFile() (+3 more)

### Community 57 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 58 - "commit.ts"
Cohesion: 0.33
Nodes (9): OPENSPEC_FILENAME, RunMode, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged() (+1 more)

### Community 59 - "runner.ts"
Cohesion: 0.12
Nodes (27): csv(), main(), parseRoles(), ROLES, BENCH_DIR, benchConfig(), BenchOptions, DIRECT_TOOLS (+19 more)

### Community 60 - "Worker"
Cohesion: 0.14
Nodes (10): DoctorCommandDeps, LayaPlan, ObsidianCommandDeps, HarnessConfig, Worker, ExecutionContext, ExploreContext, CommandValidatorOptions (+2 more)

### Community 61 - "clean-code/SKILL.md"
Cohesion: 0.22
Nodes (8): Antes de terminar, Constantes y literales, Duplicación y abstracción, Funciones, Nombres, Ruido y errores, Tipos (TypeScript), result()

### Community 62 - "fix-overlap/project/package.json"
Cohesion: 0.50
Nodes (3): name, private, type

### Community 63 - "solution/src/range.ts"
Cohesion: 0.67
Nodes (3): merge(), overlaps(), Range

### Community 64 - "medium-cart/project/package.json"
Cohesion: 0.50
Nodes (3): name, private, type

### Community 65 - "small-slugify/project/package.json"
Cohesion: 0.50
Nodes (3): name, private, type

### Community 67 - "failure-triage/SKILL.md"
Cohesion: 0.33
Nodes (5): Contrato de respuesta, Fallo de auditoría, Límites, Nuclear (HALT), Trivial (reparar)

### Community 68 - "architecture-decisions/SKILL.md"
Cohesion: 0.40
Nodes (4): Contrato de respuesta, Cuándo usar qué, Principio, Proceso

### Community 69 - "code-review/SKILL.md"
Cohesion: 0.40
Nodes (4): Contrato de respuesta, Cómo reportar, Eje 1 · Spec, Eje 2 · Estándares

### Community 70 - "continuous-learning/SKILL.md"
Cohesion: 0.40
Nodes (4): Antes de trabajar, Calidad, Después de cerrar, Scope

### Community 71 - "technical-research/SKILL.md"
Cohesion: 0.40
Nodes (4): Contrato de respuesta, Fuentes, Qué evaluar, Reglas

### Community 72 - "testing-strategy/SKILL.md"
Cohesion: 0.40
Nodes (4): Casos que no pueden faltar, Contrato de respuesta, Pirámide, Reglas

### Community 73 - "ui-design/SKILL.md"
Cohesion: 0.40
Nodes (4): Antes de proponer, Contrato de respuesta, Cuándo usar qué, Principios

### Community 74 - "git-diff-context/SKILL.md"
Cohesion: 0.50
Nodes (3): Cómo leerlo, Límites, Para qué sirve

### Community 75 - "self-healing-verify/SKILL.md"
Cohesion: 0.50
Nodes (3): Fixer, Implementer, Siempre

### Community 83 - "WorkPlan"
Cohesion: 0.29
Nodes (7): Backend de Claude Code, Contrato del worker, Correr el benchmark, Inspiración y benchmark frente a Aider, Resultados con modelos de Anthropic (2026-10-30), WorkPlan, risks()

### Community 84 - "verify.ts"
Cohesion: 0.52
Nodes (6): asValidationResult(), formatValidationFailure(), runValidationCommands(), verifyAndRepairTask(), createWorker(), commandOutput()

### Community 85 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 425 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05744888023369036 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Aprendizaje continuo`, `Agente, subagentes y skills`, `Especificación del arnés alvaress`, `Configuración`, `Comandos`, `spec.md`, `Instalación`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `laya.ts`, `install.ts`, `alvaress`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._