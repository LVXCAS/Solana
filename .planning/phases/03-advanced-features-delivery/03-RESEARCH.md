# Phase 3: Advanced Features & Delivery - Research

**Researched:** 2026-02-06
**Domain:** SPL Token Burn, Technical Documentation, Educational Presentations
**Confidence:** HIGH

## Summary

Phase 3 completes the token lifecycle with burn functionality and comprehensive deliverables for class presentation. Research reveals a mature SPL token burn mechanism using `@solana/spl-token`'s `burn()` function, which permanently decrements supply by destroying tokens from a holder's account. The burn instruction requires the token account address (not wallet), mint address, owner authorization, and amount multiplied by 10^decimals.

Documentation research shows README best practices emphasize quick-start accessibility (setup in <10 minutes), progressive structure (intro → install → usage → contribute), and liberal use of examples. Code walkthroughs for educational contexts benefit from teaching "why" over "what" - explaining architectural decisions and security rationale rather than just implementation mechanics.

Presentation research for 2026 emphasizes mobile-first design (70% of initial views on mobile), demo-driven content over slides, and chapter-based scripting ("Let's look at how this works...") that feels conversational rather than formal. For technical class presentations, the pattern is: problem → solution approach → live demo → learning outcomes.

**Primary recommendation:** Implement burn command following existing CLI patterns (educational spinners, cost estimation, confirmation), create README with 3-tier structure (quick-start → detailed usage → architecture), write code walkthrough as "learning journey" document explaining security decisions, and build presentation deck optimized for live demo with chapter transitions rather than dense slides.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @solana/spl-token | 0.4.x (existing) | burn() function for token destruction | Official SPL Token Program bindings, only way to reduce supply on-chain |
| @solana/web3.js | 1.x (existing) | Transaction building, ATA resolution | Already in Phase 1-2, handles versioned transactions |
| @inquirer/prompts | 10.x (existing) | Confirmation prompts for dangerous actions | Already used for token creation, supports validation |
| chalk | 5.x (existing) | Red warnings for destructive operations | Already integrated, users expect consistent styling |
| ora | 8.x (existing) | Progress indicators during burn | Existing educational spinner pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| markdown-it | 14.x | Documentation generation (optional) | If generating HTML from markdown docs |
| reveal.js | 5.x | Presentation framework (optional) | If building web-based presentation instead of slides |
| @types/jest | 29.x | Type definitions for testing | If implementing automated testing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual markdown | Docusaurus/MkDocs | Overkill for single README, adds build complexity |
| PowerPoint/Keynote | reveal.js/Slidev | Web-based is more developer-friendly but requires HTML/CSS skills |
| Manual testing | Jest integration tests | Automated tests add value but consume timeline (< 2 weeks constraint) |
| CLI burn command | Web UI burn interface | CLI maintains consistency, web UI adds complexity |

**Installation (no new dependencies needed):**
```bash
# All required libraries already installed in Phase 1-2
# Optional for testing:
npm install --save-dev jest ts-jest @types/jest
```

## Architecture Patterns

### Recommended File Structure
```
src/
├── commands/
│   ├── create.ts          # Existing token creation (Phase 1-2)
│   └── burn.ts            # NEW: Token burn command
├── lib/
│   ├── token.ts           # Existing token operations
│   └── burn.ts            # NEW: Burn operation logic
├── utils/
│   └── educational.ts     # Existing, add burn explanation

docs/
├── README.md              # NEW: Comprehensive project documentation
├── CODE_WALKTHROUGH.md    # NEW: Learning-oriented code explanation
└── ARCHITECTURE.md        # NEW: System design and security decisions

presentation/
├── demo-script.md         # NEW: Live demo script with chapter transitions
├── slides/                # NEW: Presentation materials
│   ├── 01-intro.md        # Problem statement and motivation
│   ├── 02-solution.md     # Approach and architecture
│   ├── 03-demo.md         # Live demo transition slide
│   └── 04-learning.md     # Outcomes and reflection
└── assets/                # Screenshots, diagrams, token examples
```

