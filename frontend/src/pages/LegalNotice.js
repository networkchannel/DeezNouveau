import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, FileText, Lock, Globe, Mail, ChevronRight } from "lucide-react";
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

export default function LegalNotice() {
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
            {L({ fr: "Mentions légales", en: "Legal Notice", es: "Aviso legal", pt: "Aviso legal", de: "Impressum", tr: "Yasal Uyarı", nl: "Juridische kennisgeving", ar: "إشعار قانوني" }, lang)}
          </span>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-5">
            <FileText className="h-4 w-4" />
            {L({ fr: "Document légal", en: "Legal Document", es: "Documento legal", pt: "Documento legal", de: "Rechtsdokument", tr: "Yasal belge", nl: "Juridisch document", ar: "وثيقة قانونية" }, lang)}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            {L({ fr: "Mentions légales", en: "Legal Notice", es: "Aviso legal", pt: "Aviso legal", de: "Impressum", tr: "Yasal Uyarı", nl: "Juridische kennisgeving", ar: "إشعار قانوني" }, lang)}
          </h1>
          <p className="text-white/50 text-[14px]">
            {L({ fr: "Dernière mise à jour : juillet 2025", en: "Last updated: July 2025", es: "Última actualización: julio 2025", pt: "Última atualização: julho 2025", de: "Zuletzt aktualisiert: Juli 2025", tr: "Son güncelleme: Temmuz 2025", nl: "Laatst bijgewerkt: juli 2025", ar: "آخر تحديث: يوليو 2025" }, lang)}
          </p>
        </motion.div>

        {/* Sections */}
        <Section icon={Globe} title={L({ fr: "Éditeur du site", en: "Site Publisher", es: "Editor del sitio", pt: "Editor do site", de: "Herausgeber", tr: "Site yayıncısı", nl: "Site-uitgever", ar: "ناشر الموقع" }, lang)}>
          <p>
            {L({
              fr: "Le site deezlink est édité à titre personnel par un particulier. Il s'agit d'un service en ligne permettant l'achat de liens d'activation Deezer Premium.",
              en: "The deezlink website is published on a personal basis by an individual. It is an online service for purchasing Deezer Premium activation links.",
              es: "El sitio deezlink es publicado a título personal por un particular. Se trata de un servicio en línea para la compra de enlaces de activación Deezer Premium.",
              pt: "O site deezlink é publicado a título pessoal por um particular. É um serviço online para a compra de links de ativação Deezer Premium.",
              de: "Die Website deezlink wird persönlich von einer Privatperson herausgegeben. Es handelt sich um einen Online-Dienst zum Kauf von Deezer Premium-Aktivierungslinks.",
              tr: "Deezlink web sitesi, bireysel bir kişi tarafından kişisel olarak yayınlanmaktadır. Deezer Premium aktivasyon bağlantıları satın almak için çevrimiçi bir hizmettir.",
              nl: "De deezlink-website wordt op persoonlijke basis gepubliceerd door een particulier. Het is een online dienst voor de aankoop van Deezer Premium-activeringslinks.",
              ar: "يُنشر موقع deezlink على أساس شخصي من قِبل فرد. إنها خدمة عبر الإنترنت لشراء روابط تفعيل Deezer Premium.",
            }, lang)}
          </p>
          <p>
            <strong className="text-white/80">{L({ fr: "Contact :", en: "Contact:", es: "Contacto:", pt: "Contato:", de: "Kontakt:", tr: "İletişim:", nl: "Contact:", ar: "التواصل:" }, lang)}</strong>{" "}
            support@deezlink.com
          </p>
        </Section>

        <Section icon={Shield} title={L({ fr: "Hébergement", en: "Hosting", es: "Alojamiento", pt: "Hospedagem", de: "Hosting", tr: "Barındırma", nl: "Hosting", ar: "الاستضافة" }, lang)}>
          <p>
            {L({
              fr: "Le site est hébergé sur des infrastructures cloud sécurisées. Les données sont stockées sur des serveurs situés dans l'Union Européenne.",
              en: "The website is hosted on secure cloud infrastructure. Data is stored on servers located in the European Union.",
              es: "El sitio está alojado en infraestructura cloud segura. Los datos se almacenan en servidores ubicados en la Unión Europea.",
              pt: "O site é hospedado em infraestrutura de nuvem segura. Os dados são armazenados em servidores localizados na União Europeia.",
              de: "Die Website wird auf sicherer Cloud-Infrastruktur gehostet. Daten werden auf Servern in der Europäischen Union gespeichert.",
              tr: "Web sitesi güvenli bulut altyapısında barındırılmaktadır. Veriler Avrupa Birliği'nde bulunan sunucularda depolanmaktadır.",
              nl: "De website is gehost op beveiligde cloudinfrastructuur. Gegevens worden opgeslagen op servers in de Europese Unie.",
              ar: "يُستضاف الموقع على بنية تحتية سحابية آمنة. يتم تخزين البيانات على خوادم تقع في الاتحاد الأوروبي.",
            }, lang)}
          </p>
        </Section>

        <Section icon={FileText} title={L({ fr: "Propriété intellectuelle", en: "Intellectual Property", es: "Propiedad intelectual", pt: "Propriedade intelectual", de: "Geistiges Eigentum", tr: "Fikri mülkiyet", nl: "Intellectueel eigendom", ar: "الملكية الفكرية" }, lang)}>
          <p>
            {L({
              fr: "L'ensemble des contenus présents sur le site deezlink (textes, images, graphismes, logo, icônes, code source) sont protégés par le droit de la propriété intellectuelle et sont la propriété exclusive de deezlink, sauf mentions contraires.",
              en: "All content on the deezlink website (texts, images, graphics, logo, icons, source code) is protected by intellectual property law and is the exclusive property of deezlink, unless otherwise stated.",
              es: "Todo el contenido del sitio deezlink (textos, imágenes, gráficos, logotipo, iconos, código fuente) está protegido por la ley de propiedad intelectual y es propiedad exclusiva de deezlink, salvo indicación contraria.",
              pt: "Todo o conteúdo do site deezlink (textos, imagens, gráficos, logotipo, ícones, código-fonte) é protegido pela lei de propriedade intelectual e é propriedade exclusiva do deezlink, salvo indicação em contrário.",
              de: "Alle Inhalte auf der deezlink-Website (Texte, Bilder, Grafiken, Logo, Icons, Quellcode) sind durch das Urheberrecht geschützt und sind ausschließliches Eigentum von deezlink, sofern nicht anders angegeben.",
              tr: "Deezlink web sitesindeki tüm içerikler (metinler, görseller, grafikler, logo, simgeler, kaynak kodu) fikri mülkiyet hukuku ile korunmakta ve aksi belirtilmedikçe deezlink'in münhasır mülkiyetindedir.",
              nl: "Alle inhoud op de deezlink-website (teksten, afbeeldingen, graphics, logo, iconen, broncode) is beschermd door intellectueel eigendomsrecht en is het exclusieve eigendom van deezlink, tenzij anders vermeld.",
              ar: "جميع المحتويات الموجودة على موقع deezlink (النصوص والصور والرسومات والشعار والأيقونات والكود المصدري) محمية بقانون الملكية الفكرية وهي ملك حصري لـ deezlink، ما لم يُذكر خلاف ذلك.",
            }, lang)}
          </p>
          <p>
            {L({
              fr: "Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.",
              en: "Any reproduction, representation, modification, publication, adaptation of all or part of the site's elements, regardless of the means or process used, is prohibited without prior written authorization.",
              es: "Cualquier reproducción, representación, modificación, publicación, adaptación de todo o parte de los elementos del sitio, independientemente del medio o proceso utilizado, está prohibida sin autorización escrita previa.",
              pt: "Qualquer reprodução, representação, modificação, publicação, adaptação de todos ou parte dos elementos do site, independentemente dos meios ou processos utilizados, é proibida sem autorização prévia por escrito.",
              de: "Jede Vervielfältigung, Darstellung, Änderung, Veröffentlichung, Anpassung aller oder eines Teils der Website-Elemente, unabhängig von den verwendeten Mitteln oder Verfahren, ist ohne vorherige schriftliche Genehmigung untersagt.",
              tr: "Kullanılan araç veya yöntemden bağımsız olarak sitenin tüm veya bir kısmının unsurlarının herhangi bir çoğaltılması, temsil edilmesi, değiştirilmesi, yayınlanması veya uyarlanması, önceden yazılı izin alınmadan yasaktır.",
              nl: "Elke reproductie, weergave, wijziging, publicatie, aanpassing van alle of een deel van de elementen van de site, ongeacht de gebruikte middelen of processen, is verboden zonder voorafgaande schriftelijke toestemming.",
              ar: "يُحظر أي نسخ أو تمثيل أو تعديل أو نشر أو تكييف لكل أو جزء من عناصر الموقع، بصرف النظر عن الوسائل أو الإجراءات المستخدمة، دون إذن كتابي مسبق.",
            }, lang)}
          </p>
        </Section>

        <Section icon={Lock} title={L({ fr: "Protection des données personnelles", en: "Personal Data Protection", es: "Protección de datos personales", pt: "Proteção de dados pessoais", de: "Datenschutz", tr: "Kişisel verilerin korunması", nl: "Bescherming van persoonsgegevens", ar: "حماية البيانات الشخصية" }, lang)}>
          <p>
            {L({
              fr: "Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition concernant vos données personnelles.",
              en: "In accordance with the General Data Protection Regulation (GDPR), you have the right to access, rectify, delete and object to the processing of your personal data.",
              es: "De conformidad con el Reglamento General de Protección de Datos (RGPD), usted tiene derecho a acceder, rectificar, suprimir y oponerse al tratamiento de sus datos personales.",
              pt: "Em conformidade com o Regulamento Geral de Proteção de Dados (RGPD), você tem o direito de acessar, retificar, excluir e se opor ao tratamento de seus dados pessoais.",
              de: "Gemäß der Datenschutz-Grundverordnung (DSGVO) haben Sie das Recht auf Zugang, Berichtigung, Löschung und Widerspruch bezüglich Ihrer personenbezogenen Daten.",
              tr: "Genel Veri Koruma Yönetmeliği'ne (GDPR) uygun olarak, kişisel verilerinize erişme, bunları düzeltme, silme ve işlenmesine itiraz etme hakkına sahipsiniz.",
              nl: "In overeenstemming met de Algemene Verordening Gegevensbescherming (AVG) heeft u het recht op toegang, rectificatie, verwijdering en bezwaar met betrekking tot uw persoonsgegevens.",
              ar: "وفقاً للائحة العامة لحماية البيانات (GDPR)، يحق لك الوصول إلى بياناتك الشخصية وتصحيحها وحذفها والاعتراض على معالجتها.",
            }, lang)}
          </p>
          <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4">
            <p className="text-white/70">
              {L({ fr: "Données collectées :", en: "Data collected:", es: "Datos recopilados:", pt: "Dados coletados:", de: "Erhobene Daten:", tr: "Toplanan veriler:", nl: "Verzamelde gegevens:", ar: "البيانات المجمعة:" }, lang)}
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-white/55 ml-1">
              <li>{L({ fr: "Adresse email (pour la livraison des liens)", en: "Email address (for link delivery)", es: "Dirección de email (para la entrega de enlaces)", pt: "Endereço de email (para entrega de links)", de: "E-Mail-Adresse (für die Link-Lieferung)", tr: "E-posta adresi (bağlantı teslimatı için)", nl: "E-mailadres (voor linkbezorging)", ar: "عنوان البريد الإلكتروني (لتسليم الروابط)" }, lang)}</li>
              <li>{L({ fr: "Données de paiement (gérées par OxaPay — non stockées)", en: "Payment data (managed by OxaPay — not stored)", es: "Datos de pago (gestionados por OxaPay — no almacenados)", pt: "Dados de pagamento (gerenciados pela OxaPay — não armazenados)", de: "Zahlungsdaten (verwaltet von OxaPay — nicht gespeichert)", tr: "Ödeme verileri (OxaPay tarafından yönetilir — depolanmaz)", nl: "Betalingsgegevens (beheerd door OxaPay — niet opgeslagen)", ar: "بيانات الدفع (تُدار بواسطة OxaPay — غير مخزنة)" }, lang)}</li>
              <li>{L({ fr: "Données de navigation anonymisées (analytics)", en: "Anonymized browsing data (analytics)", es: "Datos de navegación anonimizados (analíticas)", pt: "Dados de navegação anonimizados (analytics)", de: "Anonymisierte Browsing-Daten (Analytics)", tr: "Anonimleştirilmiş gezinme verileri (analitik)", nl: "Geanonimiseerde browsegegevens (analytics)", ar: "بيانات التصفح المجهولة (التحليلات)" }, lang)}</li>
            </ul>
          </div>
          <p>
            {L({
              fr: "Pour exercer vos droits ou pour toute question relative à vos données, contactez-nous à : support@deezlink.com",
              en: "To exercise your rights or for any questions regarding your data, contact us at: support@deezlink.com",
              es: "Para ejercer sus derechos o para cualquier pregunta relacionada con sus datos, contáctenos en: support@deezlink.com",
              pt: "Para exercer seus direitos ou para qualquer pergunta sobre seus dados, entre em contato conosco em: support@deezlink.com",
              de: "Um Ihre Rechte auszuüben oder für Fragen zu Ihren Daten wenden Sie sich an: support@deezlink.com",
              tr: "Haklarınızı kullanmak veya verilerinizle ilgili sorularınız için bizimle iletişime geçin: support@deezlink.com",
              nl: "Om uw rechten uit te oefenen of voor vragen over uw gegevens, neem contact met ons op via: support@deezlink.com",
              ar: "لممارسة حقوقك أو لأي أسئلة تتعلق ببياناتك، اتصل بنا على: support@deezlink.com",
            }, lang)}
          </p>
        </Section>

        <Section icon={Globe} title={L({ fr: "Cookies", en: "Cookies", es: "Cookies", pt: "Cookies", de: "Cookies", tr: "Çerezler", nl: "Cookies", ar: "ملفات تعريف الارتباط" }, lang)}>
          <p>
            {L({
              fr: "Le site utilise des cookies techniques strictement nécessaires au fonctionnement du service (session, panier). Aucun cookie de tracking ou de publicité n'est utilisé.",
              en: "The website uses strictly necessary technical cookies for the service to function (session, cart). No tracking or advertising cookies are used.",
              es: "El sitio utiliza cookies técnicas estrictamente necesarias para el funcionamiento del servicio (sesión, carrito). No se utilizan cookies de seguimiento ni publicitarias.",
              pt: "O site utiliza cookies técnicos estritamente necessários para o funcionamento do serviço (sessão, carrinho). Não são utilizados cookies de rastreamento ou publicitários.",
              de: "Die Website verwendet technisch notwendige Cookies für den Betrieb des Dienstes (Sitzung, Warenkorb). Es werden keine Tracking- oder Werbe-Cookies verwendet.",
              tr: "Web sitesi, hizmetin işlevselliği için kesinlikle gerekli teknik çerezler kullanmaktadır (oturum, sepet). Takip veya reklam çerezleri kullanılmamaktadır.",
              nl: "De website gebruikt strikt noodzakelijke technische cookies voor het functioneren van de dienst (sessie, winkelwagen). Er worden geen tracking- of advertentiecookies gebruikt.",
              ar: "يستخدم الموقع ملفات تعريف الارتباط التقنية الضرورية لعمل الخدمة (الجلسة، السلة). لا تُستخدم ملفات تعريف الارتباط للتتبع أو الإعلانات.",
            }, lang)}
          </p>
        </Section>

        <Section icon={Shield} title={L({ fr: "Limitation de responsabilité", en: "Limitation of Liability", es: "Limitación de responsabilidad", pt: "Limitação de responsabilidade", de: "Haftungsbeschränkung", tr: "Sorumluluk sınırlaması", nl: "Beperking van aansprakelijkheid", ar: "تحديد المسؤولية" }, lang)}>
          <p>
            {L({
              fr: "deezlink ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site ou de l'impossibilité d'y accéder. deezlink se réserve le droit de modifier ou d'interrompre le service à tout moment.",
              en: "deezlink cannot be held responsible for direct or indirect damages resulting from the use of the website or the inability to access it. deezlink reserves the right to modify or discontinue the service at any time.",
              es: "deezlink no podrá ser considerado responsable de daños directos o indirectos resultantes del uso del sitio o de la imposibilidad de acceder al mismo. deezlink se reserva el derecho de modificar o interrumpir el servicio en cualquier momento.",
              pt: "deezlink não pode ser responsabilizado por danos diretos ou indiretos resultantes do uso do site ou da impossibilidade de acessá-lo. deezlink reserva-se o direito de modificar ou descontinuar o serviço a qualquer momento.",
              de: "deezlink kann nicht für direkte oder indirekte Schäden verantwortlich gemacht werden, die aus der Nutzung der Website oder der Unmöglichkeit des Zugriffs darauf resultieren. deezlink behält sich das Recht vor, den Service jederzeit zu ändern oder einzustellen.",
              tr: "deezlink, web sitesinin kullanımından veya erişilememesinden kaynaklanan doğrudan veya dolaylı zararlardan sorumlu tutulamaz. deezlink, hizmeti istediği zaman değiştirme veya durdurma hakkını saklı tutar.",
              nl: "deezlink kan niet verantwoordelijk worden gehouden voor directe of indirecte schade die voortvloeit uit het gebruik van de website of de onmogelijkheid om deze te bereiken. deezlink behoudt zich het recht voor om de dienst op elk moment te wijzigen of te beëindigen.",
              ar: "لا يمكن تحميل deezlink المسؤولية عن الأضرار المباشرة أو غير المباشرة الناجمة عن استخدام الموقع أو عدم القدرة على الوصول إليه. يحتفظ deezlink بالحق في تعديل الخدمة أو إيقافها في أي وقت.",
            }, lang)}
          </p>
          <p>
            {L({
              fr: "Les produits vendus (liens d'activation Deezer Premium) sont fournis tels quels. deezlink n'est pas affilié à Deezer SA et n'est pas un distributeur officiel.",
              en: "The products sold (Deezer Premium activation links) are provided as-is. deezlink is not affiliated with Deezer SA and is not an official distributor.",
              es: "Los productos vendidos (enlaces de activación Deezer Premium) se proporcionan tal cual. deezlink no está afiliado a Deezer SA y no es un distribuidor oficial.",
              pt: "Os produtos vendidos (links de ativação Deezer Premium) são fornecidos no estado em que se encontram. deezlink não é afiliado à Deezer SA e não é um distribuidor oficial.",
              de: "Die verkauften Produkte (Deezer Premium-Aktivierungslinks) werden wie besehen bereitgestellt. deezlink ist nicht mit Deezer SA verbunden und kein offizieller Händler.",
              tr: "Satılan ürünler (Deezer Premium aktivasyon bağlantıları) olduğu gibi sağlanmaktadır. deezlink, Deezer SA ile bağlantılı değildir ve resmi bir distribütör değildir.",
              nl: "De verkochte producten (Deezer Premium-activeringslinks) worden geleverd zoals ze zijn. deezlink is niet gelieerd aan Deezer SA en is geen officiële distributeur.",
              ar: "المنتجات المباعة (روابط تفعيل Deezer Premium) مقدمة كما هي. deezlink غير مرتبط بـ Deezer SA وليس موزعاً رسمياً.",
            }, lang)}
          </p>
        </Section>

        <Section icon={Mail} title={L({ fr: "Contact", en: "Contact", es: "Contacto", pt: "Contato", de: "Kontakt", tr: "İletişim", nl: "Contact", ar: "التواصل" }, lang)}>
          <p>
            {L({
              fr: "Pour toute question d'ordre juridique ou relative au présent document, vous pouvez nous contacter :",
              en: "For any legal questions or questions related to this document, you can contact us:",
              es: "Para cualquier pregunta de carácter jurídico o relacionada con este documento, puede contactarnos:",
              pt: "Para qualquer dúvida de natureza jurídica ou relacionada a este documento, você pode nos contatar:",
              de: "Für rechtliche Fragen oder Fragen zu diesem Dokument können Sie uns kontaktieren:",
              tr: "Hukuki sorular veya bu belgeyle ilgili sorular için bizimle iletişime geçebilirsiniz:",
              nl: "Voor juridische vragen of vragen met betrekking tot dit document kunt u contact met ons opnemen:",
              ar: "لأي أسئلة قانونية أو أسئلة تتعلق بهذه الوثيقة، يمكنك التواصل معنا:",
            }, lang)}
          </p>
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 mt-2">
            <Mail className="h-4 w-4 text-violet-400 shrink-0" />
            <a href="mailto:support@deezlink.com" className="text-violet-300 hover:text-violet-200 transition-colors font-medium">
              support@deezlink.com
            </a>
          </div>
        </Section>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-white/80 transition-colors"
          >
            ← {L({ fr: "Retour à l'accueil", en: "Back to home", es: "Volver al inicio", pt: "Voltar ao início", de: "Zurück zur Startseite", tr: "Ana sayfaya dön", nl: "Terug naar home", ar: "العودة إلى الصفحة الرئيسية" }, lang)}
          </Link>
        </div>

      </div>
    </div>
  );
}
