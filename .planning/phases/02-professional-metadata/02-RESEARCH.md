# Phase 2: Professional Metadata - Research

**Researched:** 2026-02-05
**Domain:** Metaplex Token Metadata, IPFS Storage, Educational CLI UX
**Confidence:** HIGH

## Summary

Phase 2 adds professional metadata to SPL tokens using Metaplex Token Metadata Standard, making tokens visible in wallets and explorers with name, symbol, description, and logo. Research reveals a mature, well-documented ecosystem with clear patterns.

**Core stack:** Metaplex provides the industry-standard metadata program using Umi framework (`@metaplex-foundation/umi` + `@metaplex-foundation/mpl-token-metadata`). Token metadata uses a simple JSON schema (name/symbol/description/image) stored off-chain with URI pointer on-chain. Images upload to IPFS via Pinata SDK (`pinata` npm package v2.5.2) for permanent decentralized storage. Educational output leverages existing chalk/ora for progressive disclosure during operations. Authority management uses SPL Token's `setAuthority` with `AuthorityType` enum, supporting revocation by setting authority to `null` (irreversible). Dry-run mode follows established CLI pattern using flags to skip blockchain operations while validating inputs and showing preview.

**Primary recommendation:** Use Umi's `createV1` helper for metadata creation, Pinata SDK for IPFS uploads with free tier (1GB storage, 10GB bandwidth, 500 files), progressive educational output during spinner operations, and authority dashboard after creation showing mint/freeze/metadata update status with clear revocation warnings.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @metaplex-foundation/umi | 1.4.1 | Solana framework for JS clients | Official Metaplex framework, replaces older Metaplex JS SDK |
| @metaplex-foundation/umi-bundle-defaults | 1.4.1 | Default Umi plugins bundle | Quickstart bundle with standard RPC/signer plugins |
| @metaplex-foundation/mpl-token-metadata | 3.4.0 | Token metadata program library | Official Token Metadata program bindings, createV1 helper |
| pinata | 2.5.2 | IPFS pinning service SDK | Current official Pinata SDK (replaces deprecated @pinata/sdk) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @solana/spl-token | (existing) | SPL Token program bindings | Authority revocation via setAuthority, already in Phase 1 |
| chalk | (existing) | Terminal output styling | Educational output coloring, already in Phase 1 |
| ora | (existing) | Terminal spinner animations | Progress indication, already in Phase 1 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pinata | Arweave (via Irys) | More permanent (pay once) but costs upfront vs free tier |
| Pinata | Centralized hosting | Cheaper/simpler but defeats decentralization purpose |
| Umi framework | Direct web3.js + program calls | More control but significantly more complex, error-prone |
| @pinata/sdk (deprecated) | pinata (current) | Old SDK no longer maintained (3 years), use new one |

**Installation:**
```bash
npm install @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/mpl-token-metadata pinata
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   ├── metadata.ts      # Metaplex metadata creation (createV1)
│   ├── ipfs.ts          # Pinata IPFS upload operations
│   └── authority.ts     # Authority status checking/revocation
├── utils/
│   ├── educational.ts   # Progressive disclosure output helpers
│   └── dry-run.ts       # Dry-run mode flag checking
└── commands/
    └── create.ts        # Extended with metadata flow
```

### Pattern 1: Metadata Creation with Umi
**What:** Use Umi's createV1 helper to attach metadata to existing mint
**When to use:** After mint creation, before initial token issuance
**Example:**
```typescript
// Source: https://developers.metaplex.com/guides/javascript/how-to-add-metadata-to-spl-tokens
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata());

await createV1(umi, {
  mint: publicKey(mintAddress),
  authority: umi.identity,
  name: "Solana Gold",
  symbol: "GOLDSOL",
  uri: "https://ipfs.io/ipfs/QmXxx...",
  sellerFeeBasisPoints: 0,
  tokenStandard: TokenStandard.Fungible,
}).sendAndConfirm(umi);
```

