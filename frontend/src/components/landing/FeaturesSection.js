import Reveal, { StaggerGroup, StaggerItem } from "@/components/Reveal";

/**
 * "Our features" section — 2-column grid of feature cards (crystality-style).
 */
export default function FeaturesSection({ T, features }) {
  return (
    <section id="features" className="relative px-4 sm:px-6 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="mb-12 sm:mb-16 max-w-2xl">
          <div className="pill mb-4"><span className="pill-dot pill-dot-violet" />{T.featuresLabel}</div>
          <h2 className="display-lg text-white mb-3">{T.featuresTitle}</h2>
          <p className="text-white/55 text-[16px]">{T.featuresSub}</p>
        </Reveal>

        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6" stagger={0.08}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={i} className="feature-card text-center" y={24}>
                <div data-testid={`feature-${i}`}>
                  <div className="feature-card__icon">
                    <Icon strokeWidth={2.2} />
                  </div>
                  <h3 className="text-white text-[17px] sm:text-[20px] font-semibold mb-2 sm:mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-white/55 text-[13px] sm:text-[14.5px] leading-relaxed max-w-sm mx-auto">{f.desc}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
