"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";

/* ─── Pipeline stages (same data as original) ───────────────────────────── */

const STAGES = [
  { label: "Video Frames", mono: "frames[t] · RGB", icon: "film" },
  { label: "Skeleton Coordinates", mono: "kpts ∈ ℝ^{17×3}", icon: "nodes" },
  { label: "Sequence Tensor", mono: "x ∈ ℝ^{24×17×3}", icon: "cube" },
  { label: "BiLSTM + Attn", mono: "h = f_θ(x)", icon: "chip" },
  { label: "Prediction", mono: "ŷ = softmax(Wh)", icon: "target" },
];

const SAMPLE = [
  ["frame", "joint", "x", "y", "score"],
  ["t=12", "R_wrist", "0.762", "0.515", "0.97"],
  ["t=12", "R_elbow", "0.690", "0.391", "0.95"],
  ["t=12", "R_shldr", "0.601", "0.240", "0.99"],
  ["t=13", "R_wrist", "0.781", "0.470", "0.96"],
  ["t=13", "R_elbow", "0.704", "0.358", "0.94"],
];

const CYCLE_MS = 2400;

/* ─── Icon SVGs (original set) ───────────────────────────────────────────── */

function StageIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "rgb(var(--accent))" : "currentColor";
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "film":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
        </svg>
      );
    case "nodes":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="8" r="2" />
          <circle cx="9" cy="17" r="2" />
          <path d="M7.5 7.5l9 0.5M8 15l8-6" />
        </svg>
      );
    case "cube":
      return (
        <svg {...common}>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
          <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
        </svg>
      );
    case "chip":
      return (
        <svg {...common}>
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
          <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}

/* ─── Flowing data particle ──────────────────────────────────────────────── */

