# DeezLink — Product Requirements Document

## Problem statement (user request)
> "https://github.com/networkchannel/DeezNouveau — J'aimerais une refonte graphique
> dans le style de cette boutique, avec le même style de bouton et de fond:
> https://crystality.win/"

## Latest updates (Feb 2026)
- **[2026-04-20]** **Panel Admin — ajout manuel** : (1) nouveau endpoint `POST /api/admin/orders/manual-create` qui crée une commande depuis le dashboard (pack_id ou quantity personnalisée, statut completed/pending, assignation auto depuis stock ou liste explicite, option envoi email, points fidélité crédités). (2) UI dans `AdminDashboard.js` — formulaire "Ajouter une commande manuelle" dans l'onglet Commandes + formulaires "Ajouter un lien" et "Importer en masse" dans l'onglet Liens (remplace le cablage cassé où `handleAddSingle`/`handleImport` existaient sans UI). (3) Nouveau modèle `AdminManualOrder` Pydantic.
- **[2026-02-20 v3]** **Refactor + polish (5 tâches batch)** : (1) Spring momentum sur CTA primaire (cubic-bezier 0.34,1.56,.64,1) + Reveal/StaggerItem utilisent framer-motion spring (stiffness 90/95, damping 18/17). (2) `constants/pricing.js` = single source of truth (PACKS, LANDING_PACK_IDS, OFFERS_PACK_IDS, VOLUME_TIERS, getUnitPrice). (3) data-testid ajoutés sur `footer-link-*` (legal-notice, terms, privacy, refund) et `custom-quantity-cta`. (4) Telemetry 401 silencé (plus de spam console). (5) Landing.js splitté 632→493 lignes, 3 sous-composants dans `components/landing/` (FeaturesSection, PricingSection, FAQSection).
- **[2026-02-20]** **Pages légales routées** : `/conditions`, `/confidentialite`, `/remboursement` ajoutées dans `App.js`. Liens `#` du Footer remplacés par les routes correspondantes.
- **[2026-02]** **Sélecteur de langue visible dans le Header** : dropdown avec drapeaux emoji (🇫🇷 🇬🇧 🇪🇸 🇵🇹 🇩🇪 🇹🇷 🇳🇱 🇸🇦) + noms natifs + code pays + checkmark violet sur langue active. Auto-RTL pour l'arabe.
- **[2026-02]** **Traductions 8 langues étendues aux pages secondaires** : Offers, GiftCards, Profile, OrderHistory, OrderConfirmation, CartSlidePanel, PricingModal, CustomQuantity (FR/EN/ES/PT/DE/TR/NL/AR) via helper `pickLang`
- **[2026-02]** Scroll fluide aligné avec Micord : Lenis simplifié en `{ autoRaf: true, anchors: { offset: -80 } }`
- **[2026-02]** Hero "deezlink" : "link" coloré en `text-violet-500` dans le gros titre Landing
- **[2026-02]** Remise fidélité affichée dans Checkout : badge vert "−X% · Tier" avec sous-total barré + total final (lit `user.loyalty_tier` depuis `/api/auth/me`)
- **[2026-02]** Traductions complètes 8 langues (FR/EN/ES/PT/DE/TR/NL/AR) via helper `pickLang` dans : Landing (hero, features, pricing, FAQ, CTA), Checkout (summary, steps, errors), Header (nav, CTAs), Footer (nav, legal, payment), FloatingCTA
- **[2026-02]** Nouveau utilitaire `/app/frontend/src/utils/langPick.js` — fallback order: requested lang → en → fr → first value
- **[2026-02]** Logos Sparkles retirés de côté de "deezlink" dans Header + Footer
- **[2026-02]** Card "Ready to listen without limits?" placée en dessous de la section FAQ dans Landing.js


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
