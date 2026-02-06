# Roadmap: Solana Memecoin Factory

## Overview

This roadmap transforms a learning goal into a working Solana token creation tool through three phases. Phase 1 establishes security-first foundations with basic token creation and anti-rug controls. Phase 2 adds professional polish through Metaplex metadata, IPFS integration, and educational UX features. Phase 3 completes the toolset with burn mechanics and comprehensive documentation for class presentation. Each phase delivers verifiable user value while teaching Solana development end-to-end.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security Foundation** - Token creation with anti-rug authority controls
- [x] **Phase 2: Professional Metadata** - Metaplex integration, IPFS, and educational UX
- [ ] **Phase 3: Advanced Features & Delivery** - Burn mechanism and class deliverables

## Phase Details

### Phase 1: Security Foundation
**Goal**: Users can create SPL tokens on devnet with security-first authority controls that prevent rug pulls

**Depends on**: Nothing (first phase)

**Requirements**: TOKEN-01, SEC-01, SEC-02, CLI-01, CLI-02, CLI-03, CLI-04

**Success Criteria** (what must be TRUE):
  1. User can create SPL token with custom name (1-32 chars), symbol (1-10 chars), decimals (0-9), and supply via CLI prompts
  2. User receives cost estimation in SOL before transaction execution showing rent and fees
  3. Token mint authority is revoked after creation (supply cannot be increased)
  4. Token freeze authority is revoked after creation (no honeypot attacks possible)
  5. User receives transaction confirmation with Solana Explorer link showing created token
  6. CLI displays clear error messages with remediation steps when transactions fail

**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md - Project foundation: TypeScript setup, dependencies, module structure
- [x] 01-02-PLAN.md - Token core: SPL token creation with authority revocation
- [x] 01-03-PLAN.md - CLI integration: prompts, cost estimation, output formatting

### Phase 2: Professional Metadata
**Goal**: Tokens display with logos and descriptions in wallets/explorers, and CLI explains operations for educational value

**Depends on**: Phase 1

**Requirements**: TOKEN-02, TOKEN-03, TOKEN-04, SEC-03, SEC-04, CLI-05

**Success Criteria** (what must be TRUE):
  1. Token appears in Solana Explorer with name, symbol, description, and image (Metaplex metadata)
  2. Token logo uploaded to IPFS with permanent storage (accessible after creation)
  3. CLI displays step-by-step explanations during execution showing what each operation does
  4. User can view authority status dashboard showing which authorities are active/revoked
  5. User can optionally revoke metadata update authority to lock token name/symbol permanently
  6. User can run dry-run mode to preview all operations without spending SOL

**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md - IPFS service: Pinata integration for image and metadata JSON upload
- [x] 02-02-PLAN.md - Metadata service: Metaplex Token Metadata creation via Umi
- [x] 02-03-PLAN.md - Authority service: Status dashboard and metadata authority revocation
- [x] 02-04-PLAN.md - CLI integration: Educational output, dry-run mode, full metadata flow

### Phase 3: Advanced Features & Delivery
**Goal**: Complete token lifecycle with burn mechanism and deliverables ready for class presentation

**Depends on**: Phase 2

**Requirements**: ADV-01, DOC-01, DOC-02, DOC-03

**Success Criteria** (what must be TRUE):
  1. User can burn tokens from their wallet to reduce supply with on-chain verification
  2. Comprehensive README exists with setup instructions, usage examples, and architecture explanation
  3. Code walkthrough documentation explains Anchor program structure and security patterns
  4. Presentation deck prepared explaining project, learning outcomes, and live demo script

**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md - Burn mechanism: token burn logic, CLI command, educational UX
- [ ] 03-02-PLAN.md - Documentation: comprehensive README and code walkthrough
- [ ] 03-03-PLAN.md - Presentation: slide outline, demo script, and backup plans

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Foundation | 3/3 | Complete | 2026-02-05 |
| 2. Professional Metadata | 4/4 | Complete | 2026-02-05 |
| 3. Advanced Features & Delivery | 0/3 | Not started | - |
