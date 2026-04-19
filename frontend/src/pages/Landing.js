import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Headphones, Music, Zap, Check, ArrowRight, Shield, Gift,
  Download, Volume2, Radio, Sparkles, Clock, Users, Lock,
  Star, Heart, CreditCard, ChevronDown, Infinity as InfinityIcon,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export default function Landing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";

  const [stats, setStats] = useState({ orders: 0, links: 0 });
  const [trending, setTrending] = useState({ albums: [], artists: [] });
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    axios.get(`${API}/stats/public`).then((r) => setStats(r.data)).catch(() => {});
    axios.get(`${API}/deezer/trending`).then((r) => setTrending(r.data)).catch(() => {});
  }, []);

  const translate = {
    fr: {
      newDrop: "Nouvelle offre — Activation instantanée",
      trusted: "Plus de 10,000+ clients depuis 2022",
      heroTitle1: "deezlink",
      heroTitle2: "",
      heroSub: "Accédez à Deezer Premium à prix réduit. Liens d'activation livrés en moins de 5 minutes par email. Paiement crypto 100% anonyme — aucune carte, aucun abonnement.",
      ctaMain: "Commencer",
      ctaAlt: "Voir les offres",
      statLinks: "Liens livrés",
      statOrders: "Commandes validées",
      statTime: "Délai moyen",
      statSupport: "Support",
      featuresLabel: "Pourquoi deezlink",
      featuresTitle: "Musique premium — sans les frais",
      featuresSub: "Une expérience d'écoute complète, avec tous les avantages d'un compte Premium.",
      pricingLabel: "Notre tarification",
      pricingTitle: "Simple. Dégressive. Transparente.",
      pricingSub: "Plus vous achetez, moins chaque lien coûte.",
      perLink: "par lien",
      mostPopular: "Le plus populaire",
      bestValue: "Meilleur rapport",
      choose: "Choisir ce pack",
      testsLabel: "Avis authentiques",
      testsTitle: "Ce qu'ils en pensent",
      testsSub: "Des milliers de clients satisfaits depuis 2022.",
      faqLabel: "Questions fréquentes",
      faqTitle: "Tout ce qu'il faut savoir",
      howLabel: "Comment ça marche",
      howTitle: "4 étapes, 5 minutes chrono",
      howSub: "Aussi simple que ça. Aucun compte nécessaire.",
    },
    en: {
      newDrop: "New drop — Instant activation",
      trusted: "Trusted by 10,000+ customers since 2022",
      heroTitle1: "deezlink",
      heroTitle2: "",
      heroSub: "Access Deezer Premium at reduced prices. Activation links delivered in under 5 minutes by email. 100% anonymous crypto payment — no card, no subscription.",
      ctaMain: "Get Started",
      ctaAlt: "View offers",
      statLinks: "Links delivered",
      statOrders: "Completed orders",
      statTime: "Avg. delivery",
      statSupport: "Support",
      featuresLabel: "Why deezlink",
      featuresTitle: "Premium music — without the bills",
      featuresSub: "A complete listening experience with every Premium perk included.",
      pricingLabel: "Our pricing",
      pricingTitle: "Simple. Volume-based. Transparent.",
      pricingSub: "The more you buy, the less each link costs.",
      perLink: "per link",
      mostPopular: "Most popular",
      bestValue: "Best value",
      choose: "Choose this pack",
      testsLabel: "Real reviews",
      testsTitle: "What they say",
      testsSub: "Thousands of happy customers since 2022.",
      faqLabel: "FAQ",
      faqTitle: "Everything you need to know",
      howLabel: "How it works",
      howTitle: "4 steps, 5 minutes flat",
      howSub: "As simple as that. No account required.",
    },
  };
  const T = translate[lang] || translate.en;

  const packs = [
    {
      id: "starter",
      name: "Starter",
      quantity: 1,
      price: 5,
      strike: null,
      unit: "5.00",
      perks: [
        lang === "fr" ? "1 lien d'activation" : "1 activation link",
        lang === "fr" ? "Livraison < 5 min" : "Under 5min delivery",
        lang === "fr" ? "Garantie 30 jours" : "30-day guarantee",
        lang === "fr" ? "Support 24/7" : "24/7 support",
      ],
    },
    {
      id: "popular",
      name: "Essential",
      quantity: 3,
      price: 13,
      strike: 15,
      unit: "4.33",
      badge: T.mostPopular,
      perks: [
        lang === "fr" ? "3 liens — économisez 13%" : "3 links — save 13%",
        lang === "fr" ? "Livraison prioritaire" : "Priority delivery",
        lang === "fr" ? "Garantie 30 jours" : "30-day guarantee",
        lang === "fr" ? "Support prioritaire" : "Priority support",
        lang === "fr" ? "+5 points fidélité" : "+5 loyalty points",
      ],
      highlight: true,
    },
    {
      id: "premium",
      name: "Premium",
      quantity: 10,
      price: 35,
      strike: 50,
      unit: "3.50",
      badge: T.bestValue,
      perks: [
        lang === "fr" ? "10 liens — économisez 30%" : "10 links — save 30%",
        lang === "fr" ? "Livraison instantanée" : "Instant delivery",
        lang === "fr" ? "Garantie 30 jours" : "30-day guarantee",
        lang === "fr" ? "Support dédié VIP" : "Dedicated VIP support",
        lang === "fr" ? "+20 points fidélité" : "+20 loyalty points",
      ],
    },
  ];

  const features = [
    { icon: Volume2, title: lang === "fr" ? "Audio HiFi FLAC" : "HiFi FLAC audio", desc: lang === "fr" ? "Qualité lossless, comme en studio." : "Lossless studio-grade quality." },
    { icon: Download, title: lang === "fr" ? "Hors-ligne illimité" : "Unlimited offline", desc: lang === "fr" ? "Téléchargez tout. Écoutez partout." : "Download it all. Listen anywhere." },
    { icon: Radio, title: lang === "fr" ? "Flow IA" : "Flow AI", desc: lang === "fr" ? "Radio personnalisée par machine learning." : "ML-powered personal radio." },
    { icon: Zap, title: lang === "fr" ? "Zéro pub" : "Zero ads", desc: lang === "fr" ? "Jamais d'interruption. Jamais." : "Never interrupted. Ever." },
    { icon: InfinityIcon, title: lang === "fr" ? "120M+ titres" : "120M+ tracks", desc: lang === "fr" ? "Catalogue complet, tout l'univers musical." : "The full universe of music." },
    { icon: Heart, title: lang === "fr" ? "Paroles synchronisées" : "Synced lyrics", desc: lang === "fr" ? "Chantez chaque note avec les paroles." : "Sing every note with live lyrics." },
  ];

  const faqs = [
    { q: lang === "fr" ? "Les liens sont-ils garantis ?" : "Are the links guaranteed?",
      a: lang === "fr" ? "Chaque lien est garanti 30 jours minimum. Si un lien ne fonctionne pas, nous le remplaçons gratuitement." : "Every link is guaranteed for at least 30 days. If a link doesn't work, we replace it for free." },
    { q: lang === "fr" ? "Quels moyens de paiement acceptez-vous ?" : "Which payment methods do you accept?",
      a: lang === "fr" ? "Nous acceptons uniquement les cryptomonnaies : Bitcoin, Ethereum, USDT et Litecoin. 100% anonyme, aucune carte bancaire." : "We accept only cryptocurrencies: Bitcoin, Ethereum, USDT and Litecoin. 100% anonymous, no credit card." },
    { q: lang === "fr" ? "Dans quel délai vais-je recevoir mes liens ?" : "How fast will I receive my links?",
      a: lang === "fr" ? "En général, moins de 5 minutes après confirmation du paiement. Les liens arrivent directement par email." : "Usually under 5 minutes after payment confirmation. Links arrive directly by email." },
    { q: lang === "fr" ? "Le service est-il légal ?" : "Is the service legal?",
      a: lang === "fr" ? "deezlink n'est pas affilié à Deezer. Nous fournissons des liens d'activation achetés à des distributeurs agréés. L'usage relève de votre responsabilité." : "deezlink is not affiliated with Deezer. We provide activation links sourced from authorized distributors. Usage is your responsibility." },
    { q: lang === "fr" ? "Puis-je offrir un lien ?" : "Can I gift a link?",
      a: lang === "fr" ? "Oui, consultez la section Cartes Cadeaux pour envoyer un lien avec un message personnalisé." : "Yes, check the Gift Cards section to send a link with a personalised message." },
  ];

  const albums = (trending.albums || []).slice(0, 8);
  const artists = (trending.artists || []).slice(0, 10);

  return (
    <div className="relative">
      {/* ═════════ HERO ═════════ */}
      <section className="relative px-4 sm:px-6 pt-14 sm:pt-20 pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 sm:gap-16 items-center">
            {/* LEFT — text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative z-10"
            >
              <div className="flex flex-col items-start gap-3 mb-8">
                <span className="pill" data-testid="hero-pill-new">
                  <span className="pill-dot" />
                  {T.newDrop}
                </span>
              </div>

              <h1
                className="display-xl text-white mb-6"
                data-testid="hero-title"
                style={{ letterSpacing: "-0.06em" }}
              >
                {T.heroTitle1}
              </h1>

              <p className="text-white/65 text-[16px] sm:text-[17px] leading-relaxed max-w-xl mb-10">
                {T.heroSub}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-12">
                <button onClick={() => navigate("/offers")} className="btn-primary" data-testid="hero-cta-primary">
                  {T.ctaMain}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }} className="btn-secondary" data-testid="hero-cta-secondary">
                  {lang === "fr" ? "En savoir plus" : "Learn more"}
                </button>
              </div>

              {/* Mini stats row */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-white/50 text-[13px]">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-violet-400" />
                  {lang === "fr" ? "Paiement crypto" : "Crypto payment"}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-violet-400" />
                  {lang === "fr" ? "Livraison < 5 min" : "Under 5min delivery"}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-violet-400" />
                  {lang === "fr" ? "Support 24/7" : "24/7 support"}
                </div>
              </div>
            </motion.div>

            {/* RIGHT — album mosaic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] sm:aspect-square w-full max-w-[520px] ml-auto">
                {/* Violet halo behind */}
                <div className="absolute -inset-10 bg-gradient-to-tr from-violet-700/35 via-violet-500/20 to-transparent blur-3xl rounded-full" />

                <div className="relative grid grid-cols-3 grid-rows-4 gap-2 sm:gap-3 h-full">
                  {/* Big featured card */}
                  <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden card-surface">
                    {albums[0] ? (
                      <img src={albums[0].cover_big} alt={albums[0].title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-black flex items-center justify-center">
                        <Music className="h-16 w-16 text-violet-400/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3">
                      <div className="pill !py-1 !px-2 !text-[10px]">
                        <span className="pill-dot pill-dot-violet" />
                        {lang === "fr" ? "En tendance" : "Trending"}
                      </div>
                    </div>
                  </div>

                  {/* Small artist tiles */}
                  {[1, 2, 3, 4].map((idx) => {
                    const a = artists[idx - 1] || albums[idx];
                    const img = a?.picture_big || a?.cover_big || a?.cover;
                    return (
                      <div key={idx} className="relative rounded-2xl overflow-hidden card-surface aspect-square">
                        {img ? (
                          <img src={img} alt={a?.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-900/30 to-black flex items-center justify-center">
                            <Star className="h-5 w-5 text-violet-400/40" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Bottom wide card */}
                  <div className="col-span-3 row-span-1 relative rounded-2xl overflow-hidden card-surface flex items-center gap-3 px-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shrink-0 shadow-[0_8px_24px_-8px_rgba(139,92,246,0.7)]">
                      <Headphones className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm font-semibold truncate">
                        {lang === "fr" ? "Deezer Premium activé" : "Deezer Premium activated"}
                      </div>
                      <div className="text-white/50 text-xs truncate">
                        {lang === "fr" ? "Tous les avantages débloqués" : "All perks unlocked"}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═════════ METRICS BAR ═════════ */}
      <section className="relative px-4 sm:px-6 mb-20 sm:mb-28">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-[1.5rem] border border-white/[0.06] bg-[rgba(10,10,14,0.6)] backdrop-blur-xl grid grid-cols-3 divide-x divide-white/[0.05] overflow-hidden">
            {[
              { value: stats.links ? `${stats.links.toLocaleString()}+` : "10,000+", label: T.statLinks },
              { value: "<5 min", label: T.statTime },
              { value: "24/7", label: T.statSupport },
            ].map((s, i) => (
              <div key={i} className="p-5 sm:p-7 text-center">
                <div className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight mb-1">{s.value}</div>
                <div className="text-[11px] sm:text-[13px] text-white/50 uppercase tracking-[0.12em]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ FEATURES ═════════ */}
      <section id="features" className="relative px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 sm:mb-16 max-w-2xl">
            <div className="pill mb-4"><span className="pill-dot pill-dot-violet" />{T.featuresLabel}</div>
            <h2 className="display-lg text-white mb-3">{T.featuresTitle}</h2>
            <p className="text-white/55 text-[16px]">{T.featuresSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.05 }}
                  className="card-surface p-6 group hover:border-violet-500/30 transition-all"
                  data-testid={`feature-${i}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-violet-500/25 transition-all">
                    <Icon className="h-5 w-5 text-violet-300" />
                  </div>
                  <h3 className="text-white text-[17px] font-semibold mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-white/55 text-[14px] leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═════════ PRICING ═════════ */}
      <section id="pricing" className="relative px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 sm:mb-16 max-w-2xl mx-auto text-center">
            <div className="pill mb-4 mx-auto"><span className="pill-dot pill-dot-violet" />{T.pricingLabel}</div>
            <h2 className="display-lg text-white mb-3">{T.pricingTitle}</h2>
            <p className="text-white/55 text-[16px]">{T.pricingSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 pt-6">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className={`relative p-7 rounded-[1.5rem] ${
                  pack.highlight
                    ? "bg-gradient-to-b from-violet-900/40 to-[#0a0a0e] border border-violet-500/40"
                    : "card-surface"
                }`}
                data-testid={`pack-${pack.id}`}
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center px-3 py-[5px] rounded-full bg-violet-500 text-white text-[11px] font-semibold whitespace-nowrap">
                      {pack.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white text-[15px] font-semibold">{pack.name}</span>
                  <span className="text-white/40 text-[12px]">· {pack.quantity} {lang === "fr" ? "liens" : "links"}</span>
                </div>

                <div className="mb-5 mt-4">
                  {pack.strike && (
                    <div className="text-white/35 text-sm line-through">{pack.strike}€</div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="display-md text-white">{pack.price}€</span>
                    <span className="text-white/45 text-sm">/ {lang === "fr" ? "pack" : "pack"}</span>
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

                <ul className="mt-6 space-y-2.5">
                  {pack.perks.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-white/70">
                      <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-violet-300" />
                      </div>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/offers" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-[14px] font-medium transition-colors">
              {lang === "fr" ? "Voir toutes les offres & quantités personnalisées" : "See all offers & custom quantities"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═════════ FAQ ═════════ */}
      <section className="relative px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-12 text-center">
            <div className="pill mb-4 mx-auto"><span className="pill-dot pill-dot-violet" />{T.faqLabel}</div>
            <h2 className="display-lg text-white mb-3">{T.faqTitle}</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => {
              const open = openFAQ === i;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border transition-all ${
                    open
                      ? "bg-[#0f0f14] border-violet-500/30"
                      : "bg-[#0a0a0e] border-white/[0.07] hover:border-white/[0.12]"
                  }`}
                >
                  <button
                    onClick={() => setOpenFAQ(open ? null : i)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left"
                    data-testid={`faq-${i}`}
                  >
                    <span className="text-white text-[14.5px] sm:text-[15px] font-semibold">{f.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-white/50 shrink-0 transition-transform ${open ? "rotate-180 text-violet-400" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="px-5 sm:px-6 pb-5 text-white/60 text-[14px] leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
