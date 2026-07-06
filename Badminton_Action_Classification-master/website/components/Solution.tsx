"use client";

import { motion } from "framer-motion";
import { PIPELINE } from "@/lib/data";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

export function Solution() {
  return (
    <section id="solution" className="scroll-mt-24 border-t bg-surface/40 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="Skeleton-Based Intelligence"
          title="One pipeline, from raw frame to recognised stroke"
          description="We discard the shuttlecock entirely. The player's own body — encoded as a moving 17-joint skeleton — carries enough signal to identify every shot."
        />

        <div className="mt-16 grid gap-4 lg:grid-cols-5">
          {PIPELINE.map((stage, i) => (
            <motion.div
              key={stage.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* connector */}
              {i < PIPELINE.length - 1 && (
                <span
                  aria-hidden
                  className="absolute right-[-10px] top-12 z-10 hidden h-px w-5 bg-gradient-to-r from-indigo/40 to-cyan/40 lg:block"
                />
              )}
              <article className="group relative h-full overflow-hidden rounded-2xl border bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-accent">
                    {stage.step}
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-elevated text-muted transition-colors group-hover:bg-midnight group-hover:text-cyan">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-ink">
                  {stage.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {stage.body}
                </p>
                <code className="mt-4 block truncate rounded-lg bg-midnight px-2.5 py-1.5 font-mono text-[11px] text-cyan/90">
                  {stage.mono}
                </code>
              </article>
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-10 text-center text-sm text-muted">
            Each stage is fully decoupled — swap AlphaPose for any COCO-17
            estimator, or the LSTM head for a transformer, without touching the rest.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
