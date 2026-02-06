import { Command } from 'commander';
import chalk from 'chalk';
import { Connection, PublicKey } from '@solana/web3.js';
import { confirm, input } from '@inquirer/prompts';
import { loadKeypair } from '../lib/wallet.js';
import { burnTokens, getBurnInfo } from '../lib/burn.js';
import { displayBurnResult, displayError } from '../utils/display.js';
import { DEVNET_URL, MAINNET_URL } from '../utils/constants.js';
import { educationalSpinner, EXPLANATIONS, explain } from '../utils/educational.js';

/**
 * Register the burn command with the CLI program
 * @param program Commander program instance
 */
export function burnCommand(program: Command): void {
  program
    .command('burn')
    .description('Burn tokens to permanently reduce supply')
    .requiredOption('--mint <address>', 'Mint address of token to burn')
    .requiredOption('--amount <amount>', 'Number of tokens to burn')
    .option('-k, --keypair <path>', 'Keypair file path', '~/.config/solana/id.json')
    .option('-c, --cluster <cluster>', 'Cluster (devnet/mainnet-beta)', 'devnet')
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .action(async (options) => {
      try {
        // Load keypair
        const keypair = await loadKeypair(options.keypair);

        // Create connection to cluster
        const clusterUrl = options.cluster === 'mainnet-beta' ? MAINNET_URL : DEVNET_URL;
        const connection = new Connection(clusterUrl, 'confirmed');

        // Parse mint address
        let mint: PublicKey;
        try {
          mint = new PublicKey(options.mint);
        } catch (error: any) {
          displayError(
            new Error(`Invalid mint address: ${options.mint}\n\nMust be a valid base58 Solana address`),
            'parameter validation'
          );
          process.exit(1);
        }

        // Parse amount
        const amount = Number(options.amount);
        if (isNaN(amount) || amount <= 0) {
          displayError(
            new Error('Amount must be a positive number'),
            'parameter validation'
          );
          process.exit(1);
        }

        // Get burn info (balance, supply, decimals)
        let info;
        try {
          info = await getBurnInfo(connection, mint, keypair.publicKey);
        } catch (error: any) {
          displayError(error, 'token account lookup');
          process.exit(1);
        }

        // Calculate balances
        const currentBalance = Number(info.balance) / Math.pow(10, info.decimals);
        const remainingAfterBurn = currentBalance - amount;

        // Display burn preview
        console.log(chalk.cyan('\nBurn Preview:\n'));
        console.log(chalk.gray('  Current balance:       ') + chalk.white(currentBalance.toString()));
        console.log(chalk.gray('  Amount to burn:        ') + chalk.white(amount.toString()));
        console.log(chalk.gray('  Remaining after burn:  ') + chalk.white(remainingAfterBurn.toString()));
        console.log(chalk.gray('  Current total supply:  ') + chalk.white(info.supply.toString()));
        console.log();

        // Three-level confirmation (unless --yes flag)
        if (!options.yes) {
          // Level 1: Warning display and initial confirmation
          console.log(chalk.red.bold('⚠️  BURN TOKENS - PERMANENT ACTION\n'));
          console.log(chalk.yellow('You are about to permanently destroy tokens.\n'));
          console.log(chalk.gray('Details:'));
          console.log(chalk.gray(`  Tokens to burn: `) + chalk.white(`${amount}`));
          console.log(chalk.gray(`  Mint address:   `) + chalk.white(mint.toBase58()));
          console.log(chalk.gray(`  Supply impact:  `) + chalk.white(`-${((amount * Math.pow(10, info.decimals)) / Number(info.supply) * 100).toFixed(2)}% of total`));
          console.log(chalk.red('\nThis action CANNOT BE UNDONE.\n'));

          const understand = await confirm({
            message: 'I understand this is permanent and irreversible',
            default: false,
          });

          if (!understand) {
            console.log(chalk.gray('Burn cancelled.'));
            process.exit(0);
          }

          // Level 2: Type-to-confirm
          const typed = await input({
            message: chalk.yellow('Type "BURN" to confirm:'),
            validate: (value: string) => {
              if (value === 'BURN') return true;
              return 'Please type "BURN" exactly (all caps)';
            },
          });

          // Level 3: Final confirmation
          const finalConfirm = await confirm({
            message: chalk.red(`FINAL: Burn ${amount} tokens?`),
            default: false,
          });

          if (!finalConfirm) {
            console.log(chalk.gray('Burn cancelled.'));
            process.exit(0);
          }

          console.log(); // Spacing
        }

        // Execute burn with educational spinners
        let result;
        try {
          // First educational note about ATA lookup (conceptual)
          explain(EXPLANATIONS.burnLookup);

          // Main burn operation
          result = await educationalSpinner(
            'Burning tokens...',
            EXPLANATIONS.burnExecute,
            () => burnTokens(connection, keypair, mint, keypair, amount, info.decimals)
          );

          // Verification note
          explain(EXPLANATIONS.burnVerify);
        } catch (error: any) {
          displayError(error, 'token burn');
          process.exit(1);
        }

        // Display result
        displayBurnResult(result, options.cluster);

      } catch (error: any) {
        displayError(error, 'token burn');
        process.exit(1);
      }
    });
}
