# Phase 1: Security Foundation - Research

**Researched:** 2026-02-05
**Domain:** Solana SPL token creation with TypeScript/Node.js CLI
**Confidence:** HIGH

## Summary

SPL token creation on Solana uses the official `@solana/spl-token` library alongside `@solana/web3.js` for transaction management. The standard pattern involves creating a mint account, then immediately revoking mint and freeze authorities by passing `null` to the `setAuthority` function. This permanently disables minting and freezing, preventing rug pulls and honeypot attacks.

Modern CLI applications use Commander or Yargs for argument parsing, Inquirer for interactive prompts, Ora for progress indicators, and Chalk for styled output. Transaction cost estimation requires calculating rent exemption (based on account size) plus base transaction fees (5000 lamports per signature).

The critical security pattern is: create mint → revoke mint authority → revoke freeze authority, all in a single flow with clear user feedback at each step.

**Primary recommendation:** Use `@solana/spl-token` v0.4.x with `@solana/web3.js` v1.x (not v2.x unless ready for breaking changes), implement authority revocation immediately after mint creation, and provide transparent transaction feedback including Explorer links for user verification.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @solana/spl-token | 0.4.x | SPL token operations (mint, transfer, authority) | Official Solana Labs library, authoritative implementation |
| @solana/web3.js | 1.x | Connection, transactions, keypairs, RPC interaction | Official Solana Foundation library, ecosystem standard |
| bs58 | 5.x | Base58 encoding/decoding for keypairs | Standard for Solana key serialization |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| commander | 12.x | CLI argument parsing, subcommands | Hybrid flag/prompt approach, Git-style subcommands |
| inquirer | 10.x | Interactive prompts with validation | Collecting token parameters (name, symbol, decimals, supply) |
| ora | 8.x | Progress spinners | Transaction confirmation waiting, cost estimation loading |
| chalk | 5.x | Terminal output styling | Error messages, success confirmations, status indicators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @solana/web3.js v1 | @solana/web3.js v2 (Solana Kit) | v2 is tree-shakable and lighter, but Anchor doesn't support it yet; use v1 for stability |
| commander | yargs | Yargs has more built-in validation and middleware; Commander is simpler for straightforward CLIs |
| inquirer | prompts | Prompts is lighter (6KB vs 140KB), but Inquirer has richer validation and more prompt types |

**Installation:**
```bash
npm install @solana/spl-token @solana/web3.js bs58
npm install commander inquirer ora chalk
npm install --save-dev @types/node typescript ts-node
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── commands/          # CLI command handlers
│   └── create.ts      # Token creation command
├── lib/               # Core business logic
│   ├── token.ts       # SPL token operations
│   ├── wallet.ts      # Wallet/keypair management
│   └── validation.ts  # Input validation
├── utils/             # Helper utilities
│   ├── prompts.ts     # Inquirer prompt definitions
│   ├── display.ts     # Output formatting (chalk, ora)
│   └── constants.ts   # Network endpoints, defaults
└── index.ts           # CLI entry point (commander setup)
```

### Pattern 1: Token Creation with Authority Revocation
**What:** Create mint, then immediately revoke mint and freeze authorities in sequence
**When to use:** Every token creation (this is the anti-rug pattern)
**Example:**
```typescript
// Source: https://solanacookbook.com/references/token.html
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { createMint, setAuthority, AuthorityType } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const payer = Keypair.generate(); // In production: load from filesystem
const mintAuthority = Keypair.generate();

// Step 1: Create mint
const mint = await createMint(
  connection,
  payer,              // Fee payer
  mintAuthority.publicKey,  // Mint authority
  mintAuthority.publicKey,  // Freeze authority
  9                   // Decimals
);

// Step 2: Revoke mint authority (pass null to permanently disable)
await setAuthority(
  connection,
  payer,              // Fee payer
  mint,               // Mint address
  mintAuthority,      // Current authority
  AuthorityType.MintTokens,
  null                // New authority = null (revoke)
);

// Step 3: Revoke freeze authority
await setAuthority(
  connection,
  payer,
  mint,
  mintAuthority,
  AuthorityType.FreezeAccount,
  null                // Permanently disable freezing
);
```

