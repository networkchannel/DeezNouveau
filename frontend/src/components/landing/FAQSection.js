import { ChevronDown } from "lucide-react";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/Reveal";

/**
 * FAQ accordion section.
 */
export default function FAQSection({ T, faqs, openFAQ, setOpenFAQ }) {
  return (
    <section className="relative px-4 sm:px-6 py-14 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <Reveal className="mb-10 sm:mb-12 text-center">
          <div className="pill mb-4 mx-auto"><span className="pill-dot pill-dot-violet" />{T.faqLabel}</div>
          <h2 className="display-lg text-white mb-3">{T.faqTitle}</h2>
        </Reveal>

        <StaggerGroup className="space-y-3" stagger={0.05}>
          {faqs.map((f, i) => {
            const open = openFAQ === i;
            return (
              <StaggerItem
                key={i}
                className={`rounded-2xl border backdrop-blur-xl transition-all ${
                  open
                    ? "bg-[rgba(15,10,24,0.55)] border-violet-500/30"
                    : "bg-[rgba(10,5,16,0.45)] border-white/[0.07] hover:border-white/[0.14]"
                }`}
                y={18}
              >
                <button
                  onClick={() => setOpenFAQ(open ? null : i)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left"
                  data-testid={`faq-${i}`}
                >
                  <span className="text-white text-[14.5px] sm:text-[15px] font-semibold">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/50 shrink-0 transition-transform ${open ? "rotate-180 text-violet-400" : ""}`}
                  />
                </button>
                {open && (
                  <div className="px-5 sm:px-6 pb-5 text-white/60 text-[14px] leading-relaxed">
                    {f.a}
                  </div>
                )}
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
