import Lenis from "lenis";
import "lenis/dist/lenis.css";

let lenisInstance = null;

export function initSmoothScroll() {
  if (typeof window === "undefined") return null;
  if (lenisInstance) return lenisInstance;

  // Respect user preference
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return null;

  // Disable Lenis on touch devices (iOS/Android) — native scroll is smoother
  // and avoids memory/performance issues on lower-end phones.
  const isTouchDevice =
    window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ||
    ("ontouchstart" in window && navigator.maxTouchPoints > 0);
  if (isTouchDevice) return null;

  lenisInstance = new Lenis({
    autoRaf: true,
    anchors: {
      offset: -80,        // account for sticky header
    },
  });

  // Expose for debug
  if (typeof window !== "undefined") {
    window.__LENIS__ = lenisInstance;
  }

  // Log once so dev can confirm Lenis is alive
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
 * Smoothly scroll to a target.
 * target: element, selector string, or Y coordinate.
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
    // Fallback to native scroll
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
    } else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
