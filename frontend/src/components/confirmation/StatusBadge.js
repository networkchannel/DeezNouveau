import { CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";

export default function StatusBadge({ status, lang }) {
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
