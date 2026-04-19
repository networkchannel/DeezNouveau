# DeezLink — Product Requirements Document

## Problem statement (user request)
> "https://github.com/networkchannel/DeezNouveau — J'aimerais une refonte graphique
> dans le style de cette boutique, avec le même style de bouton et de fond:
> https://crystality.win/"

## Latest updates (Feb 2026)
- **[2026-02]** Removed Sparkles logo icon next to "deezlink" brand (Header + Footer)
- **[2026-02]** "link" in "deezlink" upgraded to `text-violet-500` (brighter) in both Header and Footer
- **[2026-02]** Relocated "Ready to listen without limits?" CTA from Footer to Landing.js, now below the FAQ section
- **[2026-02]** Simplified Lenis config: `lerp: 0.12`, `wheelMultiplier: 1.0`, `syncTouch: false` — scroll now responsive & smooth (was perceived as broken due to over-tuned inertia `lerp: 0.06` + `wheelMultiplier: 0.7`)


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
- **Jan 19, 2026 — Multi-pack cart + exact price alignment**:
  - Nouveau endpoint `POST /api/orders/create-multi` qui somme EXACTEMENT les
    prix des packs du panier (plus de tarif volumique imposé sur multi-cart).
    Valide chaque `pack_id`, limite count ≤ 50 et total_quantity ≤ 500,
    gère captcha/telemetry/AB tracking, paie via OxaPay avec `feePaidByPayer:0`.
  - `Offers.addToCart` préserve `linkCount: pack.quantity` (séparé du cart count).
  - `CartSlidePanel.handleCheckout` :
    - 1 item × 1 → `/checkout/{pack_id}` (comportement single existant)
    - sinon → stocke les items en `sessionStorage.deezlink_multi_cart` et
      navigue vers `/checkout/multi`
  - `Checkout.js` gère le mode multi : lit sessionStorage, résout les packs
    via `/api/packs`, affiche un breakdown 3 lignes (pack_starter ×1 · 1 link
    · 5.00€/pack · 5.00€) et le total strictement égal à la somme cart.
  - Corrigé le fallback NaN sur `customQty` et remplacé les redirects silencieux
    par un message d'erreur visible avec bouton "Back to offers".
  - testing_agent_v3 iteration_7: 16/16 PASS (backend 100%, frontend 100%)
- **Jan 19, 2026 — Admin dashboards + OxaPay monitoring**:
  - Bug résolu : OxaPay affichait 5.075€ pour un pack 5€ (frais 1.5% ajoutés au
    payeur). Ajout de `feePaidByPayer: 0` + `lifeTime: 60` sur `/api/orders/create`
    ET `/api/orders/create-custom`. Le client voit maintenant exactement le
    montant annoncé ; le marchand absorbe les frais réseau crypto.
  - Refonte complète de `Checkout.js` en crystality-style 2 colonnes :
    - Stepper top-right (Pick a pack ✓ / Email & pay / Get links)
    - Colonne gauche : Summary card (icône produit, prix unitaire),
      bloc total en violet "Exact amount — no hidden fees", 4 trust bullets
      (Instant delivery / 30-day guarantee / 100% anonymous / 24/7 support)
    - Colonne droite : input email à grosse forme pill, 4 pills crypto
      (BTC/ETH/USDT/LTC), bouton CTA "Proceed to payment · {montant}€"
      avec icône Lock, note "Secure payment via OxaPay"
    - Section "What happens next" (redirect → crypto pay → delivery)
  - Bouton "Back" redirige vers `/offers` au lieu de `/`
  - testing_agent_v3 iteration_6: 13/13 PASS (backend 100%, frontend 100%)
  - `/admin/ab` : live A/B stats (views/clicks/conversions/CTR/CR),
    two-proportion z-test with auto-winner verdict when p < 0.05,
    refresh every 15s
  - `/admin/oxapay` : webhook event log with status badges, counters
    (Paid/Failed/Error/Other), retry form (`POST /api/admin/orders/{id}/retry`
    re-assigns missing links + resends email, idempotent)
  - Webhook handler enriched: persists every event to `db.oxapay_webhooks`
    (audit trail), idempotent on Paid/Confirmed, email send wrapped in
    try/except to not fail webhook on SMTP issues
  - AdminDashboard header: new quick-access pills "A/B stats" and "OxaPay"
  - Hero mosaic: 5th artist tile added (bottom-right cell, was empty)
  - Pricing card hover: translate moved to outer wrapper so the badge
    follows the card instead of staying in place

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
