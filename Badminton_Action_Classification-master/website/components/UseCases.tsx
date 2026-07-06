import { USE_CASES } from "@/lib/data";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

function UseCaseIcon({ name }: { name: string }) {
  const c = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "chart":
      return <svg {...c}><path d="M3 3v18h18M8 17V9M13 17V5M18 17v-6" /></svg>;
    case "whistle":
      return <svg {...c}><path d="M3 11a5 5 0 0 0 5 5h6l5 4v-9a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5z" /><circle cx="8" cy="11" r="1.4" /></svg>;
    case "broadcast":
      return <svg {...c}><circle cx="12" cy="12" r="2.5" /><path d="M5 12a7 7 0 0 1 2-5M19 12a7 7 0 0 0-2-5M3 12a10 10 0 0 1 3-7M21 12a10 10 0 0 0-3-7" /></svg>;
    case "flask":
      return <svg {...c}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /><path d="M7.5 15h9" /></svg>;
    case "trend":
      return <svg {...c}><path d="M3 17l6-6 4 4 8-8M21 7v5M21 7h-5" /></svg>;
    default:
      return <svg {...c}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" /></svg>;
  }
}

export function UseCases() {
  return (
    <section className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="Where It Applies"
          title="From the broadcast booth to the research lab"
          description="Skeleton-based recognition is a primitive — once you can name every stroke automatically, a whole class of products becomes possible."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.title} delay={(i % 3) * 0.06}>
              <article className="group h-full rounded-2xl border bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-elevated text-indigo transition-colors group-hover:bg-midnight group-hover:text-cyan dark:text-cyan">
                  <UseCaseIcon name={u.icon} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink">
                  {u.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{u.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
