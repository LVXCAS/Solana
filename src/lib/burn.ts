import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  burn,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
} from '@solana/spl-token';

/**
 * Result of token burn operation with supply verification
 */
export interface BurnResult {
  signature: string;
  amountBurned: number;
  supplyBefore: bigint;
  supplyAfter: bigint;
  mint: string;
}

/**
 * Get burn information for a token account
 * @param connection Solana connection
 * @param mint Mint public key
 * @param owner Owner public key
 * @returns Token account info with balance and supply
 */
export async function getBurnInfo(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<{
  tokenAccount: PublicKey;
  balance: bigint;
  supply: bigint;
  decimals: number;
}> {
  // Get Associated Token Account
  const tokenAccount = await getAssociatedTokenAddress(mint, owner);

  // Fetch token account info
  let accountInfo;
  try {
    accountInfo = await getAccount(connection, tokenAccount);
  } catch (error: any) {
    throw new Error(
      `No token account found for this mint. You may not hold any of this token.\n\n` +
      `Mint: ${mint.toBase58()}\n` +
      `Owner: ${owner.toBase58()}`
    );
  }

  // Fetch mint info for supply and decimals
  const mintInfo = await getMint(connection, mint);

  return {
    tokenAccount,
    balance: accountInfo.amount,
    supply: mintInfo.supply,
    decimals: mintInfo.decimals,
  };
}

/**
 * Burn tokens to permanently reduce supply
 * @param connection Solana connection
 * @param payer Keypair paying for transaction fees
 * @param mint Mint public key
 * @param owner Owner keypair (must sign the burn)
 * @param amount Amount to burn in human-readable units
 * @param decimals Token decimals
 * @returns Burn result with signature and supply verification
 */
export async function burnTokens(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: Keypair,
  amount: number,
  decimals: number
): Promise<BurnResult> {
  // Get token account address
  const tokenAccount = await getAssociatedTokenAddress(mint, owner.publicKey);

  // Calculate raw amount with decimals
  const rawAmount = BigInt(Math.round(amount * Math.pow(10, decimals)));

  // Fetch account info and validate balance
  const accountInfo = await getAccount(connection, tokenAccount);

  if (accountInfo.amount < rawAmount) {
    const currentBalance = Number(accountInfo.amount) / Math.pow(10, decimals);
    throw new Error(
      `Insufficient balance to burn ${amount} tokens.\n\n` +
      `Current balance: ${currentBalance} tokens (${accountInfo.amount} raw units)\n` +
      `Requested burn: ${amount} tokens (${rawAmount} raw units)\n` +
      `Shortfall: ${amount - currentBalance} tokens`
    );
  }

  // Get supply before burn
  const mintInfoBefore = await getMint(connection, mint);
  const supplyBefore = mintInfoBefore.supply;

  // Execute burn
  const signature = await burn(
    connection,
    payer,
    tokenAccount,
    mint,
    owner,
    rawAmount
  );

  // Get supply after burn for verification
  const mintInfoAfter = await getMint(connection, mint);
  const supplyAfter = mintInfoAfter.supply;

  return {
    signature,
    amountBurned: amount,
    supplyBefore,
    supplyAfter,
    mint: mint.toBase58(),
  };
}
