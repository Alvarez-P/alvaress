import fs from 'node:fs';
import path from 'node:path';
import { HARNESS_RUNS_DIR } from '../constants.js';
import type {
  CommitResult,
  FileChange,
  HaltCode,
  HarnessState,
  Risk,
  RunMode,
  ValidationResult
} from '../core/contracts.js';
import { errorMessage } from '../utils/errors.js';
import { ensureDir, pathExists, readJsonFile, writeJsonFileAtomic } from '../utils/fs.js';
import type { TaskOutcome } from './apply.js';

export interface RunTaskReport {
  specId: string;
  taskId: string;
  context: string;
  group: number;
  outcome: TaskOutcome;
  error?: string;
  files?: string[];
  outOfScope?: string[];
  validation?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface RunReport {
  id: string;
  command: 'apply';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  total: number;
  groups: number;
  verified: number;
  failed: number;
  skipped: number;
  results: RunTaskReport[];
}

export interface HarnessRunReport {
  id: string;
  command: 'run';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  state: HarnessState;
  mode: RunMode;
  request: string;
  taskId?: string;
  changes: FileChange[];
  risks: Risk[];
  validation?: ValidationResult;
  commit?: CommitResult;
  halt?: { code: HaltCode; message: string; detail?: string };
  logPath: string;
}

export type AnyRunReport = RunReport | HarnessRunReport;

export function getRunsDir(root: string = process.cwd()): string {
  return path.join(root, HARNESS_RUNS_DIR);
}

function reportId(date = new Date()): string {
  return date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 17);
}

export function writeRunReport(root: string, report: RunReport): string {
  const directory = getRunsDir(root);
  ensureDir(directory);
  const target = path.join(directory, `${report.id}-apply.json`);
  writeJsonFileAtomic(target, report);
  return target;
}

export function listRunReports(root: string = process.cwd()): RunReport[] {
  const directory = getRunsDir(root);
  if (!pathExists(directory)) {
    return [];
  }
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('-apply.json'))
    .map((name) => {
      try {
        return readJsonFile<RunReport>(path.join(directory, name));
      } catch {
        return undefined;
      }
    })
    .filter((report): report is RunReport => report !== undefined)
    .toSorted((left, right) => right.startedAt.localeCompare(left.startedAt));
}

export function readLatestRun(root: string = process.cwd()): RunReport | undefined {
  return listRunReports(root)[0];
}

export function readRun(root: string, id: string): RunReport | undefined {
  if (id === 'latest') {
    return readLatestRun(root);
  }
  const directory = getRunsDir(root);
  const target = path.join(directory, `${id}-apply.json`);
  if (!pathExists(target)) {
    return undefined;
  }
  try {
    return readJsonFile<RunReport>(target);
  } catch (error) {
    throw new Error(`No se pudo leer el reporte ${target}: ${errorMessage(error)}`, { cause: error });
  }
}

export function createRunReport(
  id: string,
  startedAt: Date,
  results: RunTaskReport[]
): RunReport {
  const finishedAt = new Date();
  return {
    id,
    command: 'apply',
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    total: results.length,
    groups: new Set(results.map((result) => result.group)).size,
    verified: results.filter((result) => result.outcome === 'verified').length,
    failed: results.filter((result) => result.outcome === 'failed').length,
    skipped: results.filter((result) => result.outcome === 'skipped').length,
    results
  };
}

export function newRunReportId(date = new Date()): string {
  return reportId(date);
}

export function writeHarnessRunReport(root: string, report: HarnessRunReport): string {
  const directory = getRunsDir(root);
  ensureDir(directory);
  const target = path.join(directory, `${report.id}-run.json`);
  writeJsonFileAtomic(target, report);
  return target;
}

export function listHarnessRunReports(root: string = process.cwd()): HarnessRunReport[] {
  const directory = getRunsDir(root);
  if (!pathExists(directory)) {
    return [];
  }
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('-run.json'))
    .map((name) => {
      try {
        return readJsonFile<HarnessRunReport>(path.join(directory, name));
      } catch {
        return undefined;
      }
    })
    .filter((report): report is HarnessRunReport => report !== undefined)
    .toSorted((left, right) => right.startedAt.localeCompare(left.startedAt));
}

export function listAllReports(root: string = process.cwd()): AnyRunReport[] {
  return [...listRunReports(root), ...listHarnessRunReports(root)].toSorted((left, right) =>
    right.startedAt.localeCompare(left.startedAt)
  );
}

export function readLatestReport(root: string = process.cwd()): AnyRunReport | undefined {
  return listAllReports(root)[0];
}

export function readHarnessRun(root: string, id: string): HarnessRunReport | undefined {
  if (id === 'latest') {
    return listHarnessRunReports(root)[0];
  }
  const target = path.join(getRunsDir(root), `${id}-run.json`);
  if (!pathExists(target)) {
    return undefined;
  }
  try {
    return readJsonFile<HarnessRunReport>(target);
  } catch (error) {
    throw new Error(`No se pudo leer el reporte ${target}: ${errorMessage(error)}`, { cause: error });
  }
}

export function readAnyReport(root: string, id: string): AnyRunReport | undefined {
  if (id === 'latest') {
    return readLatestReport(root);
  }
  return readHarnessRun(root, id) ?? readRun(root, id);
}