function DataParticle({ from, delay }: { from: number; delay: number }) {
  if (from >= STAGES.length - 1) return null;
  return (
    <motion.div
      className="absolute top-[27px] h-1.5 w-1.5 rounded-full bg-accent z-20"
      style={{ left: 0 }}
      initial={{ left: "0%", opacity: 0, scale: 0 }}
      animate={{
        left: "100%",
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
      }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    />
  );
}

/* ─── Main DataFlow Component ────────────────────────────────────────────── */

export function DataFlow() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();

  const [activeStep, setActiveStep] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const [particleKey, setParticleKey] = useState(0);

  // Start cycling once in view
  useEffect(() => {
    if (!inView || reduceMotion) {
      if (reduceMotion && inView) setActiveStep(0);
      return;
    }
    const delay = setTimeout(() => setActiveStep(0), 600);
    return () => clearTimeout(delay);
  }, [inView, reduceMotion]);

  // Auto-cycle
  useEffect(() => {
    if (activeStep < 0 || isPaused || !inView || reduceMotion) return;

    const timer = setTimeout(() => {
      // Fire particle
      setParticleKey((k) => k + 1);

      setTimeout(() => {
        setActiveStep((prev) =>
          prev < STAGES.length - 1 ? prev + 1 : 0
        );
      }, reduceMotion ? 0 : 500);
    }, CYCLE_MS);

    return () => clearTimeout(timer);
  }, [activeStep, isPaused, inView, reduceMotion]);

  const handleHover = useCallback((i: number) => {
    setIsPaused(true);
    setActiveStep(i);
  }, []);

  const handleLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative scroll-mt-24 overflow-hidden bg-canvas py-24 text-ink md:py-32"
    >
      <div aria-hidden className="dot-grid absolute inset-0 opacity-0 dark:opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgb(var(--accent)/0.10),_transparent_60%)]"
      />

      <div className="container-content relative">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent">
            <span className="h-1 w-1 rounded-full bg-accent" /> Data Flow
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-display sm:text-4xl md:text-[2.75rem] md:leading-[1.05]">
            Following a single rally through the network
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Every frame becomes coordinates, every window becomes a tensor, and
            the temporal model resolves it into a stroke — in real time.
          </p>
        </div>

        {/* ── Animated timeline (original layout + animations) ────────── */}
        <div className="relative mt-16">
          {/* Static background line */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-line/10 lg:block" />

          {/* Animated progress line */}
          <motion.div
            className="absolute left-0 top-7 hidden h-px origin-left lg:block"
            style={{
              background: "linear-gradient(90deg, rgb(var(--accent)), #6366f1, rgb(var(--accent)))",
              width: "100%",
            }}
            initial={{ scaleX: 0 }}
            animate={
              inView
                ? { scaleX: activeStep >= 0 ? (activeStep + 1) / STAGES.length : 0 }
                : { scaleX: 0 }
            }
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Stage cards */}
          <div className="grid gap-8 lg:grid-cols-5">
            {STAGES.map((s, i) => {
              const isActive = activeStep === i;
              const isPast = activeStep > i;

              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.18 }}
                  className="relative"
                  onMouseEnter={() => handleHover(i)}
                  onMouseLeave={handleLeave}
                >
                  {/* Icon box */}
                  <div className="relative">
                    {/* Glow behind icon when active */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1.15 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            width: 56,
                            height: 56,
                            background: "rgb(var(--accent) / 0.12)",
                            filter: "blur(10px)",
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <motion.div
                      className="panel relative z-10 grid h-14 w-14 place-items-center rounded-2xl"
                      animate={{
                        borderColor: isActive
                          ? "rgb(var(--accent) / 0.5)"
                          : isPast
                          ? "rgb(var(--accent) / 0.2)"
                          : "rgb(var(--line) / 0.08)",
                        boxShadow: isActive
                          ? "0 0 0 1px rgb(var(--accent) / 0.3), 0 8px 24px -8px rgb(var(--accent) / 0.3)"
                          : "none",
                      }}
                      transition={{ duration: 0.35 }}
                    >
                      <motion.div
                        animate={{
                          scale: isActive ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <StageIcon name={s.icon} active={isActive || isPast} />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Label */}
                  <motion.h3
                    className="mt-5 font-display text-base tracking-tight"
                    animate={{
                      fontWeight: isActive ? 700 : 600,
                      color: isActive || isPast
                        ? "rgb(var(--ink))"
                        : "rgb(var(--ink))",
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    {s.label}
                  </motion.h3>

                  {/* Mono code */}
                  <motion.code
                    className="mt-1.5 block font-mono text-xs"
                    animate={{
                      color: isActive
                        ? "rgb(var(--accent))"
                        : "rgb(var(--faint))",
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    {s.mono}
                  </motion.code>

                  {/* Connector particle zone (between stages) */}
                  {i < STAGES.length - 1 && (
                    <div className="absolute right-0 top-0 hidden h-14 w-[calc(100%-56px)] translate-x-[calc(100%-28px)] lg:block">
                      <AnimatePresence>
                        {activeStep === i && !isPaused && (
                          <DataParticle
                            key={`particle-${i}-${particleKey}`}
                            from={i}
                            delay={CYCLE_MS / 1000 - 0.5}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress indicator dots */}
          <div className="mt-10 flex items-center justify-center gap-2 lg:hidden">
            {STAGES.map((_, i) => (
              <motion.button
                key={`dot-${i}`}
                type="button"
                className="h-1.5 rounded-full"
                onClick={() => {
                  setActiveStep(i);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 3000);
                }}
                animate={{
                  width: activeStep === i ? 24 : 6,
                  backgroundColor:
                    activeStep === i
                      ? "rgb(var(--accent))"
                      : "rgb(var(--faint) / 0.3)",
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                aria-label={`Go to step ${i + 1}: ${STAGES[i].label}`}
              />
            ))}
          </div>
        </div>

        {/* ── Sample coordinate table (animated rows) ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="panel mt-16 overflow-hidden rounded-3xl"
        >
          <div className="flex items-center gap-2 border-b border-line/10 px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-faint/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-faint/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-faint/40" />
            <span className="ml-3 font-mono text-xs text-faint">
              skeleton_sequence.parquet
            </span>
          </div>
          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full min-w-[480px] font-mono text-sm">
              <tbody>
                {SAMPLE.map((row, r) => (
                  <motion.tr
                    key={r}
                    className={
                      r === 0
                        ? "text-xs uppercase tracking-wider text-faint"
                        : "text-muted"
                    }
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: r * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className={`px-3 py-2 ${c === 0 ? "text-accent" : ""} ${
                          r > 0 && "border-t border-line/[0.06]"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
