import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { secureGet } from "@/utils/secureApi";
import { useAbTest } from "@/hooks/useAbTest";
import { Headphones, Music, Zap, Star, Crown, Check, ArrowRight, Infinity, Shield, Package, X, Sparkles, TrendingDown } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";

const DEEZER_FEATURES = {
  fr: ["Écoute hors ligne illimitée", "Qualité audio HiFi (FLAC)", "Zéro publicité", "Skip illimité", "Mode Flow personnalisé", "120M+ de titres"],
  en: ["Unlimited offline listening", "HiFi audio quality (FLAC)", "Zero ads", "Unlimited skips", "Personalized Flow mode", "120M+ tracks"],
  es: ["Escucha sin conexión ilimitada", "Calidad HiFi (FLAC)", "Cero anuncios", "Saltos ilimitados", "Modo Flow personalizado", "120M+ canciones"],
  pt: ["Escuta offline ilimitada", "Qualidade HiFi (FLAC)", "Zero anúncios", "Pulos ilimitados", "Modo Flow personalizado", "120M+ faixas"],
  de: ["Unbegrenztes Offline-Hören", "HiFi-Qualität (FLAC)", "Keine Werbung", "Unbegrenzte Skips", "Personalisierter Flow-Modus", "120M+ Titel"],
  tr: ["Sınırsız çevrimdışı dinleme", "HiFi ses kalitesi (FLAC)", "Sıfır reklam", "Sınırsız atlama", "Kişiselleştirilmiş Flow modu", "120M+ parça"],
  nl: ["Onbeperkt offline luisteren", "HiFi audio (FLAC)", "Geen advertenties", "Onbeperkt skippen", "Gepersonaliseerde Flow-modus", "120M+ tracks"],
  ar: ["استماع بدون اتصال غير محدود", "جودة HiFi (FLAC)", "بدون إعلانات", "تخطي غير محدود", "وضع Flow مخصص", "+120 مليون أغنية"],
};

