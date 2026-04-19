import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Snaps window to top on every route change (pathname + search).
 * Uses instant scroll — the page transition handles the visual fluidity.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Disable smooth scroll momentarily so we don't get mid-navigation jank
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    // Restore on next tick (so native anchor clicks remain smooth)
    const id = window.requestAnimationFrame(() => {
      html.style.scrollBehavior = prev || "";
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname, search]);

  return null;
}
