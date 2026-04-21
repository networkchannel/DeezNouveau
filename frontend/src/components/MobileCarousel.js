import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * MobileCarousel — peek-style reveal slider on mobile, grid on desktop.
 *
 * Mobile ( < md ):
 *   - Active card centered, full size ( ~70% of container width )
 *   - Previous and next cards visible on the sides, scaled down (~0.82)
 *     with reduced opacity → classic "peek" / coverflow-lite effect.
 *   - Horizontal drag/swipe → animates smoothly to prev/next with spring.
 *   - Dots for direct nav + keyboard ← → support.
 *   - Container height is reserved by an invisible shim containing all
 *     items in a single grid cell (prevents layout jumps, works with any
 *     card height variance between slides).
 *   - clip-path only clips horizontally → vertical auras / glows are
 *     never cut off (card ::before shadow is free to bleed).
 *
 * Desktop ( >= md ):
 *   - Classic CSS grid (columns configurable via desktopCols).
 */

const CARD_WIDTH_PCT = 70;   // active card width (% of container)
const OFFSET_PCT = 72;       // horizontal spacing between cards (% of container)
const SIDE_SCALE = 0.82;
const SIDE_OPACITY = 0.5;
const SWIPE_CONFIDENCE = 10000;

export default function MobileCarousel({
  children,
  desktopCols = "3",
  // eslint-disable-next-line no-unused-vars
  itemClass = "",
  showDots = true,
  ariaLabel = "Carousel",
  className = "",
}) {
  const items = Array.isArray(children) ? children : [children];
  const count = items.length;

  const [index, setIndex] = useState(0);

  const paginate = (dir) => {
    const next = index + dir;
    if (next < 0 || next >= count) return;
    setIndex(next);
  };

  const goToIndex = (i) => {
    if (i === index || i < 0 || i >= count) return;
    setIndex(i);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "ArrowLeft") paginate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  const desktopGridClass =
    desktopCols === "4"
      ? "md:grid-cols-4"
      : desktopCols === "2"
      ? "md:grid-cols-2"
      : "md:grid-cols-3";

  const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

  const handleDragEnd = (_e, { offset, velocity }) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -SWIPE_CONFIDENCE || offset.x < -60) {
      paginate(1);
    } else if (swipe > SWIPE_CONFIDENCE || offset.x > 60) {
      paginate(-1);
    }
  };

  return (
    <div className={`relative ${className}`} data-testid="mobile-carousel-root">
      {/* ═════════ MOBILE — peek reveal slider ═════════ */}
      <div
        className="md:hidden relative"
        role="region"
        aria-label={ariaLabel}
        aria-roledescription="carousel"
        // Horizontal clip only — vertical glow / aura bleeds freely.
        style={{ clipPath: "inset(-400px 0 -400px 0)" }}
      >
        {/* Invisible shim reserves the max card height so the container
            sizes itself properly. Each shim item is the exact same width
            as a live slide to keep identical layout metrics. */}
        <div
          className="invisible pointer-events-none grid"
          aria-hidden="true"
        >
          {items.map((child, i) => (
            <div
              key={`shim-${i}`}
              style={{
                gridArea: "1 / 1",
                width: `${CARD_WIDTH_PCT}%`,
                margin: "0 auto",
                // Ensure the wrapped card does not collapse / stretch.
                minHeight: 0,
              }}
            >
              <div style={{ height: "auto" }}>{child}</div>
            </div>
          ))}
        </div>

        {/* Animated drag layer with all cards positioned over the shim */}
        <motion.div
          className="absolute inset-0"
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.22}
          onDragEnd={handleDragEnd}
          whileDrag={{ cursor: "grabbing" }}
          style={{
            touchAction: "pan-y",
            WebkitTapHighlightColor: "transparent",
          }}
          data-testid="mobile-carousel-drag-layer"
          data-carousel-index={index}
        >
          {items.map((child, i) => {
            const offset = i - index;
            const absOffset = Math.abs(offset);
            // Only render nearby cards (current + 1 each side + 1 buffer)
            if (absOffset > 2) return null;

            const isActive = offset === 0;

            return (
              <motion.div
                key={i}
                data-testid={`mobile-carousel-slide-${i}`}
                data-carousel-slide
                data-no-smooth
                data-active={isActive || undefined}
                initial={false}
                animate={{
                  x: `${offset * OFFSET_PCT}%`,
                  y: isActive ? -10 : 0,
                  scale: isActive ? 1 : SIDE_SCALE,
                  opacity: absOffset > 1 ? 0 : isActive ? 1 : SIDE_OPACITY,
                  zIndex: 10 - absOffset,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 32,
                  mass: 0.9,
                }}
                // Tap on a side card → navigate to it
                onTap={() => {
                  if (!isActive && absOffset <= 1) goToIndex(i);
                }}
                className="absolute top-0"
                style={{
                  left: `${(100 - CARD_WIDTH_PCT) / 2}%`,
                  width: `${CARD_WIDTH_PCT}%`,
                  transformOrigin: "center center",
                  pointerEvents: absOffset > 1 ? "none" : "auto",
                  cursor: !isActive && absOffset === 1 ? "pointer" : undefined,
                }}
              >
                {child}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ═════════ DESKTOP — grid ═════════ */}
      <div className={`hidden md:grid ${desktopGridClass} gap-5`}>
        {items.map((child, i) => (
          <div key={i}>{child}</div>
        ))}
      </div>

      {/* ═════════ Dots (mobile only) ═════════ */}
      {showDots && count > 1 && (
        <div
          className="flex justify-center gap-1.5 mt-4 md:hidden"
          role="tablist"
          aria-label="Slides"
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              data-testid={`carousel-dot-${i}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-6 bg-violet-400"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