export default function Offers() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const lang = i18n.language || "fr";
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customQuantity, setCustomQuantity] = useState(10);
  const [availableStock, setAvailableStock] = useState(0);
  const [loadingStock, setLoadingStock] = useState(true);

  // A/B test: pack_10 badge wording
  const { variant: abVariant, sessionId: abSession, trackClick: abTrackClick } = useAbTest("best_value_label");
  const bestValueLabel = abVariant === "a"
    ? L({ fr: "Meilleur prix", en: "Best value", es: "Mejor precio", pt: "Melhor preço", de: "Bester Wert", tr: "En iyi değer", nl: "Beste prijs", ar: "أفضل قيمة" }, lang)
    : L({ fr: "Le plus choisi", en: "Most chosen", es: "Más elegido", pt: "Mais escolhido", de: "Am häufigsten gewählt", tr: "En çok tercih edilen", nl: "Meest gekozen", ar: "الأكثر اختيارًا" }, lang);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setLoadingStock(true);
      const response = await secureGet("/admin/stats");
      if (response?.stock_available !== undefined) {
        setAvailableStock(response.stock_available);
      }
    } catch (err) {
      console.error("Error fetching stock:", err);
      setAvailableStock(500); // Fallback
    } finally {
      setLoadingStock(false);
    }
  };

  const getUnitPrice = (qty) => {
    if (qty >= 100) return 3.0;
    if (qty >= 50) return 3.5;
    if (qty >= 20) return 4.0;
    if (qty >= 10) return 4.5;
    return 5.0;
  };

  const handleCustomCheckout = () => {
    if (customQuantity < 1 || customQuantity > availableStock) return;
    setShowCustomModal(false);
    navigate(`/checkout/custom_${customQuantity}`);
  };

  const features = DEEZER_FEATURES[lang] || DEEZER_FEATURES.en;

  const packs = [
    {
      id: "single",
      name: "Starter",
      quantity: 1,
      price: 5,
      icon: Music,
      color: "from-violet-400 to-violet-700",
      shadow: "shadow-violet-500/20",
      badge: null,
      desc: L({ fr: "Idéal pour essayer", en: "Great to try", es: "Ideal para probar", pt: "Ideal para experimentar", de: "Ideal zum Ausprobieren", tr: "Denemek için ideal", nl: "Ideaal om te proberen", ar: "مثالي للتجربة" }, lang),
    },
    {
      id: "pack_3",
      name: L({ fr: "Essentiel", en: "Essential", es: "Essential", pt: "Essential", de: "Essential", tr: "Essential", nl: "Essential", ar: "Essential" }, lang),
      quantity: 3,
      price: 12,
      icon: Headphones,
      color: "from-violet-500 to-violet-800",
      shadow: "shadow-violet-500/25",
      badge: null,
      desc: L({ fr: "Le plus équilibré", en: "Best balanced", es: "Más equilibrado", pt: "Mais equilibrado", de: "Am ausgewogensten", tr: "En dengeli", nl: "Meest gebalanceerd", ar: "الأكثر توازنًا" }, lang),
    },
    {
      id: "pack_5",
      name: "Premium",
      quantity: 5,
      price: 20,
      icon: Star,
      color: "from-violet-400 via-violet-500 to-violet-700",
      shadow: "shadow-violet-500/30",
      badge: L({ fr: "Populaire", en: "Popular", es: "Popular", pt: "Popular", de: "Beliebt", tr: "Popüler", nl: "Populair", ar: "شائع" }, lang),
      desc: L({ fr: "Le choix préféré", en: "Most popular choice", es: "Elección favorita", pt: "Escolha favorita", de: "Beliebteste Wahl", tr: "En popüler seçim", nl: "Populairste keuze", ar: "الخيار المفضل" }, lang),
    },
    {
      id: "pack_10",
      name: "Business",
      quantity: 10,
      price: 35,
      icon: Crown,
      color: "from-violet-500 via-violet-600 to-violet-900",
      shadow: "shadow-violet-500/35",
      badge: bestValueLabel,
      desc: L({ fr: "Pour les pros", en: "For pros", es: "Para profesionales", pt: "Para profissionais", de: "Für Profis", tr: "Profesyoneller için", nl: "Voor profs", ar: "للمحترفين" }, lang),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Hero Section — Deezer Branding */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Headphones className="h-4 w-4" />
            Deezer Premium
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-t-primary mb-4">
            {lang === "fr" ? (
              <>Liens d'activation <span className="text-gradient-violet">Deezer Premium</span></>
            ) : lang === "es" ? (
              <>Enlaces de activación <span className="text-gradient-violet">Deezer Premium</span></>
            ) : lang === "pt" ? (
              <>Links de ativação <span className="text-gradient-violet">Deezer Premium</span></>
            ) : lang === "de" ? (
              <><span className="text-gradient-violet">Deezer Premium</span> Aktivierungslinks</>
            ) : lang === "tr" ? (
              <><span className="text-gradient-violet">Deezer Premium</span> Aktivasyon Bağlantıları</>
            ) : lang === "nl" ? (
              <><span className="text-gradient-violet">Deezer Premium</span> Activeringslinks</>
            ) : lang === "ar" ? (
              <>روابط تفعيل <span className="text-gradient-violet">Deezer Premium</span></>
            ) : (
              <><span className="text-gradient-violet">Deezer Premium</span> Activation Links</>
            )}
          </h1>
          <p className="text-t-secondary text-base sm:text-lg max-w-xl mx-auto">
            {L({ fr: "Activez Deezer Premium sur n'importe quel compte. Livraison instantanée par email.", en: "Activate Deezer Premium on any account. Instant email delivery.", es: "Activa Deezer Premium en cualquier cuenta. Entrega instantánea por email.", pt: "Ative o Deezer Premium em qualquer conta. Entrega instantânea por email.", de: "Aktivieren Sie Deezer Premium auf jedem Konto. Sofortige E-Mail-Lieferung.", tr: "Deezer Premium'u herhangi bir hesapta etkinleştirin. Anında e-posta teslimi.", nl: "Activeer Deezer Premium op elk account. Directe e-maillevering.", ar: "فعّل Deezer Premium على أي حساب. توصيل فوري عبر البريد." }, lang)}
          </p>
        </motion.div>

        {/* Deezer Premium Features Bar */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass backdrop-blur-xl rounded-2xl border border-border p-5 sm:p-6 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(139,92,246,0.7)]">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-t-primary font-semibold text-base">
                {L({ fr: "Inclus dans chaque lien", en: "Included with every link", es: "Incluido en cada enlace", pt: "Incluído em cada link", de: "In jedem Link enthalten", tr: "Her bağlantıda dahildir", nl: "Inbegrepen bij elke link", ar: "متضمن في كل رابط" }, lang)}
              </h3>
              <p className="text-t-muted text-xs">{L({ fr: "Toutes les fonctionnalités Deezer Premium", en: "All Deezer Premium features", es: "Todas las funciones Deezer Premium", pt: "Todos os recursos Deezer Premium", de: "Alle Deezer Premium Funktionen", tr: "Tüm Deezer Premium özellikleri", nl: "Alle Deezer Premium-functies", ar: "جميع ميزات Deezer Premium" }, lang)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-t-secondary">
                <Check className="h-3.5 w-3.5 text-green shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Packs Grid */}
        <div className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-6">
            {packs.map((pack, i) => {
            const Icon = pack.icon;
            const unitPrice = (pack.price / pack.quantity).toFixed(2);
            return (
              <div
                key={pack.id}
                className="group relative flex flex-col h-full transition-transform duration-200 hover:-translate-y-[3px]"
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1 px-3 py-[5px] rounded-full text-[11px] font-semibold text-white bg-violet-500 whitespace-nowrap">
                      {pack.badge}
                    </span>
                  </div>
                )}
                <div className={`relative bg-gradient-to-b from-[#16161d] to-[#0a0a0e] border ${pack.badge ? 'border-violet-500/40' : 'border-white/[0.06]'} rounded-2xl flex flex-col h-full transition-colors duration-200 group-hover:border-violet-400/60`}>
                  {/* Content */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(139,92,246,0.7)]">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-[15px]">{pack.name}</h3>
                        <p className="text-white/45 text-[11px]">{pack.desc}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-display font-bold text-white tracking-tight">
                          {pack.price}€
                        </span>
                      </div>
                      <p className="text-white/45 text-[12px] mt-1">
                        {unitPrice}€ / {L({ fr: "lien", en: "link", es: "enlace", pt: "link", de: "Link", tr: "bağlantı", nl: "link", ar: "رابط" }, lang)} · {pack.quantity}x Deezer Premium
                      </p>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-5 flex-1">
                      {[
                        { icon: Headphones, text: `${pack.quantity}x Deezer Premium` },
                        { icon: Zap, text: L({ fr: "Livraison instantanée", en: "Instant delivery", es: "Entrega instantánea", pt: "Entrega instantânea", de: "Sofortige Lieferung", tr: "Anında teslimat", nl: "Directe levering", ar: "توصيل فوري" }, lang) },
                        { icon: Shield, text: L({ fr: "Paiement crypto sécurisé", en: "Secure crypto payment", es: "Pago cripto seguro", pt: "Pagamento cripto seguro", de: "Sichere Krypto-Zahlung", tr: "Güvenli kripto ödeme", nl: "Veilige crypto-betaling", ar: "دفع كريبتو آمن" }, lang) },
                      ].map((d, j) => (
                        <div key={j} className="flex items-center gap-2 text-[13px] text-white/65">
                          <d.icon className="h-3.5 w-3.5 text-violet-400/80 shrink-0" />
                          <span>{d.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div className="space-y-2 mt-auto">
                      <button
                        onClick={() => {
                          abTrackClick({ pack_id: pack.id });
                          navigate(`/checkout/${pack.id}`);
                        }}
                        className={pack.badge ? "btn-primary w-full !py-3" : "btn-secondary w-full !py-3"}
                        data-testid={`buy-${pack.id}`}
                      >
                        {L({ fr: "Acheter", en: "Buy now", es: "Comprar ahora", pt: "Comprar agora", de: "Jetzt kaufen", tr: "Şimdi al", nl: "Nu kopen", ar: "اشتر الآن" }, lang)}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => addToCart({ id: pack.id, name: pack.name, price: pack.price, quantity: pack.quantity, linkCount: pack.quantity })}
                        className="w-full py-2.5 rounded-full text-[12px] font-medium text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                      >
                        {L({ fr: "Ajouter au panier", en: "Add to cart", es: "Añadir al carrito", pt: "Adicionar ao carrinho", de: "In den Warenkorb", tr: "Sepete ekle", nl: "In winkelwagen", ar: "أضف إلى السلة" }, lang)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Custom Quantity Section */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass backdrop-blur-xl rounded-2xl border border-border p-6 sm:p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Infinity className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-t-primary font-bold text-xl mb-2">
            {L({ fr: "Besoin de plus ?", en: "Need more?", es: "¿Necesitas más?", pt: "Precisa mais?", de: "Mehr nötig?", tr: "Daha fazlası gerek mi?", nl: "Meer nodig?", ar: "تحتاج المزيد؟" }, lang)}
          </h3>
          <p className="text-t-secondary text-sm mb-5 max-w-md mx-auto">
            {L({ fr: "Commandez la quantité exacte dont vous avez besoin. Plus vous commandez, moins c'est cher.", en: "Order the exact amount you need. Volume discounts available.", es: "Pide la cantidad exacta que necesitas. Descuentos por volumen disponibles.", pt: "Peça a quantidade exata que precisa. Descontos por volume disponíveis.", de: "Bestellen Sie die genaue Menge, die Sie brauchen. Mengenrabatte verfügbar.", tr: "İhtiyacınız olan tam miktarı sipariş edin. Hacim indirimleri mevcut.", nl: "Bestel precies de hoeveelheid die u nodig heeft. Volumekortingen beschikbaar.", ar: "اطلب الكمية التي تحتاجها بالضبط. خصومات الحجم متاحة." }, lang)}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCustomModal(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.2] rounded-xl text-t-primary text-sm font-medium transition-all"
          >
            <Package className="h-4 w-4 text-accent" />
            {L({ fr: "Quantité personnalisée", en: "Custom quantity", es: "Cantidad personalizada", pt: "Quantidade personalizada", de: "Eigene Menge", tr: "Özel miktar", nl: "Aangepaste hoeveelheid", ar: "كمية مخصصة" }, lang)}
          </motion.button>
        </motion.div>

        {/* Custom Quantity Modal */}
        <AnimatePresence>
          {showCustomModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCustomModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="glass backdrop-blur-xl rounded-3xl border border-border p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-t-primary flex items-center gap-2">
                    <Package className="h-6 w-6 text-accent" />
                    {L({ fr: "Quantité personnalisée", en: "Custom quantity", es: "Cantidad personalizada", pt: "Quantidade personalizada", de: "Eigene Menge", tr: "Özel miktar", nl: "Aangepaste hoeveelheid", ar: "كمية مخصصة" }, lang)}
                  </h2>
                  <button
                    onClick={() => setShowCustomModal(false)}
                    className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="h-5 w-5 text-t-secondary" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Quantity selection */}
                  <div>
                    <h3 className="text-t-secondary text-sm font-medium mb-4">
                      {L({ fr: "Choisissez la quantité", en: "Choose quantity", es: "Elige la cantidad", pt: "Escolha a quantidade", de: "Menge wählen", tr: "Miktarı seçin", nl: "Kies hoeveelheid", ar: "اختر الكمية" }, lang)}
                    </h3>

                    {/* Preset buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[10, 25, 50, 100, 200].map((val) => (
                        <motion.button
                          key={val}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCustomQuantity(Math.min(val, availableStock))}
                          disabled={val > availableStock}
                          className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                            customQuantity === val
                              ? "bg-violet-500/15 border-2 border-violet-400/50 text-white"
                              : "bg-white/[0.04] border border-white/[0.08] text-t-secondary hover:text-t-primary hover:border-white/[0.15] disabled:opacity-30"
                          }`}
                        >
                          {val}
                        </motion.button>
                      ))}
                    </div>

                    {/* Input */}
                    <input
                      type="number"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value) || 1)))}
                      min="1"
                      max={availableStock}
                      className="w-full bg-white/[0.04] border border-white/[0.08] text-t-primary rounded-xl px-4 py-3 mb-4"
                    />

                    {/* Slider */}
                    <input
                      type="range"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(parseInt(e.target.value))}
                      min="1"
                      max={availableStock}
                      className="w-full h-2 bg-zinc-800 rounded-full mb-2"
                    />
                    <p className="text-xs text-t-muted">
                      {L({ fr: "Stock disponible : ", en: "Available stock: ", es: "Stock disponible: ", pt: "Estoque disponível: ", de: "Verfügbarer Bestand: ", tr: "Mevcut stok: ", nl: "Beschikbare voorraad: ", ar: "المخزون المتاح: " }, lang)}
                      <span className="text-green font-semibold">{availableStock}</span>
                    </p>
                  </div>

                  {/* Right: Summary */}
                  <div>
                    <h3 className="text-t-secondary text-sm font-medium mb-4">
                      {L({ fr: "Résumé", en: "Summary", es: "Resumen", pt: "Resumo", de: "Zusammenfassung", tr: "Özet", nl: "Samenvatting", ar: "الملخص" }, lang)}
                    </h3>

                    <div className="bg-white/[0.03] rounded-2xl p-4 mb-4">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold text-violet-300">
                          {customQuantity}
                        </span>
                        <span className="text-t-muted">{L({ fr: "liens", en: "links", es: "enlaces", pt: "links", de: "Links", tr: "bağlantı", nl: "links", ar: "روابط" }, lang)}</span>
                      </div>
                      <p className="text-t-secondary text-sm mb-4">
                        Deezer Premium · {L({ fr: "1 mois minimum garanti", en: "1 month minimum guaranteed", es: "1 mes mínimo garantizado", pt: "1 mês mínimo garantido", de: "Mind. 1 Monat garantiert", tr: "Min. 1 ay garantili", nl: "Min. 1 maand gegarandeerd", ar: "شهر واحد مضمون كحد أدنى" }, lang)}
                      </p>

                      <div className="space-y-2 mb-4 pb-4 border-b border-white/[0.08]">
                        <div className="flex justify-between text-sm">
                          <span className="text-t-secondary">{L({ fr: "Prix unitaire", en: "Unit price", es: "Precio unitario", pt: "Preço unitário", de: "Stückpreis", tr: "Birim fiyat", nl: "Stuksprijs", ar: "سعر الوحدة" }, lang)}</span>
                          <span className="text-t-primary font-semibold">{getUnitPrice(customQuantity).toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-t-secondary">{L({ fr: "Quantité", en: "Quantity", es: "Cantidad", pt: "Quantidade", de: "Menge", tr: "Miktar", nl: "Hoeveelheid", ar: "الكمية" }, lang)}</span>
                          <span className="text-t-primary font-semibold">×{customQuantity}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <span className="text-t-secondary text-sm">{L({ fr: "Total", en: "Total", es: "Total", pt: "Total", de: "Gesamt", tr: "Toplam", nl: "Totaal", ar: "المجموع" }, lang)}</span>
                        <div className="text-3xl font-bold text-violet-300">
                          {(customQuantity * getUnitPrice(customQuantity)).toFixed(2)}€
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleCustomCheckout}
                      disabled={loadingStock || customQuantity < 1 || customQuantity > availableStock}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-primary w-full !py-3"
                    >
                      {L({ fr: "Commander", en: "Order now", es: "Pedir ahora", pt: "Pedir agora", de: "Jetzt bestellen", tr: "Şimdi sipariş ver", nl: "Nu bestellen", ar: "اطلب الآن" }, lang)}
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Price tiers */}
                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <h3 className="text-t-secondary text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-green" />
                    {L({ fr: "Tarifs dégressifs", en: "Volume discounts", es: "Descuentos por volumen", pt: "Descontos por volume", de: "Mengenrabatte", tr: "Hacim indirimleri", nl: "Volumekortingen", ar: "خصومات الحجم" }, lang)}
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { min: 1, max: 9, price: 5.0 },
                      { min: 10, max: 19, price: 4.5 },
                      { min: 20, max: 49, price: 4.0 },
                      { min: 50, max: 99, price: 3.5 },
                      { min: 100, max: 1000, price: 3.0 },
                    ].map((tier, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg text-center ${
                          customQuantity >= tier.min && customQuantity <= tier.max
                            ? "bg-purple-500/10 border border-purple-500/30"
                            : "bg-white/[0.03] border border-white/[0.06]"
                        }`}
                      >
                        <div className="text-t-muted text-[10px]">{tier.min}-{tier.max === 1000 ? "+" : tier.max}</div>
                        <div className="text-t-primary font-bold text-sm">{tier.price}€</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
