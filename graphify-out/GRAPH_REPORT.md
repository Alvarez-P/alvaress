# Graph Report - alvaress  (2026-10-26)

## Corpus Check
- 102 files · ~79,858 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1136 nodes · 3487 edges · 53 communities (48 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8e6bbe53`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- lock.ts
- compilerOptions
- alvaress
- ref_node_path
- obsidian/installer.ts
- run.ts
- tsconfig.test.json
- constants.ts
- .run
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- errorMessage
- explore.ts
- vault.ts
- StatusLine
- laya/index.ts
- publishConfig
- HarnessConfig
- apply.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- orchestrator/report.ts
- loader.ts
- doctor.ts
- Configuración
- Comandos
- contracts.ts
- workers.ts
- Avisos de terceros
- Artefacto int8 de Laya
- contracts.ts
- Agente, subagentes y skills
- openspec/types.ts
- Aprendizaje continuo
- backup.ts
- Instalación
- agent/installer.ts
- diff.ts
- status.ts
- fs.ts
- Subagentes y worker sin Aider

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 47 edges
2. `runHarnessCommand()` - 40 edges
3. `HarnessConfig` - 34 edges
4. `errorMessage()` - 33 edges
5. `loadConfig()` - 31 edges
6. `ensureDir()` - 31 edges
7. `runInstall()` - 30 edges
8. `loadManifest()` - 27 edges
9. `runDoctor()` - 25 edges
10. `connectObsidianVault()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Contrato del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts
- `Contrato del worker` --references--> `risks()`  [INFERRED]
  docs/subagents.md → test/ui.test.ts

## Import Cycles
- None detected.

## Communities (53 total, 5 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.06
Nodes (82): installAgent(), renderAgent(), runCli(), runAgentCommand(), runConfigCommand(), InstallRuntime, flagValue(), parseLimit() (+74 more)

### Community 1 - "laya.ts"
Cohesion: 0.10
Nodes (23): Precisión, LayaConfig, DecisionEngine, RiskAssessment, RiskInput, HeuristicDecisionEngine, choice(), createDecisionEngine() (+15 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.07
Nodes (49): @clack/prompts, askMaxAttempts(), askModel(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands() (+41 more)

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
Cohesion: 0.12
Nodes (16): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+8 more)

### Community 8 - "ref_node_path"
Cohesion: 0.08
Nodes (34): SUBAGENTS, mergeConfig(), CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl() (+26 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.16
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 10 - "run.ts"
Cohesion: 0.10
Nodes (26): effectiveVault(), failureText(), flagValue(), markOddDone(), MODES, parseFileList(), parseMode(), printDryRun() (+18 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.09
Nodes (22): DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, HARNESS_BACKUPS_DIR, HARNESS_CACHE_DIR, HARNESS_RUNS_DIR, LAYA_DIR (+14 more)

### Community 13 - ".run"
Cohesion: 0.14
Nodes (13): HaltCode, HarnessHandlers, HarnessUI, RunMode, RunResult, ValidationCommandResult, createRunId(), emptyValidation() (+5 more)

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

### Community 23 - "errorMessage"
Cohesion: 0.43
Nodes (7): downloadLayaBundle(), formatBytes(), installNodeDependencies(), isRepository(), promptLaya(), runInstall(), errorMessage()

### Community 24 - "explore.ts"
Cohesion: 0.22
Nodes (20): collectWorkItems(), ensureTaskFile(), findWorkItem(), loadManifest(), taskFilePath(), exploreOdd(), exploreRequest(), exploreSdd() (+12 more)

### Community 25 - "vault.ts"
Cohesion: 0.17
Nodes (28): AgentInstallReport, InitOptions, InitReport, runInit(), configureObsidian(), flagValue(), runObsidianCommand(), runState() (+20 more)

### Community 26 - "StatusLine"
Cohesion: 0.09
Nodes (26): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+18 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "HarnessConfig"
Cohesion: 0.07
Nodes (35): DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, writeHalt(), HarnessConfig, LAYA_LOG_PATH, Validator (+27 more)

### Community 30 - "apply.ts"
Cohesion: 0.14
Nodes (25): completeTask(), updateGraph(), contextPath(), refreshSpecStatus(), setTaskStatus(), runAider(), ApplyOptions, ApplyReport (+17 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.15
Nodes (13): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local (+5 more)

### Community 32 - "orchestrator/report.ts"
Cohesion: 0.20
Nodes (22): describe(), isHarnessReport(), runReportCommand(), TaskOutcome, AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports() (+14 more)

### Community 33 - "loader.ts"
Cohesion: 0.07
Nodes (46): applyModel(), assertBoolean(), assertModel(), assertModelSelection(), assertPositiveInteger(), assertString(), assertStringList(), ConfigPaths (+38 more)

### Community 34 - "doctor.ts"
Cohesion: 0.24
Nodes (14): agentFilePath(), subagentFilePath(), check(), DoctorCheck, DoctorStatus, frontmatterModel(), missingBundleFiles(), modelLabel() (+6 more)

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "contracts.ts"
Cohesion: 0.19
Nodes (11): Contrato del worker, Exploration, HaltReason, ReadyInput, ReadyResult, RouteDecision, RunRequest, WorkPlan (+3 more)

### Community 39 - "workers.ts"
Cohesion: 0.13
Nodes (18): Selección del worker, RunCommandDeps, FixInput, FixResult, Worker, WorkResult, heuristicVerdict(), diffSnapshots() (+10 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 42 - "contracts.ts"
Cohesion: 0.21
Nodes (11): ChangeKind, Complexity, FailureInput, FailureVerdict, LearningScopeDecision, LearningScopeInput, RiskSeverity, RiskSource (+3 more)

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 44 - "openspec/types.ts"
Cohesion: 0.16
Nodes (17): buildTaskDocument(), createScaffoldManifest(), defaultAcceptance(), inferBoundedContexts(), parseManifest(), scaffoldManifest(), serializeManifest(), BoundedContext (+9 more)

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 47 - "backup.ts"
Cohesion: 0.33
Nodes (11): runArchiveCommand(), archiveSpec(), getManifestPath(), saveManifest(), backupId(), backupManifest(), backupsDir(), listManifestBackups() (+3 more)

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "agent/installer.ts"
Cohesion: 0.13
Nodes (14): AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installSubagents(), LEARN_READ_COMMANDS, modelLine(), PermissionRule (+6 more)

### Community 50 - "diff.ts"
Cohesion: 0.15
Nodes (22): buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest(), hashFile() (+14 more)

### Community 53 - "status.ts"
Cohesion: 0.25
Nodes (8): DoctorDeps, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, getGraphStatus(), GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, walkNewest()

### Community 54 - "fs.ts"
Cohesion: 0.14
Nodes (23): CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, installSkills(), renderSkill(), SkillDefinition, skillFilePath(), SkillInstallOptions (+15 more)

### Community 57 - "Subagentes y worker sin Aider"
Cohesion: 0.22
Nodes (9): Contrato de handoff, Contrato de respuesta, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos, Skills por subagente (+1 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 301 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058678611422172455 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `laya.ts`, `install.ts`, `alvaress`, `Artefacto int8 de Laya`, `errorMessage`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09936575052854123 - nodes in this community are weakly interconnected._
- **Why does `Worker` connect `workers.ts` to `ref_node_path`, `Subagentes y worker sin Aider`, `run.ts`, `contracts.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._