import { motion } from "framer-motion";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { pickLang as L } from "@/utils/langPick";
import LinkCard from "./LinkCard";

export default function LinksSection({
  order,
  lang,
  copiedIdx,
  copiedAll,
  onCopyLink,
  onCopyAll,
  onDownload,
  onShare,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden mb-5"
    >
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-white font-medium text-[14px]">
            {L({ fr: "Vos liens d'activation", en: "Your activation links", es: "Tus enlaces de activación", pt: "Seus links de ativação", de: "Ihre Aktivierungslinks", tr: "Aktivasyon bağlantılarınız", nl: "Uw activeringslinks", ar: "روابط التفعيل الخاصة بك" }, lang)}
          </span>
          <span className="text-white/30 text-[12px]">({order.links.length})</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {order.links.map((link, idx) => (
          <LinkCard
            key={typeof link === "string" ? link : (link?.id || link?.url || idx)}
            link={link}
            index={idx}
            copiedIdx={copiedIdx}
            onCopy={onCopyLink}
          />
        ))}
      </div>

      <div className="px-4 py-3.5 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
        <motion.button
          onClick={onCopyAll}
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
            ? (L({ fr: "Copie !", en: "Copied!", es: "¡Copiado!", pt: "Copiado!", de: "Kopiert!", tr: "Kopyalandı!", nl: "Gekopieerd!", ar: "تم النسخ!" }, lang))
            : (L({ fr: "Copier tout", en: "Copy all", es: "Copiar todo", pt: "Copiar tudo", de: "Alles kopieren", tr: "Tümünü kopyala", nl: "Alles kopiëren", ar: "نسخ الكل" }, lang))}
        </motion.button>

        <motion.button
          onClick={onDownload}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          {L({ fr: "Telecharger .txt", en: "Download .txt", es: "Descargar .txt", pt: "Baixar .txt", de: ".txt herunterladen", tr: ".txt indir", nl: ".txt downloaden", ar: "تنزيل .txt" }, lang)}
        </motion.button>

        <motion.button
          onClick={onShare}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all"
          title={L({ fr: "Partager", en: "Share", es: "Compartir", pt: "Compartilhar", de: "Teilen", tr: "Paylaş", nl: "Delen", ar: "مشاركة" }, lang)}
        >
          <Share2 className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
