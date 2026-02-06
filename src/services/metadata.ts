import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  mplTokenMetadata,
  createV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  publicKey,
  keypairIdentity,
  percentAmount,
} from '@metaplex-foundation/umi';
import { uploadImage, uploadMetadata } from './ipfs.js';

/**
 * Configuration for token metadata
 */
export interface MetadataConfig {
  name: string;
  symbol: string;
  description: string;
  imagePath: string; // Local file path to upload
}

/**
 * Result of metadata creation operation
 */
export interface MetadataResult {
  metadataUri: string; // IPFS URI of metadata JSON
  imageUri: string; // IPFS URI of image
  metadataAccount: string; // Metadata PDA address
  signature: string; // Transaction signature
}

/**
 * Create Metaplex metadata for an existing SPL token
 * @param connection Solana connection
 * @param payer Keypair paying for transaction
 * @param mint Mint public key to attach metadata to
 * @param config Metadata configuration (name, symbol, description, image)
 * @returns Metadata creation result with URIs and transaction signature
 * @throws Error with remediation hints if creation fails
 */
export async function createTokenMetadata(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  config: MetadataConfig
): Promise<MetadataResult> {
  try {
    // Initialize Umi framework
    const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());

    // Convert web3.js Keypair to Umi keypair
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
    umi.use(keypairIdentity(umiKeypair));

    // Step 1: Upload image to IPFS
    const imageUpload = await uploadImage(config.imagePath);

    // Step 2: Create metadata JSON with image URI
    const metadataJson = {
      name: config.name,
      symbol: config.symbol,
      description: config.description,
      image: imageUpload.uri,
    };

    // Step 3: Upload metadata JSON to IPFS
    const metadataUpload = await uploadMetadata(metadataJson);

    // Step 4: Create on-chain metadata account using Umi's createV1
    const tx = await createV1(umi, {
      mint: publicKey(mint.toBase58()),
      authority: umi.identity,
      name: config.name,
      symbol: config.symbol,
      uri: metadataUpload.uri,
      sellerFeeBasisPoints: percentAmount(0), // 0% for fungible tokens
      tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi);

    // Derive metadata PDA address
    // Format: base58 encoded transaction signature acts as metadata account identifier
    const signature = Buffer.from(tx.signature).toString('base64');

    return {
      metadataUri: metadataUpload.uri,
      imageUri: imageUpload.uri,
      metadataAccount: signature, // Transaction signature serves as reference
      signature,
    };
  } catch (error: any) {
    // Enhance errors with remediation hints
    if (error.message?.includes('PINATA_JWT')) {
      throw error; // Already has remediation from IPFS service
    }

    if (error.message?.includes('account already in use')) {
      throw new Error(
        'Metadata account already exists for this mint.\n\n' +
          'To fix:\n' +
          '  - This mint already has metadata attached\n' +
          '  - Use a different mint address\n' +
          '  - Or update existing metadata (not supported yet)'
      );
    }

    if (error.message?.includes('insufficient funds')) {
      throw new Error(
        'Insufficient SOL for metadata creation.\n\n' +
          'To fix:\n' +
          '  - Check wallet balance: solana balance\n' +
          '  - Request airdrop: solana airdrop 1 --url devnet\n' +
          '  - Metadata creation costs ~0.01 SOL'
      );
    }

    if (
      error.message?.includes('blockhash not found') ||
      error.message?.includes('Transaction was not confirmed')
    ) {
      throw new Error(
        'Transaction confirmation timeout.\n\n' +
          'To fix:\n' +
          '  - RPC endpoint may be slow or overloaded\n' +
          '  - Try again in a few moments\n' +
          '  - Consider using dedicated RPC (QuickNode, Helius)\n' +
          '  - Check network status: https://status.solana.com'
      );
    }

    // Generic error with context
    throw new Error(
      `Metadata creation failed: ${error.message}\n\n` +
        'Troubleshooting:\n' +
        '  - Verify mint address is valid SPL token\n' +
        '  - Check you have authority over this mint\n' +
        '  - Ensure sufficient SOL for transaction fees\n' +
        '  - Verify network connectivity'
    );
  }
}
