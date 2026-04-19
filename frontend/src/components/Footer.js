import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PricingModal from "@/components/PricingModal";
import { Github, MessageCircle } from "lucide-react";

export default function Footer() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "fr";
  const location = useLocation();
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <>
      <footer className="relative mt-16 sm:mt-24 border-t border-white/[0.06] bg-[#050505]/80 backdrop-blur-xl" data-testid="main-footer">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white font-display font-bold text-[17px] tracking-tight">
                  deez<span className="text-violet-500">link</span>
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
