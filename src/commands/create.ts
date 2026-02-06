import { Command } from 'commander';
import chalk from 'chalk';
import { Connection } from '@solana/web3.js';
import { loadKeypair, checkSufficientBalance } from '../lib/wallet.js';
import { createToken, estimateCost, verifyAuthorities, TokenConfig } from '../lib/token.js';
import { promptTokenConfig, promptConfirmation, promptLockMetadata } from '../utils/prompts.js';
import {
  displayCostEstimate,
  displayTokenResult,
  displayError,
  createSpinner,
  formatSOL,
  displayAuthorityDashboard,
  displayMetadataResult,
} from '../utils/display.js';
import { DEVNET_URL, MAINNET_URL } from '../utils/constants.js';
import { educationalSpinner, EXPLANATIONS } from '../utils/educational.js';
import { validateImagePath } from '../utils/validation.js';
import { createTokenMetadata } from '../services/metadata.js';
import { getAuthorityStatus, revokeMetadataAuthority } from '../services/authority.js';

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
    .option('--description <text>', 'Token description')
    .option('--image <path>', 'Token logo file path')
    .option('--lock-metadata', 'Revoke metadata update authority', false)
    .option('--dry-run', 'Preview operations without executing', false)
    .option('-k, --keypair <path>', 'Keypair file path', '~/.config/solana/id.json')
    .option('-c, --cluster <cluster>', 'Cluster (devnet/mainnet-beta)', 'devnet')
    .option('-y, --yes', 'Skip confirmation prompt', false)
    .action(async (options) => {
      try {
        // Early validation: if --image provided, validate before any prompts
        if (options.image) {
          const validation = await validateImagePath(options.image);
          if (!validation.valid) {
            displayError(
              new Error(validation.error || 'Invalid image path'),
              'parameter validation'
            );
            process.exit(1);
          }
        }

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
        if (options.description) partialConfig.description = options.description;
        if (options.image) partialConfig.imagePath = options.image;

        // Prompt for missing parameters
        const config = await promptTokenConfig(partialConfig);

        // Display cost estimate
        displayCostEstimate(costs);

        // Dry-run mode: show preview and exit
        if (options.dryRun) {
          console.log(chalk.yellow('\nDRY RUN MODE - No transactions will be executed\n'));

          console.log(chalk.cyan('Operations that would be performed:\n'));
          console.log('  1. Load keypair from:', options.keypair);
          if (config.imagePath) {
            console.log('  2. Upload logo to IPFS:', config.imagePath);
            console.log('  3. Create metadata JSON with:');
            console.log('     - Name:', config.name);
            console.log('     - Symbol:', config.symbol);
            console.log('     - Description:', config.description);
            console.log('  4. Upload metadata JSON to IPFS');
            console.log('  5. Create SPL token mint');
            console.log('  6. Mint initial supply:', config.supply);
            console.log('  7. Create Metaplex metadata account');
            console.log('  8. Revoke mint authority');
            console.log('  9. Revoke freeze authority');
            if (options.lockMetadata) {
              console.log('  10. Revoke metadata update authority');
            }
          } else {
            console.log('  2. Create SPL token mint');
            console.log('  3. Mint initial supply:', config.supply);
            console.log('  4. Revoke mint authority');
            console.log('  5. Revoke freeze authority');
          }

          console.log(chalk.cyan('\nEstimated cost:'));
          console.log('  Total: ' + formatSOL(costs.total));

          console.log(chalk.dim('\nRemove --dry-run to execute these operations'));
          return;
        }

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

          // Create metadata if image path provided
          let metadataResult;
          if (config.imagePath && config.description) {
            try {
              const description = config.description; // Capture for closure
              const imagePath = config.imagePath; // Capture for closure

              metadataResult = await educationalSpinner(
                'Uploading token logo to IPFS...',
                EXPLANATIONS.ipfsUpload,
                async () => {
                  // Upload and create metadata in one operation
                  return await createTokenMetadata(connection, keypair, result.mint, {
                    name: config.name,
                    symbol: config.symbol,
                    description,
                    imagePath,
                  });
                }
              );
            } catch (error: any) {
              console.log(
                chalk.yellow(
                  '\nWarning: Token created successfully but metadata upload failed'
                )
              );
              displayError(error, 'metadata creation');
              console.log(
                chalk.dim(
                  'You can add metadata later using the update command (not implemented yet)'
                )
              );
            }
          }

          // Display full results
          displayTokenResult(result, options.cluster);

          // Display metadata results if created
          if (metadataResult) {
            displayMetadataResult(
              metadataResult.imageUri,
              metadataResult.metadataUri,
              metadataResult.signature,
              options.cluster
            );
          }

          // Display authority dashboard
          const authorityStatus = await getAuthorityStatus(
            connection,
            result.mint,
            keypair.publicKey
          );
          displayAuthorityDashboard(authorityStatus);

          // Handle metadata authority revocation
          if (metadataResult && authorityStatus.metadataUpdate.authority !== null) {
            let shouldLockMetadata = options.lockMetadata;

            // If not specified via flag, prompt user
            if (!shouldLockMetadata && !options.yes) {
              shouldLockMetadata = await promptLockMetadata();
            }

            if (shouldLockMetadata) {
              try {
                await educationalSpinner(
                  'Revoking metadata update authority...',
                  EXPLANATIONS.metadataAuthority,
                  () => revokeMetadataAuthority(connection, keypair, result.mint)
                );

                console.log(
                  chalk.green(
                    '✓ Metadata locked permanently - name/symbol cannot be changed'
                  )
                );
              } catch (error: any) {
                console.log(
                  chalk.yellow(
                    '\nWarning: Failed to revoke metadata authority'
                  )
                );
                displayError(error, 'metadata authority revocation');
              }
            }
          }

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
