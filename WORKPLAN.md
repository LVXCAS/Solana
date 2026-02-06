# Solana Memecoin Factory - Work Plan

## Project Overview

A CLI-based memecoin factory for Solana that enables users to create SPL tokens with full metadata, anti-rug features, and automated Raydium liquidity pools.

**Target Network:** Devnet (initially)
**Tech Stack:** Anchor Framework (Rust), TypeScript CLI, Raydium SDK, Metaplex SDK
**User Experience Level:** Intermediate blockchain developers

---

## Requirements Summary

### Core Token Creation
- SPL Token Classic standard (maximum compatibility)
- Configurable: name, symbol, decimals, total supply
- Metaplex Token Metadata for name/symbol/image
- Freeze mint authority post-creation (anti-rug)
- Image metadata stored on IPFS

### Liquidity Pool Creation
- Raydium CPMM pool creation (client-side via SDK)
- Initial liquidity in TOKEN/SOL pair
- Burn LP tokens after pool creation (permanent lock)
- Cost estimation before execution

### Anti-Rug Features
1. Freeze mint authority (supply cannot be increased)
2. LP token burn (liquidity cannot be removed)
3. Optional: Revoke metadata update authority
4. Token name/symbol validation and collision warnings

### Burn Mechanism
- Manual burn instruction
- Creator can burn tokens from their own wallet
- Reduces circulating supply

### CLI Interface
- Interactive prompts for token parameters
- Config file support (JSON) for automation
- Cost breakdown and confirmation before execution
- Multi-step workflow with failure recovery
- Environment switching (devnet/mainnet-beta)

---

## Architecture Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| Token Standard | SPL Token Classic | Universal wallet/DEX compatibility |
| Metadata | Metaplex Token Metadata | Ecosystem standard, broad support |
| Raydium Pool Type | CPMM (Constant Product) | Balance of cost (~0.3 SOL) and simplicity |
| Pool Creation Logic | Client-side in CLI | Reduces Anchor program complexity |
| LP Lock Mechanism | Burn LP tokens | Simplest, most trustworthy anti-rug |
| Burn Feature | Manual burn from wallet | Simple instruction, v1 appropriate |
| Image Storage | IPFS (nft.storage) | Decentralized, permanent, free tier |
| CLI Framework | Commander.js (TypeScript) | Matches Anchor client SDK ecosystem |
| Keypair Management | File path (Solana CLI format) | Consistent with `solana config` |

---

## Acceptance Criteria

### Token Creation Success
- ✅ Token appears in Solana Explorer with correct name, symbol, decimals, supply
- ✅ Metaplex metadata visible with working image URI
- ✅ Mint authority is null (verified on-chain)
- ✅ Image loads from IPFS gateway

### Pool Functionality
- ✅ Token tradeable on Raydium devnet UI
- ✅ Swap SOL → TOKEN works with expected slippage
- ✅ Price reflects initial liquidity ratio
- ✅ LP tokens burned (zero balance in creator wallet)

### Anti-Rug Verification
- ✅ Mint authority: null
- ✅ LP tokens: burned (supply check)
- ✅ Metadata update authority: revocable option works
- ✅ RugCheck-style scanner rates token as safe

### CLI Usability
- ✅ Every error has clear remediation message
- ✅ Cost estimate within 20% of actual spend
- ✅ Partial failure allows resume (idempotency)
- ✅ Works on macOS and Linux
- ✅ --help documentation for all commands

### Network Agnostic
- ✅ Config file switches devnet ↔ mainnet cleanly
- ✅ No hardcoded program IDs in code
- ✅ CLI validates network before executing

---

## Implementation Steps

### Phase 1: Project Setup & Anchor Program Foundation
**Files:** Initial project structure, Anchor program scaffold

1. **Initialize Anchor workspace**
   - Run `anchor init memecoin-factory --no-git`
   - Configure `Anchor.toml` for devnet cluster
   - Set up program ID generation

2. **Create Anchor program structure**
   - File: `programs/memecoin-factory/src/lib.rs`
   - Define program module and declare_id macro
   - Create `state/`, `instructions/`, `errors/` module structure

3. **Define token creation instruction**
   - File: `programs/memecoin-factory/src/instructions/create_token.rs`
   - Accounts: mint (init), metadata (init), payer, system/token programs
   - Logic: Initialize SPL mint, set decimals/supply, CPI to Metaplex for metadata
   - Freeze mint authority after creation

