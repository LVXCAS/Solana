# Technology Stack

**Project:** Solana Memecoin Factory - CLI Tool
**Researched:** 2026-02-04
**Overall Confidence:** MEDIUM-HIGH

## Executive Summary

The 2025-2026 Solana ecosystem is in a transition period with major framework versions nearing 1.0 releases (Anchor 1.0.0-rc.2, Web3.js 2.0). For a beginner-friendly, high school timeline project, **recommend using current stable versions (Anchor 0.32.1, Web3.js 1.x)** rather than bleeding-edge release candidates. Classic SPL Token Program remains the gold standard for memecoin creation due to universal wallet/exchange compatibility.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Anchor** | 0.32.1 | Solana program framework | Current stable release (Oct 2025). Handles security boilerplate, account validation, and serialization automatically. Essential for beginner Rust developers. 1.0.0-rc.2 exists but RC not recommended for learning projects. |
| **Rust** | 1.75.0+ | Program language | Minimum version for Solana development in 2025. Stable toolchain recommended. |
| **Solana CLI** | 2.0.0+ | Development toolchain | Required for program deployment, wallet management, and airdropping devnet SOL. |

**Confidence:** HIGH - Verified from [Anchor releases](https://github.com/solana-foundation/anchor/releases), [Solana Rust requirements](https://solana.com/docs/programs/rust), and [Anchor changelog](https://www.anchor-lang.com/docs/updates/changelog).

---

### TypeScript CLI & Client

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **@solana/web3.js** | 1.95.7+ (1.x) | Solana client library | **Use 1.x, NOT 2.0.** Web3.js 2.0 was released Nov 2024 but remains incompatible with 1.x API and isn't default on npm install. Anchor ecosystem examples use 1.x. 2.x offers 26% smaller bundles and 10x faster crypto, but breaking changes make it unsuitable for beginner timeline. |
| **@solana/spl-token** | 0.4.14+ | SPL Token operations | Official SPL Token library for mint creation, token accounts, transfers. Works with Classic Token Program. |
| **Commander.js** | 12.x+ | CLI framework | Lightweight, beginner-friendly CLI builder. Faster to learn than oclif for <2 week timeline. TypeScript-friendly with @commander-js/extra-typings. |
| **dotenv** | 16.x+ | Environment config | Secure keypair/RPC management via .env files. Standard practice for Solana CLIs. |
| **TypeScript** | 5.x+ | Type safety | Essential for Solana development - prevents account type mismatches and serialization bugs. |

**Confidence:** HIGH for versions (verified via [npm](https://www.npmjs.com/package/@solana/web3.js), [Web3.js 2.0 release notes](https://www.anza.xyz/blog/solana-web3-js-2-release)). MEDIUM for Commander.js choice - viable alternative is oclif, but Commander has gentler learning curve.

**Why NOT Web3.js 2.0:**
- Breaking API changes (Keypair → KeyPairSigner, generate → generateKeyPairSigner)
- Ecosystem fragmentation - most tutorials/examples use 1.x
- No compatibility with existing Anchor examples
- Learning project should use stable, well-documented APIs

**Why NOT oclif:**
- Heavier framework with more boilerplate
- 2+ week learning curve for full features
- Overkill for single-purpose token CLI
- Commander gets you shipping faster

---

### Token & Metadata

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Classic SPL Token Program** | Native | Token creation | **Use Classic, NOT Token-2022.** Token-2022 offers extensions (transfer fees, confidential transfers) but has significantly lower wallet compatibility. For memecoin, universal wallet support >> advanced features. Coinbase, major wallets support Classic SPL universally. |
| **Metaplex Umi** | 0.9.x+ | Framework | Modular Solana client framework - foundation for Metaplex SDKs. Zero dependencies, tree-shakeable. Required for Token Metadata. |
| **@metaplex-foundation/mpl-token-metadata** | 3.4.0+ | Token metadata | Attach name, symbol, image URI to tokens. Standard for 99% of Solana tokens/NFTs. Works as Umi plugin. Accounts resized in Aug 2025 for efficiency. |
| **@metaplex-foundation/umi-bundle-defaults** | Latest | Umi utilities | Standard bundle for Umi setup with common plugins. |

**Confidence:** HIGH - Verified from [Metaplex docs](https://developers.metaplex.com/token-metadata), [Token-2022 comparison](https://www.explica.co/spl-token-vs-token-2022-choosing-the-right-token-standard-for-your-project/), [SPL Token docs](https://spl.solana.com/token).

**Classic SPL vs Token-2022 Decision Matrix:**

| Criterion | Classic SPL | Token-2022 |
|-----------|-------------|------------|
| Wallet compatibility | 99%+ (Phantom, Solflare, Coinbase, all majors) | ~40% (growing but limited) |
| Exchange listings | Universal support | Limited support |
| Learning complexity | Simple, well-documented | Complex extensions, steeper curve |
| Memecoin suitability | Perfect - liquidity requires wide compatibility | Poor - locked liquidity if wallets can't hold |
| Advanced features | None | Transfer hooks, fees, confidential transfers |

**Verdict:** Classic SPL Token for memecoin. Token-2022 is for institutional/RWA use cases requiring compliance features.

---

### Testing & Development

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **anchor-bankrun** | 0.5.0+ | Fast Anchor testing | Orders of magnitude faster than solana-test-validator. Can time-travel, mock account data. Integrates with Anchor via BankrunProvider (one-line change from AnchorProvider). Essential for rapid iteration. |
| **Jest** | 29.x+ | Test runner | Standard JS test framework. Pairs with Bankrun for 10x faster Solana program tests. |
| **Solana Devnet** | - | Live testing | Free testnet SOL via faucet.solana.com (5 SOL/2hr). Behaves like mainnet. Test before any mainnet deployment. |

**Confidence:** HIGH - Verified from [Bankrun guide](https://www.quicknode.com/guides/solana-development/tooling/bankrun), [Solana testing guide](https://solana.com/developers/guides/advanced/testing-with-jest-and-bankrun), [Devnet best practices](https://www.alchemy.com/overviews/solana-devnet).

**Why Bankrun over solana-test-validator:**
- 10x faster test execution
- Time manipulation (test vesting, time-locks)
- Mock account data on-the-fly
- Lightweight (no full validator node)
- Perfect for TDD workflow in <2 week timeline

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Program Framework | Anchor 0.32.1 | Native Rust | Native requires manual account validation, serialization, security checks. 3-5x more code. Not suitable for beginner in <2 weeks. |
| Program Framework | Anchor 0.32.1 | Anchor 1.0.0-rc.2 | Release Candidate = API may change. Learning docs target 0.32.x stable. Avoid RC for educational projects. |
| Client Library | @solana/web3.js 1.x | @solana/web3.js 2.0 | Breaking API changes, ecosystem lag, incompatible with Anchor examples. 2.0 is future but not for beginners in 2026. |
| CLI Framework | Commander.js | oclif | oclif is overkill for single-purpose CLI. Steeper learning curve, more boilerplate. Commander ships faster. |
| Token Program | Classic SPL Token | Token-2022 | Wallet incompatibility kills memecoin liquidity. Token-2022 for institutions, not memecoins. |
| Metadata | Metaplex Umi + mpl-token-metadata | Old @metaplex-foundation/js | Old SDK deprecated. Umi is modular, zero dependencies, current standard since 2024. All new projects use Umi. |
| Testing | Bankrun | solana-test-validator | Test validator is slow (minutes vs seconds), heavyweight, can't mock state. Bankrun 10x faster = better TDD. |

---

## Installation & Setup

### 1. Core Development Environment

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update stable

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version  # Should be 2.0.0+

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1
anchor --version  # Should be 0.32.1
```

**Confidence:** HIGH - Standard installation from [Solana docs](https://solana.com/docs/intro/installation) and [Anchor installation](https://www.anchor-lang.com/docs/installation).

---

### 2. Solana CLI Configuration

```bash
# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Generate keypair (if first time)
solana-keygen new --outfile ~/.config/solana/devnet.json

# Set keypair
solana config set --keypair ~/.config/solana/devnet.json

# Airdrop test SOL (up to 5 SOL, 2x per hour)
solana airdrop 2

# Verify balance
solana balance
```

**Note:** Devnet faucet may rate-limit VPN users. Use faucet.solana.com web interface if CLI fails.

**Confidence:** HIGH - From [Solana devnet guide](https://www.alchemy.com/overviews/solana-devnet) and [airdrop guide](https://www.quicknode.com/guides/solana-development/getting-started/a-complete-guide-to-airdropping-test-sol-on-solana).

---

### 3. TypeScript CLI Project

```bash
# Initialize project
mkdir solana-memecoin-cli
cd solana-memecoin-cli
npm init -y

# Install Solana dependencies
npm install @solana/web3.js@1.95.7 @solana/spl-token@0.4.14

# Install Metaplex dependencies
npm install @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/mpl-token-metadata

# Install CLI framework
npm install commander dotenv

# Install TypeScript
npm install -D typescript @types/node ts-node
npx tsc --init

# Install testing (optional but recommended)
npm install -D jest @types/jest ts-jest anchor-bankrun
```

**TypeScript Config (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Confidence:** HIGH - Standard TypeScript setup for Solana CLI tools.

---

### 4. Environment Configuration

Create `.env` file for keypair and RPC:

```bash
# .env
SOLANA_RPC_URL=https://api.devnet.solana.com
PAYER_KEYPAIR_PATH=/Users/lvxcas/.config/solana/devnet.json
```

**Security Note:**
- NEVER commit `.env` to git (add to `.gitignore`)
- NEVER log private keys
- Use separate keypairs for devnet/mainnet
- For mainnet, use hardware wallets (Ledger/Trezor) for large funds

**Confidence:** HIGH - Standard practice from [Solana wallet security](https://blog.slerf.tools/en-us/solana-wallet-generator-how-to-create-a-solana-wallet-programmatically/).

---

## Anchor Program Setup

### 1. Initialize Anchor Project

```bash
# Create new Anchor project
anchor init memecoin-factory
cd memecoin-factory

# Project structure:
# programs/memecoin-factory/  - Rust program code
# tests/                      - TypeScript tests
# Anchor.toml                 - Configuration
```

---

### 2. Anchor.toml Configuration

```toml
[toolchain]
anchor_version = "0.32.1"

[features]
resolution = true
skip-lint = false

[programs.devnet]
memecoin_factory = "YOUR_PROGRAM_ID"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/devnet.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

**Confidence:** MEDIUM - Anchor.toml format from [Anchor docs](https://www.anchor-lang.com/docs/installation). Auto-detects network configs since Anchor 0.31+.

---

### 3. Cargo.toml for Rust Program

```toml
[package]
name = "memecoin-factory"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "memecoin_factory"

[dependencies]
anchor-lang = "0.32.1"
anchor-spl = "0.32.1"  # For SPL Token integration

[features]
no-entrypoint = []
```

**Key dependencies:**
- `anchor-lang` - Core Anchor framework
- `anchor-spl` - Anchor wrappers for SPL programs (Token, Associated Token Account)

**Confidence:** HIGH - Standard Anchor Rust setup.

---

## Version Currency Verification

All versions verified as of **2026-02-04**:

| Package | Latest Stable | Status | Last Checked |
|---------|---------------|--------|--------------|
| Anchor CLI | 0.32.1 (Oct 2025) | Current | [GitHub Releases](https://github.com/solana-foundation/anchor/releases) |
| Anchor 1.0 | 1.0.0-rc.2 (Jan 2026) | Release Candidate (NOT recommended) | [GitHub Releases](https://github.com/solana-foundation/anchor/releases) |
| @solana/web3.js 1.x | 1.95.7 | Current | [npm](https://www.npmjs.com/package/@solana/web3.js) |
| @solana/web3.js 2.x | 2.0.0 | Released Nov 2024 (breaking changes) | [Anza Blog](https://www.anza.xyz/blog/solana-web3-js-2-release) |
| @solana/spl-token | 0.4.14 | Current | [npm](https://www.npmjs.com/package/@solana/spl-token) |
| @metaplex-foundation/mpl-token-metadata | 3.4.0 | Current | [Metaplex Docs](https://developers.metaplex.com/token-metadata) |
| Rust | 1.75.0+ | Minimum for Solana 2025 | [Solana Rust Docs](https://solana.com/docs/programs/rust) |
| Solana CLI | 2.0.0+ | Current | [Solana Docs](https://solana.com/docs/intro/installation) |

---

## First-Time Developer Checklist

For a developer new to Solana (like this project), ensure:

- [ ] Rust installed and updated (`rustup update stable`)
- [ ] Solana CLI installed (`solana --version` shows 2.0.0+)
- [ ] Anchor installed (`anchor --version` shows 0.32.1)
- [ ] Devnet configured (`solana config get` shows devnet URL)
- [ ] Devnet keypair created and funded (`solana balance` shows >0 SOL)
- [ ] Node.js 18+ installed (Solana libraries require modern Node)
- [ ] TypeScript understanding (strict types prevent Solana bugs)
- [ ] Git/GitHub setup (version control essential for program audits)

**Learning Resources:**
- [Anchor Book](https://www.anchor-lang.com/docs) - Official Anchor documentation
- [Solana Cookbook](https://solanacookbook.com/) - Practical recipes
- [Solana Program Library Docs](https://spl.solana.com/) - SPL Token reference
- [Metaplex Developer Hub](https://developers.metaplex.com/) - Metadata guides

**Confidence:** HIGH - Standard onboarding for Solana development.

---

## Anti-Patterns & Pitfalls

### 1. Token Program Choice

**WRONG:** "I'll use Token-2022 for the latest features"
**RIGHT:** "I'll use Classic SPL Token for maximum wallet compatibility"

**Why:** Memecoins need liquidity. If 60% of wallets can't hold your token, your project is DOA. Token-2022 is for institutional compliance, not memecoins.

---

### 2. Web3.js Version Confusion

**WRONG:** "I'll use @solana/web3.js 2.0 because it's newer and faster"
**RIGHT:** "I'll use @solana/web3.js 1.x because it's stable and documented"

**Why:** Web3.js 2.0 breaking changes mean:
- Anchor examples won't work
- Stack Overflow answers won't apply
- You'll spend days debugging API mismatches
- 10x crypto speed doesn't matter for learning CLI

**Upgrade path:** Build with 1.x, migrate to 2.x in 6-12 months when ecosystem catches up.

---

### 3. Private Key Security

**WRONG:** Hardcode private key in code or commit to GitHub
**RIGHT:** Use dotenv + .gitignore, load from filesystem

```typescript
// WRONG - NEVER DO THIS
const secretKey = [1,2,3,...];  // Exposed in git history

// RIGHT
import * as fs from 'fs';
const keypairPath = process.env.PAYER_KEYPAIR_PATH;
const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
```

**Why:** Compromised keys = stolen funds. Even on devnet, teaches bad habits.

---

### 4. Testing Without Bankrun

**WRONG:** Test only with solana-test-validator or skip tests
**RIGHT:** Use Bankrun for 10x faster iteration

**Why:** `solana-test-validator` takes 30-60 seconds to start. Bankrun tests run in <1 second. For a 2-week project, time is your bottleneck.

---

### 5. Skipping Metadata

**WRONG:** Create SPL token without Metaplex metadata
**RIGHT:** Always attach metadata (name, symbol, URI) via Metaplex

**Why:** Wallets won't display token properly. Looks sketchy. Metaplex metadata is 99% adoption standard.

---

## Platform-Specific Notes

### macOS (Your Platform)
- Rust installs cleanly via rustup
- Homebrew can install Solana CLI: `brew install solana`
- M1/M2 ARM: Rust and Anchor work natively (no Rosetta needed)

### Windows
- Use WSL2 for Anchor (native Windows support incomplete)
- Solana CLI works natively
- See [Anchor Windows guide](https://chukwuemekeclinton.hashnode.dev/step-by-step-guide-setting-up-anchor-on-windows-for-solana-development)

### Linux
- Most straightforward platform
- Use package manager or rustup/shell scripts

**Confidence:** MEDIUM - Platform notes from community experience.

---

## Upgrade Path (Post-Class)

After mastering basics with this stack, consider:

1. **Web3.js 2.0 migration** (6-12 months)
   - When Anchor ecosystem catches up
   - 26% smaller bundles, 10x faster crypto
   - Breaking API changes require refactor

2. **Token-2022 exploration** (optional)
   - If building compliance-focused product
   - Not for standard memecoins

3. **Raydium integration** (post-class)
   - Automated liquidity pool creation
   - Requires understanding AMM mechanics
   - Deferred per project scope

**Confidence:** HIGH - Realistic upgrade timeline.

---

## Confidence Assessment

| Area | Level | Reasoning |
|------|-------|-----------|
| Core Stack (Anchor, Rust, Solana CLI) | HIGH | Verified from official docs and release notes. Versions current as of Feb 2026. |
| TypeScript Libraries (@solana/web3.js, spl-token) | HIGH | Verified from npm and official announcements. 1.x vs 2.x decision based on ecosystem state. |
| Metaplex Stack (Umi, mpl-token-metadata) | HIGH | Verified from Metaplex docs. Account resize happened Aug 2025, SDKs updated. |
| CLI Framework (Commander.js) | MEDIUM | Commander vs oclif is judgment call. Both viable. Commander chosen for beginner speed. |
| Testing (Bankrun) | HIGH | Verified from Solana docs and Bankrun guides. Active development in 2025-2026. |
| Token Program Choice (Classic SPL) | HIGH | Wallet compatibility data from ecosystem analysis. Classic SPL universally supported. |
| Version Currency | MEDIUM-HIGH | Web search verified current versions. May drift within weeks (npm packages update frequently). |

---

## Stack Decision Summary

**Opinionated Recommendations:**

1. **Use Anchor 0.32.1, NOT 1.0-rc** - Stable beats cutting-edge for learning
2. **Use Web3.js 1.x, NOT 2.0** - Ecosystem compatibility beats performance for beginners
3. **Use Classic SPL Token, NOT Token-2022** - Universal wallet support beats features for memecoins
4. **Use Commander.js, NOT oclif** - Speed to shipping beats framework power for <2 week timeline
5. **Use Bankrun, NOT test-validator** - 10x faster tests = more iterations in limited time
6. **Use Devnet extensively, deploy Mainnet optionally** - Free testing, real environment

This stack optimizes for:
- **Beginner-friendliness:** Stable APIs, abundant documentation
- **Time constraints:** Fast setup, rapid iteration with Bankrun
- **Learning goals:** Anchor abstracts complexity while teaching core concepts
- **Real-world relevance:** Classic SPL + Metaplex = 99% of Solana tokens

---

## Sources

**Primary Sources (Official Documentation):**
- [Anchor Framework Documentation](https://www.anchor-lang.com/docs)
- [Anchor GitHub Releases](https://github.com/solana-foundation/anchor/releases)
- [Solana Documentation](https://solana.com/docs)
- [Solana Program Library (SPL) Docs](https://spl.solana.com/token)
- [Metaplex Developer Hub](https://developers.metaplex.com/)
- [Token Metadata Documentation](https://developers.metaplex.com/token-metadata)

**Package Registries:**
- [npm: @solana/web3.js](https://www.npmjs.com/package/@solana/web3.js)
- [npm: @solana/spl-token](https://www.npmjs.com/package/@solana/spl-token)
- [npm: @metaplex-foundation/mpl-token-metadata](https://www.npmjs.com/package/@metaplex-foundation/mpl-token-metadata)
- [npm: anchor-bankrun](https://www.npmjs.com/package/anchor-bankrun)

**Technical Guides & Comparisons:**
- [Solana Web3.js 2.0 Release Announcement - Anza](https://www.anza.xyz/blog/solana-web3-js-2-release)
- [Web3.js 2.0 Developer Guide - Helius](https://www.helius.dev/blog/how-to-start-building-with-the-solana-web3-js-2-0-sdk)
- [SPL Token vs Token-2022 Comparison - Explica](https://www.explica.co/spl-token-vs-token-2022-choosing-the-right-token-standard-for-your-project/)
- [Token-2022 vs SPL Adoption 2025 - SOLR Network](https://solr.network/blog/token-2022-vs-spl-adoption-2025)
- [Bankrun Testing Guide - QuickNode](https://www.quicknode.com/guides/solana-development/tooling/bankrun)
- [Testing with Jest and Bankrun - Solana Docs](https://solana.com/developers/guides/advanced/testing-with-jest-and-bankrun)
- [Create SPL Token with Metaplex - QuickNode](https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-create-a-fungible-spl-token-with-the-new-metaplex-token-standard)

**Setup & Best Practices:**
- [Solana Rust Requirements 2025 - Medium](https://medium.com/@palmartin99/deploying-a-solana-rust-program-in-2025-devnet-mainnet-beta-in-9-minutes-flat-616913bcdb96)
- [Solana Devnet Guide - Alchemy](https://www.alchemy.com/overviews/solana-devnet)
- [Airdropping Test SOL - QuickNode](https://www.quicknode.com/guides/solana-development/getting-started/a-complete-guide-to-airdropping-test-sol-on-solana)
- [Solana Wallet Management TypeScript - DEV Community](https://dev.to/sumana10/solana-wallet-management-with-typescript-213e)
- [Anchor Setup on Windows - HashNode](https://chukwuemekeclinton.hashnode.dev/step-by-step-guide-setting-up-anchor-on-windows-for-solana-development)

**Ecosystem Analysis:**
- [Inside Solana's Developer Toolbox 2025 - Medium](https://medium.com/@smilewithkhushi/inside-solanas-developer-toolbox-a-2025-deep-dive-7f7e6c4df389)
- [Metaplex Umi Framework - GitHub](https://github.com/metaplex-foundation/umi)
- [CLI Framework Comparison - Vonage](https://developer.vonage.com/en/blog/comparing-cli-building-libraries)
- [Building CLI with oclif - Josh Can Help](https://www.joshcanhelp.com/oclif/)

**Community Examples:**
- [Solana Memecoin Maker - GitHub](https://github.com/techleadhd/memecoin-maker)
- [Solana Memetoken Starter Kit - GitHub](https://github.com/solana-memetoken-starterkit/solana-memetoken-starter)
- [Solana Bankrun - GitHub](https://github.com/kevinheavey/solana-bankrun)
- [Anchor Bankrun - GitHub](https://github.com/kevinheavey/anchor-bankrun)

---

**Last Updated:** 2026-02-04
**Researcher Confidence:** MEDIUM-HIGH (verified with current sources, some version drift expected within weeks)
