import Lenis from "lenis";

let lenisInstance = null;
let rafId = null;

export function initSmoothScroll() {
  if (typeof window === "undefined") return null;
  if (lenisInstance) return lenisInstance;

  // Respect user preference
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return null;

  lenisInstance = new Lenis({
    duration: 1.1,                // smoothness length — higher = more inertia
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
    smoothWheel: true,
    smoothTouch: false,           // keep native on mobile (less jank)
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  const raf = (time) => {
    lenisInstance?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);

  // Intercept scrollTo(0,0) / window.scrollTo calls that happen during route change
  // so ScrollToTop's instant snap actually snaps instantly (not interpolated)
  return lenisInstance;
}

export function destroySmoothScroll() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  lenisInstance?.destroy?.();
  lenisInstance = null;
}

export function getLenis() {
  return lenisInstance;
}

/**
 * Smoothly scroll to a target.
 * target: element, selector string, or Y coordinate.
 */
export function smoothScrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, {
      duration: options.duration ?? 1.2,
      offset: options.offset ?? 0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      immediate: options.immediate ?? false,
    });
  } else {
    // Fallback to native scroll
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
    } else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
