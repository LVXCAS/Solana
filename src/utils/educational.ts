import chalk from 'chalk';
import ora from 'ora';

/**
 * Display educational explanation in dim gray with arrow prefix
 * @param message Educational context to display
 */
export function explain(message: string): void {
  console.log(chalk.gray('  -> ' + message));
}

/**
 * Run an operation with educational spinner showing progress and explanation
 * @param label Spinner label showing what's happening
 * @param explanation Educational context about the operation
 * @param operation Async operation to execute
 * @returns Result of the operation
 * @throws Re-throws any errors from the operation
 */
export async function educationalSpinner<T>(
  label: string,
  explanation: string,
  operation: () => Promise<T>
): Promise<T> {
  const spinner = ora(label).start();

  // Show explanation while operation runs
  console.log(); // Add spacing
  explain(explanation);

  try {
    const result = await operation();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

/**
 * Educational explanations for each operation in token creation flow
 * Keep concise (1-2 sentences) - learning tool, not documentation
 */
export const EXPLANATIONS = {
  ipfsUpload:
    'IPFS stores your image permanently using content addressing. Your logo gets a unique CID that anyone can use to retrieve it.',
  metadataJson:
    'Metadata JSON contains your token name/symbol/description and points to your image. This follows the Metaplex Token Standard.',
  metadataAccount:
    'Metaplex creates an on-chain account linking your token to metadata. Wallets and explorers read this to show your token info.',
  mintAuthority:
    'Revoking mint authority prevents anyone (including you) from creating more tokens. Supply becomes fixed forever.',
  freezeAuthority:
    'Revoking freeze authority prevents honeypot attacks. Token accounts cannot be frozen, ensuring free trading.',
  metadataAuthority:
    'Revoking metadata authority locks name/symbol permanently. This is IRREVERSIBLE - choose carefully.',
  burnLookup:
    'Solana stores tokens in Associated Token Accounts (ATAs), not directly in wallets. We need to find your ATA for this specific token.',
  burnExecute:
    'Burning permanently removes tokens from circulation by sending them to a null address. The mint total supply decreases on-chain.',
  burnVerify:
    'We verify the burn on-chain by checking the mint supply decreased by the expected amount. Trust, but verify.',
};
