import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/Reveal";

/**
 * FAQ accordion — mobile-safe.
 *
 * Fixes vs v1:
 *   - <button type="button"> to avoid unexpected form submits in parents
 *   - touch-action: manipulation + cursor-pointer for snappy mobile taps
 *   - onClick AND onKeyDown (Space/Enter) for a11y keyboards
 *   - Answer animated with framer-motion height (smoother on mobile)
 *   - No pointer-events blockers on wrapper
 */
export default function FAQSection({ T, faqs, openFAQ, setOpenFAQ }) {
  return (
    <section className="relative px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <Reveal className="mb-8 sm:mb-12 text-center">
          <div className="pill mb-4 mx-auto"><span className="pill-dot pill-dot-violet" />{T.faqLabel}</div>
          <h2 className="display-lg text-white mb-3">{T.faqTitle}</h2>
        </Reveal>

        <StaggerGroup className="space-y-2.5 sm:space-y-3" stagger={0.05}>
          {faqs.map((f, i) => {
            const open = openFAQ === i;
            const toggle = () => setOpenFAQ(open ? null : i);
            return (
              <StaggerItem
                key={i}
                className={`rounded-2xl border backdrop-blur-xl transition-colors ${
                  open
                    ? "bg-[rgba(15,10,24,0.55)] border-violet-500/30"
                    : "bg-[rgba(10,5,16,0.45)] border-white/[0.07] hover:border-white/[0.14]"
                }`}
                y={18}
              >
                <button
                  type="button"
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                  aria-expanded={open}
                  aria-controls={`faq-answer-${i}`}
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-5 flex items-center justify-between gap-3 sm:gap-4 text-left cursor-pointer select-none"
                  style={{ touchAction: "manipulation" }}
                  data-testid={`faq-${i}`}
                >
                  <span className="text-white text-[14px] sm:text-[15px] font-semibold leading-snug">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/50 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-violet-400" : ""}`}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-white/65 text-[13.5px] sm:text-[14px] leading-relaxed">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
