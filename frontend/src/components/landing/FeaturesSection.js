import Reveal, { StaggerItem } from "@/components/Reveal";
import MobileCarousel from "@/components/MobileCarousel";

/**
 * "Why deezlink" features section.
 * Mobile : horizontal carousel (one-and-a-peek).
 * Desktop: 3-column grid.
 */
export default function FeaturesSection({ T, features }) {
  return (
    <section id="features" className="relative px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="mb-8 sm:mb-16 max-w-2xl">
          <div className="pill mb-4"><span className="pill-dot pill-dot-violet" />{T.featuresLabel}</div>
          <h2 className="display-lg text-white mb-3">{T.featuresTitle}</h2>
          <p className="text-white/55 text-[15px] sm:text-[16px]">{T.featuresSub}</p>
        </Reveal>

        <MobileCarousel
          desktopCols="3"
          itemClass="w-[70%] xs:w-[60%] sm:w-[50%]"
          ariaLabel="Features"
          gap="gap-3 sm:gap-6"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={i} className="feature-card text-center h-full" y={24} delay={i * 0.08}>
                <div data-testid={`feature-${i}`}>
                  <div className="feature-card__icon">
                    <Icon strokeWidth={2.2} />
                  </div>
                  <h3 className="text-white text-[16px] sm:text-[20px] font-semibold mb-2 sm:mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-white/55 text-[12.5px] sm:text-[14.5px] leading-relaxed max-w-sm mx-auto">{f.desc}</p>
                </div>
              </StaggerItem>
            );
          })}
        </MobileCarousel>
      </div>
    </section>
  );
}
