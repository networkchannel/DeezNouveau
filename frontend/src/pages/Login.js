import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { securePost } from "@/utils/secureApi";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, ArrowLeft, Check, RefreshCw, AlertTriangle, CheckCircle2, Shield } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyMagicLink, checkAuth, user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("form"); // form | waiting | verifying | verified
  const [emailSent, setEmailSent] = useState(null); // null | true | false
  const [sessionId, setSessionId] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const pollingRef = useRef(null);
  const cooldownRef = useRef(null);
  const lang = i18n.language || "fr";

  const txt = {
    fr: {
      title: "Connexion",
      subtitle: "Un lien de connexion sera envoyé à votre email.",
      btn: "Recevoir le lien",
      processing: "Envoi en cours...",
      checkEmail: "Vérifiez votre boîte mail",
      linkSentTo: "Un lien de connexion a été envoyé à",
      emailDelivered: "Email envoyé avec succès",
      emailFailed: "L'envoi de l'email a échoué",
      emailFailedHint: "Vérifiez l'adresse et réessayez.",
      waiting: "En attente de confirmation...",
      expires: "Le lien expire dans 30 minutes",
      resend: "Renvoyer l'email",
      resendIn: "Renvoyer dans",
      resent: "Email renvoyé !",
      otherEmail: "Utiliser un autre email",
      verifying: "Vérification en cours...",
      verified: "Connecté avec succès !",
      securedBy: "Protégé par télémétrie DeezLink",
      invalidEmail: "Email invalide",
      linkExpired: "Lien expiré ou invalide",
      genericError: "Une erreur est survenue, veuillez réessayer.",
    },
    en: {
      title: "Sign in",
      subtitle: "A login link will be sent to your email.",
      btn: "Get login link",
      processing: "Sending...",
      checkEmail: "Check your email",
      linkSentTo: "A login link has been sent to",
      emailDelivered: "Email sent successfully",
      emailFailed: "Email delivery failed",
      emailFailedHint: "Check your email address and try again.",
      waiting: "Waiting for confirmation...",
      expires: "Link expires in 30 minutes",
      resend: "Resend email",
      resendIn: "Resend in",
      resent: "Email resent!",
      otherEmail: "Use another email",
      verifying: "Verifying...",
      verified: "Signed in successfully!",
      securedBy: "Secured by DeezLink telemetry",
      invalidEmail: "Invalid email",
      linkExpired: "Link expired or invalid",
      genericError: "An error occurred, please try again.",
    }
  };
  const T = txt[lang] || txt.en;

  useEffect(() => { if (user && user.email) navigate("/profile"); }, [user, navigate]);

  // Handle token from URL (magic link click)
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setPhase("verifying");
      verifyMagicLink(token)
        .then(() => { setPhase("verified"); setTimeout(() => navigate("/profile"), 1200); })
        .catch(() => { setError(T.linkExpired); setPhase("form"); });
    }
  }, [searchParams, verifyMagicLink, navigate, T.linkExpired]);

  // Polling for magic link verification
  const startPolling = useCallback((sid) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/auth/magic/check/${sid}`, { withCredentials: true });
        if (data.verified) {
          clearInterval(pollingRef.current);
          setPhase("verified");
          await checkAuth();
          setTimeout(() => navigate("/profile"), 1000);
        } else if (data.status === "expired") {
          clearInterval(pollingRef.current);
          setError(T.linkExpired);
          setPhase("form");
        }
      } catch {}
    }, 3000);
  }, [checkAuth, navigate, T.linkExpired]);

  // Cleanup
  useEffect(() => () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  }, []);

  // Cooldown timer
  const startCooldown = (seconds) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Submit magic link request — with triple-fallback error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) { setError(T.invalidEmail); return; }
    
    setLoading(true);
    setError("");
    setEmailSent(null);
    
    try {
      // Primary: use securePost with telemetry
      const result = await securePost("/auth/magic", {
        email: trimmedEmail,
        language: lang
      });
      
      // Store email for order history
      try {
        localStorage.setItem("deezlink_email", trimmedEmail.toLowerCase());
        window.dispatchEvent(new Event("deezlink_email_update"));
      } catch {}
      
      // Transition to waiting phase
      const sid = result?.session_id || "";
      setSessionId(sid);
      setEmailSent(result?.email_sent !== false); // Default to true if field missing
      setPhase("waiting");
      if (sid) startPolling(sid);
      startCooldown(60);
      
    } catch (err) {
      console.error("[Login] Magic link error:", err);
      
      // Extract error detail
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      
      if (status === 429) {
        setError(typeof detail === "string" ? detail : "Trop de tentatives. Patientez quelques minutes.");
      } else if (status === 403) {
        setError(typeof detail === "string" ? detail : "Erreur de sécurité. Rechargez la page.");
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(T.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend email — strict telemetry
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    
    try {
      const result = await securePost("/auth/magic/resend", {
        email: email.trim(),
        session_id: sessionId,
        language: lang
      });
      setEmailSent(result?.email_sent !== false);
      setResendCount(prev => prev + 1);
      startCooldown(90);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : T.genericError);
    } finally {
      setResending(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setPhase("form");
    setEmailSent(null);
    setResendCount(0);
    setResendCooldown(0);
    setError("");
  };

  /* ============ VERIFYING STATE ============ */
  if (phase === "verifying") return (
    <div className="max-w-sm mx-auto px-5 py-24 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-t-muted mx-auto mb-3" />
      <p className="text-t-muted text-[14px]">{T.verifying}</p>
    </div>
  );

  /* ============ VERIFIED STATE ============ */
  if (phase === "verified") return (
    <div className="max-w-sm mx-auto px-5 py-24 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
          <Check className="h-5 w-5 text-green-400" />
        </div>
      </motion.div>
      <p className="text-green-400 text-[14px] font-medium">{T.verified}</p>
    </div>
  );

  /* ============ WAITING STATE ============ */
  if (phase === "waiting") return (
    <div className="max-w-md mx-auto px-5 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="bg-surface border border-border rounded-2xl p-8">
          
          {/* Header icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Mail className="h-7 w-7 text-purple-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-t-primary font-semibold text-[20px] text-center mb-2">
            {T.checkEmail}
          </h2>
          <p className="text-t-secondary text-[13px] text-center mb-1">{T.linkSentTo}</p>
          <p className="text-purple-400 text-[14px] font-medium text-center mb-6">{email}</p>

          {/* Email delivery status */}
          <AnimatePresence mode="wait">
            {emailSent === true && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4"
              >
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-green-400 text-[13px] font-medium">{T.emailDelivered}</span>
              </motion.div>
            )}
            {emailSent === false && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4"
              >
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-red-400 text-[13px] font-medium block">{T.emailFailed}</span>
                  <span className="text-red-400/60 text-[12px]">{T.emailFailedHint}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resend notification */}
          <AnimatePresence>
            {resendCount > 0 && emailSent === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <RefreshCw className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-purple-400 text-[12px] font-medium">
                    {T.resent} ({resendCount}x)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting animation */}
          {emailSent !== false && (
            <div className="flex items-center justify-center gap-2 text-t-muted text-[13px] mb-6">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {T.waiting}
            </div>
          )}

          {/* Expiry notice */}
          <p className="text-t-muted text-[12px] text-center mb-6">{T.expires}</p>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-[13px] text-center mb-4">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {/* Resend button */}
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              data-testid="resend-btn"
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-medium transition-all
                ${resendCooldown > 0 || resending
                  ? "bg-white/5 text-t-muted cursor-not-allowed"
                  : "bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/20"
                }`}
            >
              {resending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {resendCooldown > 0
                ? `${T.resendIn} ${resendCooldown}s`
                : T.resend
              }
            </button>

            {/* Back button */}
            <button
              onClick={handleCancel}
              data-testid="back-btn"
              className="text-t-muted hover:text-t-secondary text-[13px] transition-colors inline-flex items-center justify-center gap-1 py-2"
            >
              <ArrowLeft className="h-3 w-3" /> {T.otherEmail}
            </button>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-border">
            <Shield className="h-3 w-3 text-purple-400/50" />
            <span className="text-t-muted/50 text-[11px]">{T.securedBy}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );

  /* ============ FORM STATE ============ */
  return (
    <div className="max-w-sm mx-auto px-5 py-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-t-primary font-semibold text-[22px] mb-2">{T.title}</h1>
        <p className="text-t-secondary text-[13px] mb-6">{T.subtitle}</p>

        <div className="bg-surface border border-border rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[13px] text-t-secondary block mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="bg-bg border-border text-t-primary placeholder:text-t-muted h-11 rounded-lg text-[14px] focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
                placeholder="you@example.com"
                required
                autoFocus
                data-testid="login-email"
              />
            </div>
            {error && <p className="text-red-400 text-[13px]">{error}</p>}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[14px] font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              data-testid="login-submit"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? T.processing : T.btn}
            </motion.button>
          </form>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border">
            <Shield className="h-3 w-3 text-purple-400/40" />
            <span className="text-t-muted/40 text-[10px]">{T.securedBy}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
