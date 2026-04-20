import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * MobileCarousel — horizontal-scroll carousel for mobile.
 *
 * Behaviour:
 *   - On mobile (< md breakpoint) : horizontal overflow-scroll with snap,
 *     dot indicators, optional prev/next buttons.
 *   - On desktop (>= md) : renders a normal CSS grid of children.
 *
 * The component is "class-based" — it just sets the right flex/grid
 * wrapper and snap behaviour. Each child keeps its own styling.
 *
 * Props:
 *   - desktopCols: "2" | "3" | "4" (default "3")    CSS grid columns on desktop
 *   - itemClass  : extra class applied to each slide (sizing)
 *   - showDots   : boolean (default true)
 *   - showArrows : boolean (default false, UX-safer on mobile)
 *   - ariaLabel  : accessibility label for the scroller
 *   - gap        : Tailwind gap utility (default "gap-4")
 *   - className  : container class override
 */
export default function MobileCarousel({
  children,
  desktopCols = "3",
  itemClass = "w-[82%] sm:w-[60%]",
  showDots = true,
  showArrows = false,
  ariaLabel = "Carousel",
  gap = "gap-4",
  className = "",
}) {
  const scrollerRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const items = Array.isArray(children) ? children : [children];
  const count = items.length;

  // Track active slide based on scroll position (mobile only)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slides = el.querySelectorAll("[data-carousel-slide]");
        if (!slides.length) return;
        const scrollMid = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        slides.forEach((s, i) => {
          const mid = s.offsetLeft + s.clientWidth / 2;
          const d = Math.abs(mid - scrollMid);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        setActiveIdx(best);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scrollTo = (idx) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelectorAll("[data-carousel-slide]")[idx];
    if (slide) {
      el.scrollTo({
        left: slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2,
        behavior: "smooth",
      });
    }
  };

  const prev = () => scrollTo(Math.max(0, activeIdx - 1));
  const next = () => scrollTo(Math.min(count - 1, activeIdx + 1));

  // Desktop grid cols mapping
  const desktopGridClass =
    desktopCols === "4" ? "md:grid-cols-4" :
    desktopCols === "2" ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <div className={`relative ${className}`}>
      {/* Mobile: horizontal scroller with snap. Desktop (md+): grid. */}
      <div
        ref={scrollerRef}
        data-testid="mobile-carousel"
        role="region"
        aria-label={ariaLabel}
        className={`
          flex ${gap} overflow-x-auto snap-x snap-mandatory scroll-smooth
          px-4 -mx-4
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          md:grid md:${desktopGridClass} md:overflow-visible md:mx-0 md:px-0 md:gap-5
        `}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((child, i) => (
          <div
            key={i}
            data-carousel-slide
            data-carousel-index={i}
            className={`shrink-0 ${itemClass} snap-center md:w-auto md:shrink md:snap-none`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Dot indicators (mobile only) */}
      {showDots && count > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 md:hidden" role="tablist" aria-label="Slides">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Slide ${i + 1}`}
              data-testid={`carousel-dot-${i}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIdx ? "w-6 bg-violet-400" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrow buttons (optional, mobile-only) */}
      {showArrows && count > 1 && (
        <>
          <button
            onClick={prev}
            disabled={activeIdx === 0}
            aria-label="Previous"
            data-testid="carousel-prev"
            className="md:hidden absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0f0f14]/80 backdrop-blur border border-white/10 text-white/80 hover:text-white flex items-center justify-center disabled:opacity-0 transition-opacity z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            disabled={activeIdx === count - 1}
            aria-label="Next"
            data-testid="carousel-next"
            className="md:hidden absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0f0f14]/80 backdrop-blur border border-white/10 text-white/80 hover:text-white flex items-center justify-center disabled:opacity-0 transition-opacity z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
