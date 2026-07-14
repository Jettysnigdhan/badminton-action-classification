import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

const TOURNAMENT_FEATURES = [
  {
    title: "Host your own tournament",
    body: "Set up an event with live shot classification, player heatmaps, and easy scoring so every match runs like a polished competition.",
    action: "Run event",
    href: "#live-demo",
  },
  {
    title: "Discover nearby tournaments",
    body: "Find local badminton events, league nights, and open plays near you so players can keep improving through real competition.",
    action: "Explore local events",
    href: "/contact",
  },
  {
    title: "Bridge training and events",
    body: "Use motion-based insights from practice to shape tournaments that reward consistency, movement, and smarter shot selection.",
    action: "Connect insights",
    href: "#shots",
  },
];

export function Tournaments() {
  return (
    <section id="tournaments" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="Tournament mode"
          title="Run your own events or discover the nearest badminton competitions"
          description="Organize tournaments, track player progress, and connect with nearby matches — all powered by motion-aware badminton intelligence."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TOURNAMENT_FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.06}>
              <article className="group h-full rounded-3xl border border-slate-200/80 bg-surface px-5 py-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-slate-700 dark:bg-elevated dark:text-slate-100">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent dark:bg-accent/15">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.16 6.37L22 9.24l-5 4.87L18.32 22 12 18.56 5.68 22 7 14.11 2 9.24l6.84-1.2L12 2z" />
                    <path d="M17 15.7 12 13.25 7 15.7l1.08-5.1L4 8.1l5.18-.45L12 3l2.82 4.65L20 8.1l-4.08 2.5L17 15.7z" />
                  </svg>
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-tight text-ink dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted dark:text-slate-300">
                  {feature.body}
                </p>
                <a
                  href={feature.href}
                  className="mt-6 inline-flex items-center rounded-full border border-accent-300/30 bg-accent-500/10 px-4 py-2 text-sm font-semibold text-accent-500 transition hover:border-accent-400 hover:bg-accent-500/15 dark:border-accent-400/30 dark:text-accent-fg dark:hover:bg-accent-500/20"
                >
                  {feature.action}
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
