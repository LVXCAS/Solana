import { Command } from 'commander';
import { Connection } from '@solana/web3.js';
import { loadKeypair, checkSufficientBalance } from '../lib/wallet.js';
import { createToken, estimateCost, verifyAuthorities, TokenConfig } from '../lib/token.js';
import { promptTokenConfig, promptConfirmation } from '../utils/prompts.js';
import {
  displayCostEstimate,
  displayTokenResult,
  displayError,
  createSpinner,
  formatSOL,
} from '../utils/display.js';
import { DEVNET_URL, MAINNET_URL } from '../utils/constants.js';

/**
 * Register the create command with the CLI program
 * @param program Commander program instance
 */
export function createCommand(program: Command): void {
  program
    .command('create')
    .description('Create a new SPL token with revoked authorities (anti-rug)')
    .option('-n, --name <name>', 'Token name (1-32 characters)')
    .option('-s, --symbol <symbol>', 'Token symbol (1-10 characters)')
    .option('-d, --decimals <decimals>', 'Decimals (0-9)', '9')
    .option('-a, --supply <amount>', 'Initial supply')
    .option('-k, --keypair <path>', 'Keypair file path', '~/.config/solana/id.json')
    .option('-c, --cluster <cluster>', 'Cluster (devnet/mainnet-beta)', 'devnet')
    .option('-y, --yes', 'Skip confirmation prompt', false)
    .action(async (options) => {
      try {
        // Load keypair
        const keypair = await loadKeypair(options.keypair);

        // Create connection to cluster
        const clusterUrl = options.cluster === 'mainnet-beta' ? MAINNET_URL : DEVNET_URL;
        const connection = new Connection(clusterUrl, 'confirmed');

        // Get cost estimate
        const costs = await estimateCost(connection);

        // Check balance
        const balanceCheck = await checkSufficientBalance(
          connection,
          keypair.publicKey,
          costs.total
        );

        if (!balanceCheck.sufficient) {
          displayError(
            new Error(
              `Insufficient SOL balance\n\n` +
              `Required: ${formatSOL(balanceCheck.required)}\n` +
              `Available: ${formatSOL(balanceCheck.balance)}\n` +
              `Shortfall: ${formatSOL(balanceCheck.required - balanceCheck.balance)}`
            ),
            'balance check'
          );
          process.exit(1);
        }

        // Build partial config from options
        const partialConfig: Partial<TokenConfig> = {};
        if (options.name) partialConfig.name = options.name;
        if (options.symbol) partialConfig.symbol = options.symbol.toUpperCase();
        if (options.decimals !== undefined) {
          const decimals = parseInt(options.decimals, 10);
          if (isNaN(decimals) || decimals < 0 || decimals > 9) {
            displayError(
              new Error('Decimals must be an integer between 0 and 9'),
              'parameter validation'
            );
            process.exit(1);
          }
          partialConfig.decimals = decimals;
        }
        if (options.supply) {
          const supply = Number(options.supply);
          if (isNaN(supply) || supply <= 0) {
            displayError(
              new Error('Supply must be a positive number'),
              'parameter validation'
            );
            process.exit(1);
          }
          partialConfig.supply = supply;
        }

        // Prompt for missing parameters
        const config = await promptTokenConfig(partialConfig);

        // Display cost estimate
        displayCostEstimate(costs);

        // Confirm unless --yes flag
        if (!options.yes) {
          const confirmed = await promptConfirmation(
            `Proceed with token creation? (cost: ${formatSOL(costs.total)})`
          );
          if (!confirmed) {
            console.log('Token creation cancelled.');
            process.exit(0);
          }
        }

        // Create token with progress spinners
        const spinner = createSpinner('Creating token...').start();

        try {
          spinner.text = 'Creating mint account...';

          // Call createToken which handles all steps
          const result = await createToken(connection, keypair, config);

          spinner.text = 'Verifying authorities...';
          const verification = await verifyAuthorities(connection, result.mint);

          // Ensure authorities are actually revoked
          if (verification.mintAuthority !== null || verification.freezeAuthority !== null) {
            spinner.fail('Authority revocation failed');
            displayError(
              new Error(
                `Authorities not properly revoked:\n` +
                `Mint Authority: ${verification.mintAuthority ?? 'REVOKED'}\n` +
                `Freeze Authority: ${verification.freezeAuthority ?? 'REVOKED'}`
              ),
              'verification'
            );
            process.exit(1);
          }

          spinner.succeed('Token created successfully!');

          // Display full results
          displayTokenResult(result, options.cluster);

        } catch (error: any) {
          spinner.fail('Token creation failed');
          throw error;
        }

      } catch (error: any) {
        displayError(error, 'token creation');
        process.exit(1);
      }
    });
}
