# Project Research Summary

**Project:** Solana Memecoin Factory - CLI Tool
**Domain:** Blockchain Token Creation Tools (Solana SPL Tokens)
**Researched:** 2026-02-04
**Confidence:** MEDIUM-HIGH

## Executive Summary

The Solana memecoin creation space in 2025-2026 is characterized by three critical decisions: using stable tooling (Anchor 0.32.1 + Web3.js 1.x) over bleeding-edge releases, choosing Classic SPL Token over Token-2022 for maximum wallet compatibility, and implementing anti-rug features (authority revocation) as core functionality rather than afterthoughts. The recommended approach is a CLI-first tool that provides educational transparency — showing users exactly what commands run and what accounts are created — rather than the "one-click magic" approach of competitors like Pump.fun and Smithii.

The primary risk vectors are security-related: missing signer authorization checks (caused the $326M Wormhole exploit), unrevoked mint/freeze authorities (affects 98.7% of Pump.fun tokens), and integer overflow vulnerabilities in Rust's release mode. Mitigation comes from following Anchor's security patterns (Signer types, ownership validation), making authority revocation mandatory, and enabling overflow checks in Cargo.toml. For a beginner building their first Solana project in <2 weeks, the recommended stack optimizes for learning clarity over cutting-edge features.

Research reveals that "complete" token creation involves 5-7 sequential steps (mint creation → metadata upload → metadata linkage → authority revocation → burn mechanism), which most GUI tools hide but a CLI tool should expose for educational value. The architecture follows a standard pattern: CLI (TypeScript) builds transactions that invoke an Anchor program (Rust), which makes Cross-Program Invocations (CPI) to immutable Solana programs (SPL Token, Metaplex Token Metadata). Total network cost for creating a token with metadata is approximately 0.00887 SOL ($0.15).

## Key Findings

### Recommended Stack

For a beginner-friendly, high-school-timeline project, the 2025-2026 Solana ecosystem requires careful version selection to avoid bleeding-edge instability while maintaining relevance. **Use Anchor 0.32.1** (stable, Oct 2025) instead of 1.0.0-rc.2 release candidate. **Use Web3.js 1.x** (1.95.7+) instead of 2.0 — the 2.0 release from Nov 2024 has breaking API changes incompatible with the Anchor ecosystem, making tutorials and examples unusable. **Use Classic SPL Token Program** instead of Token-2022 — wallet compatibility is 99%+ vs ~40%, and memecoins need liquidity over compliance features.

**Core technologies:**
- **Anchor 0.32.1**: Solana program framework — handles security boilerplate automatically, essential for beginner Rust developers, stable release with extensive documentation
- **TypeScript + Commander.js**: CLI framework — lightweight, beginner-friendly, faster learning curve than oclif for <2 week timeline
- **@solana/web3.js 1.x**: Solana client library — ecosystem compatibility beats 2.0's performance gains for learning projects
- **Metaplex Umi + mpl-token-metadata**: Token metadata — industry standard (99% adoption), required for wallet/explorer display
- **Bankrun**: Fast testing framework — 10x faster than solana-test-validator, enables rapid iteration critical for 2-week timeline
- **Pinata**: IPFS service — most common provider for metadata/image storage, free tier sufficient for development

**Critical version decisions:**
- Anchor 0.32.1 (NOT 1.0-rc): Stable beats cutting-edge for learning
- Web3.js 1.x (NOT 2.0): Ecosystem compatibility over performance
- Classic SPL (NOT Token-2022): Universal wallet support over advanced features
- Commander (NOT oclif): Speed to shipping over framework power

### Expected Features

Token creation tools have well-defined expectations from users familiar with platforms like Pump.fun, Smithii, and CoinFactory. Research reveals a clear separation between table stakes (must-have), differentiators (competitive advantage), and anti-features (commonly requested but problematic).

**Must have (table stakes):**
- **Basic token creation**: SPL token with name, symbol, decimals, supply (~0.02 SOL network cost)
- **Metadata support**: Metaplex Token Metadata linking to IPFS (~0.0054 SOL rent)
- **Image upload (IPFS)**: Permanent storage for logos, Pinata integration
- **Authority management**: Revoke mint authority (anti-rug), revoke freeze authority (anti-honeypot)
- **Wallet integration**: Filesystem keypair management for CLI workflow
- **Transaction confirmation**: Success/failure with explorer links

