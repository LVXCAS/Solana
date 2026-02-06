import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { LAMPORTS_PER_SOL } from './constants.js';
import { TokenResult } from '../lib/token.js';

/**
 * Format lamports as SOL with precision
 * @param lamports Amount in lamports
 * @returns Formatted SOL string
 */
export function formatSOL(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(9) + ' SOL';
}

/**
 * Generate Solana Explorer URL for a transaction
 * @param signature Transaction signature
 * @param cluster Network cluster (devnet or mainnet-beta)
 * @returns Explorer URL
 */
export function getExplorerUrl(signature: string, cluster: string): string {
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
}

/**
 * Generate Solana Explorer URL for an address
 * @param address Public key address
 * @param cluster Network cluster (devnet or mainnet-beta)
 * @returns Explorer URL
 */
export function getExplorerAddressUrl(address: string, cluster: string): string {
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/address/${address}${clusterParam}`;
}

/**
 * Display success message with green styling
 * @param message Success message
 */
export function displaySuccess(message: string): void {
  console.log(chalk.green('✓ ' + message));
}

/**
 * Display error message with red styling and remediation hints
 * @param error Error object or string
 * @param context Optional context about what was being attempted
 */
export function displayError(error: Error | string, context?: string): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerError = errorMessage.toLowerCase();

  console.error(chalk.red('\n✗ Error' + (context ? ` (${context})` : '') + ':\n'));
  console.error(chalk.red(errorMessage));

  // Provide remediation hints based on error type
  if (lowerError.includes('insufficient') || lowerError.includes('balance')) {
    console.error(chalk.yellow('\nTo fix:'));
    console.error(chalk.yellow('  solana airdrop 1 --url devnet'));
    console.error(chalk.gray('  (or use mainnet-beta with real SOL)'));
  } else if (lowerError.includes('keypair') || lowerError.includes('file not found')) {
    console.error(chalk.yellow('\nTo fix:'));
    console.error(chalk.yellow('  solana-keygen new --outfile ~/.config/solana/id.json'));
    console.error(chalk.gray('  (generates a new keypair file)'));
  } else if (lowerError.includes('timeout') || lowerError.includes('blockhash')) {
    console.error(chalk.yellow('\nTo fix:'));
    console.error(chalk.yellow('  Try again - devnet can be unstable'));
    console.error(chalk.gray('  (consider using mainnet-beta for production)'));
  } else {
    console.error(chalk.yellow('\nTroubleshooting:'));
    console.error(chalk.yellow('  - Check your network connection'));
    console.error(chalk.yellow('  - Verify cluster endpoint is accessible'));
    console.error(chalk.yellow('  - Check Solana status: status.solana.com'));
  }

  console.error(); // Empty line for spacing
}

/**
 * Display cost estimate in a formatted table
 * @param costs Cost breakdown in lamports
 */
export function displayCostEstimate(costs: {
  rent: number;
  fees: number;
  total: number;
}): void {
  console.log(chalk.cyan('\nCost Estimate:'));
  console.log(
    chalk.gray('  Rent exemption:  ') + chalk.white(formatSOL(costs.rent))
  );
  console.log(
    chalk.gray('  Transaction fees:') + chalk.white(formatSOL(costs.fees))
  );
  console.log(
    chalk.gray('  Total:           ') + chalk.white(formatSOL(costs.total))
  );
  console.log();
}

/**
 * Display token creation result with all details
 * @param result Token creation result
 * @param cluster Network cluster
 */
export function displayTokenResult(result: TokenResult, cluster: string): void {
  const mintAddress = result.mint.toBase58();
  const tokenAccountAddress = result.tokenAccount.toBase58();
  const supplyFormatted = result.supply.toString();

  console.log(chalk.green.bold('\n✓ Token Created Successfully!\n'));

  // Token details
  console.log(chalk.gray('Mint Address:   ') + chalk.white(mintAddress));
  console.log(chalk.gray('Token Account:  ') + chalk.white(tokenAccountAddress));
  console.log(chalk.gray('Supply:         ') + chalk.white(supplyFormatted));

  // Transaction links
  console.log(chalk.cyan('\nTransactions:'));
  console.log(
    chalk.gray('  - Mint created: ') +
      chalk.blue(getExplorerUrl(result.mintTxSignature, cluster))
  );
  result.revokeAuthoritiesTxSignatures.forEach((sig, idx) => {
    const label = idx === 0 ? 'Mint authority revoked' : 'Freeze authority revoked';
    console.log(
      chalk.gray(`  - ${label}: `) + chalk.blue(getExplorerUrl(sig, cluster))
    );
  });

  // Authority status
  console.log(chalk.cyan('\nAuthority Status:'));
  console.log(
    chalk.gray('  Mint Authority:   ') +
      chalk.green('REVOKED') +
      chalk.gray(' (supply fixed)')
  );
  console.log(
    chalk.gray('  Freeze Authority: ') +
      chalk.green('REVOKED') +
      chalk.gray(' (no honeypot risk)')
  );

  // Token explorer link
  console.log(
    chalk.cyan('\nView token: ') +
      chalk.blue(getExplorerAddressUrl(mintAddress, cluster))
  );
  console.log();
}

/**
 * Create a spinner for showing progress
 * @param text Spinner text
 * @returns Ora spinner instance
 */
export function createSpinner(text: string): Ora {
  return ora(text);
}
