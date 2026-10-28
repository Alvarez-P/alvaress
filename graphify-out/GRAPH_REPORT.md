# Graph Report - alvaress  (2026-10-27)

## Corpus Check
- 102 files · ~80,168 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1140 nodes · 3497 edges · 47 communities (43 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9a1c41d2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- DecisionEngine
- package.json
- install.ts
- quantize-laya.py
- lock.ts
- compilerOptions
- alvaress
- ref_node_path
- obsidian/installer.ts
- constants.ts
- tsconfig.test.json
- loader.ts
- run.ts
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- final-report.ts
- openspec/types.ts
- orchestrator/report.ts
- reliability.test.ts
- laya/index.ts
- publishConfig
- status.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- contracts.ts
- Configuración
- Comandos
- core-harness.test.ts
- workers.ts
- Avisos de terceros
- run.ts
- Agente, subagentes y skills
- Aprendizaje continuo
- validator.ts
- Instalación
- agent/installer.ts
- commit.ts
- final-report.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
- Artefacto int8 de Laya

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 47 edges
2. `runHarnessCommand()` - 40 edges
3. `HarnessConfig` - 34 edges
4. `errorMessage()` - 33 edges
5. `loadConfig()` - 31 edges
6. `ensureDir()` - 31 edges
7. `runInstall()` - 29 edges
8. `loadManifest()` - 27 edges
9. `runDoctor()` - 25 edges
10. `connectObsidianVault()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Inspiración y benchmark frente a Aider` --references--> `WorkPlan`  [INFERRED]
  README.md → src/core/contracts.ts
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Eficiencia` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `risks()`  [INFERRED]
  docs/subagents.md → test/ui.test.ts

## Import Cycles
- None detected.

## Communities (47 total, 4 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.08
Nodes (62): flagValue(), LearnCommandDeps, parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine() (+54 more)

### Community 1 - "DecisionEngine"
Cohesion: 0.09
Nodes (20): Precisión, LayaConfig, RiskAssessment, RiskInput, choice(), CreateDecisionEngineOptions, describeRisk(), expandHome() (+12 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.07
Nodes (57): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askText(), askValidationCommands(), Component (+49 more)

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
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+7 more)

### Community 8 - "ref_node_path"
Cohesion: 0.09
Nodes (30): SUBAGENTS, CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl(), setupProject() (+22 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.13
Nodes (28): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+20 more)

### Community 10 - "constants.ts"
Cohesion: 0.07
Nodes (26): DEFAULT_AIDER_TIMEOUT_MS, DEFAULT_IMPLEMENTER_MODEL, DEFAULT_LAYA_TIMEOUT_MS, DEFAULT_MAX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_SCOPE, DEFAULT_VALIDATION_COMMANDS, DEFAULT_VITE_PLUS_CHECK (+18 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "loader.ts"
Cohesion: 0.06
Nodes (84): renderAgent(), runCli(), runAgentCommand(), runConfigCommand(), InstallRuntime, applyModel(), installCurrentAgent(), ModelRole (+76 more)

### Community 13 - "run.ts"
Cohesion: 0.06
Nodes (96): AgentInstallReport, runArchiveCommand(), InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand(), runState() (+88 more)

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
Cohesion: 0.09
Nodes (24): Manifiesto `openspec.yaml`, HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE (+16 more)

### Community 24 - "openspec/types.ts"
Cohesion: 0.17
Nodes (16): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, createsConflict(), dependsOn() (+8 more)

### Community 25 - "orchestrator/report.ts"
Cohesion: 0.18
Nodes (23): describe(), isHarnessReport(), runReportCommand(), HARNESS_RUNS_DIR, TaskOutcome, AnyRunReport, getRunsDir(), listAllReports() (+15 more)

### Community 26 - "reliability.test.ts"
Cohesion: 0.18
Nodes (18): agentFilePath(), installAgent(), subagentFilePath(), check(), DoctorCheck, DoctorCommandDeps, DoctorStatus, frontmatterModel() (+10 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "status.ts"
Cohesion: 0.25
Nodes (8): DoctorDeps, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, getGraphStatus(), GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, walkNewest()

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.20
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 33 - "contracts.ts"
Cohesion: 0.18
Nodes (15): ChangeKind, Complexity, FailureInput, FailureVerdict, LearningScopeDecision, LearningScopeInput, ReadyInput, ReadyResult (+7 more)

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "core-harness.test.ts"
Cohesion: 0.11
Nodes (16): DEFAULT_MAX_FIX_ATTEMPTS, DecisionEngine, Exploration, HaltReason, HarnessHandlers, HarnessUI, RunRequest, createRunId() (+8 more)

### Community 39 - "workers.ts"
Cohesion: 0.06
Nodes (48): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos (+40 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "run.ts"
Cohesion: 0.11
Nodes (24): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+16 more)

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.50
Nodes (4): Agente, subagentes y skills, Inspiración y benchmark frente a Aider, Permisos, Skills

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 47 - "validator.ts"
Cohesion: 0.15
Nodes (13): ValidationCommandResult, ValidationResult, Validator, collectWarnings(), CommandValidator, CommandValidatorOptions, stripAnsi(), CancelledError (+5 more)

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "agent/installer.ts"
Cohesion: 0.13
Nodes (14): AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installSubagents(), LEARN_READ_COMMANDS, modelLine(), PermissionRule (+6 more)

### Community 50 - "commit.ts"
Cohesion: 0.33
Nodes (8): RunMode, buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest()

### Community 51 - "final-report.ts"
Cohesion: 0.22
Nodes (13): CommitResult, FileChange, HaltCode, Risk, HarnessRunReport, ChangeSelection, dedupeTasks(), FinalReportInput (+5 more)

### Community 52 - "4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)"
Cohesion: 0.40
Nodes (5): 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), Skill 1: `read-spec-first.md`, Skill 2: `consult-graphify-ast.md`, Skill 3: `self-healing-verify.md`, Skill 4: `universal-design-patterns.md`

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 302 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07539682539682539 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `Artefacto int8 de Laya`, `DecisionEngine`, `install.ts`, `alvaress`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `DecisionEngine` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `workers.ts` to `ref_node_path`, `run.ts`, `contracts.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._