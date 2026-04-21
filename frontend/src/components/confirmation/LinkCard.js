import { motion } from "framer-motion";
import { Check, Copy, ExternalLink } from "lucide-react";

export default function LinkCard({ link, index, copiedIdx, onCopy }) {
  const isCopied = copiedIdx === index;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.35 }}
      className="group relative"
    >
      <div className={`
        flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200
        ${isCopied
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
        }
      `}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center shrink-0">
          <span className="text-[12px] font-bold text-accent tabular-nums">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-mono text-white/70 truncate group-hover:text-white/90 transition-colors">
            {link}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-accent hover:bg-accent/10 transition-all"
            title="Ouvrir"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={() => onCopy(link, index)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isCopied
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-white/30 hover:text-white hover:bg-white/10"
            }`}
            title="Copier"
          >
            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