### Pattern 2: IPFS Upload via Pinata
**What:** Upload token logo and metadata JSON to IPFS, get permanent URI
**When to use:** Before metadata creation (need URI for createV1)
**Example:**
```typescript
// Source: https://docs.pinata.cloud/files/uploading-files
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: "gateway.pinata.cloud",
});

// Upload image first
const file = new File([imageBuffer], "token-logo.png", { type: "image/png" });
const imageUpload = await pinata.upload.public.file(file);
const imageUri = `https://gateway.pinata.cloud/ipfs/${imageUpload.cid}`;

// Upload metadata JSON pointing to image
const metadata = {
  name: "Solana Gold",
  symbol: "GOLDSOL",
  description: "Educational token for learning Solana",
  image: imageUri
};
const metadataFile = new File([JSON.stringify(metadata)], "metadata.json", { type: "application/json" });
const metadataUpload = await pinata.upload.public.file(metadataFile);
const metadataUri = `https://gateway.pinata.cloud/ipfs/${metadataUpload.cid}`;
```

### Pattern 3: Authority Revocation
**What:** Permanently revoke mint/freeze/metadata authorities by setting to null
**When to use:** Optional user choice after token creation for immutability
**Example:**
```typescript
// Source: https://solana.com/docs/tokens/basics/set-authority
import { createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';
import { Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

// Revoke mint authority (no more tokens can be created)
const revokeMintIx = createSetAuthorityInstruction(
  mint.publicKey,
  currentAuthority.publicKey,
  AuthorityType.MintTokens,
  null, // Setting to null permanently revokes
  TOKEN_PROGRAM_ID
);

const transaction = new Transaction().add(revokeMintIx);
await sendAndConfirmTransaction(connection, transaction, [currentAuthority]);
```

### Pattern 4: Educational Output During Operations
**What:** Display progressive explanations during spinner operations
**When to use:** During long-running operations (metadata creation, IPFS upload)
**Example:**
```typescript
// Leveraging existing chalk/ora from Phase 1
import ora from 'ora';
import chalk from 'chalk';

const spinner = ora({
  text: chalk.blue('Uploading token logo to IPFS...')
}).start();

// Educational context while operation runs
console.log(chalk.dim('  → IPFS provides permanent, decentralized storage'));
console.log(chalk.dim('  → Your image will be accessible forever via content hash'));

const upload = await pinata.upload.public.file(file);

spinner.succeed(chalk.green('Logo uploaded to IPFS'));
console.log(chalk.dim(`  → CID: ${upload.cid}`));
console.log(chalk.dim(`  → URL: https://gateway.pinata.cloud/ipfs/${upload.cid}`));
```

### Pattern 5: Dry-Run Mode
**What:** Skip blockchain operations, validate inputs, show preview
**When to use:** User passes --dry-run flag for safety/learning
**Example:**
```typescript
// Check flag from command options
if (options.dryRun) {
  console.log(chalk.yellow('\n🔍 DRY RUN MODE - No transactions will be executed\n'));

  // Validate inputs without executing
  console.log(chalk.blue('Would upload to IPFS:'));
  console.log(`  - Logo: ${imagePath}`);
  console.log(`  - Metadata: ${JSON.stringify(metadata, null, 2)}`);

  console.log(chalk.blue('\nWould create metadata account:'));
  console.log(`  - Name: ${metadata.name}`);
  console.log(`  - Symbol: ${metadata.symbol}`);
  console.log(`  - URI: [IPFS URL after upload]`);

  console.log(chalk.dim('\n💡 Remove --dry-run to execute operations'));
  return;
}
```

### Pattern 6: Authority Status Dashboard
**What:** Display current authority status with clear security implications
**When to use:** After token creation, before authority revocation decisions
**Example:**
```typescript
// Fetch mint account to check authorities
const mintInfo = await getMint(connection, mintPublicKey);

console.log(chalk.bold('\n🔐 Token Authority Status\n'));

console.log(chalk.blue('Mint Authority:'),
  mintInfo.mintAuthority
    ? chalk.yellow('✓ Active') + chalk.dim(` (${mintInfo.mintAuthority.toBase58()})`)
    : chalk.green('✗ Revoked (supply is fixed)')
);

console.log(chalk.blue('Freeze Authority:'),
  mintInfo.freezeAuthority
    ? chalk.yellow('✓ Active') + chalk.dim(` (${mintInfo.freezeAuthority.toBase58()})`)
    : chalk.green('✗ Revoked (tokens cannot be frozen)')
);

// Metadata update authority requires checking metadata account
const metadataAccount = await fetchMetadata(umi, mintPublicKey);
console.log(chalk.blue('Metadata Update Authority:'),
  metadataAccount.isMutable
    ? chalk.yellow('✓ Active') + chalk.dim(' (name/symbol can change)')
    : chalk.green('✗ Revoked (name/symbol locked)')
);

console.log(chalk.dim('\n💡 Active authorities can be revoked for immutability'));
```

### Anti-Patterns to Avoid
- **Hardcoding IPFS gateway URLs:** Use configurable gateways (Pinata provides dedicated gateway on free tier)
- **Uploading metadata before image:** Upload image first, then metadata JSON with image URI (order matters)
- **Not checking free tier limits:** Pinata free tier is 1GB storage, 500 files - check before batch operations
- **Using deprecated @pinata/sdk:** Package unmaintained for 3 years, use `pinata` (v2.5.2+)
- **Forgetting sellerFeeBasisPoints:** Required field even for fungible tokens, set to 0 if not selling
- **Not warning about authority revocation:** Irreversible operation, must confirm user understands
- **Synchronous operations with ora spinners:** Blocks animation, use async operations only

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Metadata PDA derivation | Manual PDA calculation from mint | Umi's createV1 handles it | PDA seeds, bumps, program IDs - complex and error-prone |
| IPFS content addressing | Hash calculation, CID encoding | Pinata SDK returns CID | Content addressing is cryptographic, format-specific (CIDv0/v1) |
| Metadata JSON schema | Custom structure | Metaplex Token Standard schema | Wallets/explorers expect standard fields (name/symbol/description/image) |
| Authority type validation | String matching, custom enums | AuthorityType enum from @solana/spl-token | Program expects specific u8 values, enum provides type safety |
| RPC transaction confirmation | Manual polling with setTimeout | Umi's sendAndConfirm | Handles blockhash expiry, retry logic, commitment levels |
| IPFS gateway failover | Multiple fetch attempts | Pinata dedicated gateway | Free tier includes dedicated gateway, better reliability than public gateways |

**Key insight:** Metaplex ecosystem is mature and battle-tested. Token Metadata program is used by virtually all tokens/NFTs on Solana (pump.fun, all major launches). Don't rebuild what's standard - wallets/explorers won't recognize custom metadata structures.

## Common Pitfalls

### Pitfall 1: Mint Address Generation Mismatch
**What goes wrong:** Using `generateSigner(umi)` multiple times produces different keypairs, causing "account required by instruction is missing" errors
**Why it happens:** generateSigner creates new keypair on each call, not idempotent
**How to avoid:** Generate mint signer once, store in variable, reuse across createMint and createV1 calls
**Warning signs:** "Transaction simulation failed: Error processing Instruction 3: An account required by the instruction is missing"

### Pitfall 2: Metadata URI Points to Image Instead of JSON
**What goes wrong:** Setting URI to image URL directly causes wallets to fail loading metadata
**Why it happens:** Misunderstanding of two-tier storage: URI → JSON file → image field
**How to avoid:** Upload image first (get CID), create JSON with image field pointing to IPFS image, upload JSON (get CID), use JSON CID as metadata URI
**Warning signs:** Token shows in explorer but name/symbol/description missing, only image appears

### Pitfall 3: Free Tier IPFS Exhaustion
**What goes wrong:** Hitting Pinata free tier limit (1GB/500 files) during development testing
**Why it happens:** Each test run uploads new files, pins accumulate
**How to avoid:** Use devnet-specific Pinata account for testing, implement cleanup strategy, or use single upload and reuse URIs during development
**Warning signs:** 402 Payment Required errors from Pinata API, "over_free_limit" status

### Pitfall 4: Authority Revocation Without User Confirmation
**What goes wrong:** User accidentally revokes authority and can't fix token supply issues
**Why it happens:** Revocation is permanent and irreversible, must be intentional
**How to avoid:** Require explicit confirmation, display warning in red/bold, explain consequences, consider --force flag for scripted use
**Warning signs:** User reports "can't mint more tokens" after creation

### Pitfall 5: RPC Rate Limiting with Default Endpoint
**What goes wrong:** "429 Too Many Requests" errors during metadata creation
**Why it happens:** Default public RPC endpoints have strict rate limits (free Solana RPC ~1 req/sec)
**How to avoid:** Use dedicated RPC provider (QuickNode, Helius free tier), implement exponential backoff, or batch operations
**Warning signs:** Intermittent transaction failures, "429" errors in logs

### Pitfall 6: Dry-Run Mode Validates Pinata API Keys
**What goes wrong:** Dry-run mode fails when Pinata JWT missing, defeating preview purpose
**Why it happens:** Validating credentials requires API call, but dry-run shouldn't make external calls
**How to avoid:** Skip external validations in dry-run mode, display placeholder values, warn about unvalidated configs
**Warning signs:** Users can't preview without full setup (API keys, funded wallet)

### Pitfall 7: Educational Output Blocks User Experience
**What goes wrong:** Too much educational text causes information overload, slows down operation
**Why it happens:** Over-enthusiasm for teaching every detail
**How to avoid:** Progressive disclosure - show key info during operation (dim chalk), offer --verbose flag for deep explanations, link to docs
**Warning signs:** User feedback "too much text", operations feel slow despite being fast

### Pitfall 8: Metadata Update Authority Confusion
**What goes wrong:** Developers try to use setAuthority to revoke metadata update authority, but it's on Metadata Account not Mint Account
**Why it happens:** Conflating SPL Token authorities (mint/freeze) with Metaplex authorities (update)
**How to avoid:** Understand metadata update authority is controlled by `isMutable` field on Metadata Account, use Metaplex update instruction to set mutable=false
**Warning signs:** setAuthority succeeds but metadata still changeable, or errors about wrong account type

## Code Examples

Verified patterns from official sources:

### Complete Token Creation with Metadata Flow
```typescript
// Source: https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-create-a-fungible-spl-token-with-the-new-metaplex-token-standard
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createAndMint,
  mplTokenMetadata,
  TokenStandard
} from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount } from '@metaplex-foundation/umi';

