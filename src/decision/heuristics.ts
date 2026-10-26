import type {
  Complexity,
  DecisionEngine,
  FailureInput,
  FailureVerdict,
  Risk,
  RiskAssessment,
  RiskInput,
  RouteDecision,
  RouteInput
} from '../core/contracts.js';

const SDD_PATTERN =
  /\b(arquitectura|redise[nñ]|migra|refactor|multi|varios archivos|sistema|flujo completo|end.to.end|api|contrato|esquema|schema|openspec|sdd|instalador)\b/i;

const GRAPH_PATTERN = /\b(grafo|graphify|dependencia|relaci[oó]n|impacto|llamadas)\b/i;

const RISKY_PATH_PATTERN =
  /(auth|security|seguridad|secret|token|config|migraci[oó]n|schema|package\.json|lock|\.github|installer|deploy)/i;

const NUCLEAR_PATTERN =
  /(arquitectura|architecture|circular|breaking change|contrato|contract|schema|migraci[oó]n|incompatible|enospc|eacces|permission denied|out of memory|heap|segmentation|lockfile|pnpm-lock|package-lock)/i;

const TRIVIAL_PATTERN =
  /(syntax|unexpected token|ts\d{4}|type error|no such file|cannot find module|module not found|oxlint|eslint|lint|format|unused|not assignable|does not exist|property .* missing|undefined is not|expected .* received)/i;

export function estimateComplexity(input: RouteInput): Complexity {
  const length = input.request.trim().length;
  const files = input.files?.length ?? 0;

  if (length <= 40 && files <= 1 && !SDD_PATTERN.test(input.request)) {
    return 'trivial';
  }
  if (length <= 120 && files <= 2) {
    return 'small';
  }
  if (length <= 400 && files <= 4) {
    return 'medium';
  }
  return 'large';
}

export function heuristicVerdict(input: FailureInput): FailureVerdict {
  const error = `${input.command}\n${input.error}`;
  const nuclear = input.exitCode === 137 || NUCLEAR_PATTERN.test(error);
  if (nuclear) {
    return {
      trivial: false,
      nuclear: true,
      reason: `El fallo de "${input.command}" parece estructural y no se repara con un parche local.`,
      confidence: 0.82,
      source: 'heuristic'
    };
  }

  const trivial = TRIVIAL_PATTERN.test(error);
  return {
    trivial,
    nuclear: false,
    reason: trivial
      ? `El fallo de "${input.command}" parece local y reparable.`
      : `El fallo de "${input.command}" no es concluyente; se intentará una reparación acotada.`,
    confidence: trivial ? 0.78 : 0.55,
    source: 'heuristic'
  };
}

export class HeuristicDecisionEngine implements DecisionEngine {
  route(input: RouteInput): Promise<RouteDecision> {
    const complexity = estimateComplexity(input);
    const wantsSdd =
      SDD_PATTERN.test(input.request) ||
      complexity === 'large' ||
      (input.files?.length ?? 0) > 3;
    const needsGraph =
      wantsSdd || GRAPH_PATTERN.test(input.request) || (input.files?.length ?? 0) > 2;

    return Promise.resolve({
      mode: wantsSdd ? 'sdd' : 'odd',
      complexity,
      needsGraph,
      needsSubagents: wantsSdd || (input.files?.length ?? 0) > 3,
      confidence: wantsSdd ? 0.72 : 0.8,
      source: 'heuristic'
    });
  }

  assessRisk(input: RiskInput): Promise<RiskAssessment> {
    const risks: Risk[] = [];
    const seen = new Set<string>();

    const push = (risk: Risk): void => {
      const key = `${risk.source}:${risk.title}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      risks.push(risk);
    };

    for (const warning of input.warnings) {
      push({ title: warning, source: 'linter', severity: 'low' });
    }

    const riskyFiles = input.changes.filter((change) => RISKY_PATH_PATTERN.test(change.path));
    if (riskyFiles.length > 0) {
      push({
        title: `Toca archivos sensibles: ${riskyFiles.map((change) => change.path).join(', ')}`,
        source: 'harness',
        severity: 'high'
      });
    }

    if (input.changes.length > 5) {
      push({
        title: `El run modifica ${input.changes.length} archivos; conviene revisar el diff completo.`,
        source: 'harness',
        severity: 'medium'
      });
    }

    if (input.changes.some((change) => change.kind === 'deleted')) {
      push({
        title: 'Hay archivos eliminados; verifica que no queden referencias rotas.',
        source: 'harness',
        severity: 'medium'
      });
    }

    const hasHighRisk = risks.some((risk) => risk.severity === 'high');
    return Promise.resolve({
      risks,
      confidence: hasHighRisk ? 0.75 : 0.65,
      source: 'heuristic'
    });
  }

  classifyFailure(input: FailureInput): Promise<FailureVerdict> {
    return Promise.resolve(heuristicVerdict(input));
  }
}
