import { useTranslation } from "react-i18next";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Check, Copy, Loader2, ExternalLink, Download,
  CheckCircle2, Clock, AlertCircle, ArrowRight, Sparkles, FileText, Share2
} from "lucide-react";
import { pickLang as L } from "@/utils/langPick";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

/* ──────── confetti particles ──────── */
function Confetti() {
  const colors = ["#6366f1", "#a855f7", "#ec4899", "#22c55e", "#eab308", "#3b82f6"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const dur = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const rotation = Math.random() * 360;
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{ y: "100vh", x: (Math.random() - 0.5) * 200, opacity: 0, rotate: rotation + 360 }}
            transition={{ duration: dur, delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: -10,
              width: size,
              height: size * 0.6,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}

/* ──────── status badge ──────── */
function StatusBadge({ status, lang }) {
  const config = {
    completed: {
      icon: CheckCircle2,
      label: L({ fr: "Terminee", en: "Completed", es: "Completado", pt: "Concluído", de: "Abgeschlossen", tr: "Tamamlandı", nl: "Voltooid", ar: "مكتمل" }, lang),
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    pending: {
      icon: Clock,
      label: L({ fr: "En attente de paiement", en: "Awaiting payment", es: "Esperando pago", pt: "Aguardando pagamento", de: "Warte auf Zahlung", tr: "Ödeme bekleniyor", nl: "Wacht op betaling", ar: "في انتظار الدفع" }, lang),
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400 animate-pulse",
    },
    payment_mock: {
      icon: Sparkles,
      label: L({ fr: "Mode test", en: "Test mode", es: "Modo de prueba", pt: "Modo de teste", de: "Testmodus", tr: "Test modu", nl: "Testmodus", ar: "وضع الاختبار" }, lang),
      bg: "bg-violet-500/10 border-violet-500/20",
      text: "text-violet-400",
      dot: "bg-violet-400",
    },
    failed: {
      icon: AlertCircle,
      label: L({ fr: "Echouee", en: "Failed", es: "Fallido", pt: "Falhou", de: "Fehlgeschlagen", tr: "Başarısız", nl: "Mislukt", ar: "فشل" }, lang),
      bg: "bg-red-500/10 border-red-500/20",
      text: "text-red-400",
      dot: "bg-red-400",
    },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-full border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}

/* ──────── link card ──────── */
function LinkCard({ link, index, copiedIdx, onCopy }) {
  const isCopied = copiedIdx === index;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.35 }}
      className="group relative"
    >
      <div className={`
        flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200
        ${isCopied
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
        }
      `}>
        {/* Number */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center shrink-0">
          <span className="text-[12px] font-bold text-accent tabular-nums">{index + 1}</span>
        </div>

        {/* Link */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-mono text-white/70 truncate group-hover:text-white/90 transition-colors">
            {link}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-accent hover:bg-accent/10 transition-all"
            title="Ouvrir"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={() => onCopy(link, index)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isCopied
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-white/30 hover:text-white hover:bg-white/10"
            }`}
            title="Copier"
          >
            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────── main page ──────── */
export default function OrderConfirmation() {
  const { i18n } = useTranslation();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get("mock") === "true";
  const stripeFlag = searchParams.get("stripe"); // "1" on success, "cancel" on cancel
  const stripeSessionId = searchParams.get("session_id") || "";
  const isStripeReturn = stripeFlag === "1" && stripeSessionId;
  const isStripeCancel = stripeFlag === "cancel";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stripePolling, setStripePolling] = useState(isStripeReturn);
  const lang = i18n.language || "fr";

  // Poll Stripe status once on mount for return URL — the first 'paid' hit
  // fulfills the order server-side, after which the order polling (below) will
  // reflect status=completed.
  useEffect(() => {
    if (!isStripeReturn) return undefined;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40; // ~2 minutes at 3s
    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const { data } = await axios.get(`${API}/payments/stripe/status/${encodeURIComponent(stripeSessionId)}`);
        if (data?.payment_status === "paid" || data?.fulfilled) {
          setStripePolling(false);
          return;
        }
      } catch { /* will retry */ }
      if (attempts >= maxAttempts) {
        setStripePolling(false);
        return;
      }
      setTimeout(poll, 3000);
    };
    poll();
    return () => { cancelled = true; };
  }, [isStripeReturn, stripeSessionId]);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/orders/${orderId}`);
      setOrder((prev) => {
        if (!prev && data.status === "completed") setShowConfetti(true);
        if (prev && prev.status !== "completed" && data.status === "completed") setShowConfetti(true);
        return data;
      });
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  useEffect(() => {
    if (!order || order.status === "completed" || order.status === "failed") return;
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  useEffect(() => {
    if (showConfetti) {
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showConfetti]);

  const handleMockConfirm = async () => {
    setConfirming(true);
    try {
      await axios.post(`${API}/orders/${orderId}/confirm-mock`);
      await fetchOrder();
    } catch {}
    setConfirming(false);
  };

  const copyLink = (link, idx) => {
    navigator.clipboard.writeText(link);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 2000);
  };

  const copyAllLinks = () => {
    if (!order?.links?.length) return;
    const text = order.links.map((l, i) => `${i + 1}. ${l}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const downloadLinks = () => {
    if (!order?.links?.length) return;
    const header = `DeezLink - ${L({ fr: "Commande", en: "Order", es: "Pedido", pt: "Pedido", de: "Bestellung", tr: "Sipariş", nl: "Bestelling", ar: "الطلب" }, lang)} #${orderId}\n`;
    const separator = "=".repeat(50) + "\n";
    const date = new Date(order.created_at).toLocaleDateString(lang, {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const info = `${L({ fr: "Date", en: "Date", es: "Fecha", pt: "Data", de: "Datum", tr: "Tarih", nl: "Datum", ar: "التاريخ" }, lang)}: ${date}\n${L({ fr: "Pack", en: "Pack", es: "Pack", pt: "Pack", de: "Pack", tr: "Paket", nl: "Pakket", ar: "باقة" }, lang)}: ${order.pack_id} (${order.quantity} ${L({ fr: "liens", en: "links", es: "enlaces", pt: "links", de: "Links", tr: "bağlantı", nl: "links", ar: "روابط" }, lang)})\n${L({ fr: "Prix", en: "Price", es: "Precio", pt: "Preço", de: "Preis", tr: "Fiyat", nl: "Prijs", ar: "السعر" }, lang)}: ${order.price}EUR\n`;
    const linksText = order.links.map((l, i) => `\n${L({ fr: "Lien", en: "Link", es: "Enlace", pt: "Link", de: "Link", tr: "Bağlantı", nl: "Link", ar: "رابط" }, lang)} ${i + 1}:\n${l}`).join("\n");
    const footer = `\n\n${separator}${L({ fr: "Merci pour votre achat !", en: "Thank you for your purchase!", es: "¡Gracias por tu compra!", pt: "Obrigado pela sua compra!", de: "Vielen Dank für Ihren Einkauf!", tr: "Satın aldığınız için teşekkürler!", nl: "Bedankt voor uw aankoop!", ar: "شكرًا على عملية الشراء!" }, lang)}\nhttps://deezlink.com`;
    const content = header + separator + info + separator + linksText + footer;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deezlink-${orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareLinks = async () => {
    if (!order?.links?.length) return;
    const text = order.links.join("\n");
    if (navigator.share) {
      try {
        await navigator.share({ title: `DeezLink #${orderId}`, text });
      } catch {}
    } else {
      copyAllLinks();
    }
  };

  /* ──────── loading ──────── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto mb-3" />
        <p className="text-white/40 text-[13px]">{L({ fr: "Chargement...", en: "Loading...", es: "Cargando...", pt: "Carregando...", de: "Lädt...", tr: "Yükleniyor...", nl: "Laden...", ar: "جارٍ التحميل..." }, lang)}</p>
      </div>
    </div>
  );

  /* ──────── not found ──────── */
  if (!order) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">{L({ fr: "Commande introuvable", en: "Order not found", es: "Pedido no encontrado", pt: "Pedido não encontrado", de: "Bestellung nicht gefunden", tr: "Sipariş bulunamadı", nl: "Bestelling niet gevonden", ar: "الطلب غير موجود" }, lang)}</h2>
        <p className="text-white/40 text-[13px] mb-6">{L({ fr: "Verifiez le lien ou contactez le support", en: "Check the link or contact support", es: "Verifica el enlace o contacta al soporte", pt: "Verifique o link ou contate o suporte", de: "Link prüfen oder Support kontaktieren", tr: "Bağlantıyı kontrol edin veya destekle iletişime geçin", nl: "Controleer de link of neem contact op met support", ar: "تحقق من الرابط أو اتصل بالدعم" }, lang)}</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-5 py-2.5 rounded-xl transition-colors">
          {L({ fr: "Retour a l'accueil", en: "Back to home", es: "Volver al inicio", pt: "Voltar ao início", de: "Zurück zur Startseite", tr: "Ana sayfaya dön", nl: "Terug naar home", ar: "العودة للرئيسية" }, lang)} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );

  const isCompleted = order.status === "completed";
  const hasLinks = order.links && order.links.length > 0;
  const formattedDate = new Date(order.created_at).toLocaleDateString(lang, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      {/* BG orbs */}
      {isCompleted && (
        <>
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* ── Stripe return banners (when coming back from Stripe Checkout) ── */}
        {isStripeCancel && !isCompleted && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3" data-testid="stripe-cancel-banner">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-amber-300 font-semibold text-[13.5px]">
                {L({ fr: "Paiement Stripe annulé", en: "Stripe payment cancelled", es: "Pago Stripe cancelado", pt: "Pagamento Stripe cancelado", de: "Stripe-Zahlung abgebrochen", tr: "Stripe ödemesi iptal edildi", nl: "Stripe-betaling geannuleerd", ar: "تم إلغاء الدفع عبر Stripe" }, lang)}
              </div>
              <div className="text-white/60 text-[12.5px] mt-1">
                {L({ fr: "Aucun montant n'a été débité. Tu peux réessayer ou choisir un autre mode de paiement.", en: "No amount was charged. You can retry or pick another payment method.", es: "No se cobró ningún importe. Puedes reintentar o elegir otro método de pago.", pt: "Nenhum valor foi cobrado. Tente novamente ou escolha outro método.", de: "Es wurde nichts abgebucht. Bitte erneut versuchen oder andere Methode wählen.", tr: "Herhangi bir tutar alınmadı. Tekrar deneyebilir veya başka yöntem seçebilirsin.", nl: "Er is niets afgeschreven. Probeer opnieuw of kies een andere betaalmethode.", ar: "لم يتم خصم أي مبلغ. يمكنك إعادة المحاولة أو اختيار طريقة أخرى." }, lang)}
              </div>
            </div>
          </div>
        )}
        {isStripeReturn && stripePolling && !isCompleted && (
          <div className="mb-6 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-start gap-3" data-testid="stripe-polling-banner">
            <Loader2 className="h-5 w-5 text-violet-300 shrink-0 mt-0.5 animate-spin" />
            <div>
              <div className="text-violet-200 font-semibold text-[13.5px]">
                {L({ fr: "Confirmation du paiement Stripe…", en: "Confirming your Stripe payment…", es: "Confirmando tu pago Stripe…", pt: "Confirmando seu pagamento Stripe…", de: "Stripe-Zahlung wird bestätigt…", tr: "Stripe ödemesi onaylanıyor…", nl: "Stripe-betaling wordt bevestigd…", ar: "جارٍ تأكيد الدفع عبر Stripe…" }, lang)}
              </div>
              <div className="text-white/60 text-[12.5px] mt-1">
                {L({ fr: "Cela ne prend que quelques secondes. Ne ferme pas cette page.", en: "This usually takes a few seconds. Please keep this page open.", es: "Solo tardará unos segundos. No cierres esta página.", pt: "Só leva alguns segundos. Não feche esta página.", de: "Dauert nur ein paar Sekunden. Diese Seite bitte offen halten.", tr: "Sadece birkaç saniye sürer. Bu sayfayı kapatma.", nl: "Dit duurt maar enkele seconden. Sluit deze pagina niet.", ar: "يستغرق الأمر بضع ثوانٍ فقط. لا تغلق الصفحة." }, lang)}
              </div>
            </div>
          </div>
        )}

        {/* ── Success header ── */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </motion.div>
            <h1 className="text-white font-bold text-2xl mb-2">
              {L({ fr: "Paiement confirme !", en: "Payment confirmed!", es: "¡Pago confirmado!", pt: "Pagamento confirmado!", de: "Zahlung bestätigt!", tr: "Ödeme onaylandı!", nl: "Betaling bevestigd!", ar: "تم تأكيد الدفع!" }, lang)}
            </h1>
            <p className="text-white/50 text-[14px]">
              {L({
                fr: `${order.quantity} lien${order.quantity > 1 ? "s" : ""} Deezer Premium prêt${order.quantity > 1 ? "s" : ""}`,
                en: `${order.quantity} Deezer Premium link${order.quantity > 1 ? "s" : ""} ready`,
                es: `${order.quantity} enlace${order.quantity > 1 ? "s" : ""} Deezer Premium listo${order.quantity > 1 ? "s" : ""}`,
                pt: `${order.quantity} link${order.quantity > 1 ? "s" : ""} Deezer Premium pronto${order.quantity > 1 ? "s" : ""}`,
                de: `${order.quantity} Deezer Premium Link${order.quantity > 1 ? "s" : ""} bereit`,
                tr: `${order.quantity} Deezer Premium bağlantı${order.quantity > 1 ? "sı" : "sı"} hazır`,
                nl: `${order.quantity} Deezer Premium link${order.quantity > 1 ? "s" : ""} klaar`,
                ar: `${order.quantity} ${order.quantity > 1 ? "روابط" : "رابط"} Deezer Premium جاهز`,
              }, lang)}
            </p>
          </motion.div>
        )}

        {/* ── Pending / Mock header ── */}
        {!isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-7 w-7 text-amber-400 animate-pulse" />
            </div>
            <h1 className="text-white font-bold text-xl mb-2">
              {L({ fr: "En attente de paiement", en: "Awaiting payment", es: "Esperando pago", pt: "Aguardando pagamento", de: "Warte auf Zahlung", tr: "Ödeme bekleniyor", nl: "Wacht op betaling", ar: "في انتظار الدفع" }, lang)}
            </h1>
            <p className="text-white/40 text-[13px]">
              {L({ fr: "Vos liens seront disponibles apres confirmation", en: "Your links will be available after confirmation", es: "Tus enlaces estarán disponibles tras la confirmación", pt: "Seus links estarão disponíveis após a confirmação", de: "Ihre Links sind nach der Bestätigung verfügbar", tr: "Bağlantılarınız onaydan sonra kullanılabilir", nl: "Uw links zijn beschikbaar na bevestiging", ar: "ستتوفر روابطك بعد التأكيد" }, lang)}
            </p>
          </motion.div>
        )}

        {/* ── Order summary card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden mb-5"
        >
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white/30 text-[11px] font-mono tracking-wider uppercase mb-1">
                {L({ fr: "Commande", en: "Order", es: "Pedido", pt: "Pedido", de: "Bestellung", tr: "Sipariş", nl: "Bestelling", ar: "الطلب" }, lang)} #{orderId}
              </p>
              <p className="text-white/40 text-[12px]">{formattedDate}</p>
            </div>
            <StatusBadge status={order.status} lang={lang} />
          </div>
          <div className="border-t border-white/[0.06] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-white font-medium text-[14px]">
                    {order.pack_id === "solo" ? "Solo" : order.pack_id === "duo" ? "Duo" : order.pack_id === "family" ? "Family" : order.pack_id}
                  </p>
                  <p className="text-white/40 text-[12px]">
                    {order.quantity} {L({ fr: "lien", en: "link", es: "enlace", pt: "link", de: "Link", tr: "bağlantı", nl: "link", ar: "رابط" }, lang)}{order.quantity > 1 ? "s" : ""} · Deezer Premium
                  </p>
                </div>
              </div>
              <span className="text-white font-bold text-xl tabular-nums">{order.price}<span className="text-white/40 text-[14px]">EUR</span></span>
            </div>
            {order.loyalty_points_earned > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-400/80 text-[12px]">
                  +{order.loyalty_points_earned} {L({ fr: "points fidélité gagnés", en: "loyalty points earned", es: "puntos de fidelidad ganados", pt: "pontos de fidelidade ganhos", de: "Treuepunkte gesammelt", tr: "kazanılan sadakat puanı", nl: "loyaliteitspunten verdiend", ar: "نقاط ولاء مكتسبة" }, lang)}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Mock confirm button ── */}
        {(order.status === "payment_mock" || (isMock && order.status === "pending")) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-violet-500/5 backdrop-blur-xl border border-violet-500/15 rounded-2xl p-5 mb-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-violet-300 font-medium text-[14px] mb-1">
                  {L({ fr: "Mode test actif", en: "Test mode active", es: "Modo de prueba activo", pt: "Modo de teste ativo", de: "Testmodus aktiv", tr: "Test modu aktif", nl: "Testmodus actief", ar: "وضع الاختبار مفعّل" }, lang)}
                </p>
                <p className="text-white/40 text-[13px] leading-relaxed">
                  {L({ fr: "Cliquez pour simuler la confirmation de paiement et recevoir vos liens.", en: "Click to simulate payment confirmation and receive your links.", es: "Haz clic para simular la confirmación del pago y recibir tus enlaces.", pt: "Clique para simular a confirmação do pagamento e receber seus links.", de: "Klicken, um die Zahlungsbestätigung zu simulieren und Links zu erhalten.", tr: "Ödeme onayını simüle etmek ve bağlantılarınızı almak için tıklayın.", nl: "Klik om betalingsbevestiging te simuleren en links te ontvangen.", ar: "انقر لمحاكاة تأكيد الدفع واستلام روابطك." }, lang)}
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleMockConfirm}
              disabled={confirming}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-[14px] font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {confirming ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {L({ fr: "Confirmation...", en: "Confirming...", es: "Confirmando...", pt: "Confirmando...", de: "Bestätigen...", tr: "Onaylanıyor...", nl: "Bevestigen...", ar: "جارٍ التأكيد..." }, lang)}</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> {L({ fr: "Confirmer le paiement test", en: "Confirm test payment", es: "Confirmar pago de prueba", pt: "Confirmar pagamento de teste", de: "Testzahlung bestätigen", tr: "Test ödemesini onayla", nl: "Testbetaling bevestigen", ar: "تأكيد دفع الاختبار" }, lang)}</>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* ── Links section ── */}
        {hasLinks && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden mb-5"
          >
            {/* Header with actions */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white font-medium text-[14px]">
                  {L({ fr: "Vos liens d'activation", en: "Your activation links", es: "Tus enlaces de activación", pt: "Seus links de ativação", de: "Ihre Aktivierungslinks", tr: "Aktivasyon bağlantılarınız", nl: "Uw activeringslinks", ar: "روابط التفعيل الخاصة بك" }, lang)}
                </span>
                <span className="text-white/30 text-[12px]">({order.links.length})</span>
              </div>
            </div>

            {/* Links list */}
            <div className="p-3 space-y-2">
              {order.links.map((link, idx) => (
                <LinkCard
                  key={typeof link === "string" ? link : (link?.id || link?.url || idx)}
                  link={link}
                  index={idx}
                  copiedIdx={copiedIdx}
                  onCopy={copyLink}
                />
              ))}
            </div>

            {/* Action bar */}
            <div className="px-4 py-3.5 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
              <motion.button
                onClick={copyAllLinks}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-xl transition-all ${
                  copiedAll
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                {copiedAll ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedAll
                  ? (L({ fr: "Copie !", en: "Copied!", es: "¡Copiado!", pt: "Copiado!", de: "Kopiert!", tr: "Kopyalandı!", nl: "Gekopieerd!", ar: "تم النسخ!" }, lang))
                  : (L({ fr: "Copier tout", en: "Copy all", es: "Copiar todo", pt: "Copiar tudo", de: "Alles kopieren", tr: "Tümünü kopyala", nl: "Alles kopiëren", ar: "نسخ الكل" }, lang))}
              </motion.button>

              <motion.button
                onClick={downloadLinks}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                {L({ fr: "Telecharger .txt", en: "Download .txt", es: "Descargar .txt", pt: "Baixar .txt", de: ".txt herunterladen", tr: ".txt indir", nl: ".txt downloaden", ar: "تنزيل .txt" }, lang)}
              </motion.button>

              <motion.button
                onClick={shareLinks}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                title={L({ fr: "Partager", en: "Share", es: "Compartir", pt: "Compartilhar", de: "Teilen", tr: "Paylaş", nl: "Delen", ar: "مشاركة" }, lang)}
              >
                <Share2 className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── No links yet (pending) ── */}
        {!hasLinks && order.status !== "completed" && order.status !== "failed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center mb-5"
          >
            <Loader2 className="h-5 w-5 animate-spin text-white/30 mx-auto mb-3" />
            <p className="text-white/40 text-[13px]">
              {L({ fr: "Les liens apparaitront ici apres confirmation du paiement", en: "Links will appear here after payment confirmation", es: "Los enlaces aparecerán aquí tras la confirmación del pago", pt: "Os links aparecerão aqui após a confirmação do pagamento", de: "Links erscheinen hier nach Zahlungsbestätigung", tr: "Bağlantılar ödeme onayından sonra burada görünecek", nl: "Links verschijnen hier na betalingsbevestiging", ar: "ستظهر الروابط هنا بعد تأكيد الدفع" }, lang)}
            </p>
          </motion.div>
        )}

        {/* ── How to use ── */}
        {hasLinks && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-white/40" />
              <span className="text-white/60 font-medium text-[13px]">
                {L({ fr: "Comment utiliser vos liens", en: "How to use your links", es: "Cómo usar tus enlaces", pt: "Como usar seus links", de: "So verwenden Sie Ihre Links", tr: "Bağlantılarınızı nasıl kullanırsınız", nl: "Hoe uw links te gebruiken", ar: "كيفية استخدام روابطك" }, lang)}
              </span>
            </div>
            <div className="space-y-3">
              {[
                L({ fr: "Cliquez sur un lien ou copiez-le", en: "Click a link or copy it", es: "Haz clic en un enlace o cópialo", pt: "Clique em um link ou copie", de: "Auf einen Link klicken oder kopieren", tr: "Bir bağlantıya tıklayın veya kopyalayın", nl: "Klik op een link of kopieer hem", ar: "انقر على رابط أو انسخه" }, lang),
                L({ fr: "Connectez-vous a votre compte Deezer", en: "Sign in to your Deezer account", es: "Inicia sesión en tu cuenta Deezer", pt: "Entre em sua conta Deezer", de: "Bei Ihrem Deezer-Konto anmelden", tr: "Deezer hesabınıza giriş yapın", nl: "Log in bij uw Deezer-account", ar: "سجل الدخول إلى حساب Deezer" }, lang),
                L({ fr: "Profitez de Deezer Premium !", en: "Enjoy Deezer Premium!", es: "¡Disfruta Deezer Premium!", pt: "Aproveite Deezer Premium!", de: "Genießen Sie Deezer Premium!", tr: "Deezer Premium'un tadını çıkarın!", nl: "Geniet van Deezer Premium!", ar: "استمتع بـ Deezer Premium!" }, lang),
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-accent">{i + 1}</span>
                  </div>
                  <p className="text-white/50 text-[13px] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Email notice ── */}
        {isCompleted && order.email && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-center mb-6"
          >
            <p className="text-white/30 text-[12px]">
              {L({
                fr: `Les liens ont aussi été envoyés à ${order.email}`,
                en: `Links were also sent to ${order.email}`,
                es: `Los enlaces también se enviaron a ${order.email}`,
                pt: `Os links também foram enviados para ${order.email}`,
                de: `Die Links wurden auch an ${order.email} gesendet`,
                tr: `Bağlantılar ayrıca ${order.email} adresine gönderildi`,
                nl: `De links zijn ook verzonden naar ${order.email}`,
                ar: `تم إرسال الروابط أيضًا إلى ${order.email}`,
              }, lang)}
            </p>
          </motion.div>
        )}

        {/* ── Footer nav ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-4 pt-2"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-[13px] transition-colors"
          >
            {L({ fr: "Accueil", en: "Home", es: "Inicio", pt: "Início", de: "Startseite", tr: "Ana Sayfa", nl: "Home", ar: "الرئيسية" }, lang)}
          </Link>
          <span className="text-white/10">|</span>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-[13px] transition-colors"
          >
            {L({ fr: "Mes commandes", en: "My Orders", es: "Mis pedidos", pt: "Meus pedidos", de: "Meine Bestellungen", tr: "Siparişlerim", nl: "Mijn bestellingen", ar: "طلباتي" }, lang)}
          </Link>
          <span className="text-white/10">|</span>
          <Link
            to="/offers"
            className="inline-flex items-center gap-1.5 text-accent/60 hover:text-accent text-[13px] transition-colors"
          >
            {L({ fr: "Commander encore", en: "Order again", es: "Pedir de nuevo", pt: "Pedir novamente", de: "Erneut bestellen", tr: "Tekrar sipariş ver", nl: "Opnieuw bestellen", ar: "اطلب مجددًا" }, lang)} <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
