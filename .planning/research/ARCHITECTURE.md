# Architecture Research

**Domain:** Solana Token Creation System (Memecoin Factory)
**Researched:** 2026-02-04
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Layer (Off-Chain)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Commands │  │  Config  │  │  IPFS    │  │   RPC    │        │
│  │ (create, │  │  Parser  │  │ Uploader │  │  Client  │        │
│  │  burn)   │  │          │  │          │  │          │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                             ↓                                    │
│                  Transaction Builder                             │
│                             ↓                                    │
├─────────────────────────────────────────────────────────────────┤
│                    Solana Network (RPC)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Your Anchor Program (On-Chain)                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │create_token │  │ burn_tokens │  │  configure  │      │   │
│  │  │instruction  │  │ instruction │  │ instruction │      │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │   │
│  │         │                │                │             │   │
│  │         └────────────────┴────────────────┘             │   │
│  │                          ↓                              │   │
│  │                  CPI (Cross-Program Invocation)         │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             ↓                                    │
├─────────────────────────────────────────────────────────────────┤
│                   Core Solana Programs                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐     │
│  │  SPL Token   │  │   Metaplex     │  │  Associated     │     │
│  │   Program    │  │Token Metadata  │  │ Token Account   │     │
│  │  (mint,burn) │  │   (metadata)   │  │    Program      │     │
│  └──────┬───────┘  └────────┬───────┘  └────────┬────────┘     │
│         │                   │                   │               │
│         └───────────────────┴───────────────────┘               │
│                             ↓                                    │
├─────────────────────────────────────────────────────────────────┤
│                      Account Storage                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐        │
│  │ Mint       │  │  Metadata    │  │  Token Accounts  │        │
│  │ Account    │  │  Account     │  │  (user balances) │        │
│  │ (PDA)      │  │  (PDA)       │  │  (ATAs)          │        │
│  └────────────┘  └──────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘

External Storage:
┌──────────────┐
│     IPFS     │  ← Stores token metadata JSON + logo image
│   (Pinata)   │    (referenced by Metaplex metadata account)
└──────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CLI** | User interface, input validation, transaction signing | TypeScript with Commander.js or Inquirer |
| **IPFS Uploader** | Upload metadata JSON + logo to decentralized storage | Pinata SDK or direct IPFS API |
| **RPC Client** | Send transactions to Solana network | @solana/web3.js RpcClient |
| **Anchor Program** | Business logic (anti-rug controls, validation) | Rust with Anchor framework |
| **SPL Token Program** | Core token operations (mint, burn, transfer) | Native Solana program (immutable) |
| **Metaplex Token Metadata** | Attach name, symbol, URI to tokens | Native Metaplex program (immutable) |
| **Associated Token Account Program** | Create deterministic token account addresses | Native Solana program (immutable) |

## Recommended Project Structure

```
solana-memecoin-factory/
├── programs/
│   └── memecoin-factory/           # Anchor program (on-chain)
│       ├── src/
│       │   ├── lib.rs              # Program entry point, declare_id!
│       │   ├── instructions/       # Instruction handlers
│       │   │   ├── mod.rs
│       │   │   ├── create_token.rs # Token creation logic
│       │   │   ├── burn_tokens.rs  # Burn mechanism
│       │   │   └── configure.rs    # Anti-rug controls
│       │   ├── state/              # Account structures
│       │   │   ├── mod.rs
│       │   │   └── token_config.rs # Token configuration state
│       │   └── errors.rs           # Custom error codes
│       └── Cargo.toml              # Rust dependencies
│
├── cli/                            # TypeScript CLI (off-chain)
│   ├── src/
│   │   ├── index.ts                # CLI entry point
│   │   ├── commands/               # Command implementations
│   │   │   ├── create.ts           # Create token command
│   │   │   ├── burn.ts             # Burn tokens command
│   │   │   └── info.ts             # Display token info
│   │   ├── services/               # Business logic
│   │   │   ├── ipfs.ts             # IPFS upload service
│   │   │   ├── metadata.ts         # Metadata formatter
│   │   │   └── transaction.ts      # Transaction builder
│   │   ├── utils/                  # Helpers
│   │   │   ├── keypair.ts          # Wallet management
│   │   │   ├── rpc.ts              # RPC connection
│   │   │   └── validation.ts       # Input validation
│   │   └── types/                  # TypeScript types
│   │       └── token.ts            # Token interfaces
│   ├── package.json
│   └── tsconfig.json
│
├── tests/                          # Integration tests
│   ├── memecoin-factory.ts         # Anchor program tests
│   └── cli.test.ts                 # CLI tests
│
├── Anchor.toml                     # Anchor configuration
└── package.json                    # Workspace config
```

