import { STACK } from "@/lib/data";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

const GROUP_META: Record<string, { icon: string; tint: string }> = {
  Web: { icon: "layout", tint: "from-indigo/15 to-cyan/10" },
  Serving: { icon: "server", tint: "from-emerald-400/15 to-cyan/10" },
  ML: { icon: "brain", tint: "from-cyan/15 to-indigo/10" },
  MLOps: { icon: "cloud", tint: "from-indigo/15 to-indigo/5" },
};

function Icon({ name }: { name: string }) {
  const c = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "layout":
      return <svg {...c}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
    case "server":
      return <svg {...c}><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></svg>;
    case "brain":
      return <svg {...c}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A2.5 2.5 0 0 0 7 18a3 3 0 0 0 5 1 3 3 0 0 0 5-1 2.5 2.5 0 0 0 2-5.2A3 3 0 0 0 18 7a3 3 0 0 0-3-3 2.5 2.5 0 0 0-3 0 2.5 2.5 0 0 0-3 0z" /></svg>;
    default:
      return <svg {...c}><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6 19z" /></svg>;
  }
}

export function TechStack() {
  return (
    <section className="scroll-mt-24 border-t bg-surface/40 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="Technology Stack"
          title="Engineered for production, not the lab bench"
          description="A modern, fully typed stack from the inference server to the pixel — containerised and edge-ready."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(STACK).map(([group, items], gi) => (
            <Reveal key={group} delay={gi * 0.07}>
              <div className="h-full rounded-2xl border bg-surface p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${GROUP_META[group].tint} text-ink`}>
                    <Icon name={GROUP_META[group].icon} />
                  </span>
                  <h3 className="font-display text-base font-semibold tracking-tight text-ink">
                    {group}
                  </h3>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo to-cyan" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