4. **Define burn instruction**
   - File: `programs/memecoin-factory/src/instructions/burn_tokens.rs`
   - Accounts: token account, mint, owner
   - Logic: CPI to SPL Token burn instruction

5. **Add custom errors**
   - File: `programs/memecoin-factory/src/errors.rs`
   - Define: InvalidTokenName, InvalidSupply, InvalidDecimals, etc.

6. **Build and deploy to devnet**
   - `anchor build`
   - `anchor deploy --provider.cluster devnet`
   - Save program ID to `Anchor.toml` and `lib.rs`

**Validation:** `anchor test` passes for basic token creation

---

### Phase 2: CLI Foundation & Token Creation
**Files:** TypeScript CLI package, Raydium/Metaplex SDK integration

7. **Initialize CLI package**
   - Create `cli/` directory at workspace root
   - Run `npm init` with TypeScript, Commander.js, @solana/web3.js v1
   - Install: `@project-serum/anchor`, `@solana/spl-token`, `@metaplex-foundation/mpl-token-metadata`

8. **Create configuration system**
   - File: `cli/src/config.ts`
   - Define `Config` interface: network, rpcUrl, programIds (Metaplex, Raydium)
   - Load from `config.json` with devnet/mainnet profiles
   - Environment variable override support

9. **Implement `create` command**
   - File: `cli/src/commands/create.ts`
   - Interactive prompts: name, symbol, decimals, supply, image URL
   - Validation: name 1-32 chars, symbol 1-10 chars, decimals 0-9, supply > 0
   - Token name collision check (search existing tokens)

10. **Implement token creation transaction builder**
    - File: `cli/src/services/token.ts`
    - Generate mint keypair
    - Build transaction calling Anchor program `create_token` instruction
    - Handle Metaplex metadata account derivation (PDA)
    - Return mint address on success

11. **Add cost estimation**
    - File: `cli/src/utils/cost.ts`
    - Calculate: rent for mint account, rent for metadata account, Metaplex fee (~0.01 SOL)
    - Display breakdown before execution
    - Require `--confirm` flag or interactive yes/no

12. **Implement image upload to IPFS**
    - File: `cli/src/utils/ipfs.ts`
    - Integration with nft.storage or Pinata API
    - Accept local file path or URL
    - Return IPFS URI for metadata

**Validation:** CLI creates token on devnet, visible in Solana Explorer with metadata

---

### Phase 3: Raydium Pool Creation (Client-Side)
**Files:** Raydium SDK integration, pool transaction builder

13. **Install Raydium SDK**
    - Add `@raydium-io/raydium-sdk-v2` to CLI dependencies
    - Configure for devnet program IDs

14. **Implement CPMM pool creation**
    - File: `cli/src/services/raydium.ts`
    - Function: `createCpmmPool(mint, baseLiquidity, quoteLiquidity)`
    - Build Raydium pool initialization instructions
    - Calculate initial price from liquidity amounts
    - Handle decimal mismatch (token decimals vs SOL 9 decimals)

15. **Add liquidity parameter validation**
    - Minimum liquidity check: equivalent to ~$100 SOL
    - Warning for liquidity > $10,000 SOL equivalent
    - Price display: "1 TOKEN = X SOL" with confirmation

16. **Implement LP token burn**
    - After pool creation, query LP token account
    - Build SPL Token burn instruction for 100% of LP tokens
    - Verify LP token balance is zero after burn

17. **Integrate pool creation into `create` command**
    - Add `--with-pool` flag to `create` command
    - Prompt for initial liquidity amounts (base TOKEN, quote SOL)
    - Execute pool creation after token creation succeeds
    - Handle multi-transaction workflow: token creation TX → pool creation TX → LP burn TX

18. **Add pool creation cost to estimation**
    - Update `cost.ts` to include Raydium CPMM fee (~0.3 SOL)
    - Add initial liquidity SOL amount to total cost
    - Display: "Fixed costs: X SOL, Liquidity: Y SOL, Total: Z SOL"

**Validation:** CLI creates token + pool on devnet, swappable on Raydium UI

---

### Phase 4: Anti-Rug Features & Burn Command
**Files:** Authority management, burn CLI command

