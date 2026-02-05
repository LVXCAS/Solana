# Requirements: Solana Memecoin Factory

**Defined:** 2026-02-04
**Core Value:** Understanding how Solana token creation works end-to-end by building a real, working tool

## v1 Requirements

### Token Creation

- [ ] **TOKEN-01**: Create SPL tokens with configurable name (1-32 chars), symbol (1-10 chars), decimals (0-9), and supply
- [ ] **TOKEN-02**: Add Metaplex metadata to tokens (name, symbol, description, image URI)
- [ ] **TOKEN-03**: Upload token logos to IPFS via Pinata API with permanent storage
- [ ] **TOKEN-04**: Display step-by-step explanations of each operation for educational transparency

### Security & Anti-Rug

- [ ] **SEC-01**: Revoke mint authority after token creation to prevent unlimited minting
- [ ] **SEC-02**: Revoke freeze authority to prevent honeypot attacks
- [ ] **SEC-03**: Optionally revoke metadata update authority to lock name/symbol permanently
- [ ] **SEC-04**: Display authority status dashboard showing which authorities are active/revoked

### CLI Interface

- [ ] **CLI-01**: Interactive prompts for token parameters with input validation
- [ ] **CLI-02**: Cost estimation before execution (rent + Metaplex fees in SOL)
- [ ] **CLI-03**: Transaction confirmation with Solana Explorer links
- [ ] **CLI-04**: Clear error messages with remediation steps (e.g., "Need X more SOL")
- [ ] **CLI-05**: Dry-run mode to preview operations without executing transactions

### Advanced Operations

- [ ] **ADV-01**: Burn mechanism to reduce token supply from creator's wallet

### Class Deliverables

- [ ] **DOC-01**: Comprehensive README with setup instructions, usage examples, architecture explanation
- [ ] **DOC-02**: Code walkthrough documentation explaining Anchor program structure
- [ ] **DOC-03**: Presentation deck for class explaining project and learning outcomes

## v2 Requirements

Deferred to post-class extensions.

### Advanced Features

- **BATCH-01**: Batch operations to create multiple tokens in sequence
- **MULTI-01**: Multi-stage workflow to resume partial token creations
- **POOL-01**: Raydium CPMM pool creation with initial liquidity
- **POOL-02**: Burn LP tokens after pool creation (liquidity lock)

### Platform Features

- **WEB-01**: Web UI for token creation instead of CLI
- **TOKEN2-01**: Support Token-2022 standard in addition to Classic SPL
- **DEX-01**: Support multiple DEXs (Orca, Jupiter) beyond Raydium

## Out of Scope

| Feature | Reason |
|---------|--------|
| Raydium pool integration (v1) | Too complex for 2-week timeline (40-60% of total effort), deferred to post-class |
| Web UI | CLI demonstrates core concepts better, adds frontend complexity, doubles timeline |
| Token-2022 | Only 40% wallet compatibility vs 99%+ for Classic SPL, not suitable for memecoins |
| Multiple DEX support | Each DEX has different API, scope creep, Raydium sufficient for learning |
| Client management features | Personal learning tool, not a service business |
| Bonding curve mechanism | Requires complex smart contract, 3-4 weeks minimum |
| Social features (charts, analytics) | Out of scope for token creation tool |
| Mainnet deployment (required) | Devnet demonstration sufficient for class, mainnet optional |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOKEN-01 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| CLI-01 | Phase 1 | Pending |
| CLI-02 | Phase 1 | Pending |
| CLI-03 | Phase 1 | Pending |
| CLI-04 | Phase 1 | Pending |
| TOKEN-02 | Phase 2 | Pending |
| TOKEN-03 | Phase 2 | Pending |
| TOKEN-04 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 2 | Pending |
| CLI-05 | Phase 2 | Pending |
| ADV-01 | Phase 3 | Pending |
| DOC-01 | Phase 3 | Pending |
| DOC-02 | Phase 3 | Pending |
| DOC-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16/16 (100%)
- Unmapped: 0

**Phase Distribution:**
- Phase 1 (Security Foundation): 7 requirements
- Phase 2 (Professional Metadata): 6 requirements
- Phase 3 (Advanced Features & Delivery): 3 requirements

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-05 after roadmap creation*
