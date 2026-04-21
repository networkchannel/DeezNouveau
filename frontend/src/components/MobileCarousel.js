import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MobileCarousel — full-slide reveal carousel on mobile, grid on desktop.
 *
 * Mobile ( < md ) :
 *   - One card visible at a time (full width, with horizontal padding)
 *   - Drag/swipe horizontally → current card slides out, next slides in
 *     from the opposite side (reveal / page-turn transition)
 *   - Spring snap to the next/prev slide based on distance + velocity
 *   - Dot indicators (optional) + keyboard ← → support
 *
 * Desktop ( >= md ) :
 *   - Classic CSS grid (columns configurable via desktopCols)
 *
 * Props:
 *   - desktopCols: "2" | "3" | "4" (default "3")
 *   - showDots   : boolean (default true)
 *   - ariaLabel  : accessibility label
 *   - className  : container class override
 *   - itemClass  : kept for API compat — only applied on mobile wrapper
 */
export default function MobileCarousel({
  children,
  desktopCols = "3",
  // itemClass kept for API compatibility with existing callers (no-op in reveal mode)
  // eslint-disable-next-line no-unused-vars
  itemClass = "",
  showDots = true,
  ariaLabel = "Carousel",
  className = "",
}) {
  const items = Array.isArray(children) ? children : [children];
  const count = items.length;

  // page increments by ±1 with each navigation. direction tracks which side the
  // new slide should enter from (+1 = enter from right, -1 = enter from left).
  const [[page, direction], setPage] = useState([0, 0]);
  const index = ((page % count) + count) % count;

  const paginate = (newDirection) => {
    const next = index + newDirection;
    if (next < 0 || next >= count) return; // no wrap-around
    setPage([page + newDirection, newDirection]);
  };

  const goToIndex = (i) => {
    if (i === index) return;
    setPage([i, i > index ? 1 : -1]);
  };

  // Keyboard navigation (mobile carousel still useful with external keyboards)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "ArrowLeft") paginate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  // Desktop grid cols
  const desktopGridClass =
    desktopCols === "4"
      ? "md:grid-cols-4"
      : desktopCols === "2"
      ? "md:grid-cols-2"
      : "md:grid-cols-3";

  // ─── Slide reveal variants ──────────────────────────────────────────
  // The entering slide starts off-screen on the side the user swiped FROM
  // (direction > 0 = going next = new enters from right).
  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  // Swipe intent heuristic: combine distance + velocity
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
      >
        {/* Shim: renders all items invisibly so the container reserves the
           height of the tallest card. Prevents layout jumps during transition. */}
        <div
          className="invisible pointer-events-none"
          aria-hidden="true"
          style={{ display: "grid" }}
        >
          {items.map((child, i) => (
            <div
              key={`shim-${i}`}
              style={{ gridArea: "1 / 1", width: "100%" }}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Animated slide overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="sync">
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
                opacity: { duration: 0.18 },
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
              style={{ touchAction: "pan-y", WebkitTapHighlightColor: "transparent" }}
              className="absolute inset-0 flex items-stretch px-4 pt-5 pb-2"
            >
              <div className="w-full">{items[index]}</div>
            </motion.div>
          </AnimatePresence>
        </div>
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
