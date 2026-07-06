import { METRICS } from "@/lib/data";
import { Counter } from "./ui/Counter";
import { Reveal } from "./ui/Reveal";

export function Metrics() {
  return (
    <section className="border-y bg-surface/40 py-20 md:py-24">
      <div className="container-content">
        <div className="grid gap-y-12 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.08}>
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <p className="font-display text-5xl font-semibold tracking-display text-ink md:text-6xl">
                  <Counter value={m.value} suffix={m.suffix} />
                </p>
                <p className="mt-3 text-sm font-medium text-ink">{m.label}</p>
                <p className="mt-1 text-xs text-muted">{m.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