### Pattern 2: Cost Estimation Before Execution
**What:** Calculate rent exemption + transaction fees before submitting transaction
**When to use:** Always show cost estimate before user confirmation
**Example:**
```typescript
// Source: https://solana.com/developers/cookbook/transactions/calculate-cost
import { Connection, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { MINT_SIZE, getMinimumBalanceForRentExemption } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Calculate rent for mint account (82 bytes)
const rentExemption = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

// Calculate transaction fees (5000 lamports per signature)
const signatures = 3; // Create mint + 2 authority revocations
const baseFee = 5000 * signatures;

// Total cost in lamports
const totalLamports = rentExemption + baseFee;

// Convert to SOL for display
const totalSOL = totalLamports / 1_000_000_000;

console.log(`Estimated cost: ${totalSOL.toFixed(9)} SOL`);
console.log(`  - Rent exemption: ${(rentExemption / 1_000_000_000).toFixed(9)} SOL`);
console.log(`  - Transaction fees: ${(baseFee / 1_000_000_000).toFixed(9)} SOL`);
```

### Pattern 3: Interactive Prompts with Validation
**What:** Use Inquirer to collect and validate token parameters before execution
**When to use:** When CLI flags are not provided (hybrid approach)
**Example:**
```typescript
// Source: https://www.digitalocean.com/community/tutorials/nodejs-interactive-command-line-prompts
import inquirer from 'inquirer';

const questions = [
  {
    type: 'input',
    name: 'name',
    message: 'Token name (1-32 characters):',
    validate: (input: string) => {
      if (input.length < 1 || input.length > 32) {
        return 'Name must be between 1 and 32 characters';
      }
      return true;
    }
  },
  {
    type: 'input',
    name: 'symbol',
    message: 'Token symbol (1-10 characters):',
    validate: (input: string) => {
      if (input.length < 1 || input.length > 10) {
        return 'Symbol must be between 1 and 10 characters';
      }
      return true;
    }
  },
  {
    type: 'number',
    name: 'decimals',
    message: 'Decimals (0-9):',
    default: 9,
    validate: (input: number) => {
      if (!Number.isInteger(input) || input < 0 || input > 9) {
        return 'Decimals must be an integer between 0 and 9';
      }
      return true;
    }
  },
  {
    type: 'input',
    name: 'supply',
    message: 'Initial supply:',
    validate: (input: string) => {
      const num = parseFloat(input);
      if (isNaN(num) || num <= 0) {
        return 'Supply must be a positive number';
      }
      return true;
    }
  }
];

const answers = await inquirer.prompt(questions);
```

### Pattern 4: Progress Indication with Ora
**What:** Display spinners during async operations (transaction confirmation)
**When to use:** Any operation taking >1 second (RPC calls, transaction confirmation)
**Example:**
```typescript
// Source: https://github.com/sindresorhus/ora
import ora from 'ora';
import chalk from 'chalk';

const spinner = ora('Creating mint account...').start();

try {
  const mint = await createMint(connection, payer, authority.publicKey, authority.publicKey, 9);
  spinner.succeed(chalk.green(`Mint created: ${mint.toBase58()}`));

  spinner.start('Revoking mint authority...');
  await setAuthority(connection, payer, mint, authority, AuthorityType.MintTokens, null);
  spinner.succeed(chalk.green('Mint authority revoked'));

  spinner.start('Revoking freeze authority...');
  await setAuthority(connection, payer, mint, authority, AuthorityType.FreezeAccount, null);
  spinner.succeed(chalk.green('Freeze authority revoked'));
} catch (error) {
  spinner.fail(chalk.red('Transaction failed'));
  throw error;
}
```