### Pattern 1: Token Burn Implementation
**What:** Permanently destroy tokens from holder's account, reducing supply
**When to use:** User wants to make token deflationary or remove excess supply
**Example:**
```typescript
// Source: https://solana-labs.github.io/solana-program-library/token/js/functions/burn.html
// Source: https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-burn-spl-tokens-on-solana
import { burn, getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

async function burnTokens(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: Keypair,
  amount: number,
  decimals: number
) {
  // Get the token account address (ATA)
  const tokenAccount = await getAssociatedTokenAddress(
    mint,
    owner.publicKey
  );

  // Burn tokens (amount must be multiplied by 10^decimals)
  const signature = await burn(
    connection,
    payer,              // Fee payer
    tokenAccount,       // Token account (NOT wallet address)
    mint,               // Mint address
    owner,              // Owner/signer
    amount * Math.pow(10, decimals)  // Amount with decimals
  );

  return signature;
}
```

### Pattern 2: Dangerous Action Confirmation
**What:** Multi-step confirmation for irreversible operations with clear warnings
**When to use:** Token burning, authority revocation, or any permanent action
**Example:**
```typescript
// Source: https://medium.com/design-bootcamp/a-ux-guide-to-destructive-actions-their-use-cases-and-best-practices-f1d8a9478d03
import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';

async function confirmDangerousAction(
  action: string,
  details: string,
  confirmationPhrase: string
): Promise<boolean> {
  // First warning with details
  console.log(chalk.red.bold(`\n⚠️  DANGEROUS ACTION: ${action}\n`));
  console.log(chalk.yellow(details));
  console.log(chalk.gray('\nThis action is PERMANENT and IRREVERSIBLE.\n'));

  // Initial confirmation
  const firstConfirm = await confirm({
    message: 'Do you understand this cannot be undone?',
    default: false,
  });

  if (!firstConfirm) return false;

  // Type-to-confirm for critical operations
  const typed = await input({
    message: `Type "${confirmationPhrase}" to confirm:`,
    validate: (value) => {
      if (value === confirmationPhrase) return true;
      return `Please type "${confirmationPhrase}" exactly`;
    },
  });

  // Final confirmation
  const finalConfirm = await confirm({
    message: chalk.red(`FINAL CONFIRMATION: ${action}?`),
    default: false,
  });

  return finalConfirm;
}

// Usage for burn:
const confirmed = await confirmDangerousAction(
  'Burn Tokens',
  `You are about to permanently destroy ${amount} ${symbol} tokens.\n` +
  `These tokens will be removed from circulation forever.\n` +
  `Supply will decrease from ${currentSupply} to ${currentSupply - amount}.`,
  'BURN'
);
```

### Pattern 3: Educational README Structure
**What:** Three-tier documentation: quick-start → detailed usage → deep dive
**When to use:** All technical projects targeting both new users and deep learners
**Example:**
```markdown
# Token Name

<!-- Source: https://www.makeareadme.com/ -->
<!-- Source: https://github.com/jehna/readme-best-practices -->

## Quick Start (< 10 minutes)

Get started in 3 commands:

\`\`\`bash
npm install -g your-tool
your-tool create --name "My Token" --symbol "MYT"
your-tool burn --mint <address> --amount 1000
\`\`\`

## What This Project Does

[1-2 paragraphs explaining the problem and solution]

## Features

- ✓ Feature 1 with clear benefit
- ✓ Feature 2 with clear benefit
- ✓ Security-first approach (explain why)

## Installation & Setup

[Detailed step-by-step with prerequisites]

## Usage Examples

[Liberal use of examples with expected outputs]

## Architecture

[High-level explanation linking to CODE_WALKTHROUGH.md]

## Security

[Explain security decisions, link to audit/review]

## Troubleshooting

[Common issues with context-specific solutions]

## Learning Outcomes

[What you'll understand after using this tool]

## Contributing

[How to get involved]

## License

MIT
```

### Pattern 4: Code Walkthrough as Learning Journey
**What:** Explain "why" decisions were made, not just "what" code does
**When to use:** Educational documentation for class projects or tutorials
**Example:**
```markdown
# Code Walkthrough: Token Burn Implementation

<!-- Source: https://www.helius.dev/blog/an-introduction-to-anchor-a-beginners-guide-to-building-solana-programs -->
<!-- Structure: Problem → Decision → Implementation → Trade-offs -->

## Why Burn Tokens?

Token burning permanently reduces supply, creating deflationary tokenomics...

## Design Decision: Who Can Burn?

**Question:** Should only the creator burn tokens, or any holder?

**Research:** SPL Token standard allows any token holder to burn their own tokens...

**Decision:** Any holder can burn (standard SPL behavior)

**Trade-off:** More flexibility for holders, but creator can't prevent burning

## Implementation: The Burn Flow

### Step 1: Get Token Account Address

\`\`\`typescript
const tokenAccount = await getAssociatedTokenAddress(mint, owner.publicKey);
\`\`\`

**Why this is necessary:** Solana doesn't store tokens directly in wallets.
Each user has an Associated Token Account (ATA) per token type...

### Step 2: Confirmation UX

**Security consideration:** Burning is permanent. We implement three-level
confirmation following UX best practices for destructive actions...

[Continue pattern: explain WHY for each decision]
```

