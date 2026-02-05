# Pitfalls Research: Solana Token Creation

**Domain:** Solana Token Creation Tools & Memecoin Projects
**Researched:** 2026-02-04
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Missing Signer Authorization Checks

**What goes wrong:**
Programs validate account public keys without verifying `is_signer` status, allowing anyone to impersonate authorities and perform privileged operations. This was the root cause of the $326M Wormhole exploit.

**Why it happens:**
Developers assume that passing the correct account address provides authorization. In Solana's attacker-controlled model, any account can be passed to functions - verification must explicitly check signer status.

**How to avoid:**
- Use Anchor's `Signer<'info>` account type for automatic signer validation
- Add `#[account(signer)]` constraint to accounts requiring authorization
- Never use `UncheckedAccount` for authority fields without manual signer checks
- Always verify `account_info.is_signer` in native Rust programs

**Warning signs:**
- Using `AccountInfo` or `UncheckedAccount` types for authority/admin accounts
- Authority validation logic missing the signer check
- Functions that modify state without requiring transaction signatures

**Phase to address:**
Phase 1 (Foundation/Security) - Must be built into initial program architecture

---

### Pitfall 2: Unrevoked Mint/Freeze Authority

**What goes wrong:**
Leaving mint authority enabled allows unlimited token creation after launch, diluting holder value. Freeze authority enables wallet/transaction freezing, creating rug pull vectors. This affects 98.7% of Pump.fun tokens and 93% of Raydium pools.

**Why it happens:**
Developers maintain authority "just in case" or forget to revoke after testing. Some maliciously retain control for rug pulls.

