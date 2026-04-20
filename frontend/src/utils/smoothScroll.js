/**
 * Native smooth scroll helpers (no Lenis).
 * Relies on CSS `scroll-behavior: smooth` + `scroll-padding-top` for anchors.
 * Kept as a thin shim so existing imports keep working.
 */

export function initSmoothScroll() {
  // Native CSS scroll-behavior takes care of everything.
  // We just ensure the html has a sensible scroll-padding for anchor offsets.
  if (typeof document !== "undefined") {
    document.documentElement.style.scrollPaddingTop = "88px";
  }
  return null;
}

export function destroySmoothScroll() {
  // no-op
}

export function getLenis() {
  return null;
}

/**
 * Scroll programmatique vers une cible.
 * target: sélecteur CSS, élément DOM, ou valeur Y en pixels.
 */
export function smoothScrollTo(target, options = {}) {
  const offset = options.offset ?? 0;

  if (typeof target === "number") {
    window.scrollTo({ top: target + offset, behavior: "smooth" });
    return;
  }

  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const y = window.scrollY + rect.top + offset;
  window.scrollTo({ top: y, behavior: "smooth" });
}