### Pattern 5: Demo-Driven Presentation Structure
**What:** Chapter-based script optimized for live demonstration
**When to use:** Technical presentations where showing beats telling
**Example:**
```markdown
# Demo Script: Secure SPL Token Creation

<!-- Source: https://www.storylane.io/blog/how-to-prepare-a-great-software-demo-presentation -->
<!-- Chapter format with conversational transitions -->

## Chapter 1: The Problem (2 minutes)

**[SLIDE: Current Token Creation Landscape]**

"Most SPL token tutorials show you how to create a token, but they skip
the security part. Let me show you what I mean..."

**[LIVE: Show pump.fun or similar, point to authority status]**

"See this? Active mint authority means the creator can print unlimited
tokens. That's a rug pull risk. Let's fix this."

---

## Chapter 2: Our Solution Approach (3 minutes)

**[SLIDE: Architecture Diagram]**

"We built a CLI tool that makes secure token creation the DEFAULT, not
optional. Here's how it works..."

**[WALK through diagram]**
- Step 1: Create with revoked authorities
- Step 2: Add professional metadata via Metaplex
- Step 3: Burn mechanism for deflationary economics

---

## Chapter 3: Live Demo (10 minutes)

**[TERMINAL: Run actual commands]**

"Let's create a token right now. I'll walk through each step..."

\`\`\`bash
solana-token-tool create
\`\`\`

**[As prompts appear, explain educational output]**

"Notice how it explains what IPFS does while uploading? That's intentional.
This is a learning tool, not just automation."

**[PAUSE at key moments]**

"See the cost estimate? 0.00144 SOL for rent exemption. Let me explain
why that exists..."

---

## Chapter 4: Learning Outcomes (2 minutes)

**[SLIDE: What I Learned]**

"Building this taught me three critical things about Solana..."

[Bullet points with brief explanations]

## Backup Slides

[Error scenarios, architecture deep dives, future work]
```

### Pattern 6: Supply Verification After Burn
**What:** Verify on-chain that supply actually decreased
**When to use:** After any burn operation, for transparency and education
**Example:**
```typescript
import { getMint } from '@solana/spl-token';

async function verifyBurn(
  connection: Connection,
  mint: PublicKey,
  expectedDecrease: bigint
): Promise<void> {
  const mintInfo = await getMint(connection, mint);

  console.log(chalk.cyan('\nSupply Verification:'));
  console.log(chalk.gray('  Current supply: ') +
    chalk.white(mintInfo.supply.toString()));
  console.log(chalk.gray('  Burned amount:  ') +
    chalk.white(expectedDecrease.toString()));

  // Show percentage burned
  const percentBurned = (Number(expectedDecrease) / Number(mintInfo.supply)) * 100;
  console.log(chalk.gray('  Percent burned: ') +
    chalk.white(percentBurned.toFixed(2) + '%'));
}
```

### Anti-Patterns to Avoid
- **Single confirmation for burn:** Too easy to accidentally destroy tokens, requires multi-step confirmation
- **Vague error messages:** "Burn failed" vs "Insufficient token balance in account X1y2...Z3a4"
- **README as reference manual:** Optimizes for completeness over usability, should start with quick-start
- **Slide-heavy presentations:** For code demos, 70% live terminal, 30% slides maximum
- **Code comments as documentation:** Comments explain "what," documentation explains "why"
- **Not verifying burn on-chain:** Trust but verify - fetch mint info after burn to confirm supply decreased

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown to slides | Custom renderer | reveal.js or Slidev | Handles code highlighting, transitions, presenter notes, responsive design |
| Documentation site | Custom HTML | GitHub Pages + markdown | Zero config, version control, free hosting |
| Token account lookup | Manual PDA derivation | getAssociatedTokenAddress | Handles PDA seeds, bumps, program IDs correctly |
| Amount with decimals | Manual multiplication | Helper function with validation | Easy to forget 10^decimals, causes errors |
| Demo recording | Manual screen capture | asciinema or Warp AI | Records terminal as text (searchable, copy-paste works), smaller files |
| Presentation templates | Start from scratch | reveal.js themes or Slidesgo | Professional design, accessibility, consistent styling |
| Error tracking in docs | Manual list | GitHub Issues labels | Searchable, community can add issues, tracks resolution |