**How to avoid:**
- Revoke mint authority immediately after initial supply creation for fixed-supply tokens
- Revoke freeze authority unless required for compliance (regulated assets)
- Use programmatic authority control with multi-sig for legitimate use cases
- Document authority status clearly in metadata
- For memecoins: Always revoke both authorities (this is Pump.fun's default)

**Warning signs:**
- Mint authority still active post-launch
- Freeze authority enabled without clear compliance reasoning
- Authority addresses controlled by single wallet
- Missing transparency about authority status

**Phase to address:**
Phase 1 (Foundation) - Authority management must be core feature with clear UI

---

### Pitfall 3: Integer Overflow Without Checked Arithmetic

**What goes wrong:**
Rust's release mode (which Solana uses) doesn't check for integer overflow by default. A single overflow can enable unlimited token minting or complete protocol drains.

**Why it happens:**
Developers test in debug mode where overflow checks exist, but Solana programs run in release mode without checks. This is a Rust/Solana-specific footgun.

**How to avoid:**
- Enable overflow checks in Cargo.toml: `overflow-checks = true` in release profile
- Use checked arithmetic methods: `balance.checked_sub(amount)`, `supply.checked_add(tokens)`
- Use saturating operations where appropriate: `saturating_mul()`, `saturating_add()`
- Multiply before dividing to prevent precision loss
- Validate all numeric inputs before operations

**Warning signs:**
- Direct arithmetic operators (`+`, `-`, `*`) on token amounts or balances
- Missing `overflow-checks = true` in Cargo.toml release profile
- No bounds checking on user-supplied amounts
- Calculations involving decimals without precision handling

**Phase to address:**
Phase 1 (Foundation) - Must be in initial program configuration and code patterns

---

### Pitfall 4: Incorrect Token-2022 vs SPL Token Choice

**What goes wrong:**
Using Token-2022 for memecoins creates wallet compatibility issues - significantly fewer wallets support Token-2022. Phantom has only partial support. Conversely, using SPL tokens for regulated assets misses required features like transfer fees and permanent delegates.

**Why it happens:**
Developers assume "newer is better" or aren't aware of the compatibility/feature tradeoffs between standards.

**How to avoid:**
- **Use SPL tokens for:** Memecoins, community tokens, simple fungible tokens
- **Use Token-2022 for:** Regulated assets (need compliance fees), tokens requiring transfer hooks, confidential transfers, or on-chain royalties
- Token-2022 extensions must be applied during mint initialization and cannot be changed later
- Test wallet compatibility before mainnet launch

**Warning signs:**
- Choosing Token-2022 for a memecoin "because it's newer"
- Using SPL tokens when compliance features are legal requirements
- Not testing with major wallets (Phantom, Solflare, Backpack) before launch
- Adding extensions without understanding immutability constraints

**Phase to address:**
Phase 1 (Foundation) - Token standard selection must be first architectural decision

---

### Pitfall 5: Metadata Update Failures with Token-2022

**What goes wrong:**
Token-2022 tokens created without Metadata Pointer store metadata inside the mint itself with fixed space. When updating metadata, if the new URI is even slightly longer than the original, transactions fail. This is a permanent limitation.

**Why it happens:**
Token-2022 uses fixed-size TLV (Type-Length-Value) regions for internal metadata. Unlike classic SPL tokens where metadata lives in expandable Metaplex accounts, Token-2022 internal metadata cannot grow.

**How to avoid:**
- For Token-2022: Use Metadata Pointer extension to store metadata externally (like classic SPL)
- If using internal metadata: Keep URIs short and account for future URL changes
- Document metadata mutability strategy before mint creation
- For memecoins: Revoke update authority entirely (recommended by Pump.fun)

**Warning signs:**
- Token-2022 creation without considering metadata update scenarios
- Long metadata URIs in Token-2022 with internal storage
- Missing Metadata Pointer extension when updates are planned
- "Update metadata" transaction failures with account size errors

**Phase to address:**
Phase 1 (Foundation) - Metadata architecture must be decided at token creation

---

### Pitfall 6: Missing Account Ownership Validation

**What goes wrong:**
Programs fail to verify that accounts are owned by expected programs (e.g., SPL Token program, System program). Attackers pass malicious accounts that match the expected structure but are controlled by attacker programs.

**Why it happens:**
Developers validate account structure and data but forget ownership checks. Solana allows any program to create accounts with any structure.

**How to avoid:**
- Verify `account.owner == expected_program_id` before processing
- Use Anchor's `Account<'info, T>` type which automatically validates ownership
- Add `#[account(owner = token::ID)]` constraints for token accounts
- Validate Program Derived Address (PDA) ownership before Cross-Program Invocations (CPI)

**Warning signs:**
- Manual account deserialization without owner checks
- Using `AccountInfo` without validating `owner` field
- Trusting account structure alone for validation
- Missing Anchor constraints on account types

**Phase to address:**
Phase 1 (Foundation) - Core security pattern in all account validations

---

### Pitfall 7: PDA Seed Collisions

**What goes wrong:**
Using shared or predictable PDA seeds allows attackers to create accounts that collide with legitimate user PDAs, enabling unauthorized access or denial-of-service by pre-creating accounts.

**Why it happens:**
Developers use simple seeds (just a program name or type) shared across users, or don't include user-specific identifiers in seed derivation.

**How to avoid:**
- Include user wallet address in PDA seeds: `[b"token_account", user.key().as_ref()]`
- Add unique identifiers for per-user state: `[b"vault", authority.key().as_ref(), &vault_id.to_le_bytes()]`
- Document seed construction patterns clearly
- Test seed uniqueness across multiple users
- Use Anchor's `seeds` and `bump` constraints with validation

**Warning signs:**
- PDA seeds without user-specific components
- Global PDAs for user state (instead of per-user PDAs)
- Seed construction that's identical for different users
- Missing uniqueness constraints in seed derivation

**Phase to address:**
Phase 1 (Foundation) - PDA design affects entire program architecture

---

### Pitfall 8: Unsafe Cross-Program Invocation (CPI) Patterns

**What goes wrong:**
Programs forward user wallet signers to untrusted programs via CPI, enabling wallet theft and permanent fund lockouts. Programs also fail to validate the target program ID before CPI, allowing attackers to redirect calls to malicious programs.

**Why it happens:**
Developers treat CPI like standard function calls without understanding Solana's security model. Programs inherit caller authority during CPI, creating privilege escalation risks.

**How to avoid:**
- Never pass user wallet accounts as signers in CPI unless absolutely necessary
- Validate target program ID before every CPI: `require!(target_program.key() == expected_program_id, ErrorCode::InvalidProgram)`
- Use PDA signers for program-owned operations instead of forwarding user authority
- Create program-owned token accounts with PDA authority, not user authority
- Audit all CPI calls for authority leakage

**Warning signs:**
- CPI calls without program ID validation
- Forwarding user accounts with `.is_signer = true` to CPIs
- Missing constraints on program accounts in Anchor
- Using `invoke_signed` without understanding authority delegation

**Phase to address:**
Phase 1 (Foundation) - Critical security pattern for any program making CPIs

---

### Pitfall 9: Front-Running and MEV Sandwich Attacks at Launch

**What goes wrong:**
Sniper bots front-run token launches by monitoring RPC queues and paying higher priority fees. Wide (multi-slot) sandwich attacks extract value by front-running and back-running trades across different validator slots. Over $500M extracted from Solana users in 16 months through sandwich bots.

**Why it happens:**
Solana transactions are observable in-flight via RPC queues and bundle relays. Malicious validators can reorder transactions. Token launches create high-volatility opportunities perfect for MEV extraction.

**How to avoid:**
- Use anti-MEV launch platforms (Metaplex Genesis with 6-second sniper tax)
- Implement programmatic launch protections: price limits, transaction delays, early-block restrictions
- Set appropriate slippage limits (but not too high)
- Consider private RPC endpoints for initial liquidity
- Distribute initial supply carefully to avoid thin liquidity exploits
- Use fair launch mechanisms instead of instant bonding curves

**Warning signs:**
- Launching directly to AMM without anti-MEV protections
- High slippage tolerance in launch transactions
- Missing rate limiting or transaction throttling
- Thin initial liquidity that's easy to manipulate
- No monitoring of launch transaction ordering

**Phase to address:**
Phase 2-3 (Advanced Features) - After basic token creation works, add launch protections

---

### Pitfall 10: Transaction Failures Due to Compute Unit Misconfiguration

**What goes wrong:**
Transactions fail because compute unit limits are too low, or get out-bid by other transactions during congestion. Default compute budgets may be insufficient for complex token operations with metadata.

**Why it happens:**
Developers don't set explicit compute unit limits or priority fees. During network congestion, transactions with default fees get dropped or delayed indefinitely.

**How to avoid:**
- Set explicit compute unit limits: Measure actual usage and add 20% buffer
- Include priority fees based on network conditions: Use RPC methods to get recommended fees
- Implement transaction retry logic with exponential backoff
- Monitor transaction success rates and adjust compute budgets
- Use `setComputeUnitLimit()` and `setComputeUnitPrice()` instructions
- Test under congested network conditions (during high activity periods)

**Warning signs:**
- Transactions failing with "compute budget exceeded" errors
- Low transaction success rates during congestion
- Missing priority fee configuration
- No retry logic for failed transactions
- Fixed compute budgets that don't adapt to network conditions

**Phase to address:**
Phase 1 (Foundation) - Transaction submission must handle compute budgets from start

---

### Pitfall 11: Keypair Security and Private Key Exposure

**What goes wrong:**
Private keys stored in environment variables, committed to repos, or logged to console. Keys used in client-side applications become publicly visible. Wallet keypairs stored on validators create theft vectors.

**Why it happens:**
Developers use test keypairs in development and forget to secure them before production. Documentation examples show plaintext keys. Environment variables feel "secure" but aren't encrypted.

**How to avoid:**
- NEVER commit keypairs to version control - use .gitignore for `*.json` keypairs
- Use hardware wallets (Ledger) or secure key management services for production
- Restrict file permissions on keypair files: `chmod 600 keypair.json`
- Load from environment variables ONLY in development - document clearly
- For validators: NEVER store withdrawer keypairs on validator machines
- Use separate keypairs for different environments (devnet/mainnet)
- Implement key rotation procedures for compromised keys

**Warning signs:**
- Keypair files in git history
- Private keys in environment files committed to repos
- Console.log or println! statements containing key material
- Same keypair used across devnet and mainnet
- No key rotation procedures documented
- Keys stored in plaintext without permission restrictions

**Phase to address:**
Phase 1 (Foundation) - Security practices must be established from project start

---

### Pitfall 12: Devnet vs Mainnet Configuration Differences

**What goes wrong:**
Programs work perfectly on devnet but fail on mainnet due to network resets, different RPC endpoints, rate limits, or token value assumptions. Accounts or programs wiped during devnet maintenance cause confusion.

**Why it happens:**
Developers assume devnet and mainnet are identical except for token value. Devnet has different stability guarantees, performance characteristics, and may use different program versions.

**How to avoid:**
- Maintain separate configurations for each network (endpoints, program IDs)
- Never assume devnet persistence - accounts can be wiped during maintenance
- Test mainnet RPC rate limits - they differ from devnet
- Validate program addresses match between networks
- Use network-specific environment variables
- Don't rely on devnet transaction history or account state
- Budget for mainnet SOL for testing (devnet SOL is free but worthless)

**Warning signs:**
- Hardcoded devnet program IDs in mainnet code
- Single configuration file for all networks
- Assuming account persistence on devnet
- Not testing RPC rate limit handling
- Devnet SOL value assumptions in calculations
- Missing network validation before transactions

**Phase to address:**
Phase 1 (Foundation) - Multi-network support must be architectural from start

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip overflow-checks in Cargo.toml | Slightly smaller binary, faster math | Complete program vulnerability to overflow attacks | Never |
| Use UncheckedAccount instead of typed accounts | Faster development, fewer constraints | Missing critical validation, security vulnerabilities | Never for authority/admin accounts |
| Keep mint authority "just in case" | Flexibility to mint more tokens | Permanent rug pull vector, kills user trust | Only with transparent multi-sig governance |
| Use same keypair for dev and prod | Simpler configuration | Massive security risk, credential exposure | Never |
| Skip Metaplex metadata | Saves ~0.00204 SOL per token | Tokens invisible in wallets, no name/image | Only for internal/test tokens |
| Use generic error codes | Faster development | Impossible to debug transaction failures | Acceptable in early prototyping, fix before beta |
| Skip token account owner validation | Fewer checks, faster execution | Attacker-controlled accounts accepted | Never |
| Default compute unit limits | No configuration needed | Transaction failures during congestion | Only on devnet with low traffic |
| Single RPC endpoint | Simple setup | Single point of failure, rate limit issues | Only for local development |
| Skip priority fees | Lower transaction costs | Dropped transactions during congestion | Acceptable on devnet only |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Metaplex Metadata | Creating Token-2022 without Metadata Pointer, then trying to update long URIs | Use Metadata Pointer extension OR keep URIs short and immutable |
| SPL Token Program | Mixing Token-2022 and SPL Token program IDs | Validate program ID matches token type; use `token_program` constraint in Anchor |
| RPC Endpoints | Using public RPC without rate limit handling | Implement retry logic, use multiple endpoints, or paid RPC service |
| Wallet Adapters | Assuming all wallets support Token-2022 | Test with target wallets; use SPL tokens for maximum compatibility |
| Associated Token Accounts | Not handling ATA initialization failures | Check if ATA exists; handle "already initialized" vs "needs initialization" |
| Priority Fees | Setting fixed priority fees regardless of network state | Query network for recommended fees; adjust dynamically |
| Transaction Confirmation | Polling indefinitely without timeout | Set max polling time, implement exponential backoff, handle finality levels |
| Anchor IDL | Not regenerating client code after program changes | Automate IDL generation in build process; version IDL files |
| Cross-Program Invocations | Trusting program addresses without validation | Validate program ID against expected constant before CPI |
| Token Extensions | Adding extensions after mint creation | Plan extensions during mint initialization - they're immutable |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous transaction confirmation | One-by-one transaction processing | Use WebSocket subscriptions or batch confirmations | >50 transactions/minute |
| Polling RPC for state changes | Rate limit errors, high latency | Use WebSocket subscriptions and gRPC streams (Yellowstone Geyser) | >100 requests/10 seconds |
| Single RPC endpoint | 429 rate limit errors, outages | Load balance across multiple RPC providers, implement failover | At public RPC limits (40 req/10s) |
| Loading all token accounts at once | Slow page loads, timeouts | Paginate account fetching, lazy load, use indexers | >1000 token accounts |
| Missing compute unit optimization | Increasing transaction failures | Profile and optimize CU usage, request only needed units | Network congestion |
| No transaction batching | Sequential processing is slow | Batch independent transactions, parallel processing | >10 transactions sequentially |
| Fetching full account data repeatedly | High RPC costs, slow UI | Cache account data, subscribe to changes only | Frequent updates (>1/second) |
| Deserializing accounts client-side | CPU-intensive, slow | Use indexers (Helius, Triton) for complex queries | >100 accounts per query |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Not verifying is_signer on authority accounts | Complete program takeover, unauthorized minting/burning | Use Signer<'info> type or explicit is_signer checks |
| Forwarding user signers in CPI | Wallet theft, permanent fund lockout | Use PDA signers for program operations |
| Missing account ownership validation | Malicious accounts accepted, fake token accounts | Verify account.owner == expected_program_id |
| Retaining mint/freeze authority post-launch | Rug pull vector, unlimited inflation | Revoke authorities or use transparent multi-sig |
| Using unchecked arithmetic in release mode | Integer overflow enables unlimited minting | Enable overflow-checks in Cargo.toml, use checked_* methods |
| Shared PDA seeds across users | Account collisions, unauthorized access | Include user pubkey in all PDA seeds |
| Missing slippage protection | MEV sandwich attacks drain user value | Implement max slippage checks, use anti-MEV launch platforms |
| Reusing closed accounts without discriminators | Type confusion, state reuse attacks | Zero account data and add closed discriminators |
| Trusting client-supplied account addresses | Arbitrary account injection | Derive and validate all PDAs on-chain |
| No initialization guards | Front-running creates malicious accounts | Restrict init to upgrade authority or use init_if_needed carefully |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Generic "Transaction failed" errors | Users can't fix problems, support burden | Parse error codes and show actionable messages ("Insufficient SOL for rent") |
| Not handling wallet disconnections | Lost transactions, confusing state | Detect disconnection, pause operations, clear UI state |
| Missing transaction confirmation UI | Users don't know if operation succeeded | Show pending state, confirmed state, link to explorer |
| No cost estimation before transactions | Surprise fees, failed transactions | Display estimated SOL cost including rent, fees, priority fees |
| Wallet selector defaulting to one wallet | Users with different wallet feel excluded | Support multiple wallets (Phantom, Solflare, Backpack, etc.) |
| Not explaining devnet vs mainnet | Users confused why tokens "don't appear" | Clear network indicator, explain devnet tokens have no value |
| Missing transaction retry on failure | Users manually retry, frustration | Automatic retry with exponential backoff for transient failures |
| No indication of network congestion | Users think app is broken | Show network status, explain delays, adjust priority fees |
| Authority status not visible | Users don't know if token is rug-proof | Display mint/freeze authority status prominently |
| Token-2022 without wallet warnings | Token creation succeeds but invisible in wallet | Warn about limited wallet support, suggest SPL for compatibility |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Token Creation:** Often missing mint/freeze authority revocation - verify authorities explicitly set to None
- [ ] **Metadata Upload:** Often missing IPFS pinning - verify metadata remains accessible after creator goes offline
- [ ] **Transaction Submission:** Often missing priority fee configuration - verify transactions succeed during network congestion
- [ ] **Error Handling:** Often missing specific error messages - verify users get actionable error messages, not generic failures
- [ ] **Account Creation:** Often missing rent-exempt balance checks - verify SOL balance sufficient before ATA creation
- [ ] **Token Standard Selection:** Often missing wallet compatibility testing - verify tokens visible in target wallets
- [ ] **Keypair Management:** Often missing production key security - verify keys not in git history, environment vars encrypted
- [ ] **Network Configuration:** Often missing mainnet vs devnet distinction - verify separate configs for each network
- [ ] **RPC Integration:** Often missing rate limit handling - verify retry logic and failover RPC endpoints
- [ ] **Compute Budget:** Often missing CU limit configuration - verify transactions include appropriate compute budget instructions
- [ ] **Authority Documentation:** Often missing clear authority status - verify token page displays current authorities
- [ ] **Transaction Confirmation:** Often missing finality checks - verify using "finalized" commitment level for critical operations

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Mint authority not revoked | HIGH (new token needed) | Cannot recover - must create new token and migrate liquidity. Communicate transparently. |
| Keypair compromised | HIGH | Immediately revoke compromised authorities, drain accounts to new wallet, create new token if necessary |
| Wrong token standard (SPL vs Token-2022) | HIGH (new token needed) | Cannot change standards - must create new token, migrate holders, rebuild liquidity |
| Integer overflow vulnerability | CRITICAL (rewrite + audit) | Pause program, fix vulnerability, security audit, upgrade with migration path |
| Missing signer checks | CRITICAL (rewrite + audit) | Immediately pause program if possible, patch vulnerability, full security audit required |
| Metadata update locked (Token-2022) | MEDIUM (workaround possible) | Use external metadata pointer if available, or create new token with correct configuration |
| PDA seed collisions | HIGH (architecture change) | Add user-specific components to seeds, migrate existing accounts to new PDA scheme |
| Unsafe CPI patterns | CRITICAL (rewrite + audit) | Remove or restrict CPI calls, implement proper validation, full audit before re-deployment |
| MEV sandwich attack at launch | MEDIUM (one-time loss) | Use anti-MEV platforms for future launches, implement slippage protections |
| Transaction compute limit too low | LOW | Increase compute unit limit in transaction, add 20% buffer |
| RPC rate limits hit | LOW | Add multiple RPC endpoints, implement request queuing and retry logic |
| Devnet accounts wiped | LOW (expected) | Rebuild state, use account snapshots, design for devnet impermanence |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing signer checks | Phase 1 (Foundation) | Security audit confirms all authority accounts have Signer type |
| Unrevoked authorities | Phase 1 (Foundation) | UI shows authority status; test confirms revocation succeeds |
| Integer overflow | Phase 1 (Foundation) | Cargo.toml has overflow-checks = true; arithmetic uses checked_* |
| Wrong token standard | Phase 1 (Foundation) | Decision matrix documents standard choice; wallet testing complete |
| Metadata update failures | Phase 1 (Foundation) | Token-2022 uses Metadata Pointer OR URIs are short; update tested |
| Missing ownership validation | Phase 1 (Foundation) | All Account types validated; security checklist confirms ownership checks |
| PDA seed collisions | Phase 1 (Foundation) | All PDAs include user-specific seeds; collision tests pass |
| Unsafe CPI patterns | Phase 1 (Foundation) | All CPIs validate program IDs; authority forwarding eliminated |
| MEV attacks at launch | Phase 2-3 (Advanced) | Anti-MEV platform integrated OR programmatic protections tested |
| Compute unit misconfiguration | Phase 1 (Foundation) | Transaction builder includes CU limits; congestion testing done |
| Keypair exposure | Phase 1 (Foundation) | Git history clean; key permissions verified; production keys secured |
| Devnet/mainnet confusion | Phase 1 (Foundation) | Network-specific configs separate; deployment tested on both networks |

## Sources

### Official Documentation & Guides
- [Solana Signer Authorization Course](https://solana.com/developers/courses/program-security/signer-auth) - Signer validation patterns
- [Zealynx Solana Security Checklist](https://www.zealynx.io/blogs/solana-security-checklist) - 45 critical security checks
- [Cantina: Securing Solana - A Developer's Guide](https://cantina.xyz/blog/securing-solana-a-developers-guide) - Comprehensive security risks

### Token Standards & Metadata
- [5 Differences Between SPL Token and Token-2022](https://smithii.io/en/difference-between-spl-token-and-token-2022/)
- [SPL Token vs Token-2022: Choosing the Right Standard](https://www.explica.co/spl-token-vs-token-2022-choosing-the-right-token-standard-for-your-project/)
- [Neodyme: Token-2022 Extensions Footguns](https://neodyme.io/en/blog/token-2022/)
- [DEXArea: Why Updating Token-2022 Metadata Often Fails](https://medium.com/@dexarea/why-updating-token-2022-metadata-often-fails-and-how-we-solved-it-at-dexarea-b0535a023842)
- [Metaplex: How to Diagnose Transaction Errors](https://developers.metaplex.com/guides/general/how-to-diagnose-solana-transaction-errors)

### Security & Rug Pull Prevention
- [Solana Token Security Guide](https://www.solana-token-creator.com/solana-token-security/)
- [Rug Pulls on Solana: Prevention and Detection Guide](https://www.gatedex.com/crypto-wiki/article/rug-pulls-on-solana-prevention-and-detection-guide-20260106)
- [Solidus Labs: Solana Rug Pulls & Pump-and-Dumps Report](https://www.soliduslabs.com/reports/solana-rug-pulls-pump-dumps-crypto-compliance)
- [3 Common Mistakes When Making a Solana Token](https://smithii.io/en/3-errors-when-make-a-solana-token/)

### MEV & Front-Running
- [Solana MEV Exposed: Sandwich Attacks Analysis](https://solanacompass.com/learn/accelerate-25/scale-or-die-at-accelerate-2025-the-state-of-solana-mev)
- [Blockworks: How Solana is Cutting MEV Snipers](https://blockworks.co/news/solana-cutting-mev-snipers)
- [Helius: What is MEV on Solana](https://www.helius.dev/blog/priority-fees-understanding-solanas-transaction-fee-mechanics)
- [Breaking Down MEV Sandwich Attacks: The B91 Bot Case Study](https://medium.com/@joel_28760/breaking-down-mev-sandwich-attacks-on-solana-the-b91-bot-case-study-3e1c1ba35556)

### Anchor Framework
- [Anchor: Missing Signer Validation](https://rareskills.io/post/anchor-signer)
- [Anchor Account Constraints](https://www.anchor-lang.com/docs/references/account-constraints)
- [QuickNode: How to Use Constraints in Anchor](https://www.quicknode.com/guides/solana-development/anchor/how-to-use-constraints-in-anchor)
- [Helius: Beginner's Guide to Building with Anchor](https://www.helius.dev/blog/an-introduction-to-anchor-a-beginners-guide-to-building-solana-programs)
- [Program Security with Anchor](https://medium.com/@ayushkmrjha/program-security-with-anchor-e18b92a04335)

### Transaction & Performance Optimization
- [Mastering Solana Transactions: Priority Fees and CU Optimization](https://bitmorpho.com/en/article/mastering-solana-transactions-reducing-failures-with-priority-fees-and-cu-optimization)
- [Solana Transaction Fees Documentation](https://solana.com/docs/core/fees)
- [QuickNode: Comprehensive Guide to Optimizing Solana Transactions](https://www.quicknode.com/guides/solana-development/transactions/how-to-optimize-solana-transactions)
- [RPC Fast: Real-Time RPC on Solana 2026](https://rpcfast.com/blog/real-time-rpc-on-solana)
- [InstantNodes: Solana RPC Rate Limits](https://instantnodes.io/articles/solana-rpc-rate-limits)

### Network & Infrastructure
- [Alchemy: Everything About Solana's Devnet](https://www.alchemy.com/overviews/solana-devnet)
- [What Is Solana Devnet? Devnet vs Testnet vs Mainnet](https://learn.backpack.exchange/articles/what-is-solana-devnet)
- [QuickNode: Understanding Rent on Solana](https://www.quicknode.com/guides/solana-development/getting-started/understanding-rent-on-solana)
- [Helius: Protect Your Solana API Keys](https://www.helius.dev/docs/rpc/protect-your-keys)

### PDA & Account Management
- [Solana Program Derived Addresses](https://solana.com/docs/core/pda)
- [QuickNode: How to Use PDAs in Anchor](https://www.quicknode.com/guides/solana-development/anchor/how-to-use-program-derived-addresses)
- [Anchor PDA Derivation Mismatch Issue #3724](https://github.com/solana-foundation/anchor/issues/3724)
- [RareSkills: Cost of Storage and Account Resizing](https://rareskills.io/post/solana-account-rent)

### Metadata & Token Management
- [Smithii: How to Make Immutable Solana Token](https://smithii.io/en/token-inmutable-solana/)
- [Solana Token Metadata Best Practices Guide](https://vocal.media/trader/solana-token-metadata-best-practices-and-resources-guide)
- [Metaplex Token Metadata Overview](https://developers.metaplex.com/token-metadata)
- [Token Extensions: Metadata Pointer](https://solana.com/developers/guides/token-extensions/metadata-pointer)

---
*Pitfalls research for: Solana Token Creation & Memecoin Projects*
*Researched: 2026-02-04*
*First Solana project - emphasis on security, anti-rug vectors, and beginner mistakes*
