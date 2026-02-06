# Phase 2: Professional Metadata - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Metaplex metadata to tokens making them visible in wallets/explorers with logos and descriptions. Upload token images to IPFS for permanent storage. Add educational CLI output explaining operations for learning value. Provide authority status dashboard. Support dry-run mode to preview operations without execution.

Scope: Metadata integration (Metaplex + IPFS), educational UX, authority visibility, dry-run preview.

</domain>

<decisions>
## Implementation Decisions

### Metadata Input Flow

**All implementation choices delegated to Claude:**
- How description is collected (prompt, flag, or hybrid)
- How image is provided (file path, URL, or both)
- Whether metadata is required or optional
- How Pinata API keys are configured (env vars, config file, or hybrid)

**Expectation:** User provides description and image path/URL. System handles IPFS upload via Pinata seamlessly.

### Educational Output Style

**All implementation choices delegated to Claude:**
- Level of detail in step-by-step explanations (every operation vs key milestones)
- Focus of explanations (what's happening, why it matters, or both)
- Whether to include technical Solana concepts (PDAs, programs, accounts)
- Timing of educational output (during execution, after completion, or both)

**Expectation:** CLI teaches users what's happening as they create tokens. Appropriate for first-time Solana learners.

### Authority Dashboard Display

**All implementation choices delegated to Claude:**
- When dashboard appears (after creation, separate command, or both)
- Display format (table, list with icons, inline with colors)
- Which authorities to show (3 main ones vs comprehensive)
- Whether to show ownership of active authorities (public key, just active/revoked status, or "yours" indicator)

**Expectation:** Clear visibility into which authorities are active vs revoked. User understands security posture of created token.

### Dry-Run Behavior

**All implementation choices delegated to Claude:**
- What happens during dry-run (list operations, validate inputs, show mock output)
- Whether to include cost estimation in dry-run
- How dry-run output is visually differentiated from real execution
- Whether to validate external configs (Pinata API key) during dry-run

**Expectation:** User can preview entire token creation flow without spending SOL or making blockchain changes. Helps understand what will happen before committing.

### Claude's Discretion

All four discussion areas gave Claude full discretion. Implementation decisions for:
- Metadata input collection and validation
- Educational output depth, timing, and style
- Authority dashboard format and information density
- Dry-run behavior and output differentiation

These choices should be made based on:
- Best CLI UX practices
- What serves the learning goal (class project)
- Technical feasibility and implementation simplicity
- Consistency with Phase 1 patterns

</decisions>

<specifics>
## Specific Ideas

**User expectations:**
- This is a learning tool for a class project (not production memecoin launch tool)
- User wants to understand Solana token creation end-to-end
- Educational value matters - help them learn, don't just make it work
- Less than 2 weeks to working demo (keep scope tight)

**Technical context from Phase 1:**
- CLI already established with prompts + flags pattern
- Error handling already provides remediation steps
- chalk/ora already in use for styling/spinners
- Cost estimation pattern already exists (can extend)

No specific product references or "like X" requirements.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-professional-metadata*
*Context gathered: 2026-02-05*
