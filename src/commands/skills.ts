import { installSkills } from '../skills/installer.js';
import { flagEnabled, parseArgs } from '../utils/args.js';
import { logger } from '../utils/logger.js';

const HELP = `alvaress skills [--no-link]

Escribe las skills del proyecto en .harness/skills y las enlaza en
~/.config/opencode/skills y ~/.claude/skills.

Opciones:
  --no-link   Solo escribe las skills del proyecto, sin enlaces globales.`;

export function runSkillsCommand(args: string[], root: string = process.cwd()): void {
  const { flags } = parseArgs(args);
  if (flagEnabled(flags, 'help') || flagEnabled(flags, 'h') || args.includes('help')) {
    console.log(HELP);
    return;
  }
  const report = installSkills(root, { linkGlobal: !flagEnabled(flags, 'no-link') });

  logger.success(`Skills del proyecto escritas en ${report.skillsDir}`);
  for (const link of report.links) {
    logger.info(`${link.result.padEnd(9)} ${link.link}`);
  }
}
