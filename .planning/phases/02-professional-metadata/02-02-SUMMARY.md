---
phase: 02-professional-metadata
plan: 02
subsystem: metadata
tags: [metaplex, umi, token-metadata, ipfs, spl-token]

# Dependency graph
requires:
  - phase: 02-01
    provides: IPFS upload service (uploadImage, uploadMetadata)
provides:
  - Metaplex metadata creation service (createTokenMetadata)
  - Extended TokenConfig with optional description/imagePath fields
  - On-chain metadata attachment using Umi createV1 helper
affects: [02-03, cli, token-creation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Umi framework for Metaplex operations"
    - "TokenStandard.Fungible for SPL tokens"
    - "Two-tier storage: image IPFS → metadata JSON IPFS → on-chain URI"

key-files:
  created:
    - src/services/metadata.ts
  modified:
    - src/lib/token.ts

key-decisions:
  - "Use Umi createV1 helper (not deprecated CreateMetadataAccountV3)"
  - "Set sellerFeeBasisPoints to 0 for fungible tokens"
  - "Make metadata fields optional in TokenConfig to preserve Phase 1 compatibility"

patterns-established:
  - "Error remediation hints for metadata creation failures"
  - "Upload image first, then metadata JSON with image URI"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase 2 Plan 02: Metadata Creation with Metaplex Summary

**Metaplex Token Metadata service using Umi createV1 for attaching on-chain metadata to SPL tokens with IPFS storage**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T21:36:59Z
- **Completed:** 2026-02-05T21:39:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created createTokenMetadata function using Metaplex Umi framework
- Integrated IPFS uploads (image → metadata JSON → on-chain URI)
- Extended TokenConfig with optional metadata fields (description, imagePath)
- Error handling with remediation hints for metadata creation failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Metaplex metadata service** - `68eb22d` (feat)
2. **Task 2: Add metadata config to TokenConfig** - `0bd33e5` (feat)

## Files Created/Modified
- `src/services/metadata.ts` - Metaplex metadata creation using Umi createV1, uploads image and JSON to IPFS, attaches on-chain metadata
- `src/lib/token.ts` - Extended TokenConfig interface with optional description and imagePath fields

## Decisions Made

**Use Umi createV1 helper (not deprecated CreateMetadataAccountV3)**
- Rationale: Research showed CreateMetadataAccountV3 is removed from mpl-token-metadata exports, createV1 is current standard

**Set sellerFeeBasisPoints to 0 for fungible tokens**
- Rationale: Required field for Metaplex metadata, 0% is standard for non-NFT tokens (not selling royalties)

**Make metadata fields optional in TokenConfig**
- Rationale: Preserves Phase 1 compatibility - tokens can still be created without metadata, metadata can be added optionally

**Transaction signature as metadata account reference**
- Rationale: Umi's sendAndConfirm returns transaction signature, serves as reference for metadata creation operation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - Metaplex dependencies were already installed in Plan 01, implementation followed research patterns directly.

## User Setup Required

None - metadata creation uses existing PINATA_JWT from Plan 01. No additional configuration required.

## Next Phase Readiness

**Ready for Plan 03 (CLI Integration):**
- ✓ Metadata service complete (createTokenMetadata)
- ✓ TokenConfig extended with optional metadata fields
- ✓ Error remediation hints following Phase 1 display.ts patterns
- ✓ IPFS integration tested in Plan 01

**Next steps:**
- Integrate metadata creation into CLI create command
- Add prompts for optional metadata (image path, description)
- Display metadata URIs and Solana Explorer links
- Show educational output during IPFS upload and metadata creation

**No blockers or concerns.**

---
*Phase: 02-professional-metadata*
*Completed: 2026-02-05*
