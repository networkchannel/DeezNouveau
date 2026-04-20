/**
 * Single source of truth for pricing.
 * Both Landing (Our pricing section) and Offers page pull from here.
 *
 * Each price is the TOTAL pack price in EUR.
 * `unit` is price-per-link (computed on the fly to avoid drift, but stored
 * as string here for display so we don't re-compute on every render).
 */

export const VOLUME_TIERS = [
  { min: 1,   max: 9,    unit: 5.00 },
  { min: 10,  max: 19,   unit: 4.50 },
  { min: 20,  max: 49,   unit: 4.00 },
  { min: 50,  max: 99,   unit: 3.50 },
  { min: 100, max: 1000, unit: 3.00 },
];

export function getUnitPrice(quantity) {
  const q = Number(quantity) || 0;
  for (const t of VOLUME_TIERS) {
    if (q >= t.min && q <= t.max) return t.unit;
  }
  return VOLUME_TIERS[0].unit;
}

/**
 * PACKS — 4 canonical packs shown on /offers.
 * Landing shows 3 of them (single, pack_3, pack_10).
 */
export const PACKS = {
  single: {
    id: "single",
    landingId: "starter",
    name: "Starter",
    quantity: 1,
    price: 5,
    strike: null,
    unit: "5.00",
  },
  pack_3: {
    id: "pack_3",
    landingId: "popular",
    name: "Essential",
    quantity: 3,
    price: 12,
    strike: 15,
    unit: "4.00",
    savePct: 20,
    highlight: true,
  },
  pack_5: {
    id: "pack_5",
    name: "Premium",
    quantity: 5,
    price: 20,
    strike: 25,
    unit: "4.00",
    savePct: 20,
  },
  pack_10: {
    id: "pack_10",
    landingId: "premium",
    name: "Business",
    landingName: "Premium",
    quantity: 10,
    price: 35,
    strike: 50,
    unit: "3.50",
    savePct: 30,
    landingHighlight: true,
  },
};

export const LANDING_PACK_IDS = ["single", "pack_3", "pack_10"];
export const OFFERS_PACK_IDS = ["single", "pack_3", "pack_5", "pack_10"];
