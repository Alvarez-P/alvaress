# Graph Report - alvaress  (2026-10-29)

## Corpus Check
- 106 files · ~92,125 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 5)

## Summary
- 1162 nodes · 3556 edges · 58 communities (48 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `466793db`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- loader.ts
- DecisionEngine
- package.json
- install.ts
- quantize-laya.py
- reliability.test.ts
- compilerOptions
- alvaress
- ref_node_path
- obsidian/installer.ts
- verify.ts
- tsconfig.test.json
- errorMessage
- explore.ts
- repository
- bugs
- scripts
- devDependencies
- dependencies
- engines
- bin
- lint-staged
- final-report.ts
- manifest.ts
- orchestrator/report.ts
- reliability.test.ts
- laya/index.ts
- publishConfig
- vault.ts
- RunLog
- workers.ts
- config/models.ts
- diff.ts
- learnings.ts
- Configuración
- Comandos
- contracts.ts
- HarnessConfig
- Avisos de terceros
- run.ts
- apply.ts
- Agente, subagentes y skills
- fs.ts
- Aprendizaje continuo
- Subagentes y worker de código
- constants.ts
- Instalación
- agent/installer.ts
- Especificación del arnés alvaress
- package-manager.ts
- redactSecrets
- Artefacto int8 de Laya

## God Nodes (most connected - your core abstractions)
1. `pathExists()` - 44 edges
2. `runHarnessCommand()` - 40 edges
3. `errorMessage()` - 33 edges
4. `runInstall()` - 31 edges
5. `HarnessConfig` - 31 edges
6. `loadConfig()` - 31 edges
7. `ensureDir()` - 29 edges
8. `loadManifest()` - 27 edges
9. `runDoctor()` - 25 edges
10. `DecisionEngine` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Inspiración y benchmark frente a Aider` --references--> `WorkPlan`  [INFERRED]
  README.md → src/core/contracts.ts
- `Orquestación` --references--> `Worker`  [INFERRED]
  docs/spec.md → src/core/contracts.ts
- `Qué cuantiza` --references--> `verifyBundle()`  [INFERRED]
  docs/laya-int8.md → src/decision/vendor/laya/bundle.ts
- `Contrato del worker` --references--> `WorkPlan`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts
- `Subagentes y worker de código` --references--> `Worker`  [INFERRED]
  docs/subagents.md → src/core/contracts.ts

## Import Cycles
- None detected.

## Communities (58 total, 10 thin omitted)

### Community 0 - "loader.ts"
Cohesion: 0.11
Nodes (25): assertBoolean(), assertModelSelection(), assertPositiveInteger(), assertString(), ConfigPaths, HarnessConfigFile, interpolateCommands(), interpolateEnv() (+17 more)

### Community 1 - "DecisionEngine"
Cohesion: 0.07
Nodes (40): Precisión, Decisión, LayaConfig, Complexity, DecisionEngine, FailureInput, FailureVerdict, FlowInput (+32 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (22): author, description, files, homepage, keywords, license, main, name (+14 more)

### Community 3 - "install.ts"
Cohesion: 0.05
Nodes (85): installAgent(), renderAgent(), runCli(), runAgentCommand(), runConfigCommand(), runDoctorCommand(), askMaxAttempts(), askModel() (+77 more)

### Community 4 - "quantize-laya.py"
Cohesion: 0.16
Nodes (6): count_nodes(), main(), parse_args(), quantize_embedding(), quantize_matmuls(), sha256_file()

### Community 5 - "reliability.test.ts"
Cohesion: 0.23
Nodes (12): HARNESS_DIR, LockError, AcquireLockOptions, acquireProjectLock(), createLockFile(), getLockPath(), isProcessAlive(), isStale() (+4 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noFallthroughCasesInSwitch (+10 more)

### Community 7 - "alvaress"
Cohesion: 0.13
Nodes (15): alvaress, Confiabilidad y seguridad, Contenido, Desarrollo, Estados de un `run`, Estructura del paquete, Flujo del agente, Herramientas que instala y por qué (+7 more)

### Community 8 - "ref_node_path"
Cohesion: 0.08
Nodes (35): SUBAGENTS, mergeConfig(), CONDITIONS, findPackageDir(), moduleAvailableFrom(), packageName(), pickEntry(), resolveModuleUrl() (+27 more)

### Community 9 - "obsidian/installer.ts"
Cohesion: 0.15
Nodes (24): detectObsidian(), downloadFile(), ensureObsidian(), fetchRelease(), installLinux(), installLinuxTarball(), installMac(), installObsidian() (+16 more)

### Community 10 - "verify.ts"
Cohesion: 0.13
Nodes (21): Validator, ObsidianInstallerDeps, collectWarnings(), CommandValidator, CommandValidatorOptions, asValidationResult(), formatValidationFailure(), runValidationCommands() (+13 more)

### Community 11 - "tsconfig.test.json"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, rootDir, extends, include

### Community 12 - "errorMessage"
Cohesion: 0.21
Nodes (16): runArchiveCommand(), archiveSpec(), getManifestPath(), loadManifest(), parseManifest(), saveManifest(), backupId(), backupManifest() (+8 more)

### Community 13 - "explore.ts"
Cohesion: 0.20
Nodes (22): markOddDone(), collectWorkItems(), ensureTaskFile(), findWorkItem(), taskFilePath(), exploreOdd(), exploreRequest(), exploreSdd() (+14 more)

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
Nodes (24): HarnessState, ANSI_PATTERN, background(), colorEnabled(), createPalette(), defaultPalette(), ESCAPE, foreground() (+16 more)

### Community 24 - "manifest.ts"
Cohesion: 0.19
Nodes (14): buildTaskDocument(), createScaffoldManifest(), defaultAcceptance(), inferBoundedContexts(), scaffoldManifest(), serializeManifest(), BoundedContext, OpenSpecSpec (+6 more)

### Community 25 - "orchestrator/report.ts"
Cohesion: 0.20
Nodes (22): describe(), isHarnessReport(), runReportCommand(), TaskOutcome, AnyRunReport, getRunsDir(), listAllReports(), listHarnessRunReports() (+14 more)

### Community 26 - "reliability.test.ts"
Cohesion: 0.16
Nodes (17): agentFilePath(), check(), DoctorCheck, DoctorDeps, DoctorStatus, frontmatterModel(), modelLabel(), runDoctor() (+9 more)

### Community 27 - "laya/index.ts"
Cohesion: 0.05
Nodes (74): missingBundleFiles(), buildBundleManifest(), BUNDLE_BYTES, BUNDLE_FILES, BUNDLE_KIND, BUNDLE_MANIFEST, BUNDLE_RELEASE_REPO, BUNDLE_RELEASE_TAG (+66 more)

### Community 29 - "vault.ts"
Cohesion: 0.19
Nodes (21): AgentInstallReport, InitOptions, InitReport, runInit(), closeObsidian(), OPENSPEC_FILENAME, appendVaultNoteEntry(), connectObsidianVault() (+13 more)

### Community 30 - "RunLog"
Cohesion: 0.25
Nodes (4): LAYA_LOG_PATH, inspectLastRun(), RunLog, RunLogMeta

### Community 32 - "workers.ts"
Cohesion: 0.14
Nodes (18): Contrato del worker, FixInput, FixResult, WorkResult, diffSnapshots(), buildConsultMessage(), buildFixMessage(), buildWorkMessage() (+10 more)

### Community 34 - "diff.ts"
Cohesion: 0.15
Nodes (22): buildCommitMessage(), CommitOptions, commitRun(), git(), normalize(), openspecChanged(), shortRequest(), hashFile() (+14 more)

### Community 35 - "learnings.ts"
Cohesion: 0.08
Nodes (60): flagValue(), parseLimit(), parseScope(), printLearning(), rebuildAll(), rebuildForScope(), resolveDecisionEngine(), resolveStores() (+52 more)

### Community 36 - "Configuración"
Cohesion: 0.50
Nodes (4): Cada clave, Configuración, JSON completo, Valores por defecto y ejemplos

### Community 37 - "Comandos"
Cohesion: 0.67
Nodes (3): Comandos, Ejemplos, Subcomandos

### Community 38 - "contracts.ts"
Cohesion: 0.09
Nodes (35): ChangeKind, CommitResult, ConsultInput, Exploration, FileChange, FlowPlan, HaltCode, HaltReason (+27 more)

### Community 39 - "HarnessConfig"
Cohesion: 0.15
Nodes (10): DoctorCommandDeps, LayaPlan, LearnCommandDeps, ObsidianCommandDeps, RunCommandDeps, HarnessConfig, Worker, ExploreContext (+2 more)

### Community 40 - "Avisos de terceros"
Cohesion: 0.50
Nodes (3): Avisos de terceros, Laya (motor de decisión), Licencia MIT de `@receptron/laya`

### Community 41 - "run.ts"
Cohesion: 0.14
Nodes (18): effectiveVault(), failureText(), flagValue(), MODES, parseFileList(), parseMode(), printDryRun(), reportTasks() (+10 more)

### Community 42 - "apply.ts"
Cohesion: 0.14
Nodes (25): completeTask(), updateGraph(), contextPath(), refreshSpecStatus(), setTaskStatus(), OpenSpecManifest, ApplyOptions, ApplyReport (+17 more)

### Community 43 - "Agente, subagentes y skills"
Cohesion: 0.50
Nodes (4): Agente, subagentes y skills, Inspiración y benchmark frente a Aider, Permisos, Skills

### Community 44 - "fs.ts"
Cohesion: 0.16
Nodes (23): CLAUDE_SKILLS_DIR, OPENCODE_SKILLS_DIR, SKILLS_DIR, installSkills(), renderSkill(), SkillDefinition, skillFilePath(), SkillInstallOptions (+15 more)

### Community 45 - "Aprendizaje continuo"
Cohesion: 0.33
Nodes (6): Aprendizaje continuo, Comandos, Cómo decidir si un aprendizaje aplica, Dónde se consultan en el flujo, Quién decide el scope, Tipos

### Community 46 - "Subagentes y worker de código"
Cohesion: 0.18
Nodes (11): Contrato de handoff, Contrato de respuesta, Eficiencia, Flujo de especialistas, HALT, Motor de decisión, Proporcionalidad, Reparto de subagentes (+3 more)

### Community 47 - "constants.ts"
Cohesion: 0.08
Nodes (24): COMMAND_SEPARATOR, DEFAULT_MAX_FIX_ATTEMPTS, DEFAULT_OBSIDIAN_VAULT, DEFAULT_VALIDATION_COMMANDS, GLOBAL_CONFIG_FILENAME, GRAPHIFY_DIR, GRAPHIFY_GRAPH_FILENAME, HARNESS_BACKUPS_DIR (+16 more)

### Community 48 - "Instalación"
Cohesion: 0.50
Nodes (4): Checklist de componentes, Instalación, Instalación desatendida, Qué hace el instalador

### Community 49 - "agent/installer.ts"
Cohesion: 0.13
Nodes (15): AgentInstallOptions, DANGEROUS_SHELL_DENY, DISCOVERY_COMMANDS, GIT_READ_COMMANDS, installSubagents(), LEARN_READ_COMMANDS, modelLine(), PermissionRule (+7 more)

### Community 50 - "Especificación del arnés alvaress"
Cohesion: 0.15
Nodes (13): Bóveda Obsidian, Configuración, Especificación del arnés alvaress, Flujo del run, Manifiesto `openspec.yaml`, Objetivo, Orquestación, Principios (+5 more)

### Community 52 - "package-manager.ts"
Cohesion: 0.21
Nodes (9): DEFAULT_PACKAGE_MANAGER, defaultValidationCommands(), localCommand(), PackageManager, packageManagerAvailable(), packageManagerExec(), resolveInstallerPackageManager(), resolvePackageManager() (+1 more)

### Community 54 - "redactSecrets"
Cohesion: 0.31
Nodes (7): writeHalt(), assessLearning(), ARTIFACT_EXCLUDES, workingTreeDiff(), redactSecrets(), redactValue(), SECRET_PATTERNS

### Community 56 - "Artefacto int8 de Laya"
Cohesion: 0.22
Nodes (8): Artefacto int8 de Laya, Identidad del artefacto, Publicación, Qué cuantiza, Regenerar el artefacto, Uso, Velocidad, Verificación

## Knowledge Gaps
- **9 isolated node(s):** `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`, `husky`, `lint-staged` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 317 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyBundle()` connect `install.ts` to `Artefacto int8 de Laya`, `DecisionEngine`, `laya/index.ts`, `alvaress`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `runHarnessCommand()` (e.g. with `.run()` and `.begin()`) actually correct?**
  _`runHarnessCommand()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `loader.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._
- **Why does `@clack/prompts` connect `package.json` to `install.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `DecisionEngine` be split into smaller, more focused modules?**
  _Cohesion score 0.07033248081841433 - nodes in this community are weakly interconnected._
- **Why does `alvaress` connect `alvaress` to `Configuración`, `Comandos`, `Agente, subagentes y skills`, `Aprendizaje continuo`, `Instalación`, `Especificación del arnés alvaress`, `spec.md`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._