### Anti-Patterns to Avoid
- **Creating mint without immediate authority revocation:** Always revoke authorities in the same session; don't defer to "later"
- **Not showing cost estimation:** Users need to see costs before confirming, especially on mainnet
- **Using web3.js v2 with Anchor projects:** Anchor doesn't support web3.js v2 yet; stick with v1.x
- **Hard-coding RPC endpoints:** Use environment variables or CLI flags for cluster selection
- **Not handling transaction confirmation timeout:** Transactions can timeout; implement retry logic with exponential backoff

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Argument parsing | Custom flag parser | Commander or Yargs | Handles --help, subcommands, type coercion, validation edge cases |
| Input validation | Regex + if statements | Inquirer's built-in validate | Handles async validation, error display, re-prompting automatically |
| Progress indicators | console.log loops | Ora spinners | Handles terminal cursor management, ANSI codes, cleanup on exit |
| Keypair management | Custom file I/O | Solana wallet conventions | Standard paths (~/.config/solana/id.json), proper permissions, cross-tool compatibility |
| Transaction retry logic | Manual setTimeout | Exponential backoff library | Handles jitter, max retries, timeout escalation correctly |
| RPC rate limiting | Manual request counting | RPC provider SDK | Handles burst limits, fallback endpoints, automatic retry |

**Key insight:** Solana's account model and transaction confirmation are complex. Use proven libraries for wallet management, transaction building, and RPC interaction. Custom implementations miss edge cases like rent exemption updates, signature verification timing, and blockhash expiration.

## Common Pitfalls

### Pitfall 1: Authority Not Actually Revoked
**What goes wrong:** Transaction completes but authority is still set (user error or silent failure)
**Why it happens:** Not verifying the `setAuthority` result; passing wrong parameters (e.g., setting to another key instead of `null`)
**How to avoid:** After revocation, fetch the mint account and verify `mintAuthority` and `freezeAuthority` are both `null`
**Warning signs:**
```typescript
// BAD: Passing undefined instead of null
await setAuthority(connection, payer, mint, authority, AuthorityType.MintTokens, undefined);

// GOOD: Explicitly pass null
await setAuthority(connection, payer, mint, authority, AuthorityType.MintTokens, null);

// VERIFY: Check authority was actually revoked
import { getMint } from "@solana/spl-token";
const mintInfo = await getMint(connection, mint);
if (mintInfo.mintAuthority !== null) {
  throw new Error("Mint authority revocation failed");
}
```

### Pitfall 2: Insufficient SOL for Rent + Fees
**What goes wrong:** Transaction fails with "insufficient funds" despite user having some SOL
**Why it happens:** User has SOL but not enough for rent exemption (0.00144 SOL) + fees (0.000015 SOL) + existing account rent requirements
**How to avoid:** Check balance upfront with clear error message showing required vs available
**Warning signs:**
```typescript
// Check balance before transaction
const balance = await connection.getBalance(payer.publicKey);
const required = rentExemption + (5000 * signatures);

if (balance < required) {
  throw new Error(
    `Insufficient SOL. Required: ${(required / 1e9).toFixed(9)} SOL, Available: ${(balance / 1e9).toFixed(9)} SOL\n` +
    `Get devnet SOL: solana airdrop 1`
  );
}
```

### Pitfall 3: Using Stale Blockhash
**What goes wrong:** Transaction rejected with "blockhash not found" or silently fails
**Why it happens:** Blockhashes expire after ~60 seconds; not refreshing before transaction submission
**How to avoid:** Get fresh blockhash immediately before transaction, don't cache it
**Warning signs:**
```typescript
// BAD: Reusing old blockhash
const blockhash = await connection.getLatestBlockhash();
// ... do other work for 2 minutes ...
const tx = new Transaction({ blockhash: blockhash.blockhash }); // STALE!

// GOOD: Fresh blockhash per transaction
const tx = new Transaction();
const { blockhash } = await connection.getLatestBlockhash();
tx.recentBlockhash = blockhash;
```

### Pitfall 4: Not Handling Devnet Resets
**What goes wrong:** CLI works one day, fails the next with "account not found" errors
**Why it happens:** Devnet ledger resets periodically, wiping all accounts including user wallets
**How to avoid:** Document devnet volatility; provide clear error messages pointing to faucet for re-funding
**Warning signs:** Sudden "account not found" errors for previously working wallets on devnet

