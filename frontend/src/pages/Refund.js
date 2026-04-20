import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { RefreshCcw, CheckCircle, XCircle, Clock, Mail, ChevronRight } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";
import Reveal from "@/components/Reveal";

const Section = ({ icon: Icon, title, children }) => (
  <Reveal>
    <div className="card-surface p-6 sm:p-8 mb-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-violet-400" />
        </div>
        <h2 className="text-white font-semibold text-[17px]">{title}</h2>
      </div>
      <div className="text-white/60 text-[14px] leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  </Reveal>
);

export default function Refund() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "fr";

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-white/40 mb-8">
          <Link to="/" className="hover:text-white/70 transition-colors">
            {L({ fr: "Accueil", en: "Home", es: "Inicio", pt: "Início", de: "Startseite", tr: "Ana Sayfa", nl: "Home", ar: "الرئيسية" }, lang)}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-white/60">
            {L({ fr: "Politique de remboursement", en: "Refund Policy", es: "Política de reembolso", pt: "Política de reembolso", de: "Rückerstattungsrichtlinie", tr: "İade Politikası", nl: "Terugbetalingsbeleid", ar: "سياسة الاسترداد" }, lang)}
          </span>
        </div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-5">
            <RefreshCcw className="h-4 w-4" />
            {L({ fr: "Politique de remboursement", en: "Refund Policy", es: "Política de reembolso", pt: "Política de reembolso", de: "Rückerstattungsrichtlinie", tr: "İade Politikası", nl: "Terugbetalingsbeleid", ar: "سياسة الاسترداد" }, lang)}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            {L({ fr: "Politique de remboursement", en: "Refund Policy", es: "Política de reembolso", pt: "Política de reembolso", de: "Rückerstattungsrichtlinie", tr: "İade Politikası", nl: "Terugbetalingsbeleid", ar: "سياسة الاسترداد" }, lang)}
          </h1>
          <p className="text-white/50 text-[14px]">
            {L({ fr: "Dernière mise à jour : juillet 2025", en: "Last updated: July 2025", es: "Última actualización: julio 2025", pt: "Última atualização: julho 2025", de: "Zuletzt aktualisiert: Juli 2025", tr: "Son güncelleme: Temmuz 2025", nl: "Laatst bijgewerkt: juli 2025", ar: "آخر تحديث: يوليو 2025" }, lang)}
          </p>
        </motion.div>

        {/* Summary cards */}
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="flex items-start gap-3 bg-green-500/8 border border-green-500/25 rounded-2xl p-4">
              <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white/80 font-semibold text-[13px] mb-1">{L({ fr: "Remboursement possible", en: "Refund possible", es: "Reembolso posible", pt: "Reembolso possível", de: "Erstattung möglich", tr: "İade mümkün", nl: "Terugbetaling mogelijk", ar: "الاسترداد ممكن" }, lang)}</p>
                <p className="text-white/50 text-[12px]">{L({ fr: "Lien non fonctionnel · Erreur de livraison · Produit non reçu", en: "Non-functional link · Delivery error · Product not received", es: "Enlace no funcional · Error de entrega · Producto no recibido", pt: "Link não funcional · Erro de entrega · Produto não recebido", de: "Nicht funktionierender Link · Lieferfehler · Produkt nicht erhalten", tr: "Çalışmayan bağlantı · Teslimat hatası · Ürün alınmadı", nl: "Niet-functionele link · Leveringsfout · Product niet ontvangen", ar: "رابط غير فعال · خطأ في التسليم · المنتج لم يُستلم" }, lang)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/25 rounded-2xl p-4">
              <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white/80 font-semibold text-[13px] mb-1">{L({ fr: "Non remboursable", en: "Non-refundable", es: "No reembolsable", pt: "Não reembolsável", de: "Nicht erstattungsfähig", tr: "İade edilemez", nl: "Niet terugbetaalbaar", ar: "غير قابل للاسترداد" }, lang)}</p>
                <p className="text-white/50 text-[12px]">{L({ fr: "Lien déjà utilisé · Changement d'avis · Mauvaise utilisation", en: "Already used link · Change of mind · Misuse", es: "Enlace ya utilizado · Cambio de opinión · Mal uso", pt: "Link já usado · Mudança de ideia · Uso indevido", de: "Bereits verwendeter Link · Meinungsänderung · Missbrauch", tr: "Zaten kullanılan bağlantı · Fikir değişikliği · Kötüye kullanım", nl: "Al gebruikte link · Van gedachten veranderd · Misbruik", ar: "رابط مستخدم بالفعل · تغيير الرأي · سوء الاستخدام" }, lang)}</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Section icon={CheckCircle} title={L({ fr: "Cas éligibles au remboursement", en: "Eligible Refund Cases", es: "Casos elegibles para reembolso", pt: "Casos elegíveis para reembolso", de: "Erstattungsfähige Fälle", tr: "İadeye uygun durumlar", nl: "In aanmerking komende terugbetalingsgevallen", ar: "حالات الاسترداد المؤهلة" }, lang)}>
          <p>{L({ fr: "Nous procédons au remboursement dans les situations suivantes :", en: "We process refunds in the following situations:", es: "Procesamos reembolsos en las siguientes situaciones:", pt: "Processamos reembolsos nas seguintes situações:", de: "Wir veranlassen Erstattungen in folgenden Situationen:", tr: "Aşağıdaki durumlarda iadeleri işleme alıyoruz:", nl: "Wij verwerken terugbetalingen in de volgende situaties:", ar: "نعالج عمليات الاسترداد في الحالات التالية:" }, lang)}</p>
          <ul className="space-y-2 list-disc list-inside ml-1 text-white/55">
            <li>{L({ fr: "Le lien d'activation ne fonctionne pas après utilisation correcte", en: "The activation link does not work after correct use", es: "El enlace de activación no funciona tras un uso correcto", pt: "O link de ativação não funciona após uso correto", de: "Der Aktivierungslink funktioniert nach korrekter Verwendung nicht", tr: "Aktivasyon bağlantısı doğru kullanımdan sonra çalışmıyor", nl: "De activeringslink werkt niet na correct gebruik", ar: "رابط التفعيل لا يعمل بعد الاستخدام الصحيح" }, lang)}</li>
            <li>{L({ fr: "Le lien n'a pas été livré dans les 30 minutes après paiement confirmé", en: "The link was not delivered within 30 minutes after confirmed payment", es: "El enlace no fue entregado en 30 minutos tras el pago confirmado", pt: "O link não foi entregue em 30 minutos após o pagamento confirmado", de: "Der Link wurde nicht innerhalb von 30 Minuten nach bestätigter Zahlung geliefert", tr: "Ödeme onaylandıktan sonra 30 dakika içinde bağlantı teslim edilmedi", nl: "De link is niet binnen 30 minuten na bevestigde betaling bezorgd", ar: "لم يتم تسليم الرابط في غضون 30 دقيقة بعد تأكيد الدفع" }, lang)}</li>
            <li>{L({ fr: "Le produit reçu ne correspond pas à la description (durée, type)", en: "The product received does not match the description (duration, type)", es: "El producto recibido no corresponde a la descripción (duración, tipo)", pt: "O produto recebido não corresponde à descrição (duração, tipo)", de: "Das erhaltene Produkt entspricht nicht der Beschreibung (Dauer, Typ)", tr: "Alınan ürün açıklamayla uyuşmuyor (süre, tür)", nl: "Het ontvangen product komt niet overeen met de beschrijving (duur, type)", ar: "المنتج المستلم لا يتطابق مع الوصف (المدة، النوع)" }, lang)}</li>
            <li>{L({ fr: "Double facturation / erreur de paiement", en: "Double billing / payment error", es: "Doble facturación / error de pago", pt: "Cobrança dupla / erro de pagamento", de: "Doppelabrechnung / Zahlungsfehler", tr: "Çift fatura / ödeme hatası", nl: "Dubbele facturering / betalingsfout", ar: "الفوترة المزدوجة / خطأ في الدفع" }, lang)}</li>
          </ul>
        </Section>

        <Section icon={Clock} title={L({ fr: "Délai de traitement", en: "Processing Time", es: "Plazo de tramitación", pt: "Prazo de processamento", de: "Bearbeitungszeit", tr: "İşlem süresi", nl: "Verwerkingstijd", ar: "وقت المعالجة" }, lang)}>
          <p>{L({ fr: "Les demandes de remboursement doivent être soumises dans les 48 heures suivant la commande. Passé ce délai, aucun remboursement ne pourra être traité.", en: "Refund requests must be submitted within 48 hours of the order. After this period, no refund can be processed.", es: "Las solicitudes de reembolso deben presentarse en las 48 horas siguientes al pedido. Pasado este plazo, no se podrá tramitar ningún reembolso.", pt: "Os pedidos de reembolso devem ser enviados dentro de 48 horas após o pedido. Após esse prazo, nenhum reembolso poderá ser processado.", de: "Erstattungsanfragen müssen innerhalb von 48 Stunden nach der Bestellung eingereicht werden. Nach Ablauf dieser Frist können keine Erstattungen bearbeitet werden.", tr: "İade talepleri, siparişten sonraki 48 saat içinde sunulmalıdır. Bu sürenin ardından hiçbir iade işleme alınamaz.", nl: "Terugbetalingsverzoeken moeten binnen 48 uur na de bestelling worden ingediend. Na deze periode kan geen terugbetaling worden verwerkt.", ar: "يجب تقديم طلبات الاسترداد في غضون 48 ساعة من الطلب. بعد هذا الموعد، لا يمكن معالجة أي استرداد." }, lang)}</p>
          <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4">
            <p className="text-white/70 text-[13px]">
              {L({ fr: "⏱ Une fois votre demande approuvée, le remboursement est effectué dans les 3 à 5 jours ouvrés en cryptomonnaie vers l'adresse de départ.", en: "⏱ Once your request is approved, the refund is processed within 3 to 5 business days in cryptocurrency to the original address.", es: "⏱ Una vez aprobada su solicitud, el reembolso se efectúa en 3 a 5 días hábiles en criptomoneda a la dirección de origen.", pt: "⏱ Após a aprovação do seu pedido, o reembolso é efetuado em 3 a 5 dias úteis em criptomoeda para o endereço original.", de: "⏱ Nach Genehmigung Ihres Antrags wird die Erstattung innerhalb von 3 bis 5 Werktagen in Kryptowährung an die ursprüngliche Adresse veranlasst.", tr: "⏱ Talebiniz onaylandıktan sonra, geri ödeme 3 ila 5 iş günü içinde orijinal adrese kripto para olarak yapılmaktadır.", nl: "⏱ Zodra uw verzoek is goedgekeurd, wordt de terugbetaling binnen 3 tot 5 werkdagen in cryptocurrency naar het oorspronkelijke adres verwerkt.", ar: "⏱ بمجرد الموافقة على طلبك، يتم معالجة الاسترداد في غضون 3 إلى 5 أيام عمل بالعملات المشفرة إلى العنوان الأصلي." }, lang)}
            </p>
          </div>
        </Section>

        <Section icon={XCircle} title={L({ fr: "Cas non remboursables", en: "Non-Refundable Cases", es: "Casos no reembolsables", pt: "Casos não reembolsáveis", de: "Nicht erstattungsfähige Fälle", tr: "İade edilemeyen durumlar", nl: "Niet-terugbetaalbare gevallen", ar: "حالات غير قابلة للاسترداد" }, lang)}>
          <ul className="space-y-2 list-disc list-inside ml-1 text-white/55">
            <li>{L({ fr: "Le lien a déjà été utilisé avec succès", en: "The link has already been successfully used", es: "El enlace ya ha sido utilizado con éxito", pt: "O link já foi usado com sucesso", de: "Der Link wurde bereits erfolgreich verwendet", tr: "Bağlantı zaten başarıyla kullanıldı", nl: "De link is al succesvol gebruikt", ar: "تم استخدام الرابط بنجاح بالفعل" }, lang)}</li>
            <li>{L({ fr: "Simple changement d'avis après réception", en: "Simply changing your mind after receipt", es: "Simple cambio de opinión después de la recepción", pt: "Simples mudança de opinião após o recebimento", de: "Einfache Meinungsänderung nach Erhalt", tr: "Teslimat sonrası fikir değişikliği", nl: "Eenvoudig van gedachten veranderen na ontvangst", ar: "مجرد تغيير الرأي بعد الاستلام" }, lang)}</li>
            <li>{L({ fr: "Mauvaise utilisation du lien (mauvais compte Deezer)", en: "Incorrect use of the link (wrong Deezer account)", es: "Uso incorrecto del enlace (cuenta Deezer incorrecta)", pt: "Uso incorreto do link (conta Deezer errada)", de: "Falsche Verwendung des Links (falsches Deezer-Konto)", tr: "Bağlantının yanlış kullanımı (yanlış Deezer hesabı)", nl: "Onjuist gebruik van de link (verkeerd Deezer-account)", ar: "الاستخدام الخاطئ للرابط (حساب Deezer خاطئ)" }, lang)}</li>
            <li>{L({ fr: "Demande soumise après le délai de 48 heures", en: "Request submitted after the 48-hour deadline", es: "Solicitud presentada después del plazo de 48 horas", pt: "Pedido enviado após o prazo de 48 horas", de: "Antrag nach der 48-Stunden-Frist eingereicht", tr: "48 saatlik süreden sonra sunulan talep", nl: "Verzoek ingediend na de termijn van 48 uur", ar: "الطلب المقدم بعد مرور 48 ساعة" }, lang)}</li>
          </ul>
        </Section>

        <Section icon={Mail} title={L({ fr: "Soumettre une demande", en: "Submit a Request", es: "Enviar una solicitud", pt: "Enviar uma solicitação", de: "Einen Antrag stellen", tr: "Talep gönderin", nl: "Een verzoek indienen", ar: "تقديم طلب" }, lang)}>
          <p>{L({ fr: "Pour soumettre une demande de remboursement, contactez notre support en indiquant votre numéro de commande, l'adresse email utilisée lors de l'achat et la description du problème rencontré.", en: "To submit a refund request, contact our support with your order number, the email address used at purchase, and a description of the issue encountered.", es: "Para enviar una solicitud de reembolso, contacte con nuestro soporte indicando su número de pedido, la dirección de email utilizada en la compra y la descripción del problema.", pt: "Para enviar uma solicitação de reembolso, entre em contato com nosso suporte informando seu número de pedido, o endereço de email usado na compra e uma descrição do problema.", de: "Um einen Erstattungsantrag zu stellen, kontaktieren Sie unseren Support mit Ihrer Bestellnummer, der beim Kauf verwendeten E-Mail-Adresse und einer Beschreibung des aufgetretenen Problems.", tr: "İade talebi göndermek için sipariş numaranızı, satın alımda kullandığınız e-posta adresini ve karşılaştığınız sorunun açıklamasını belirterek destek ekibimizle iletişime geçin.", nl: "Om een terugbetalingsverzoek in te dienen, neem contact op met onze support met uw bestelnummer, het e-mailadres dat bij de aankoop is gebruikt en een beschrijving van het probleem.", ar: "لتقديم طلب استرداد، تواصل مع دعمنا مع رقم طلبك وعنوان البريد الإلكتروني المستخدم عند الشراء ووصف المشكلة التي واجهتها." }, lang)}</p>
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 mt-2">
            <Mail className="h-4 w-4 text-violet-400 shrink-0" />
            <a href="mailto:support@deezlink.com" className="text-violet-300 hover:text-violet-200 transition-colors font-medium">support@deezlink.com</a>
          </div>
        </Section>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-white/80 transition-colors">
            ← {L({ fr: "Retour à l'accueil", en: "Back to home", es: "Volver al inicio", pt: "Voltar ao início", de: "Zurück zur Startseite", tr: "Ana sayfaya dön", nl: "Terug naar home", ar: "العودة إلى الصفحة الرئيسية" }, lang)}
          </Link>
        </div>

      </div>
    </div>
  );
}