**Should have (competitive advantage):**
- **CLI-first interface**: Educational value — shows exact commands and operations. Differentiator vs GUI competitors
- **Burn mechanism**: Deflationary tokenomics demonstration, shows protocol-level operations
- **Revoke update authority**: Make metadata immutable (few tools expose this)
- **Dry-run mode**: Preview operations without spending SOL (safety + education)
- **Step-by-step explanations**: CLI output annotates what's happening (learning-focused)
- **Authority status dashboard**: Query and display current state of all authorities
- **Complete transparency**: Show transaction signatures, accounts, fees — no "magic"

**Defer (v2+):**
- **Raydium pool creation**: Requires significant liquidity (thousands in SOL), 3-4 weeks work, out of 2-week timeline scope
- **Bonding curve mechanism**: Pump.fun-style feature requires smart contract deployment, price discovery logic (3-4 weeks minimum)
- **Web UI**: Dilutes learning objective, many competitors already exist, adds frontend complexity
- **Token-2022 support**: Limited ecosystem support (~40% wallet compatibility), not needed for memecoins
- **Multi-DEX integration**: Each DEX has different APIs (Jupiter, Orca, Raydium), testing nightmare
- **Price tracking/charts**: Different problem domain, specialized tools exist (Birdeye, DexScreener)

**Feature dependencies identified:**
- Metadata requires token creation first (need mint address)
- Metadata requires image upload first (metadata JSON references image URI)
- Authority revocation requires token creation (authorities must exist)
- Burn mechanism requires token accounts (must have tokens to burn)
- Authority dashboard requires metadata support (displays both SPL and Metaplex authorities)

### Architecture Approach

The standard architecture for Solana token creation follows a clear off-chain/on-chain separation: CLI (TypeScript) handles user interaction and IPFS integration, builds transactions that invoke an Anchor program (Rust on-chain), which makes Cross-Program Invocations (CPI) to immutable Solana programs (SPL Token, Metaplex). Account relationships follow Solana's Program Derived Address (PDA) model: mint account (PDA) owns metadata account (PDA derived from mint) and token accounts (ATAs for each holder).

**Major components:**
1. **CLI Layer (TypeScript)**: Commands (create, burn, info), IPFS uploader (Pinata SDK), RPC client (@solana/web3.js), transaction builder
2. **Anchor Program (Rust on-chain)**: Instructions (create_token, burn_tokens, configure), state management (token_config accounts), CPI coordination to SPL/Metaplex
3. **Core Solana Programs (immutable)**: SPL Token Program (mint, burn, transfer), Metaplex Token Metadata (metadata accounts), Associated Token Account Program (deterministic addresses)
4. **External Services**: IPFS (Pinata) for metadata/image storage, RPC providers for network access

**Critical architectural patterns:**
- **PDA as mint authority**: Program Derived Address serves as both mint address and authority, enabling programmatic control via CPI without external private keys
- **Metadata creation via CPI**: Single transaction creates mint + metadata atomically (ensures both succeed or both revert)
- **CLI → RPC → Program flow**: CLI validates input and uploads to IPFS, builds transaction, sends to RPC which invokes program

**Build order dependencies:**
1. Anchor program skeleton + basic mint creation (foundation)
2. IPFS upload service + Metaplex integration (metadata layer)
3. CLI commands + user experience (interface)
4. Authority revocation + burn mechanism (anti-rug features)

Rationale: Can't create metadata without a mint. Can't build useful CLI without knowing program's interface. Anti-rug features depend on understanding full token lifecycle.

**Rent costs summary:**
- Mint account: ~0.00144 SOL
- Metadata account: ~0.0054 SOL
- Creator's ATA: ~0.00203 SOL
- **Total per token: ~0.00887 SOL (~$0.15 at $17/SOL)**

### Critical Pitfalls

Research identified 12 critical pitfalls, with security issues dominating. The top 5 by severity and likelihood:

1. **Missing signer authorization checks** — Programs validate account addresses without verifying is_signer status, enabling impersonation attacks. Root cause of $326M Wormhole exploit. **Prevention:** Use Anchor's Signer<'info> type for all authority accounts, never use UncheckedAccount for authorities, verify account_info.is_signer in native Rust programs.

2. **Unrevoked mint/freeze authority** — Leaving authorities enabled post-launch creates rug pull vectors. Affects 98.7% of Pump.fun tokens and 93% of Raydium pools. **Prevention:** Revoke mint authority immediately after initial supply, revoke freeze authority unless compliance-required, make revocation mandatory in program logic.

