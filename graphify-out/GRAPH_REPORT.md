# Graph Report - alvaress  (2026-10-25)

## Corpus Check
- 97 files · ~85,016 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1055 nodes · 3196 edges · 39 communities (36 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `544c6029`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- learnings.ts
- contracts.ts
- package.json
- install.ts
- quantize-laya.py
- contracts.ts
- compilerOptions
- alvaress
- reliability.test.ts
- manifest.ts
- Subagentes y worker sin Aider
- tsconfig.test.json
- constants.ts
- Artefacto int8 de Laya
- ui.test.ts
- reliability.test.ts
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- diff.ts
- 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)
- package-manager.ts
- obsidian/installer.ts
- laya/index.ts
- DecisionEngine
- loader.ts
- SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)
- run.ts
- README.md
- apply.ts
- Modelo de decisión (Laya)
- workers.ts
- Obsidian
- obsidian/installer.ts
- Instalación

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 49 edges
2. `runHarnessCommand()` - 37 edges
3. `errorMessage()` - 32 edges
4. `ensureDir()` - 31 edges
5. `HarnessConfig` - 29 edges
6. `loadManifest()` - 27 edges
7. `loadConfig()` - 25 edges
8. `connectObsidianVault()` - 25 edges
9. `alvaress` - 25 edges
10. `RunLog` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Artefacto int8` --references--> `verifyBundle()`  [INFERRED]
  README.md → src/decision/vendor/laya/bundle.ts
- `Publicación pendiente` --references--> `ensureBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker sin Aider` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (39 total, 3 thin omitted)

### Community 0 - "learnings.ts"
Cohesion: 0.09
Nodes (46): flagValue(), LearnCommandDeps, parseLimit(), printLearning(), resolvePaths(), runLearnCommand(), GLOBAL_MEMORY_DIR, GLOBAL_MEMORY_FILENAME (+38 more)

### Community 1 - "contracts.ts"
Cohesion: 0.14
Nodes (19): ChangeKind, Complexity, Exploration, FailureInput, FailureVerdict, HaltReason, HarnessState, ReadyInput (+11 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): author, description, files, keywords, license, main, name, packageManager (+12 more)

### Community 3 - "install.ts"
Cohesion: 0.14
Nodes (32): @clack/prompts, askMaxAttempts(), askPackageManager(), askRequired(), askSecret(), askText(), askValidationCommands(), Component (+24 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "contracts.ts"
Cohesion: 0.13
Nodes (13): HaltCode, HarnessHandlers, HarnessUI, RunMode, ValidationCommandResult, createRunId(), emptyValidation(), HarnessCore (+5 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.09
Nodes (22): alvaress, Aprendizaje continuo, Comandos, Commits, Confiabilidad y seguridad, Configuración, Contenido, Cómo funciona `apply` (+14 more)

### Community 8 - "reliability.test.ts"
Cohesion: 0.07
Nodes (36): VERSION, CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl(), ensurePipxPath() (+28 more)

### Community 9 - "manifest.ts"
Cohesion: 0.06
Nodes (83): AgentInstallReport, check(), runDoctor(), InitOptions, InitReport, runInit(), flagValue(), runObsidianCommand() (+75 more)

### Community 10 - "Subagentes y worker sin Aider"
Cohesion: 0.18
Nodes (11): Contrato de handoff, Contrato de respuesta, Contrato del worker, Eficiencia, HALT, Motor de decisión, Reparto de subagentes, Seguridad y permisos (+3 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "constants.ts"
Cohesion: 0.07
Nodes (33): DoctorCheck, DoctorDeps, DoctorStatus, AGENT_NAME, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_SCOPE, DEFAULT_VALIDATION_COMMANDS (+25 more)

### Community 13 - "Artefacto int8 de Laya"
Cohesion: 0.25
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación pendiente, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

### Community 14 - "ui.test.ts"
Cohesion: 0.09
Nodes (24): ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground(), Palette (+16 more)

### Community 15 - "reliability.test.ts"
Cohesion: 0.07
Nodes (59): runCli(), runAgentCommand(), runArchiveCommand(), runDoctorCommand(), describe(), isHarnessReport(), runReportCommand(), runRestoreCommand() (+51 more)

### Community 16 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, commitlint, dev, lint, prepack, prepare, prepublishOnly (+6 more)

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

### Community 23 - "diff.ts"
Cohesion: 0.20
Nodes (14): OPENSPEC_FILENAME, buildCommitMessage(), commitRun(), git(), normalize(), openspecChanged(), shortRequest(), hashFile() (+6 more)

### Community 24 - "4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES)"
Cohesion: 0.40
Nodes (5): 4. REPOSITORIO DE SKILLS POR DEFECTO (AUTOMATIZACIÓN DE HOOKS DE AGENTES), Skill 1: `read-spec-first.md`, Skill 2: `consult-graphify-ast.md`, Skill 3: `self-healing-verify.md`, Skill 4: `universal-design-patterns.md`

### Community 25 - "package-manager.ts"
Cohesion: 0.17
Nodes (13): installLayaDependencies(), installValidationDependencies(), installVitePlus(), DEFAULT_PACKAGE_MANAGER, updateGraph(), defaultValidationCommands(), localCommand(), PackageManager (+5 more)

### Community 26 - "obsidian/installer.ts"
Cohesion: 0.10
Nodes (28): agentFilePath(), AgentInstallOptions, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installAgent(), installSubagents(), LEARN_READ_COMMANDS, PermissionRule (+20 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.06
Nodes (67): missingBundleFiles(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_MANIFEST, BUNDLE_REPO, BUNDLE_REVISION, BundleFile, bundleFilesFor() (+59 more)

### Community 28 - "DecisionEngine"
Cohesion: 0.10
Nodes (23): Precisión, LayaConfig, DecisionEngine, RiskAssessment, RiskInput, HeuristicDecisionEngine, choice(), createDecisionEngine() (+15 more)

### Community 30 - "loader.ts"
Cohesion: 0.10
Nodes (38): runConfigCommand(), InstallRuntime, assertBoolean(), assertModel(), assertPositiveInteger(), assertString(), assertStringList(), ConfigPaths (+30 more)

### Community 31 - "SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)"
Cohesion: 0.25
Nodes (8): 1. ESQUEMAS DE ARCHIVOS DE CONFIGURACIÓN Y MANIFIESTOS (ESTRUCTURA DE DATOS), 2. MÓDULO DE GESTIÓN DE CONFIGURACIÓN CASCADA DINÁMICA, 3. MÓDULO INTERACTIVO DE INSTALACIÓN E INICIALIZACIÓN (TUI), 5. ORQUESTADOR CONCURRENTE CON EXPERIENCIA SDD AISLADA (DDD), Archivo A: `.alvaressrc.json` (o `~/.alvaressconfig.json`), Archivo B: `openspec.yaml` (Manifiesto del Proyecto bajo OpenSpec), Siguientes Pasos con tu LLM Local, SYSTEM PROMPT: GENERADOR DEL INSTALADOR Y ARNÉS DE AGENTES (ESTILO GENTLE AI)

### Community 32 - "run.ts"
Cohesion: 0.13
Nodes (24): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+16 more)

### Community 33 - "README.md"
Cohesion: 0.25
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 36 - "apply.ts"
Cohesion: 0.08
Nodes (47): DoctorCommandDeps, ObsidianCommandDeps, completeTask(), HarnessConfig, contextPath(), refreshSpecStatus(), setTaskStatus(), AiderRunOptions (+39 more)

### Community 38 - "Modelo de decisión (Laya)"
Cohesion: 0.67
Nodes (3): Artefacto int8, Modelo de decisión (Laya), Privacidad

### Community 39 - "workers.ts"
Cohesion: 0.14
Nodes (18): Selección del worker, RunCommandDeps, FixInput, FixResult, Worker, WorkResult, heuristicVerdict(), diffSnapshots() (+10 more)

### Community 41 - "Obsidian"
Cohesion: 0.67
Nodes (3): Comandos de Obsidian, Obsidian, Uso en el flujo híbrido

### Community 42 - "obsidian/installer.ts"
Cohesion: 0.07
Nodes (42): LAYA_LOG_PATH, Validator, detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball() (+34 more)

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 285 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Worker` connect `workers.ts` to `run.ts`, `contracts.ts`, `Subagentes y worker sin Aider`, `reliability.test.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09308510638297872 - nodes in this community are weakly interconnected._
- **Why does `@clack/prompts` connect `install.ts` to `package.json`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._
- **Why does `Subagentes y worker sin Aider` connect `Subagentes y worker sin Aider` to `README.md`, `workers.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._