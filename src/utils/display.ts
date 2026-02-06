import chalk from 'chalk';
import { LAMPORTS_PER_SOL } from './constants.js';

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
 * Display success message with green styling
 * @param message Success message
 */
export function displaySuccess(message: string): void {
  console.log(chalk.green('✓ ' + message));
}

/**
 * Display error message with red styling
 * @param message Error message
 */
export function displayError(message: string): void {
  console.error(chalk.red('✗ ' + message));
}
