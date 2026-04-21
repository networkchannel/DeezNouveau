import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";
import StatusBadge from "./StatusBadge";

export default function OrderSummaryCard({ order, orderId, formattedDate, lang }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden mb-5"
      data-testid="order-summary-card"
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
  );
}
