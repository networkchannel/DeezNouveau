import { Link, useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import Reveal, { StaggerItem } from "@/components/Reveal";
import MobileCarousel from "@/components/MobileCarousel";
import { pickLang as L } from "@/utils/langPick";

/**
 * Landing "Our pricing" section — 3 pack cards.
 * Mobile : horizontal carousel with snap + dots.
 * Desktop: 3-column grid.
 */
export default function PricingSection({ T, packs, lang }) {
  const navigate = useNavigate();
  return (
    <section id="pricing" className="relative px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="mb-8 sm:mb-16 max-w-2xl mx-auto text-center">
          <div className="pill mb-4 mx-auto"><span className="pill-dot pill-dot-violet" />{T.pricingLabel}</div>
          <h2 className="display-lg text-white mb-3">{T.pricingTitle}</h2>
          <p className="text-white/55 text-[15px] sm:text-[16px]">{T.pricingSub}</p>
        </Reveal>

        <MobileCarousel
          desktopCols="3"
          itemClass="w-[85%] xs:w-[80%] sm:w-[60%]"
          ariaLabel="Pricing packs"
          gap="gap-3 sm:gap-4"
        >
          {packs.map((pack, i) => (
            <StaggerItem
              key={pack.id}
              delay={i * 0.08}
              className={`relative p-6 sm:p-7 rounded-[1.5rem] transition-all duration-200 h-full ${
                pack.highlight
                  ? "bg-gradient-to-b from-violet-900/30 to-[rgba(10,5,20,0.4)] backdrop-blur-xl border border-violet-500/40 hover:border-violet-400/70 hover:-translate-y-[3px]"
                  : "card-surface"
              }`}
              y={30}
            >
              <div data-testid={`pack-${pack.id}`}>
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center px-3 py-[5px] rounded-full bg-violet-500 text-white text-[11px] font-semibold whitespace-nowrap">
                      {pack.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white text-[15px] font-semibold">{pack.name}</span>
                  <span className="text-white/40 text-[12px]">· {pack.quantity} {L({ fr: "liens", en: "links", es: "enlaces", pt: "links", de: "Links", tr: "bağlantı", nl: "links", ar: "روابط" }, lang)}</span>
                </div>

                <div className="mb-5 mt-4">
                  {pack.strike && (
                    <div className="text-white/35 text-sm line-through">{pack.strike}€</div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="display-md text-white">{pack.price}€</span>
                    <span className="text-white/45 text-sm">/ {L({ fr: "pack", en: "pack", es: "pack", pt: "pack", de: "Pack", tr: "paket", nl: "pakket", ar: "باقة" }, lang)}</span>
                  </div>
                  <div className="text-white/45 text-[12px] mt-1">
                    {pack.unit}€ {T.perLink}
                  </div>
                </div>

                <button
                  onClick={() => navigate("/offers")}
                  className={pack.highlight ? "btn-primary w-full" : "btn-secondary w-full"}
                  data-testid={`pack-${pack.id}-cta`}
                >
                  {T.choose}
                </button>

                <ul className="mt-5 sm:mt-6 space-y-2 sm:space-y-2.5">
                  {pack.perks.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] sm:text-[13.5px] text-white/70">
                      <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-violet-300" />
                      </div>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </MobileCarousel>

        <Reveal className="text-center mt-8 sm:mt-10" delay={0.15}>
          <Link to="/offers" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-[13.5px] sm:text-[14px] font-medium transition-colors">
            {L({ fr: "Voir toutes les offres & quantités personnalisées", en: "See all offers & custom quantities", es: "Ver todas las ofertas y cantidades", pt: "Ver todas as ofertas e quantidades", de: "Alle Angebote & benutzerdefinierte Mengen", tr: "Tüm teklifleri ve özel miktarları görün", nl: "Alle aanbiedingen & aangepaste hoeveelheden", ar: "شاهد جميع العروض والكميات المخصصة" }, lang)}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
