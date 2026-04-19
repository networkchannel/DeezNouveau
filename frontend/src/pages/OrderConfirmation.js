import { useTranslation } from "react-i18next";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Check, Copy, Loader2, ExternalLink, Download,
  CheckCircle2, Clock, AlertCircle, ArrowRight, Sparkles, FileText, Share2
} from "lucide-react";

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
      label: lang === "fr" ? "Terminee" : "Completed",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    pending: {
      icon: Clock,
      label: lang === "fr" ? "En attente de paiement" : "Awaiting payment",
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400 animate-pulse",
    },
    payment_mock: {
      icon: Sparkles,
      label: lang === "fr" ? "Mode test" : "Test mode",
      bg: "bg-violet-500/10 border-violet-500/20",
      text: "text-violet-400",
      dot: "bg-violet-400",
    },
    failed: {
      icon: AlertCircle,
      label: lang === "fr" ? "Echouee" : "Failed",
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
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const lang = i18n.language || "fr";

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
    const header = `DeezLink - ${lang === "fr" ? "Commande" : "Order"} #${orderId}\n`;
    const separator = "=".repeat(50) + "\n";
    const date = new Date(order.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const info = `${lang === "fr" ? "Date" : "Date"}: ${date}\n${lang === "fr" ? "Pack" : "Pack"}: ${order.pack_id} (${order.quantity} ${lang === "fr" ? "liens" : "links"})\n${lang === "fr" ? "Prix" : "Price"}: ${order.price}EUR\n`;
    const linksText = order.links.map((l, i) => `\n${lang === "fr" ? "Lien" : "Link"} ${i + 1}:\n${l}`).join("\n");
    const footer = `\n\n${separator}${lang === "fr" ? "Merci pour votre achat !" : "Thank you for your purchase!"}\nhttps://deezlink.com`;
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
        <p className="text-white/40 text-[13px]">{lang === "fr" ? "Chargement..." : "Loading..."}</p>
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
        <h2 className="text-white font-semibold text-lg mb-2">{lang === "fr" ? "Commande introuvable" : "Order not found"}</h2>
        <p className="text-white/40 text-[13px] mb-6">{lang === "fr" ? "Verifiez le lien ou contactez le support" : "Check the link or contact support"}</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-5 py-2.5 rounded-xl transition-colors">
          {lang === "fr" ? "Retour a l'accueil" : "Back to home"} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );

  const isCompleted = order.status === "completed";
  const hasLinks = order.links && order.links.length > 0;
  const formattedDate = new Date(order.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
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
              {lang === "fr" ? "Paiement confirme !" : "Payment confirmed!"}
            </h1>
            <p className="text-white/50 text-[14px]">
              {lang === "fr"
                ? `${order.quantity} lien${order.quantity > 1 ? "s" : ""} Deezer Premium pret${order.quantity > 1 ? "s" : ""}`
                : `${order.quantity} Deezer Premium link${order.quantity > 1 ? "s" : ""} ready`}
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
              {lang === "fr" ? "En attente de paiement" : "Awaiting payment"}
            </h1>
            <p className="text-white/40 text-[13px]">
              {lang === "fr" ? "Vos liens seront disponibles apres confirmation" : "Your links will be available after confirmation"}
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
                {lang === "fr" ? "Commande" : "Order"} #{orderId}
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
                    {order.quantity} {lang === "fr" ? "lien" : "link"}{order.quantity > 1 ? "s" : ""} · Deezer Premium
                  </p>
                </div>
              </div>
              <span className="text-white font-bold text-xl tabular-nums">{order.price}<span className="text-white/40 text-[14px]">EUR</span></span>
            </div>
            {order.loyalty_points_earned > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-400/80 text-[12px]">
                  +{order.loyalty_points_earned} {lang === "fr" ? "points fidélité gagnés" : "loyalty points earned"}
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
                  {lang === "fr" ? "Mode test actif" : "Test mode active"}
                </p>
                <p className="text-white/40 text-[13px] leading-relaxed">
                  {lang === "fr"
                    ? "Cliquez pour simuler la confirmation de paiement et recevoir vos liens."
                    : "Click to simulate payment confirmation and receive your links."}
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
                <><Loader2 className="h-4 w-4 animate-spin" /> {lang === "fr" ? "Confirmation..." : "Confirming..."}</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> {lang === "fr" ? "Confirmer le paiement test" : "Confirm test payment"}</>
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
                  {lang === "fr" ? "Vos liens d'activation" : "Your activation links"}
                </span>
                <span className="text-white/30 text-[12px]">({order.links.length})</span>
              </div>
            </div>

            {/* Links list */}
            <div className="p-3 space-y-2">
              {order.links.map((link, idx) => (
                <LinkCard
                  key={idx}
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
                  ? (lang === "fr" ? "Copie !" : "Copied!")
                  : (lang === "fr" ? "Copier tout" : "Copy all")}
              </motion.button>

              <motion.button
                onClick={downloadLinks}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                {lang === "fr" ? "Telecharger .txt" : "Download .txt"}
              </motion.button>

              <motion.button
                onClick={shareLinks}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                title={lang === "fr" ? "Partager" : "Share"}
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
              {lang === "fr" ? "Les liens apparaitront ici apres confirmation du paiement" : "Links will appear here after payment confirmation"}
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
                {lang === "fr" ? "Comment utiliser vos liens" : "How to use your links"}
              </span>
            </div>
            <div className="space-y-3">
              {[
                lang === "fr" ? "Cliquez sur un lien ou copiez-le" : "Click a link or copy it",
                lang === "fr" ? "Connectez-vous a votre compte Deezer" : "Sign in to your Deezer account",
                lang === "fr" ? "Profitez de Deezer Premium !" : "Enjoy Deezer Premium!",
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
              {lang === "fr"
                ? `Les liens ont aussi ete envoyes a ${order.email}`
                : `Links were also sent to ${order.email}`}
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
            {lang === "fr" ? "Accueil" : "Home"}
          </Link>
          <span className="text-white/10">|</span>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-[13px] transition-colors"
          >
            {lang === "fr" ? "Mes commandes" : "My Orders"}
          </Link>
          <span className="text-white/10">|</span>
          <Link
            to="/offers"
            className="inline-flex items-center gap-1.5 text-accent/60 hover:text-accent text-[13px] transition-colors"
          >
            {lang === "fr" ? "Commander encore" : "Order again"} <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