**Key insight:** Phase 3 is about polish and presentation, not complex new features. Burn is 20 lines of code; documentation is where quality shows. Use existing tools for documentation/presentation so you can focus on content quality over format engineering.

## Common Pitfalls

### Pitfall 1: Burning from Wrong Account
**What goes wrong:** "Account not found" or "Insufficient balance" despite wallet having tokens
**Why it happens:** burn() requires token account address (ATA), not wallet public key
**How to avoid:** Always fetch ATA using getAssociatedTokenAddress before burn
**Warning signs:**
```typescript
// WRONG: Using wallet address
await burn(connection, payer, walletAddress, mint, owner, amount);

// RIGHT: Using token account address
const tokenAccount = await getAssociatedTokenAddress(mint, owner.publicKey);
await burn(connection, payer, tokenAccount, mint, owner, amount);
```

### Pitfall 2: Decimal Multiplication Error
**What goes wrong:** Burn amount is wrong (off by powers of 10)
**Why it happens:** SPL Token uses raw amounts without decimals, must multiply by 10^decimals
**How to avoid:** Create helper function with explicit decimals parameter
**Warning signs:** User burns "1000 tokens" but only 0.000001 tokens actually burn
```typescript
// WRONG: Using raw amount
await burn(connection, payer, tokenAccount, mint, owner, 1000);

// RIGHT: Multiply by 10^decimals
await burn(connection, payer, tokenAccount, mint, owner, 1000 * Math.pow(10, decimals));

// BEST: Helper function
function calculateRawAmount(amount: number, decimals: number): bigint {
  return BigInt(amount * Math.pow(10, decimals));
}
```

### Pitfall 3: README that's Too Dense
**What goes wrong:** New users can't get started quickly, bounce off project
**Why it happens:** Treating README as comprehensive reference instead of quick-start + gateway
**How to avoid:** Put quick-start first, detailed docs in separate files
**Warning signs:** README is >500 lines, no code examples in first screen, prerequisites buried mid-document
**Best practice:** Target <10 minutes from README to working example

### Pitfall 4: Demo Script Without Rehearsal
**What goes wrong:** Live demo fails during presentation due to unforeseen issues
**Why it happens:** Assuming "it works on my machine" means it works in presentation context
**How to avoid:** Rehearse on clean environment, record backup video, prepare "demo fails" backup plan
**Warning signs:** First time running full flow is during presentation, no fallback slides

### Pitfall 5: Code Walkthrough as API Reference
**What goes wrong:** Documentation lists functions but doesn't teach concepts
**Why it happens:** Confusing reference documentation with learning-oriented documentation
**How to avoid:** Structure as "learning journey" - explain decisions, trade-offs, why certain patterns
**Warning signs:** Headers are function names, no "Why" sections, reads like generated JSDoc

### Pitfall 6: Insufficient Burn Confirmation
**What goes wrong:** User accidentally burns tokens, can't recover
**Why it happens:** Single y/n confirmation is too easy to click through
**How to avoid:** Three-level confirmation: initial warning → type-to-confirm → final yes/no
**Warning signs:** User reports "I didn't mean to burn that much," single confirmation prompt
**UX principle:** Friction should scale with irreversibility

### Pitfall 7: Not Checking Token Balance Before Burn
**What goes wrong:** Transaction fails with cryptic error about insufficient balance
**Why it happens:** Didn't fetch and validate balance before attempting burn
**How to avoid:** Fetch token account balance, show user current balance, validate amount <= balance
**Warning signs:**
```typescript
// BAD: Burn without checking
await burn(connection, payer, tokenAccount, mint, owner, amount);

// GOOD: Check balance first
const tokenAccountInfo = await getAccount(connection, tokenAccount);
if (tokenAccountInfo.amount < rawAmount) {
  throw new Error(
    `Insufficient balance. Have: ${tokenAccountInfo.amount}, Need: ${rawAmount}`
  );
}
await burn(connection, payer, tokenAccount, mint, owner, rawAmount);
```