### Pitfall 5: Confusing Token Account with Mint Account
**What goes wrong:** Trying to revoke authority on a token account instead of mint account
**Why it happens:** SPL tokens have two account types: mint (global token metadata) and token account (per-user balance)
**How to avoid:** Authority revocation operates on the MINT account only; use correct account type
**Warning signs:**
```typescript
// WRONG: Token account (holds balance for one user)
const tokenAccount = await createAccount(connection, payer, mint, owner);
await setAuthority(connection, payer, tokenAccount, ...); // This changes OWNER, not mint/freeze authority

// RIGHT: Mint account (global token definition)
await setAuthority(connection, payer, mint, authority, AuthorityType.MintTokens, null);
```

### Pitfall 6: Public RPC Rate Limiting in Production
**What goes wrong:** CLI works in testing, hits rate limits (40 requests/10 seconds) in production
**Why it happens:** Relying on public Devnet/Mainnet RPC endpoints which have strict rate limits
**How to avoid:** Use dedicated RPC provider (QuickNode, Alchemy, Helius) for production; document rate limits clearly
**Warning signs:** Intermittent "429 Too Many Requests" errors

## Code Examples

Verified patterns from official sources:

### Creating Mint with Authorities
```typescript
// Source: https://solanacookbook.com/references/token.html
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const payer = Keypair.generate();
const mintAuthority = Keypair.generate();
const freezeAuthority = Keypair.generate();

const mint = await createMint(
  connection,
  payer,                      // Transaction fee payer
  mintAuthority.publicKey,    // Who can mint tokens
  freezeAuthority.publicKey,  // Who can freeze token accounts (or null)
  9                           // Decimals (0-9)
);

console.log(`Mint: ${mint.toBase58()}`);
```

### Revoking All Authorities
```typescript
// Source: https://solanacookbook.com/references/token.html
import { setAuthority, AuthorityType } from "@solana/spl-token";

// Revoke mint authority (fixed supply)
await setAuthority(
  connection,
  payer,
  mint,
  currentMintAuthority,
  AuthorityType.MintTokens,
  null  // Setting to null permanently revokes
);

// Revoke freeze authority (prevent honeypot)
await setAuthority(
  connection,
  payer,
  mint,
  currentFreezeAuthority,
  AuthorityType.FreezeAccount,
  null
);
```

### Verifying Authority Status
```typescript
// Source: https://solana-labs.github.io/solana-program-library/token/js/
import { getMint } from "@solana/spl-token";

const mintInfo = await getMint(connection, mint);

console.log(`Mint Authority: ${mintInfo.mintAuthority?.toBase58() ?? 'REVOKED'}`);
console.log(`Freeze Authority: ${mintInfo.freezeAuthority?.toBase58() ?? 'REVOKED'}`);
console.log(`Supply: ${mintInfo.supply}`);
console.log(`Decimals: ${mintInfo.decimals}`);
```

### Cost Estimation
```typescript
// Source: https://solana.com/docs/core/fees
import { MINT_SIZE } from "@solana/spl-token";

// Mint account size is 82 bytes
const rentExemptionLamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

// Base fee: 5000 lamports per signature
const createMintFee = 5000; // 1 signature
const revokeAuthorityFee = 5000 * 2; // 2 signatures (mint + freeze)

const totalCost = rentExemptionLamports + createMintFee + revokeAuthorityFee;
console.log(`Total: ${(totalCost / 1e9).toFixed(9)} SOL`);
```

