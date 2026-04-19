import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";

/**
 * Persistent floating CTA, bottom-right.
 * Appears once the user scrolls past ~600px, hides on /checkout, /order, /admin*.
 * Dismissible (persisted in sessionStorage for current session).
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

  const label = L({ fr: "Get Deezer Premium", en: "Get Deezer Premium", es: "Obtén Deezer Premium", pt: "Obter Deezer Premium", de: "Deezer Premium holen", tr: "Deezer Premium al", nl: "Krijg Deezer Premium", ar: "احصل على Deezer Premium" }, lang);
  const sub = L({ fr: "Dès 5€ · Livraison 5 min", en: "From 5€ · 5 min delivery", es: "Desde 5€ · Entrega 5 min", pt: "A partir de 5€ · Entrega 5 min", de: "Ab 5€ · Lieferung 5 Min.", tr: "5€'dan · 5 dk teslimat", nl: "Vanaf 5€ · 5 min levering", ar: "من 5€ · توصيل 5 دقائق" }, lang);
  const cta = L({ fr: "Commencer", en: "Get started", es: "Empezar", pt: "Começar", de: "Loslegen", tr: "Başla", nl: "Begin", ar: "ابدأ" }, lang);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)]"
          data-testid="floating-cta"
        >
          <div className="group relative rounded-full pl-1 pr-1 py-1 bg-[#0f0f14]/95 backdrop-blur-xl border border-violet-500/25 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.55)] hover:border-violet-400/50 transition-all flex items-center gap-2">
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              data-testid="floating-cta-dismiss"
              className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white/90 flex items-center justify-center shrink-0 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-2.5 pl-1 pr-2 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shrink-0 shadow-[0_4px_16px_-4px_rgba(139,92,246,0.8)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="text-white text-[13px] font-semibold leading-tight truncate">{label}</div>
                <div className="text-white/50 text-[11px] leading-tight truncate">{sub}</div>
              </div>
            </div>

            <Link
              to="/offers"
              data-testid="floating-cta-btn"
              className="inline-flex items-center gap-1.5 pl-3.5 pr-3 py-2 rounded-full bg-gradient-to-b from-violet-400 to-violet-600 hover:from-violet-300 hover:to-violet-500 text-white text-[13px] font-semibold transition-all whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              {cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