3. **Integer overflow without checked arithmetic** — Rust's release mode (which Solana uses) doesn't check overflow by default. Single overflow enables unlimited minting. **Prevention:** Enable overflow-checks = true in Cargo.toml release profile, use checked_add/checked_sub methods, validate numeric inputs before operations.

4. **Wrong token standard (Token-2022 vs SPL)** — Token-2022 has ~40% wallet compatibility vs 99%+ for Classic SPL. Using Token-2022 for memecoins kills liquidity. **Prevention:** Use Classic SPL for memecoins/community tokens, reserve Token-2022 for regulated assets requiring compliance features, test wallet compatibility before mainnet.

5. **Missing account ownership validation** — Programs fail to verify accounts are owned by expected programs, accepting malicious attacker-controlled accounts. **Prevention:** Verify account.owner == expected_program_id before processing, use Anchor's Account<'info, T> type for automatic validation, add owner constraints to all external accounts.

**Additional high-severity pitfalls:**
- **PDA seed collisions**: Use user-specific seeds (include wallet pubkey) to prevent account hijacking
- **Unsafe CPI patterns**: Never forward user wallet signers to CPIs, validate target program IDs before invocation
- **Keypair exposure**: Never commit keys to git, use .gitignore for *.json keypairs, filesystem permissions chmod 600
- **Compute unit misconfiguration**: Set explicit CU limits with 20% buffer, include priority fees during congestion
- **MEV sandwich attacks**: Use anti-MEV platforms or programmatic protections at launch (>$500M extracted in 16 months)

**Technical debt patterns to avoid:**
- Skipping overflow-checks in Cargo.toml: NEVER acceptable (complete vulnerability)
- Using UncheckedAccount for authorities: NEVER acceptable (security risk)
- Keeping mint authority "just in case": Only with transparent multi-sig governance
- Same keypair for dev/prod: NEVER acceptable (credential exposure)
- Default compute unit limits: Only acceptable on devnet with low traffic

## Implications for Roadmap

Based on research findings, the project naturally divides into 3 phases structured around dependencies, risk mitigation, and learning progression. Security and foundation must come first (Phase 1), followed by metadata and user experience enhancements (Phase 2), with advanced features deferred (Phase 3+).

### Phase 1: Core Token Creation + Security Foundation

**Rationale:** Security patterns must be architectural from day one — retrofitting is difficult/impossible. Basic token creation without metadata is sufficient for initial validation. All critical security pitfalls (signer checks, overflow protection, authority management) must be addressed in foundation.

**Delivers:**
- Functional CLI that creates SPL tokens on devnet
- Anchor program with create_token instruction
- Mint authority revocation (anti-rug)
- Freeze authority revocation (anti-honeypot)
- Wallet integration (filesystem keypair management)
- Transaction confirmation with explorer links

**Addresses features from FEATURES.md:**
- Basic token creation (table stakes)
- Authority management (table stakes)
- Wallet integration (table stakes)
- CLI interface (differentiator)
- Transaction confirmation (table stakes)

