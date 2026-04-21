/**
 * Lightweight wheel-only smooth scroll (desktop / trackpads).
 *
 * Mobile is intentionally NOT intercepted — native iOS / Android scroll
 * physics + CSS `scroll-snap-type: y proximity` on <html> give the best
 * possible feel (momentum, bounce, overscroll, snap) and any JS override
 * ends up fighting the browser.
 *
 * Preserves nested scrollable containers (overflow auto/scroll),
 * respects `data-no-smooth`, pinch-zoom, horizontal scroll, keyboard,
 * and anchor links.
 */

const LERP = 0.10;              // wheel inertia (0=infinite, 1=instant)
const WHEEL_MULTIPLIER = 1.0;
const MIN_DIFF = 0.25;

let target = 0;
let current = 0;
let rafId = null;
let enabled = false;
let wheelHandler = null;
let resizeHandler = null;
let scrollHandler = null;

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(hover: none) and (pointer: coarse)").matches
      || ("ontouchstart" in window && navigator.maxTouchPoints > 0);
}

function hasScrollableAncestor(el) {
  let node = el;
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.nodeType === 1) {
      if (node.hasAttribute?.("data-no-smooth")) return true;
      const cs = getComputedStyle(node);
      const oy = cs.overflowY;
      if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) {
        return true;
      }
    }
    node = node.parentNode;
  }
  return false;
}

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function tick() {
  const diff = target - current;
  if (Math.abs(diff) < MIN_DIFF) {
    current = target;
    window.scrollTo(0, current);
    rafId = null;
    return;
  }
  current += diff * LERP;
  window.scrollTo(0, current);
  rafId = requestAnimationFrame(tick);
}

function onWheel(e) {
  if (hasScrollableAncestor(e.target)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  e.preventDefault();
  target = Math.max(0, Math.min(target + e.deltaY * WHEEL_MULTIPLIER, maxScroll()));
  if (rafId == null) rafId = requestAnimationFrame(tick);
}

function onResize() {
  target = Math.max(0, Math.min(target, maxScroll()));
}

/**
 * Enable smooth scroll on desktop (wheel). Mobile is left to native scroll.
 */
export function initSmoothScroll() {
  if (typeof window === "undefined") return;
  if (enabled) return;

  document.documentElement.style.scrollPaddingTop = "88px";

  target = window.scrollY;
  current = window.scrollY;

  // On mobile, don't attach any handlers — let the browser handle
  // scrolling natively (momentum, bounce, CSS scroll-snap).
  if (isTouchDevice()) {
    enabled = true;
    return;
  }

  // Keep target in sync with keyboard / anchor / programmatic scroll
  scrollHandler = () => {
    if (rafId == null) {
      target = window.scrollY;
      current = window.scrollY;
    }
  };
  window.addEventListener("scroll", scrollHandler, { passive: true });

  wheelHandler = onWheel;
  window.addEventListener("wheel", wheelHandler, { passive: false });

  resizeHandler = onResize;
  window.addEventListener("resize", resizeHandler);

  enabled = true;
}

export function destroySmoothScroll() {
  if (!enabled) return;
  if (wheelHandler) window.removeEventListener("wheel", wheelHandler);
  if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  wheelHandler = null;
  scrollHandler = null;
  resizeHandler = null;
  enabled = false;
}

/**
 * Programmatic smooth scroll to a target (selector, element, or Y value).
 */
export function smoothScrollTo(target_, options = {}) {
  const offset = options.offset ?? 0;

  if (typeof target_ === "number") {
    window.scrollTo({ top: target_ + offset, behavior: "smooth" });
    return;
  }
  const el = typeof target_ === "string" ? document.querySelector(target_) : target_;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const y = window.scrollY + rect.top + offset;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export function getLenis() { return null; }
