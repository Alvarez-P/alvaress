# Graph Report - alvaress  (2026-10-30)

## Corpus Check
- 141 files · ~95,178 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1358 nodes · 3933 edges · 86 communities (73 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `524ac3cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- orchestrator/report.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- laya/index.ts
- compilerOptions
- alvaress
- runFixture
- contracts.ts
- model.ts
- tsconfig.test.json
- manifest.ts
- Artefacto int8 de Laya
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
- run-log.ts
- laya-vendor.test.ts
- publishConfig
- pathExists
- pathExists
- RunLog
- usage.ts
- solution/src/cart.ts
- audit.ts
- learnings.ts
- compilerOptions
- verify.ts
- workers.ts
- doctor.ts
- Avisos de terceros
- cli.ts
- compilerOptions
- explore.ts
- doctor.ts
- HarnessConfig
- Subagentes y worker de código
- backup.ts
- laya/types.ts
- agent/installer.ts
- Especificación del arnés alvaress
- modules.ts
- status.ts
- Instalación
- git-diff.ts
- bench/run.ts
- compilerOptions
- harness.ts
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
- commands/report.ts
- vite-plus-verify/SKILL.md
- Benchmark
- vault-notes/SKILL.md
- Comandos
- constants.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 43 edges
2. `runHarnessCommand()` - 41 edges
3. `loadConfig()` - 34 edges
4. `HarnessConfig` - 32 edges
5. `errorMessage()` - 31 edges
6. `runInstall()` - 29 edges
7. `loadManifest()` - 27 edges
8. `makeTempDir()` - 27 edges
9. `DecisionEngine` - 26 edges
10. `runDoctor()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Frente a Aider` --references--> `WorkPlan`  [INFERRED]
  README.md → src/core/contracts.ts
- `Orquestación` --references--> `Worker`  [INFERRED]
  docs/spec.md → src/core/contracts.ts
- `Correr el benchmark` --references--> `HarnessCore`  [INFERRED]
  README.md → src/core/harness.ts
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Nombres` --references--> `loadConfig()`  [INFERRED]
  .harness/skills/clean-code/SKILL.md → src/config/loader.ts

## Import Cycles
- None detected.

## Communities (86 total, 13 thin omitted)

### Community 0 - "orchestrator/report.ts"
Cohesion: 0.26
Nodes (18): TaskOutcome, getRunsDir(), listAllReports(), listHarnessRunReports(), listRunReports(), newRunReportId(), readAnyReport(), readHarnessRun() (+10 more)

### Community 1 - "laya.ts"
Cohesion: 0.09
Nodes (26): Precisión, Decisión, LayaConfig, DecisionEngine, FlowInput, SPECIALIST_ROLES, choice(), createDecisionEngine() (+18 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.06
Nodes (63): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), CHECKLIST (+55 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "laya/index.ts"
Cohesion: 0.14
Nodes (26): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+18 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.11
Nodes (19): alvaress, Aprendizaje continuo, Bóveda Markdown, Conceptos del agente, Confiabilidad y seguridad, Configuración, Contenido, Desarrollo (+11 more)

### Community 8 - "runFixture"
Cohesion: 0.16
Nodes (12): benchConfig(), readTask(), runFixture(), diffSnapshots(), buildFixMessage(), buildWorkMessage(), docsRequested(), fastCheckCommand() (+4 more)

### Community 9 - "contracts.ts"
Cohesion: 0.16
Nodes (18): fixedDecisions(), ChangeKind, FailureInput, FailureVerdict, FlowPlan, LearningScopeDecision, LearningScopeInput, RiskAssessment (+10 more)

### Community 10 - "model.ts"
Cohesion: 0.13
Nodes (14): HfTokenizerLike, HfTokenizerModuleLike, importRuntime(), LayaModel, loadOnnxRuntime(), loadTokenizerModule(), OrtModuleLike, OrtSessionLike (+6 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "manifest.ts"
Cohesion: 0.16
Nodes (17): buildTaskDocument(), createScaffoldManifest(), defaultAcceptance(), inferBoundedContexts(), parseManifest(), scaffoldManifest(), serializeManifest(), BoundedContext (+9 more)

### Community 13 - "Artefacto int8 de Laya"
Cohesion: 0.25
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

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
Cohesion: 0.08
Nodes (29): ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground(), Palette (+21 more)

### Community 24 - "ref_node_path"
Cohesion: 0.05
Nodes (63): merge(), overlaps(), Range, Cart, CartItem, cart(), slugify(), FIXTURES_DIR (+55 more)

### Community 25 - "apply.ts"
Cohesion: 0.14
Nodes (25): completeTask(), updateGraph(), contextPath(), ensureTaskFile(), refreshSpecStatus(), setTaskStatus(), ApplyOptions, ApplyReport (+17 more)

### Community 26 - "run-log.ts"
Cohesion: 0.40
Nodes (5): writeHalt(), assessLearning(), redactSecrets(), redactValue(), SECRET_PATTERNS

### Community 27 - "laya-vendor.test.ts"
Cohesion: 0.13
Nodes (24): round4(), buildSequence(), checkChoiceLabels(), clampTemperature(), clampTemperatures(), confidenceFromProbs(), Encode, isFiniteNumber() (+16 more)

### Community 29 - "pathExists"
Cohesion: 0.17
Nodes (29): AgentInstallReport, InitOptions, InitReport, runInit(), closeVault(), flagValue(), runState(), runVaultCommand() (+21 more)

### Community 30 - "pathExists"
Cohesion: 0.16
Nodes (21): RunLogMeta, installSkills(), isLinkInto(), renderSkill(), RETIRED_SKILLS, SkillDefinition, skillFilePath(), SkillInstallOptions (+13 more)

### Community 31 - "RunLog"
Cohesion: 0.20
Nodes (8): flagValue(), parseFileList(), parseMode(), printDryRun(), reportTasks(), runHarnessCommand(), inspectLastRun(), RunLog

### Community 32 - "usage.ts"
Cohesion: 0.27
Nodes (9): TokenUsage, addUsage(), emptyUsage(), formatUsage(), numberOf(), OpencodeOutput, parseOpencodeOutput(), record() (+1 more)

### Community 33 - "solution/src/cart.ts"
Cohesion: 0.28
Nodes (6): Cart, CartItem, assertValidCoupon(), Coupon, discountFor(), InvalidCouponError

### Community 34 - "audit.ts"
Cohesion: 0.08
Nodes (46): addedLines(), AuditOptions, auditWorkspace(), C_STYLE, CODE_COMMENTS, CommentLines, CommentSyntax, countMatches() (+38 more)

### Community 35 - "learnings.ts"
Cohesion: 0.08
Nodes (60): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+52 more)

### Community 36 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 37 - "verify.ts"
Cohesion: 0.25
Nodes (12): asValidationResult(), formatValidationFailure(), runValidationCommands(), ValidationFailure, verifyAndRepairTask(), createWorker(), commandOutput(), truncate() (+4 more)

### Community 38 - "workers.ts"
Cohesion: 0.11
Nodes (20): ConsultInput, FixInput, FixResult, HaltReason, ReadyInput, ReadyResult, UsagePhase, WorkPlan (+12 more)

### Community 39 - "doctor.ts"
Cohesion: 0.14
Nodes (15): HARNESS_DIR, HARNESS_LOCK_FILENAME, CancelledError, DecisionError, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile() (+7 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "cli.ts"
Cohesion: 0.21
Nodes (17): renderAgent(), runCli(), runAgentCommand(), runDoctorCommand(), applyModel(), installCurrentAgent(), ModelRole, runModelsCommand() (+9 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 43 - "explore.ts"
Cohesion: 0.20
Nodes (21): markOddDone(), OPENSPEC_FILENAME, collectWorkItems(), findWorkItem(), loadManifest(), exploreOdd(), exploreRequest(), exploreSdd() (+13 more)

### Community 44 - "doctor.ts"
Cohesion: 0.16
Nodes (18): preflight(), subagentFilePath(), SUBAGENTS, check(), DoctorCheck, DoctorStatus, frontmatterModel(), missingBundleFiles() (+10 more)

### Community 45 - "HarnessConfig"
Cohesion: 0.17
Nodes (12): DoctorCommandDeps, LayaPlan, LearnCommandDeps, VaultCommandDeps, HarnessConfig, Validator, ExploreContext, collectWarnings() (+4 more)

### Community 46 - "Subagentes y worker de código"
Cohesion: 0.15
Nodes (13): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, Flujo de especialistas, HALT, Motor de decisión, Proporcionalidad (+5 more)

### Community 47 - "backup.ts"
Cohesion: 0.33
Nodes (11): runArchiveCommand(), archiveSpec(), getManifestPath(), saveManifest(), backupId(), backupManifest(), backupsDir(), listManifestBackups() (+3 more)

### Community 48 - "laya/types.ts"
Cohesion: 0.23
Nodes (10): Answer, AnswerBase, ChoiceAnswer, ChoiceQuestion, NoulAnswer, NoulQuestion, Question, ScoreAnswer (+2 more)

### Community 49 - "agent/installer.ts"
Cohesion: 0.12
Nodes (17): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+9 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.15
Nodes (13): Bóveda Markdown, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Orquestación, Principios (+5 more)

### Community 51 - "modules.ts"
Cohesion: 0.33
Nodes (6): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl()

### Community 52 - "status.ts"
Cohesion: 0.25
Nodes (8): DoctorDeps, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, getGraphStatus(), GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, walkNewest()

### Community 53 - "Instalación"
Cohesion: 0.67
Nodes (3): Checklist de componentes, Instalación, Qué hace el instalador

### Community 55 - "git-diff.ts"
Cohesion: 0.30
Nodes (14): ARTIFACT_EXCLUDES, isArtifact(), isSelected(), isTextFile(), normalize(), trackedDiff(), trackedPaths(), truncateDiff() (+6 more)

### Community 56 - "bench/run.ts"
Cohesion: 0.43
Nodes (7): csv(), main(), parseRoles(), ROLES, listFixtures(), mean(), summarize()

### Community 57 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 58 - "harness.ts"
Cohesion: 0.09
Nodes (31): failureText(), effectiveVault(), failureText(), MODES, RunCommandDeps, withVault(), CommitResult, Exploration (+23 more)

### Community 59 - "runner.ts"
Cohesion: 0.20
Nodes (13): BENCH_DIR, BenchOptions, BenchResult, FixtureTask, git(), prepareWorkdir(), REPO_ROOT, REQUIRED_AGENTS (+5 more)

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

### Community 77 - "commands/report.ts"
Cohesion: 0.47
Nodes (5): describe(), isHarnessReport(), runReportCommand(), AnyRunReport, RunReport

### Community 82 - "Benchmark"
Cohesion: 0.50
Nodes (4): Benchmark, Correr el benchmark, Frente a Aider, Qué se aprendió

### Community 85 - "Comandos"
Cohesion: 0.50
Nodes (4): Comandos, Ejemplos, `run` en detalle, Subcomandos

### Community 86 - "constants.ts"
Cohesion: 0.07
Nodes (28): DEFAULT_LAYA_TIMEOUT_MS, DEFAULT_MAX_ATTEMPTS, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_SCOPE, DEFAULT_VALIDATION_COMMANDS, DEFAULT_VAULT_PATH, DEFAULT_VITE_PLUS_CHECK, DEFAULT_VITE_PLUS_TEST (+20 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 410 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08673469387755102 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `Worker` to `verify.ts`, `workers.ts`, `runFixture`, `contracts.ts`, `Subagentes y worker de código`, `Especificación del arnés alvaress`, `ref_node_path`, `apply.ts`, `harness.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `loadConfig()` (e.g. with `Nombres` and `install.ts`) actually correct?**
  _`loadConfig()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._