19. **Verify mint authority freeze**
    - After token creation, query mint account
    - Assert mint authority is null
    - Add explicit log message: "✓ Mint authority frozen (supply locked)"

20. **Implement metadata update authority revocation**
    - File: Update `cli/src/services/token.ts`
    - Add `--revoke-metadata-authority` flag to `create` command
    - Build Metaplex UpdateAuthority instruction with new authority = null
    - Add warning: "This is permanent. Token name/symbol can never change."

21. **Create `burn` command**
    - File: `cli/src/commands/burn.ts`
    - Parameters: `--mint <address>` `--amount <number>`
    - Query user's token account for balance
    - Call Anchor program `burn_tokens` instruction
    - Display: "Burned X TOKEN. New supply: Y TOKEN."

22. **Add supply tracking**
    - After burn, query mint account for current supply
    - Display circulating supply reduction percentage

**Validation:** Mint authority null, metadata authority revocable, burn reduces supply

---

### Phase 5: Error Handling & Recovery
**Files:** Transaction retry logic, state recovery

23. **Implement transaction confirmation with retry**
    - File: `cli/src/utils/transaction.ts`
    - Function: `sendAndConfirmWithRetry(tx, commitment='confirmed')`
    - Exponential backoff: 3 attempts, 2s → 4s → 8s delay
    - Handle dropped transactions (check existing state before retry)

24. **Add idempotency checks**
    - Before creating token: check if mint keypair already exists on-chain
    - Before creating pool: check if pool for this token/SOL pair exists
    - If state exists, display current status and ask to resume or abort

25. **Implement failure recovery**
    - Save workflow state to temp file (`.memecoin-factory-state.json`)
    - On crash: detect incomplete state file on next run
    - Offer `--resume` flag to continue from last successful step
    - Steps: token created ✓ → pool created ✗ → resume creates pool only

26. **Enhance error messages**
    - Catch Anchor errors and provide human-readable translations
    - Example: "InsufficientFunds" → "Need X more SOL. Run: solana airdrop X"
    - Example: "TokenNameTooLong" → "Token name max 32 characters. Yours: Y"

**Validation:** CLI handles network failures gracefully, can resume partial operations

---

### Phase 6: Configuration, Validation & Documentation
**Files:** Config templates, input validation, README

27. **Create config file templates**
    - File: `cli/config.devnet.json`
    - File: `cli/config.mainnet.json`
    - Include: cluster URL, program IDs (Metaplex, Raydium, memecoin-factory)
    - Document: How to switch networks with `--config` flag

28. **Implement comprehensive input validation**
    - Token name: ASCII only, no reserved names (SOL, USDC, BTC), length 1-32
    - Symbol: ASCII uppercase, length 1-10
    - Decimals: 0-9 (recommend 6 or 9 for memecoins)
    - Supply: 1 to 1 trillion (warn above 100 billion)
    - Image URI: validate format, check reachability (optional)

29. **Add token name collision detection**
    - Query devnet/mainnet for existing tokens with same symbol
    - Use Solana RPC `getProgramAccounts` filtered by symbol metadata
    - Display warning if collision found: "⚠ Token 'DOGE' already exists at address X"

30. **Create CLI documentation**
    - File: `cli/README.md`
    - Document all commands: `create`, `burn`, flags, config
    - Include examples: basic token, token with pool, burn example
    - Prerequisites: Solana CLI installed, funded devnet wallet

31. **Add help text and examples**
    - Commander.js `.description()` and `.example()` for each command
    - `--help` output should be comprehensive
    - Include cost estimates in help text

**Validation:** `--help` is clear, validation prevents bad inputs, config switching works

---

### Phase 7: Testing & Mainnet Preparation
**Files:** Test suite, mainnet config

32. **Write Anchor program tests**
    - File: `tests/memecoin-factory.ts`
    - Test: Create token with valid metadata
    - Test: Burn tokens reduces supply
    - Test: Mint authority is null after creation
    - Run: `anchor test`

33. **Write CLI integration tests**
    - File: `cli/tests/integration.test.ts`
    - Test: Full workflow on devnet (requires SOL airdrop in test)
    - Test: Cost estimation accuracy (dry-run vs actual)
    - Test: Failure recovery (mock network failure mid-workflow)

34. **Create mainnet configuration**
    - File: `cli/config.mainnet.json`
    - Mainnet RPC URL (recommend Helius or QuickNode)
    - Mainnet program IDs for all dependencies
    - Warning banner: "MAINNET MODE - Real SOL will be spent"

