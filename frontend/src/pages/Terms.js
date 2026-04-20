import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, AlertCircle, CreditCard, Package, Scale, ChevronRight } from "lucide-react";
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

export default function Terms() {
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
            {L({ fr: "Conditions d'utilisation", en: "Terms of Service", es: "Términos de servicio", pt: "Termos de serviço", de: "Nutzungsbedingungen", tr: "Kullanım Şartları", nl: "Gebruiksvoorwaarden", ar: "شروط الخدمة" }, lang)}
          </span>
        </div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-5">
            <FileText className="h-4 w-4" />
            {L({ fr: "Document légal", en: "Legal Document", es: "Documento legal", pt: "Documento legal", de: "Rechtsdokument", tr: "Yasal belge", nl: "Juridisch document", ar: "وثيقة قانونية" }, lang)}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            {L({ fr: "Conditions d'utilisation", en: "Terms of Service", es: "Términos de servicio", pt: "Termos de serviço", de: "Nutzungsbedingungen", tr: "Kullanım Şartları", nl: "Gebruiksvoorwaarden", ar: "شروط الخدمة" }, lang)}
          </h1>
          <p className="text-white/50 text-[14px]">
            {L({ fr: "Dernière mise à jour : juillet 2025", en: "Last updated: July 2025", es: "Última actualización: julio 2025", pt: "Última atualização: julho 2025", de: "Zuletzt aktualisiert: Juli 2025", tr: "Son güncelleme: Temmuz 2025", nl: "Laatst bijgewerkt: juli 2025", ar: "آخر تحديث: يوليو 2025" }, lang)}
          </p>
        </motion.div>

        <Section icon={ShieldCheck} title={L({ fr: "Acceptation des conditions", en: "Acceptance of Terms", es: "Aceptación de términos", pt: "Aceitação dos termos", de: "Akzeptanz der Bedingungen", tr: "Şartların kabulü", nl: "Acceptatie van voorwaarden", ar: "قبول الشروط" }, lang)}>
          <p>{L({ fr: "En accédant et en utilisant le site deezlink, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.", en: "By accessing and using the deezlink website, you agree to be bound by these terms of service. If you do not accept these terms, please do not use our service.", es: "Al acceder y utilizar el sitio deezlink, usted acepta estar sujeto a estos términos de servicio. Si no acepta estos términos, por favor no utilice nuestro servicio.", pt: "Ao acessar e usar o site deezlink, você concorda em ficar vinculado a estes termos de serviço. Se não aceitar estes termos, por favor não use nosso serviço.", de: "Durch den Zugriff auf und die Nutzung der deezlink-Website erklären Sie sich damit einverstanden, an diese Nutzungsbedingungen gebunden zu sein. Wenn Sie diese Bedingungen nicht akzeptieren, nutzen Sie unseren Service bitte nicht.", tr: "Deezlink web sitesine erişerek ve kullanarak bu kullanım şartlarına bağlı olmayı kabul etmiş olursunuz. Bu şartları kabul etmiyorsanız lütfen hizmetimizi kullanmayın.", nl: "Door de deezlink-website te bezoeken en te gebruiken, stemt u in met deze gebruiksvoorwaarden. Als u deze voorwaarden niet accepteert, gebruik onze service dan niet.", ar: "بالوصول إلى موقع deezlink واستخدامه، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا لم توافق على هذه الشروط، فيرجى عدم استخدام خدمتنا." }, lang)}</p>
        </Section>

        <Section icon={Package} title={L({ fr: "Description du service", en: "Service Description", es: "Descripción del servicio", pt: "Descrição do serviço", de: "Dienstbeschreibung", tr: "Hizmet açıklaması", nl: "Beschrijving van de dienst", ar: "وصف الخدمة" }, lang)}>
          <p>{L({ fr: "deezlink vend des liens d'activation permettant d'activer un abonnement Deezer Premium sur n'importe quel compte Deezer existant. Chaque lien est à usage unique et est livré par email après confirmation du paiement.", en: "deezlink sells activation links that allow activating a Deezer Premium subscription on any existing Deezer account. Each link is single-use and is delivered by email after payment confirmation.", es: "deezlink vende enlaces de activación que permiten activar una suscripción Deezer Premium en cualquier cuenta Deezer existente. Cada enlace es de uso único y se entrega por email tras la confirmación del pago.", pt: "deezlink vende links de ativação que permitem ativar uma assinatura Deezer Premium em qualquer conta Deezer existente. Cada link é de uso único e é entregue por email após a confirmação do pagamento.", de: "deezlink verkauft Aktivierungslinks, die die Aktivierung eines Deezer Premium-Abonnements auf jedem bestehenden Deezer-Konto ermöglichen. Jeder Link ist einmalig verwendbar und wird nach Zahlungsbestätigung per E-Mail geliefert.", tr: "deezlink, mevcut herhangi bir Deezer hesabında Deezer Premium aboneliğini etkinleştirmeye izin veren aktivasyon bağlantıları satar. Her bağlantı tek kullanımlıktır ve ödeme onayından sonra e-posta ile teslim edilir.", nl: "deezlink verkoopt activeringslinks waarmee u een Deezer Premium-abonnement kunt activeren op elk bestaand Deezer-account. Elke link is eenmalig te gebruiken en wordt per e-mail geleverd na betalingsbevestiging.", ar: "تبيع deezlink روابط تفعيل تتيح تفعيل اشتراك Deezer Premium على أي حساب Deezer موجود. كل رابط للاستخدام مرة واحدة ويتم تسليمه عبر البريد الإلكتروني بعد تأكيد الدفع." }, lang)}</p>
          <p>{L({ fr: "deezlink n'est pas affilié à Deezer SA. Les durées d'activation sont garanties pour un minimum d'un mois à compter de la date d'activation.", en: "deezlink is not affiliated with Deezer SA. Activation durations are guaranteed for a minimum of one month from the activation date.", es: "deezlink no está afiliado a Deezer SA. Las duraciones de activación están garantizadas por un mínimo de un mes desde la fecha de activación.", pt: "deezlink não é afiliado à Deezer SA. As durações de ativação são garantidas por um mínimo de um mês a partir da data de ativação.", de: "deezlink ist nicht mit Deezer SA verbunden. Aktivierungszeiträume sind ab dem Aktivierungsdatum für mindestens einen Monat garantiert.", tr: "deezlink, Deezer SA ile bağlantılı değildir. Aktivasyon süreleri, aktivasyon tarihinden itibaren minimum bir ay için garanti edilmektedir.", nl: "deezlink is niet gelieerd aan Deezer SA. Activeringsperiodes worden gegarandeerd voor minimaal één maand vanaf de activatiedatum.", ar: "deezlink غير مرتبط بـ Deezer SA. مدد التفعيل مضمونة لمدة شهر واحد على الأقل من تاريخ التفعيل." }, lang)}</p>
        </Section>

        <Section icon={CreditCard} title={L({ fr: "Paiement", en: "Payment", es: "Pago", pt: "Pagamento", de: "Zahlung", tr: "Ödeme", nl: "Betaling", ar: "الدفع" }, lang)}>
          <p>{L({ fr: "Les paiements sont effectués exclusivement en cryptomonnaie via la plateforme OxaPay (BTC, ETH, USDT, LTC et autres). Le paiement est dû intégralement au moment de la commande.", en: "Payments are made exclusively in cryptocurrency via the OxaPay platform (BTC, ETH, USDT, LTC and others). Payment is due in full at the time of order.", es: "Los pagos se realizan exclusivamente en criptomoneda a través de la plataforma OxaPay (BTC, ETH, USDT, LTC y otros). El pago es exigible en su totalidad en el momento del pedido.", pt: "Os pagamentos são feitos exclusivamente em criptomoeda via plataforma OxaPay (BTC, ETH, USDT, LTC e outros). O pagamento é devido integralmente no momento do pedido.", de: "Zahlungen erfolgen ausschließlich in Kryptowährung über die OxaPay-Plattform (BTC, ETH, USDT, LTC und andere). Die Zahlung ist zum Zeitpunkt der Bestellung in voller Höhe fällig.", tr: "Ödemeler yalnızca OxaPay platformu aracılığıyla kripto para birimiyle yapılmaktadır (BTC, ETH, USDT, LTC ve diğerleri). Ödeme, sipariş anında tamamen ödenmesi gerekmektedir.", nl: "Betalingen worden uitsluitend in cryptocurrency gedaan via het OxaPay-platform (BTC, ETH, USDT, LTC en andere). Betaling is in zijn geheel verschuldigd op het moment van bestelling.", ar: "تتم المدفوعات حصراً بالعملات المشفرة عبر منصة OxaPay (BTC، ETH، USDT، LTC وغيرها). الدفع مستحق بالكامل عند تقديم الطلب." }, lang)}</p>
          <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4">
            <p className="text-white/70 text-[13px]">
              {L({ fr: "⏱ Délai de livraison : les liens sont envoyés automatiquement par email dans les 5 minutes suivant la confirmation du paiement.", en: "⏱ Delivery time: links are sent automatically by email within 5 minutes of payment confirmation.", es: "⏱ Tiempo de entrega: los enlaces se envían automáticamente por email en 5 minutos tras la confirmación del pago.", pt: "⏱ Prazo de entrega: os links são enviados automaticamente por email em 5 minutos após a confirmação do pagamento.", de: "⏱ Lieferzeit: Links werden innerhalb von 5 Minuten nach Zahlungsbestätigung automatisch per E-Mail gesendet.", tr: "⏱ Teslimat süresi: ödeme onayından sonra 5 dakika içinde bağlantılar otomatik olarak e-posta ile gönderilir.", nl: "⏱ Levertijd: links worden automatisch per e-mail verzonden binnen 5 minuten na betalingsbevestiging.", ar: "⏱ وقت التسليم: يتم إرسال الروابط تلقائياً عبر البريد الإلكتروني في غضون 5 دقائق من تأكيد الدفع." }, lang)}
            </p>
          </div>
        </Section>

        <Section icon={AlertCircle} title={L({ fr: "Utilisation acceptable", en: "Acceptable Use", es: "Uso aceptable", pt: "Uso aceitável", de: "Akzeptable Nutzung", tr: "Kabul edilebilir kullanım", nl: "Aanvaardbaar gebruik", ar: "الاستخدام المقبول" }, lang)}>
          <p>{L({ fr: "Vous vous engagez à utiliser les liens d'activation uniquement pour votre usage personnel ou pour les comptes dont vous êtes l'administrateur légal. La revente des liens sans autorisation préalable est strictement interdite.", en: "You agree to use activation links only for your personal use or for accounts for which you are the legal administrator. Reselling links without prior authorization is strictly prohibited.", es: "Usted se compromete a utilizar los enlaces de activación únicamente para su uso personal o para cuentas de las que sea el administrador legal. La reventa de enlaces sin autorización previa está estrictamente prohibida.", pt: "Você concorda em usar os links de ativação apenas para seu uso pessoal ou para contas das quais você é o administrador legal. A revenda de links sem autorização prévia é estritamente proibida.", de: "Sie verpflichten sich, Aktivierungslinks nur für Ihren persönlichen Gebrauch oder für Konten zu verwenden, für die Sie der rechtmäßige Administrator sind. Der Weiterverkauf von Links ohne vorherige Genehmigung ist streng verboten.", tr: "Aktivasyon bağlantılarını yalnızca kişisel kullanımınız veya yasal yöneticisi olduğunuz hesaplar için kullanmayı kabul ediyorsunuz. Önceden izin almadan bağlantıların yeniden satışı kesinlikle yasaktır.", nl: "U stemt ermee in activeringslinks alleen te gebruiken voor persoonlijk gebruik of voor accounts waarvan u de wettelijke beheerder bent. Doorverkoop van links zonder voorafgaande toestemming is strikt verboden.", ar: "توافق على استخدام روابط التفعيل فقط للاستخدام الشخصي أو للحسابات التي أنت مديرها القانوني. إعادة بيع الروابط دون إذن مسبق محظور تماماً." }, lang)}</p>
        </Section>

        <Section icon={Scale} title={L({ fr: "Droit applicable", en: "Governing Law", es: "Ley aplicable", pt: "Lei aplicável", de: "Anwendbares Recht", tr: "Geçerli hukuk", nl: "Toepasselijk recht", ar: "القانون المطبق" }, lang)}>
          <p>{L({ fr: "Les présentes conditions sont régies par le droit français. Tout litige relatif à l'interprétation ou à l'exécution des présentes sera soumis aux tribunaux compétents de France.", en: "These terms are governed by French law. Any dispute relating to the interpretation or execution of these terms will be submitted to the competent courts of France.", es: "Estos términos se rigen por la ley francesa. Cualquier disputa relativa a la interpretación o ejecución de los mismos será sometida a los tribunales competentes de Francia.", pt: "Estes termos são regidos pela lei francesa. Qualquer litígio relativo à interpretação ou execução destes termos será submetido aos tribunais competentes da França.", de: "Diese Bedingungen unterliegen dem französischen Recht. Jeder Streit über die Auslegung oder Durchführung dieser Bedingungen wird den zuständigen Gerichten in Frankreich vorgelegt.", tr: "Bu şartlar Fransız hukukuna tabidir. Bu şartların yorumlanması veya uygulanmasına ilişkin herhangi bir anlaşmazlık Fransa'nın yetkili mahkemelerine sunulacaktır.", nl: "Deze voorwaarden worden beheerst door het Franse recht. Elk geschil over de interpretatie of uitvoering hiervan wordt voorgelegd aan de bevoegde rechtbanken in Frankrijk.", ar: "تخضع هذه الشروط للقانون الفرنسي. سيتم تقديم أي نزاع يتعلق بتفسير هذه الشروط أو تنفيذها إلى المحاكم المختصة في فرنسا." }, lang)}</p>
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
