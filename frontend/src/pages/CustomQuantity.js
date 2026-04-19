import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { secureGet } from "@/utils/secureApi";
import { Package, Check, AlertCircle, Sparkles, ArrowRight, Zap, TrendingDown, Shield, Headphones } from "lucide-react";

export default function CustomQuantity() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";
  const [quantity, setQuantity] = useState(10);
  const [availableStock, setAvailableStock] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prix unitaire avec dégressif
  const getUnitPrice = (qty) => {
    if (qty >= 100) return 3.0;
    if (qty >= 50) return 3.5;
    if (qty >= 20) return 4.0;
    if (qty >= 10) return 4.5;
    return 5.0;
  };

  const unitPrice = getUnitPrice(quantity);
  const totalPrice = (quantity * unitPrice).toFixed(2);
  const maxQuantity = Math.min(1000, availableStock);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await secureGet("/admin/stats");
      if (response?.stock_available !== undefined) {
        setAvailableStock(response.stock_available);
      }
    } catch (err) {
      console.error("Error fetching stock:", err);
      setAvailableStock(1000); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (quantity < 1 || quantity > maxQuantity) {
      setError(lang === "fr" 
        ? `Quantité invalide (min: 1, max: ${maxQuantity})`
        : `Invalid quantity (min: 1, max: ${maxQuantity})`
      );
      return;
    }
    navigate(`/checkout/custom_${quantity}`);
  };

  const presetQuantities = [10, 25, 50, 100, 200];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Package className="h-4 w-4" />
            {lang === "fr" ? "Commande Personnalisée" : "Custom Order"}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-t-primary mb-4">
            {lang === "fr" ? "Quantité personnalisée" : "Custom quantity"}
          </h1>
          <p className="text-base sm:text-lg text-t-secondary max-w-2xl mx-auto leading-relaxed">
            {lang === "fr"
              ? "Commandez exactement le nombre de liens dont vous avez besoin. Plus vous commandez, plus le prix unitaire diminue."
              : "Order exactly the number of links you need. The more you order, the lower the unit price."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left: Quantity Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass backdrop-blur-xl rounded-2xl border border-border p-6 sm:p-8"
          >
            <h3 className="text-t-primary font-semibold text-lg mb-5 flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              {lang === "fr" ? "Choisissez la quantité" : "Choose quantity"}
            </h3>

            {/* Preset buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {presetQuantities.map((val) => (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setQuantity(val)}
                  disabled={val > maxQuantity}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    quantity === val
                      ? "bg-violet-500/15 border-2 border-violet-400/50 text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.5)]"
                      : "bg-white/[0.04] border border-white/[0.08] text-t-secondary hover:text-t-primary hover:border-white/[0.15] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  {val}
                </motion.button>
              ))}
            </div>

            {/* Custom input */}
            <div className="mb-4">
              <label className="text-t-secondary text-sm font-medium mb-2 block">
                {lang === "fr" ? "Ou entrez un nombre" : "Or enter a number"}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                min="1"
                max={maxQuantity}
                className="w-full bg-white/[0.04] border border-white/[0.08] text-t-primary rounded-xl px-4 py-3.5 text-base placeholder:text-t-muted focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
              />
            </div>

            {/* Range slider */}
            <div className="mb-4">
              <input
                type="range"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                min="1"
                max={maxQuantity}
                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-t-muted mt-2">
                <span>1</span>
                <span>{Math.floor(maxQuantity / 2)}</span>
                <span>{maxQuantity}</span>
              </div>
            </div>

            <p className="text-t-muted text-xs bg-white/[0.03] rounded-lg px-3 py-2">
              {lang === "fr" ? "Stock disponible : " : "Available stock: "}
              <span className="text-green font-semibold">{availableStock}</span> liens
              {availableStock < 1000 && " · "}
              {availableStock < 1000 && (lang === "fr" ? "Max limité au stock" : "Max limited by stock")}
            </p>
          </motion.div>

          {/* Right: Price Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass backdrop-blur-xl rounded-2xl border border-border p-6 sm:p-8"
          >
            <h3 className="text-t-primary font-semibold text-lg mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              {lang === "fr" ? "Résumé" : "Summary"}
            </h3>

            {/* Quantity display */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-bold text-violet-300">
                  {quantity}
                </span>
                <span className="text-t-muted text-lg">
                  {lang === "fr" ? "liens" : "links"}
                </span>
              </div>
              <p className="text-t-secondary text-sm">Deezer Premium · {lang === "fr" ? "1 mois minimum garanti" : "1 month minimum guaranteed"}</p>
            </div>

            {/* Pricing */}
            <div className="space-y-3 mb-6 pb-6 border-b border-white/[0.08]">
              <div className="flex justify-between text-sm">
                <span className="text-t-secondary">{lang === "fr" ? "Prix unitaire" : "Unit price"}</span>
                <span className="text-t-primary font-semibold">{unitPrice.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-t-secondary">{lang === "fr" ? "Quantité" : "Quantity"}</span>
                <span className="text-t-primary font-semibold">×{quantity}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline mb-6">
              <span className="text-t-secondary text-sm">{lang === "fr" ? "Total" : "Total"}</span>
              <div className="text-right">
                <div className="text-4xl font-bold text-violet-300">
                  {totalPrice}€
                </div>
                <p className="text-t-muted text-xs mt-1">
                  {lang === "fr" ? "Économie : " : "Savings: "}
                  <span className="text-green font-semibold">
                    {((4.0 - unitPrice) * quantity).toFixed(2)}€
                  </span>
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-6">
              {[
                { icon: Headphones, text: lang === "fr" ? "Deezer Premium complet" : "Full Deezer Premium" },
                { icon: Zap, text: lang === "fr" ? "Livraison instantanée" : "Instant delivery" },
                { icon: Shield, text: lang === "fr" ? "Paiement crypto sécurisé" : "Secure crypto payment" },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-t-secondary">
                  <feat.icon className="h-4 w-4 text-green shrink-0" />
                  <span>{feat.text}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Checkout button */}
            <motion.button
              onClick={handleCheckout}
              disabled={loading || quantity < 1 || quantity > maxQuantity}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full !py-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {lang === "fr" ? "Chargement..." : "Loading..."}
                </>
              ) : (
                <>
                  {lang === "fr" ? "Commander" : "Order now"}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Price tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass backdrop-blur-xl rounded-2xl border border-border p-6 sm:p-8"
        >
          <h3 className="text-t-primary font-semibold text-lg mb-5 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green" />
            {lang === "fr" ? "Tarifs dégressifs" : "Volume discounts"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { min: 1, max: 9, price: 5.0 },
              { min: 10, max: 19, price: 4.5 },
              { min: 20, max: 49, price: 4.0 },
              { min: 50, max: 99, price: 3.5 },
              { min: 100, max: 1000, price: 3.0 },
            ].map((tier, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  quantity >= tier.min && quantity <= tier.max
                    ? "bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20"
                    : "bg-white/[0.03] border-white/[0.06]"
                }`}
              >
                <div className="text-t-muted text-xs mb-1">
                  {tier.min}-{tier.max === 1000 ? "1000+" : tier.max}
                </div>
                <div className="text-t-primary font-bold text-lg">{tier.price}€</div>
                <div className="text-t-muted text-[10px]">{lang === "fr" ? "par lien" : "per link"}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