### Structure Rationale

- **programs/:** On-chain logic lives here. Anchor expects this structure. Each program is a separate folder.
- **cli/:** Off-chain CLI tool. Kept separate because it has different dependencies (TypeScript vs Rust) and deployment model (distributed binary vs on-chain program).
- **instructions/ folder:** Each instruction gets its own file. Keeps logic modular and testable. Matches Anchor best practices.
- **state/ folder:** Account structures are separate from instruction logic. Makes it easier to understand data models.
- **services/ folder in CLI:** Business logic abstracted from command handlers. Makes commands thin and logic reusable/testable.

## Architectural Patterns

### Pattern 1: PDA as Mint Authority

**What:** Use a Program Derived Address (PDA) as both the mint account address and mint authority. The program controls minting through this PDA.

**When to use:** Always. This is the standard pattern for programmatic token control on Solana.

**Trade-offs:**
- **Pro:** Program can sign mint operations via CPI without needing external private keys
- **Pro:** Deterministic address derivation means you can always find the mint
- **Con:** Must design seed strategy carefully to avoid collisions

**Example:**
```rust
// In your Anchor program
#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(
        init,
        seeds = [b"mint", creator.key().as_ref()],
        bump,
        payer = creator,
        mint::decimals = 9,
        mint::authority = mint,  // PDA is its own authority
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}
```

### Pattern 2: Metadata Creation via CPI

**What:** Your Anchor program calls the Metaplex Token Metadata program via Cross-Program Invocation (CPI) to create the metadata account.

**When to use:** When you want programmatic control over metadata creation (e.g., enforcing metadata standards, adding anti-rug verification).

**Trade-offs:**
- **Pro:** Single transaction creates both mint and metadata atomically
- **Pro:** Program enforces metadata standards
- **Con:** More complex than creating metadata off-chain
- **Con:** Uses more compute units

**Example:**
```rust
use anchor_spl::metadata::{
    create_metadata_accounts_v3,
    CreateMetadataAccountsV3,
    Metadata,
};

// Inside your instruction handler
let cpi_context = CpiContext::new_with_signer(
    ctx.accounts.token_metadata_program.to_account_info(),
    CreateMetadataAccountsV3 {
        metadata: ctx.accounts.metadata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        mint_authority: ctx.accounts.mint.to_account_info(),
        payer: ctx.accounts.creator.to_account_info(),
        update_authority: ctx.accounts.mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    },
    signer_seeds,
);

create_metadata_accounts_v3(
    cpi_context,
    data_v2,
    false, // is_mutable
    true,  // update_authority_is_signer
)?;
```

### Pattern 3: CLI → RPC → Program Flow

**What:** CLI validates input, uploads to IPFS, builds transaction, sends to RPC, which invokes your program.

**When to use:** Standard pattern for all CLI tools interacting with Solana programs.

**Trade-offs:**
- **Pro:** Clear separation of concerns (UX vs business logic)
- **Pro:** CLI can be updated without redeploying program
- **Con:** Two codebases to maintain (TypeScript + Rust)

**Example:**
```typescript
// CLI builds and sends transaction
async function createToken(params: CreateTokenParams) {
  // 1. Upload metadata to IPFS
  const metadataUri = await uploadToIPFS({
    name: params.name,
    symbol: params.symbol,
    image: params.logoPath,
  });

  // 2. Derive PDA addresses
  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), creator.publicKey.toBuffer()],
    programId
  );

  // 3. Build transaction
  const tx = await program.methods
    .createToken(params.name, params.symbol, metadataUri)
    .accounts({
      mint: mintPda,
      creator: creator.publicKey,
      // ... other accounts
    })
    .transaction();

  // 4. Send to RPC
  const signature = await sendAndConfirmTransaction(
    connection,
    tx,
    [creator]
  );

  return { mintAddress: mintPda, signature };
}
```

