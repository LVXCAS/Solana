# Memecoin Factory

A security-first CLI tool for creating SPL tokens on Solana with automatic anti-rug protections

**Security-First** • **Metaplex Metadata** • **IPFS Storage** • **Educational UX** • **Token Burning**

---

## Quick Start

Get from zero to your first token in under 10 minutes.

### Prerequisites

- Node.js 18+
- Solana CLI installed ([installation guide](https://docs.solana.com/cli/install-solana-cli-tools))
- Funded devnet wallet

### Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd memecoin-factory
npm install

# 2. Generate keypair (if you don't have one)
solana-keygen new

# 3. Get devnet SOL
solana airdrop 1 --url devnet

# 4. Create your first token
npm run dev -- create
```

You'll see interactive prompts guiding you through token creation. The tool explains each step as it runs - you'll learn Solana while you build.

---

## What This Project Does

Most token creation tutorials skip the security fundamentals. They show you how to create a token, but ignore the attack vectors that enable rug pulls, honeypots, and identity theft. The result? Tokens that technically work but put users at risk.

**Memecoin Factory takes the opposite approach:** security is automatic, not optional. Every token created has its mint and freeze authorities permanently revoked by default. Optional metadata locking prevents name hijacking. The result is a tool that produces genuinely safe tokens while teaching you why these protections matter.

This was built as a learning project to understand Solana development end-to-end - from account models and transaction construction to IPFS integration and Metaplex metadata. The educational UX explains concepts as operations run, turning the tool itself into a learning experience.

---

## Features

### Security-First Token Creation
- **Mint authority revoked**: Supply is permanently fixed - no inflation rug pulls
- **Freeze authority revoked**: Accounts can't be frozen - no honeypot attacks
- **Optional metadata lock**: Name/symbol become immutable - no identity theft
- All protections applied atomically during creation

### Professional Metadata
- **Metaplex standard**: Industry-standard on-chain metadata
- **IPFS storage**: Permanent, decentralized logo hosting via Pinata
- **Wallet integration**: Token appears with name, symbol, and logo in all Solana wallets
- **Graceful degradation**: Metadata failures don't break token creation

### Token Burning
- **Supply reduction**: Permanently burn tokens for deflationary mechanics
- **Safety confirmations**: Three-level verification prevents accidental burns
- **On-chain verification**: Proves supply decreased after burn completes

### Educational UX
- **Inline explanations**: Learn Solana concepts while operations execute
- **Context-specific errors**: Every error suggests the exact fix
- **Cost transparency**: Shows exact SOL costs before confirmation
- **Authority dashboard**: Visual status of all token authorities

### Developer Experience
- **Dry-run mode**: Preview all operations without spending SOL
- **Hybrid interface**: Full flag support or interactive prompts
- **TypeScript**: Full type safety and autocomplete
- **ESM-native**: Modern module system throughout

---

## Usage Examples

### Interactive Token Creation

```bash
npm run dev -- create
```

Prompts guide you through:
- Token name (1-32 characters)
- Symbol (1-10 characters)
- Decimals (0-9, default 9)
- Initial supply
- Optional description and logo

Expected output:
```
✔ Token created successfully!
  Mint: 7x9F...k2Jw
  Supply: 1,000,000 tokens

✔ Metadata uploaded to IPFS
  Logo: ipfs://QmX...

Authority Status:
  Mint Authority:     REVOKED ✓
  Freeze Authority:   REVOKED ✓
  Metadata Authority: Active (yours)

View on Solana Explorer:
  https://explorer.solana.com/address/7x9F...k2Jw?cluster=devnet
```

### Flag-Based Creation

```bash
# Minimal token (no metadata)
npm run dev -- create \
  --name "My Token" \
  --symbol "MYT" \
  --decimals 9 \
  --supply 1000000

# Full token with metadata
npm run dev -- create \
  --name "Moon Coin" \
  --symbol "MOON" \
  --decimals 9 \
  --supply 1000000000 \
  --description "To the moon!" \
  --image ./logo.png \
  --lock-metadata
```

### Dry-Run Mode

Preview operations without executing:

```bash
npm run dev -- create --dry-run
```

Output shows:
```
DRY RUN MODE - No transactions will be executed

Operations that would be performed:
  1. Load keypair from: ~/.config/solana/id.json
  2. Upload logo to IPFS: ./logo.png
  3. Create metadata JSON
  4. Upload metadata JSON to IPFS
  5. Create SPL token mint
  6. Mint initial supply: 1000000
  7. Create Metaplex metadata account
  8. Revoke mint authority
  9. Revoke freeze authority
  10. Revoke metadata update authority

Estimated cost: 0.002 SOL
```

### Token Burning

```bash
npm run dev -- burn \
  --mint 7x9F...k2Jw \
  --amount 1000
```

Three-level confirmation:
1. Warning display with supply impact calculation
2. Type "BURN" to confirm (prevents misclicks)
3. Final yes/no confirmation

Expected output:
```
Burn Preview:
  Current balance:        1,000,000
  Amount to burn:         1,000
  Remaining after burn:   999,000
  Current total supply:   1000000000000000

⚠️  BURN TOKENS - PERMANENT ACTION

✔ Tokens burned successfully
  Amount: 1,000 tokens
  Supply before: 1,000,000,000,000,000
  Supply after:  999,999,000,000,000
  Supply reduced by: 0.10%
```

---

## Security Approach

Memecoin Factory implements three layers of protection against common token attacks.

### Layer 1: Mint Authority Revocation

**Attack prevented:** Infinite supply rug pull

When mint authority remains active, the controller can create unlimited new tokens at any time. This dilutes existing holders and enables classic rug pulls where the creator mints billions of tokens and dumps them.

**Protection:** Mint authority is permanently revoked immediately after initial supply is created. Supply becomes fixed forever - mathematically impossible to increase.

### Layer 2: Freeze Authority Revocation

**Attack prevented:** Honeypot attacks

Freeze authority allows locking token accounts, preventing transfers or sales. Attackers use this to create "honeypots" - tokens that appear tradeable but can't be sold once you buy them.

**Protection:** Freeze authority is permanently revoked during creation. All token accounts remain permanently transferrable.

### Layer 3: Metadata Authority Lock (Optional)

**Attack prevented:** Identity theft

Active metadata authority allows changing the token's name, symbol, and logo after launch. Attackers use this to impersonate established tokens or perform bait-and-switch scams.

**Protection:** Optional metadata locking makes name/symbol permanently immutable. **This is IRREVERSIBLE** - choose carefully based on whether you need update flexibility.

For a deeper dive into the security architecture, see [docs/CODE_WALKTHROUGH.md](docs/CODE_WALKTHROUGH.md).

---

## Architecture Overview

```
src/
├── commands/         # CLI command handlers
│   ├── create.ts    # Token creation command
│   └── burn.ts      # Token burn command
├── lib/             # Core business logic
│   ├── token.ts     # Token creation, authority verification
│   ├── burn.ts      # Token burning with validation
│   └── wallet.ts    # Keypair loading, balance checks
├── services/        # External service integrations
│   ├── metadata.ts  # Metaplex metadata creation
│   ├── ipfs.ts      # IPFS uploads via Pinata
│   └── authority.ts # Authority status checks
└── utils/           # Shared utilities
    ├── display.ts   # Output formatting, error handling
    ├── prompts.ts   # Interactive input collection
    ├── validation.ts # Input validation rules
    ├── educational.ts # Educational spinner pattern
    └── constants.ts # Network URLs, configs
```

**Design philosophy:** Commands handle CLI interface and user flow. Core logic lives in `lib/` with zero dependencies on CLI frameworks. Services abstract external integrations. Utilities provide shared infrastructure.

For a detailed walkthrough of how each layer works and why, see [docs/CODE_WALKTHROUGH.md](docs/CODE_WALKTHROUGH.md).

---

## Configuration

### Environment Variables

```bash
# Required for metadata/IPFS operations
export PINATA_JWT="your-pinata-jwt-here"

# Get your JWT from: https://app.pinata.cloud
# Account → API Keys → New Key → Full Access
```

### Keypair Location

Default: `~/.config/solana/id.json`

Override with `--keypair` flag:
```bash
npm run dev -- create --keypair ~/my-wallet.json
```

### Network Selection

Default: `devnet`

Switch to mainnet:
```bash
npm run dev -- create --cluster mainnet-beta
```

**⚠️ Mainnet costs real SOL.** Test thoroughly on devnet first.

---

## Troubleshooting

### "Insufficient funds" error

**Cause:** Not enough SOL for rent + transaction fees

**Fix:**
```bash
# Check balance
solana balance --url devnet

# Request airdrop (devnet only)
solana airdrop 1 --url devnet

# Mainnet: transfer SOL from exchange or another wallet
```

### "Keypair file not found"

**Cause:** No wallet at default location

**Fix:**
```bash
# Generate new keypair
solana-keygen new

# Or specify existing keypair location
npm run dev -- create --keypair /path/to/keypair.json
```

### "Transaction timeout" or "Blockhash not found"

**Cause:** RPC endpoint overloaded or slow

**Fix:**
- Wait 30 seconds and retry
- Check Solana status: https://status.solana.com
- Consider dedicated RPC (QuickNode, Helius) for production
- Switch clusters: `--cluster mainnet-beta` if devnet is slow

### "PINATA_JWT environment variable not set"

**Cause:** IPFS operations require Pinata authentication

**Fix:**
1. Sign up at https://pinata.cloud (free tier available)
2. Navigate to Account → API Keys
3. Create new key with full access
4. Copy JWT token
5. Export: `export PINATA_JWT="your-jwt-here"`
6. Add to `~/.bashrc` or `~/.zshrc` for persistence

### "Invalid mint address"

**Cause:** Mint address format is incorrect

**Fix:**
- Verify address is base58 encoded (44 characters)
- Check for typos (0 vs O, 1 vs l)
- Confirm address exists on selected cluster
- View in explorer: `https://explorer.solana.com/address/<MINT>?cluster=devnet`

---

## Learning Outcomes

Building and using this tool teaches:

- **Solana account model**: Why accounts need rent deposits, how PDAs work, what ATAs are
- **SPL Token mechanics**: Mint accounts, token accounts, authorities, burning
- **Metaplex metadata**: Token standards, on-chain accounts, URI references
- **IPFS content addressing**: Permanent storage, content IDs, gateways
- **Transaction cost model**: Rent exemption, signature fees, prioritization
- **Authority-based security**: Permission systems, permanent revocation, attack vectors
- **TypeScript + ESM**: Modern module systems, type safety, async patterns
- **CLI design**: Flag parsing, interactive prompts, progress indication

For the full learning journey through the codebase, see [docs/CODE_WALKTHROUGH.md](docs/CODE_WALKTHROUGH.md).

---

## Technology Stack

| Library | Purpose | Why Chosen |
|---------|---------|------------|
| `@solana/web3.js` | Core Solana RPC interaction | Ecosystem standard, Anchor compatible |
| `@solana/spl-token` | SPL Token operations | Official token program library |
| `@metaplex-foundation/umi` | Metaplex framework | Required for Token Metadata program |
| `@metaplex-foundation/mpl-token-metadata` | Token metadata standard | Industry standard for token info |
| `pinata` | IPFS uploads | Free tier, modern API, maintained |
| `commander` | CLI argument parsing | Lightweight, git-style syntax |
| `@inquirer/prompts` | Interactive prompts | ESM-native, modern API |
| `chalk` | Terminal colors | Universal terminal support |
| `ora` | Loading spinners | Smooth progress indication |
| `typescript` | Type safety | Catches errors at compile time |

---

## Development

```bash
# Run in development (ts-node)
npm run dev -- <command>

# Build for production
npm run build

# Run compiled version
npm start -- <command>
```

---

## Project Context

This project was built as a learning exercise to understand Solana development end-to-end within a 2-week timeline. The goal was not just to create working code, but to deeply understand:

- Why Solana's architecture works the way it does
- How security vulnerabilities emerge in token systems
- What makes a token "safe" vs "dangerous"
- How to build developer-friendly tools in the Solana ecosystem

The code prioritizes clarity and education over brevity. Error messages explain not just what went wrong, but why and how to fix it. The educational spinner pattern teaches concepts while operations execute. The architecture demonstrates clean separation of concerns.

For the complete story of what was built and why, see [docs/CODE_WALKTHROUGH.md](docs/CODE_WALKTHROUGH.md).

---

## License

MIT

---

## Further Reading

- [Solana Documentation](https://docs.solana.com)
- [SPL Token Program](https://spl.solana.com/token)
- [Metaplex Token Metadata](https://docs.metaplex.com/programs/token-metadata/)
- [IPFS Documentation](https://docs.ipfs.tech)
- [Code Walkthrough](docs/CODE_WALKTHROUGH.md) - Deep dive into implementation
