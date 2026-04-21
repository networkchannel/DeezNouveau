/**
 * Lightweight wheel + touch inertia smooth scroll (no external deps).
 *
 * Desktop : intercepts wheel events and lerps toward target.
 * Mobile  : intercepts touch events (drag + flick-inertia) and lerps.
 *
 * Preserves nested scrollable containers (overflow auto/scroll),
 * respects `data-no-smooth`, pinch-zoom, horizontal scroll, keyboard,
 * and anchor links.
 */

const LERP = 0.10;              // wheel inertia (0=infinite, 1=instant)
const TOUCH_LERP = 0.14;        // post-flick inertia on mobile
const WHEEL_MULTIPLIER = 1.0;
const TOUCH_VELOCITY_MULT = 18; // flick strength multiplier
const MIN_DIFF = 0.25;

let target = 0;
let current = 0;
let rafId = null;
let enabled = false;
let mode = "wheel";             // "wheel" or "touch"
let wheelHandler = null;
let resizeHandler = null;
let touchStartHandler = null;
let touchMoveHandler = null;
let touchEndHandler = null;

// Touch tracking state
let touchActive = false;
let lastTouchY = 0;
let lastTouchTime = 0;
let touchVelocity = 0;          // pixels per ms
let touchStartX = 0;
let touchStartY = 0;
let touchDirection = null;      // null | "vertical" | "horizontal"
const DIR_LOCK_THRESHOLD = 8;   // pixels before we decide direction

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
  const lerp = mode === "touch" ? TOUCH_LERP : LERP;
  const diff = target - current;
  if (Math.abs(diff) < MIN_DIFF) {
    current = target;
    window.scrollTo(0, current);
    rafId = null;
    return;
  }
  current += diff * lerp;
  window.scrollTo(0, current);
  rafId = requestAnimationFrame(tick);
}

// ─── Wheel (desktop) ──────────────────────────────────────────────────
function onWheel(e) {
  if (hasScrollableAncestor(e.target)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  e.preventDefault();
  mode = "wheel";
  target = Math.max(0, Math.min(target + e.deltaY * WHEEL_MULTIPLIER, maxScroll()));
  if (rafId == null) rafId = requestAnimationFrame(tick);
}

// ─── Touch (mobile) ───────────────────────────────────────────────────
function onTouchStart(e) {
  if (e.touches.length > 1) { touchActive = false; return; }        // pinch
  if (hasScrollableAncestor(e.target)) { touchActive = false; return; }

  touchActive = true;
  touchDirection = null;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  lastTouchY = e.touches[0].clientY;
  lastTouchTime = performance.now();
  touchVelocity = 0;

  // Kill any running inertia, snap current = target = native scroll.
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  target = window.scrollY;
  current = window.scrollY;
}

function onTouchMove(e) {
  if (!touchActive) return;
  if (e.touches.length > 1) { touchActive = false; return; }

  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;

  // Lock direction on first meaningful movement.
  // If the gesture is horizontal → hand over to native (lets horizontal
  // carousels / overflow-x-auto scrollers work on mobile).
  if (touchDirection === null) {
    const totalDx = Math.abs(x - touchStartX);
    const totalDy = Math.abs(y - touchStartY);
    if (totalDx < DIR_LOCK_THRESHOLD && totalDy < DIR_LOCK_THRESHOLD) return;
    if (totalDx > totalDy) {
      // Horizontal swipe: let the browser handle it natively.
      touchActive = false;
      touchDirection = "horizontal";
      return;
    }
    touchDirection = "vertical";
  }

  if (touchDirection !== "vertical") return;

  const now = performance.now();
  const dy = lastTouchY - y;     // finger moves up → scroll down
  const dt = Math.max(1, now - lastTouchTime);

  // prevent OS default scroll so WE drive the scrollTop
  e.preventDefault();

  mode = "touch";
  target = Math.max(0, Math.min(target + dy, maxScroll()));
  current = target;
  window.scrollTo(0, current);

  // moving-average velocity for smoother flick inertia
  const instant = dy / dt;
  touchVelocity = touchVelocity * 0.7 + instant * 0.3;

  lastTouchY = y;
  lastTouchTime = now;
}

function onTouchEnd() {
  if (!touchActive) return;
  touchActive = false;
  // Apply flick inertia if velocity is meaningful (>0.1 px/ms)
  if (Math.abs(touchVelocity) > 0.1) {
    target = Math.max(0, Math.min(target + touchVelocity * TOUCH_VELOCITY_MULT * 16, maxScroll()));
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }
  touchVelocity = 0;
}

// ─── Misc ─────────────────────────────────────────────────────────────
function onResize() {
  target = Math.max(0, Math.min(target, maxScroll()));
}

/**
 * Enable smooth scroll (wheel on desktop, touch drag+flick on mobile).
 */
export function initSmoothScroll() {
  if (typeof window === "undefined") return;
  if (enabled) return;

  document.documentElement.style.scrollPaddingTop = "88px";

  target = window.scrollY;
  current = window.scrollY;

  // Keep target in sync with keyboard / anchor / programmatic scroll
  const onScroll = () => {
    if (rafId == null && !touchActive) {
      target = window.scrollY;
      current = window.scrollY;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Wheel (all devices that emit wheel events — desktop, trackpads)
  wheelHandler = onWheel;
  window.addEventListener("wheel", wheelHandler, { passive: false });

  // Touch (mobile)
  if (isTouchDevice()) {
    touchStartHandler = onTouchStart;
    touchMoveHandler = onTouchMove;
    touchEndHandler = onTouchEnd;
    window.addEventListener("touchstart", touchStartHandler, { passive: true });
    window.addEventListener("touchmove", touchMoveHandler, { passive: false });
    window.addEventListener("touchend", touchEndHandler, { passive: true });
    window.addEventListener("touchcancel", touchEndHandler, { passive: true });
  }

  resizeHandler = onResize;
  window.addEventListener("resize", resizeHandler);

  enabled = true;
}

export function destroySmoothScroll() {
  if (!enabled) return;
  if (wheelHandler) window.removeEventListener("wheel", wheelHandler);
  if (touchStartHandler) window.removeEventListener("touchstart", touchStartHandler);
  if (touchMoveHandler) window.removeEventListener("touchmove", touchMoveHandler);
  if (touchEndHandler) {
    window.removeEventListener("touchend", touchEndHandler);
    window.removeEventListener("touchcancel", touchEndHandler);
  }
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  wheelHandler = null;
  touchStartHandler = null;
  touchMoveHandler = null;
  touchEndHandler = null;
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
