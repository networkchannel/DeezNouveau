import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lock, Eye, Database, ShieldCheck, Bell, Mail, ChevronRight } from "lucide-react";
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

export default function Privacy() {
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
            {L({ fr: "Politique de confidentialité", en: "Privacy Policy", es: "Política de privacidad", pt: "Política de privacidade", de: "Datenschutzrichtlinie", tr: "Gizlilik Politikası", nl: "Privacybeleid", ar: "سياسة الخصوصية" }, lang)}
          </span>
        </div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-5">
            <Lock className="h-4 w-4" />
            {L({ fr: "Vos données, notre responsabilité", en: "Your data, our responsibility", es: "Tus datos, nuestra responsabilidad", pt: "Seus dados, nossa responsabilidade", de: "Ihre Daten, unsere Verantwortung", tr: "Verileriniz, sorumluluğumuz", nl: "Uw gegevens, onze verantwoordelijkheid", ar: "بياناتك، مسؤوليتنا" }, lang)}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            {L({ fr: "Politique de confidentialité", en: "Privacy Policy", es: "Política de privacidad", pt: "Política de privacidade", de: "Datenschutzrichtlinie", tr: "Gizlilik Politikası", nl: "Privacybeleid", ar: "سياسة الخصوصية" }, lang)}
          </h1>
          <p className="text-white/50 text-[14px]">
            {L({ fr: "Dernière mise à jour : juillet 2025", en: "Last updated: July 2025", es: "Última actualización: julio 2025", pt: "Última atualização: julho 2025", de: "Zuletzt aktualisiert: Juli 2025", tr: "Son güncelleme: Temmuz 2025", nl: "Laatst bijgewerkt: juli 2025", ar: "آخر تحديث: يوليو 2025" }, lang)}
          </p>
        </motion.div>

        <Section icon={Database} title={L({ fr: "Données collectées", en: "Data We Collect", es: "Datos que recopilamos", pt: "Dados que coletamos", de: "Erhobene Daten", tr: "Topladığımız veriler", nl: "Gegevens die we verzamelen", ar: "البيانات التي نجمعها" }, lang)}>
          <p>{L({ fr: "Nous collectons uniquement les données strictement nécessaires au fonctionnement du service :", en: "We collect only the data strictly necessary for the service to function:", es: "Recopilamos únicamente los datos estrictamente necesarios para el funcionamiento del servicio:", pt: "Coletamos apenas os dados estritamente necessários para o funcionamento do serviço:", de: "Wir erheben nur die Daten, die für das Funktionieren des Dienstes unbedingt erforderlich sind:", tr: "Yalnızca hizmetin işlevselliği için kesinlikle gerekli verileri topluyoruz:", nl: "Wij verzamelen alleen gegevens die strikt noodzakelijk zijn voor het functioneren van de dienst:", ar: "نجمع فقط البيانات الضرورية بشكل صارم لعمل الخدمة:" }, lang)}</p>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2">
            {[
              { label: L({ fr: "Adresse email", en: "Email address", es: "Dirección de email", pt: "Endereço de email", de: "E-Mail-Adresse", tr: "E-posta adresi", nl: "E-mailadres", ar: "عنوان البريد الإلكتروني" }, lang), desc: L({ fr: "Pour la livraison des liens et le suivi de commande", en: "For link delivery and order tracking", es: "Para la entrega de enlaces y el seguimiento del pedido", pt: "Para entrega de links e rastreamento do pedido", de: "Für die Link-Lieferung und die Auftragsverfolgung", tr: "Bağlantı teslimatı ve sipariş takibi için", nl: "Voor linkbezorging en ordertracking", ar: "لتسليم الروابط وتتبع الطلب" }, lang) },
              { label: L({ fr: "Adresse IP anonymisée", en: "Anonymized IP address", es: "Dirección IP anonimizada", pt: "Endereço IP anonimizado", de: "Anonymisierte IP-Adresse", tr: "Anonimleştirilmiş IP adresi", nl: "Geanonimiseerd IP-adres", ar: "عنوان IP المجهول" }, lang), desc: L({ fr: "Pour la sécurité et la prévention des fraudes", en: "For security and fraud prevention", es: "Para seguridad y prevención de fraudes", pt: "Para segurança e prevenção de fraudes", de: "Für Sicherheit und Betrugsprävention", tr: "Güvenlik ve dolandırıcılık önleme için", nl: "Voor beveiliging en fraudepreventie", ar: "للأمان ومنع الاحتيال" }, lang) },
              { label: L({ fr: "Données de transaction", en: "Transaction data", es: "Datos de transacción", pt: "Dados de transação", de: "Transaktionsdaten", tr: "İşlem verileri", nl: "Transactiegegevens", ar: "بيانات المعاملة" }, lang), desc: L({ fr: "Gérées par OxaPay — non stockées par deezlink", en: "Managed by OxaPay — not stored by deezlink", es: "Gestionadas por OxaPay — no almacenadas por deezlink", pt: "Gerenciadas pela OxaPay — não armazenadas pela deezlink", de: "Von OxaPay verwaltet — nicht von deezlink gespeichert", tr: "OxaPay tarafından yönetilir — deezlink tarafından depolanmaz", nl: "Beheerd door OxaPay — niet opgeslagen door deezlink", ar: "تُدار بواسطة OxaPay — غير مخزنة من قِبل deezlink" }, lang) },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                <div>
                  <span className="text-white/80 font-medium">{item.label}</span>
                  <span className="text-white/45"> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Eye} title={L({ fr: "Utilisation des données", en: "How We Use Your Data", es: "Cómo usamos tus datos", pt: "Como usamos seus dados", de: "Verwendung Ihrer Daten", tr: "Verilerinizi nasıl kullanıyoruz", nl: "Hoe we uw gegevens gebruiken", ar: "كيف نستخدم بياناتك" }, lang)}>
          <p>{L({ fr: "Vos données sont utilisées exclusivement pour :", en: "Your data is used exclusively for:", es: "Sus datos se utilizan exclusivamente para:", pt: "Seus dados são usados exclusivamente para:", de: "Ihre Daten werden ausschließlich verwendet für:", tr: "Verileriniz yalnızca şunlar için kullanılmaktadır:", nl: "Uw gegevens worden uitsluitend gebruikt voor:", ar: "تُستخدم بياناتك حصراً من أجل:" }, lang)}</p>
          <ul className="space-y-1.5 list-disc list-inside ml-1 text-white/55">
            <li>{L({ fr: "La livraison de vos commandes par email", en: "Delivering your orders by email", es: "La entrega de sus pedidos por email", pt: "A entrega de seus pedidos por email", de: "Die Lieferung Ihrer Bestellungen per E-Mail", tr: "Siparişlerinizi e-posta ile teslim etmek", nl: "Het bezorgen van uw bestellingen per e-mail", ar: "تسليم طلباتك عبر البريد الإلكتروني" }, lang)}</li>
            <li>{L({ fr: "Le suivi et l'historique de vos commandes", en: "Tracking and history of your orders", es: "El seguimiento e historial de sus pedidos", pt: "O rastreamento e histórico dos seus pedidos", de: "Die Verfolgung und Geschichte Ihrer Bestellungen", tr: "Siparişlerinizin takibi ve geçmişi", nl: "Het bijhouden en de geschiedenis van uw bestellingen", ar: "تتبع طلباتك وسجلها" }, lang)}</li>
            <li>{L({ fr: "La prévention des fraudes et la sécurité", en: "Fraud prevention and security", es: "La prevención de fraudes y seguridad", pt: "Prevenção de fraudes e segurança", de: "Betrugsvorbeugung und Sicherheit", tr: "Dolandırıcılık önleme ve güvenlik", nl: "Fraudepreventie en beveiliging", ar: "منع الاحتيال والأمان" }, lang)}</li>
            <li>{L({ fr: "Le support client", en: "Customer support", es: "El soporte al cliente", pt: "Suporte ao cliente", de: "Den Kundendienst", tr: "Müşteri desteği", nl: "Klantenondersteuning", ar: "دعم العملاء" }, lang)}</li>
          </ul>
          <p>{L({ fr: "Nous ne vendons, ne louons ni ne partageons vos données avec des tiers à des fins commerciales.", en: "We do not sell, rent or share your data with third parties for commercial purposes.", es: "No vendemos, alquilamos ni compartimos sus datos con terceros con fines comerciales.", pt: "Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins comerciais.", de: "Wir verkaufen, vermieten oder teilen Ihre Daten nicht mit Dritten zu kommerziellen Zwecken.", tr: "Verilerinizi ticari amaçlarla üçüncü taraflara satmıyor, kiralamıyor veya paylaşmıyoruz.", nl: "Wij verkopen, verhuren of delen uw gegevens niet met derden voor commerciële doeleinden.", ar: "لا نبيع بياناتك ولا نستأجرها ولا نشاركها مع أطراف ثالثة لأغراض تجارية." }, lang)}</p>
        </Section>

        <Section icon={ShieldCheck} title={L({ fr: "Vos droits (RGPD)", en: "Your Rights (GDPR)", es: "Sus derechos (RGPD)", pt: "Seus direitos (LGPD/RGPD)", de: "Ihre Rechte (DSGVO)", tr: "Haklarınız (GDPR)", nl: "Uw rechten (AVG)", ar: "حقوقك (GDPR)" }, lang)}>
          <p>{L({ fr: "Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :", en: "In accordance with GDPR, you have the following rights regarding your personal data:", es: "De conformidad con el RGPD, usted tiene los siguientes derechos en relación con sus datos personales:", pt: "Em conformidade com o RGPD, você tem os seguintes direitos em relação aos seus dados pessoais:", de: "Gemäß DSGVO haben Sie folgende Rechte bezüglich Ihrer personenbezogenen Daten:", tr: "GDPR'ye uygun olarak, kişisel verilerinizle ilgili aşağıdaki haklara sahipsiniz:", nl: "In overeenstemming met de AVG heeft u de volgende rechten met betrekking tot uw persoonsgegevens:", ar: "وفقاً للـ GDPR، لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية:" }, lang)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              L({ fr: "Droit d'accès", en: "Right of access", es: "Derecho de acceso", pt: "Direito de acesso", de: "Auskunftsrecht", tr: "Erişim hakkı", nl: "Recht op inzage", ar: "حق الوصول" }, lang),
              L({ fr: "Droit de rectification", en: "Right to rectification", es: "Derecho de rectificación", pt: "Direito de retificação", de: "Berichtigungsrecht", tr: "Düzeltme hakkı", nl: "Recht op rectificatie", ar: "حق التصحيح" }, lang),
              L({ fr: "Droit à l'effacement", en: "Right to erasure", es: "Derecho al olvido", pt: "Direito ao esquecimento", de: "Recht auf Löschung", tr: "Silinme hakkı", nl: "Recht op verwijdering", ar: "حق المحو" }, lang),
              L({ fr: "Droit à la portabilité", en: "Right to portability", es: "Derecho a la portabilidad", pt: "Direito à portabilidade", de: "Recht auf Datenübertragbarkeit", tr: "Taşınabilirlik hakkı", nl: "Recht op overdraagbaarheid", ar: "حق قابلية النقل" }, lang),
              L({ fr: "Droit d'opposition", en: "Right to object", es: "Derecho de oposición", pt: "Direito de oposição", de: "Widerspruchsrecht", tr: "İtiraz hakkı", nl: "Recht van bezwaar", ar: "حق الاعتراض" }, lang),
              L({ fr: "Droit à la limitation", en: "Right to restriction", es: "Derecho a la limitación", pt: "Direito à limitação", de: "Recht auf Einschränkung", tr: "Kısıtlama hakkı", nl: "Recht op beperking", ar: "حق التقييد" }, lang),
            ].map((right, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                <span className="text-white/70 text-[13px]">{right}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Bell} title={L({ fr: "Conservation des données", en: "Data Retention", es: "Retención de datos", pt: "Retenção de dados", de: "Datenspeicherung", tr: "Veri saklama", nl: "Gegevensretentie", ar: "الاحتفاظ بالبيانات" }, lang)}>
          <p>{L({ fr: "Vos données personnelles sont conservées pendant 24 mois à compter de votre dernière commande, sauf obligation légale contraire. Passé ce délai, elles sont automatiquement supprimées ou anonymisées.", en: "Your personal data is retained for 24 months from your last order, unless required by law. After this period, they are automatically deleted or anonymized.", es: "Sus datos personales se conservan durante 24 meses desde su último pedido, salvo obligación legal contraria. Transcurrido este plazo, se eliminan automáticamente o se anonimizan.", pt: "Seus dados pessoais são mantidos por 24 meses a partir do seu último pedido, salvo obrigação legal contrária. Após esse prazo, são automaticamente excluídos ou anonimizados.", de: "Ihre personenbezogenen Daten werden 24 Monate ab Ihrer letzten Bestellung aufbewahrt, sofern keine gesetzliche Verpflichtung entgegensteht. Nach Ablauf dieser Frist werden sie automatisch gelöscht oder anonymisiert.", tr: "Kişisel verileriniz, son siparişinizden itibaren 24 ay boyunca saklanır; yasal yükümlülük olmadıkça. Bu sürenin sonunda otomatik olarak silinir veya anonimleştirilir.", nl: "Uw persoonsgegevens worden bewaard gedurende 24 maanden na uw laatste bestelling, tenzij wettelijk vereist. Na deze periode worden ze automatisch verwijderd of geanonimiseerd.", ar: "يتم الاحتفاظ ببياناتك الشخصية لمدة 24 شهراً من آخر طلب لك، ما لم يكن هناك التزام قانوني بخلاف ذلك. بعد هذه المدة، يتم حذفها تلقائياً أو إخفاء هويتها." }, lang)}</p>
        </Section>

        <Section icon={Mail} title={L({ fr: "Contact DPO", en: "DPO Contact", es: "Contacto DPO", pt: "Contato DPO", de: "DPO-Kontakt", tr: "DPO İletişim", nl: "DPO Contact", ar: "اتصل بـ DPO" }, lang)}>
          <p>{L({ fr: "Pour exercer vos droits ou pour toute question relative à vos données personnelles :", en: "To exercise your rights or for any questions about your personal data:", es: "Para ejercer sus derechos o para cualquier pregunta sobre sus datos personales:", pt: "Para exercer seus direitos ou para qualquer dúvida sobre seus dados pessoais:", de: "Um Ihre Rechte auszuüben oder für Fragen zu Ihren personenbezogenen Daten:", tr: "Haklarınızı kullanmak veya kişisel verilerinizle ilgili sorularınız için:", nl: "Om uw rechten uit te oefenen of voor vragen over uw persoonsgegevens:", ar: "لممارسة حقوقك أو لأي أسئلة تتعلق ببياناتك الشخصية:" }, lang)}</p>
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
