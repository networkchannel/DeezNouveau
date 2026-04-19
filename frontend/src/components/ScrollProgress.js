import { useEffect, useState } from "react";
import { getLenis } from "@/utils/smoothScroll";

/**
 * Thin violet progress bar at the top of the page, driven by Lenis' scroll event.
 * If you see it moving = Lenis is running and reporting progress.
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const lenis = getLenis();

    const update = ({ progress: p } = {}) => {
      // Lenis emits { scroll, limit, progress, velocity, direction }
      if (typeof p === "number") {
        setProgress(p);
      } else {
        // Fallback for native scroll
        const doc = document.documentElement;
        const maxY = doc.scrollHeight - doc.clientHeight;
        setProgress(maxY > 0 ? window.scrollY / maxY : 0);
      }
    };

    if (lenis) {
      lenis.on("scroll", update);
      return () => { try { lenis.off("scroll", update); } catch { /* ignore */ } };
    } else {
      window.addEventListener("scroll", update, { passive: true });
      return () => window.removeEventListener("scroll", update);
    }
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] pointer-events-none h-[2px] bg-transparent"
      aria-hidden="true"
      data-testid="scroll-progress"
    >
      <div
        className="h-full bg-gradient-to-r from-violet-400 via-violet-500 to-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.6)] origin-left"
        style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, transition: "width 80ms linear" }}
      />
    </div>
  );
}
