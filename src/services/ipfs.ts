import { PinataSDK } from 'pinata';
import { readFile } from 'fs/promises';
import { extname } from 'path';

/**
 * Result of an IPFS upload operation
 */
export interface IpfsUploadResult {
  cid: string;
  uri: string; // Full gateway URL
}

/**
 * Token metadata JSON structure following Metaplex Token Standard
 */
export interface TokenMetadataJson {
  name: string;
  symbol: string;
  description: string;
  image: string; // IPFS URI of uploaded image
}

/**
 * Get configured Pinata client instance
 * @returns Configured PinataSDK instance
 * @throws Error if PINATA_JWT environment variable is not set
 */
function getPinataClient(): PinataSDK {
  const pinataJwt = process.env.PINATA_JWT;

  if (!pinataJwt) {
    throw new Error(
      'PINATA_JWT environment variable not set.\n\n' +
        'To fix:\n' +
        '  1. Create account at https://app.pinata.cloud/register\n' +
        '  2. Generate API key: Dashboard -> API Keys -> New Key\n' +
        '  3. Copy JWT token\n' +
        '  4. Set environment variable: export PINATA_JWT="your-jwt-here"\n' +
        '  5. Or create .env file: PINATA_JWT=your-jwt-here'
    );
  }

  return new PinataSDK({
    pinataJwt,
    pinataGateway: 'gateway.pinata.cloud',
  });
}

/**
 * Get MIME type from file extension
 * @param filePath Path to image file
 * @returns MIME type string
 */
function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  return mimeTypes[ext] || 'image/png';
}

/**
 * Upload an image file to IPFS via Pinata
 * @param imagePath Path to image file on disk
 * @returns Upload result with CID and gateway URL
 * @throws Error with remediation hints if upload fails
 */
export async function uploadImage(imagePath: string): Promise<IpfsUploadResult> {
  try {
    const pinata = getPinataClient();

    // Read file from disk
    const fileBuffer = await readFile(imagePath);
    const mimeType = getMimeType(imagePath);
    const fileName = imagePath.split('/').pop() || 'image';

    // Create File object for upload
    const file = new File([fileBuffer], fileName, { type: mimeType });

    // Upload to Pinata
    const upload = await pinata.upload.public.file(file);

    return {
      cid: upload.cid,
      uri: `https://gateway.pinata.cloud/ipfs/${upload.cid}`,
    };
  } catch (error: any) {
    // Enhance error with remediation hints
    if (error.message?.includes('PINATA_JWT')) {
      throw error; // Already has remediation steps
    }

    if (error.code === 'ENOENT') {
      throw new Error(
        `Image file not found: ${imagePath}\n\n` +
          'To fix:\n' +
          '  - Verify the file path is correct\n' +
          '  - Check file exists: ls -la "' +
          imagePath +
          '"'
      );
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(
        'Pinata authentication failed.\n\n' +
          'To fix:\n' +
          '  1. Verify PINATA_JWT is correct\n' +
          '  2. Generate new API key at https://app.pinata.cloud/developers/api-keys\n' +
          '  3. Update environment variable with new JWT'
      );
    }

    if (error.response?.status === 429) {
      throw new Error(
        'Pinata rate limit exceeded.\n\n' +
          'To fix:\n' +
          '  - Wait a few minutes before retrying\n' +
          '  - Free tier: 180 requests per minute\n' +
          '  - Consider upgrading at https://pinata.cloud/pricing'
      );
    }

    if (error.response?.status === 402 || error.message?.includes('over_free_limit')) {
      throw new Error(
        'Pinata free tier limit exceeded (1GB storage, 500 files).\n\n' +
          'To fix:\n' +
          '  - Delete old pins: https://app.pinata.cloud/pinmanager\n' +
          '  - Upgrade plan at https://pinata.cloud/pricing\n' +
          '  - Use different account for testing'
      );
    }

    // Generic error with network hints
    throw new Error(
      `IPFS upload failed: ${error.message}\n\n` +
        'Troubleshooting:\n' +
        '  - Check internet connection\n' +
        '  - Verify Pinata service status: https://status.pinata.cloud\n' +
        '  - Try again in a few moments'
    );
  }
}

/**
 * Upload token metadata JSON to IPFS via Pinata
 * @param metadata Token metadata object
 * @returns Upload result with CID and gateway URL
 * @throws Error with remediation hints if upload fails
 */
export async function uploadMetadata(
  metadata: TokenMetadataJson
): Promise<IpfsUploadResult> {
  try {
    const pinata = getPinataClient();

    // Create File from JSON
    const jsonString = JSON.stringify(metadata, null, 2);
    const file = new File([jsonString], 'metadata.json', {
      type: 'application/json',
    });

    // Upload to Pinata
    const upload = await pinata.upload.public.file(file);

    return {
      cid: upload.cid,
      uri: `https://gateway.pinata.cloud/ipfs/${upload.cid}`,
    };
  } catch (error: any) {
    // Enhance error with remediation hints
    if (error.message?.includes('PINATA_JWT')) {
      throw error; // Already has remediation steps
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(
        'Pinata authentication failed.\n\n' +
          'To fix:\n' +
          '  1. Verify PINATA_JWT is correct\n' +
          '  2. Generate new API key at https://app.pinata.cloud/developers/api-keys\n' +
          '  3. Update environment variable with new JWT'
      );
    }

    if (error.response?.status === 429) {
      throw new Error(
        'Pinata rate limit exceeded.\n\n' +
          'To fix:\n' +
          '  - Wait a few minutes before retrying\n' +
          '  - Free tier: 180 requests per minute\n' +
          '  - Consider upgrading at https://pinata.cloud/pricing'
      );
    }

    if (error.response?.status === 402 || error.message?.includes('over_free_limit')) {
      throw new Error(
        'Pinata free tier limit exceeded (1GB storage, 500 files).\n\n' +
          'To fix:\n' +
          '  - Delete old pins: https://app.pinata.cloud/pinmanager\n' +
          '  - Upgrade plan at https://pinata.cloud/pricing\n' +
          '  - Use different account for testing'
      );
    }

    // Generic error with network hints
    throw new Error(
      `Metadata upload failed: ${error.message}\n\n` +
        'Troubleshooting:\n' +
        '  - Check internet connection\n' +
        '  - Verify Pinata service status: https://status.pinata.cloud\n' +
        '  - Try again in a few moments'
    );
  }
}
