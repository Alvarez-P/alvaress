#!/usr/bin/env node
import { runCli } from './cli.js';
import { CancelledError, errorMessage } from './utils/errors.js';

runCli(process.argv.slice(2)).catch((error: unknown) => {
  if (error instanceof CancelledError) {
    process.exitCode = 130;
    return;
  }
  console.error(`[alvaress] ${errorMessage(error)}`);
  process.exitCode = 1;
});
