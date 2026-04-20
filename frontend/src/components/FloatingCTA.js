import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";
import { getSourceCTA } from "@/utils/sourceDetection";

/**
 * Persistent floating CTA, bottom-right.
 * Appears once the user scrolls past ~600px, hides on /checkout, /order, /admin*.
 * Dismissible (persisted in sessionStorage for current session).
 * Uses platform-adapted CTA copy (TikTok / Instagram / YouTube / Facebook / X / default).
 */
const HIDDEN_PATHS = ["/checkout", "/order", "/admin"];
const SCROLL_THRESHOLD = 600;

export default function FloatingCTA() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const lang = i18n.language || "fr";
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Load dismissed state from sessionStorage on mount
  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem("dz_floating_cta_dismissed") === "1");
    } catch { /* ignore */ }
  }, []);

  // Hide on excluded routes
  const routeHidden = HIDDEN_PATHS.some((p) => location.pathname.startsWith(p));

  // Listen to scroll (native — Lenis also fires native scroll events on window)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem("dz_floating_cta_dismissed", "1"); } catch { /* ignore */ }
  };

  const show = visible && !dismissed && !routeHidden;

  // Source-aware copy
  const srcCTA = getSourceCTA(lang);
  const label = srcCTA.label;
  const sub = srcCTA.sub;
  const cta = L({ fr: "Activer", en: "Activate", es: "Activar", pt: "Ativar", de: "Aktivieren", tr: "Aktive et", nl: "Activeer", ar: "فعّل" }, lang);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          data-testid="floating-cta"
        >
          {/* ─── Mobile (compact FAB) ─── */}
          <div className="sm:hidden">
            <Link
              to="/offers"
              data-testid="floating-cta-btn"
              aria-label={label}
              className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[0_12px_36px_-8px_rgba(139,92,246,0.65)] border border-violet-300/30 active:scale-95 transition-transform"
            >
              <Sparkles className="h-5 w-5" />
            </Link>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              data-testid="floating-cta-dismiss"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0f0f14] border border-white/15 text-white/70 hover:text-white flex items-center justify-center shadow-lg"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* ─── Desktop (full pill) ─── */}
          <div className="hidden sm:block max-w-[calc(100vw-2rem)]">
            <div className="group relative rounded-full pl-1 pr-1 py-1 bg-[#0f0f14]/95 backdrop-blur-xl border border-violet-500/25 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.55)] hover:border-violet-400/50 transition-all flex items-center gap-2">
              <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                data-testid="floating-cta-dismiss-d"
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white/90 flex items-center justify-center shrink-0 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-2.5 pl-1 pr-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shrink-0 shadow-[0_4px_16px_-4px_rgba(139,92,246,0.8)]">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-[13px] font-semibold leading-tight truncate">{label}</div>
                  <div className="text-white/50 text-[11px] leading-tight truncate">{sub}</div>
                </div>
              </div>

              <Link
                to="/offers"
                data-testid="floating-cta-btn-d"
                className="inline-flex items-center gap-1.5 pl-3.5 pr-3 py-2 rounded-full bg-gradient-to-b from-violet-400 to-violet-600 hover:from-violet-300 hover:to-violet-500 text-white text-[13px] font-semibold transition-all whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                {cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