### Pitfall 8: Presentation Not Mobile-Optimized
**What goes wrong:** Slides look good on laptop but unreadable on instructor's projector or shared screens
**Why it happens:** Designing at high resolution, testing only on local display
**How to avoid:** Test slides on mobile device, use large fonts (minimum 24pt), high contrast
**Warning signs:** Code examples with 10pt font, complex diagrams with small text, pale colors
**2026 standard:** 70% of initial presentation views happen on mobile/tablet

## Code Examples

Verified patterns from official sources:

### Complete Burn Flow with Educational Output
```typescript
// Source: https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-burn-spl-tokens-on-solana
// Enhanced with Phase 1-2 educational patterns
import { burn, getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { educationalSpinner, explain } from '../utils/educational.js';
import { displaySuccess, formatSOL } from '../utils/display.js';

export async function burnTokens(
  connection: Connection,
  payer: any,
  mint: PublicKey,
  owner: any,
  amount: number,
  decimals: number
): Promise<string> {
  // Step 1: Get token account
  const tokenAccount = await educationalSpinner(
    'Locating token account...',
    'Each wallet has an Associated Token Account (ATA) per token type. ' +
    'Tokens are stored in ATAs, not directly in your wallet.',
    async () => getAssociatedTokenAddress(mint, owner.publicKey)
  );

  // Step 2: Check balance
  const accountInfo = await getAccount(connection, tokenAccount);
  const rawAmount = BigInt(amount * Math.pow(10, decimals));

  if (accountInfo.amount < rawAmount) {
    throw new Error(
      `Insufficient balance. You have ${accountInfo.amount} raw units ` +
      `(${Number(accountInfo.amount) / Math.pow(10, decimals)} tokens), ` +
      `but tried to burn ${amount} tokens.`
    );
  }

  // Step 3: Get current supply for comparison
  const mintInfoBefore = await getMint(connection, mint);
  const supplyBefore = mintInfoBefore.supply;

  // Step 4: Execute burn
  const signature = await educationalSpinner(
    'Burning tokens...',
    'Burn permanently removes tokens from circulation. ' +
    'This decreases the mint\'s total supply on-chain.',
    async () => burn(connection, payer, tokenAccount, mint, owner, rawAmount)
  );

  // Step 5: Verify supply decreased
  const mintInfoAfter = await getMint(connection, mint);
  const supplyAfter = mintInfoAfter.supply;
  const actualBurned = supplyBefore - supplyAfter;

  if (actualBurned !== rawAmount) {
    console.warn(`Warning: Expected to burn ${rawAmount}, but ${actualBurned} was burned`);
  }

  displaySuccess(`Burned ${amount} tokens`);
  explain(`Supply decreased from ${supplyBefore} to ${supplyAfter}`);

  return signature;
}
```

### Burn Confirmation Pattern
```typescript
// Source: https://medium.com/design-bootcamp/a-ux-guide-to-destructive-actions-their-use-cases-and-best-practices-f1d8a9478d03
import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';

export async function confirmBurn(
  amount: number,
  symbol: string,
  currentSupply: bigint,
  decimals: number
): Promise<boolean> {
  // Warning display
  console.log(chalk.red.bold('\n⚠️  BURN TOKENS - PERMANENT ACTION\n'));
  console.log(chalk.yellow('You are about to permanently destroy tokens.\n'));
  console.log(chalk.gray('Details:'));
  console.log(chalk.gray(`  Tokens to burn:   `) + chalk.white(`${amount} ${symbol}`));
  console.log(chalk.gray(`  Current supply:   `) + chalk.white(currentSupply.toString()));
  console.log(chalk.gray(`  New supply:       `) + chalk.white((currentSupply - BigInt(amount * Math.pow(10, decimals))).toString()));
  console.log(chalk.red('\nThis action CANNOT BE UNDONE.\n'));

  // First confirmation
  const understand = await confirm({
    message: 'I understand this is permanent and irreversible',
    default: false,
  });

  if (!understand) {
    console.log(chalk.gray('Burn cancelled.'));
    return false;
  }

  // Type-to-confirm
  const typed = await input({
    message: chalk.yellow('Type "BURN" to confirm:'),
    validate: (value) => {
      if (value === 'BURN') return true;
      return 'Please type "BURN" exactly (all caps)';
    },
  });

  // Final confirmation
  const final = await confirm({
    message: chalk.red(`FINAL: Burn ${amount} ${symbol} tokens?`),
    default: false,
  });

  if (!final) {
    console.log(chalk.gray('Burn cancelled.'));
    return false;
  }

  console.log(); // Spacing
  return true;
}
```

