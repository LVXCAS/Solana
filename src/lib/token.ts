import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint,
  setAuthority,
  AuthorityType,
  getMint,
  MINT_SIZE,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';

/**
 * Token configuration parameters
 */
export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  // Optional metadata (Phase 2)
  description?: string;
  imagePath?: string;
}

/**
 * Result of token creation with all transaction details
 */
export interface TokenResult {
  mint: PublicKey;
  tokenAccount: PublicKey;
  mintTxSignature: string;
  revokeAuthoritiesTxSignatures: string[];
  supply: bigint;
}

/**
 * Create a new SPL token with initial supply and revoked authorities
 * @param connection Solana connection
 * @param payer Keypair paying for transactions and receiving initial supply
 * @param config Token configuration (name, symbol, decimals, supply)
 * @returns Token creation result with mint address and transaction signatures
 */
export async function createToken(
  connection: Connection,
  payer: Keypair,
  config: TokenConfig
): Promise<TokenResult> {
  // Step 1: Create mint account
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mintAuthority (temporary, will revoke)
    payer.publicKey, // freezeAuthority (temporary, will revoke)
    config.decimals
  );

  // Step 2: Create associated token account for payer
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  // Step 3: Mint initial supply
  const actualSupply = BigInt(config.supply) * BigInt(10 ** config.decimals);
  const mintTxSignature = await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    actualSupply
  );

  // Step 4: Revoke mint authority (prevents increasing supply)
  const revokeMintTx = await setAuthority(
    connection,
    payer,
    mint,
    payer.publicKey,
    AuthorityType.MintTokens,
    null // null permanently revokes authority
  );

  // Step 5: Revoke freeze authority (prevents freezing accounts)
  const revokeFreezeTx = await setAuthority(
    connection,
    payer,
    mint,
    payer.publicKey,
    AuthorityType.FreezeAccount,
    null // null permanently revokes authority
  );

  return {
    mint,
    tokenAccount: tokenAccount.address,
    mintTxSignature,
    revokeAuthoritiesTxSignatures: [revokeMintTx, revokeFreezeTx],
    supply: actualSupply,
  };
}

/**
 * Verify that mint and freeze authorities are revoked
 * @param connection Solana connection
 * @param mint Mint public key
 * @returns Object with authority status (null means revoked, base58 string if set)
 */
export async function verifyAuthorities(
  connection: Connection,
  mint: PublicKey
): Promise<{ mintAuthority: string | null; freezeAuthority: string | null }> {
  const mintInfo = await getMint(connection, mint);

  return {
    mintAuthority: mintInfo.mintAuthority?.toBase58() ?? null,
    freezeAuthority: mintInfo.freezeAuthority?.toBase58() ?? null,
  };
}

/**
 * Estimate cost of creating a token
 * @param connection Solana connection
 * @returns Cost breakdown in lamports
 */
export async function estimateCost(
  connection: Connection
): Promise<{ rent: number; fees: number; total: number }> {
  // Get rent exemption for mint account (82 bytes)
  const rent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  // Estimate transaction fees:
  // - createMint: ~5000 lamports
  // - createAssociatedTokenAccount: ~5000 lamports
  // - mintTo: ~5000 lamports
  // - 2x setAuthority: ~10000 lamports
  const fees = 5000 * 5;

  return {
    rent,
    fees,
    total: rent + fees,
  };
}