// Initialize Umi client
const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata());

// Generate mint keypair (do this ONCE)
const mint = generateSigner(umi);

// Upload metadata to IPFS first (see IPFS example)
const metadataUri = "https://gateway.pinata.cloud/ipfs/QmXxx...";

// Create mint + metadata + initial supply in one transaction
await createAndMint(umi, {
  mint,
  authority: umi.identity,
  name: "Best Token Ever",
  symbol: "BTE",
  uri: metadataUri,
  sellerFeeBasisPoints: percentAmount(0), // 0% for non-NFT
  decimals: 8,
  amount: 1000000_00000000, // 1,000,000 tokens with 8 decimals
  tokenOwner: umi.identity.publicKey,
  tokenStandard: TokenStandard.Fungible,
}).sendAndConfirm(umi);
```

### Metadata JSON Structure for Fungible Tokens
```typescript
// Source: https://developers.metaplex.com/token-metadata/token-standard
// Upload this JSON structure to IPFS, use resulting URI in createV1
{
  "name": "Solana Gold",
  "symbol": "GOLDSOL",
  "description": "Educational token for learning Solana token creation",
  "image": "https://gateway.pinata.cloud/ipfs/Qm..."
}
```

### Authority Type Enum Values
```typescript
// Source: https://solana.com/docs/tokens/basics/set-authority
import { AuthorityType } from '@solana/spl-token';

