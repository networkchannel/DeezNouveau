import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import axios from "axios";
import { Package, Clock, Lock, ArrowRight } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export default function OrderHistory() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.email) {
      setLoading(true);
      axios.get(`${API}/orders/history/${encodeURIComponent(user.email)}`, { withCredentials: true })
        .then(r => setOrders(r.data.orders || []))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  // Not authenticated — show login required
  if (!authLoading && (!user || !user.email)) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-7 w-7 text-purple-400" />
          </div>
          <h2 className="text-t-primary font-semibold text-[20px] mb-2">
            {L({ fr: "Connexion requise", en: "Login required", es: "Inicio de sesión requerido", pt: "Login necessário", de: "Anmeldung erforderlich", tr: "Giriş gerekli", nl: "Inloggen vereist", ar: "مطلوب تسجيل الدخول" }, lang)}
          </h2>
          <p className="text-t-secondary text-[14px] mb-6">
            {L({ fr: "Connectez-vous pour accéder à votre historique de commandes.", en: "Sign in to access your order history.", es: "Inicia sesión para ver tu historial de pedidos.", pt: "Entre para acessar seu histórico de pedidos.", de: "Melden Sie sich an, um Ihren Bestellverlauf zu sehen.", tr: "Sipariş geçmişinize erişmek için giriş yapın.", nl: "Log in om uw bestelgeschiedenis te bekijken.", ar: "سجل الدخول للوصول إلى سجل طلباتك." }, lang)}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-[14px] font-medium rounded-xl transition-colors"
          >
            {L({ fr: "Se connecter", en: "Sign in", es: "Entrar", pt: "Entrar", de: "Anmelden", tr: "Giriş yap", nl: "Inloggen", ar: "تسجيل الدخول" }, lang)}
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <div className="animate-pulse text-t-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-t-primary font-semibold text-[22px] mb-1">
          {lang === "fr" ? "Mes commandes" : "My orders"}
        </h1>
        <p className="text-t-secondary text-[13px] mb-8">{user.email}</p>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-8 w-8 text-t-muted mx-auto mb-3" />
            <p className="text-t-muted text-[14px]">
              {L({ fr: "Aucune commande", en: "No orders yet", es: "Sin pedidos aún", pt: "Nenhum pedido ainda", de: "Noch keine Bestellungen", tr: "Henüz sipariş yok", nl: "Nog geen bestellingen", ar: "لا توجد طلبات بعد" }, lang)}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div
                key={order.order_id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface border border-border rounded-xl p-4 hover:border-purple-500/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/order/${order.order_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-t-primary text-[14px] font-medium">
                      #{order.order_id}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-t-muted text-[12px]">
                        {order.quantity} {L({ fr: "liens", en: "links", es: "enlaces", pt: "links", de: "Links", tr: "bağlantı", nl: "links", ar: "روابط" }, lang)}
                      </span>
                      <span className="text-t-muted text-[12px] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString(lang)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-semibold text-[16px]">{order.total_price?.toFixed(2)}€</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      order.status === "completed" ? "bg-green-500/10 text-green-400" :
                      order.status === "pending" || order.status === "payment_mock" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-zinc-500/10 text-zinc-400"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
