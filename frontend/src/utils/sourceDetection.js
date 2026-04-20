/**
 * Source detection utility — detects where the user came from
 * (TikTok, Instagram, YouTube, Facebook, X/Twitter) based on:
 *   - UTM parameters (utm_source / utm_medium / utm_campaign)
 *   - document.referrer
 *   - custom ?src= query param (manual tagging)
 *
 * Persists the detected source in sessionStorage so subsequent
 * pages and the CTA system can render a platform-tailored message.
 *
 * Public API:
 *   - detectSource()       → { platform, detectedAt } | null (also sets SS)
 *   - getSource()          → same object from SS, or calls detectSource()
 *   - getSourceCTA(lang)   → { label, subLabel } localized, adapted to platform
 *
 * Non-breaking: if no source is detected, platform is "direct".
 */

const STORAGE_KEY = "dz_source_v1";

/** Host patterns to platform id. Keep list small & robust. */
const HOST_MAP = [
  { re: /(^|\.)tiktok\.com$/i,       id: "tiktok" },
  { re: /(^|\.)vm\.tiktok\.com$/i,   id: "tiktok" },
  { re: /(^|\.)instagram\.com$/i,    id: "instagram" },
  { re: /(^|\.)l\.instagram\.com$/i, id: "instagram" },
  { re: /(^|\.)youtube\.com$/i,      id: "youtube" },
  { re: /(^|\.)youtu\.be$/i,         id: "youtube" },
  { re: /(^|\.)m\.youtube\.com$/i,   id: "youtube" },
  { re: /(^|\.)facebook\.com$/i,     id: "facebook" },
  { re: /(^|\.)fb\.com$/i,           id: "facebook" },
  { re: /(^|\.)m\.facebook\.com$/i,  id: "facebook" },
  { re: /(^|\.)l\.facebook\.com$/i,  id: "facebook" },
  { re: /(^|\.)lm\.facebook\.com$/i, id: "facebook" },
  { re: /(^|\.)twitter\.com$/i,      id: "x" },
  { re: /(^|\.)x\.com$/i,            id: "x" },
  { re: /(^|\.)t\.co$/i,             id: "x" },
];

const UTM_MAP = {
  tiktok: "tiktok", tt: "tiktok",
  instagram: "instagram", ig: "instagram", insta: "instagram",
  youtube: "youtube", yt: "youtube",
  facebook: "facebook", fb: "facebook", meta: "facebook",
  twitter: "x", x: "x",
};

const KNOWN_PLATFORMS = ["tiktok", "instagram", "youtube", "facebook", "x"];

function readStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(obj) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); }
  catch { /* ignore */ }
}

export function detectSource() {
  if (typeof window === "undefined") return null;

  const existing = readStorage();
  if (existing && existing.platform) return existing;

  let platform = "direct";
  let detectedBy = null;

  try {
    const qs = new URLSearchParams(window.location.search);

    // 1) explicit ?src=tiktok  (or ?source=, ?ref=)
    const srcParam = (qs.get("src") || qs.get("source") || qs.get("ref") || "").toLowerCase().trim();
    if (srcParam && UTM_MAP[srcParam]) {
      platform = UTM_MAP[srcParam];
      detectedBy = "src_param";
    }

    // 2) utm_source
    if (platform === "direct") {
      const utmSrc = (qs.get("utm_source") || "").toLowerCase().trim();
      if (utmSrc && UTM_MAP[utmSrc]) {
        platform = UTM_MAP[utmSrc];
        detectedBy = "utm_source";
      }
    }

    // 3) document.referrer host
    if (platform === "direct" && document.referrer) {
      try {
        const u = new URL(document.referrer);
        const hit = HOST_MAP.find((h) => h.re.test(u.hostname));
        if (hit) {
          platform = hit.id;
          detectedBy = "referrer";
        }
      } catch { /* malformed referrer */ }
    }
  } catch { /* ignore */ }

  const payload = {
    platform,
    detectedBy,
    detectedAt: new Date().toISOString(),
  };
  writeStorage(payload);
  return payload;
}

export function getSource() {
  return readStorage() || detectSource();
}

