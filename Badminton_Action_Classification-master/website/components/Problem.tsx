import { CHALLENGES } from "@/lib/data";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

export function Problem() {
  return (
    <section id="problem" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="Why It Matters"
          title="Badminton understood through motion, not just analytics"
          description="From village courts to Olympic arenas, badminton has always been driven by speed, strategy, and body control. We capture that legacy by watching player movement, so every discovery is grounded in the sport’s real value."
        />

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50/60 p-8 shadow-[0_24px_64px_-36px_rgba(15,23,42,0.22)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <div>
              <p className="text-sm leading-relaxed text-slate-700">
                Badminton began as a backyard game and evolved into a global sport because it rewards agility, timing, and court awareness. Today it is used for coaching, youth development, tournament scouting, and recreational play where every stroke becomes a chance to improve.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-slate-700">
                Our motion-aware model turns ordinary video into coaching-ready feedback: clearer shot patterns, smarter movement analysis, and actionable insight for players, coaches, and match organizers.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-900 p-6 text-white shadow-lg shadow-cyan-500/10">
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-cyan-400 via-slate-300 to-cyan-500 opacity-80" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Badminton in action
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
                  Where the game brings the biggest value
                </h3>
                <div className="mt-6 space-y-4 text-sm text-slate-300">
                  {[
                    "Practice sessions that become measurable progress.",
                    "Tournaments informed by realistic shot and movement data.",
                    "Youth programs that develop speed, precision, and confidence.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-glow" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Motion-first discovery",
              body: "Learn badminton from body position, timing, and stance instead of chasing a tiny shuttle in flight.",
            },
            {
              title: "Faster coach feedback",
              body: "Show the shots players actually use and where they succeed or struggle, so training becomes more targeted.",
            },
            {
              title: "Smarter practice",
              body: "Turn every rally into meaningful guidance, from footwork rhythm to shot selection across the court.",
            },
            {
              title: "Lower deployment cost",
              body: "No special broadcast rig is needed — a standard camera and pose model are enough to power insight.",
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <article className="group h-full rounded-2xl border bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 2.75c3.1 0 6.05 2.97 5.97 6.05-.03 1.5-.6 2.9-1.5 4.05-.88 1.12-2.07 2.1-3.3 3.02-.74.55-1.5 1.05-2.2 1.5-.3.18-.58.36-.85.5-.28.13-.53.24-.74.33-.23.1-.4.15-.46.16l-.05.01h-.02c-.07 0-.23-.05-.44-.16-.2-.1-.45-.22-.72-.35-.27-.14-.56-.3-.86-.5-.7-.44-1.44-.94-2.18-1.49-1.23-.93-2.41-1.9-3.29-3.02-.9-1.14-1.47-2.54-1.49-4.05C2.5 5.72 5.4 2.75 8.5 2.75Z" />
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
