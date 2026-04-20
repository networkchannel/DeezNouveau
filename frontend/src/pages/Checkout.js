import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { securePost } from "@/utils/secureApi";
import telemetryService from "@/utils/telemetryService";
import ClickCaptchaWidget from "@/components/ClickCaptchaWidget";
import { useAuth } from "@/context/AuthContext";
import { pickLang as L } from "@/utils/langPick";
import {
  ArrowLeft, Loader2, Shield, Check, Lock, Zap, Mail, Clock,
  Bitcoin, Headphones, Award, Sparkles, CreditCard,
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
  const { user } = useAuth();
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
  // "crypto" (OxaPay) | "stripe" (card)
  const [paymentMethod, setPaymentMethod] = useState("crypto");

  const isCustom = packId === "custom" || packId?.startsWith("custom_");
  const isMulti = packId === "multi";
  const parsedQty = isCustom
    ? parseInt(searchParams.get("qty") || packId.replace(/^custom_?/, "") || "", 10)
    : 0;
  const customQty = isCustom ? (Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1) : 0;

  // Multi-pack items (from cart via sessionStorage)
  const [multiItems, setMultiItems] = useState(null);
  useEffect(() => {
    if (!isMulti) return;
    try {
      const raw = sessionStorage.getItem("deezlink_multi_cart");
      if (!raw) { navigate("/offers"); return; }
      const items = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) { navigate("/offers"); return; }
      setMultiItems(items);
    } catch {
      navigate("/offers");
    }
  }, [isMulti, navigate]);

  useEffect(() => {
    const updateCaptchaRequirement = (state) => setRequireCaptcha(state.requireCaptcha);
    setRequireCaptcha(telemetryService.requireCaptcha);
    const unsub = telemetryService.subscribe(updateCaptchaRequirement);
    return unsub;
  }, []);

  useEffect(() => {
    if (isMulti) {
      // Multi pack: compute aggregated pack (price=sum, quantity=sum of link counts)
      if (!multiItems) return;
      axios.get(`${API}/packs`).then((r) => {
        const all = r.data.packs || r.data;
        const byId = Object.fromEntries((all || []).map((p) => [p.id, p]));
        let totalPrice = 0;
        let totalQty = 0;
        const lines = [];
        for (const it of multiItems) {
          const pd = byId[it.pack_id || it.id];
          if (!pd) continue;
          const count = it.count ?? 1;
          totalPrice += pd.price * count;
          totalQty += pd.quantity * count;
          lines.push({ pack_id: pd.id, name_key: pd.name_key, count, pack_quantity: pd.quantity, pack_price: pd.price, line_total: +(pd.price * count).toFixed(2) });
        }
        if (lines.length === 0) {
          setError(L({ fr: "Panier invalide.", en: "Invalid cart.", es: "Carrito inválido.", pt: "Carrinho inválido.", de: "Ungültiger Warenkorb.", tr: "Geçersiz sepet.", nl: "Ongeldige winkelwagen.", ar: "سلة غير صالحة." }, lang));
          return;
        }
        setPack({ name_key: "multi", quantity: totalQty, price: +totalPrice.toFixed(2), unit_price: totalQty ? +(totalPrice / totalQty).toFixed(2) : 0, multi_lines: lines });
      }).catch(() => setError(L({ fr: "Impossible de charger les packs.", en: "Failed to load packs.", es: "No se pudieron cargar los packs.", pt: "Falha ao carregar os packs.", de: "Pakete konnten nicht geladen werden.", tr: "Paketler yüklenemedi.", nl: "Kan pakketten niet laden.", ar: "تعذّر تحميل الباقات." }, lang)));
    } else if (isCustom) {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => {
        setCustomPricing(r.data);
        setPack({ name_key: "custom", quantity: r.data.quantity, price: r.data.total, unit_price: r.data.unit_price });
      }).catch((err) => {
        setError(err.response?.data?.detail || L({ fr: "Quantité invalide.", en: "Invalid quantity.", es: "Cantidad inválida.", pt: "Quantidade inválida.", de: "Ungültige Menge.", tr: "Geçersiz miktar.", nl: "Ongeldige hoeveelheid.", ar: "كمية غير صالحة." }, lang));
      });
    } else {
      axios.get(`${API}/packs`).then((r) => {
        const all = r.data.packs || r.data;
        const found = Array.isArray(all) ? all.find((p) => p.id === packId) : null;
        if (found) {
          setPack(found);
        } else {
          setError(L({
            fr: `Pack introuvable : "${packId}". Retour aux offres…`,
            en: `Pack not found: "${packId}". Redirecting…`,
            es: `Pack no encontrado: "${packId}". Redirigiendo…`,
            pt: `Pack não encontrado: "${packId}". Redirecionando…`,
            de: `Pack nicht gefunden: "${packId}". Weiterleitung…`,
            tr: `Paket bulunamadı: "${packId}". Yönlendiriliyor…`,
            nl: `Pakket niet gevonden: "${packId}". Doorverwijzen…`,
            ar: `الباقة غير موجودة: "${packId}". جارٍ التحويل…`,
          }, lang));
          setTimeout(() => navigate("/offers"), 1500);
        }
      }).catch(() => {
        setError(L({ fr: "Impossible de charger les packs.", en: "Failed to load packs.", es: "No se pudieron cargar los packs.", pt: "Falha ao carregar os packs.", de: "Pakete konnten nicht geladen werden.", tr: "Paketler yüklenemedi.", nl: "Kan pakketten niet laden.", ar: "تعذّر تحميل الباقات." }, lang));
      });
    }
  }, [packId, isCustom, isMulti, multiItems, customQty, navigate, lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(lang === "fr" ? "Email requis" : "Email required"); return; }
    if (requireCaptcha && !captchaToken) {
      setError(lang === "fr" ? "Veuillez compléter la vérification." : "Please complete the captcha.");
      return;
    }

    setLoading(true); setError("");
    try {
      const payload = { email: email.trim(), language: lang, payment_method: paymentMethod };
      if (captchaToken) payload.captcha_token = captchaToken;

      try {
        const abVariant = localStorage.getItem("dz_ab_best_value_label");
        const abSession = localStorage.getItem("dz_session_id") || "";
        if (abVariant === "a" || abVariant === "b") {
          payload.ab = { experiment: "best_value_label", variant: abVariant, session_id: abSession };
        }
      } catch { /* ignore */ }

      let data;
      if (isMulti && pack?.multi_lines) {
        data = await securePost("/orders/create-multi", {
          ...payload,
          items: pack.multi_lines.map((l) => ({ pack_id: l.pack_id, count: l.count })),
        });
      } else if (isCustom) {
        data = await securePost("/orders/create-custom", { ...payload, quantity: customQty });
      } else {
        data = await securePost("/orders/create", { ...payload, pack_id: packId });
      }
      localStorage.setItem("deezlink_email", email.trim().toLowerCase());
      window.dispatchEvent(new Event("deezlink_email_update"));
      if (isMulti) sessionStorage.removeItem("deezlink_multi_cart");

      // ─── Stripe branch: create a Stripe Checkout Session and redirect ───
      if (paymentMethod === "stripe") {
        try {
          const stripeRes = await securePost("/payments/stripe/create-session", {
            order_id: data.order_id,
            origin_url: window.location.origin,
          });
          if (stripeRes?.url) {
            window.location.href = stripeRes.url;
            return;
          }
          throw new Error("No Stripe URL returned");
        } catch (sErr) {
          setError(L({ fr: "Paiement par carte indisponible, réessaie plus tard.", en: "Card payment unavailable, please retry later.", es: "Pago con tarjeta no disponible, reintenta más tarde.", pt: "Pagamento com cartão indisponível, tente mais tarde.", de: "Kartenzahlung nicht verfügbar, später erneut versuchen.", tr: "Kart ödemesi şu anda kullanılamıyor.", nl: "Kaartbetaling niet beschikbaar, probeer later opnieuw.", ar: "الدفع بالبطاقة غير متاح الآن، حاول لاحقًا." }, lang));
          return;
        }
      }

      // ─── Crypto / OxaPay branch (existing behaviour) ───
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
        setError(typeof detail === "string" ? detail : L({ fr: "Erreur. Réessaie.", en: "Error. Try again.", es: "Error. Inténtalo de nuevo.", pt: "Erro. Tente novamente.", de: "Fehler. Erneut versuchen.", tr: "Hata. Tekrar dene.", nl: "Fout. Probeer opnieuw.", ar: "خطأ. حاول مرة أخرى." }, lang));
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
              {L({ fr: "Retour aux offres", en: "Back to offers", es: "Volver a ofertas", pt: "Voltar às ofertas", de: "Zurück zu Angeboten", tr: "Tekliflere dön", nl: "Terug naar aanbiedingen", ar: "رجوع للعروض" }, lang)}
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

  // Loyalty discount (only when logged in)
  const loyaltyDiscountPct = user && user.loyalty_tier?.discount ? user.loyalty_tier.discount : 0;
  const loyaltyTierName = user?.loyalty_tier?.name || "";
  const basePrice = displayPrice || 0;
  const loyaltySavings = loyaltyDiscountPct > 0 ? +(basePrice * loyaltyDiscountPct / 100).toFixed(2) : 0;
  const finalPrice = loyaltyDiscountPct > 0 ? +(basePrice - loyaltySavings).toFixed(2) : basePrice;

  const unitPrice = finalPrice && displayQty ? (finalPrice / displayQty) : 0;
  const packLabel = isCustom
    ? L({ fr: "Sur mesure", en: "Custom", es: "Personalizado", pt: "Personalizado", de: "Benutzerdefiniert", tr: "Özel", nl: "Aangepast", ar: "مخصص" }, lang)
    : t(pack.name_key || "pack_starter");

  const Tdict = {
    fr: {
      back: "Retour aux offres", step: "Étape 2/3 — Finaliser la commande", title: "Commande", summary: "Récapitulatif",
      subtotal: "Sous-total", loyaltyLabel: "Remise fidélité", total: "Total à payer", perLink: "par lien",
      deliveryTime: "Livraison instantanée", guarantee: "Garantie 30 jours", crypto: "Paiement crypto",
      email: "Email de livraison", emailPlaceholder: "tu@exemple.com", emailHint: "Tes liens d'activation seront envoyés à cet email",
      pay: "Procéder au paiement", paying: "Redirection…", securePay: "Paiement sécurisé via OxaPay",
      acceptedCrypto: "Cryptos acceptées", verified: "Vérifié", verifyPrompt: "Vérifie avant de payer",
      steps: ["Choix du pack", "Email & paiement", "Liens reçus"],
      whatHappens: "Ce qui se passe ensuite",
      step1: "Tu seras redirigé vers OxaPay", step2: "Tu paies en crypto de ton choix", step3: "Tes liens arrivent par email en moins de 5 min",
      exact: "Montant exact — aucun frais caché", anonymous: "100% anonyme", support24: "Support 24/7",
      liensWord: "liens",
    },
    en: {
      back: "Back to offers", step: "Step 2/3 — Complete your order", title: "Order", summary: "Summary",
      subtotal: "Subtotal", loyaltyLabel: "Loyalty discount", total: "Total to pay", perLink: "per link",
      deliveryTime: "Instant delivery", guarantee: "30-day guarantee", crypto: "Crypto payment",
      email: "Delivery email", emailPlaceholder: "you@example.com", emailHint: "Your activation links will be sent to this email",
      pay: "Proceed to payment", paying: "Redirecting…", securePay: "Secure payment via OxaPay",
      acceptedCrypto: "Accepted crypto", verified: "Verified", verifyPrompt: "Verify before paying",
      steps: ["Pick a pack", "Email & pay", "Get links"],
      whatHappens: "What happens next",
      step1: "You'll be redirected to OxaPay", step2: "Pay with any crypto you like", step3: "Links delivered by email in under 5 min",
      exact: "Exact amount — no hidden fees", anonymous: "100% anonymous", support24: "24/7 support",
      liensWord: "links",
    },
    es: {
      back: "Volver a ofertas", step: "Paso 2/3 — Completa tu pedido", title: "Pedido", summary: "Resumen",
      subtotal: "Subtotal", loyaltyLabel: "Descuento fidelidad", total: "Total a pagar", perLink: "por enlace",
      deliveryTime: "Entrega instantánea", guarantee: "Garantía 30 días", crypto: "Pago cripto",
      email: "Email de entrega", emailPlaceholder: "tu@ejemplo.com", emailHint: "Tus enlaces llegarán a este email",
      pay: "Continuar al pago", paying: "Redirigiendo…", securePay: "Pago seguro vía OxaPay",
      acceptedCrypto: "Cripto aceptados", verified: "Verificado", verifyPrompt: "Verifica antes de pagar",
      steps: ["Elegir pack", "Email y pago", "Recibir enlaces"],
      whatHappens: "Qué pasa después",
      step1: "Serás redirigido a OxaPay", step2: "Paga con la cripto que prefieras", step3: "Enlaces por email en menos de 5 min",
      exact: "Monto exacto — sin comisiones ocultas", anonymous: "100% anónimo", support24: "Soporte 24/7",
      liensWord: "enlaces",
    },
    pt: {
      back: "Voltar às ofertas", step: "Passo 2/3 — Conclua seu pedido", title: "Pedido", summary: "Resumo",
      subtotal: "Subtotal", loyaltyLabel: "Desconto fidelidade", total: "Total a pagar", perLink: "por link",
      deliveryTime: "Entrega instantânea", guarantee: "Garantia 30 dias", crypto: "Pagamento cripto",
      email: "Email de entrega", emailPlaceholder: "voce@exemplo.com", emailHint: "Seus links serão enviados a este email",
      pay: "Prosseguir ao pagamento", paying: "Redirecionando…", securePay: "Pagamento seguro via OxaPay",
      acceptedCrypto: "Cripto aceitos", verified: "Verificado", verifyPrompt: "Verifique antes de pagar",
      steps: ["Escolher pack", "Email e pagamento", "Receber links"],
      whatHappens: "O que acontece depois",
      step1: "Você será redirecionado ao OxaPay", step2: "Pague com a cripto que preferir", step3: "Links por email em menos de 5 min",
      exact: "Valor exato — sem taxas ocultas", anonymous: "100% anônimo", support24: "Suporte 24/7",
      liensWord: "links",
    },
    de: {
      back: "Zurück zu Angeboten", step: "Schritt 2/3 — Bestellung abschließen", title: "Bestellung", summary: "Zusammenfassung",
      subtotal: "Zwischensumme", loyaltyLabel: "Treuerabatt", total: "Zu zahlender Betrag", perLink: "pro Link",
      deliveryTime: "Sofortige Lieferung", guarantee: "30-Tage-Garantie", crypto: "Krypto-Zahlung",
      email: "Liefer-E-Mail", emailPlaceholder: "du@beispiel.com", emailHint: "Ihre Aktivierungslinks werden an diese E-Mail gesendet",
      pay: "Zur Zahlung", paying: "Weiterleitung…", securePay: "Sichere Zahlung via OxaPay",
      acceptedCrypto: "Akzeptierte Krypto", verified: "Verifiziert", verifyPrompt: "Vor der Zahlung verifizieren",
      steps: ["Pack wählen", "E-Mail & Zahlung", "Links erhalten"],
      whatHappens: "Was als nächstes passiert",
      step1: "Sie werden zu OxaPay weitergeleitet", step2: "Zahlen Sie mit beliebiger Krypto", step3: "Links per E-Mail in weniger als 5 Min.",
      exact: "Exakter Betrag — keine versteckten Gebühren", anonymous: "100% anonym", support24: "24/7 Support",
      liensWord: "Links",
    },
    tr: {
      back: "Tekliflere dön", step: "Adım 2/3 — Siparişi tamamla", title: "Sipariş", summary: "Özet",
      subtotal: "Ara toplam", loyaltyLabel: "Sadakat indirimi", total: "Ödenecek toplam", perLink: "bağlantı başına",
      deliveryTime: "Anında teslimat", guarantee: "30 gün garanti", crypto: "Kripto ödeme",
      email: "Teslimat e-postası", emailPlaceholder: "sen@ornek.com", emailHint: "Aktivasyon bağlantılarınız bu e-postaya gönderilir",
      pay: "Ödemeye geç", paying: "Yönlendiriliyor…", securePay: "OxaPay ile güvenli ödeme",
      acceptedCrypto: "Kabul edilen kripto", verified: "Doğrulandı", verifyPrompt: "Ödemeden önce doğrulayın",
      steps: ["Paket seç", "E-posta ve ödeme", "Bağlantıları al"],
      whatHappens: "Sonra ne olacak",
      step1: "OxaPay'e yönlendirileceksiniz", step2: "Dilediğiniz kripto ile ödeyin", step3: "Bağlantılar 5 dk içinde e-postayla gelir",
      exact: "Tam tutar — gizli ücret yok", anonymous: "%100 anonim", support24: "7/24 destek",
      liensWord: "bağlantı",
    },
    nl: {
      back: "Terug naar aanbiedingen", step: "Stap 2/3 — Bestelling afronden", title: "Bestelling", summary: "Samenvatting",
      subtotal: "Subtotaal", loyaltyLabel: "Loyaliteitskorting", total: "Te betalen totaal", perLink: "per link",
      deliveryTime: "Directe levering", guarantee: "30 dagen garantie", crypto: "Crypto-betaling",
      email: "Bezorg-e-mail", emailPlaceholder: "jij@voorbeeld.com", emailHint: "Je activeringslinks worden naar dit e-mailadres gestuurd",
      pay: "Ga naar betaling", paying: "Doorverwijzen…", securePay: "Veilige betaling via OxaPay",
      acceptedCrypto: "Geaccepteerde crypto", verified: "Geverifieerd", verifyPrompt: "Verifieer vóór betaling",
      steps: ["Pakket kiezen", "E-mail & betaling", "Links ontvangen"],
      whatHappens: "Wat er daarna gebeurt",
      step1: "Je wordt doorverwezen naar OxaPay", step2: "Betaal met elke gewenste crypto", step3: "Links per e-mail binnen 5 min",
      exact: "Exact bedrag — geen verborgen kosten", anonymous: "100% anoniem", support24: "24/7 support",
      liensWord: "links",
    },
    ar: {
      back: "رجوع للعروض", step: "الخطوة 2/3 — إتمام الطلب", title: "الطلب", summary: "الملخص",
      subtotal: "المجموع الفرعي", loyaltyLabel: "خصم الولاء", total: "المجموع المستحق", perLink: "لكل رابط",
      deliveryTime: "توصيل فوري", guarantee: "ضمان 30 يومًا", crypto: "دفع كريبتو",
      email: "بريد التسليم", emailPlaceholder: "anta@example.com", emailHint: "ستصلك روابط التفعيل على هذا البريد",
      pay: "المتابعة للدفع", paying: "جارٍ التحويل…", securePay: "دفع آمن عبر OxaPay",
      acceptedCrypto: "العملات المقبولة", verified: "تم التحقق", verifyPrompt: "تحقق قبل الدفع",
      steps: ["اختيار الباقة", "البريد والدفع", "استلام الروابط"],
      whatHappens: "ما سيحدث بعد ذلك",
      step1: "سيتم تحويلك إلى OxaPay", step2: "ادفع بالعملة الرقمية التي تفضلها", step3: "تصل الروابط عبر البريد خلال 5 دقائق",
      exact: "مبلغ دقيق — بلا رسوم خفية", anonymous: "مجهول 100%", support24: "دعم 24/7",
      liensWord: "روابط",
    },
  };
  const T = Tdict[lang] || Tdict.en;

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
                <span className="pill !py-1 !px-2 !text-[10px]" data-testid="summary-method-pill">
                  <span className="pill-dot pill-dot-violet" />
                  {paymentMethod === "stripe"
                    ? L({ fr: "Carte", en: "Card", es: "Tarjeta", pt: "Cartão", de: "Karte", tr: "Kart", nl: "Kaart", ar: "بطاقة" }, lang)
                    : T.crypto}
                </span>
              </div>

              {/* Product row(s) */}
              {isMulti && pack.multi_lines ? (
                <div className="pb-5 mb-5 border-b border-white/[0.06] space-y-3">
                  {pack.multi_lines.map((l, i) => (
                    <div key={i} className="flex items-center gap-3" data-testid={`multi-line-${l.pack_id}`}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shrink-0">
                        <Headphones className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-semibold text-[14px] truncate">
                          {t(l.name_key || "pack_starter")} <span className="text-white/50 font-normal">× {l.count}</span>
                        </div>
                      <div className="text-white/45 text-[11px]">
                        {l.pack_quantity * l.count}{" "}{T.liensWord} · {l.pack_price.toFixed(2)}€ / pack
                      </div>
                      </div>
                      <div className="text-white font-semibold text-[14px] tabular-nums">
                        {l.line_total.toFixed(2)}€
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
              )}

              {/* Loyalty discount badge */}
              {loyaltyDiscountPct > 0 && (
                <div
                  className="mb-4 flex items-center justify-between px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/25"
                  data-testid="loyalty-discount-row"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-green-400" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-green-400 text-[12.5px] font-semibold">
                        {T.loyaltyLabel}
                        {loyaltyTierName ? <span className="text-green-300/70 font-normal"> · {loyaltyTierName}</span> : null}
                      </div>
                      <div className="text-white/45 text-[11px]">
                        −{loyaltyDiscountPct}%
                      </div>
                    </div>
                  </div>
                  <div className="text-green-400 font-semibold text-[14px] tabular-nums">
                    −{loyaltySavings.toFixed(2)}€
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="rounded-2xl bg-gradient-to-br from-violet-900/30 to-transparent border border-violet-500/20 p-5 mb-5">
                {loyaltyDiscountPct > 0 && (
                  <div className="flex items-baseline justify-between mb-1.5 text-[12px]">
                    <span className="text-white/45">{T.subtotal}</span>
                    <span className="text-white/60 line-through tabular-nums">{basePrice.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-white/60 text-[13px] font-medium">{T.total}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="display-md text-white tracking-tight" data-testid="checkout-total">
                      {finalPrice.toFixed(2)}
                    </span>
                    <span className="text-white/50 font-semibold text-sm">EUR</span>
                  </div>
                </div>
                <div className="text-white/40 text-[11px]">
                  {T.exact}
                </div>
              </div>

              {/* Trust bullets */}
              <ul className="space-y-2.5 text-[13px]">
                {[
                  { icon: Zap, text: T.deliveryTime, color: "text-violet-300" },
                  { icon: Award, text: T.guarantee, color: "text-green-400" },
                  { icon: Lock, text: T.anonymous, color: "text-sky-300" },
                  { icon: Clock, text: T.support24, color: "text-amber-300" },
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

                {/* ─── Payment method selector (Crypto vs Card) ─── */}
                <div className="mt-5 mb-5">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-white/40 font-semibold mb-2.5">
                    {L({ fr: "Méthode de paiement", en: "Payment method", es: "Método de pago", pt: "Método de pagamento", de: "Zahlungsmethode", tr: "Ödeme yöntemi", nl: "Betaalmethode", ar: "طريقة الدفع" }, lang)}
                  </div>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === "crypto"}
                      onClick={() => setPaymentMethod("crypto")}
                      data-testid="pay-method-crypto"
                      className={`relative flex flex-col items-start gap-1 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                        paymentMethod === "crypto"
                          ? "bg-violet-500/10 border-violet-500/50 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]"
                          : "bg-[#0a0a0e] border-white/[0.08] hover:border-white/[0.18]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bitcoin className={`h-3.5 w-3.5 ${paymentMethod === "crypto" ? "text-violet-300" : "text-white/50"}`} />
                        <span className="text-[13px] font-semibold text-white">
                          {L({ fr: "Crypto", en: "Crypto", es: "Cripto", pt: "Cripto", de: "Krypto", tr: "Kripto", nl: "Crypto", ar: "عملات رقمية" }, lang)}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/50">
                        {L({ fr: "Anonyme · OxaPay", en: "Anonymous · OxaPay", es: "Anónimo · OxaPay", pt: "Anônimo · OxaPay", de: "Anonym · OxaPay", tr: "Anonim · OxaPay", nl: "Anoniem · OxaPay", ar: "مجهول · OxaPay" }, lang)}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === "stripe"}
                      onClick={() => setPaymentMethod("stripe")}
                      data-testid="pay-method-stripe"
                      className={`relative flex flex-col items-start gap-1 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                        paymentMethod === "stripe"
                          ? "bg-violet-500/10 border-violet-500/50 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]"
                          : "bg-[#0a0a0e] border-white/[0.08] hover:border-white/[0.18]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className={`h-3.5 w-3.5 ${paymentMethod === "stripe" ? "text-violet-300" : "text-white/50"}`} />
                        <span className="text-[13px] font-semibold text-white">
                          {L({ fr: "Carte", en: "Card", es: "Tarjeta", pt: "Cartão", de: "Karte", tr: "Kart", nl: "Kaart", ar: "بطاقة" }, lang)}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/50">
                        {L({ fr: "Visa, Mastercard · Stripe", en: "Visa, Mastercard · Stripe", es: "Visa, Mastercard · Stripe", pt: "Visa, Mastercard · Stripe", de: "Visa, Mastercard · Stripe", tr: "Visa, Mastercard · Stripe", nl: "Visa, Mastercard · Stripe", ar: "Visa, Mastercard · Stripe" }, lang)}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Accepted crypto (only when crypto method is selected) */}
                {paymentMethod === "crypto" && (
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
                )}

                {/* Stripe accepted cards */}
                {paymentMethod === "stripe" && (
                <div className="mt-5 mb-5">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-white/40 font-semibold mb-2.5">
                    {L({ fr: "Cartes acceptées", en: "Cards accepted", es: "Tarjetas aceptadas", pt: "Cartões aceitos", de: "Akzeptierte Karten", tr: "Kabul edilen kartlar", nl: "Geaccepteerde kaarten", ar: "البطاقات المقبولة" }, lang)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"].map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border text-sky-300 bg-sky-500/5 border-sky-500/25"
                      >
                        <CreditCard className="h-3 w-3" />
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/45 text-[11.5px] mt-2.5 leading-relaxed">
                    {L({ fr: "Redirection sécurisée vers Stripe. 3D Secure activé.", en: "Secure redirect to Stripe. 3D Secure enabled.", es: "Redirección segura a Stripe. 3D Secure habilitado.", pt: "Redirecionamento seguro para Stripe. 3D Secure ativo.", de: "Sichere Weiterleitung zu Stripe. 3D Secure aktiv.", tr: "Güvenli Stripe yönlendirmesi. 3D Secure etkin.", nl: "Veilige redirect naar Stripe. 3D Secure actief.", ar: "إعادة توجيه آمنة إلى Stripe مع 3D Secure." }, lang)}
                  </p>
                </div>
                )}

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
                  {loading ? T.paying : `${T.pay} · ${finalPrice.toFixed(2)}€`}
                </button>

                <p className="text-white/45 text-[12px] text-center flex items-center justify-center gap-1.5 mt-3.5">
                  <Shield className="h-3 w-3 text-violet-400" />
                  {paymentMethod === "stripe"
                    ? L({ fr: "Paiement sécurisé via Stripe", en: "Secure payment via Stripe", es: "Pago seguro vía Stripe", pt: "Pagamento seguro via Stripe", de: "Sichere Zahlung via Stripe", tr: "Stripe ile güvenli ödeme", nl: "Veilige betaling via Stripe", ar: "دفع آمن عبر Stripe" }, lang)
                    : T.securePay}
                </p>
              </form>

              {/* What happens next — adapted to payment method */}
              <div className="mt-5 rounded-2xl bg-[#0a0a0e] border border-white/[0.06] p-5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-white/40 font-semibold mb-3.5">
                  {T.whatHappens}
                </div>
                <ol className="space-y-3">
                  {(paymentMethod === "stripe"
                    ? [
                        L({ fr: "Tu seras redirigé vers Stripe", en: "You'll be redirected to Stripe", es: "Serás redirigido a Stripe", pt: "Você será redirecionado ao Stripe", de: "Sie werden zu Stripe weitergeleitet", tr: "Stripe'e yönlendirileceksiniz", nl: "Je wordt doorverwezen naar Stripe", ar: "سيتم تحويلك إلى Stripe" }, lang),
                        L({ fr: "Tu paies par carte (Visa, Mastercard…)", en: "Pay with your card (Visa, Mastercard…)", es: "Paga con tu tarjeta (Visa, Mastercard…)", pt: "Pague com seu cartão (Visa, Mastercard…)", de: "Mit Karte zahlen (Visa, Mastercard…)", tr: "Kartla öde (Visa, Mastercard…)", nl: "Betaal met je kaart (Visa, Mastercard…)", ar: "ادفع ببطاقتك (Visa, Mastercard…)" }, lang),
                        T.step3,
                      ]
                    : [T.step1, T.step2, T.step3]
                  ).map((s, i) => (
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

      {/* ─── Sticky mobile pay bar (appears on mobile only, improves conversion) ─── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 bg-gradient-to-t from-[#05050a] via-[#05050a]/95 to-[#05050a]/0 pointer-events-none"
        aria-hidden
      >
        <button
          type="button"
          onClick={() => {
            // Proxy-click the real submit button so validation still runs
            const btn = document.querySelector('[data-testid="pay-btn"]');
            if (btn) btn.click();
          }}
          disabled={loading || (requireCaptcha && !captchaToken)}
          data-testid="sticky-pay-btn"
          className="btn-primary w-full !py-3.5 !text-[14px] pointer-events-auto shadow-[0_10px_40px_-10px_rgba(139,92,246,0.6)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {loading ? T.paying : `${T.pay} · ${finalPrice.toFixed(2)}€`}
        </button>
      </div>
    </div>
  );
}
