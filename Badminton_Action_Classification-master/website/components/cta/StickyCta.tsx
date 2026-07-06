"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TryNowButton } from "./TryNowButton";

// Contextual messages keyed to how far the user has scrolled. The copy adapts
// as they move from research → demo → close, nudging toward conversion.
const MESSAGES = [
  { at: 0.18, text: "Ready to analyze badminton actions?" },
  { at: 0.55, text: "Upload your first video today." },
  { at: 0.82, text: "Start classifying — no shuttlecock tracking required." },
];

export function StickyCta() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState(MESSAGES[0].text);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? window.scrollY / max : 0;

      // Show after leaving the hero, hide near the very bottom (footer/CTA area).
      setVisible(p > 0.12 && p < 0.93);

      const active = [...MESSAGES].reverse().find((m) => p >= m.at);
      if (active) setMsg(active.text);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const show = visible && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: reduce ? 0 : 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduce ? 0 : 80, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <div className="glass flex items-center gap-3 rounded-full border py-2 pl-5 pr-2 shadow-card-hover sm:gap-5">
            <p className="hidden text-sm font-medium text-ink sm:block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={msg}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="inline-block"
                >
                  {msg}
                </motion.span>
              </AnimatePresence>
            </p>
            <TryNowButton size="sm" pulse={false} />
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setDismissed(true)}
              className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
