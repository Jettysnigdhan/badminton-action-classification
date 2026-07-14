import { Reveal } from "./ui/Reveal";
import { SectionHeader } from "./ui/Section";

const PRODUCT_FEATURES = [
  {
    title: "Instant badminton insight",
    body: "Every training clip becomes a tactical report: action type, shot quality, and court movement all in one view.",
  },
  {
    title: "Coach-friendly playback",
    body: "Share highlights, compare strokes, and review rally patterns with dashboards built for real coaching workflows.",
  },
  {
    title: "Tournament-ready setup",
    body: "Launch events or discover local competitions with analytics that reward game strategy over shuttle speed.",
  },
];

export function ProductPitch() {
  return (
    <section id="product" className="scroll-mt-24 border-t border-slate-200 bg-canvas py-20 md:py-28 dark:border-slate-700 dark:bg-surface">
      <div className="container-content">
        <SectionHeader
          eyebrow="Product Focus"
          title="Designed for badminton teams, coaches, and tournament organizers"
          description="SkeletonCourt is built around the sport’s fastest decisions: stroke type, rally flow, and player movement. It’s a badminton product, not a generic analytics toolkit."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PRODUCT_FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.08}>
              <article className="group relative overflow-hidden rounded-[2rem] border bg-surface p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-slate-800 dark:bg-elevated">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-3xl bg-accent/10 text-accent ring-1 ring-accent/15">
                  <span className="text-lg">✓</span>
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">
                  {feature.body}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-2 text-xs font-semibold text-accent ring-1 ring-accent/20 dark:bg-accent/15 dark:text-accent-fg">
                  badminton-ready
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="mt-12 rounded-[2rem] border border-line/10 bg-surface/90 px-6 py-6 text-sm text-ink shadow-card dark:border-line/10 dark:bg-elevated/90 dark:text-ink">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "No shuttle tracking required",
                "Standard camera + pose intelligence",
                "Training and tournaments in one platform",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-line/10 bg-surface p-4 text-center text-sm text-ink shadow-sm dark:border-line/20 dark:bg-elevated dark:text-ink">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
