import { TRUST } from "@/lib/data";
import { Reveal } from "./ui/Reveal";

export function TrustBar() {
  return (
    <section aria-label="Core technologies" className="border-y bg-surface/40">
      <div className="container-content py-8">
        <Reveal className="flex flex-col items-center gap-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Built on a modern computer-vision stack
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
            {TRUST.map((t) => (
              <li
                key={t}
                className="inline-flex items-center gap-2 rounded-full border bg-surface px-4 py-2 text-sm font-medium text-ink/80 shadow-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo to-cyan" />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
