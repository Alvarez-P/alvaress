# Graph Report - alvaress  (2026-10-30)

## Corpus Check
- 143 files · ~98,560 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1392 nodes · 4022 edges · 82 communities (69 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c2cc58dc`
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
- workers.ts
- obsidian/installer.ts
- manifest.ts
- tsconfig.test.json
- reliability.test.ts
- LayaAgentLike
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
- process.ts
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
- Artefacto int8 de Laya
- compilerOptions
- HarnessConfig
- runner.ts
- Worker
- locks.ts
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
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Inspiración y benchmark frente a Aider` --references--> `WorkPlan`  [INFERRED]
  README.md → src/core/contracts.ts
- `Orquestación` --references--> `Worker`  [INFERRED]
  docs/spec.md → src/core/contracts.ts
- `Subagentes y worker de código` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (82 total, 13 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (26): CLAUDE_SKILLS_DIR, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, HARNESS_BACKUPS_DIR, HARNESS_CACHE_DIR, HARNESS_RUNS_DIR (+18 more)

### Community 1 - "laya.ts"
Cohesion: 0.08
Nodes (38): fixedDecisions(), Precisión, Decisión, LayaConfig, DecisionEngine, FailureInput, FailureVerdict, FlowInput (+30 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.07
Nodes (61): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), CHECKLIST (+53 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "contracts.ts"
Cohesion: 0.14
Nodes (25): BenchOptions, ChangeKind, CommitResult, ConsultInput, Exploration, FileChange, FixResult, FlowPlan (+17 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.11
Nodes (18): alvaress, Comandos, Confiabilidad y seguridad, Contenido, Desarrollo, Ejemplos, Estados de un `run`, Estructura del paquete (+10 more)

### Community 8 - "workers.ts"
Cohesion: 0.13
Nodes (22): FixInput, heuristicVerdict(), FileContents, diffSnapshots(), scopeRisks(), buildConsultMessage(), buildFixMessage(), buildWorkMessage() (+14 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.14
Nodes (25): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+17 more)

### Community 10 - "manifest.ts"
Cohesion: 0.15
Nodes (21): OPENSPEC_FILENAME, buildTaskDocument(), collectWorkItems(), createScaffoldManifest(), defaultAcceptance(), ensureTaskFile(), findWorkItem(), inferBoundedContexts() (+13 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "reliability.test.ts"
Cohesion: 0.23
Nodes (16): runArchiveCommand(), completeTask(), markOddDone(), archiveSpec(), getManifestPath(), loadManifest(), parseManifest(), saveManifest() (+8 more)

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
Nodes (29): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+21 more)

### Community 24 - "ref_node_path"
Cohesion: 0.06
Nodes (46): merge(), overlaps(), Range, Cart, CartItem, cart(), slugify(), SUBAGENTS (+38 more)

### Community 25 - "apply.ts"
Cohesion: 0.14
Nodes (30): updateGraph(), contextPath(), refreshSpecStatus(), ApplyOptions, ApplyReport, applyTasks(), executeTask(), existingAssignedFiles() (+22 more)

### Community 26 - "commands/run.ts"
Cohesion: 0.18
Nodes (14): failureText(), effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun() (+6 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "pathExists"
Cohesion: 0.17
Nodes (28): AgentInstallReport, InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand(), runState(), summarizeRun() (+20 more)

### Community 30 - "fs.ts"
Cohesion: 0.18
Nodes (18): installSkills(), renderSkill(), SkillDefinition, skillFilePath(), SkillInstallOptions, SkillLink, DecisionError, ensureDir() (+10 more)

### Community 31 - "RunLog"
Cohesion: 0.24
Nodes (5): runFixture(), ExploreContext, inspectLastRun(), RunLog, CommandValidator

### Community 32 - "usage.ts"
Cohesion: 0.21
Nodes (12): BenchResult, RunUsage, TokenUsage, UsagePhase, addUsage(), emptyUsage(), formatUsage(), numberOf() (+4 more)

### Community 33 - "solution/src/cart.ts"
Cohesion: 0.28
Nodes (6): Cart, CartItem, assertValidCoupon(), Coupon, discountFor(), InvalidCouponError

### Community 34 - "audit.ts"
Cohesion: 0.08
Nodes (44): addedLines(), AuditOptions, auditWorkspace(), C_STYLE, CODE_COMMENTS, CommentLines, CommentSyntax, countMatches() (+36 more)

### Community 35 - "learnings.ts"
Cohesion: 0.08
Nodes (60): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+52 more)

### Community 36 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 37 - "process.ts"
Cohesion: 0.15
Nodes (12): writeHalt(), Validator, assessLearning(), RunLogMeta, collectWarnings(), CommandValidatorOptions, stripAnsi(), CommandResult (+4 more)

### Community 38 - ".run"
Cohesion: 0.10
Nodes (18): Correr el benchmark, Inspiración y benchmark frente a Aider, RunCommandDeps, HaltCode, HarnessHandlers, HarnessUI, RunMode, RunResult (+10 more)

### Community 39 - "lock.ts"
Cohesion: 0.21
Nodes (13): HARNESS_DIR, HARNESS_LOCK_FILENAME, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile(), getLockPath(), isProcessAlive() (+5 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "cli.ts"
Cohesion: 0.07
Nodes (57): csv(), main(), parseRoles(), ROLES, listFixtures(), mean(), preflight(), summarize() (+49 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 43 - "package-manager.ts"
Cohesion: 0.25
Nodes (7): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), commandExists()

### Community 44 - "explore.ts"
Cohesion: 0.26
Nodes (16): exploreOdd(), exploreRequest(), exploreSdd(), extractAssignedFiles(), extractOpenRisks(), extractSection(), markChecklistDone(), normalize() (+8 more)

### Community 45 - "loader.ts"
Cohesion: 0.13
Nodes (21): assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths, HarnessConfigFile, isRecord(), ModelSelection (+13 more)

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
Cohesion: 0.17
Nodes (12): Bóveda Obsidian, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Principios, Restricciones de generación de código (+4 more)

### Community 51 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 52 - "doctor.ts"
Cohesion: 0.23
Nodes (15): agentFilePath(), subagentFilePath(), check(), DoctorCheck, DoctorStatus, frontmatterModel(), missingBundleFiles(), modelLabel() (+7 more)

### Community 53 - "Instalación"
Cohesion: 0.50
Nodes (4): Checklist de componentes, Instalación, Instalación desatendida, Qué hace el instalador

### Community 55 - "git-diff.ts"
Cohesion: 0.30
Nodes (14): ARTIFACT_EXCLUDES, isArtifact(), isSelected(), isTextFile(), normalize(), trackedDiff(), trackedPaths(), truncateDiff() (+6 more)

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 57 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 58 - "HarnessConfig"
Cohesion: 0.15
Nodes (13): DoctorCommandDeps, DoctorDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, HarnessConfig, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME (+5 more)

### Community 59 - "runner.ts"
Cohesion: 0.20
Nodes (11): BENCH_DIR, benchConfig(), FIXTURES_DIR, FixtureTask, git(), prepareWorkdir(), readTask(), REPO_ROOT (+3 more)

### Community 60 - "Worker"
Cohesion: 0.22
Nodes (4): Orquestación, Worker, ExecutionContext, VerifyOptions

### Community 61 - "locks.ts"
Cohesion: 0.46
Nodes (7): createsConflict(), dependsOn(), groupWorkItems(), normalizeFile(), orderGroup(), pathsOverlap(), sharesFiles()

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

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 419 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `alvaress` connect `alvaress` to `Aprendizaje continuo`, `Agente, subagentes y skills`, `Especificación del arnés alvaress`, `Configuración`, `Instalación`, `spec.md`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `Artefacto int8 de Laya`, `laya.ts`, `install.ts`, `alvaress`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07787698412698413 - nodes in this community are weakly interconnected._
- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._