### README Template Structure
```markdown
<!-- Source: https://www.makeareadme.com/ -->
<!-- Source: https://github.com/jehna/readme-best-practices -->

# Secure SPL Token Creator

A CLI tool for creating SPL tokens on Solana with security-first defaults.

## Quick Start

\`\`\`bash
npm install -g secure-spl-token
secure-spl-token create
\`\`\`

That's it! The tool will guide you through creating a secure token with:
- Automatically revoked mint/freeze authorities (anti-rug protection)
- Professional metadata via Metaplex and IPFS
- Educational output explaining each step

## Why This Project?

Most token creation tutorials skip security basics. This tool makes secure
token creation the DEFAULT by automatically revoking dangerous authorities.

## Features

- ✅ **Security-First**: Authorities revoked by default, no rug pull risk
- ✅ **Professional Metadata**: Metaplex integration with IPFS storage
- ✅ **Educational UX**: Learn Solana concepts while creating tokens
- ✅ **Burn Mechanism**: Deflationary tokenomics with supply reduction
- ✅ **Transparent Costs**: Shows exact SOL costs before confirmation

## Installation

### Prerequisites
- Node.js 18+
- Solana CLI installed (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)
- Wallet funded with devnet SOL (`solana airdrop 1 --url devnet`)

### Install Tool
\`\`\`bash
npm install -g secure-spl-token
\`\`\`

## Usage Examples

### Create Token
\`\`\`bash
secure-spl-token create \\
  --name "My Secure Token" \\
  --symbol "MST" \\
  --decimals 9 \\
  --supply 1000000
\`\`\`

### Burn Tokens
\`\`\`bash
secure-spl-token burn \\
  --mint <MINT_ADDRESS> \\
  --amount 10000
\`\`\`

## Documentation

- [Code Walkthrough](./CODE_WALKTHROUGH.md) - Learning-oriented code explanation
- [Architecture](./ARCHITECTURE.md) - System design and security decisions
- [API Reference](./API.md) - Function signatures and parameters

## Security Approach

This tool implements three layers of anti-rug protection:

1. **Mint Authority Revocation**: Supply becomes fixed, no inflation possible
2. **Freeze Authority Revocation**: Tokens can't be frozen (honeypot prevention)
3. **Optional Metadata Lock**: Name/symbol become immutable

[Link to detailed security documentation]

## Learning Outcomes

Building/using this tool teaches:
- Solana account model (wallets vs token accounts vs mint accounts)
- SPL Token Program mechanics (authorities, decimals, supply)
- Metaplex Token Metadata Standard
- IPFS content addressing and permanent storage
- Transaction cost estimation (rent exemption, fees)

## Troubleshooting

**"Insufficient funds" error**
```bash
# Get devnet SOL (free)
solana airdrop 1 --url devnet
```

**"Keypair file not found"**
```bash
# Generate a new keypair
solana-keygen new --outfile ~/.config/solana/id.json
```

[More troubleshooting scenarios]

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT - See [LICENSE](./LICENSE)
```