35. **Add safety checks for mainnet**
    - If network is mainnet: require double confirmation
    - Display: "You are about to spend ~X SOL on mainnet. Type 'CONFIRM' to proceed:"
    - Prevent accidental mainnet deploys with `--i-know-what-im-doing` flag

36. **Conduct full end-to-end test**
    - On devnet: Create 3 different tokens with pools
    - Verify all on Solana Explorer and Raydium UI
    - Test burn command on all tokens
    - Document actual costs vs estimates

**Validation:** All tests pass, devnet E2E works, mainnet config ready (not deployed)

---

### Phase 8: Documentation & Polish
**Files:** Main README, architecture docs

37. **Create main project README**
    - File: `README.md` at workspace root
    - Sections: What it does, Features, Installation, Quick Start, Architecture
    - Include: Solana/Anchor version requirements, system requirements
    - Warnings: Regulatory disclaimers, "not financial advice", experimental software

38. **Document architecture**
    - File: `ARCHITECTURE.md`
    - Explain: Why client-side Raydium (vs on-chain CPI)
    - Explain: Multi-transaction workflow and failure recovery
    - Diagram: Token creation flow, Pool creation flow
    - List: All program IDs and account structures

39. **Add cost breakdown documentation**
    - File: `COSTS.md`
    - Table: Each operation and its SOL cost (devnet vs mainnet)
    - Example: Creating token with 1 SOL liquidity = X SOL total
    - Note: Priority fees during congestion can increase costs

40. **Create troubleshooting guide**
    - File: `TROUBLESHOOTING.md`
    - Common errors: "Transaction simulation failed", "Insufficient funds", "Network timeout"
    - Devnet faucet rate limiting solutions
    - Raydium pool not appearing in UI (indexer delay)

41. **Add CLI versioning and changelog**
    - File: `CHANGELOG.md`
    - Semantic versioning: v1.0.0 for initial release
    - CLI displays version with `--version` flag

**Validation:** Documentation is complete, new user can follow README to create token

---

## Risks & Mitigations

### Risk: Raydium SDK devnet unreliability
**Impact:** Pool creation may fail due to outdated devnet deployment
**Mitigation:** Test Raydium CPMM on devnet before Phase 3. If unreliable, add flag to skip pool creation and document manual pool setup.
**Verification:** Successfully create CPMM pool on devnet before implementation.

### Risk: Transaction size limit exceeded
**Impact:** Complex transactions with 15+ accounts may hit 1232-byte limit
**Mitigation:** Already designed as multi-transaction workflow (token creation TX → pool TX → burn TX). Monitor transaction sizes during testing.
**Verification:** Log transaction sizes during integration tests. Max should be <1000 bytes.

### Risk: Metaplex SDK breaking changes
**Impact:** New Metaplex SDK versions may have incompatible APIs
**Mitigation:** Pin exact SDK versions in `package.json`. Document SDK version requirements in README.
**Verification:** Lock `@metaplex-foundation/mpl-token-metadata` to specific version, test with that version.

### Risk: Insufficient devnet SOL for testing
**Impact:** Devnet faucet rate limits block development
**Mitigation:** Document faucet limitations. Consider local validator setup for heavy testing. Budget test SOL usage.
**Verification:** Test full workflow consumes ~2 SOL per run. Plan test runs accordingly.

### Risk: Decimal miscalculation in pool pricing
**Impact:** Token priced 1000x or 0.001x intended price
**Mitigation:** Explicit decimal handling in price calculation. Display price confirmation before pool creation. Add test cases for different decimal combinations (6, 9).
**Verification:** Test tokens with 6 decimals and 9 decimals, verify price calculation is accurate.

### Risk: Keypair exposure via CLI
**Impact:** Users may accidentally commit wallet keys to git
**Mitigation:** Never log keypair contents. Use Solana CLI standard keypair paths. Add `.gitignore` for common keypair files.
**Verification:** Code review for keypair logging. Test with dummy keypair, verify no exposure.

### Risk: Regulatory ambiguity
**Impact:** Tool could be used for securities violations
**Mitigation:** Add disclaimers in README and CLI output. No investment language. Document SEC/CFTC position on memecoins. Recommend legal counsel.
**Verification:** Disclaimers present in all user-facing documentation and CLI warnings.

