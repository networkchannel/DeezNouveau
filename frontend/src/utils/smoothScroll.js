/**
 * Lightweight wheel-inertia smooth scroll (no external deps).
 *
 * Intercepts mouse wheel events and lerps the scroll position toward a
 * target, giving a "premium" inertial feel similar to Lenis/Locomotive —
 * without the library dependency that broke in Brave.
 *
 * What it doesn't touch (= native behavior preserved):
 *   - Keyboard scrolling (arrow keys, page up/down, space)
 *   - Touch/tactile scrolling on mobile (handled by OS)
 *   - Nested scrollable containers marked [data-no-smooth] or with
 *     `overflow: auto` on elements under the event target
 *   - Anchors / programmatic scrolls (they already use CSS smooth)
 */

const LERP = 0.10;              // 0 = infinite inertia, 1 = instant
const WHEEL_MULTIPLIER = 1.0;    // amplify wheel delta
const MIN_DIFF = 0.25;           // pixel-diff below which we snap
let target = 0;
let current = 0;
let rafId = null;
let enabled = false;
let wheelHandler = null;
let resizeHandler = null;

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(hover: none) and (pointer: coarse)").matches
      || ("ontouchstart" in window && navigator.maxTouchPoints > 0);
}

function hasScrollableAncestor(el) {
  // Walk up from the wheel event target. If any ancestor has
  //   - data-no-smooth attribute, OR
  //   - its own scroll (overflow auto/scroll) AND can actually scroll,
  // we let the native wheel event bubble instead of hijacking it.
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
  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
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
  if (hasScrollableAncestor(e.target)) return;      // let native handle it
  if (e.ctrlKey || e.metaKey) return;               // pinch-zoom etc.
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // horizontal scroll
  e.preventDefault();
  target = Math.max(0, Math.min(target + e.deltaY * WHEEL_MULTIPLIER, maxScroll()));
  if (rafId == null) rafId = requestAnimationFrame(tick);
}

function onResize() {
  target = Math.max(0, Math.min(target, maxScroll()));
}

/**
 * Enable smooth wheel scroll. Safe to call multiple times.
 * No-op on touch devices (OS-native scrolling is already smooth).
 */
export function initSmoothScroll() {
  if (typeof window === "undefined") return;
  if (enabled) return;
  if (isTouchDevice()) {
    // Keep native scroll for touch; still set the anchor offset.
    document.documentElement.style.scrollPaddingTop = "88px";
    return;
  }

  document.documentElement.style.scrollPaddingTop = "88px";

  target = window.scrollY;
  current = window.scrollY;

  // Keep target in sync with any programmatic / keyboard / anchor scroll
  // so the wheel doesn't "teleport" back to its own target.
  const onScroll = () => {
    if (rafId == null) {
      target = window.scrollY;
      current = window.scrollY;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  wheelHandler = onWheel;
  resizeHandler = onResize;
  window.addEventListener("wheel", wheelHandler, { passive: false });
  window.addEventListener("resize", resizeHandler);

  enabled = true;
}

export function destroySmoothScroll() {
  if (!enabled) return;
  if (wheelHandler) window.removeEventListener("wheel", wheelHandler);
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  wheelHandler = null;
  resizeHandler = null;
  enabled = false;
}

/**
 * Programmatic smooth scroll to a target (selector, element, or Y value).
 * Uses native `window.scrollTo({behavior:'smooth'})` which is honored by
 * all modern browsers and keeps our inertia-target in sync via the scroll
 * listener above.
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

export function getLenis() {
  // Back-compat shim — nothing to expose.
  return null;
}
