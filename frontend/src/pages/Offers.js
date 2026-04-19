import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { secureGet } from "@/utils/secureApi";
import { useAbTest } from "@/hooks/useAbTest";
import { Headphones, Music, Zap, Star, Crown, Check, ArrowRight, Infinity, Shield, Package, X, Sparkles, TrendingDown } from "lucide-react";

const DEEZER_FEATURES = {
  fr: [
    "Écoute hors ligne illimitée",
    "Qualité audio HiFi (FLAC)",
    "Zéro publicité",
    "Skip illimité",
    "Mode Flow personnalisé",
    "120M+ de titres",
  ],
  en: [
    "Unlimited offline listening",
    "HiFi audio quality (FLAC)",
    "Zero ads",
    "Unlimited skips",
    "Personalized Flow mode",
    "120M+ tracks",
  ]
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
    ? (lang === "fr" ? "Meilleur prix" : "Best value")
    : (lang === "fr" ? "Le plus choisi" : "Most chosen");

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
      name: lang === "fr" ? "Starter" : "Starter",
      quantity: 1,
      price: 5,
      icon: Music,
      color: "from-violet-400 to-violet-700",
      shadow: "shadow-violet-500/20",
      badge: null,
      desc: lang === "fr" ? "Idéal pour essayer" : "Great to try",
    },
    {
      id: "pack_3",
      name: lang === "fr" ? "Essentiel" : "Essential",
      quantity: 3,
      price: 12,
      icon: Headphones,
      color: "from-violet-500 to-violet-800",
      shadow: "shadow-violet-500/25",
      badge: null,
      desc: lang === "fr" ? "Le plus équilibré" : "Best balanced",
    },
    {
      id: "pack_5",
      name: lang === "fr" ? "Premium" : "Premium",
      quantity: 5,
      price: 20,
      icon: Star,
      color: "from-violet-400 via-violet-500 to-violet-700",
      shadow: "shadow-violet-500/30",
      badge: lang === "fr" ? "Populaire" : "Popular",
      desc: lang === "fr" ? "Le choix préféré" : "Most popular choice",
    },
    {
      id: "pack_10",
      name: lang === "fr" ? "Business" : "Business",
      quantity: 10,
      price: 35,
      icon: Crown,
      color: "from-violet-500 via-violet-600 to-violet-900",
      shadow: "shadow-violet-500/35",
      badge: bestValueLabel,
      desc: lang === "fr" ? "Pour les pros" : "For pros",
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
            ) : (
              <><span className="text-gradient-violet">Deezer Premium</span> Activation Links</>
            )}
          </h1>
          <p className="text-t-secondary text-base sm:text-lg max-w-xl mx-auto">
            {lang === "fr"
              ? "Activez Deezer Premium sur n'importe quel compte. Livraison instantanée par email."
              : "Activate Deezer Premium on any account. Instant email delivery."}
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
                {lang === "fr" ? "Inclus dans chaque lien" : "Included with every link"}
              </h3>
              <p className="text-t-muted text-xs">{lang === "fr" ? "Toutes les fonctionnalités Deezer Premium" : "All Deezer Premium features"}</p>
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
                className="group relative flex flex-col h-full"
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1 px-3 py-[5px] rounded-full text-[11px] font-semibold text-white bg-violet-500 whitespace-nowrap">
                      {pack.badge}
                    </span>
                  </div>
                )}
                <div className={`relative bg-gradient-to-b from-[#16161d] to-[#0a0a0e] border ${pack.badge ? 'border-violet-500/40' : 'border-white/[0.06]'} rounded-2xl flex flex-col h-full transition-all duration-200 hover:border-violet-400/60 hover:-translate-y-[3px]`}>
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
                        {unitPrice}€ / {lang === "fr" ? "lien" : "link"} · {pack.quantity}x Deezer Premium
                      </p>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-5 flex-1">
                      {[
                        { icon: Headphones, text: `${pack.quantity}x Deezer Premium` },
                        { icon: Zap, text: lang === "fr" ? "Livraison instantanée" : "Instant delivery" },
                        { icon: Shield, text: lang === "fr" ? "Paiement crypto sécurisé" : "Secure crypto payment" },
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
                        {lang === "fr" ? "Acheter" : "Buy now"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => addToCart({ id: pack.id, name: pack.name, price: pack.price, quantity: pack.quantity })}
                        className="w-full py-2.5 rounded-full text-[12px] font-medium text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                      >
                        {lang === "fr" ? "Ajouter au panier" : "Add to cart"}
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
            {lang === "fr" ? "Besoin de plus ?" : "Need more?"}
          </h3>
          <p className="text-t-secondary text-sm mb-5 max-w-md mx-auto">
            {lang === "fr"
              ? "Commandez la quantité exacte dont vous avez besoin. Plus vous commandez, moins c'est cher."
              : "Order the exact amount you need. Volume discounts available."}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCustomModal(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.2] rounded-xl text-t-primary text-sm font-medium transition-all"
          >
            <Package className="h-4 w-4 text-accent" />
            {lang === "fr" ? "Quantité personnalisée" : "Custom quantity"}
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
                    {lang === "fr" ? "Quantité personnalisée" : "Custom quantity"}
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
                      {lang === "fr" ? "Choisissez la quantité" : "Choose quantity"}
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
                      {lang === "fr" ? "Stock disponible : " : "Available stock: "}
                      <span className="text-green font-semibold">{availableStock}</span>
                    </p>
                  </div>

                  {/* Right: Summary */}
                  <div>
                    <h3 className="text-t-secondary text-sm font-medium mb-4">
                      {lang === "fr" ? "Résumé" : "Summary"}
                    </h3>

                    <div className="bg-white/[0.03] rounded-2xl p-4 mb-4">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold text-violet-300">
                          {customQuantity}
                        </span>
                        <span className="text-t-muted">{lang === "fr" ? "liens" : "links"}</span>
                      </div>
                      <p className="text-t-secondary text-sm mb-4">
                        Deezer Premium · {lang === "fr" ? "1 mois minimum garanti" : "1 month minimum guaranteed"}
                      </p>

                      <div className="space-y-2 mb-4 pb-4 border-b border-white/[0.08]">
                        <div className="flex justify-between text-sm">
                          <span className="text-t-secondary">{lang === "fr" ? "Prix unitaire" : "Unit price"}</span>
                          <span className="text-t-primary font-semibold">{getUnitPrice(customQuantity).toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-t-secondary">{lang === "fr" ? "Quantité" : "Quantity"}</span>
                          <span className="text-t-primary font-semibold">×{customQuantity}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <span className="text-t-secondary text-sm">{lang === "fr" ? "Total" : "Total"}</span>
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
                      {lang === "fr" ? "Commander" : "Order now"}
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Price tiers */}
                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <h3 className="text-t-secondary text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-green" />
                    {lang === "fr" ? "Tarifs dégressifs" : "Volume discounts"}
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
