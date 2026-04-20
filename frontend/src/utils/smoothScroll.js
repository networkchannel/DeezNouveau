import Lenis from "lenis";
import "lenis/dist/lenis.css";

let lenisInstance = null;

export function initSmoothScroll() {
  if (typeof window === "undefined") return null;
  if (lenisInstance) return lenisInstance;

  // Respect user preference
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return null;

  lenisInstance = new Lenis({
    // RAF géré en interne par Lenis
    autoRaf: true,

    // Fluidité du scroll — plus bas = plus fluide/inertiel (défaut 0.1)
    // 0.08 donne un rendu très soyeux proche des sites premium
    lerp: 0.08,

    // Scroll vers les ancres (#section) avec offset pour le header sticky
    anchors: {
      offset: -88,
    },

    // Active Lenis sur les écrans tactiles (mobile) — sans ça le scroll tactile
    // reste natif et n'a pas le même feel "lissé" qu'au desktop
    syncTouch: true,
    syncTouchLerp: 0.075,
    touchInertiaMultiplier: 25,

    // Laisse les éléments scrollables imbriqués (cart panel, dropdowns,
    // sélecteur de langue, modales) scroller nativement
    allowNestedScroll: true,

    // Arrête l'inertie de scroll quand on clique sur un lien interne
    stopInertiaOnNavigate: true,

    // Active/désactive automatiquement Lenis quand overflow change
    // (utile pour les modales qui font overflow: hidden sur body)
    autoToggle: true,
  });

  // Expose pour debug dans la console navigateur
  if (typeof window !== "undefined") {
    window.__LENIS__ = lenisInstance;
  }

  // eslint-disable-next-line no-console
  console.log("[Lenis] smooth scroll initialized", lenisInstance);

  return lenisInstance;
}

export function destroySmoothScroll() {
  lenisInstance?.destroy?.();
  lenisInstance = null;
}

export function getLenis() {
  return lenisInstance;
}

/**
 * Scroll programmatique vers une cible.
 * target: sélecteur CSS, élément DOM, ou valeur Y en pixels.
 */
export function smoothScrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, {
      duration: options.duration ?? 1.4,
      offset: options.offset ?? 0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      immediate: options.immediate ?? false,
      lock: false,
      force: false,
    });
  } else {
    // Fallback scroll natif
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
    } else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