**Avoids pitfalls from PITFALLS.md:**
- Missing signer authorization checks (Signer<'info> types mandatory)
- Integer overflow (overflow-checks = true in Cargo.toml from start)
- Missing account ownership validation (Anchor Account types with constraints)
- PDA seed collisions (user pubkey in all seeds)
- Unsafe CPI patterns (program ID validation before CPI)
- Keypair exposure (gitignore setup, secure key management documented)
- Compute unit misconfiguration (CU limits in transaction builder)
- Devnet/mainnet confusion (network-specific configs from start)

**Uses stack elements from STACK.md:**
- Anchor 0.32.1 for program framework
- @solana/web3.js 1.x for RPC client
- @solana/spl-token for token operations
- Commander.js for CLI framework
- TypeScript for type safety
- Bankrun for fast testing

**Implementation notes:**
- Focus on devnet deployment first
- Test with small token amounts (1000 supply for testing)
- Document all authority states explicitly
- Build transaction retry logic early

### Phase 2: Metadata + User Experience Polish

**Rationale:** Token without metadata appears blank in wallets — not usable for real users. IPFS integration requires external service setup (Pinata), which is independent of Phase 1 work. Authority status dashboard and dry-run mode enhance UX without changing core security model.

**Delivers:**
- IPFS integration via Pinata (metadata + image upload)
- Metaplex Token Metadata creation via CPI
- Revoke update authority (metadata immutability)
- Authority status dashboard (query and display)
- Dry-run mode (preview without spending SOL)
- Step-by-step CLI explanations
- Complete transparency (show all account addresses, signatures, fees)

**Addresses features from FEATURES.md:**
- Metadata support (table stakes)
- Image upload IPFS (table stakes)
- Revoke update authority (differentiator)
- Authority status dashboard (differentiator)
- Dry-run mode (differentiator)
- Step-by-step explanations (differentiator)
- Complete transparency (differentiator)

**Implements architecture from ARCHITECTURE.md:**
- Metadata creation via CPI pattern
- IPFS uploader service component
- CLI → RPC → Program flow completion
- Account relationship structure (mint → metadata → token accounts)

**Uses stack elements from STACK.md:**
- Metaplex Umi + mpl-token-metadata
- Pinata SDK for IPFS
- anchor-spl for Metaplex CPI

**Implementation notes:**
- Upload image to IPFS first, then metadata JSON with image URI
- Metadata PDA derived from mint address (standard Metaplex pattern)
- Test with various image sizes (metadata URI length matters for Token-2022 if added later)
- Cache metadata URIs for dry-run mode

### Phase 3: Advanced Token Operations

**Rationale:** Burn mechanism demonstrates protocol-level operations and deflationary tokenomics without changing core security model. Multi-stage workflow and batch operations improve UX for power users. This phase can be time-boxed — if timeline runs short, these features can be deferred.

**Delivers:**
- Burn mechanism (BurnChecked instruction)
- Multi-stage workflow guide (create → metadata → anti-rug → burn)
- Batch operations (create multiple tokens from config)
- Token airdrop helper (distribute to multiple addresses)
- Supply information display

**Addresses features from FEATURES.md:**
- Burn mechanism (differentiator — shows advanced operations)
- Supply information (table stakes)
- Batch operations (v1.x feature)
- Token airdrop helper (v1.x feature)

**Avoids pitfalls from PITFALLS.md:**
- None specific to burn operations (uses validated patterns from Phase 1)

**Implementation notes:**
- Burn requires existing token accounts with balance
- Test burn with small amounts first
- Document supply changes clearly
- Optional: Add burn statistics (total burned, % of supply)

### Phase 4+: Future Enhancements (Defer)

**Not recommended for initial 2-week timeline:**
- Raydium pool creation (requires liquidity management, AMM understanding — 3-4 weeks)
- Bonding curve mechanism (requires smart contract, price discovery — 3-4 weeks)
- Web UI (dilutes learning objective, adds complexity — 2+ weeks)
- Token-2022 support (limited wallet compatibility, not suitable for memecoins — 1 week)
- Multi-DEX integration (each DEX different API, testing burden — 2+ weeks)
- Price tracking/charts (different problem domain — 1+ week)

These features are documented in FEATURES.md as v2+ deferred features. Focus on core functionality and security for v1.

### Phase Ordering Rationale

**Why this sequence:**
1. **Phase 1 (Security Foundation) must come first** because security patterns are architectural — retrofitting signer checks, PDA design, or CPI validation is difficult or impossible after initial implementation. The 12 pitfalls identified in research show that security mistakes are permanent (require new token creation or program rewrite).

2. **Phase 2 (Metadata) depends on Phase 1** because metadata accounts require a mint address to derive their PDA. IPFS integration is independent (off-chain service) so it doesn't block Phase 1 progress. UX enhancements (dashboard, dry-run) build on working token creation.

3. **Phase 3 (Advanced Operations) is optional enhancement** that demonstrates protocol knowledge but isn't required for functional token creation. Can be time-boxed or deferred if 2-week timeline is tight.

**Architecture-driven grouping:**
- Phase 1: On-chain program core (instructions, security patterns, PDA design)
- Phase 2: Integration layer (IPFS, Metaplex CPI, UX features)
- Phase 3: Advanced operations (burn, batch, distribution)

**Risk-driven ordering:**
- Critical pitfalls (signer checks, overflow, authority management) addressed in Phase 1
- Moderate risks (metadata immutability, UX clarity) addressed in Phase 2
- Low risks (burn operations using validated patterns) in Phase 3

**Dependency-driven flow:**
```
Phase 1: Mint creation → Authority revocation
    ↓
Phase 2: Metadata (requires mint) → IPFS (requires metadata structure)
    ↓
Phase 3: Burn (requires token accounts) → Batch (requires working create)
```

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Metadata integration)**: Metaplex CPI patterns and account structure need API research. IPFS pinning service comparison (Pinata vs alternatives). Research recommendation: 1-2 hours on Metaplex docs.
- **Phase 3 (Burn mechanism)**: BurnChecked instruction specifics and supply accounting. Research recommendation: 30 minutes on SPL Token burn docs.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Anchor program structure, SPL Token basics, PDA patterns are well-documented in STACK.md and ARCHITECTURE.md. Follow established patterns from Anchor docs and security checklist.
- **Phase 2 (IPFS/UX)**: Pinata integration is straightforward REST API. Dry-run mode is transaction simulation (standard @solana/web3.js pattern).

