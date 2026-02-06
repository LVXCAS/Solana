import { Connection, Keypair, PublicKey } from '@solana/web3.js';

/**
 * Load a Solana keypair from the filesystem
 * Uses standard Solana wallet convention (~/.config/solana/id.json)
 * @param path Path to keypair JSON file
 * @returns Keypair object
 */
export async function loadKeypair(path: string): Promise<Keypair> {
  throw new Error('Not implemented');
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
  throw new Error('Not implemented');
}
