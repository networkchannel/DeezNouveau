import { AlertCircle, Loader2 } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";

export function StripeCancelBanner({ lang }) {
  return (
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
  );
}

export function StripePollingBanner({ lang }) {
  return (
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
  );
}