**Research confidence by phase:**
- Phase 1: HIGH (security patterns well-documented, multiple official sources)
- Phase 2: MEDIUM (Metaplex specifics need validation, IPFS service comparison)
- Phase 3: MEDIUM-HIGH (burn operations documented, batch patterns are application of Phase 1)

**Recommended approach:**
- Phase 1: Start implementation using STACK.md + ARCHITECTURE.md + PITFALLS.md as reference
- Phase 2: Run focused research on Metaplex CPI when starting metadata work
- Phase 3: Light research on burn mechanics, likely 30-minute spike

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Verified from official docs (Anchor, Solana, Metaplex) and npm registries. Version numbers current as of Feb 2026. Web3.js 2.0 vs 1.x decision based on ecosystem state analysis. CLI framework choice (Commander vs oclif) is judgment call but well-reasoned. |
| Features | **MEDIUM** | Table stakes features verified across multiple competitor platforms (Pump.fun, Smithii, CoinFactory). Differentiators based on educational angle unique to project. Anti-features identified from community pitfall discussions. MVP scope is opinionated but aligned with 2-week timeline. |
| Architecture | **MEDIUM** | PDA patterns, CPI flows, and account relationships verified from official Solana/Anchor docs. Project structure follows Anchor best practices. Integration points (IPFS, Metaplex) require validation during implementation. Rent cost calculations based on current network parameters. |
| Pitfalls | **HIGH** | 12 critical pitfalls sourced from security audits (Neodyme, Cantina), official Solana courses, and documented exploits (Wormhole). Prevention strategies verified against Anchor security patterns. Phase mapping shows when each pitfall must be addressed. Warning signs are specific and actionable. |

**Overall confidence:** **MEDIUM-HIGH**

Confidence is high on security concerns (well-documented exploits and prevention patterns), stack selection (verified current versions), and architectural patterns (official documentation). Confidence is medium on feature prioritization (judgment-based, not validated with target users) and implementation complexity estimates (timeline assumptions for first-time Solana developer).

### Gaps to Address

**During Phase 1 planning:**
- **Compute unit requirements for create_token instruction**: Estimate 200K CU based on similar operations, but must measure actual usage during testing. Add 20% buffer. (Verified in implementation)
- **Bankrun setup for Anchor 0.32.1**: Confirm compatibility with current Anchor version. Documentation shows 0.5.0+ supports Anchor 0.32, but test early. (Validated during setup)
- **Transaction retry strategy**: Research doesn't specify optimal backoff timing. Recommend exponential backoff starting at 1 second, max 5 retries. (Defined during implementation)

**During Phase 2 planning:**
- **Pinata rate limits on free tier**: Research shows free tier exists but not specific limits. May need to throttle uploads or handle 429 responses. (Validated when hitting limits)
- **Metaplex metadata account size**: Research shows ~0.0054 SOL but varies by metadata length. Measure actual rent costs with test metadata. (Measured during testing)
- **Umi vs older Metaplex SDK migration**: STACK.md recommends Umi (current standard) but some code examples use deprecated @metaplex-foundation/js. Confirm API differences. (Resolved: use Umi exclusively)

**During Phase 3 planning:**
- **Burn mechanism authority requirements**: Need to verify if burn requires mint authority or just token account owner authority. SPL docs indicate owner authority sufficient. (Confirmed: owner authority)

