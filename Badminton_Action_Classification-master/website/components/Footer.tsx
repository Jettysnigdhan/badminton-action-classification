import { SITE } from "@/lib/data";

const COLUMNS = [
  {
    title: "Research",
    links: [
      { label: "Paper", href: "#paper" },
      { label: "Methodology", href: "#architecture" },
      { label: "Results", href: "#results" },
      { label: "Benchmarks", href: "#results" },
    ],
  },
  {
    title: "Documentation",
    links: [
      { label: "Pipeline", href: "#solution" },
      { label: "Model cards", href: "#architecture" },
      { label: "API reference", href: "#demo" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: SITE.repo },
      { label: "Dataset", href: "#" },
      { label: "Contact", href: "mailto:research@skeletoncourt.dev" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-midnight text-white">
      <div aria-hidden className="absolute inset-0 dot-grid opacity-30" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan/40 to-transparent"
      />
      <div className="container-content relative py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-cyan">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="4.5" r="2" />
                  <path d="M12 6.5v6M12 8.5l-4 2M12 8.5l4 2M12 12.5l-3 5M12 12.5l3 5" />
                </svg>
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                {SITE.name}
              </span>
            </div>
            <p className="mt-5 max-w-sm font-display text-xl font-medium leading-snug tracking-tight text-white/90">
              Advancing Sports Intelligence Through Human Pose Understanding
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45">
              {SITE.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-white/65 transition-colors hover:text-cyan"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 text-sm text-white/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {SITE.name}.</p>
          <p className="font-mono text-xs">
            Skeleton-based · shuttlecock-free · 30 FPS
          </p>
        </div>
      </div>
    </footer>
  );
}
