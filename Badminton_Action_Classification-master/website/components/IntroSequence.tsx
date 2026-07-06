"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Intro: a fast terminal boot-log types out, then the SkeletonCourt wordmark
// reveals with a shine across the glyphs, then the overlay lifts to reveal the
// site. Plays once per session.

const SEEN_KEY = "sc_intro_seen";

// ── Tunable timing ──────────────────────────────────────────────────────────
const CHAR_MS = 8; // typewriter speed (higher = slower)
const LINE_PAUSE = 55; // pause between boot lines (ms)
const REVEAL_HOLD = 1900; // wordmark on screen before exit

const LINES: { text: string; tone: "accent" | "muted" | "ok" }[] = [
  { text: "skeletoncourt // initializing", tone: "accent" },
  { text: "loading alphapose estimator...", tone: "muted" },
  { text: "extracting 17 keypoints...", tone: "muted" },
  { text: "[ok] pose estimator      online", tone: "ok" },
  { text: "[ok] bilstm + attention  online", tone: "ok" },
  { text: "[ok] temperature scaling online", tone: "ok" },
  { text: "classification engine: active", tone: "accent" },
];

const TONE_CLASS = { accent: "text-cyan", muted: "text-white/45", ok: "text-white/80" };

const WORDMARK =
  "font-display text-[clamp(2.1rem,9.5vw,6rem)] font-semibold leading-none tracking-tightest whitespace-nowrap";

type Phase = "boot" | "reveal";

export function IntroSequence() {
  const reduce = useReducedMotion();
  const [render, setRender] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [phase, setPhase] = useState<Phase>("boot");
  const [li, setLi] = useState(0);
  const [ci, setCi] = useState(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (seen || reduce) {
      setRender(false);
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [reduce]);

  // Typewriter boot.
  useEffect(() => {
    if (!render || exiting || phase !== "boot") return;
    if (li >= LINES.length) {
      const id = setTimeout(() => setPhase("reveal"), 300);
      return () => clearTimeout(id);
    }
    const line = LINES[li].text;
    if (ci < line.length) {
      const id = setTimeout(() => setCi((c) => c + 1), CHAR_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setLi((l) => l + 1);
      setCi(0);
    }, LINE_PAUSE);
    return () => clearTimeout(id);
  }, [render, exiting, phase, li, ci]);

  // Hold the wordmark, then exit.
  useEffect(() => {
    if (!render || exiting || phase !== "reveal") return;
    const id = setTimeout(() => setExiting(true), REVEAL_HOLD);
    return () => clearTimeout(id);
  }, [render, exiting, phase]);

  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExiting(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [render]);

  if (!render) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[100] overflow-hidden bg-midnight"
      initial={{ opacity: 1 }}
      animate={exiting ? { opacity: 0, scale: 1.04, filter: "blur(6px)" } : { opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (exiting) {
          document.body.style.overflow = "";
          setRender(false);
          window.dispatchEvent(new Event("sc:intro-done"));
        }
      }}
    >
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.12),_transparent_60%)]" />

      <AnimatePresence>
        {phase === "boot" && (
          <motion.div
            key="boot"
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center px-6"
          >
            <div className="w-full max-w-md font-mono text-[13px] leading-7 sm:text-sm">
              {LINES.map((line, i) => {
                if (i > li) return null;
                const shown = i < li ? line.text : line.text.slice(0, ci);
                return (
                  <p key={i} className={TONE_CLASS[line.tone]}>
                    {line.tone === "ok" && shown.startsWith("[ok]") ? (
                      <>
                        <span className="text-success">[ok]</span>
                        {shown.slice(4)}
                      </>
                    ) : (
                      shown
                    )}
                    {i === li && (
                      <span className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.12em] animate-pulse-soft bg-cyan align-middle" />
                    )}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}

        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, filter: "blur(14px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <h1
                className={`${WORDMARK} bg-[linear-gradient(110deg,#8a93ff,#4FC3F7_55%,#00D4FF)] bg-clip-text text-transparent`}
              >
                SkeletonCourt
              </h1>
              <span
                aria-hidden
                className={`${WORDMARK} pointer-events-none absolute inset-0`}
                style={{
                  backgroundImage:
                    "linear-gradient(110deg, transparent 42%, rgba(255,255,255,0.92) 50%, transparent 58%)",
                  backgroundSize: "240% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  mixBlendMode: "screen",
                  animation: "intro-text-shine 1.3s cubic-bezier(0.22,1,0.36,1) 0.55s both",
                }}
              >
                SkeletonCourt
              </span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-5 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 sm:text-xs"
            >
              Skeleton-Based Action Recognition
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExiting(true)}
        className="absolute bottom-6 right-6 z-10 rounded-full border border-white/15 px-4 py-1.5 font-mono text-xs text-white/50 transition-colors hover:border-white/30 hover:text-white"
      >
        Skip →
      </button>
    </motion.div>
  );
}