**For future consideration (not blocking):**
- **Web3.js 2.0 migration path**: Research identifies 2.0 is future but 1.x recommended for v1. Document breaking changes for eventual upgrade (6-12 months). (Deferred to v2)
- **Raydium integration complexity**: Deferred to v2+, but research identifies as "high" complexity. If added later, plan 1-week spike for liquidity pool creation patterns. (Out of scope v1)
- **Token-2022 adoption timeline**: Research shows 40% wallet compatibility in 2026. Monitor for increased adoption that might justify future support. (Monitoring only)

**Validation strategy:**
- Critical gaps (compute units, Bankrun compatibility, retry strategy) block progress → address in Phase 1 week 1
- Important gaps (Pinata limits, metadata size, Umi API) affect UX → address in Phase 2 start
- Minor gaps (burn authority details) can be resolved during implementation → just-in-time research

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- Anchor Framework Documentation (https://www.anchor-lang.com/docs) — Program structure, security patterns, CPI
- Solana Documentation (https://solana.com/docs) — Core concepts, transactions, PDAs, fees
- SPL Token Program Docs (https://spl.solana.com/token) — Token operations, Classic SPL vs Token-2022
- Metaplex Developer Hub (https://developers.metaplex.com/) — Token Metadata, Umi framework
- Solana Security Courses (https://solana.com/developers/courses/program-security/) — Signer validation, authority patterns

**Package Registries:**
- npm: @solana/web3.js (https://www.npmjs.com/package/@solana/web3.js) — Version 1.95.7+ verified
- npm: @solana/spl-token (https://www.npmjs.com/package/@solana/spl-token) — Version 0.4.14+ verified
- npm: anchor-bankrun (https://www.npmjs.com/package/anchor-bankrun) — Version 0.5.0+ verified
- GitHub: Anchor Releases (https://github.com/solana-foundation/anchor/releases) — Anchor 0.32.1 vs 1.0.0-rc.2

### Secondary (MEDIUM confidence)

**Security Research:**
- Zealynx Solana Security Checklist (https://www.zealynx.io/blogs/solana-security-checklist) — 45 critical security checks
- Cantina: Securing Solana Developer Guide (https://cantina.xyz/blog/securing-solana-a-developers-guide) — Comprehensive security risks
- Neodyme: Token-2022 Extensions Footguns (https://neodyme.io/en/blog/token-2022/) — Metadata update failures
- Solidus Labs: Solana Rug Pulls Report (https://www.soliduslabs.com/reports/solana-rug-pulls-pump-dumps-crypto-compliance) — 98.7% Pump.fun tokens with authorities

**Technical Guides:**
- QuickNode: Create SPL Token with Metaplex (https://www.quicknode.com/guides/solana-development/spl-tokens/) — Metadata integration
- Helius: Web3.js 2.0 Developer Guide (https://www.helius.dev/blog/how-to-start-building-with-the-solana-web3-js-2-0-sdk) — Why NOT to use 2.0
- RareSkills: Metaplex Token Metadata Explained (https://rareskills.io/post/metaplex-token-metadata) — Architecture patterns
- QuickNode: Bankrun Testing Guide (https://www.quicknode.com/guides/solana-development/tooling/bankrun) — Fast testing

**Competitor Analysis:**
- Pump.fun ecosystem analysis (https://www.solflare.com/ecosystem/pump-fun) — Bonding curve mechanics
- Smithii token generator review (https://smithii.io/en/solana-token-generator/) — Feature comparison
- Backpack: Create Meme Coin Guide (https://learn.backpack.exchange/articles/launch-a-meme-coin-on-solana) — Step-by-step process
- Bitbond: Top Solana Token Creators (https://www.bitbond.com/resources/top-solana-token-creators/) — Market landscape

### Tertiary (LOW confidence)

**Community Examples:**
- GitHub: techleadhd/memecoin-maker — Example CLI implementation (not audited)
- GitHub: septa-ma/solana-token — Token creation CLI patterns
- Medium: Inside Solana's Developer Toolbox 2025 — Ecosystem overview (opinion piece)
- DEV Community: Solana Wallet Management TypeScript — Key handling patterns

**MEV Research:**
- Solana Compass: MEV Sandwich Attacks Analysis — $500M extraction figure
- Blockworks: Solana Cutting MEV Snipers — Anti-MEV platform discussion
- Medium: B91 Bot Case Study — Wide sandwich attack patterns

---
*Research completed: 2026-02-04*
*Ready for roadmap: Yes*
*Overall confidence: MEDIUM-HIGH*
*Next step: Requirements definition with roadmapper agent*
