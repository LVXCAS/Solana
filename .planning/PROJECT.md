# Solana Memecoin Factory

## What This Is

A command-line tool for creating SPL tokens (memecoins) on Solana with professional features including Metaplex metadata, anti-rug security controls, and a burn mechanism. Built with Anchor framework to demonstrate smart contract development, token standards, and blockchain security patterns. A learning project to master Solana development from the ground up.

## Core Value

Understanding how Solana token creation works end-to-end - from writing Anchor programs to token metadata to security controls - by building a real, working tool that creates tokens on devnet.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Token Creation & Metadata:**
- [ ] Create SPL tokens via Anchor program with configurable name, symbol, decimals, and supply
- [ ] Add Metaplex metadata (token name, symbol, description, image URI)
- [ ] Upload images to IPFS for permanent metadata storage
- [ ] Tokens visible in Solana Explorer with full metadata

**Security & Anti-Rug Features:**
- [ ] Freeze mint authority after creation (supply cannot be increased)
- [ ] Optional: Revoke metadata update authority (name/symbol locked permanently)
- [ ] Input validation (token name 1-32 chars, symbol 1-10 chars, valid decimals)

**Burn Mechanism:**
- [ ] Manual burn instruction to reduce token supply
- [ ] Creator can burn tokens from their own wallet
- [ ] Supply updates reflected on-chain

**CLI Tool:**
- [ ] Interactive prompts for token parameters (name, symbol, supply, etc.)
- [ ] Cost estimation before execution (rent + Metaplex fees)
- [ ] Clear error messages with remediation steps
- [ ] Configuration for devnet/mainnet switching

**Class Deliverables:**
- [ ] Live demo: Create token on devnet visible in Explorer
- [ ] Code walkthrough: Explain Anchor program architecture
- [ ] Documentation: Comprehensive README
- [ ] Presentation deck: Explain project and learning

### Out of Scope

- **Raydium pool integration** — Deferred to post-class extension (too complex for 2-week timeline)
- **Web UI** — CLI only for v1, frontend could come later
- **Token-2022 features** — Classic SPL tokens only, advanced features future work
- **Multiple DEX support** — Orca, Jupiter, etc. not in scope
- **Client management** — Personal learning tool, not a service business
- **Mainnet deployment for class** — Devnet demonstration sufficient, mainnet optional

## Context

**Academic Context:**
- High school computer science class project
- Deadline: Less than 2 weeks from start
- First Solana project (learning from scratch)
- Can reference existing Solana/Anchor patterns and tutorials

**Learning Objectives:**
- Understand Anchor program architecture and account management
- Learn SPL token standard and Metaplex metadata protocol
- Master token security patterns (authority management, anti-rug controls)
- Experience full Solana development workflow (programs, CLI, testing)

**Technical Environment:**
- Development tools ready: Rust, Anchor CLI, Solana CLI installed
- Target network: Devnet for class demo (mainnet-ready code)
- Local development on macOS

**Prior Work:**
- Detailed work plan already created (WORKPLAN.md in project root)
- Architecture decisions documented (SPL Classic, Metaplex metadata, client-side approach)

## Constraints

- **Timeline**: <2 weeks to working demo — aggressive scope required
- **Experience**: First Solana project — learning curve is real, need clear path
- **Deliverables**: Must produce working demo + documentation + presentation — time allocated accordingly
- **Network**: Devnet sufficient for class, mainnet optional — keep costs zero for development
- **Tech Stack**: Anchor + Rust + TypeScript CLI — matches ecosystem standards, good learning path
- **Complexity**: Raydium integration too risky for deadline — defer to phase 2

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SPL Token Classic over Token-2022 | Universal wallet/DEX compatibility, simpler for first project, ecosystem standard for memecoins | — Pending |
| Metaplex for metadata | Industry standard, well-documented, matches learning goals | — Pending |
| Defer Raydium to post-class | Pool creation is 40-60% of complexity, unsafe for 2-week deadline, can add after class | — Pending |
| CLI over web UI | Faster to build, fits timeline, demonstrates core concepts without frontend complexity | — Pending |
| Client-side approach | Anchor program handles token creation, CLI handles orchestration. Simpler than on-chain pool creation | — Pending |
| IPFS for image storage | Decentralized, permanent, free tier (nft.storage), standard for NFT/token metadata | — Pending |
| Devnet-first | Zero cost development, safe testing, meets class requirements. Mainnet config added but not required | — Pending |

---
*Last updated: 2026-02-04 after initialization*
