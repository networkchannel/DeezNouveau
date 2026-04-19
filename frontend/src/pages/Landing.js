import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import { smoothScrollTo } from "@/utils/smoothScroll";
import { pickLang as L } from "@/utils/langPick";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/Reveal";
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
    es: {
      newDrop: "Nueva oferta — Activación instantánea",
      trusted: "Más de 10,000 clientes desde 2022",
      heroTitle1: "deezlink", heroTitle2: "",
      heroSub: "Accede a Deezer Premium a precios reducidos. Enlaces de activación entregados en menos de 5 minutos por email. Pago cripto 100% anónimo — sin tarjeta, sin suscripción.",
      ctaMain: "Empezar", ctaAlt: "Ver ofertas",
      statLinks: "Enlaces entregados", statOrders: "Pedidos completados", statTime: "Entrega media", statSupport: "Soporte",
      featuresLabel: "Por qué deezlink",
      featuresTitle: "Música Premium — sin las facturas",
      featuresSub: "Una experiencia de escucha completa con todas las ventajas Premium incluidas.",
      pricingLabel: "Nuestra tarifa",
      pricingTitle: "Simple. Por volumen. Transparente.",
      pricingSub: "Cuanto más compras, menos cuesta cada enlace.",
      perLink: "por enlace", mostPopular: "Más popular", bestValue: "Mejor valor", choose: "Elegir este pack",
      testsLabel: "Opiniones reales", testsTitle: "Lo que dicen", testsSub: "Miles de clientes satisfechos desde 2022.",
      faqLabel: "Preguntas frecuentes", faqTitle: "Todo lo que necesitas saber",
      howLabel: "Cómo funciona", howTitle: "4 pasos, 5 minutos", howSub: "Así de simple. Sin cuenta necesaria.",
    },
    pt: {
      newDrop: "Nova oferta — Ativação instantânea",
      trusted: "Mais de 10,000 clientes desde 2022",
      heroTitle1: "deezlink", heroTitle2: "",
      heroSub: "Acesse o Deezer Premium a preços reduzidos. Links de ativação entregues em menos de 5 minutos por email. Pagamento cripto 100% anônimo — sem cartão, sem assinatura.",
      ctaMain: "Começar", ctaAlt: "Ver ofertas",
      statLinks: "Links entregues", statOrders: "Pedidos concluídos", statTime: "Entrega média", statSupport: "Suporte",
      featuresLabel: "Por que deezlink",
      featuresTitle: "Música Premium — sem as contas",
      featuresSub: "Uma experiência de escuta completa com todas as vantagens Premium incluídas.",
      pricingLabel: "Nossos preços",
      pricingTitle: "Simples. Por volume. Transparente.",
      pricingSub: "Quanto mais você compra, menos custa cada link.",
      perLink: "por link", mostPopular: "Mais popular", bestValue: "Melhor valor", choose: "Escolher este pack",
      testsLabel: "Avaliações reais", testsTitle: "O que eles dizem", testsSub: "Milhares de clientes satisfeitos desde 2022.",
      faqLabel: "Perguntas frequentes", faqTitle: "Tudo o que você precisa saber",
      howLabel: "Como funciona", howTitle: "4 passos, 5 minutos", howSub: "Simples assim. Sem conta necessária.",
    },
    de: {
      newDrop: "Neues Angebot — Sofortige Aktivierung",
      trusted: "Über 10.000 Kunden seit 2022",
      heroTitle1: "deezlink", heroTitle2: "",
      heroSub: "Zugang zu Deezer Premium zu reduzierten Preisen. Aktivierungslinks in weniger als 5 Minuten per E-Mail geliefert. 100% anonyme Krypto-Zahlung — keine Karte, kein Abo.",
      ctaMain: "Loslegen", ctaAlt: "Angebote ansehen",
      statLinks: "Gelieferte Links", statOrders: "Abgeschlossene Bestellungen", statTime: "Durchschn. Lieferung", statSupport: "Support",
      featuresLabel: "Warum deezlink",
      featuresTitle: "Premium Musik — ohne die Rechnungen",
      featuresSub: "Ein komplettes Hörerlebnis mit allen Premium-Vorteilen.",
      pricingLabel: "Unsere Preise",
      pricingTitle: "Einfach. Mengenbasiert. Transparent.",
      pricingSub: "Je mehr Sie kaufen, desto weniger kostet jeder Link.",
      perLink: "pro Link", mostPopular: "Am beliebtesten", bestValue: "Bester Wert", choose: "Dieses Pack wählen",
      testsLabel: "Echte Bewertungen", testsTitle: "Was sie sagen", testsSub: "Tausende zufriedene Kunden seit 2022.",
      faqLabel: "FAQ", faqTitle: "Alles was Sie wissen müssen",
      howLabel: "So funktioniert's", howTitle: "4 Schritte, 5 Minuten", howSub: "So einfach ist das. Kein Konto nötig.",
    },
    tr: {
      newDrop: "Yeni teklif — Anında aktivasyon",
      trusted: "2022'den beri 10.000'den fazla müşteri",
      heroTitle1: "deezlink", heroTitle2: "",
      heroSub: "Deezer Premium'a indirimli fiyatlarla erişin. Aktivasyon bağlantıları 5 dakikadan kısa sürede e-posta ile teslim edilir. %100 anonim kripto ödeme — kart yok, abonelik yok.",
      ctaMain: "Başla", ctaAlt: "Teklifleri gör",
      statLinks: "Teslim edilen linkler", statOrders: "Tamamlanan siparişler", statTime: "Ort. teslimat", statSupport: "Destek",
      featuresLabel: "Neden deezlink",
      featuresTitle: "Premium müzik — faturalar olmadan",
      featuresSub: "Tüm Premium avantajlarıyla eksiksiz bir dinleme deneyimi.",
      pricingLabel: "Fiyatlarımız",
      pricingTitle: "Basit. Hacim bazlı. Şeffaf.",
      pricingSub: "Ne kadar çok alırsan, her bağlantı o kadar ucuz.",
      perLink: "bağlantı başına", mostPopular: "En popüler", bestValue: "En iyi değer", choose: "Bu paketi seç",
      testsLabel: "Gerçek yorumlar", testsTitle: "Ne diyorlar", testsSub: "2022'den beri binlerce mutlu müşteri.",
      faqLabel: "SSS", faqTitle: "Bilmeniz gereken her şey",
      howLabel: "Nasıl çalışır", howTitle: "4 adım, 5 dakika", howSub: "Bu kadar basit. Hesap gerekmez.",
    },
    nl: {
      newDrop: "Nieuwe deal — Directe activering",
      trusted: "Meer dan 10.000 klanten sinds 2022",
      heroTitle1: "deezlink", heroTitle2: "",
      heroSub: "Toegang tot Deezer Premium tegen gereduceerde prijzen. Activeringslinks geleverd in minder dan 5 minuten per e-mail. 100% anonieme crypto-betaling — geen kaart, geen abonnement.",
      ctaMain: "Aan de slag", ctaAlt: "Bekijk aanbiedingen",
      statLinks: "Geleverde links", statOrders: "Voltooide bestellingen", statTime: "Gem. levering", statSupport: "Support",
      featuresLabel: "Waarom deezlink",
      featuresTitle: "Premium muziek — zonder de rekeningen",
      featuresSub: "Een complete luisterervaring met alle Premium-voordelen inbegrepen.",
      pricingLabel: "Onze prijzen",
      pricingTitle: "Simpel. Op volume. Transparant.",
      pricingSub: "Hoe meer je koopt, hoe minder elke link kost.",
      perLink: "per link", mostPopular: "Meest populair", bestValue: "Beste waarde", choose: "Kies dit pakket",
      testsLabel: "Echte reviews", testsTitle: "Wat ze zeggen", testsSub: "Duizenden tevreden klanten sinds 2022.",
      faqLabel: "FAQ", faqTitle: "Alles wat je moet weten",
      howLabel: "Zo werkt het", howTitle: "4 stappen, 5 minuten", howSub: "Zo simpel is het. Geen account nodig.",
    },
    ar: {
      newDrop: "عرض جديد — تفعيل فوري",
      trusted: "أكثر من 10,000 عميل منذ 2022",
      heroTitle1: "deezlink", heroTitle2: "",
      heroSub: "احصل على Deezer Premium بأسعار مخفضة. روابط التفعيل تُسلَّم في أقل من 5 دقائق عبر البريد الإلكتروني. دفع كريبتو مجهول 100% — بدون بطاقة، بدون اشتراك.",
      ctaMain: "ابدأ", ctaAlt: "شاهد العروض",
      statLinks: "روابط مُسلَّمة", statOrders: "طلبات مكتملة", statTime: "متوسط التسليم", statSupport: "الدعم",
      featuresLabel: "لماذا deezlink",
      featuresTitle: "موسيقى بريميوم — بدون فواتير",
      featuresSub: "تجربة استماع كاملة مع جميع مزايا بريميوم.",
      pricingLabel: "أسعارنا",
      pricingTitle: "بسيط. حسب الكمية. شفاف.",
      pricingSub: "كلما اشتريت أكثر، قلّ سعر كل رابط.",
      perLink: "لكل رابط", mostPopular: "الأكثر شعبية", bestValue: "أفضل قيمة", choose: "اختر هذه الباقة",
      testsLabel: "تقييمات حقيقية", testsTitle: "ما يقولون", testsSub: "آلاف العملاء السعداء منذ 2022.",
      faqLabel: "الأسئلة الشائعة", faqTitle: "كل ما تحتاج معرفته",
      howLabel: "كيف يعمل", howTitle: "4 خطوات، 5 دقائق", howSub: "بهذه البساطة. لا حاجة لحساب.",
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
        L({ fr: "1 lien d'activation", en: "1 activation link", es: "1 enlace de activación", pt: "1 link de ativação", de: "1 Aktivierungslink", tr: "1 aktivasyon bağlantısı", nl: "1 activeringslink", ar: "رابط تفعيل واحد" }, lang),
        L({ fr: "Livraison < 5 min", en: "Under 5min delivery", es: "Entrega < 5 min", pt: "Entrega < 5 min", de: "Lieferung < 5 Min.", tr: "5 dk içinde teslimat", nl: "Levering < 5 min", ar: "التوصيل خلال 5 دقائق" }, lang),
        L({ fr: "Garantie 30 jours", en: "30-day guarantee", es: "Garantía 30 días", pt: "Garantia 30 dias", de: "30-Tage-Garantie", tr: "30 gün garanti", nl: "30 dagen garantie", ar: "ضمان 30 يومًا" }, lang),
        L({ fr: "Support 24/7", en: "24/7 support", es: "Soporte 24/7", pt: "Suporte 24/7", de: "24/7 Support", tr: "7/24 destek", nl: "24/7 support", ar: "دعم 24/7" }, lang),
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
        L({ fr: "3 liens — économisez 13%", en: "3 links — save 13%", es: "3 enlaces — ahorra 13%", pt: "3 links — economize 13%", de: "3 Links — 13% sparen", tr: "3 bağlantı — %13 tasarruf", nl: "3 links — 13% korting", ar: "3 روابط — وفّر 13%" }, lang),
        L({ fr: "Livraison prioritaire", en: "Priority delivery", es: "Entrega prioritaria", pt: "Entrega prioritária", de: "Prioritäts-Lieferung", tr: "Öncelikli teslimat", nl: "Prioriteitslevering", ar: "توصيل أولوية" }, lang),
        L({ fr: "Garantie 30 jours", en: "30-day guarantee", es: "Garantía 30 días", pt: "Garantia 30 dias", de: "30-Tage-Garantie", tr: "30 gün garanti", nl: "30 dagen garantie", ar: "ضمان 30 يومًا" }, lang),
        L({ fr: "Support prioritaire", en: "Priority support", es: "Soporte prioritario", pt: "Suporte prioritário", de: "Prioritäts-Support", tr: "Öncelikli destek", nl: "Prioriteit support", ar: "دعم أولوية" }, lang),
        L({ fr: "+5 points fidélité", en: "+5 loyalty points", es: "+5 puntos fidelidad", pt: "+5 pontos fidelidade", de: "+5 Treuepunkte", tr: "+5 sadakat puanı", nl: "+5 loyaliteitspunten", ar: "+5 نقاط ولاء" }, lang),
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
        L({ fr: "10 liens — économisez 30%", en: "10 links — save 30%", es: "10 enlaces — ahorra 30%", pt: "10 links — economize 30%", de: "10 Links — 30% sparen", tr: "10 bağlantı — %30 tasarruf", nl: "10 links — 30% korting", ar: "10 روابط — وفّر 30%" }, lang),
        L({ fr: "Livraison instantanée", en: "Instant delivery", es: "Entrega instantánea", pt: "Entrega instantânea", de: "Sofortige Lieferung", tr: "Anında teslimat", nl: "Directe levering", ar: "توصيل فوري" }, lang),
        L({ fr: "Garantie 30 jours", en: "30-day guarantee", es: "Garantía 30 días", pt: "Garantia 30 dias", de: "30-Tage-Garantie", tr: "30 gün garanti", nl: "30 dagen garantie", ar: "ضمان 30 يومًا" }, lang),
        L({ fr: "Support dédié VIP", en: "Dedicated VIP support", es: "Soporte VIP dedicado", pt: "Suporte VIP dedicado", de: "Dedizierter VIP-Support", tr: "Özel VIP destek", nl: "Toegewijd VIP-support", ar: "دعم VIP مخصص" }, lang),
        L({ fr: "+20 points fidélité", en: "+20 loyalty points", es: "+20 puntos fidelidad", pt: "+20 pontos fidelidade", de: "+20 Treuepunkte", tr: "+20 sadakat puanı", nl: "+20 loyaliteitspunten", ar: "+20 نقاط ولاء" }, lang),
      ],
    },
  ];

  const features = [
    { icon: Volume2,
      title: L({ fr: "Audio HiFi FLAC", en: "HiFi FLAC audio", es: "Audio HiFi FLAC", pt: "Áudio HiFi FLAC", de: "HiFi FLAC Audio", tr: "HiFi FLAC ses", nl: "HiFi FLAC audio", ar: "صوت HiFi FLAC" }, lang),
      desc: L({ fr: "Qualité lossless, comme en studio.", en: "Lossless studio-grade quality.", es: "Calidad sin pérdida, como en estudio.", pt: "Qualidade lossless, como em estúdio.", de: "Verlustfreie Studioqualität.", tr: "Stüdyo kalitesinde kayıpsız.", nl: "Lossless studio kwaliteit.", ar: "جودة استوديو بدون فقد." }, lang) },
    { icon: Download,
      title: L({ fr: "Hors-ligne illimité", en: "Unlimited offline", es: "Sin conexión ilimitado", pt: "Offline ilimitado", de: "Unbegrenzt offline", tr: "Sınırsız çevrimdışı", nl: "Onbeperkt offline", ar: "دون اتصال غير محدود" }, lang),
      desc: L({ fr: "Téléchargez tout. Écoutez partout.", en: "Download it all. Listen anywhere.", es: "Descarga todo. Escucha en cualquier lugar.", pt: "Baixe tudo. Ouça em qualquer lugar.", de: "Alles herunterladen. Überall hören.", tr: "Her şeyi indir. Her yerde dinle.", nl: "Download alles. Luister overal.", ar: "حمّل كل شيء. استمع في أي مكان." }, lang) },
    { icon: Radio,
      title: L({ fr: "Flow IA", en: "Flow AI", es: "Flow IA", pt: "Flow IA", de: "Flow KI", tr: "Flow YZ", nl: "Flow AI", ar: "Flow AI" }, lang),
      desc: L({ fr: "Radio personnalisée par machine learning.", en: "ML-powered personal radio.", es: "Radio personalizada con IA.", pt: "Rádio personalizada com IA.", de: "KI-gestützte persönliche Radio.", tr: "Makine öğrenimiyle kişisel radyo.", nl: "AI-aangedreven persoonlijke radio.", ar: "راديو شخصي بالذكاء الاصطناعي." }, lang) },
    { icon: Zap,
      title: L({ fr: "Zéro pub", en: "Zero ads", es: "Sin anuncios", pt: "Sem anúncios", de: "Keine Werbung", tr: "Sıfır reklam", nl: "Geen advertenties", ar: "بدون إعلانات" }, lang),
      desc: L({ fr: "Jamais d'interruption. Jamais.", en: "Never interrupted. Ever.", es: "Nunca interrumpido. Jamás.", pt: "Nunca interrompido. Jamais.", de: "Nie unterbrochen. Niemals.", tr: "Asla kesilmez. Asla.", nl: "Nooit onderbroken. Nooit.", ar: "لا انقطاع أبدًا." }, lang) },
    { icon: InfinityIcon,
      title: L({ fr: "120M+ titres", en: "120M+ tracks", es: "120M+ canciones", pt: "120M+ faixas", de: "120M+ Titel", tr: "120M+ parça", nl: "120M+ tracks", ar: "+120 مليون أغنية" }, lang),
      desc: L({ fr: "Catalogue complet, tout l'univers musical.", en: "The full universe of music.", es: "El universo completo de la música.", pt: "O universo completo da música.", de: "Das gesamte Musikuniversum.", tr: "Müziğin tüm evreni.", nl: "Het hele muziekuniversum.", ar: "عالم الموسيقى الكامل." }, lang) },
    { icon: Heart,
      title: L({ fr: "Paroles synchronisées", en: "Synced lyrics", es: "Letras sincronizadas", pt: "Letras sincronizadas", de: "Synchronisierte Texte", tr: "Senkronize şarkı sözleri", nl: "Gesynchroniseerde teksten", ar: "كلمات متزامنة" }, lang),
      desc: L({ fr: "Chantez chaque note avec les paroles.", en: "Sing every note with live lyrics.", es: "Canta cada nota con letras en vivo.", pt: "Cante cada nota com letras ao vivo.", de: "Singen Sie jede Note mit Live-Texten.", tr: "Canlı sözlerle her notayı söyleyin.", nl: "Zing elke noot met live teksten.", ar: "غنّ كل نغمة مع الكلمات." }, lang) },
  ];

  const faqs = [
    { q: L({ fr: "Les liens sont-ils garantis ?", en: "Are the links guaranteed?", es: "¿Los enlaces están garantizados?", pt: "Os links são garantidos?", de: "Sind die Links garantiert?", tr: "Bağlantılar garantili mi?", nl: "Zijn de links gegarandeerd?", ar: "هل الروابط مضمونة؟" }, lang),
      a: L({ fr: "Chaque lien est garanti 30 jours minimum. Si un lien ne fonctionne pas, nous le remplaçons gratuitement.", en: "Every link is guaranteed for at least 30 days. If a link doesn't work, we replace it for free.", es: "Cada enlace está garantizado por al menos 30 días. Si un enlace no funciona, lo reemplazamos gratis.", pt: "Cada link é garantido por pelo menos 30 dias. Se um link não funcionar, substituímos gratuitamente.", de: "Jeder Link ist mindestens 30 Tage garantiert. Falls er nicht funktioniert, ersetzen wir ihn kostenlos.", tr: "Her bağlantı en az 30 gün garantilidir. Çalışmazsa ücretsiz değiştiririz.", nl: "Elke link is minimaal 30 dagen gegarandeerd. Werkt een link niet, dan vervangen we deze gratis.", ar: "كل رابط مضمون لمدة 30 يومًا على الأقل. إذا لم يعمل نستبدله مجانًا." }, lang) },
    { q: L({ fr: "Quels moyens de paiement acceptez-vous ?", en: "Which payment methods do you accept?", es: "¿Qué métodos de pago aceptan?", pt: "Quais métodos de pagamento aceitam?", de: "Welche Zahlungsmethoden akzeptieren Sie?", tr: "Hangi ödeme yöntemlerini kabul ediyorsunuz?", nl: "Welke betaalmethoden accepteren jullie?", ar: "ما طرق الدفع المقبولة؟" }, lang),
      a: L({ fr: "Nous acceptons uniquement les cryptomonnaies : Bitcoin, Ethereum, USDT et Litecoin. 100% anonyme, aucune carte bancaire.", en: "We accept only cryptocurrencies: Bitcoin, Ethereum, USDT and Litecoin. 100% anonymous, no credit card.", es: "Aceptamos solo criptomonedas: Bitcoin, Ethereum, USDT y Litecoin. 100% anónimo, sin tarjeta bancaria.", pt: "Aceitamos apenas criptomoedas: Bitcoin, Ethereum, USDT e Litecoin. 100% anônimo, sem cartão.", de: "Wir akzeptieren nur Kryptowährungen: Bitcoin, Ethereum, USDT und Litecoin. 100% anonym, keine Kreditkarte.", tr: "Sadece kripto para birimlerini kabul ediyoruz: Bitcoin, Ethereum, USDT ve Litecoin. %100 anonim, kart yok.", nl: "We accepteren alleen cryptovaluta: Bitcoin, Ethereum, USDT en Litecoin. 100% anoniem, geen creditcard.", ar: "نقبل العملات الرقمية فقط: Bitcoin و Ethereum و USDT و Litecoin. مجهول 100%، بدون بطاقة." }, lang) },
    { q: L({ fr: "Dans quel délai vais-je recevoir mes liens ?", en: "How fast will I receive my links?", es: "¿Cuándo recibiré mis enlaces?", pt: "Quando receberei meus links?", de: "Wie schnell erhalte ich meine Links?", tr: "Bağlantılarımı ne kadar sürede alırım?", nl: "Hoe snel ontvang ik mijn links?", ar: "متى سأستلم روابطي؟" }, lang),
      a: L({ fr: "En général, moins de 5 minutes après confirmation du paiement. Les liens arrivent directement par email.", en: "Usually under 5 minutes after payment confirmation. Links arrive directly by email.", es: "Normalmente menos de 5 minutos tras confirmar el pago. Los enlaces llegan por email.", pt: "Normalmente menos de 5 minutos após a confirmação do pagamento. Os links chegam por email.", de: "Normalerweise unter 5 Minuten nach Zahlungsbestätigung. Links kommen per E-Mail.", tr: "Genellikle ödeme onayından sonra 5 dakikadan kısa sürede. Bağlantılar e-postayla gelir.", nl: "Meestal binnen 5 minuten na betalingsbevestiging. Links komen per e-mail.", ar: "عادة خلال 5 دقائق بعد تأكيد الدفع. تصل الروابط عبر البريد." }, lang) },
    { q: L({ fr: "Le service est-il légal ?", en: "Is the service legal?", es: "¿Es legal el servicio?", pt: "O serviço é legal?", de: "Ist der Dienst legal?", tr: "Hizmet yasal mı?", nl: "Is de dienst legaal?", ar: "هل الخدمة قانونية؟" }, lang),
      a: L({ fr: "deezlink n'est pas affilié à Deezer. Nous fournissons des liens d'activation achetés à des distributeurs agréés. L'usage relève de votre responsabilité.", en: "deezlink is not affiliated with Deezer. We provide activation links sourced from authorized distributors. Usage is your responsibility.", es: "deezlink no está afiliado a Deezer. Proporcionamos enlaces obtenidos de distribuidores autorizados. El uso es tu responsabilidad.", pt: "deezlink não é afiliado à Deezer. Fornecemos links de distribuidores autorizados. O uso é de sua responsabilidade.", de: "deezlink ist nicht mit Deezer verbunden. Wir liefern Links von autorisierten Distributoren. Nutzung auf eigene Verantwortung.", tr: "deezlink Deezer ile bağlantılı değildir. Bağlantılar yetkili distribütörlerden alınır. Kullanım size bağlıdır.", nl: "deezlink is niet gelieerd aan Deezer. We leveren links van geautoriseerde distributeurs. Gebruik op eigen verantwoordelijkheid.", ar: "deezlink غير مرتبط بـ Deezer. نوفر روابط من موزعين معتمدين. الاستخدام على مسؤوليتك." }, lang) },
    { q: L({ fr: "Puis-je offrir un lien ?", en: "Can I gift a link?", es: "¿Puedo regalar un enlace?", pt: "Posso presentear um link?", de: "Kann ich einen Link verschenken?", tr: "Bir bağlantı hediye edebilir miyim?", nl: "Kan ik een link cadeau geven?", ar: "هل يمكنني إهداء رابط؟" }, lang),
      a: L({ fr: "Oui, consultez la section Cartes Cadeaux pour envoyer un lien avec un message personnalisé.", en: "Yes, check the Gift Cards section to send a link with a personalised message.", es: "Sí, consulta la sección Tarjetas Regalo para enviar un enlace con mensaje.", pt: "Sim, veja a seção Cartões Presente para enviar um link com mensagem.", de: "Ja, sehen Sie im Geschenkkarten-Bereich für einen Link mit Nachricht.", tr: "Evet, mesajlı bir bağlantı göndermek için Hediye Kartları bölümüne bakın.", nl: "Ja, bekijk de Cadeaukaarten sectie om een link met bericht te sturen.", ar: "نعم، راجع قسم بطاقات الهدية لإرسال رابط مع رسالة." }, lang) },
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
                deez<span className="text-violet-500">link</span>
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
                  smoothScrollTo("#features", { offset: -40 });
                }} className="btn-secondary" data-testid="hero-cta-secondary">
                  {L({ fr: "En savoir plus", en: "Learn more", es: "Saber más", pt: "Saiba mais", de: "Mehr erfahren", tr: "Daha fazla bilgi", nl: "Meer weten", ar: "اعرف المزيد" }, lang)}
                </button>
              </div>

              {/* Mini stats row */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-white/50 text-[13px]">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-violet-400" />
                  {L({ fr: "Paiement crypto", en: "Crypto payment", es: "Pago cripto", pt: "Pagamento cripto", de: "Krypto-Zahlung", tr: "Kripto ödeme", nl: "Crypto-betaling", ar: "دفع كريبتو" }, lang)}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-violet-400" />
                  {L({ fr: "Livraison < 5 min", en: "Under 5min delivery", es: "Entrega < 5 min", pt: "Entrega < 5 min", de: "Lieferung < 5 Min.", tr: "5 dk içinde teslimat", nl: "Levering < 5 min", ar: "التوصيل خلال 5 دقائق" }, lang)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-violet-400" />
                  {L({ fr: "Support 24/7", en: "24/7 support", es: "Soporte 24/7", pt: "Suporte 24/7", de: "24/7 Support", tr: "7/24 destek", nl: "24/7 support", ar: "دعم 24/7" }, lang)}
                </div>
              </div>
            </motion.div>

            {/* RIGHT — album mosaic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative overflow-hidden rounded-[2rem]"
            >
              <div className="relative aspect-[4/5] sm:aspect-square w-full max-w-[520px] ml-auto">
                {/* Violet halo behind */}
                <div className="absolute -inset-10 bg-gradient-to-tr from-violet-700/35 via-violet-500/20 to-transparent blur-3xl rounded-full" />

                <div className="relative grid grid-cols-3 grid-rows-4 gap-2 sm:gap-3 h-full">
                  {/* Big featured card */}
                  <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden card-surface">
                    {albums[0] ? (
                      <img
                        src={albums[0].cover_big}
                        alt={albums[0].title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-black flex items-center justify-center">
                        <Music className="h-16 w-16 text-violet-400/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3">
                      <div className="pill !py-1 !px-2 !text-[10px]">
                        <span className="pill-dot pill-dot-violet" />
                        {L({ fr: "En tendance", en: "Trending", es: "Tendencia", pt: "Tendência", de: "Im Trend", tr: "Trend", nl: "Trending", ar: "رائج" }, lang)}
                      </div>
                    </div>
                  </div>

                  {/* Small artist tiles (5 — fills the bottom-right cell too) */}
                  {[1, 2, 3, 4, 5].map((idx) => {
                    const a = artists[idx - 1] || albums[idx];
                    const img = a?.picture_medium || a?.cover_medium || a?.picture || a?.cover;
                    return (
                      <div key={idx} className="relative rounded-2xl overflow-hidden card-surface aspect-square">
                        {img ? (
                          <img
                            src={img}
                            alt={a?.name || ""}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
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
                        {L({ fr: "Deezer Premium activé", en: "Deezer Premium activated", es: "Deezer Premium activado", pt: "Deezer Premium ativado", de: "Deezer Premium aktiviert", tr: "Deezer Premium aktif", nl: "Deezer Premium geactiveerd", ar: "تم تفعيل Deezer Premium" }, lang)}
                      </div>
                      <div className="text-white/50 text-xs truncate">
                        {L({ fr: "Tous les avantages débloqués", en: "All perks unlocked", es: "Todas las ventajas desbloqueadas", pt: "Todas as vantagens desbloqueadas", de: "Alle Vorteile freigeschaltet", tr: "Tüm avantajlar açık", nl: "Alle voordelen ontgrendeld", ar: "جميع المزايا مفعّلة" }, lang)}
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
          <Reveal className="rounded-[1.5rem] border border-white/[0.06] bg-[rgba(10,10,14,0.6)] backdrop-blur-xl grid grid-cols-3 divide-x divide-white/[0.05] overflow-hidden">
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
          </Reveal>
        </div>
      </section>

      {/* ═════════ FEATURES ═════════ */}
      <section id="features" className="relative px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12 sm:mb-16 max-w-2xl">
            <div className="pill mb-4"><span className="pill-dot pill-dot-violet" />{T.featuresLabel}</div>
            <h2 className="display-lg text-white mb-3">{T.featuresTitle}</h2>
            <p className="text-white/55 text-[16px]">{T.featuresSub}</p>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" stagger={0.08}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <StaggerItem key={i} className="card-surface p-6 group hover:border-violet-500/30 transition-all" y={24}>
                  <div data-testid={`feature-${i}`}>
                    <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-violet-500/25 transition-all">
                      <Icon className="h-5 w-5 text-violet-300" />
                    </div>
                    <h3 className="text-white text-[17px] font-semibold mb-2 tracking-tight">{f.title}</h3>
                    <p className="text-white/55 text-[14px] leading-relaxed">{f.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* ═════════ PRICING ═════════ */}
      <section id="pricing" className="relative px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12 sm:mb-16 max-w-2xl mx-auto text-center">
            <div className="pill mb-4 mx-auto"><span className="pill-dot pill-dot-violet" />{T.pricingLabel}</div>
            <h2 className="display-lg text-white mb-3">{T.pricingTitle}</h2>
            <p className="text-white/55 text-[16px]">{T.pricingSub}</p>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 pt-6" stagger={0.1}>
            {packs.map((pack) => (
              <StaggerItem
                key={pack.id}
                className={`relative p-7 rounded-[1.5rem] transition-all duration-200 ${
                  pack.highlight
                    ? "bg-gradient-to-b from-violet-900/40 to-[#0a0a0e] border border-violet-500/40 hover:border-violet-400/70 hover:-translate-y-[3px]"
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
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Reveal className="text-center mt-10" delay={0.15}>
            <Link to="/offers" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-[14px] font-medium transition-colors">
              {L({ fr: "Voir toutes les offres & quantités personnalisées", en: "See all offers & custom quantities", es: "Ver todas las ofertas y cantidades", pt: "Ver todas as ofertas e quantidades", de: "Alle Angebote & benutzerdefinierte Mengen", tr: "Tüm teklifleri ve özel miktarları görün", nl: "Alle aanbiedingen & aangepaste hoeveelheden", ar: "شاهد جميع العروض والكميات المخصصة" }, lang)}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═════════ FAQ ═════════ */}
      <section className="relative px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Reveal className="mb-10 sm:mb-12 text-center">
            <div className="pill mb-4 mx-auto"><span className="pill-dot pill-dot-violet" />{T.faqLabel}</div>
            <h2 className="display-lg text-white mb-3">{T.faqTitle}</h2>
          </Reveal>

          <StaggerGroup className="space-y-3" stagger={0.05}>
            {faqs.map((f, i) => {
              const open = openFAQ === i;
              return (
                <StaggerItem
                  key={i}
                  className={`rounded-2xl border transition-all ${
                    open
                      ? "bg-[#0f0f14] border-violet-500/30"
                      : "bg-[#0a0a0e] border-white/[0.07] hover:border-white/[0.12]"
                  }`}
                  y={18}
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
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* ═════════ CTA — Ready to listen (below FAQ) ═════════ */}
      <section className="relative px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-[2rem] border border-violet-500/20 p-8 sm:p-14"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(10,10,14,0.9) 60%)",
              }}
            >
              <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl bg-violet-600/20 pointer-events-none" />
              <div className="relative z-10 text-center">
                <h2 className="display-md text-white mb-3" data-testid="home-cta-title">
                  {L({ fr: "Prêt à écouter sans limites ?", en: "Ready to listen without limits?", es: "¿Listo para escuchar sin límites?", pt: "Pronto para ouvir sem limites?", de: "Bereit, ohne Grenzen zu hören?", tr: "Sınırsız dinlemeye hazır mısın?", nl: "Klaar om onbeperkt te luisteren?", ar: "مستعد للاستماع بلا حدود؟" }, lang)}
                </h2>
                <p className="text-white/60 text-[15px] max-w-xl mx-auto mb-6">
                  {L({ fr: "Rejoignez des milliers d'utilisateurs. Paiement crypto anonyme, livraison instantanée.", en: "Join thousands of users. Anonymous crypto payment, instant delivery.", es: "Únete a miles de usuarios. Pago cripto anónimo, entrega instantánea.", pt: "Junte-se a milhares de usuários. Pagamento cripto anônimo, entrega instantânea.", de: "Schließen Sie sich Tausenden von Nutzern an. Anonyme Krypto-Zahlung, sofortige Lieferung.", tr: "Binlerce kullanıcıya katılın. Anonim kripto ödeme, anında teslimat.", nl: "Sluit u aan bij duizenden gebruikers. Anonieme crypto-betaling, directe levering.", ar: "انضم إلى آلاف المستخدمين. دفع كريبتو مجهول، توصيل فوري." }, lang)}
                </p>
                <Link to="/offers" className="btn-primary" data-testid="home-cta-btn">
                  {L({ fr: "Voir les offres", en: "Get Started Now", es: "Empezar ahora", pt: "Começar agora", de: "Jetzt starten", tr: "Hemen başla", nl: "Begin nu", ar: "ابدأ الآن" }, lang)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
