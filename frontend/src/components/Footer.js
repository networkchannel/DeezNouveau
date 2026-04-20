import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PricingModal from "@/components/PricingModal";
import { Github, MessageCircle } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";

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
                {L({ fr: "Liens d'activation Deezer Premium. Instantané. Anonyme. Sécurisé.", en: "Deezer Premium activation links. Instant. Anonymous. Secure.", es: "Enlaces de activación Deezer Premium. Instantáneo. Anónimo. Seguro.", pt: "Links de ativação Deezer Premium. Instantâneo. Anônimo. Seguro.", de: "Deezer Premium Aktivierungslinks. Sofort. Anonym. Sicher.", tr: "Deezer Premium aktivasyon bağlantıları. Anında. Anonim. Güvenli.", nl: "Deezer Premium activeringslinks. Direct. Anoniem. Veilig.", ar: "روابط تفعيل Deezer Premium. فوري. مجهول. آمن." }, lang)}
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                {L({ fr: "Naviguer", en: "Navigate", es: "Navegar", pt: "Navegar", de: "Navigation", tr: "Gezin", nl: "Navigeren", ar: "التنقل" }, lang)}
              </h3>
              <ul className="space-y-2.5 text-[13px] text-white/60">
                <li><Link to="/" className="hover:text-white transition-colors">{L({ fr: "Accueil", en: "Home", es: "Inicio", pt: "Início", de: "Startseite", tr: "Ana Sayfa", nl: "Home", ar: "الرئيسية" }, lang)}</Link></li>
                <li><Link to="/offers" className="hover:text-white transition-colors">{L({ fr: "Offres", en: "Pricing", es: "Ofertas", pt: "Ofertas", de: "Angebote", tr: "Teklifler", nl: "Aanbiedingen", ar: "العروض" }, lang)}</Link></li>
                <li><Link to="/gift-cards" className="hover:text-white transition-colors">{L({ fr: "Cartes cadeaux", en: "Gift Cards", es: "Tarjetas regalo", pt: "Cartões presente", de: "Geschenkkarten", tr: "Hediye kartları", nl: "Cadeaukaarten", ar: "بطاقات الهدية" }, lang)}</Link></li>
                <li>
                  <button onClick={() => setPricingOpen(true)} className="hover:text-violet-400 transition-colors text-left">
                    {L({ fr: "Tarifs dégressifs", en: "Volume pricing", es: "Precios por volumen", pt: "Preços por volume", de: "Mengenrabatt", tr: "Hacim fiyatlandırması", nl: "Volumeprijzen", ar: "تسعير الحجم" }, lang)}
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                {L({ fr: "Légal", en: "Legal", es: "Legal", pt: "Legal", de: "Rechtliches", tr: "Yasal", nl: "Juridisch", ar: "قانوني" }, lang)}
              </h3>
              <ul className="space-y-2.5 text-[13px] text-white/60">
                <li><Link to="/mentions-legales" className="hover:text-white transition-colors">{L({ fr: "Mentions légales", en: "Legal Notice", es: "Aviso legal", pt: "Aviso legal", de: "Impressum", tr: "Yasal Uyarı", nl: "Juridisch", ar: "إشعار قانوني" }, lang)}</Link></li>
                <li><Link to="/conditions" className="hover:text-white transition-colors">{L({ fr: "Conditions", en: "Terms", es: "Términos", pt: "Termos", de: "Bedingungen", tr: "Şartlar", nl: "Voorwaarden", ar: "الشروط" }, lang)}</Link></li>
                <li><Link to="/confidentialite" className="hover:text-white transition-colors">{L({ fr: "Confidentialité", en: "Privacy", es: "Privacidad", pt: "Privacidade", de: "Datenschutz", tr: "Gizlilik", nl: "Privacy", ar: "الخصوصية" }, lang)}</Link></li>
                <li><Link to="/remboursement" className="hover:text-white transition-colors">{L({ fr: "Remboursement", en: "Refund", es: "Reembolso", pt: "Reembolso", de: "Rückerstattung", tr: "İade", nl: "Terugbetaling", ar: "الاسترداد" }, lang)}</Link></li>
              </ul>
            </div>

            {/* Payment */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                {L({ fr: "Paiement", en: "Payment", es: "Pago", pt: "Pagamento", de: "Zahlung", tr: "Ödeme", nl: "Betaling", ar: "الدفع" }, lang)}
              </h3>
              <p className="text-[13px] text-white/60 mb-3">
                {L({ fr: "Crypto via OxaPay", en: "Crypto via OxaPay", es: "Cripto vía OxaPay", pt: "Cripto via OxaPay", de: "Krypto via OxaPay", tr: "OxaPay ile kripto", nl: "Crypto via OxaPay", ar: "كريبتو عبر OxaPay" }, lang)}
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
