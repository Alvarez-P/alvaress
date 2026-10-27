# Graph Report - alvaress  (2026-10-26)

## Corpus Check
- 96 files · ~87,561 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1073 nodes · 3227 edges · 45 communities (41 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `510e7a98`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- pathExists
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
- core-harness.test.ts
- obsidian/installer.ts
- manifest.ts
- StatusLine
- laya/index.ts
- publishConfig
- modules.ts
- ConfigError
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- run.ts
- agent/installer.ts
- doctor.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
- Configuración
- Comandos
- contracts.ts
- workers.ts
- Avisos de terceros
- Artefacto int8 de Laya
- Agente, subagentes y skills
- Instalación
- commit.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 49 edges
2. `runHarnessCommand()` - 37 edges
3. `errorMessage()` - 32 edges
4. `ensureDir()` - 31 edges
5. `HarnessConfig` - 29 edges
6. `loadManifest()` - 27 edges
7. `loadConfig()` - 25 edges
8. `connectObsidianVault()` - 25 edges
9. `runInstall()` - 23 edges
10. `RunLog` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Contrato del worker` --references--> `SubagentWorker`  [INFERRED]
  docs/subagents.md → src/orchestrator/workers.ts

## Import Cycles
- None detected.

## Communities (45 total, 4 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.07
Nodes (61): renderAgent(), runCli(), runAgentCommand(), runConfigCommand(), flagValue(), LearnCommandDeps, parseLimit(), printLearning() (+53 more)

### Community 1 - "laya.ts"
Cohesion: 0.09
Nodes (27): Precisión, LayaConfig, Complexity, DecisionEngine, FailureInput, FailureVerdict, RiskAssessment, RiskInput (+19 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.07
Nodes (56): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+48 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "pathExists"
Cohesion: 0.07
Nodes (74): AgentInstallReport, InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand(), runState(), summarizeRun() (+66 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.12
Nodes (17): alvaress, Aprendizaje continuo, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente (+9 more)

### Community 8 - "ref_node_path"
Cohesion: 0.07
Nodes (48): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, GraphStatus, IGNORED_DIRECTORIES (+40 more)

### Community 9 - "loader.ts"
Cohesion: 0.12
Nodes (19): ConfigPaths, HarnessConfigFile, maskConfig(), maskEnv(), maskValue(), ModelProviderConfig, PackageManager, saveLocalConfig() (+11 more)

### Community 10 - "Subagentes y worker sin Aider"
Cohesion: 0.18
Nodes (11): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos (+3 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.10
Nodes (19): DEFAULT_AIDER_TIMEOUT_MS, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, HARNESS_BACKUPS_DIR, HARNESS_CACHE_DIR, HARNESS_RUNS_DIR (+11 more)

### Community 13 - ".run"
Cohesion: 0.17
Nodes (5): HarnessHandlers, HarnessUI, HarnessCore, HarnessCoreOptions, makeFixture()

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

### Community 23 - "core-harness.test.ts"
Cohesion: 0.19
Nodes (11): Exploration, FixResult, HaltReason, HarnessState, ReadyInput, ReadyResult, RunRequest, WorkPlan (+3 more)

### Community 24 - "obsidian/installer.ts"
Cohesion: 0.16
Nodes (23): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+15 more)

### Community 25 - "manifest.ts"
Cohesion: 0.05
Nodes (88): runArchiveCommand(), completeTask(), HARNESS_DIR, HARNESS_LOCK_FILENAME, OPENSPEC_FILENAME, updateGraph(), archiveSpec(), buildTaskDocument() (+80 more)

### Community 26 - "StatusLine"
Cohesion: 0.08
Nodes (30): collectWarnings(), ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+22 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "modules.ts"
Cohesion: 0.33
Nodes (6): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl()

### Community 30 - "ConfigError"
Cohesion: 0.36
Nodes (9): assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), isRecord(), readConfigFile(), validateConfigFile() (+1 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.20
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 32 - "run.ts"
Cohesion: 0.14
Nodes (17): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+9 more)

### Community 33 - "agent/installer.ts"
Cohesion: 0.11
Nodes (19): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+11 more)

### Community 34 - "doctor.ts"
Cohesion: 0.17
Nodes (17): check(), DoctorCheck, DoctorDeps, DoctorStatus, missingBundleFiles(), runDoctor(), runDoctorCommand(), LAYA_FP32_MODEL_CACHE_ROOT (+9 more)

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
Cohesion: 0.16
Nodes (19): ChangeKind, CommitResult, FileChange, HaltCode, Risk, RiskSeverity, RiskSource, RunMode (+11 more)

### Community 39 - "workers.ts"
Cohesion: 0.07
Nodes (40): Selección del worker, DoctorCommandDeps, ObsidianCommandDeps, HarnessConfig, FixInput, WorkResult, heuristicVerdict(), baseEnvironment() (+32 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 50 - "commit.ts"
Cohesion: 0.24
Nodes (7): buildCommitMessage(), commitRun(), git(), normalize(), openspecChanged(), shortRequest(), tempDirs

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 290 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06729264475743349 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `Artefacto int8 de Laya`, `install.ts`, `laya.ts`, `alvaress`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08843537414965986 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Configuración`, `Comandos`, `Agente, subagentes y skills`, `Instalación`, `SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._