// Available authority types for SPL Token:
AuthorityType.MintTokens      // Controls token creation
AuthorityType.FreezeAccount   // Controls account freezing
AuthorityType.AccountOwner    // Controls token account ownership
AuthorityType.CloseAccount    // Controls account closure

// Metadata update authority is separate (Metaplex, not SPL Token)
```

### Checking Authority Status
```typescript
// Source: https://spl.solana.com/token
import { getMint } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const mintPublicKey = new PublicKey('...');

const mintInfo = await getMint(connection, mintPublicKey);

console.log('Mint Authority:', mintInfo.mintAuthority?.toBase58() ?? 'Revoked');
console.log('Freeze Authority:', mintInfo.freezeAuthority?.toBase58() ?? 'Revoked');
console.log('Decimals:', mintInfo.decimals);
console.log('Supply:', mintInfo.supply);
```

### Educational Spinner Pattern
```typescript
// Combining existing Phase 1 patterns with progressive disclosure
import ora from 'ora';
import chalk from 'chalk';

async function educationalOperation(label: string, explanation: string, operation: () => Promise<any>) {
  const spinner = ora({
    text: chalk.blue(label)
  }).start();

  if (explanation) {
    console.log(chalk.dim(`  → ${explanation}`));
  }

  try {
    const result = await operation();
    spinner.succeed(chalk.green(`${label} ✓`));
    return result;
  } catch (error) {
    spinner.fail(chalk.red(`${label} ✗`));
    throw error;
  }
}

