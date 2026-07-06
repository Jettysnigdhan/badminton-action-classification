import { CHALLENGES } from "@/lib/data";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

export function Problem() {
  return (
    <section id="problem" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="The Challenge"
          title="Conventional badminton analytics fight the wrong problem"
          description="Most systems chase the shuttlecock — a tiny, blur-prone target moving at over 400 km/h. That dependency makes them fragile, expensive, and hard to scale."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CHALLENGES.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <article className="group h-full rounded-2xl border bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100 dark:bg-red-500/10 dark:ring-red-500/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {c.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-dashed bg-surface/50 px-6 py-5 text-sm text-muted">
            <span className="font-medium text-ink">The cost compounds:</span>
            {["Occlusion", "Motion blur", "High-speed gameplay", "Annotation cost"].map((p) => (
              <span key={p} className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-muted" />
                {p}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
