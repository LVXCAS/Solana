# Live Demo Script: Memecoin Factory

**Purpose:** Rehearsable, chapter-based script for class presentation live demo
**Duration:** 5-7 minutes
**Target:** Show token creation, authority revocation, and burn mechanism in action
**Companion:** See PRESENTATION.md for slide outline and Q&A preparation

---

## Pre-Demo Checklist

**Run these checks BEFORE class presentation:**

- [ ] **Terminal window:** Maximized, large font (minimum 18pt, ideally 24pt for visibility)
- [ ] **Terminal profile:** High contrast (light text on dark background recommended)
- [ ] **Working directory:** `/Users/lvxcas/Solana` (project root)
- [ ] **Wallet funded:** At least 2 SOL on devnet
  ```bash
  solana balance --url devnet
  # If low: solana airdrop 2 --url devnet
  ```
- [ ] **PINATA_JWT set:** Check environment variable exists
  ```bash
  echo $PINATA_JWT | head -c 20  # Should show first 20 chars
  ```
- [ ] **Test logo ready:** Any small PNG/JPG file for metadata demo
  ```bash
  # Example: docs/test-logo.png (create if needed)
  ls -lh docs/test-logo.png
  ```
- [ ] **Tool builds successfully:**
  ```bash
  npm run build
  # Should complete without errors
  ```
- [ ] **Quick smoke test:**
  ```bash
  npm run dev -- create --dry-run
  # Should show operation preview
  ```
