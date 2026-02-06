import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { readFile } from 'fs/promises';
import { homedir } from 'os';

/**
 * Load a Solana keypair from the filesystem
 * Uses standard Solana wallet convention (~/.config/solana/id.json)
 * @param path Path to keypair JSON file
 * @returns Keypair object
 */
export async function loadKeypair(path: string): Promise<Keypair> {
  // Expand ~ to home directory
  const expandedPath = path.replace(/^~/, homedir());

  try {
    const fileContent = await readFile(expandedPath, 'utf-8');
    const secretKey = JSON.parse(fileContent);

    // Solana CLI format: array of 64 numbers
    if (!Array.isArray(secretKey) || secretKey.length !== 64) {
      throw new Error(
        `Invalid keypair format in ${expandedPath}. Expected array of 64 numbers.`
      );
    }

    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Keypair file not found: ${expandedPath}\n` +
        `Generate one with: solana-keygen new --outfile ${expandedPath}`
      );
    }
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON in keypair file: ${expandedPath}\n` +
        `File must contain valid JSON array.`
      );
    }
    throw error;
  }
}

/**
 * Get SOL balance for a public key
 * @param connection Solana connection
 * @param publicKey Public key to check
 * @returns Balance in lamports
 */
export async function getBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  return await connection.getBalance(publicKey);
}

/**
 * Check if wallet has sufficient balance for an operation
 * @param connection Solana connection
 * @param publicKey Public key to check
 * @param required Required balance in lamports
 * @returns Object with balance check result
 */
export async function checkSufficientBalance(
  connection: Connection,
  publicKey: PublicKey,
  required: number
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  const balance = await getBalance(connection, publicKey);
  return {
    sufficient: balance >= required,
    balance,
    required,
  };
}
