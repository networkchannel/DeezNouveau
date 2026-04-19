import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { securePost } from "@/utils/secureApi";
import telemetryService from "@/utils/telemetryService";
import ClickCaptchaWidget from "@/components/ClickCaptchaWidget";
import {
  ArrowLeft, Loader2, Shield, Check, Lock, Zap, Mail, Clock,
  Bitcoin, Headphones, Award,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const CRYPTOS = [
  { code: "BTC", name: "Bitcoin",  color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { code: "ETH", name: "Ethereum", color: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  { code: "USDT", name: "Tether",  color: "bg-green-500/15 text-green-300 border-green-500/30" },
  { code: "LTC", name: "Litecoin", color: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
];

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const { packId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";
  const [pack, setPack] = useState(null);
  const [customPricing, setCustomPricing] = useState(null);
  const [email, setEmail] = useState(() => localStorage.getItem("deezlink_email") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [requireCaptcha, setRequireCaptcha] = useState(false);

  const isCustom = packId === "custom" || packId?.startsWith("custom_");
  const parsedQty = isCustom
    ? parseInt(searchParams.get("qty") || packId.replace(/^custom_?/, "") || "", 10)
    : 0;
  const customQty = isCustom ? (Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1) : 0;

  useEffect(() => {
    const updateCaptchaRequirement = (state) => setRequireCaptcha(state.requireCaptcha);
    setRequireCaptcha(telemetryService.requireCaptcha);
    const unsub = telemetryService.subscribe(updateCaptchaRequirement);
    return unsub;
  }, []);

  useEffect(() => {
    if (isCustom) {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => {
        setCustomPricing(r.data);
        setPack({ name_key: "custom", quantity: r.data.quantity, price: r.data.total, unit_price: r.data.unit_price });
      }).catch((err) => {
        setError(err.response?.data?.detail || (lang === "fr" ? "Quantité invalide." : "Invalid quantity."));
      });
    } else {
      axios.get(`${API}/packs`).then((r) => {
        const all = r.data.packs || r.data;
        const found = Array.isArray(all) ? all.find((p) => p.id === packId) : null;
        if (found) {
          setPack(found);
        } else {
          setError(lang === "fr"
            ? `Pack introuvable : "${packId}". Retour aux offres…`
            : `Pack not found: "${packId}". Redirecting…`);
          setTimeout(() => navigate("/offers"), 1500);
        }
      }).catch(() => {
        setError(lang === "fr" ? "Impossible de charger les packs." : "Failed to load packs.");
      });
    }
  }, [packId, isCustom, customQty, navigate, lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(lang === "fr" ? "Email requis" : "Email required"); return; }
    if (requireCaptcha && !captchaToken) {
      setError(lang === "fr" ? "Veuillez compléter la vérification." : "Please complete the captcha.");
      return;
    }

    setLoading(true); setError("");
    try {
      const payload = { email: email.trim(), language: lang };
      if (captchaToken) payload.captcha_token = captchaToken;

      try {
        const abVariant = localStorage.getItem("dz_ab_best_value_label");
        const abSession = localStorage.getItem("dz_session_id") || "";
        if (abVariant === "a" || abVariant === "b") {
          payload.ab = { experiment: "best_value_label", variant: abVariant, session_id: abSession };
        }
      } catch { /* ignore */ }

      let data;
      if (isCustom) {
        data = await securePost("/orders/create-custom", { ...payload, quantity: customQty });
      } else {
        data = await securePost("/orders/create", { ...payload, pack_id: packId });
      }
      localStorage.setItem("deezlink_email", email.trim().toLowerCase());
      window.dispatchEvent(new Event("deezlink_email_update"));
      if (data.payment_url && !data.payment_url.startsWith("/")) {
        window.location.href = data.payment_url;
      } else {
        navigate(`/order/${data.order_id}?mock=true`);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const code = typeof detail === "object" ? detail?.code : "";
      if (code === "CAPTCHA_REQUIRED" || err.response?.status === 403) {
        setRequireCaptcha(true);
        setCaptchaToken("");
        setError(typeof detail === "object" ? detail.message : typeof detail === "string" ? detail : "Captcha required");
      } else {
        setError(typeof detail === "string" ? detail : (lang === "fr" ? "Erreur. Réessaie." : "Error. Try again."));
      }
    } finally { setLoading(false); }
  };

  if (!pack) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        {error ? (
          <div className="max-w-md w-full card-surface p-8 text-center">
            <div className="text-red-400 text-sm mb-4" data-testid="checkout-load-error">{error}</div>
            <button onClick={() => navigate("/offers")} className="btn-primary">
              {lang === "fr" ? "Retour aux offres" : "Back to offers"}
            </button>
          </div>
        ) : (
          <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
        )}
      </div>
    );
  }

  const displayPrice = isCustom ? customPricing?.total : pack.price;
  const displayQty = isCustom ? customQty : pack.quantity;
  const unitPrice = displayPrice && displayQty ? (displayPrice / displayQty) : 0;
  const packLabel = isCustom
    ? (lang === "fr" ? "Sur mesure" : "Custom")
    : t(pack.name_key || "pack_starter");

  const T = {
    fr: {
      back: "Retour aux offres",
      step: "Étape 2/3 — Finaliser la commande",
      title: "Commande",
      summary: "Récapitulatif",
      total: "Total à payer",
      perLink: "par lien",
      deliveryTime: "Livraison instantanée",
      guarantee: "Garantie 30 jours",
      crypto: "Paiement crypto",
      email: "Email de livraison",
      emailPlaceholder: "tu@exemple.com",
      emailHint: "Tes liens d'activation seront envoyés à cet email",
      pay: "Procéder au paiement",
      paying: "Redirection…",
      securePay: "Paiement sécurisé via OxaPay",
      acceptedCrypto: "Cryptos acceptées",
      verified: "Vérifié",
      verifyPrompt: "Vérifie avant de payer",
      steps: ["Choix du pack", "Email & paiement", "Liens reçus"],
      whatHappens: "Ce qui se passe ensuite",
      step1: "Tu seras redirigé vers OxaPay",
      step2: "Tu paies en crypto de ton choix",
      step3: "Tes liens arrivent par email en moins de 5 min",
    },
    en: {
      back: "Back to offers",
      step: "Step 2/3 — Complete your order",
      title: "Order",
      summary: "Summary",
      total: "Total to pay",
      perLink: "per link",
      deliveryTime: "Instant delivery",
      guarantee: "30-day guarantee",
      crypto: "Crypto payment",
      email: "Delivery email",
      emailPlaceholder: "you@example.com",
      emailHint: "Your activation links will be sent to this email",
      pay: "Proceed to payment",
      paying: "Redirecting…",
      securePay: "Secure payment via OxaPay",
      acceptedCrypto: "Accepted crypto",
      verified: "Verified",
      verifyPrompt: "Verify before paying",
      steps: ["Pick a pack", "Email & pay", "Get links"],
      whatHappens: "What happens next",
      step1: "You'll be redirected to OxaPay",
      step2: "Pay with any crypto you like",
      step3: "Links delivered by email in under 5 min",
    },
  }[lang] || { back: "Back", step: "", title: "Order", summary: "Summary", total: "Total", perLink: "per link", deliveryTime: "Instant", guarantee: "Guarantee", crypto: "Crypto", email: "Email", emailPlaceholder: "you@example.com", emailHint: "Links will arrive here", pay: "Pay", paying: "Redirecting…", securePay: "Secure payment", acceptedCrypto: "Accepted", verified: "Verified", verifyPrompt: "Verify", steps: ["Pack", "Pay", "Done"], whatHappens: "What's next", step1: "Redirect", step2: "Pay", step3: "Links" };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14" data-testid="checkout-page">
        {/* Header with breadcrumb + steps */}
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <button
            onClick={() => navigate("/offers")}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] transition-colors"
            data-testid="checkout-back"
          >
            <ArrowLeft className="h-4 w-4" /> {T.back}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-white/50">
            {T.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < 1 ? "bg-violet-500/30 text-violet-200 border border-violet-400/60"
                        : i === 1 ? "bg-violet-500 text-white"
                        : "bg-white/[0.04] text-white/40 border border-white/10"
                }`}>
                  {i < 1 ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={i === 1 ? "text-white font-semibold" : ""}>{s}</span>
                {i < T.steps.length - 1 && <span className="text-white/20">—</span>}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="pill mb-3"><span className="pill-dot pill-dot-violet" />{T.step}</div>
          <h1 className="display-md text-white mb-8">{T.title}</h1>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5">
            {/* ═════ LEFT: Order summary ═════ */}
            <aside className="card-surface p-6 sm:p-7 !hover:translate-y-0 !hover:border-white/[0.06] self-start">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold text-[15px]">{T.summary}</h2>
                <span className="pill !py-1 !px-2 !text-[10px]">
                  <span className="pill-dot pill-dot-violet" />
                  {T.crypto}
                </span>
              </div>

              {/* Product row */}
              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-white/[0.06]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shrink-0 shadow-[0_8px_24px_-8px_rgba(139,92,246,0.7)]">
                  <Headphones className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-[15px] truncate" data-testid="pack-name">
                    Deezer Premium · {displayQty}x
                  </div>
                  <div className="text-white/50 text-[12px]">
                    {packLabel}{unitPrice > 0 ? ` · ${unitPrice.toFixed(2)}€ ${T.perLink}` : ""}
                  </div>
                </div>
                <div className="text-white font-display font-bold text-lg tabular-nums" data-testid="pack-subtotal">
                  {displayPrice?.toFixed(2)}€
                </div>
              </div>

              {/* Total */}
              <div className="rounded-2xl bg-gradient-to-br from-violet-900/30 to-transparent border border-violet-500/20 p-5 mb-5">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-white/60 text-[13px] font-medium">{T.total}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="display-md text-white tracking-tight" data-testid="checkout-total">
                      {displayPrice?.toFixed(2)}
                    </span>
                    <span className="text-white/50 font-semibold text-sm">EUR</span>
                  </div>
                </div>
                <div className="text-white/40 text-[11px]">
                  {lang === "fr"
                    ? "Montant exact — aucun frais caché"
                    : "Exact amount — no hidden fees"}
                </div>
              </div>

              {/* Trust bullets */}
              <ul className="space-y-2.5 text-[13px]">
                {[
                  { icon: Zap, text: T.deliveryTime, color: "text-violet-300" },
                  { icon: Award, text: T.guarantee, color: "text-green-400" },
                  { icon: Lock, text: lang === "fr" ? "100% anonyme" : "100% anonymous", color: "text-sky-300" },
                  { icon: Clock, text: lang === "fr" ? "Support 24/7" : "24/7 support", color: "text-amber-300" },
                ].map((r, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-white/70">
                    <r.icon className={`h-3.5 w-3.5 ${r.color} shrink-0`} />
                    <span>{r.text}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* ═════ RIGHT: Form ═════ */}
            <div>
              <form
                onSubmit={handleSubmit}
                className="card-surface p-6 sm:p-7 !hover:translate-y-0 !hover:border-white/[0.06]"
                data-testid="checkout-form"
              >
                <label className="block mb-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-3.5 w-3.5 text-violet-300" />
                    <span className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">
                      {T.email}
                    </span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={T.emailPlaceholder}
                    required
                    autoFocus
                    className="w-full bg-[#0a0a0e] border border-white/[0.1] focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 rounded-full px-5 py-3.5 text-white text-[14px] placeholder-white/30 outline-none transition-all"
                    data-testid="checkout-email"
                  />
                  <p className="text-white/45 text-[12px] mt-2 pl-1">{T.emailHint}</p>
                </label>

                {/* Accepted crypto */}
                <div className="mt-5 mb-5">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-white/40 font-semibold mb-2.5">
                    {T.acceptedCrypto}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CRYPTOS.map((c) => (
                      <span
                        key={c.code}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${c.color}`}
                      >
                        <Bitcoin className="h-3 w-3" />
                        {c.code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Captcha */}
                {requireCaptcha && !captchaToken && (
                  <div className="mt-5 mb-5">
                    <ClickCaptchaWidget
                      onVerified={(token) => setCaptchaToken(token)}
                      label={T.verifyPrompt}
                    />
                  </div>
                )}
                {captchaToken && (
                  <div className="mt-5 mb-5 flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/10 border border-green-500/25 text-[12px] text-green-400 font-semibold w-fit">
                    <Check className="h-3 w-3" />
                    {T.verified}
                  </div>
                )}

                {error && (
                  <div
                    className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-[13px]"
                    data-testid="checkout-error"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (requireCaptcha && !captchaToken)}
                  className="btn-primary w-full !py-4 !text-[14px]"
                  data-testid="pay-btn"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {loading ? T.paying : `${T.pay} · ${displayPrice?.toFixed(2)}€`}
                </button>

                <p className="text-white/45 text-[12px] text-center flex items-center justify-center gap-1.5 mt-3.5">
                  <Shield className="h-3 w-3 text-violet-400" />
                  {T.securePay}
                </p>
              </form>

              {/* What happens next */}
              <div className="mt-5 rounded-2xl bg-[#0a0a0e] border border-white/[0.06] p-5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-white/40 font-semibold mb-3.5">
                  {T.whatHappens}
                </div>
                <ol className="space-y-3">
                  {[T.step1, T.step2, T.step3].map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-[13px] text-white/70">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 text-[11px] font-bold font-mono">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
