import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * Wraps the routed children with a smooth fade + subtle slide-up transition.
 * Works in tandem with ScrollToTop: the fade-in hides any visual jump that
 * happens when we snap window.scrollY back to 0 on route change.
 *
 * mode="popLayout" keeps the incoming page mounting immediately (no blank
 * frame on mobile while old page exits) — gives a visible cross-fade slide.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const prefersReduced = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
        transition={{
          duration: prefersReduced ? 0 : 0.38,
          ease: [0.22, 0.8, 0.2, 1],
        }}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