### Presentation Demo Script Pattern
```markdown
<!-- Source: https://www.storylane.io/blog/how-to-prepare-a-great-software-demo-presentation -->

# Demo Script: Secure SPL Token Creator

**Time:** 15 minutes (10 min demo, 5 min Q&A)
**Audience:** Classmates learning Solana development
**Environment:** Devnet with pre-funded wallet

---

## Setup (Before Class)

- [ ] Terminal window maximized, large font (24pt+)
- [ ] Wallet funded with 2 SOL on devnet
- [ ] Tool installed and tested
- [ ] Backup video recording ready
- [ ] Slides loaded in browser tab

---

## Chapter 1: The Problem (2 min)

**[SLIDE 1: Title]**

"Hi everyone, today I'm showing you a CLI tool I built for creating secure
SPL tokens on Solana. Let me start with why this matters..."

**[SLIDE 2: Rug Pull Example]**

[Show screenshot of token with active authorities]

"See this? Most tutorials teach you to create a token like this. The problem?
Active mint authority means the creator can print unlimited tokens at any time.
That's a rug pull risk."

**[TRANSITION]**

"My tool fixes this by making security the default, not optional."

---

## Chapter 2: Architecture (3 min)

**[SLIDE 3: System Architecture]**

"Here's how it works at a high level..."

[Walk through diagram boxes]

1. Token creation with immediate authority revocation
2. Professional metadata via Metaplex + IPFS
3. Burn mechanism for deflationary economics
4. Educational output explaining each step

"The key insight: security features are automatic. The user doesn't need to
remember to revoke authorities - it just happens."

---

## Chapter 3: Live Demo - Create Token (7 min)

**[SWITCH TO TERMINAL]**

"Let's create a token right now. I'll use the interactive mode..."

\`\`\`bash
$ secure-spl-token create
\`\`\`

**[AS PROMPTS APPEAR]**

"Notice the educational output? While uploading to IPFS, it explains what
IPFS actually does. This is a learning tool."

**[PAUSE AT COST ESTIMATE]**

"See the cost breakdown? 0.00144 SOL for rent exemption, 0.000015 SOL for
transaction fees. Let me explain rent exemption quickly..."

[Brief 30-second explanation]

**[CONTINUE THROUGH CREATION]**

"Now it's revoking authorities automatically. Watch the Explorer links..."

[Open one Explorer link in browser, show mint authority = null]

"There - mint authority is null. Permanently. Even I can't change this."

**[CHAPTER 4: Demo - Burn Tokens]** (3 min)

"Now let's demonstrate the burn mechanism..."

\`\`\`bash
$ secure-spl-token burn --mint <ADDRESS> --amount 1000
\`\`\`

**[SHOW CONFIRMATION PROMPTS]**

"Notice the three-level confirmation? Type 'BURN', then final yes/no.
This follows UX best practices for destructive actions."

[Complete burn, show supply verification]

"Supply decreased from X to Y. We verify this on-chain for transparency."

---

## Chapter 5: Learning Outcomes (2 min)

**[SLIDE 4: What I Learned]**

"Building this taught me three things about Solana..."

1. **Account Model Complexity**: Wallets don't hold tokens directly, ATAs do
2. **Rent Economics**: Why accounts need SOL deposits (rent exemption)
3. **Security by Design**: How framework defaults shape user behavior

**[SLIDE 5: Future Enhancements]**

[If time allows, mention: mainnet support, Raydium pool creation, web UI]

---

## Backup Slides

**If Demo Fails:**
- Slide: "Demo Video" with pre-recorded walkthrough
- Slide: Terminal screenshots with annotations
- Slide: Code snippets with explanation

**If Extra Time:**
- Slide: Code walkthrough of burn function
- Slide: Architecture deep dive (PDA derivation, etc.)

---

## Q&A Preparation

**Likely questions:**

Q: "Why devnet instead of mainnet?"
A: "Zero cost for testing, safe for learning. Mainnet deployment is straightforward,
just change cluster parameter."

Q: "Could you add feature X?"
A: "Great idea! The modular architecture makes that possible. [Explain how]"

Q: "How do you handle errors?"
A: "Context-specific error messages with remediation hints. [Show example in code]"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual burn via CLI | @solana/spl-token burn() | Stable | Programmatic burn enables automation, better UX |
| Static documentation | Interactive documentation | 2024-2025 | Tools like Docusaurus enable versioning, search, dark mode |
| PowerPoint presentations | reveal.js/Slidev | 2023-2024 | Code-based slides enable version control, better code rendering |
| Manual testing | Jest with @solana/spl-token mocks | Ongoing | Automated testing catches regressions, but setup is complex |
| Reference-style READMEs | Quick-start READMEs | 2024+ | <10 minute setup is 2026 standard, detailed docs live elsewhere |
| Feature-focused presentations | Demo-driven presentations | 2025-2026 | 70% demo, 30% slides for technical talks |
| Desktop-first slides | Mobile-first slides | 2026 | 70% of initial views on mobile/tablet |

**Deprecated/outdated:**
- **Incinerator address (1nc1nerator...)**: Was used for NFT burning, SPL Token burn() is standard
- **Dense slide decks**: 50+ slides with small text no longer effective for code demos
- **README as API reference**: Now split into README (quick-start) + separate API docs
- **Manual ATA derivation**: getAssociatedTokenAddress is standard, don't hand-roll PDA logic

## Open Questions

Things that couldn't be fully resolved:

1. **Testing Strategy vs Timeline**
   - What we know: Jest + ts-jest can test burn logic, requires setup and mocking RPC calls
   - What's unclear: Whether automated tests add enough value to justify time investment (<2 weeks total)
   - Recommendation: Manual testing with documented test script (reproducible), defer automated tests to post-class if desired

2. **Presentation Format: Slides vs Live Demo**
   - What we know: 2026 trend is demo-driven (70% terminal, 30% slides), code-based slides (reveal.js) are popular
   - What's unclear: Classroom norms, instructor expectations, projector/screen-sharing constraints
   - Recommendation: Hybrid approach - minimal slides (5-7) + scripted terminal demo with backup video

3. **Documentation Depth vs Accessibility**
   - What we know: README best practice is quick-start first, deep dives in separate docs
   - What's unclear: How much architectural detail to include vs link to external Solana docs
   - Recommendation: README targets "working in 10 minutes," CODE_WALKTHROUGH targets "understanding in 30 minutes," separate ARCHITECTURE for deep dives

4. **Burn Amount Validation: UI-Level vs On-Chain**
   - What we know: Can validate balance client-side before burn, on-chain validation happens regardless
   - What's unclear: Whether to fetch and show balance as part of confirmation flow (extra RPC call, slows UX)
   - Recommendation: Show balance during confirmation, prevents user surprise and educates about current holdings

## Sources

### Primary (HIGH confidence)
- [@solana/spl-token burn() documentation](https://solana-labs.github.io/solana-program-library/token/js/functions/burn.html) - Official function signature, parameters
- [QuickNode: How to Burn SPL Tokens](https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-burn-spl-tokens-on-solana) - Complete TypeScript implementation
- [Solana Token Program Docs](https://spl.solana.com/token) - Burn instruction mechanics
- [Make a README](https://www.makeareadme.com/) - README structure best practices
- [README Best Practices (GitHub)](https://github.com/jehna/readme-best-practices) - Template and guidelines
- [Helius: Anchor Introduction](https://www.helius.dev/blog/an-introduction-to-anchor-a-beginners-guide-to-building-solana-programs) - Teaching Anchor concepts
- [Solana Explorer](https://explorer.solana.com/) - Transaction verification

### Secondary (MEDIUM confidence)
- [Medium: UX Guide to Destructive Actions](https://medium.com/design-bootcamp/a-ux-guide-to-destructive-actions-their-use-cases-and-best-practices-f1d8a9478d03) - Confirmation patterns for dangerous actions
- [Storylane: Software Demo Presentation](https://www.storylane.io/blog/how-to-prepare-a-great-software-demo-presentation) - Demo script structure
- [Solana Explorer Guide](https://www.helius.dev/blog/top-solana-block-explorers) - Transaction verification patterns
- [Jest Documentation](https://jestjs.io/docs/getting-started) - TypeScript testing setup
- [Building CLI apps with TypeScript 2026](https://dev.to/hongminhee/building-cli-apps-with-typescript-in-2026-5c9d) - Modern CLI patterns
- [FreeCodeCamp: README Structure](https://www.freecodecamp.org/news/how-to-structure-your-readme-file/) - Documentation best practices

### Tertiary (LOW confidence)
- WebSearch results on token burning (cryptocurrency context, not code-specific)
- WebSearch results on presentation deck templates (2026 trends)
- Community tutorials on burn mechanisms (not verified against official docs)

## Metadata

**Confidence breakdown:**
- Burn implementation: HIGH - Official @solana/spl-token docs + verified QuickNode tutorial
- Documentation structure: HIGH - Multiple authoritative sources (Make a README, GitHub best practices)
- Presentation approach: MEDIUM - 2026 trends from industry sources, not Solana-specific
- Testing strategy: MEDIUM - Jest is standard, but testing blockchain apps is complex
- UX patterns: MEDIUM - General UX principles, not blockchain-specific validation

**Research date:** 2026-02-06
**Valid until:** ~30 days (burn API is stable, documentation best practices evolve slowly)

**Notes:**
- Burn mechanism is straightforward - 20 lines of code, main work is UX/confirmation
- Phase 3 is 80% documentation/presentation, 20% code - quality shows in polish
- Educational UX patterns from Phase 1-2 provide strong foundation for burn command
- Timeline constraint (<2 weeks) argues for manual testing over automated test suite
- Existing codebase has all patterns needed (educational spinners, confirmation, display utilities)