// Usage:
await educationalOperation(
  'Uploading token logo to IPFS',
  'IPFS provides permanent, decentralized storage via content addressing',
  () => pinata.upload.public.file(logoFile)
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @metaplex-foundation/js | @metaplex-foundation/umi + mpl-token-metadata | 2023 | Umi is simpler, more modular, better TypeScript |
| @pinata/sdk (deprecated) | pinata SDK | 2023 | Old SDK unmaintained 3 years, new SDK active |
| Manual metadata account creation | createV1 helper | 2023 | Helper handles PDA derivation, reduces errors |
| CreateMetadataAccountV3 instruction | CreateV1 instruction | 2023 | V3 functions removed from exports |
| Arweave for storage | IPFS via Pinata | Ongoing | IPFS free tier vs Arweave upfront cost |
| Token-2022 metadata extension | Metaplex Token Metadata | Ongoing | Metaplex has universal wallet support |

**Deprecated/outdated:**
- @pinata/sdk: Unmaintained for 3 years, use `pinata` package instead
- CreateMetadataAccountV3Instruction: Removed from mpl-token-metadata exports, use createV1
- @metaplex-foundation/js: Legacy SDK, replaced by Umi framework
- generateSigner() per operation: Anti-pattern, generates new keypair each time

## Open Questions

Things that couldn't be fully resolved:

1. **Metadata Update Authority Revocation API**
   - What we know: Metadata accounts have `isMutable` field controlled by Metaplex program, not SPL Token setAuthority
   - What's unclear: Exact Umi/mpl-token-metadata API for setting isMutable=false (documentation shows structure but not update function)
   - Recommendation: Test with Metaplex update instructions or defer to Phase 3 if time-constrained (optional feature)

2. **Pinata Gateway Custom Domain on Free Tier**
   - What we know: Pinata provides dedicated gateway, free tier mentioned, examples show "gateway.pinata.cloud"
   - What's unclear: Whether free tier gets custom subdomain or uses public gateway, setup process
   - Recommendation: Use public IPFS gateway (ipfs.io) as fallback, upgrade to paid if custom gateway needed

3. **Educational Output Verbosity Level**
   - What we know: Best practices suggest progressive disclosure, avoid overload, some tools use --verbose
   - What's unclear: Optimal default level for learning tool (detailed vs minimal), whether to implement --verbose flag
   - Recommendation: Start with moderate detail (1-2 lines per operation), add --verbose flag if user feedback requests it

4. **Dry-Run Cost Estimation Accuracy**
   - What we know: Phase 1 has cost estimation pattern, dry-run should preview operations
   - What's unclear: Whether to estimate IPFS costs (free tier = $0 but future paid?), how accurate to make blockchain cost estimates without simulation
   - Recommendation: Show blockchain costs (can estimate from instruction count), mention IPFS free tier, note estimates are approximate

## Sources

### Primary (HIGH confidence)
- [Metaplex Token Metadata Developers](https://developers.metaplex.com/token-metadata) - Official documentation, API references
- [Metaplex Token Standard](https://developers.metaplex.com/token-metadata/token-standard) - JSON schema for fungible tokens
- [How to Add Metadata to SPL Tokens](https://developers.metaplex.com/guides/javascript/how-to-add-metadata-to-spl-tokens) - Official JavaScript guide
- [Pinata Documentation](https://docs.pinata.cloud/) - Official SDK docs, authentication, file uploading
- [Pinata Upload Files](https://docs.pinata.cloud/files/uploading-files) - File upload implementation
- [Solana Set Authority](https://solana.com/docs/tokens/basics/set-authority) - Official authority revocation guide
- [SPL Token Documentation](https://www.solana-program.com/docs/token) - Token program reference
- [@metaplex-foundation/umi-bundle-defaults npm](https://www.npmjs.com/package/@metaplex-foundation/umi-bundle-defaults) - v1.4.1
- [@metaplex-foundation/mpl-token-metadata npm](https://www.npmjs.com/package/@metaplex-foundation/mpl-token-metadata) - v3.4.0
- [pinata npm](https://www.npmjs.com/package/pinata) - v2.5.2 (current official SDK)

### Secondary (MEDIUM confidence)
- [QuickNode Metaplex Guide](https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-create-a-fungible-spl-token-with-the-new-metaplex-token-standard) - Complete working example
- [Helius Authority Documentation](https://www.helius.dev/docs/orb/explore-authorities) - Authority types and security implications
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - Educational output, user experience patterns
- [Pinata Pricing](https://pinata.cloud/pricing) - Free tier limits verified
- [Pinata Limits Documentation](https://docs.pinata.cloud/account-management/limits) - Rate limits, file size constraints

### Tertiary (LOW confidence)
- [RareSkills Metaplex Metadata Guide](https://rareskills.io/post/metaplex-token-metadata) - Educational resource, technical depth
- [Medium: Creating Fungible SPL Tokens](https://medium.com/@snsmoshood/creating-fungible-spl-tokens-with-metadata-using-metaplex-483a2a91f864) - Community tutorial
- [Solana Cookbook Token Reference](https://solanacookbook.com/references/token.html) - Community-maintained examples
- Various WebSearch results for CLI patterns, verbose mode, dry-run implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries officially documented, versions current, npm packages active
- Architecture: HIGH - Patterns from official Metaplex/Solana docs, verified with multiple sources
- Pitfalls: MEDIUM - Mix of official warnings (authority revocation) and inferred from GitHub issues
- Educational UX: MEDIUM - Best practices from CLI guides, not Solana-specific but applicable
- Dry-run patterns: MEDIUM - General CLI pattern, not domain-specific standard

**Research date:** 2026-02-05
**Valid until:** ~30 days (Metaplex/SPL stable ecosystem, but check for security updates)

**Notes:**
- Metaplex ecosystem is mature and production-ready, used by virtually all Solana tokens/NFTs
- Free tier IPFS via Pinata is viable for learning/class project (1GB = thousands of token logos)
- Educational output design has room for creativity - no strict standard, use judgment
- Authority revocation is sensitive - must emphasize irreversibility in UX
- Dry-run mode is straightforward flag-based pattern, can reuse Phase 1 patterns
