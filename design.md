---
version: alpha
name: Lumina
description: "Global remittance, Wise-clear UX with Lumina warmth — sage canvas, white cards, gold primary pulse, violet accent glow. Built for migrant families: send money in seconds with zero visible crypto."

colors:
  primary: "#F0B429"
  primary-hover: "#F5C542"
  primary-pale: "#FDF4E0"
  on-primary: "#0E0F0C"
  glow: "#8B7CF6"
  glow-pale: "#EDE9FE"
  ink: "#0E0F0C"
  ink-deep: "#163300"
  body: "#454745"
  mute: "#868685"
  canvas: "#FFFFFF"
  canvas-soft: "#E8EBE6"
  border: "#0E0F0C"
  border-soft: "#D4D7D2"
  positive: "#2EAD4B"
  positive-deep: "#054D28"
  warning: "#FFD11A"
  negative: "#D03238"
  savings: "#2EAD4B"

typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.02em
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  amount:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1
    fontFeatureSettings: "tnum"

spacing:
  base: 4px
  scale: [4, 8, 12, 16, 24, 32, 48]

radius:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  pill: 9999px

motion:
  duration-fast: 150ms
  duration-base: 250ms
  easing: cubic-bezier(0.22, 1, 0.36, 1)
---

## Rationale

**Wise layout, Lumina soul** — Lumina adopts the remittance UX patterns that users already trust (sage canvas, white elevated cards, bold amount typography, inline fee transparency) while replacing competitor-green with a luminous gold primary and violet accent for brand recognition.

**Gold = forward motion** — Primary gold appears only on CTAs, savings badges, and active transfer states. Never on passive chrome.

**Fee transparency inline** — Savings vs Wise/WU shown during amount entry, not a separate step. Reduces friction from 5 steps to 4.

## App Flow

```
Welcome → Login → Home
                    ├→ Send: Recipient → Amount+Fees → Review → Biometric → Done
                    ├→ Activity (history)
                    └→ You (settings)
```

## Components

- **converter-card** — Wise-style bordered white card for amount entry
- **button-primary** — Gold pill-rectangle, rounded-xl, ink text
- **card-content** — White on sage, rounded-xl, no border (elevation via contrast)
- **card-bordered** — White with 1px ink border for converter/forms
- **list-row** — 52px min-height, flag thumbnail, name + subtitle
- **badge-savings** — Green pale background, positive-deep text