"use client";

import { motion } from "framer-motion";
import { ACTIONS, QUALITY_GATES } from "@/lib/data";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

export function ClassificationShowcase() {
  const top = ACTIONS.slice(0, 4);

  return (
    <section id="results" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="Classification & Verification"
          title="Calibrated predictions, honest metrics"
          description="The dashboard shows an illustrative single-clip softmax over the five configured classes. The system reports per-class F1 and calibration — not a single accuracy point — and ships behind real quality gates."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Dashboard */}
          <Reveal>
            <div className="rounded-3xl border bg-surface p-6 shadow-card md:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-midnight text-cyan">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18M7 14l3-3 3 3 5-6" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Softmax Output</p>
                    <p className="font-mono text-xs text-muted">clip · 24-frame window · illustrative</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/10 px-2.5 py-1 text-xs font-medium text-indigo dark:text-cyan">
                  temperature-calibrated
                </span>
              </div>

              <div className="mt-7 space-y-5">
                {top.map((a, i) => (
                  <div key={a.slug}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-ink">{a.name}</span>
                      <span className="font-mono text-sm font-semibold text-ink">
                        {a.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
                      <motion.div
                        className={`h-full rounded-full ${
                          i === 0
                            ? "bg-gradient-to-r from-indigo to-cyan"
                            : "bg-gradient-to-r from-indigo/70 to-cyan/70"
                        }`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${a.confidence}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Top prediction + quality gates */}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border bg-gradient-to-br from-midnight to-indigo-700 p-8 text-white shadow-card">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan">
                  Top prediction
                </p>
                <p className="mt-4 font-display text-4xl font-semibold tracking-tight">
                  {ACTIONS[0].name}
                </p>
                <p className="mt-2 text-white/60">{ACTIONS[0].short}</p>
              </div>

              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-white/40">
                  Held-out test metrics
                </p>
                <div className="grid grid-cols-4 gap-3 border-t border-white/10 pt-5">
                  {QUALITY_GATES.map((g) => (
                    <div key={g.label}>
                      <p className="font-display text-lg font-semibold">{g.value}</p>
                      <p className="mt-0.5 text-[11px] leading-tight text-white/50">{g.label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 font-mono text-[11px] text-white/40">
                  promotion gate met: macro-F1 ≥ 0.85 · ECE ≤ 0.05
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
