# Graph Report - alvaress  (2026-10-26)

## Corpus Check
- 98 files · ~76,679 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1109 nodes · 3372 edges · 55 communities (50 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c289fa74`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- DecisionEngine
- package.json
- install.ts
- quantize-laya.py
- orchestrator/report.ts
- compilerOptions
- alvaress
- ref_node_path
- loader.ts
- Subagentes y worker sin Aider
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
- verify.ts
- explore.ts
- vault.ts
- StatusLine
- laya/index.ts
- publishConfig
- RunLog
- apply.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- pathExists
- agent/installer.ts
- doctor.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
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
- laya.ts
- manifest.ts
- Instalación
- harness.ts
- diff.ts
- errorMessage
- process.ts
- status.ts
- ConfigError

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 49 edges
2. `runHarnessCommand()` - 40 edges
3. `errorMessage()` - 32 edges
4. `HarnessConfig` - 31 edges
5. `ensureDir()` - 31 edges
6. `loadConfig()` - 29 edges
7. `loadManifest()` - 27 edges
8. `connectObsidianVault()` - 25 edges
9. `runInstall()` - 24 edges
10. `runLearnCommand()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Selección del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (55 total, 5 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.06
Nodes (74): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+66 more)

### Community 1 - "DecisionEngine"
Cohesion: 0.17
Nodes (12): Precisión, DecisionEngine, HeuristicDecisionEngine, choice(), createDecisionEngine(), describeRisk(), LayaDecisionEngine, noul() (+4 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.05
Nodes (80): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+72 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "orchestrator/report.ts"
Cohesion: 0.10
Nodes (36): describe(), isHarnessReport(), runReportCommand(), HARNESS_DIR, HARNESS_LOCK_FILENAME, TaskOutcome, AnyRunReport, getRunsDir() (+28 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.12
Nodes (16): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+8 more)

### Community 8 - "ref_node_path"
Cohesion: 0.07
Nodes (42): SUBAGENTS, interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), buildCommitMessage(), commitRun(), git() (+34 more)

### Community 9 - "loader.ts"
Cohesion: 0.11
Nodes (23): ConfigPaths, HarnessConfigFile, maskConfig(), maskEnv(), maskValue(), ModelProviderConfig, ModelSelection, PackageManager (+15 more)

### Community 10 - "Subagentes y worker sin Aider"
Cohesion: 0.12
Nodes (14): Contrato de handoff, Contrato de respuesta, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos, Selección del worker (+6 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.10
Nodes (19): DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, GLOBAL_MEMORY_DIR, GLOBAL_MEMORY_FILENAME, GLOBAL_PLAYBOOK_FILENAME, HARNESS_CACHE_DIR, HARNESS_RUNS_DIR (+11 more)

### Community 13 - ".run"
Cohesion: 0.16
Nodes (6): HarnessHandlers, HarnessUI, emptyValidation(), HarnessCore, HarnessCoreOptions, makeFixture()

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

### Community 23 - "verify.ts"
Cohesion: 0.17
Nodes (14): DoctorCommandDeps, LearnCommandDeps, ObsidianCommandDeps, HarnessConfig, AiderRunOptions, baseEnvironment(), buildAiderArgs(), buildAiderEnv() (+6 more)

### Community 24 - "explore.ts"
Cohesion: 0.25
Nodes (17): loadManifest(), exploreOdd(), exploreRequest(), exploreSdd(), extractAssignedFiles(), extractOpenRisks(), extractSection(), markChecklistDone() (+9 more)

### Community 25 - "vault.ts"
Cohesion: 0.15
Nodes (28): AgentInstallReport, runDoctor(), InitOptions, InitReport, runInit(), closeObsidian(), markOddDone(), appendVaultNoteEntry() (+20 more)

### Community 26 - "StatusLine"
Cohesion: 0.09
Nodes (29): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+21 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 30 - "apply.ts"
Cohesion: 0.19
Nodes (17): completeTask(), contextPath(), refreshSpecStatus(), setTaskStatus(), ApplyOptions, ApplyReport, applyTasks(), executeTask() (+9 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.20
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 32 - "pathExists"
Cohesion: 0.17
Nodes (21): CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, RunLogMeta, installSkills(), renderSkill(), SkillDefinition, skillFilePath() (+13 more)

### Community 33 - "agent/installer.ts"
Cohesion: 0.08
Nodes (44): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+36 more)

### Community 34 - "doctor.ts"
Cohesion: 0.20
Nodes (9): check(), DoctorCheck, DoctorStatus, missingBundleFiles(), LAYA_FP32_MODEL_CACHE_ROOT, LAYA_INT8_MODEL_CACHE_ROOT, LAYA_ONNX_RUNTIME_PACKAGE, LAYA_TOKENIZER_PACKAGE (+1 more)

### Community 35 - "4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)"
Cohesion: 0.40
Nodes (5): 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), Skill 1: `read-spec-first.md`, Skill 2: `consult-graphify-ast.md`, Skill 3: `self-healing-verify.md`, Skill 4: `universal-design-patterns.md`

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "contracts.ts"
Cohesion: 0.20
Nodes (9): Exploration, HaltReason, ReadyInput, ReadyResult, RouteDecision, RunRequest, warningsToRisks(), FixtureOptions (+1 more)

### Community 39 - "workers.ts"
Cohesion: 0.17
Nodes (16): Contrato del worker, FixInput, FixResult, WorkPlan, WorkResult, heuristicVerdict(), diffSnapshots(), scopeRisks() (+8 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 42 - "contracts.ts"
Cohesion: 0.18
Nodes (13): ChangeKind, Complexity, FailureInput, FailureVerdict, LearningScopeDecision, LearningScopeInput, RiskAssessment, RiskInput (+5 more)

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 44 - "openspec/types.ts"
Cohesion: 0.18
Nodes (15): BoundedContext, OpenSpecSpec, OpenSpecTask, SpecificationStatus, TaskStatus, WorkItem, createsConflict(), dependsOn() (+7 more)

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "laya.ts"
Cohesion: 0.17
Nodes (9): LayaConfig, CreateDecisionEngineOptions, expandHome(), LayaAgentLike, LayaAgentLoader, LayaAnswer, LayaPrediction, loadLayaAgent() (+1 more)

### Community 47 - "manifest.ts"
Cohesion: 0.22
Nodes (15): runArchiveCommand(), archiveSpec(), buildTaskDocument(), collectWorkItems(), createScaffoldManifest(), defaultAcceptance(), ensureTaskFile(), findWorkItem() (+7 more)

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "harness.ts"
Cohesion: 0.22
Nodes (14): DEFAULT_MAX_FIX_ATTEMPTS, LAYA_LOG_PATH, CommitResult, FileChange, HaltCode, Risk, RunMode, RunResult (+6 more)

### Community 50 - "diff.ts"
Cohesion: 0.25
Nodes (14): hashFile(), IGNORED_PREFIXES, isRunArtifact(), normalize(), outOfScope(), snapshotWorkspace(), WorkspaceSnapshot, changedFiles() (+6 more)

### Community 51 - "errorMessage"
Cohesion: 0.33
Nodes (9): runRestoreCommand(), HARNESS_BACKUPS_DIR, OPENSPEC_FILENAME, backupId(), backupManifest(), backupsDir(), listManifestBackups(), ManifestBackup (+1 more)

### Community 52 - "process.ts"
Cohesion: 0.24
Nodes (9): ValidationCommandResult, Validator, collectWarnings(), CommandValidator, CommandValidatorOptions, stripAnsi(), truncate(), runCommand() (+1 more)

### Community 53 - "status.ts"
Cohesion: 0.22
Nodes (9): DoctorDeps, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, getGraphStatus(), GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, updateGraph() (+1 more)

### Community 54 - "ConfigError"
Cohesion: 0.36
Nodes (10): assertBoolean(), assertModel(), assertModelSelection(), assertPositiveInteger(), assertString(), assertStringList(), isRecord(), readConfigFile() (+2 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 297 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05938037865748709 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `Artefacto int8 de Laya`, `install.ts`, `laya.ts`, `alvaress`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Configuración`, `Comandos`, `Agente, subagentes y skills`, `Aprendizaje continuo`, `Instalación`, `SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._