# Lumina

**They ask. You approve.**

Lumina is a diaspora care hub — family back home sends requests (PULL), you approve and send (PUSH). Pulsa, school fees, medicine, bills. Built to feel like Cash App or Revolut, not a crypto app.

---

## Magic Labs Bonus Challenge ($500)

Lumina uses **Magic's embedded wallet as primary authentication** when `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` is set. Users sign in with **Google, Apple, or email OTP** — Magic provisions a non-custodial Arbitrum wallet invisibly. No MetaMask, no seed phrase, no browser extension.

### Why this is creative

Most hackathon wallets stop at login. Lumina treats Magic as the **invisible signing layer** across the full care journey:

| Judge criteria | Lumina implementation |
|---|---|
| Smooth onboarding & auth | Apple-first on iPhone, OAuth redirect, DID token verify server-side |
| Creative Magic use | **Tavily AI → one-tap send** — research care costs, Face ID, Magic `personal_sign` |
| Consumer-ready UX | **Magic Care Card** (fintech debit-card UI), Care ID not wallet jargon |
| UX polish | Magic Moment celebration, biometric sheet with Magic badge, first-send nudge |
| Technical quality | `@magic-sdk/admin` session validation, Arbitrum network config, settlement signing |

### The flow (90-second demo)

1. **Welcome** → *"Magic embedded wallet · invisible to you"*
2. **Create account** → Continue with Apple or Google
3. **Magic Moment** → bottom sheet: *"Your care wallet is ready"* + Care ID
4. **Onboarding** → wallet reveal step (no connect button) + **Tavily live insight** for family's country
5. **Care Pledge** (optional) → `personal_sign` commitment with embedded wallet
6. **Dashboard** → Magic Care Card + **Care Compass**
7. **Care Compass** → ask *"Pulsa budget for mom?"* → Tavily researches → tap **Send $20 now**
8. **Face ID** → Magic wallet signs invisibly → family sees proof in ~10s

**One-liner for judges:** *Tavily AI knows what to send; Magic wallet signs without the user ever knowing crypto exists.*

### Architecture

```
User (Google/Apple/Email)
        │
        ▼
  Magic SDK (client)          OAuthExtension + Email OTP
        │                     Embedded wallet on Arbitrum (42161)
        ▼
  POST /api/auth/magic/verify
        │
        ▼
  @magic-sdk/admin            DID token validation
        │
        ▼
  Lumina session (JWT cookie)  User + wallet address stored
        │
        ├── Care Compass ──► Tavily API (live care cost research)
        │
        └── Approve / Pay ──► Magic personal_sign (demo settlement)
```

Particle Universal Accounts remain available as fallback when only Particle keys are configured.

### Key files

| Path | Purpose |
|---|---|
| `components/MagicSignInPanel.tsx` | Google / Apple / email login UI |
| `app/login/oauth/page.tsx` | OAuth callback (`getRedirectResult`) |
| `app/api/auth/magic/verify/route.ts` | Server-side DID token verification |
| `lib/magic.ts` | Magic SDK + OAuth2 extension |
| `lib/magic-settlement.ts` | `personal_sign` for care payments |
| `components/MagicCareCard.tsx` | Consumer fintech wallet card |
| `components/CareCompass.tsx` | Tavily AI + one-tap Magic Express Pay |
| `components/MagicMoment.tsx` | First-login wallet reveal celebration |
| `app/onboarding/OnboardingMagicWalletStep.tsx` | Invisible wallet onboarding step |
| `lib/magic-pledge.ts` | Optional care commitment signature |

### Environment

```env
# Magic Labs (required for bonus track)
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
MAGIC_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://your-domain.com   # OAuth redirect base

# Tavily AI — Care Compass live research
TAVILY_API_KEY=tvly-...

# Session
JWT_SECRET=your-secret
```

**Magic Dashboard setup**

1. [dashboard.magic.link](https://dashboard.magic.link) → create app
2. Enable **Google**, **Apple**, and **Email OTP**
3. Domain allowlist: `localhost:3000`, your production URL, Mac LAN IP for iPhone testing
4. Redirect allowlist: `{origin}/login/oauth`

---

## Getting started

```bash
npm install
cp env.example .env.local   # add Magic + Tavily keys
npm run dev
```

**iPhone testing** (production bundle, ~1 MB vs 12 MB dev):

```bash
npm run preview:mobile
# open http://<your-mac-ip>:3000 on Safari
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local dev server |
| `npm run dev:mobile` | Dev server on `0.0.0.0` for LAN devices |
| `npm run preview:mobile` | Production build + serve on LAN (recommended for iPhone) |
| `npm run build` | Production build |

## Stack

- **Next.js 16** — App Router
- **Magic Embedded Wallets** — primary auth + invisible signing
- **Tavily AI** — Care Compass live research
- **Arbitrum** — settlement layer
- **IPFS (Pinata)** — wallet-owned care graph
- **Particle UA** — optional cross-chain fallback

## Links

- [Magic Embedded Wallets docs](https://docs.magic.link/embedded-wallets/introduction)
- [Tavily API](https://tavily.com)
- Repo: [github.com/IrrhammCode/Lumina](https://github.com/IrrhammCode/Lumina)