import { installSkills } from '../skills/installer.js';
import { flagEnabled, parseArgs } from '../utils/args.js';
import { logger } from '../utils/logger.js';

export function runSkillsCommand(args: string[], root: string = process.cwd()): void {
  const { flags } = parseArgs(args);
  const report = installSkills(root, { linkGlobal: !flagEnabled(flags, 'no-link') });

  logger.success(`Skills del proyecto escritas en ${report.skillsDir}`);
  for (const link of report.links) {
    logger.info(`${link.result.padEnd(9)} ${link.link}`);
  }
}