/**
 * Platform-adapted CTA copy.
 * Returns { label, sub, pill } where:
 *   - label   = the bold action button text
 *   - sub     = short support line (for floating / hero)
 *   - pill    = small attention pill (badge)
 * Falls back to "default" bucket when platform not recognised.
 */
const CTA_BY_PLATFORM = {
  tiktok: {
    fr: { label: "Active ton Deezer Premium dès 5€",      sub: "Vu sur TikTok · Livraison instantanée",  pill: "Offre TikTok" },
    en: { label: "Get Deezer Premium — from 5€",          sub: "Seen on TikTok · Instant delivery",      pill: "TikTok deal" },
    es: { label: "Activa tu Deezer Premium desde 5€",     sub: "Visto en TikTok · Entrega instantánea",  pill: "Oferta TikTok" },
    pt: { label: "Ative o Deezer Premium a partir de 5€", sub: "Visto no TikTok · Entrega instantânea",  pill: "Oferta TikTok" },
    de: { label: "Deezer Premium ab 5€ freischalten",     sub: "Gesehen auf TikTok · Sofort-Lieferung",  pill: "TikTok-Deal" },
    tr: { label: "Deezer Premium'u 5€'dan aktive et",     sub: "TikTok'ta görüldü · Anında teslimat",    pill: "TikTok teklifi" },
    nl: { label: "Deezer Premium vanaf 5€ activeren",     sub: "Gezien op TikTok · Directe levering",    pill: "TikTok-deal" },
    ar: { label: "فعّل Deezer Premium من 5€",             sub: "شوهد على تيك توك · توصيل فوري",          pill: "عرض تيك توك" },
  },
  instagram: {
    fr: { label: "Rejoins 10k+ auditeurs Premium",        sub: "Lien en bio · Sans abonnement",          pill: "Offre Insta" },
    en: { label: "Join 10k+ Premium listeners",           sub: "Link in bio · No subscription",          pill: "Insta drop" },
    es: { label: "Únete a 10k+ oyentes Premium",          sub: "Enlace en bio · Sin suscripción",        pill: "Oferta Insta" },
    pt: { label: "Junte-se a 10k+ ouvintes Premium",      sub: "Link na bio · Sem assinatura",           pill: "Oferta Insta" },
    de: { label: "Triff 10k+ Premium-Hörer",              sub: "Link in Bio · Kein Abo",                 pill: "Insta-Deal" },
    tr: { label: "10k+ Premium dinleyiciye katıl",        sub: "Biyo'daki link · Abonelik yok",          pill: "Insta teklifi" },
    nl: { label: "Sluit je aan bij 10k+ Premium-luisteraars", sub: "Link in bio · Geen abonnement",     pill: "Insta-deal" },
    ar: { label: "انضم إلى +10 آلاف مستمع Premium",        sub: "الرابط في البايو · بدون اشتراك",          pill: "عرض إنستا" },
  },
  youtube: {
    fr: { label: "Active Deezer Premium en 5 min",        sub: "Comme vu en vidéo · Paiement crypto",    pill: "Offre YouTube" },
    en: { label: "Activate Deezer Premium in 5 min",      sub: "As seen on YouTube · Crypto payment",    pill: "YouTube deal" },
    es: { label: "Activa Deezer Premium en 5 min",        sub: "Como viste en YouTube · Pago cripto",    pill: "Oferta YouTube" },
    pt: { label: "Ative Deezer Premium em 5 min",         sub: "Como visto no YouTube · Pagamento cripto", pill: "Oferta YouTube" },
    de: { label: "Deezer Premium in 5 Min. aktivieren",   sub: "Wie auf YouTube · Krypto-Zahlung",       pill: "YouTube-Deal" },
    tr: { label: "Deezer Premium'u 5 dk'da aktive et",    sub: "YouTube'da görüldüğü gibi · Kripto",     pill: "YouTube teklifi" },
    nl: { label: "Activeer Deezer Premium in 5 min",      sub: "Zoals op YouTube · Crypto-betaling",     pill: "YouTube-deal" },
    ar: { label: "فعّل Deezer Premium خلال 5 دقائق",       sub: "كما شوهد على يوتيوب · دفع كريبتو",         pill: "عرض يوتيوب" },
  },
  facebook: {
    fr: { label: "Offre exclusive Deezer Premium",        sub: "Partage-la · Livraison instantanée",     pill: "Offre Facebook" },
    en: { label: "Exclusive Deezer Premium deal",         sub: "Share it · Instant delivery",            pill: "Facebook deal" },
    es: { label: "Oferta exclusiva Deezer Premium",       sub: "Compártela · Entrega instantánea",       pill: "Oferta Facebook" },
    pt: { label: "Oferta exclusiva Deezer Premium",       sub: "Compartilhe · Entrega instantânea",      pill: "Oferta Facebook" },
    de: { label: "Exklusiver Deezer Premium-Deal",        sub: "Teile ihn · Sofort-Lieferung",           pill: "Facebook-Deal" },
    tr: { label: "Özel Deezer Premium teklifi",           sub: "Paylaş · Anında teslimat",               pill: "Facebook teklifi" },
    nl: { label: "Exclusieve Deezer Premium-deal",        sub: "Deel hem · Directe levering",            pill: "Facebook-deal" },
    ar: { label: "عرض Deezer Premium حصري",               sub: "شاركه · توصيل فوري",                     pill: "عرض فيسبوك" },
  },
  x: {
    fr: { label: "Débloque Deezer sans abonnement",       sub: "Crypto · Anonyme · 5 min chrono",        pill: "Offre X" },
    en: { label: "Unlock Deezer — no subscription",       sub: "Crypto · Anonymous · 5-min delivery",    pill: "X deal" },
    es: { label: "Desbloquea Deezer — sin suscripción",   sub: "Cripto · Anónimo · 5 min",               pill: "Oferta X" },
    pt: { label: "Desbloqueie Deezer — sem assinatura",   sub: "Cripto · Anônimo · 5 min",               pill: "Oferta X" },
    de: { label: "Deezer ohne Abo freischalten",          sub: "Krypto · Anonym · 5 Min.",               pill: "X-Deal" },
    tr: { label: "Aboneliksiz Deezer'ı aç",               sub: "Kripto · Anonim · 5 dk",                 pill: "X teklifi" },
    nl: { label: "Deezer ontgrendelen — geen abo",        sub: "Crypto · Anoniem · 5 min",               pill: "X-deal" },
    ar: { label: "افتح Deezer بدون اشتراك",                sub: "كريبتو · مجهول · 5 دقائق",                 pill: "عرض X" },
  },
  // Fallback (no source detected or unknown)
  default: {
    fr: { label: "Obtenir Deezer Premium",                sub: "Dès 5€ · Livraison en 5 min",            pill: "Nouvelle offre" },
    en: { label: "Unlock Deezer Premium",                 sub: "From 5€ · 5 min delivery",               pill: "New drop" },
    es: { label: "Obtén Deezer Premium",                  sub: "Desde 5€ · Entrega en 5 min",            pill: "Nueva oferta" },
    pt: { label: "Obter Deezer Premium",                  sub: "A partir de 5€ · Entrega 5 min",         pill: "Nova oferta" },
    de: { label: "Deezer Premium freischalten",           sub: "Ab 5€ · 5 Min. Lieferung",               pill: "Neues Angebot" },
    tr: { label: "Deezer Premium'u aç",                   sub: "5€'dan · 5 dk teslimat",                 pill: "Yeni teklif" },
    nl: { label: "Deezer Premium ontgrendelen",           sub: "Vanaf 5€ · 5 min levering",              pill: "Nieuwe deal" },
    ar: { label: "احصل على Deezer Premium",                sub: "من 5€ · توصيل خلال 5 دقائق",              pill: "عرض جديد" },
  },
};

export function getSourceCTA(lang = "fr") {
  const src = getSource();
  const platform = (src && src.platform) || "direct";
  const bucket = KNOWN_PLATFORMS.includes(platform) ? platform : "default";
  const byLang = CTA_BY_PLATFORM[bucket] || CTA_BY_PLATFORM.default;
  const copy = byLang[lang] || byLang.en || CTA_BY_PLATFORM.default.en;
  return { ...copy, platform: bucket };
}

/** Reset for tests / debug (also exposed on window in dev). */
export function resetSource() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

if (typeof window !== "undefined") {
  // dev helper
  window.__dzSource = { detectSource, getSource, getSourceCTA, resetSource };
}