## Data Flow

### Token Creation Flow

```
User runs CLI command
    ↓
CLI validates inputs (name, symbol, supply, logo)
    ↓
CLI uploads metadata JSON + logo → IPFS (Pinata)
    ↓
IPFS returns URI (ipfs://...)
    ↓
CLI builds transaction with:
  - Instruction: create_token
  - Accounts: mint PDA, metadata PDA, creator, programs
  - Args: name, symbol, uri, supply
    ↓
CLI signs transaction with creator wallet
    ↓
CLI sends transaction → RPC Node
    ↓
RPC validates & forwards → Solana Runtime
    ↓
Solana Runtime invokes your Anchor program
    ↓
Anchor program:
  1. Creates mint account (PDA)
  2. CPI → SPL Token: initialize mint
  3. CPI → Metaplex: create metadata account
  4. CPI → SPL Token: mint initial supply
  5. Optionally revoke mint authority (anti-rug)
    ↓
Transaction succeeds or reverts atomically
    ↓
CLI receives transaction signature
    ↓
CLI displays success + mint address to user
```

### Account Relationship Flow

```
Mint Account (PDA)
  ↓ (owns)
  ├─→ Metadata Account (PDA derived from mint)
  │   └─→ References IPFS URI
  │
  └─→ Token Accounts (ATAs for each holder)
      ├─→ User A's Associated Token Account
      ├─→ User B's Associated Token Account
      └─→ Program's Associated Token Account (if needed)
```

### Key Data Flows

1. **Metadata Upload:** CLI → Pinata API → IPFS → Returns URI → Stored in Metaplex metadata account
2. **Authority Management:** Mint created with PDA authority → Program optionally revokes mint authority → No more minting possible (anti-rug)
3. **Burn Mechanism:** User calls burn instruction → Program validates → CPI to SPL Token burn → Supply decreases

## Build Order Dependencies

### Phase 1: Foundation (Build First)
1. **Anchor program skeleton**
   - Set up Anchor project structure
   - Define program ID (deploy once to get ID, update declare_id!)
   - Define basic account structures

2. **Basic mint creation**
   - Implement create_token instruction
   - No metadata yet, just mint account
   - Test mint creation works

### Phase 2: Metadata Integration (Build Second)
3. **IPFS upload service**
   - CLI service to upload to Pinata
   - Format metadata JSON correctly
   - Return URI

4. **Metaplex integration**
   - Add mpl_token_metadata dependency
   - Implement CPI to create_metadata_accounts_v3
   - Link metadata to mint

### Phase 3: CLI & User Experience (Build Third)
5. **CLI commands**
   - Parse user input
   - Call IPFS service
   - Build and send transactions
   - Handle errors gracefully

### Phase 4: Anti-Rug Features (Build Last)
6. **Authority revocation**
   - Implement logic to revoke mint authority
   - Optionally revoke freeze authority
   - Make revocation mandatory or optional

7. **Burn mechanism**
   - Implement burn instruction
   - Validate burn permissions
   - Update supply

**Rationale:** You can't create metadata without a mint. You can't build a useful CLI without knowing your program's interface. Anti-rug features depend on understanding the full token lifecycle.

## Security Architecture

### Authority Management

| Authority | Recommended Setting | Anti-Rug Rationale |
|-----------|---------------------|-------------------|
| **Mint Authority** | Revoke after initial mint | Prevents unlimited inflation |
| **Freeze Authority** | Revoke immediately | Prevents honeypot (freezing user tokens) |
| **Update Authority** | Revoke or multisig | Prevents malicious metadata changes |

### PDA Usage Patterns

**Secure Pattern:**
```rust
// PDA seeds include creator to prevent collisions
seeds = [b"mint", creator.key().as_ref()]
```

**Insecure Pattern (avoid):**
```rust
// Global seed = everyone shares same PDA = collision
seeds = [b"mint"]  // DON'T DO THIS
```

### CPI Security Checklist