- [ ] **Browser tab open:** [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
- [ ] **Backup prepared:** Video recording or screenshots ready (just in case)
- [ ] **These notes:** Accessible on second screen or printed copy
- [ ] **Time check:** Practice once more, target 5 minutes for Chapters 1-2

---

## Chapter 1: Create a Secure Token (3 minutes)

### Talking Point (Before Command):
"Let me create a token right now on Solana's devnet. This is a real blockchain transaction happening in real-time, not a simulation."

### Command:
```bash
npm run dev -- create
```

### As Prompts Appear (Narrate):

**Token name prompt:**
```
? What is your token name? (1-32 characters)
```
Type: `DemoToken`

**Say:** "I'll call this DemoToken. Names can be 1-32 characters - that's enforced by the Metaplex standard."

---

**Symbol prompt:**
```
? What is your token symbol? (1-10 characters)
```
Type: `DEMO`

**Say:** "Symbol is DEMO. This is what shows up in wallets and DEX listings. Typically 3-5 characters, all caps."

---

**Decimals prompt:**
```
? How many decimals? (0-9)
```
Type: `9`

**Say:** "9 decimals, same as SOL. This means the smallest unit is 0.000000001 tokens. Internally, Solana stores all amounts as integers - so 1 token is actually 1,000,000,000 base units. This is how blockchains handle precision without floating point math."

---

**Supply prompt:**
```
? Initial supply?
```
Type: `1000000`

**Say:** "1 million tokens. This gets multiplied by 10^9 internally based on the decimals - so the actual on-chain value is 1 quadrillion base units. But we think in human terms: 1 million tokens."

---

**Description prompt:**
```
? Token description (optional, for wallet display)
```
Type: `Educational demo token for class presentation`

**Say:** "A description helps wallet apps display meaningful information. This goes into the metadata JSON."

---

**Image prompt:**
```
? Token logo image path (optional, uploads to IPFS)
```
Type: `docs/test-logo.png` (or press Enter to skip)

**Say:** "I'll provide a logo. This uploads to IPFS for permanent, decentralized storage. If I skip this, the token works fine but has no visual representation."

### Key Moment: Cost Estimate

**Watch for:**
```
Estimated Cost:
  Mint account rent:       0.00144096 SOL
  Token account rent:      0.00203928 SOL
  Transaction fees:        ~0.000015 SOL
  ────────────────────────────────
  Total:                   ~0.00349524 SOL
```

**PAUSE HERE AND SAY:**
"Notice the cost breakdown? About 0.0035 SOL total - that's less than a dollar at current prices. The bulk is 'rent exemption' - Solana requires accounts to hold a minimum balance to exist. This isn't a fee, it's a deposit that stays with the account. It's an anti-spam mechanism called rent exemption. If you close the account later, you get this back."

---

### During Execution (Narrate):

**While uploading to IPFS:**
```
◐ Uploading token logo to IPFS...
  IPFS (InterPlanetary File System) stores files permanently using content addressing.
```

**Say:** "See the educational messages? While uploading to IPFS, it explains what IPFS actually does. This is intentional - the tool teaches while it works. IPFS uses content addressing: the hash of the content IS the address. This means the file is permanent and verifiable."

---

**While creating token:**
```
◐ Creating mint account...
◐ Minting initial supply...
◐ Revoking mint authority...
◐ Revoking freeze authority...
```

**Say:** "Watch these steps carefully. It's creating the mint account, minting the supply, then immediately revoking both authorities. This happens automatically - there's no checkbox to forget."

---

### Key Moment: Authority Dashboard

**Watch for:**
```
Authority Status Dashboard:
─────────────────────────────────────────────────
  Mint Authority:     REVOKED ✓
  Freeze Authority:   REVOKED ✓
  Metadata Authority: ACTIVE (yours)
```

**PAUSE HERE AND SAY:**
"This is the critical moment. Look at the Authority Dashboard. Mint authority: REVOKED. Freeze authority: REVOKED. Both are now set to null at the protocol level. Even I can't change this now - it's permanent.

The metadata authority is still active because I might want to update the description or image later. But notice it says 'yours' - that's because it's my wallet address. No one else can modify this."

---

### Open Explorer Link

**Watch for:**
```
View on Solana Explorer:
https://explorer.solana.com/address/[MINT_ADDRESS]?cluster=devnet
```

**DO THIS:**
Click the link, open in browser tab.

**Say while loading:**
"Let's verify this on Solana Explorer - the blockchain's public transaction viewer."

**Point out in Explorer:**
1. **Token Supply:** 1,000,000.000000000 (with 9 decimals shown)
2. **Mint Authority:** `null` (shows "Authority: None")
3. **Freeze Authority:** `null` (shows "Freeze Authority: None")
4. **Metadata tab:** Name, symbol, image visible

**Say:** "Everything is on-chain and public. The authorities really are null - you can verify this yourself. This isn't trust, it's cryptographic proof."

---

### Metadata Authority Prompt (Optional)

**If prompted:**
```
? Do you want to lock metadata update authority? (makes name/symbol immutable)
```

**Choose:** `No` (for demo purposes, to keep option available)

**Say:** "I'll keep metadata unlocked for now. Locking makes the name and symbol permanently immutable - useful for tokens that need absolute permanence."

---

## Chapter 2: Burn Tokens (2 minutes)

### Talking Point (Before Command):
"Now let's demonstrate the deflationary mechanism. I'm going to permanently destroy some tokens, reducing the total supply."

### Command:
```bash
npm run dev -- burn --mint <PASTE_MINT_ADDRESS_FROM_CHAPTER_1> --amount 1000
```

**IMPORTANT:** Copy the mint address from Chapter 1 output. It's the public key shown after token creation.

**Say while typing:**
"The burn command requires the mint address and the amount to burn. I'm going to burn 1000 tokens - 0.1% of the total supply."

---

### Burn Preview Display

**Watch for:**
```
Burn Preview:

  Current balance:       1000000
  Amount to burn:        1000
  Remaining after burn:  999000
  Current total supply:  1000000000000000
```

**Say:**
"The tool shows a preview first. My current balance is 1 million tokens - the full supply since I'm the creator. I'm burning 1000, leaving 999,000."

---

### Three-Level Confirmation Flow

**Level 1: Warning Display**

**Watch for:**
```
⚠️  BURN TOKENS - PERMANENT ACTION

You are about to permanently destroy tokens.

Details:
  Tokens to burn: 1000
  Mint address:   [ADDRESS]
  Supply impact:  -0.10% of total

This action CANNOT BE UNDONE.

? I understand this is permanent and irreversible
```

**Select:** `Yes`

**Say:** "Notice the three-level confirmation? This is UX best practice for destructive actions. First level: clear warning with details and understanding confirmation."

---

**Level 2: Type-to-Confirm**

**Watch for:**
```
? Type "BURN" to confirm:
```

**Type:** `BURN` (exactly, all caps)

**Say:** "Second level: type-to-confirm. You must type 'BURN' exactly. This prevents click-through on dangerous operations - you have to consciously type the action."

---

**Level 3: Final Confirmation**

**Watch for:**
```
? FINAL: Burn 1000 tokens?
```

**Select:** `Yes`

**Say:** "Third level: final yes/no. This is your last chance to cancel. Friction should scale with irreversibility - that's the UX principle here."

---

### During Burn Execution

**Watch for educational messages:**
```
Each wallet has an Associated Token Account (ATA) per token type.
Tokens are stored in ATAs, not directly in your wallet.

◐ Burning tokens...
  Burn permanently removes tokens from circulation.
  This decreases the mint's total supply on-chain.

Supply verification ensures the burn was successful on-chain.
We compare the supply before and after to confirm the exact amount burned.
```

**Say:**
"Even during the burn, it's explaining concepts. ATAs, supply reduction, verification - all educational."

---

### Key Moment: Burn Result

**Watch for:**
```
Burn completed successfully!

Burned 1000 DEMO tokens:
  Signature: [TX_SIGNATURE]
  Amount burned: 1000 tokens (1000000000000 base units)

Supply Verification:
  Supply before: 1000000000000000
  Supply after:  999000000000000
  Confirmed burned: 1000000000000 (-0.10% of total)

View on Solana Explorer:
https://explorer.solana.com/tx/[TX_SIGNATURE]?cluster=devnet
```

**PAUSE HERE AND SAY:**
"Supply verification is critical. Look: supply decreased from 1,000,000 to 999,000. We verify this on-chain by fetching the mint account before and after. Those 1000 tokens are permanently gone - no one can recover them, not even me. This is how deflationary tokenomics work."

**If time allows, click Explorer link:**
"And we can verify this transaction on Solana Explorer too. Everything is transparent and auditable."

---

## Chapter 3: Dry-Run Mode (1 minute, OPTIONAL - skip if running late)

### Talking Point:
"One more quick feature: what if you want to preview without spending SOL or making transactions?"

### Command:
```bash
npm run dev -- create --dry-run --name "TestToken" --symbol "TST"
```

### Watch for:
```
DRY RUN MODE - No transactions will be executed

Operations that would be performed:

  1. Load keypair from: ~/.config/solana/id.json
  2. Create SPL token mint
  3. Mint initial supply: [amount]
  4. Revoke mint authority
  5. Revoke freeze authority

Estimated cost:
  Total: 0.00349524 SOL

Remove --dry-run to execute these operations
```

### Say:
"Dry-run shows every operation that WOULD happen, with cost estimates, but makes zero blockchain calls. Good for learning, testing, or checking costs before committing."

---

## Timing Notes

**Target time:** 5-7 minutes total

**If running behind (>6 minutes after Chapter 2):**
- Skip Chapter 3 entirely
- Skip opening second Explorer link in Chapter 2
- Speed through Chapter 1 prompts (less narration)

**If running ahead (<4 minutes after Chapter 2):**
- Add Chapter 3 (dry-run demo)
- Show authority dashboard in more detail
- Open both Explorer links (token + burn transaction)
- Explain ATA concept more thoroughly

**If exactly on time (5-6 minutes):**
- Complete Chapters 1-2 as written
- Skip Chapter 3
- Transition back to slides

---

## Backup Plan: Demo Failure Scenarios

### Scenario 1: "Insufficient funds" Error

**Error message:**
```
Insufficient SOL balance
Required: 0.00349524
Available: 0.00012345
```

**Fix (live):**
```bash
solana airdrop 2 --url devnet
```

**Say:**
"Perfect timing for an educational moment! Devnet provides free SOL through an airdrop faucet. This is why we test on devnet - real functionality, zero cost."

**Time:** 5-10 seconds for airdrop

**Continue:** Retry create command

---

### Scenario 2: Network Timeout

**Error message:**
```
Error: Transaction was not confirmed in 30.00 seconds
```

**Fix attempt 1:**
Retry the command once.

**Say:**
"Devnet can be slower than mainnet - fewer validators. Let me try once more."

**If still fails (Fix attempt 2):**
Switch to backup.

**Say:**
"Devnet is being unstable - this is actually common and is one reason we always test on devnet before mainnet. Let me show you a recording from my test run yesterday."

**Show:** Pre-recorded terminal video or screenshots

---

### Scenario 3: Terminal/Tool Won't Start

**Symptoms:**
- npm command fails
- TypeScript errors
- Module not found errors

**Fix:**
Switch to backup immediately.

**Say:**
"I have a recording from my last successful test. Let me walk you through what happens..."

**Show:** Pre-recorded video with narration overlay

---

### Scenario 4: IPFS/Pinata Fails

**Error message:**
```
Warning: Token created successfully but metadata upload failed
IPFS Error: [some error]
```

**Fix:**
Don't retry. The token still works!

**Say:**
"Good example of graceful error handling. The token was created successfully and authorities were revoked - those are the critical operations. The metadata failed, but the token is still functional. This is intentional design: core functionality succeeds even if optional features fail."

**Continue:** Show authority dashboard, verify on Explorer

**Skip:** Metadata portions of Chapter 1

---

### Scenario 5: Wrong Mint Address in Burn

**Error message:**
```
Invalid mint address: [ADDRESS]
Must be a valid base58 Solana address
```

**Fix:**
Check clipboard, re-copy mint address from Chapter 1 output.

**Say:**
"Input validation caught that. Let me grab the correct mint address..."

**Continue:** Retry burn with correct address

---

### Scenario 6: Can't Copy Mint Address

**Problem:** Missed copying mint address after token creation

**Fix:**
Check terminal scrollback or use `solana address` to find.

**Alternative:**
Skip Chapter 2 (burn demo) entirely.

**Say:**
"I'll skip the burn demo for now - we've seen the core functionality which is security-first token creation. The burn mechanism follows the same educational pattern."

**Jump to:** Slide 5 (What I Learned)

---

## Post-Demo Transition

### After Chapter 2 Completes (or after backup):

**Say:**
"That's the tool in action. You've seen token creation with automatic authority revocation, professional metadata via IPFS and Metaplex, and the burn mechanism for deflationary supply. Let me switch back to slides and talk about what building this taught me..."

**Action:**
- Close terminal (or minimize)
- Return to slide presentation
- Advance to Slide 5 (What I Learned)

---

## Rehearsal Checklist

**Before Presentation Day:**

- [ ] **Practice full demo twice** - Time yourself, target 5 minutes
- [ ] **Test on clean terminal** - Clear scrollback, reset to project root
- [ ] **Verify devnet balance** - At least 2 SOL available
- [ ] **Test IPFS upload** - Ensure PINATA_JWT works
- [ ] **Create backup video** - Record successful run as failsafe
- [ ] **Take screenshots** - Each major step (cost estimate, authority dashboard, Explorer)
- [ ] **Test backup plan** - Practice Scenario 2 transition to video
- [ ] **Font size check** - Visible from back of classroom (24pt minimum)
- [ ] **Check clipboard** - Ability to copy/paste mint address
- [ ] **Bookmark Explorer** - Have devnet Explorer tab ready

**30 Minutes Before Presentation:**

- [ ] **Fresh terminal window** - Large font, high contrast
- [ ] **Fresh devnet airdrop** - Top up to 2 SOL
- [ ] **Test single command** - `npm run dev -- create --dry-run` should work
- [ ] **Clear old output** - Clean terminal scrollback
- [ ] **Set working directory** - `cd /Users/lvxcas/Solana`
- [ ] **Open backup** - Video/screenshots ready to switch to
- [ ] **Silence notifications** - Focus mode on laptop

---

## Success Criteria

**Demo is successful if you:**
- Create a token with revoked authorities (Chapter 1 complete)
- Show Explorer verification of null authorities
- Explain educational UX pattern
- Burn tokens with confirmation flow (Chapter 2 complete)
- Handle any errors gracefully with backup plan

**Demo is still good if you:**
- Use backup video for one chapter
- Skip metadata upload due to IPFS error
- Skip burn demo due to time constraint

**Demo fails only if:**
- No token creation shown (not even backup)
- Can't explain what the tool does
- Get flustered and give up

**Remember:** Even demo failures are educational. "This is why we test on devnet" is a valid learning outcome.

---

## Key Demo Phrases

**Use these for confidence and clarity:**

- "Let me create a token right now on Solana's devnet..."
- "Notice the educational output? This is a learning tool..."
- "Watch these authorities get revoked automatically..."
- "Let's verify this on Solana Explorer - everything is on-chain..."
- "This is permanent at the protocol level - even I can't undo it..."
- "See the three-level confirmation? Friction scales with consequence..."
- "Supply decreased and we verify it on-chain for transparency..."
- "Even demo failures are educational - this is why we use devnet..."

**Avoid these phrases:**
- "I hope this works..."
- "This should work..."
- "Let me try something..."
- "I don't know why that happened..."

**Instead use:**
- "Let me show you..."
- "This demonstrates..."
- "Here's what's happening..."
- "That's expected behavior because..."

---

## Final Preparation Note

**The demo is the heart of the presentation.** Slides set up the problem, but the live terminal demo proves you built something real. Practice until muscle memory takes over. Know your backup plans. Stay calm if errors occur - they're teaching moments.

**You've built something that works. Now show it with confidence.**
