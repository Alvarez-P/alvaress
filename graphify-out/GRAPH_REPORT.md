# Graph Report - alvaress  (2026-10-30)

## Corpus Check
- 128 files · ~94,132 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1331 nodes · 3972 edges · 67 communities (61 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1d2f8c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- contracts.ts
- compilerOptions
- alvaress
- helpers.ts
- obsidian/installer.ts
- manifest.ts
- tsconfig.test.json
- reliability.test.ts
- DecisionEngine
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- final-report.ts
- ref_node_assert
- orchestrator/report.ts
- harness.ts
- laya/index.ts
- publishConfig
- pathExists
- fs.ts
- run.test.ts
- runner.ts
- solution/src/cart.ts
- workers.ts
- learnings.ts
- compilerOptions
- uv.ts
- .run
- errorMessage
- Avisos de terceros
- cli.ts
- compilerOptions
- package-manager.ts
- ensureDir
- loader.ts
- Subagentes y worker de código
- Aprendizaje continuo
- Agente, subagentes y skills
- agent/installer.ts
- Especificación del arnés alvaress
- Configuración
- doctor.ts
- Instalación
- Comandos
- Artefacto int8 de Laya
- compilerOptions
- modules.ts
- commit.ts
- cli.test.ts
- range.test.ts
- fix-overlap/project/package.json
- solution/src/range.ts
- medium-cart/project/package.json
- small-slugify/project/package.json

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 44 edges
2. `runHarnessCommand()` - 41 edges
3. `loadConfig()` - 33 edges
4. `errorMessage()` - 33 edges
5. `HarnessConfig` - 32 edges
6. `runInstall()` - 31 edges
7. `ensureDir()` - 29 edges
8. `makeTempDir()` - 28 edges
9. `loadManifest()` - 27 edges
10. `runDoctor()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Orquestación` --references--> `Worker`  [INFERRED]
  docs/spec.md → src/core/contracts.ts
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Inspiración y benchmark frente a Aider` --references--> `WorkPlan`  [INFERRED]
  README.md → src/core/contracts.ts
- `Subagentes y worker de código` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (67 total, 6 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (29): COMMAND_SEPARATOR, DEFAULT_LAYA_TIMEOUT_MS, DEFAULT_MAX_ATTEMPTS, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_SCOPE, DEFAULT_VALIDATION_COMMANDS, DEFAULT_VITE_PLUS_CHECK (+21 more)

### Community 1 - "laya.ts"
Cohesion: 0.10
Nodes (26): fixedDecisions(), LayaConfig, Complexity, FailureInput, FlowInput, LearningScopeDecision, LearningScopeInput, RiskAssessment (+18 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (22): author, description, files, homepage, keywords, license, main, name (+14 more)

### Community 3 - "install.ts"
Cohesion: 0.09
Nodes (43): askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), CHECKLIST, ChecklistEntry (+35 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "contracts.ts"
Cohesion: 0.16
Nodes (20): ChangeKind, ConsultInput, Exploration, FailureVerdict, FixResult, FlowPlan, HaltReason, HarnessState (+12 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.13
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+7 more)

### Community 8 - "helpers.ts"
Cohesion: 0.21
Nodes (9): setupProject(), fakeOpencode(), makeTempDir(), TempDir, withPathAsync(), writeExecutable(), writeJson(), projectWith() (+1 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.14
Nodes (25): InstallRuntime, detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac() (+17 more)

### Community 10 - "manifest.ts"
Cohesion: 0.07
Nodes (54): TASKS_DIR, buildTaskDocument(), collectWorkItems(), contextPath(), createScaffoldManifest(), defaultAcceptance(), ensureTaskFile(), findWorkItem() (+46 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "reliability.test.ts"
Cohesion: 0.19
Nodes (17): runArchiveCommand(), runRestoreCommand(), completeTask(), HARNESS_BACKUPS_DIR, archiveSpec(), loadManifest(), parseManifest(), saveManifest() (+9 more)

### Community 13 - "DecisionEngine"
Cohesion: 0.14
Nodes (13): Precisión, Decisión, DecisionEngine, choice(), describeFlow(), flowConfidence(), LayaAgentLike, LayaDecisionEngine (+5 more)

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
Nodes (23): ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground(), Palette (+15 more)

### Community 24 - "ref_node_assert"
Cohesion: 0.14
Nodes (7): Cart, CartItem, cart(), slugify(), VERSION, pkg, root

### Community 25 - "orchestrator/report.ts"
Cohesion: 0.18
Nodes (23): describe(), isHarnessReport(), runReportCommand(), writeHalt(), TaskOutcome, AnyRunReport, getRunsDir(), listAllReports() (+15 more)

### Community 26 - "harness.ts"
Cohesion: 0.15
Nodes (18): effectiveVault(), failureText(), MODES, withVault(), CommitResult, FileChange, Risk, RunMode (+10 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "pathExists"
Cohesion: 0.20
Nodes (25): InitOptions, runInit(), flagValue(), runObsidianCommand(), runState(), summarizeRun(), closeObsidian(), appendVaultNoteEntry() (+17 more)

### Community 30 - "fs.ts"
Cohesion: 0.28
Nodes (14): markOddDone(), ensureDir(), isDirectory(), linkDirectory(), linkFile(), linkPath(), LinkType, readTextFile() (+6 more)

### Community 31 - "run.test.ts"
Cohesion: 0.22
Nodes (10): git(), repo(), baseConfig(), writeFile(), git(), initRepo(), manifest(), oddNote() (+2 more)

### Community 32 - "runner.ts"
Cohesion: 0.06
Nodes (48): csv(), main(), parseRoles(), ROLES, BENCH_DIR, benchConfig(), BenchOptions, BenchResult (+40 more)

### Community 33 - "solution/src/cart.ts"
Cohesion: 0.28
Nodes (6): Cart, CartItem, assertValidCoupon(), Coupon, discountFor(), InvalidCouponError

### Community 34 - "workers.ts"
Cohesion: 0.05
Nodes (72): FixInput, heuristicVerdict(), addedLines(), AuditOptions, auditWorkspace(), C_STYLE, CODE_COMMENTS, CommentLines (+64 more)

### Community 35 - "learnings.ts"
Cohesion: 0.08
Nodes (61): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+53 more)

### Community 36 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 37 - "uv.ts"
Cohesion: 0.29
Nodes (12): enableGraphifyHooks(), ensureUv(), installGraphify(), RunOptions, ensureUvPath(), installUv(), shellPlan(), UvInstallDeps (+4 more)

### Community 38 - ".run"
Cohesion: 0.10
Nodes (18): Correr el benchmark, Inspiración y benchmark frente a Aider, RunCommandDeps, HaltCode, HarnessHandlers, HarnessUI, RunResult, ValidationCommandResult (+10 more)

### Community 39 - "errorMessage"
Cohesion: 0.06
Nodes (39): DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, HarnessConfig, HARNESS_DIR, HARNESS_LOCK_FILENAME, Worker (+31 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "cli.ts"
Cohesion: 0.22
Nodes (16): renderAgent(), runCli(), runAgentCommand(), runDoctorCommand(), applyModel(), installCurrentAgent(), ModelRole, runModelsCommand() (+8 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 43 - "package-manager.ts"
Cohesion: 0.17
Nodes (11): DEFAULT_PACKAGE_MANAGER, updateGraph(), defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), packageManagerInstallArgs() (+3 more)

### Community 44 - "ensureDir"
Cohesion: 0.16
Nodes (15): AgentInstallReport, InitReport, CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, VaultConnection, installSkills(), renderSkill() (+7 more)

### Community 45 - "loader.ts"
Cohesion: 0.15
Nodes (27): runConfigCommand(), ModelsCommandDeps, assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths, displayConfig() (+19 more)

### Community 46 - "Subagentes y worker de código"
Cohesion: 0.15
Nodes (13): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, Flujo de especialistas, HALT, Motor de decisión, Proporcionalidad (+5 more)

### Community 47 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 48 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 49 - "agent/installer.ts"
Cohesion: 0.12
Nodes (20): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+12 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.15
Nodes (13): Bóveda Obsidian, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Orquestación, Principios (+5 more)

### Community 51 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 52 - "doctor.ts"
Cohesion: 0.14
Nodes (19): check(), DoctorCheck, DoctorDeps, DoctorStatus, frontmatterModel(), missingBundleFiles(), modelLabel(), runDoctor() (+11 more)

### Community 53 - "Instalación"
Cohesion: 0.50
Nodes (4): Checklist de componentes, Instalación, Instalación desatendida, Qué hace el instalador

### Community 55 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 57 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 58 - "modules.ts"
Cohesion: 0.33
Nodes (6): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl()

### Community 59 - "commit.ts"
Cohesion: 0.36
Nodes (8): OPENSPEC_FILENAME, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest()

### Community 60 - "cli.test.ts"
Cohesion: 0.40
Nodes (4): CLI, CliResult, manifest(), project()

### Community 61 - "range.test.ts"
Cohesion: 0.70
Nodes (3): merge(), overlaps(), Range

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

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 372 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `package.json` to `install.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06881720430107527 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `errorMessage` to `workers.ts`, `contracts.ts`, `.run`, `manifest.ts`, `Subagentes y worker de código`, `Especificación del arnés alvaress`, `harness.ts`, `run.test.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Aprendizaje continuo`, `Agente, subagentes y skills`, `Especificación del arnés alvaress`, `Configuración`, `Instalación`, `spec.md`, `Comandos`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._