---

## Verification Steps

### Post-Implementation Checklist

1. **Functional Verification**
   - [ ] Create 3 test tokens on devnet with different parameters
   - [ ] Create token with Raydium pool, verify tradeable
   - [ ] Burn tokens, verify supply reduction on-chain
   - [ ] Mint authority is null for all created tokens
   - [ ] LP tokens are burned (zero balance) after pool creation
   - [ ] Metadata update authority revocation works

2. **Error Handling Verification**
   - [ ] Simulate network timeout mid-creation, verify recovery
   - [ ] Attempt creation with insufficient SOL, verify clear error
   - [ ] Invalid token name (too long), verify validation error
   - [ ] Resume workflow after crash, verify idempotency

3. **Cost Verification**
   - [ ] Cost estimate matches actual spend within 20%
   - [ ] All costs documented in COSTS.md
   - [ ] Mainnet warning displays correctly

4. **Cross-Platform Verification**
   - [ ] Test on macOS (M1/M2 and Intel)
   - [ ] Test on Linux (Ubuntu 22.04+)
   - [ ] Keypair path resolution works on both platforms

5. **Documentation Verification**
   - [ ] New user follows README from scratch successfully
   - [ ] All commands have `--help` text
   - [ ] Troubleshooting guide addresses common errors

6. **Security Verification**
   - [ ] No keypair contents logged anywhere
   - [ ] `.gitignore` prevents keypair commits
   - [ ] Disclaimers present in README and CLI
   - [ ] Anti-rug features verified on-chain

---

## Dependencies

### Solana Environment
- Solana CLI: ≥1.18.0
- Anchor CLI: ≥0.30.0
- Rust: ≥1.75.0
- Node.js: ≥18.0.0

### NPM Packages (CLI)
- @solana/web3.js: ^1.95.0
- @project-serum/anchor: ^0.30.0
- @solana/spl-token: ^0.4.0
- @metaplex-foundation/mpl-token-metadata: ^3.2.0
- @raydium-io/raydium-sdk-v2: Latest
- commander: ^12.0.0
- nft.storage (or Pinata): Latest

### Rust Crates (Anchor Program)
- anchor-lang: 0.30.0
- anchor-spl: 0.30.0
- mpl-token-metadata: 4.1.0

---

## Timeline Estimate (Not a commitment)

This is a rough complexity breakdown, NOT a time estimate:

- **Phase 1:** Anchor program foundation - Moderate complexity
- **Phase 2:** CLI token creation - Moderate complexity
- **Phase 3:** Raydium integration - High complexity (most challenging)
- **Phase 4:** Anti-rug features - Low complexity
- **Phase 5:** Error handling - Moderate complexity
- **Phase 6:** Validation & config - Low complexity
- **Phase 7:** Testing - Moderate complexity
- **Phase 8:** Documentation - Low complexity

**Complexity Distribution:** ~60% in Phases 2-3 (CLI + Raydium), ~40% elsewhere

---

## Success Metrics

1. **Token Creation Success Rate:** 95%+ of valid inputs result in successful token creation on devnet
2. **Pool Creation Success Rate:** 90%+ of pool creation attempts succeed (lower due to Raydium devnet variability)
3. **Cost Accuracy:** Estimates within 20% of actual costs
4. **User Experience:** New user can create first token in <10 minutes following README
5. **Anti-Rug Verification:** 100% of created tokens pass automated rug-pull checks

---

## Out of Scope (Future Versions)

- Token-2022 support
- Burn-on-transfer mechanism
- Multiple DEX support (Orca, etc.)
- Web UI
- Batch token creation
- Multi-sig support for token authorities
- Token vesting schedules
- Mainnet deployment (v1 is devnet-focused)
- NFT collection creation
- Token utility features (staking, governance)

---

## Open Questions

None remaining - all critical decisions resolved during planning phase.

---

## Next Steps

1. Review this plan with stakeholder
2. Set up development environment (Solana CLI, Anchor, Rust)
3. Begin Phase 1: Initialize Anchor workspace
4. Prototype Raydium CPMM pool creation on devnet (de-risk Phase 3 early)

---

**Plan Created:** 2026-02-04
**Plan Version:** 1.0
**Target Completion:** Phased delivery, Phase 1-4 for MVP