- [ ] Always verify program IDs before CPI
- [ ] Use `has_one` constraints to validate account ownership
- [ ] Never trust accounts passed by user without validation
- [ ] Use signer seeds for PDA signing
- [ ] Check account discriminators for correct account types

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k tokens created** | Monolithic program is fine. Single RPC endpoint works. |
| **1k-10k tokens** | Consider indexing mint addresses off-chain (database) for discovery. CLI can remain the same. |
| **10k-100k tokens** | May need custom indexer (using Geyser plugin or RPC getProgramAccounts). Consider rate limiting IPFS uploads. |
| **100k+ tokens** | Full indexing infrastructure required. Consider caching layer for metadata lookups. May need multiple RPC providers for redundancy. |

### Scaling Priorities

1. **First bottleneck:** IPFS upload rate limits
   - **Fix:** Implement retry logic with exponential backoff
   - **Fix:** Consider self-hosted IPFS node or alternative providers (NFT.storage, web3.storage)

2. **Second bottleneck:** RPC rate limits (especially on free tiers)
   - **Fix:** Implement connection pooling
   - **Fix:** Upgrade to paid RPC provider (QuickNode, Helius, Triton)
   - **Fix:** Add transaction retry logic

3. **Third bottleneck:** Token discovery (users can't find their tokens easily)
   - **Fix:** Build simple API that indexes your program's events
   - **Fix:** Store mint addresses in off-chain database with metadata cache

## Anti-Patterns

### Anti-Pattern 1: Using Wallet as Mint Authority

**What people do:** Set the user's wallet as mint authority instead of a PDA.

**Why it's wrong:**
- User can mint unlimited tokens later (rug pull risk)
- Defeats the purpose of anti-rug guarantees
- Requires user to manually revoke authority (most won't)

**Do this instead:**
```rust
// Use PDA as mint authority
#[account(
    init,
    seeds = [b"mint", creator.key().as_ref()],
    bump,
    payer = creator,
    mint::decimals = 9,
    mint::authority = mint,  // PDA is authority, not user
)]
pub mint: Account<'info, Mint>,
```

### Anti-Pattern 2: Creating Metadata Off-Chain After Mint

**What people do:** Create mint in program, then create metadata separately via CLI.

**Why it's wrong:**
- Non-atomic: Mint can exist without metadata (breaks expectations)
- Two transactions = higher cost + complexity
- User can forget to create metadata

**Do this instead:**
- Create mint and metadata in single transaction via CPI
- Ensures atomicity: either both succeed or both revert

### Anti-Pattern 3: Hardcoding RPC URLs

**What people do:** Hardcode mainnet/devnet URLs in CLI.

**Why it's wrong:**
- RPC providers change/deprecate endpoints
- Can't easily switch providers when one is down
- Free tier rate limits hit everyone using your CLI

**Do this instead:**
```typescript
// Let users configure their own RPC
const connection = new Connection(
  process.env.RPC_URL || clusterApiUrl('devnet'),
  'confirmed'
);
```

### Anti-Pattern 4: Storing Metadata On-Chain

**What people do:** Try to store name, symbol, image directly in custom program accounts.

**Why it's wrong:**
- Extremely expensive (rent for large accounts)
- Wallets won't recognize your custom metadata format
- Reinventing the wheel (Metaplex exists for this)

**Do this instead:**
- Upload metadata to IPFS
- Use Metaplex Token Metadata to link to IPFS URI
- Wallets/explorers automatically recognize and display

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **IPFS (Pinata)** | REST API via SDK | Requires API key. Free tier has rate limits. Upload JSON first, then image, reference image URL in JSON. |
| **RPC Provider** | WebSocket/HTTP via @solana/web3.js | Use confirmed commitment for balance checks, finalized for critical operations. Free tiers have rate limits. |
| **Metaplex** | CPI from Anchor program | Immutable program at `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`. Uses specific account structure. |
| **SPL Token** | CPI from Anchor program | Immutable program at `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`. Industry standard. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **CLI ↔ IPFS Service** | Direct function calls | Synchronous. Can be slow (network I/O). Add loading indicators. |
| **CLI ↔ RPC Client** | Async via @solana/web3.js | Use connection pooling. Handle timeouts gracefully. |
| **Anchor Program ↔ SPL Token** | CPI with signer seeds | Must provide correct PDA signer. Atomic operation. |
| **Anchor Program ↔ Metaplex** | CPI with metadata struct | Follow Metaplex data schema exactly. Version matters (v3 is current). |

## Account Architecture

### Account Types and Ownership

```
Mint Account
├─ Owner: SPL Token Program
├─ Address: PDA (program-controlled)
├─ Data: supply, decimals, mint_authority, freeze_authority
└─ Rent: ~0.00144 SOL

Metadata Account
├─ Owner: Metaplex Token Metadata Program
├─ Address: PDA derived from mint
├─ Data: name, symbol, uri, seller_fee_basis_points, creators
└─ Rent: ~0.0054 SOL (varies by metadata size)

Associated Token Account (per user)
├─ Owner: SPL Token Program
├─ Address: PDA derived from (owner, mint)
├─ Data: amount, mint, owner
└─ Rent: ~0.00203 SOL

Optional: Token Config Account (custom)
├─ Owner: Your program
├─ Address: PDA (your seeds)
├─ Data: Custom anti-rug settings, timestamps, etc.
└─ Rent: Depends on size
```

### Rent Costs Summary

Creating a token with metadata requires:
- Mint account: ~0.00144 SOL
- Metadata account: ~0.0054 SOL
- Creator's ATA: ~0.00203 SOL
- **Total: ~0.00887 SOL (~$0.15 at $17/SOL)**

Users creating their ATA later pay ~0.00203 SOL.

## Sources

**Architecture & Patterns:**
- [SPL Token Program Architecture on Solana | Chainstack](https://chainstack.com/spl-token-program-architecture/)
- [Anchor Framework Program Structure](https://www.anchor-lang.com/docs/basics/program-structure)
- [Solana Core: Transactions](https://solana.com/docs/core/transactions)
- [Solana Core: Program Derived Addresses](https://solana.com/docs/core/pda)

**Metadata Integration:**
- [Create a Solana SPL Token with Metaplex | QuickNode](https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-create-a-fungible-spl-token-with-the-new-metaplex-token-standard)
- [How Metaplex Metadata for Tokens Works | RareSkills](https://rareskills.io/post/metaplex-token-metadata)
- [Metaplex Token Metadata GitHub](https://github.com/metaplex-foundation/mpl-token-metadata)

**CPI Patterns:**
- [What is a Cross Program Invocation (CPI) on Solana? | QuickNode](https://www.quicknode.com/guides/solana-development/anchor/what-are-cpis)
- [Mastering Cross-Program Invocations in Anchor | Medium](https://medium.com/@ancilartech/mastering-cross-program-invocations-in-anchor-a-developers-guide-to-solana-s-cpi-patterns-0f29a5734a3e)
- [Anchor CPI Documentation](https://www.anchor-lang.com/docs/basics/cpi)

**PDA & Authority:**
- [What are Solana PDAs? Explanation & Examples | Helius](https://www.helius.dev/blog/solana-pda)
- [Solana PDA Mint Authority Example | GitHub](https://github.com/solana-developers/program-examples/blob/main/tokens/pda-mint-authority/README.md)
- [Token Security 101: Revoke & Freeze Explained | Solana Token Creator](https://www.solanatokencreator.com/post/token-security-101-revoke-freeze-explained/)

**Account Relationships:**
- [What is an Associated Token Account on Solana? | Alchemy](https://www.alchemy.com/overviews/associated-token-account)
- [Solana Programs Part 2: Understanding SPL Associated Token Account | Sec3](https://www.sec3.dev/blog/solana-programs-part-2-understanding-spl-associated-token-account)
- [Ultimate Solana Account Model Guide | Medium](https://medium.com/@ancilartech/ultimate-solana-account-model-guide-pdas-mints-token-accounts-explained-34bf3f0f8678)

**Deployment & Build:**
- [Deploying Programs | Solana](https://solana.com/docs/programs/deploying)
- [How to Build & Deploy Solana Smart Contracts | Rejolut](https://rejolut.com/blog/how-to-build-deploy-smart-contracts-on-solana/)

---
*Architecture research for: Solana Memecoin Factory*
*Researched: 2026-02-04*
