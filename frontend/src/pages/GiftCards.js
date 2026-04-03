import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Gift, Check, AlertCircle, Sparkles, Copy, ArrowRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

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
      setError("Email required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${API}/gift-cards/purchase`, {
        amount,
        purchaser_email: purchaserEmail,
        recipient_email: recipientEmail || null,
        recipient_name: recipientName || null,
        message: message || null,
      });
      if (response.data.success) {
        setGeneratedCode(response.data.gift_card.code);
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur");
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
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md">
          <div className="text-center mb-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-400" />
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {t("gift_card_created")}
            </h2>
            <p className="text-white/40 text-sm">{amount}EUR · Deezer Premium</p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-5">
            <p className="text-white/40 text-[11px] font-mono uppercase tracking-wider mb-3">
              {t("gift_card_code")}
            </p>
            <div className="flex items-center gap-3">
              <p className="flex-1 text-2xl sm:text-3xl font-mono font-bold text-accent tracking-wide">{generatedCode}</p>
              <motion.button onClick={copyCode} whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  copied ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.08]"
                }`}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </motion.button>
            </div>
            <p className="text-amber-400/60 text-[11px] mt-3 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t("gift_card_save_code")}
            </p>
          </div>

          <motion.button onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 text-[13px] font-medium text-white/50 hover:text-white/80 transition-colors flex items-center justify-center gap-2">
            <Gift className="h-4 w-4" /> {t("gift_card_create_another")}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-8%] w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/15 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-6 w-6 text-purple-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t("gift_card_title")}
          </h1>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            {t("gift_card_subtitle")}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Amount Selection */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-6 mb-4">
                <p className="text-white/50 text-[12px] font-medium uppercase tracking-wider mb-4">
                  {t("gift_card_choose_amount")}
                </p>

                {/* Preset buttons */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {PRESET_AMOUNTS.map((val) => (
                    <motion.button key={val} whileTap={{ scale: 0.95 }}
                      onClick={() => { setAmount(val); setCustomAmount(""); }}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                        amount === val && !customAmount
                          ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/30 text-white"
                          : "bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white hover:border-white/[0.1]"
                      }`}>
                      {val}EUR
                    </motion.button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); if (e.target.value) setAmount(Number(e.target.value)); }}
                    placeholder={t("gift_card_custom_amount")}
                    min="5" max="500"
                    className="w-full bg-white/[0.04] border border-white/[0.06] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/25 focus:border-purple-400/30 focus:ring-2 focus:ring-purple-400/10 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-sm font-medium">EUR</span>
                </div>
                <p className="text-white/20 text-[11px] mt-2">{t("gift_card_from_to")}</p>
              </div>

              {/* Card Preview Mini */}
              <div className="bg-gradient-to-br from-purple-600/80 to-pink-600/80 rounded-2xl p-5 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="DeezLink" className="h-6 w-auto brightness-0 invert opacity-80" />
                    <span className="text-white/80 text-[11px] font-medium">{t("gift_card_title")}</span>
                  </div>
                  <Sparkles className="h-5 w-5 text-white/40" />
                </div>
                <p className="text-white text-3xl sm:text-4xl font-bold">{amount}<span className="text-white/60 text-lg ml-1">EUR</span></p>
                <p className="text-white/50 text-[11px] mt-2">Deezer Premium · 12 months</p>
              </div>

              {/* Next button */}
              <motion.button
                onClick={() => setStep(2)}
                disabled={!amount || amount < 5 || amount > 500}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                {t("gift_card_continue")} <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {/* Summary bar */}
              <button onClick={() => setStep(1)}
                className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/15 rounded-xl px-4 py-3 flex items-center justify-between mb-5 group">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-purple-400" />
                  <span className="text-white text-sm font-semibold">{amount}EUR</span>
                  <span className="text-white/30 text-[11px]">Deezer Premium</span>
                </div>
                <span className="text-white/30 text-[11px] group-hover:text-white/50 transition-colors">
                  {t("gift_card_edit")}
                </span>
              </button>

              {/* Details form */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4 mb-5">
                <div>
                  <label className="text-white/50 text-[12px] font-medium mb-2 block">
                    {t("gift_card_your_email")} *
                  </label>
                  <input type="email" value={purchaserEmail} onChange={(e) => setPurchaserEmail(e.target.value)} required
                    className="w-full bg-white/[0.04] border border-white/[0.06] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/25 focus:border-accent/30 focus:ring-2 focus:ring-accent/10 outline-none"
                    placeholder="vous@email.com" />
                </div>
                <div>
                  <label className="text-white/50 text-[12px] font-medium mb-2 block">
                    {t("gift_card_recipient")} <span className="text-white/20">({t("gift_card_optional")})</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.06] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/25 focus:border-accent/30 focus:ring-2 focus:ring-accent/10 outline-none"
                      placeholder={t("gift_card_name")} />
                    <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.06] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/25 focus:border-accent/30 focus:ring-2 focus:ring-accent/10 outline-none"
                      placeholder="Email" />
                  </div>
                </div>
                <div>
                  <label className="text-white/50 text-[12px] font-medium mb-2 block">
                    {t("gift_card_message")} <span className="text-white/20">({t("gift_card_optional")})</span>
                  </label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={150} rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.06] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/25 focus:border-accent/30 focus:ring-2 focus:ring-accent/10 outline-none resize-none"
                    placeholder={t("gift_card_short_message")} />
                  <p className="text-white/15 text-[10px] mt-1 text-right">{message.length}/150</p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-[12px] text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <motion.button onClick={handleValidate} disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("gift_card_creating")}</>
                ) : (
                  <><Check className="h-4 w-4" /> {t("gift_card_create")} · {amount}EUR</>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
