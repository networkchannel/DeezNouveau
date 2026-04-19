import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { securePost } from "@/utils/secureApi";
import { Gift, Check, AlertCircle, Sparkles, Copy, ArrowRight, Headphones, Music, Zap } from "lucide-react";

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function GiftCards() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "fr";
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1 = amount, 2 = details

  const handleValidate = async () => {
    if (!purchaserEmail || !purchaserEmail.includes("@")) {
      setError(lang === "fr" ? "Email requis" : "Email required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await securePost("/gift-cards/purchase", {
        amount,
        purchaser_email: purchaserEmail,
        recipient_email: recipientEmail || null,
        recipient_name: recipientName || null,
        message: message || null,
      });
      if (response.success) {
        setGeneratedCode(response.gift_card.code);
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || (lang === "fr" ? "Erreur" : "Error"));
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setSuccess(false);
    setGeneratedCode("");
    setAmount(50);
    setCustomAmount("");
    setRecipientName("");
    setMessage("");
    setRecipientEmail("");
    setPurchaserEmail("");
    setStep(1);
  };

  /* ── Success state ── */
  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="h-10 w-10 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold text-t-primary mb-2">
              {lang === "fr" ? "Carte cadeau créée !" : "Gift card created!"}
            </h2>
            <p className="text-t-muted text-sm">{amount}EUR · Deezer Premium</p>
          </div>

          <div className="glass backdrop-blur-xl rounded-2xl border border-border p-6 mb-6">
            <p className="text-t-muted text-xs font-mono uppercase tracking-wider mb-4">
              {lang === "fr" ? "Code de la carte cadeau" : "Gift card code"}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <p className="flex-1 text-3xl font-mono font-bold text-violet-300 tracking-wide break-all">
                {generatedCode}
              </p>
              <motion.button
                onClick={copyCode}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30"
                    : "bg-white/[0.05] text-t-muted hover:text-t-primary hover:bg-white/[0.08]"
                }`}
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </motion.button>
            </div>
            <p className="text-amber-400/70 text-xs flex items-center gap-2 bg-amber-500/10 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4" />
              {lang === "fr" ? "Sauvegardez ce code en lieu sûr" : "Save this code in a safe place"}
            </p>
          </div>

          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 text-sm font-medium text-t-secondary hover:text-t-primary transition-colors flex items-center justify-center gap-2 glass backdrop-blur-xl rounded-xl border border-border hover:border-white/20"
          >
            <Gift className="h-4 w-4" />
            {lang === "fr" ? "Créer une autre carte" : "Create another card"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Gift className="h-4 w-4" />
            {lang === "fr" ? "Carte Cadeau" : "Gift Card"}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-t-primary mb-4">
            {lang === "fr" ? "Offrez Deezer Premium" : "Gift Deezer Premium"}
          </h1>
          <p className="text-base sm:text-lg text-t-secondary max-w-xl mx-auto leading-relaxed">
            {lang === "fr"
              ? "Créez une carte cadeau personnalisée pour offrir Deezer Premium à vos proches"
              : "Create a personalized gift card to offer Deezer Premium to your loved ones"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Amount Selection */}
              <div className="glass backdrop-blur-xl rounded-2xl border border-border p-6 sm:p-8 mb-6">
                <p className="text-t-secondary text-sm font-medium uppercase tracking-wider mb-5">
                  {lang === "fr" ? "Choisissez le montant" : "Choose amount"}
                </p>

                {/* Preset buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {PRESET_AMOUNTS.map((val) => (
                    <motion.button
                      key={val}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setAmount(val);
                        setCustomAmount("");
                      }}
                      className={`py-4 rounded-xl text-base font-semibold transition-all ${
                        amount === val && !customAmount
                          ? "bg-violet-500/15 border-2 border-violet-400/50 text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.5)]"
                          : "bg-white/[0.04] border border-white/[0.08] text-t-secondary hover:text-t-primary hover:border-white/[0.15] hover:bg-white/[0.06]"
                      }`}
                    >
                      {val}€
                    </motion.button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      if (e.target.value) setAmount(Number(e.target.value));
                    }}
                    placeholder={lang === "fr" ? "Montant personnalisé" : "Custom amount"}
                    min="5"
                    max="500"
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-t-primary rounded-xl px-4 py-4 text-base placeholder:text-t-muted focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-t-muted text-sm font-medium">
                    EUR
                  </span>
                </div>
                <p className="text-t-muted text-xs mt-3">
                  {lang === "fr" ? "De 5€ à 500€" : "From 5€ to 500€"}
                </p>
              </div>

              {/* Card Preview */}
              <div className="bg-gradient-to-br from-violet-600 via-violet-500 to-violet-800 rounded-2xl p-8 mb-6 relative overflow-hidden shadow-[0_20px_60px_-20px_rgba(139,92,246,0.6)]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Headphones className="h-6 w-6 text-white/80" />
                      <span className="text-white/90 text-sm font-semibold">DeezLink Gift Card</span>
                    </div>
                    <Sparkles className="h-6 w-6 text-white/60" />
                  </div>
                  
                  <p className="text-white text-5xl font-bold mb-2">
                    {amount}
                    <span className="text-white/70 text-2xl ml-2">EUR</span>
                  </p>
                  <p className="text-white/70 text-sm">Deezer Premium · {lang === "fr" ? "1 mois minimum garanti" : "1 month minimum guaranteed"}</p>
                </div>
              </div>

              {/* Next button */}
              <motion.button
                onClick={() => setStep(2)}
                disabled={!amount || amount < 5 || amount > 500}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full !py-4"
              >
                {lang === "fr" ? "Continuer" : "Continue"}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Summary bar */}
              <button
                onClick={() => setStep(1)}
                className="w-full bg-violet-500/10 border border-violet-500/25 rounded-xl px-5 py-4 flex items-center justify-between mb-6 group hover:border-violet-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-purple-400" />
                  <span className="text-t-primary text-base font-semibold">{amount}€</span>
                  <span className="text-t-muted text-sm">Deezer Premium</span>
                </div>
                <span className="text-t-muted text-xs group-hover:text-t-secondary transition-colors">
                  {lang === "fr" ? "Modifier" : "Edit"}
                </span>
              </button>

              {/* Details form */}
              <div className="glass backdrop-blur-xl rounded-2xl border border-border p-6 sm:p-8 space-y-5 mb-6">
                <div>
                  <label className="text-t-secondary text-sm font-medium mb-3 block">
                    {lang === "fr" ? "Votre email" : "Your email"} *
                  </label>
                  <input
                    type="email"
                    value={purchaserEmail}
                    onChange={(e) => setPurchaserEmail(e.target.value)}
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-t-primary rounded-xl px-4 py-3.5 text-base placeholder:text-t-muted focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
                    placeholder={lang === "fr" ? "vous@email.com" : "you@email.com"}
                  />
                </div>

                <div>
                  <label className="text-t-secondary text-sm font-medium mb-3 block">
                    {lang === "fr" ? "Destinataire" : "Recipient"}{" "}
                    <span className="text-t-muted">({lang === "fr" ? "optionnel" : "optional"})</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] text-t-primary rounded-xl px-4 py-3.5 text-base placeholder:text-t-muted focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
                      placeholder={lang === "fr" ? "Nom" : "Name"}
                    />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] text-t-primary rounded-xl px-4 py-3.5 text-base placeholder:text-t-muted focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
                      placeholder="Email"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-t-secondary text-sm font-medium mb-3 block">
                    {lang === "fr" ? "Message" : "Message"}{" "}
                    <span className="text-t-muted">({lang === "fr" ? "optionnel" : "optional"})</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={150}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-t-primary rounded-xl px-4 py-3.5 text-base placeholder:text-t-muted focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/20 outline-none resize-none transition-all"
                    placeholder={lang === "fr" ? "Un petit message..." : "A short message..."}
                  />
                  <p className="text-t-muted text-xs mt-2 text-right">{message.length}/150</p>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/20 rounded-xl mb-6"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                onClick={handleValidate}
                disabled={loading || !purchaserEmail}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full !py-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {lang === "fr" ? "Création..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {lang === "fr" ? "Créer la carte" : "Create card"} · {amount}€
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
