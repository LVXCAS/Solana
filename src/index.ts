#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('memecoin-factory')
  .description('CLI tool for creating SPL tokens on Solana with anti-rug features')
  .version(packageJson.version);

program
  .command('create')
  .description('Create a new SPL token with metadata')
  .action(() => {
    console.log('Token creation coming in Plan 02');
  });

program.parse(process.argv);
