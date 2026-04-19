# DeezLink — Product Requirements Document

## Problem statement (user request)
> "https://github.com/networkchannel/DeezNouveau — J'aimerais une refonte graphique
> dans le style de cette boutique, avec le même style de bouton et de fond:
> https://crystality.win/"

User choices captured:
- Clone the repo and work directly on it
- Full redesign (visual + UX/animations)
- Reference aesthetics: dark background with gradients/effects, bold modern typography, visual animations
- Content may be rearranged
- Stack kept as is (React + FastAPI + MongoDB)

## Product goal
DeezLink is a store selling Deezer Premium activation links. The store
accepts crypto payments (OxaPay), delivers links by email within minutes,
offers gift cards, and provides a loyalty program.

## Architecture
- **Frontend**: React 19 + Craco, Tailwind CSS, Radix UI, framer-motion, react-i18next
- **Backend**: FastAPI + Motor (MongoDB) + slowapi + bcrypt/JWT auth + custom click captcha + IP scoring
- **External integrations** (pre-existing, preserved):
  - OxaPay (crypto payments)
  - Deezer public API (trending tracks/artists/albums displayed on landing)
  - SMTP (magic link + order confirmation emails)

## Design language (Jan 2026 refonte — crystality-inspired)
- Pure black background `#050505` with subtle violet halo (radial) + light grid mask + fine noise overlay
- Single violet accent family (`#8b5cf6` / `#7c3aed` / `#5b21b6`) — no pink/orange/blue/amber
- Typography: `Bricolage Grotesque` (display, headings), `Manrope` (body), `JetBrains Mono` (mono)
- Buttons: pill-shaped `.btn-primary` (violet gradient with glow) + `.btn-secondary` (dark + border)
- Badges: `.pill` (rounded-full, dark bg, thin border, optional pulse dot)
- Cards: `.card-surface` (gradient border + glass bg)
- Header: floating pill-shaped nav bar (sticky)
- Footer: minimal, violet-bordered CTA banner on top

## User personas
1. **Music fan** — wants Deezer Premium cheaper, short-term, anonymous payment.
2. **Gift giver** — buys a gift card for friends/family.
3. **Reseller** — buys bulk packs for discount (Business/Custom quantity).
4. **Admin** — manages links inventory, sees presence/metrics.

## Core functional requirements (static)
- Browse packs (Starter / Essential / Premium / Business) + custom quantity
- Add to cart (slide panel) + checkout
- Crypto payment via OxaPay
- Email-delivered activation links with guarantee
- Gift cards (presets + custom, with personalised message)
- Magic-link login + JWT auth
- Admin dashboard (existing)
- Loyalty tiers (Bronze → Diamond)
- Security telemetry + click captcha (conditional on IP score)

## What's been implemented (timeline)
- **Prior work (pre-migration)**: full DeezLink storefront, auth, checkout, gift
  cards, admin, loyalty, telemetry/captcha system.
- **Jan 18-19, 2026 — Crystality refonte**:
  - Global design tokens rewritten (`/app/frontend/src/index.css`, `tailwind.config.js`)
  - `AnimatedBackground` simplified to violet halo + grid + noise
  - `Header` redesigned to floating pill-shaped nav with central links + right CTA
  - `Footer` redesigned with a top "Ready to listen" CTA banner (Home-only)
  - `Landing` fully rewritten: hero (pill + big display title + 2 CTAs +
    album mosaic using Deezer trending, no text overlay), metrics bar (3 stats),
    features grid (6), pricing (3 packs with clean violet badges), FAQ accordion
  - All garish `from-purple/pink/orange` gradients replaced with unified violet
- **Jan 19, 2026 — Follow-up tweaks**:
  - Admin red Shield icon restored in header right side (admin users only)
  - Mobile header: tighter padding, Lang icon always visible, mobile menu with
    Get Started CTA pill
  - Subtle hover animations on all cards: `card-surface` translateY(-3px) +
    violet border; same on pricing packs in Offers/Landing
  - Checkout flow fix: backend `PACKS` aligned to frontend pack IDs
    (single / pack_3 / pack_5 / pack_10) instead of the legacy solo/duo/family
  - Badges cleaned: plain violet pill without shadow/icon (no more "pink bars")

## Verified working (as of Jan 19)
- All pages load: `/`, `/offers`, `/gift-cards`, `/login`, `/checkout/:pack_id`
- All 4 checkout flows: single / pack_3 / pack_5 / pack_10 → correct pack
  details + email field + OxaPay crypto pay button
- **OxaPay end-to-end PRODUCTION** with key `EWVVRZ-Y40MQP-ZZBKWM-GRJ8UT`
  (sandbox=false): order creation → payLink returned (`https://pay.oxapay.com/...`)
  → redirect works. Verified with pack_10 at 35.525 EUR.
- **A/B testing system** (experiment `best_value_label` on pack_10 badge):
  - variant A = "Best value" / "Meilleur prix"
  - variant B = "Le plus choisi" / "Most chosen"
  - 50/50 split, persisted via `localStorage`
  - `/api/ab/track` logs `view` (auto on mount), `click` (Buy now), `conversion`
    (on order create)
  - `/api/ab/stats/{experiment}` returns aggregated CTR/CR per variant
- Cart slide panel, gift cards, FAQ accordion, mobile nav
- Backend APIs: `/api/packs`, `/api/stats/public`, `/api/deezer/trending`,
  `/api/pricing/calculate`, `/api/security/*`, `/api/ab/*`
- Testing agent: backend 100% / frontend 100% (iteration_4)

## Prioritized backlog

### P1 (nice-to-have next)
- [ ] Add subtle framer-motion entrance animations to pricing cards + FAQ open
- [ ] Replace the hero album mosaic top-right image when Deezer trending is
      empty with a violet illustration (currently shows plain gradient fallback)
- [ ] i18n review — testimonials and FAQ are only in FR/EN (add ES/PT/DE/AR)
- [ ] Add Discord CTA in footer (crystality has one — community signal)

### P2 (future)
- [ ] Refactor `Offers.js` to use the new `.card-surface` + `.btn-primary`
      classes instead of inline gradient classes (code hygiene)
- [ ] `Profile.js` tier badges — unify color palette to violet monochrome
- [ ] Cart slide panel — polish with new pill buttons
- [ ] Dark/light toggle? (not requested, but crystality suggests light theme
      variant would work — skip unless asked)

## Known caveats
- Hot reload left a stale "Compiled with problems" overlay in the very first
  screenshot after `yarn install`; resolved after the second recompile.
- `ClickCaptchaWidget.js:88` still has a react-hooks/exhaustive-deps eslint
  warning (pre-existing, not introduced by refonte).

## Next action items
1. Ship current refonte to user for visual feedback.
2. Optionally iterate on remaining P1 items based on user preference.
3. User can request further tweaks (colors, fonts, layout) — the unified
   design system (`index.css` + `tailwind.config.js`) makes it a one-line change.
