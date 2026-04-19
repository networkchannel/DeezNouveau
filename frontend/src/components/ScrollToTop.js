import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getLenis } from "@/utils/smoothScroll";

/**
 * Snaps to top on every route change.
 * Uses Lenis' immediate jump if Lenis is active, otherwise native scroll.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const lenis = getLenis();
    if (lenis) {
      // Immediate=true bypasses inertia — the page-transition fade-in covers the jump
      lenis.scrollTo(0, { immediate: true });
    } else {
      // Fallback: temporarily disable CSS smooth
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        html.style.scrollBehavior = prev || "";
      });
    }
  }, [pathname, search]);

  return null;
}
