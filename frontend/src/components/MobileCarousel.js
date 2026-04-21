import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MobileCarousel — reveal-style slider on mobile, grid on desktop.
 *
 * Mobile ( < md ):
 *   - One card visible at a time, full width.
 *   - Horizontal swipe/drag → current card slides out, next slides in from
 *     the opposite side (Framer-Motion spring reveal transition).
 *   - Dots for direct navigation, keyboard ← → support.
 *   - Container height follows the active slide's natural height
 *     (AnimatePresence popLayout — exiting slide becomes absolute so it
 *     doesn't stretch the container).
 *   - Horizontal clipping via clip-path so the outgoing card is masked on
 *     the sides, but the card's own glow/aura can still bleed vertically
 *     (no overflow-hidden on the vertical axis).
 *
 * Desktop ( >= md ):
 *   - Classic CSS grid (columns configurable via desktopCols).
 *
 * Props:
 *   - desktopCols: "2" | "3" | "4" (default "3")
 *   - showDots   : boolean (default true)
 *   - ariaLabel  : accessibility label
 *   - className  : extra wrapper class
 *   - itemClass  : kept for API compat (unused in reveal mode)
 */
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

  const [[page, direction], setPage] = useState([0, 0]);
  const index = ((page % count) + count) % count;

  const paginate = (dir) => {
    const next = index + dir;
    if (next < 0 || next >= count) return;
    setPage([page + dir, dir]);
  };

  const goToIndex = (i) => {
    if (i === index) return;
    setPage([i, i > index ? 1 : -1]);
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

  // Slide reveal variants
  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const swipePower = (offset, velocity) => Math.abs(offset) * velocity;
  const SWIPE_CONFIDENCE = 10000;

  return (
    <div className={`relative ${className}`} data-testid="mobile-carousel-root">
      {/* ═════════ MOBILE — reveal slider ═════════ */}
      <div
        className="md:hidden relative"
        role="region"
        aria-label={ariaLabel}
        aria-roledescription="carousel"
        // Clip horizontally only — vertical overflow stays visible so card
        // auras/shadows are not cut off. Expanded bottom/top region is free.
        style={{ clipPath: "inset(-400px 0 -400px 0)" }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            data-testid="mobile-carousel"
            data-carousel-slide
            data-carousel-index={index}
            data-no-smooth
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 320, damping: 34 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.22}
            onDragEnd={(_e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -SWIPE_CONFIDENCE || offset.x < -80) {
                paginate(1);
              } else if (swipe > SWIPE_CONFIDENCE || offset.x > 80) {
                paginate(-1);
              }
            }}
            whileDrag={{ cursor: "grabbing" }}
            style={{
              touchAction: "pan-y",
              WebkitTapHighlightColor: "transparent",
            }}
            className="w-full px-4 pt-5 pb-2"
          >
            {items[index]}
          </motion.div>
        </AnimatePresence>
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
