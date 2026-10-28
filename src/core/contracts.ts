export type HarnessState = 'Exploring' | 'Working' | 'Checking' | 'Fixing' | 'Ready' | 'Halted';

export type RunMode = 'odd' | 'sdd';

export type ChangeKind = 'created' | 'modified' | 'deleted';

export type RiskSource = 'laya' | 'linter' | 'harness' | 'worker';

export type RiskSeverity = 'low' | 'medium' | 'high';

export type HaltCode =
  | 'nuclear'
  | 'scope'
  | 'worker'
  | 'timeout'
  | 'tool'
  | 'validation'
  | 'empty-diff'
  | 'commit'
  | 'cancelled';

export interface RunRequest {
  request: string;
  taskId?: string;
  files?: string[];
  mode?: 'auto' | RunMode;
  dryRun?: boolean;
  commit?: boolean;
  learn?: boolean;
}

export interface FileChange {
  path: string;
  change: string;
  kind?: ChangeKind;
}

export interface Risk {
  title: string;
  description?: string;
  source: RiskSource;
  severity?: RiskSeverity;
}

export interface ValidationCommandResult {
  command: string;
  code: number;
  stdout?: string;
  stderr?: string;
}

export interface ValidationResult {
  ok: boolean;
  commands: ValidationCommandResult[];
  warnings: string[];
}

export interface CommitResult {
  committed: boolean;
  sha?: string;
  message?: string;
  files: string[];
}

export interface HaltReason {
  code: HaltCode;
  message: string;
  detail?: string;
}

export interface RunResult {
  runId: string;
  state: 'Ready' | 'Halted';
  mode: RunMode;
  changes: FileChange[];
  risks: Risk[];
  validation: ValidationResult;
  commit?: CommitResult;
  halt?: HaltReason;
  logPath: string;
}

export interface Exploration {
  mode: RunMode;
  taskId?: string;
  source: string;
  acceptance: string[];
  files: string[];
  validation: string[];
  learnings: Array<{ id: string; title: string }>;
  risks: Risk[];
  blockedBy?: string;
}

export interface WorkPlan {
  runId: string;
  mode: RunMode;
  complexity?: Complexity;
  request: string;
  taskId?: string;
  source: string;
  acceptance: string[];
  files: string[];
  validation: string[];
  learnings: Array<{ id: string; title: string }>;
  vaultPath?: string;
}

export interface WorkResult {
  status: 'done' | 'blocked' | 'failed';
  changes: FileChange[];
  risks: Risk[];
  blockedBy?: string;
  detail?: string;
}

export interface FixInput {
  runId: string;
  attempt: number;
  files: string[];
  failure: ValidationResult;
  error: string;
}

export interface FixResult {
  verdict: 'fixed' | 'needs-orchestrator' | 'nuclear';
  changes: FileChange[];
  cause: string;
  risks: Risk[];
}

export interface ReadyInput {
  runId: string;
  mode: RunMode;
  request: RunRequest;
  exploration: Exploration;
  changes: FileChange[];
  risks: Risk[];
  validation: ValidationResult;
}

export interface ReadyResult {
  changes?: FileChange[];
  risks?: Risk[];
  commit?: CommitResult;
  logPath?: string;
}

export interface HarnessUI {
  start(state: HarnessState): void;
  setState(state: HarnessState): void;
  stop(): void;
}

export interface RouteInput {
  request: string;
  mode?: 'auto' | RunMode;
  files?: string[];
  state?: string;
}

export type Complexity = 'trivial' | 'small' | 'medium' | 'large';

export interface RouteDecision {
  mode: RunMode;
  complexity: Complexity;
  needsGraph: boolean;
  needsSubagents: boolean;
  confidence: number;
  source: 'laya' | 'heuristic';
}

export interface RiskInput {
  request: string;
  changes: FileChange[];
  warnings: string[];
}

export interface RiskAssessment {
  risks: Risk[];
  confidence: number;
  source: 'laya' | 'heuristic';
}

export interface FailureInput {
  command: string;
  exitCode: number;
  error: string;
  attempt: number;
}

export interface LearningScopeInput {
  kind: string;
  title: string;
  body: string;
  tags: string[];
  project: string;
}

export interface LearningScopeDecision {
  scope: 'global' | 'project';
  confidence: number;
  reason: string;
  source: 'laya' | 'heuristic';
}

export interface FailureVerdict {
  trivial: boolean;
  nuclear: boolean;
  reason: string;
  confidence: number;
  source: 'laya' | 'heuristic';
}

export interface DecisionEngine {
  route(input: RouteInput): Promise<RouteDecision>;
  assessRisk(input: RiskInput): Promise<RiskAssessment>;
  classifyFailure(input: FailureInput): Promise<FailureVerdict>;
  decideLearningScope(input: LearningScopeInput): Promise<LearningScopeDecision>;
  close?(): Promise<void>;
}

export interface Worker {
  readonly kind: 'aider' | 'subagent';
  work(plan: WorkPlan): Promise<WorkResult>;
  fix(input: FixInput): Promise<FixResult>;
  close?(): Promise<void>;
}

export interface Validator {
  validate(files: string[]): Promise<ValidationResult>;
}

export interface HarnessHandlers {
  explore(request: RunRequest, route: RouteDecision): Promise<Exploration>;
  work(plan: WorkPlan): Promise<WorkResult>;
  check(work: WorkResult): Promise<ValidationResult>;
  fix(failure: ValidationResult, attempt: number, work: WorkResult): Promise<FixResult>;
  ready(input: ReadyInput): Promise<ReadyResult>;
  halt(reason: HaltReason): Promise<void>;
  close?(): Promise<void>;
}
