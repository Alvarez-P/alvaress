import fs from 'node:fs';
import path from 'node:path';
import type { WorkerBackend } from '../src/config/loader.js';
import type { SpecialistRole } from '../src/core/contracts.js';
import { flagEnabled, parseArgs } from '../src/utils/args.js';
import { listFixtures, preflight, runDirect, runFixture, summarize } from './runner.js';
import type { BenchResult } from './runner.js';

const HELP = `pnpm bench [opciones]

Ejecuta los fixtures de bench/fixtures con el HarnessCore real y subagentes de
OpenCode, y resume tokens, llamadas, reparaciones y tiempo. Gasta tokens reales.

Opciones:
  --fixture a,b       Fixtures a ejecutar (por defecto, todos).
  --repeat N          Repeticiones por fixture (por defecto, 1).
  --model p/m         Modelo de los subagentes (por defecto, el configurado).
  --backend b         opencode (por defecto) o claude (claude -p con tu plan o API key).
  --direct            Línea base sin alvaress: Claude Code solo resuelve la tarea
                      (--model por defecto: opus).
  --roles r1,r2       Especialistas: researcher, architect, designer, tester, reviewer.
  --self-check        Activa el autochequeo del implementer.
  --keep              Conserva el directorio de trabajo de cada corrida.
  --out archivo       Guarda los resultados en JSON (por defecto, bench/results/).`;

const ROLES = new Set<SpecialistRole>(['researcher', 'architect', 'designer', 'tester', 'reviewer']);

function csv(value: string | boolean | undefined): string[] {
  return typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];
}

function parseRoles(value: string | boolean | undefined): SpecialistRole[] {
  const roles = csv(value);
  const invalid = roles.filter((role) => !ROLES.has(role as SpecialistRole));
  if (invalid.length > 0) {
    throw new Error(`Especialistas desconocidos: ${invalid.join(', ')}.`);
  }
  return roles as SpecialistRole[];
}

async function main(): Promise<number> {
  const { flags } = parseArgs(process.argv.slice(2));
  if (flagEnabled(flags, 'help')) {
    console.log(HELP);
    return 0;
  }

  const direct = flagEnabled(flags, 'direct');
  const backend: WorkerBackend = direct || flags.backend === 'claude' ? 'claude' : 'opencode';
  if (typeof flags.backend === 'string' && !['opencode', 'claude'].includes(flags.backend)) {
    throw new Error('--backend debe ser opencode o claude.');
  }
  const problems = preflight(backend);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`✖ ${problem}`);
    }
    return 1;
  }

  const available = listFixtures();
  const fixtures = csv(flags.fixture).length > 0 ? csv(flags.fixture) : available;
  const unknown = fixtures.filter((fixture) => !available.includes(fixture));
  if (unknown.length > 0) {
    throw new Error(`Fixtures desconocidos: ${unknown.join(', ')}. Disponibles: ${available.join(', ')}.`);
  }
  const repeat = typeof flags.repeat === 'string' ? Number.parseInt(flags.repeat, 10) : 1;
  if (!Number.isInteger(repeat) || repeat < 1) {
    throw new Error('--repeat debe ser un entero mayor que cero.');
  }
  const options = {
    roles: parseRoles(flags.roles),
    selfCheck: flagEnabled(flags, 'self-check'),
    keep: flagEnabled(flags, 'keep'),
    backend,
    ...(typeof flags.model === 'string' ? { model: flags.model } : {})
  };

  const results: BenchResult[] = [];
  for (const fixture of fixtures) {
    for (let index = 1; index <= repeat; index += 1) {
      process.stdout.write(`▸ ${fixture} (${index}/${repeat})… `);
      const result = direct ? await runDirect(fixture, options) : await runFixture(fixture, options);
      results.push(result);
      const tokens = result.usage?.total;
      console.log(
        `${result.state} · ${tokens?.input ?? 0}/${tokens?.output ?? 0} tokens · ${result.fixes} reparación(es)` +
          `${result.halt !== undefined ? ` · ${result.halt}` : ''}${result.workdir !== undefined ? ` · ${result.workdir}` : ''}`
      );
    }
  }

  console.log(`\n${summarize(results)}`);
  const out =
    typeof flags.out === 'string'
      ? flags.out
      : path.join('bench', 'results', `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify({ options: { ...options, direct }, results }, null, 2)}\n`, 'utf-8');
  console.log(`\nResultados: ${out}`);
  return results.every((result) => result.state === 'Ready') ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
);
