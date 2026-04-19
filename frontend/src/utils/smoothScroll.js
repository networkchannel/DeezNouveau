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
    autoRaf: true,
    duration: 1.6,                        // longer glide
    easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic (soft deceleration)
    smoothWheel: true,
    syncTouch: true,                       // unified touch + mouse feel on mobile
    syncTouchLerp: 0.08,
    wheelMultiplier: 0.85,                 // slightly slower per wheel tick
    touchMultiplier: 1.5,
    lerp: 0.08,                            // lower = more glide/inertia
    orientation: "vertical",
    gestureOrientation: "vertical",
    infinite: false,
    autoResize: true,
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
