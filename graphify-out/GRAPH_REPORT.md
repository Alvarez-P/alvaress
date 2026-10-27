# Graph Report - alvaress  (2026-10-26)

## Corpus Check
- 97 files · ~75,526 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 1103 nodes · 3346 edges · 49 communities (45 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `afa956a7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- laya.ts
- package.json
- install.ts
- quantize-laya.py
- apply.ts
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
- obsidian/installer.ts
- manifest.ts
- StatusLine
- laya/index.ts
- publishConfig
- RunLog
- HarnessConfig
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- run.ts
- agent/installer.ts
- status.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
- Configuración
- Comandos
- contracts.ts
- workers.ts
- Avisos de terceros
- Artefacto int8 de Laya
- package-manager.ts
- Agente, subagentes y skills
- pipx.ts
- Aprendizaje continuo
- mergeConfig
- Instalación
- diff.ts

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 49 edges
2. `runHarnessCommand()` - 40 edges
3. `errorMessage()` - 32 edges
4. `HarnessConfig` - 31 edges
5. `ensureDir()` - 31 edges
6. `loadConfig()` - 27 edges
7. `loadManifest()` - 27 edges
8. `connectObsidianVault()` - 25 edges
9. `runLearnCommand()` - 24 edges
10. `runInstall()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Herramientas que instala y por qué` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Precisión` --references--> `choice()`  [INFERRED]
  docs/laya-int8.md → src/decision/laya.ts

## Import Cycles
- None detected.

## Communities (49 total, 4 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.07
Nodes (65): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+57 more)

### Community 1 - "laya.ts"
Cohesion: 0.08
Nodes (32): Precisión, LayaConfig, Complexity, DecisionEngine, FailureInput, FailureVerdict, LearningScopeDecision, LearningScopeInput (+24 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): author, description, files, homepage, keywords, license, main, name (+13 more)

### Community 3 - "install.ts"
Cohesion: 0.13
Nodes (35): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+27 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "apply.ts"
Cohesion: 0.07
Nodes (56): describe(), isHarnessReport(), runReportCommand(), HARNESS_DIR, HARNESS_LOCK_FILENAME, ApplyOptions, ApplyReport, applyTasks() (+48 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.12
Nodes (16): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+8 more)

### Community 8 - "ref_node_path"
Cohesion: 0.09
Nodes (29): CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl(), setupProject(), CLI (+21 more)

### Community 9 - "loader.ts"
Cohesion: 0.11
Nodes (32): runConfigCommand(), InstallRuntime, assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), ConfigPaths (+24 more)

### Community 10 - "Subagentes y worker sin Aider"
Cohesion: 0.11
Nodes (16): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos (+8 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.07
Nodes (31): check(), DoctorCheck, DoctorStatus, missingBundleFiles(), AGENT_NAME, DEFAULT_IMPLEMENTER_MODEL, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT (+23 more)

### Community 13 - ".run"
Cohesion: 0.15
Nodes (6): RunCommandDeps, HarnessHandlers, HarnessUI, emptyValidation(), HarnessCore, HarnessCoreOptions

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
Cohesion: 0.20
Nodes (14): AiderRunOptions, baseEnvironment(), buildAiderArgs(), buildAiderEnv(), runAider(), SAFE_ENV_KEYS, formatValidationFailure(), runValidationCommands() (+6 more)

### Community 24 - "obsidian/installer.ts"
Cohesion: 0.13
Nodes (26): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+18 more)

### Community 25 - "manifest.ts"
Cohesion: 0.05
Nodes (105): AgentInstallReport, runArchiveCommand(), runDoctor(), InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand() (+97 more)

### Community 26 - "StatusLine"
Cohesion: 0.10
Nodes (21): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+13 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG, BUNDLE_REVISION (+66 more)

### Community 29 - "RunLog"
Cohesion: 0.21
Nodes (5): inspectLastRun(), RunLog, RunLogMeta, ValidationFailure, CommandResult

### Community 30 - "HarnessConfig"
Cohesion: 0.16
Nodes (13): DoctorCommandDeps, LearnCommandDeps, ObsidianCommandDeps, HarnessConfig, Validator, ExecutionContext, ExploreContext, collectWarnings() (+5 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.20
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 32 - "run.ts"
Cohesion: 0.13
Nodes (21): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+13 more)

### Community 33 - "agent/installer.ts"
Cohesion: 0.11
Nodes (29): agentFilePath(), AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS (+21 more)

### Community 34 - "status.ts"
Cohesion: 0.20
Nodes (11): DoctorDeps, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, getGraphStatus(), GraphStatus, IGNORED_DIRECTORIES, SOURCE_EXTENSIONS, updateGraph() (+3 more)

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
Cohesion: 0.13
Nodes (27): ChangeKind, CommitResult, Exploration, FileChange, FixResult, HaltCode, HaltReason, ReadyInput (+19 more)

### Community 39 - "workers.ts"
Cohesion: 0.25
Nodes (10): FixInput, heuristicVerdict(), diffSnapshots(), scopeRisks(), buildFixMessage(), buildWorkMessage(), commandDetail(), existingFiles() (+2 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 42 - "package-manager.ts"
Cohesion: 0.23
Nodes (8): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), resolvePackageManager(), commandExists()

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.67
Nodes (3): Agente, subagentes y skills, Permisos, Skills

### Community 44 - "pipx.ts"
Cohesion: 0.50
Nodes (7): ensurePipx(), ensurePipxPath(), installPipx(), pipxInstallHint(), pipxInstallPlan, pipxUserBinDirs(), withSudo()

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "mergeConfig"
Cohesion: 0.47
Nodes (6): interpolateCommands(), interpolateEnv(), interpolateEnvRecord(), mergeConfig(), config(), configWith()

### Community 48 - "Instalación"
Cohesion: 0.67
Nodes (3): Instalación, Instalación desatendida, Qué hace el instalador

### Community 50 - "diff.ts"
Cohesion: 0.17
Nodes (20): buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest(), hashFile() (+12 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 297 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06800804828973843 - nodes in this community are weakly interconnected._
- **Why does `verifyBundle()` connect `laya/index.ts` to `Artefacto int8 de Laya`, `install.ts`, `laya.ts`, `alvaress`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `laya.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08395989974937343 - nodes in this community are weakly interconnected._
- **Why does `Herramientas que instala y por qué` connect `alvaress` to `laya/index.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._