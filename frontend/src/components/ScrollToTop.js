import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Snaps to top on every route change using native scroll.
 * The page-transition fade-in covers the jump.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Temporarily disable CSS smooth scroll so the reset is instantaneous
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      html.style.scrollBehavior = prev || "";
    });
  }, [pathname, search]);

  return null;
}