### Solana Explorer Link Generation
```typescript
// Generate Explorer link for verification
function getExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta'): string {
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
}

console.log(`View transaction: ${getExplorerUrl(signature, 'devnet')}`);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SPL Token (original) | Token-2022 with extensions | 2023 | Token-2022 supports metadata on-chain, transfer fees, and other extensions; original SPL Token still standard for simple tokens |
| Off-chain metadata (Metaplex) | MetadataPointer extension | 2023 | Token-2022 can store metadata in mint account itself via MetadataPointer; reduces external dependencies |
| web3.js v1.x | web3.js v2.x (Solana Kit) | 2024 | v2 is tree-shakable, zero dependencies, smaller bundles; not yet compatible with Anchor |
| inquirer v8 (CommonJS) | inquirer v10 (ESM) | 2024 | Modern API with @inquirer/prompts, better TypeScript support, ESM-first |

**Deprecated/outdated:**
- **spl-token-cli for programmatic use**: CLI tool is for manual testing; use `@solana/spl-token` library for automation
- **Hard-coded commitment levels**: Always specify commitment level explicitly (`confirmed` for devnet, `finalized` for mainnet verification)
- **Ignoring Token-2022**: For new tokens needing metadata or extensions, evaluate Token-2022; original SPL Token remains valid for simple fungible tokens

## Open Questions

Things that couldn't be fully resolved:

1. **Token-2022 vs Original SPL Token Decision**
   - What we know: Token-2022 supports extensions (metadata, transfer fees, etc.), backward compatible
   - What's unclear: Whether Phase 1 should use original SPL Token (simpler) or Token-2022 (future-proof but more complex)
   - Recommendation: Start with original SPL Token for simplicity; Phase 1 requirements don't need extensions. Document migration path for Phase 2/3 if metadata needed.

2. **Optimal RPC Provider for Devnet Testing**
   - What we know: Public devnet RPC has 40 req/10s limit; private RPCs cost money
   - What's unclear: Whether Phase 1 CLI will hit rate limits during normal use (likely not, but depends on usage)
   - Recommendation: Use public devnet RPC initially; add environment variable for custom RPC endpoint. Document rate limits in error messages.

3. **Transaction Confirmation Timeout Strategy**
   - What we know: Transactions can timeout after 60 seconds; need retry logic
   - What's unclear: Best practice for retry count and backoff strategy on devnet
   - Recommendation: Implement 3 retries with exponential backoff (1s, 2s, 4s). Document that devnet can be slow/unstable.

## Sources

### Primary (HIGH confidence)
- [Solana Cookbook - Token Reference](https://solanacookbook.com/references/token.html) - Official code examples for createMint, setAuthority
- [Solana Developer Docs - Transaction Cost Calculation](https://solana.com/developers/cookbook/transactions/calculate-cost) - Fee calculation patterns
- [@solana/spl-token Documentation](https://solana-labs.github.io/solana-program-library/token/js/index.html) - Official API reference
- [SPL Token Program Docs](https://www.solana-program.com/docs/token) - Authority management, security patterns
- [Solana Core Fees Documentation](https://solana.com/docs/core/fees) - Transaction fee structure

### Secondary (MEDIUM confidence)
- [Sec3 - Understanding SPL Token Mint](https://www.sec3.dev/blog/solana-programs-part-1-understanding-spl-token-mint) - Security analysis, mint authority risks
- [QuickNode - Rent Calculation Guide](https://www.quicknode.com/guides/solana-development/getting-started/understanding-rent-on-solana) - Rent exemption mechanics
- [NPM Compare - Commander vs Yargs](https://npm-compare.com/commander,yargs) - CLI framework comparison
- [DigitalOcean - Inquirer.js Tutorial](https://www.digitalocean.com/community/tutorials/nodejs-interactive-command-line-prompts) - Interactive prompt patterns
- [Ora GitHub Repository](https://github.com/sindresorhus/ora) - Progress indicator usage

### Tertiary (LOW confidence)
- Medium articles on SPL token creation - Community tutorials, not authoritative but useful for real-world patterns
- Stack Overflow discussions on authority management - Anecdotal evidence of common mistakes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official libraries verified via npm, documentation current
- Architecture: HIGH - Patterns from Solana Cookbook (official source), verified with working examples
- Pitfalls: MEDIUM-HIGH - Authority revocation verified in docs; other pitfalls from community sources and error documentation

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - Solana ecosystem is stable, core libraries don't change rapidly)
