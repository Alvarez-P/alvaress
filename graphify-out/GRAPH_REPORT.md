# Graph Report - alvaress  (2026-10-30)

## Corpus Check
- 143 files · ~98,959 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1394 nodes · 4030 edges · 85 communities (72 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a798f58`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- orchestrator/report.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- diff.ts
- compilerOptions
- alvaress
- workers.ts
- obsidian/installer.ts
- openspec/types.ts
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
- laya/index.ts
- publishConfig
- pathExists
- pathExists
- RunLog
- usage.ts
- solution/src/cart.ts
- audit.ts
- learnings.ts
- compilerOptions
- process.ts
- contracts.ts
- doctor.ts
- Avisos de terceros
- cli.ts
- compilerOptions
- package-manager.ts
- commit.ts
- loader.ts
- Subagentes y worker de código
- Aprendizaje continuo
- Agente, subagentes y skills
- agent/installer.ts
- Especificación del arnés alvaress
- Configuración
- LayaAgentLike
- Instalación
- git-diff.ts
- prompt.ts
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
- obsidian-sdd/SKILL.md
- vite-plus-verify/SKILL.md
- process.ts
- Comandos
- constants.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 44 edges
2. `runHarnessCommand()` - 41 edges
3. `loadConfig()` - 34 edges
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

## Communities (85 total, 13 thin omitted)

### Community 0 - "orchestrator/report.ts"
Cohesion: 0.17
Nodes (21): TaskOutcome, AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports(), listRunReports(), newRunReportId(), readAnyReport() (+13 more)

### Community 1 - "laya.ts"
Cohesion: 0.08
Nodes (39): fixedDecisions(), Precisión, Decisión, LayaConfig, Complexity, DecisionEngine, FailureInput, FailureVerdict (+31 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.10
Nodes (33): askModel(), CHECKLIST, ChecklistEntry, ChecklistId, Component, COMPONENT_VALUES, ComponentResult, componentsFor() (+25 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "diff.ts"
Cohesion: 0.25
Nodes (14): hashFile(), IGNORED_PREFIXES, isRunArtifact(), normalize(), outOfScope(), snapshotWorkspace(), WorkspaceSnapshot, changedFiles() (+6 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.13
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+7 more)

### Community 8 - "workers.ts"
Cohesion: 0.13
Nodes (21): FixInput, heuristicVerdict(), FileContents, diffSnapshots(), scopeRisks(), buildConsultMessage(), buildFixMessage(), buildWorkMessage() (+13 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.14
Nodes (24): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+16 more)

### Community 10 - "openspec/types.ts"
Cohesion: 0.17
Nodes (16): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, createsConflict(), dependsOn() (+8 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "manifest.ts"
Cohesion: 0.14
Nodes (30): runArchiveCommand(), runRestoreCommand(), completeTask(), archiveSpec(), buildTaskDocument(), collectWorkItems(), createScaffoldManifest(), defaultAcceptance() (+22 more)

### Community 13 - "Artefacto int8 de Laya"
Cohesion: 0.22
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
Nodes (30): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+22 more)

### Community 24 - "ref_node_path"
Cohesion: 0.06
Nodes (46): merge(), overlaps(), Range, Cart, CartItem, cart(), slugify(), interpolateCommands() (+38 more)

### Community 25 - "apply.ts"
Cohesion: 0.31
Nodes (9): contextPath(), ApplyOptions, ApplyReport, executeTask(), existingAssignedFiles(), finishResult(), newChanges(), runGroup() (+1 more)

### Community 26 - "run-log.ts"
Cohesion: 0.28
Nodes (7): writeHalt(), LAYA_LOG_PATH, assessLearning(), RunLogMeta, redactSecrets(), redactValue(), SECRET_PATTERNS

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "pathExists"
Cohesion: 0.15
Nodes (28): AgentInstallReport, InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand(), runState(), summarizeRun() (+20 more)

### Community 30 - "pathExists"
Cohesion: 0.17
Nodes (22): OPENCODE_SKILLS_DIR, SKILLS_DIR, installSkills(), renderSkill(), SkillDefinition, skillFilePath(), SkillInstallOptions, SkillLink (+14 more)

### Community 31 - "RunLog"
Cohesion: 0.21
Nodes (8): flagValue(), parseFileList(), parseMode(), printDryRun(), reportTasks(), runHarnessCommand(), inspectLastRun(), RunLog

### Community 32 - "usage.ts"
Cohesion: 0.20
Nodes (12): BenchResult, RunUsage, TokenUsage, UsagePhase, addUsage(), emptyUsage(), formatUsage(), numberOf() (+4 more)

### Community 33 - "solution/src/cart.ts"
Cohesion: 0.28
Nodes (6): Cart, CartItem, assertValidCoupon(), Coupon, discountFor(), InvalidCouponError

### Community 34 - "audit.ts"
Cohesion: 0.14
Nodes (23): addedLines(), AuditOptions, auditWorkspace(), C_STYLE, CODE_COMMENTS, CommentLines, CommentSyntax, countMatches() (+15 more)

### Community 35 - "learnings.ts"
Cohesion: 0.06
Nodes (77): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+69 more)

### Community 36 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 37 - "process.ts"
Cohesion: 0.20
Nodes (12): Validator, ObsidianInstallerDeps, collectWarnings(), CommandValidatorOptions, ValidationFailure, stripAnsi(), truncate(), CommandResult (+4 more)

### Community 38 - "contracts.ts"
Cohesion: 0.13
Nodes (32): effectiveVault(), failureText(), MODES, withVault(), ChangeKind, CommitResult, ConsultInput, Exploration (+24 more)

### Community 39 - "doctor.ts"
Cohesion: 0.11
Nodes (29): agentFilePath(), SUBAGENTS, check(), DoctorCheck, DoctorStatus, frontmatterModel(), missingBundleFiles(), modelLabel() (+21 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "cli.ts"
Cohesion: 0.15
Nodes (28): Nombres, installAgent(), renderAgent(), runCli(), runAgentCommand(), runConfigCommand(), InstallRuntime, applyModel() (+20 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 43 - "package-manager.ts"
Cohesion: 0.21
Nodes (9): DEFAULT_PACKAGE_MANAGER, updateGraph(), defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), resolveInstallerPackageManager() (+1 more)

### Community 44 - "commit.ts"
Cohesion: 0.43
Nodes (7): buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest()

### Community 45 - "loader.ts"
Cohesion: 0.12
Nodes (23): assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths, HarnessConfigFile, isRecord(), ModelSelection (+15 more)

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
Cohesion: 0.13
Nodes (14): AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installSubagents(), LEARN_READ_COMMANDS, modelLine(), PermissionRule (+6 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.15
Nodes (13): Bóveda Obsidian, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Orquestación, Principios (+5 more)

### Community 51 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 53 - "Instalación"
Cohesion: 0.50
Nodes (4): Checklist de componentes, Instalación, Instalación desatendida, Qué hace el instalador

### Community 55 - "git-diff.ts"
Cohesion: 0.30
Nodes (13): ARTIFACT_EXCLUDES, isArtifact(), isSelected(), isTextFile(), normalize(), trackedDiff(), trackedPaths(), truncateDiff() (+5 more)

### Community 56 - "prompt.ts"
Cohesion: 0.25
Nodes (12): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askText(), askValidationCommands(), promptFullConfig(), promptLocalOverrides() (+4 more)

### Community 57 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 58 - "harness.ts"
Cohesion: 0.09
Nodes (17): Correr el benchmark, Inspiración y benchmark frente a Aider, Qué se aprendió de las mediciones, RunCommandDeps, HarnessHandlers, HarnessUI, RunResult, auditBlockers() (+9 more)

### Community 59 - "runner.ts"
Cohesion: 0.13
Nodes (24): csv(), main(), parseRoles(), ROLES, BENCH_DIR, benchConfig(), BenchOptions, failureText() (+16 more)

### Community 60 - "Worker"
Cohesion: 0.13
Nodes (15): DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, HarnessConfig, Worker, ExecutionContext, ExploreContext (+7 more)

### Community 61 - "clean-code/SKILL.md"
Cohesion: 0.29
Nodes (6): Antes de terminar, Constantes y literales, Duplicación y abstracción, Funciones, Ruido y errores, Tipos (TypeScript)

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

### Community 83 - "process.ts"
Cohesion: 0.35
Nodes (10): enableGraphifyHooks(), ensureUv(), installGraphify(), ensureUvPath(), installUv(), shellPlan(), uvInstallHint(), uvInstallPlan (+2 more)

### Community 85 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 86 - "constants.ts"
Cohesion: 0.07
Nodes (30): DoctorDeps, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, HARNESS_BACKUPS_DIR (+22 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 420 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `alvaress` connect `alvaress` to `Aprendizaje continuo`, `Agente, subagentes y skills`, `Especificación del arnés alvaress`, `Configuración`, `Comandos`, `spec.md`, `Instalación`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0764423076923077 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `laya.ts`, `install.ts`, `Artefacto int8 de Laya`, `alvaress`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Why does `@clack/prompts` connect `prompt.ts` to `package.json`, `install.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._