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
    autoRaf: true,                        // let Lenis run its own rAF loop
    duration: 1.2,                        // smooth length
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
    lerp: 0.1,                            // interpolation factor (lower = more smooth)
    orientation: "vertical",
    gestureOrientation: "vertical",
  });

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
