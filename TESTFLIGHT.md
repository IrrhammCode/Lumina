# Lumina — TestFlight Checklist

Lumina ships as a **native iOS shell (Capacitor)** that loads your **production HTTPS URL**. API routes, Magic auth, and settlements stay on the server (Vercel). The App Store binary is the native wrapper + icons + Face ID permission.

## Prerequisites

| Item | Status |
|------|--------|
| Apple Developer Program ($99/yr) | [developer.apple.com](https://developer.apple.com) |
| Mac with **Xcode 16+** | Required to archive |
| **Production deploy** (Vercel) | `CAPACITOR_SERVER_URL` must be HTTPS |
| Bundle ID `app.lumina.care` | Register in Apple Developer → Identifiers |

## 1. Deploy backend first

```bash
# Vercel (example)
npx vercel login
npx vercel --prod
```

Set production env on Vercel (same as `env.example`). Minimum:

- `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY`
- `MAGIC_SECRET_KEY`
- `NEXT_PUBLIC_UA_TREASURY`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` → `https://your-app.vercel.app`
- `WEBAUTHN_RP_ID` → `your-app.vercel.app`
- `WEBAUTHN_ORIGIN` → `https://your-app.vercel.app`
- `PINATA_JWT` (recommended — data persistence)

**Magic Dashboard** — add production domain + redirect `https://your-app.vercel.app/login/oauth`.

## 2. Point Capacitor at production

```bash
# .env.local or shell export
export CAPACITOR_SERVER_URL=https://your-app.vercel.app
export IOS_BUNDLE_ID=app.lumina.care

npm run ios:prepare
```

This regenerates icons/splash, syncs plugins, and embeds `server.url` into the iOS project.

## 3. Open Xcode

```bash
npm run ios:open
```

In Xcode (**App** target):

1. **Signing & Capabilities** → Team = your Apple Developer team
2. Confirm **Bundle Identifier** = `app.lumina.care`
3. **General** → Version `1.0`, Build `1` (increment build each upload)
4. Destination = **Any iOS Device (arm64)**

## 4. Archive & upload

1. **Product → Archive**
2. **Distribute App → App Store Connect → Upload**
3. Wait for processing in [App Store Connect](https://appstoreconnect.apple.com)

Export compliance: `ITSAppUsesNonExemptEncryption = false` is already set in `Info.plist` (HTTPS only).

## 5. App Store Connect metadata

Create app **Lumina**:

| Field | Suggested value |
|-------|-----------------|
| Name | Lumina |
| Subtitle | Care for family abroad |
| Category | Finance |
| Privacy Policy URL | Required — host a simple page |
| Support URL | `mailto:hello@lumina.app` or landing page |

**App Review notes** (paste for reviewer):

> Lumina is a diaspora care app. Users sign in with Apple/Google via Magic embedded wallet, enroll Face ID (WebAuthn passkey), and send USDT care payments on Arbitrum. The iOS app is a native Capacitor shell loading our hosted web app at `CAPACITOR_SERVER_URL`. Test account: sign in with Apple on the welcome screen. Face ID is used for app unlock and payment confirmation.

**Screenshots**: iPhone 6.7" (15 Pro Max) — Welcome, Dashboard, Care Compass, Face ID sheet, Receipt.

## 6. TestFlight

1. App Store Connect → **TestFlight** → select build
2. Answer **Export Compliance** → No (standard HTTPS)
3. **Internal testing** → add your Apple ID (instant)
4. **External testing** → submit for Beta App Review (~24h)

Install **TestFlight** on iPhone → accept invite → open Lumina.

## 7. Verify on device

- [ ] Apple/Google login (Magic OAuth)
- [ ] Magic Moment + onboarding
- [ ] Face ID enroll + unlock gate
- [ ] Care Compass → send (needs funded wallet)
- [ ] Family portal share (`/ask`)
- [ ] Safe area / notch layout OK

## Scripts reference

| Command | Purpose |
|---------|---------|
| `npm run ios:assets` | Regenerate PNG icons + Xcode asset catalog |
| `npm run ios:sync` | Sync web shell + Capacitor plugins |
| `npm run ios:prepare` | assets + sync (run before each archive) |
| `npm run ios:open` | Open `ios/App/App.xcworkspace` in Xcode |

## Troubleshooting

**Blank white screen** — `CAPACITOR_SERVER_URL` not set or server down. Re-run `ios:prepare` with correct URL.

**Magic OAuth fails** — add production URL to Magic Dashboard allowlist.

**Face ID not offered** — requires HTTPS production URL; WebAuthn RP ID must match domain.

**Apple rejects “minimum functionality”** — emphasize native Face ID permission, native splash/status bar, and care-payment signing in review notes.

## Version bumps

Each TestFlight upload needs a higher **Build** number in Xcode (e.g. 1 → 2). Marketing version can stay `1.0` until App Store release.