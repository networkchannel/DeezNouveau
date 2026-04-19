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
    duration: 2.0,                        // longer, more noticeable glide
    easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: 0.075,
    wheelMultiplier: 0.7,                  // each wheel tick = smaller, so glide is longer
    touchMultiplier: 1.5,
    lerp: 0.06,                            // even lower lerp = more visible interpolation
    orientation: "vertical",
    gestureOrientation: "vertical",
    infinite: false,
    autoResize: true,
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
