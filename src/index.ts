#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createCommand } from './commands/create.js';
import { burnCommand } from './commands/burn.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('memecoin-factory')
  .description('CLI tool for creating SPL tokens on Solana with anti-rug features')
  .version(packageJson.version);

// Register create command
createCommand(program);

// Register burn command
burnCommand(program);

program.parse(process.argv);
