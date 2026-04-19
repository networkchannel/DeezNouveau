import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PricingModal from "@/components/PricingModal";
import { Sparkles, Github, MessageCircle } from "lucide-react";

export default function Footer() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "fr";
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <>
      <footer className="relative mt-16 sm:mt-24 border-t border-white/[0.06] bg-[#050505]/80 backdrop-blur-xl" data-testid="main-footer">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">

          {/* CTA Big bar — only on Home */}
          {isHome && (
            <div className="relative overflow-hidden rounded-[2rem] border border-violet-500/20 p-8 sm:p-14 mb-16"
                 style={{
                   background:
                     "radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(10,10,14,0.9) 60%)"
                 }}
            >
              <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl bg-violet-600/20 pointer-events-none" />
              <div className="relative z-10 text-center">
                <h2 className="display-md text-white mb-3">
                  {lang === "fr" ? "Prêt à écouter sans limites ?" : "Ready to listen without limits?"}
                </h2>
                <p className="text-white/60 text-[15px] max-w-xl mx-auto mb-6">
                  {lang === "fr"
                    ? "Rejoignez des milliers d'utilisateurs. Paiement crypto anonyme, livraison instantanée."
                    : "Join thousands of users. Anonymous crypto payment, instant delivery."}
                </p>
                <Link to="/offers" className="btn-primary" data-testid="footer-cta-btn">
                  {lang === "fr" ? "Voir les offres" : "Get Started Now"}
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white font-display font-bold text-[17px] tracking-tight">
                  deez<span className="text-violet-400">link</span>
                </span>
              </div>
              <p className="text-[13px] text-white/50 leading-relaxed max-w-xs">
                {lang === "fr"
                  ? "Liens d'activation Deezer Premium. Instantané. Anonyme. Sécurisé."
                  : "Deezer Premium activation links. Instant. Anonymous. Secure."}
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                {lang === "fr" ? "Naviguer" : "Navigate"}
              </h3>
              <ul className="space-y-2.5 text-[13px] text-white/60">
                <li><Link to="/" className="hover:text-white transition-colors">{lang === "fr" ? "Accueil" : "Home"}</Link></li>
                <li><Link to="/offers" className="hover:text-white transition-colors">{lang === "fr" ? "Offres" : "Pricing"}</Link></li>
                <li><Link to="/gift-cards" className="hover:text-white transition-colors">{lang === "fr" ? "Cartes cadeaux" : "Gift Cards"}</Link></li>
                <li>
                  <button onClick={() => setPricingOpen(true)} className="hover:text-violet-400 transition-colors text-left">
                    {lang === "fr" ? "Tarifs dégressifs" : "Volume pricing"}
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                {lang === "fr" ? "Légal" : "Legal"}
              </h3>
              <ul className="space-y-2.5 text-[13px] text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">{lang === "fr" ? "Conditions" : "Terms"}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{lang === "fr" ? "Confidentialité" : "Privacy"}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{lang === "fr" ? "Remboursement" : "Refund"}</a></li>
              </ul>
            </div>

            {/* Payment */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                {lang === "fr" ? "Paiement" : "Payment"}
              </h3>
              <p className="text-[13px] text-white/60 mb-3">
                {lang === "fr" ? "Crypto via OxaPay" : "Crypto via OxaPay"}
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {["BTC", "ETH", "USDT", "LTC"].map((c) => (
                  <span key={c} className="px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/70">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-white/40">
            <p>© {new Date().getFullYear()} deezlink. {lang === "fr" ? "Tous droits réservés." : "All rights reserved."}</p>
            <p className="flex items-center gap-1.5">
              <span className="pill-dot-violet w-1.5 h-1.5 rounded-full" style={{ boxShadow: "0 0 8px #8b5cf6" }}></span>
              {lang === "fr" ? "Opérationnel" : "All systems operational"}
            </p>
          </div>
        </div>
      </footer>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} lang={lang} />
    </>
  );
}
