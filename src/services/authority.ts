import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  mplTokenMetadata,
  fetchMetadataFromSeeds,
  updateV1,
} from '@metaplex-foundation/mpl-token-metadata';
import { publicKey, keypairIdentity } from '@metaplex-foundation/umi';

/**
 * Authority status for a single authority type
 */
interface AuthorityInfo {
  authority: string | null; // null = revoked
  isRevoked: boolean;
  yours: boolean; // true if authority matches payer
}

/**
 * Complete authority status for a token
 */
export interface AuthorityStatus {
  mint: AuthorityInfo;
  freeze: AuthorityInfo;
  metadataUpdate: {
    authority: string | null;
    isMutable: boolean; // false = metadata is immutable (authority revoked)
    yours: boolean;
  };
}

/**
 * Get authority status for all three authority types
 * @param connection Solana connection
 * @param mint Mint public key
 * @param payer Payer public key to check ownership
 * @returns Complete authority status
 */
export async function getAuthorityStatus(
  connection: Connection,
  mint: PublicKey,
  payer: PublicKey
): Promise<AuthorityStatus> {
  // Get mint info for mint and freeze authorities
  const mintInfo = await getMint(connection, mint);

  const mintAuthority = mintInfo.mintAuthority?.toBase58() ?? null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() ?? null;

  // Try to get metadata account
  let metadataUpdateAuthority: string | null = null;
  let isMutable = false;

  try {
    const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
    const metadata = await fetchMetadataFromSeeds(umi, {
      mint: publicKey(mint.toBase58()),
    });

    metadataUpdateAuthority = metadata.updateAuthority
      ? metadata.updateAuthority.toString()
      : null;
    isMutable = metadata.isMutable;
  } catch (error) {
    // Metadata account doesn't exist - this is okay for tokens created without metadata
    // Leave metadataUpdateAuthority as null and isMutable as false
  }

  const payerAddress = payer.toBase58();

  return {
    mint: {
      authority: mintAuthority,
      isRevoked: mintAuthority === null,
      yours: mintAuthority === payerAddress,
    },
    freeze: {
      authority: freezeAuthority,
      isRevoked: freezeAuthority === null,
      yours: freezeAuthority === payerAddress,
    },
    metadataUpdate: {
      authority: metadataUpdateAuthority,
      isMutable,
      yours: metadataUpdateAuthority === payerAddress,
    },
  };
}

/**
 * Revoke metadata update authority by setting isMutable to false
 * This is IRREVERSIBLE - metadata becomes permanently immutable
 * @param connection Solana connection
 * @param payer Keypair paying for transaction and current update authority
 * @param mint Mint public key
 * @returns Transaction signature
 * @throws Error if metadata doesn't exist or authority mismatch
 */
export async function revokeMetadataAuthority(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey
): Promise<string> {
  // Initialize Umi framework
  const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());

  // Convert web3.js Keypair to Umi keypair
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
  umi.use(keypairIdentity(umiKeypair));

  // Update metadata to set isMutable = false
  const tx = await updateV1(umi, {
    mint: publicKey(mint.toBase58()),
    authority: umi.identity,
    isMutable: false, // This makes metadata immutable - IRREVERSIBLE
  }).sendAndConfirm(umi);

  // Return transaction signature as base64 string
  return Buffer.from(tx.signature).toString('base64');
}
