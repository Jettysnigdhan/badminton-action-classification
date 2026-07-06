"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Premium circular theme reveal.
// Primary path: View Transitions API + clip-path circle expanding from the
// toggle's exact center, with a soft glow traced along the growing edge.
// Fallback (Firefox / older Safari): a portalled Framer Motion overlay that
// fills with the incoming theme colour, then commits the theme once it covers
// the viewport. Reduced motion: an instant, flash-free switch.

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DURATION = 0.9; // seconds — within the 0.8–1.2s spec

// Incoming theme's canvas colour (matches --canvas in globals.css).
const CANVAS = { dark: "#020617", light: "#FAFBFC" } as const;

function maxRadius(x: number, y: number) {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
}

type Reveal = { x: number; y: number; r: number; color: string; toDark: boolean };

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduce = useReducedMotion();
  const btnRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  const toggle = useCallback(() => {
    if (busy.current) return;
    const target = isDark ? "light" : "dark";

    // Reduced motion → quiet, immediate switch (no radial animation).
    if (reduce) {
      setTheme(target);
      return;
    }

    const rect = btnRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 56;
    const y = rect ? rect.top + rect.height / 2 : 56;
    const r = maxRadius(x, y);

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    // Preferred: native View Transitions for a pixel-accurate reveal.
    if (typeof doc.startViewTransition === "function") {
      const root = document.documentElement;
      root.style.setProperty("--reveal-glow", target === "dark" ? "0 212 255" : "79 195 247");
      const transition = doc.startViewTransition(() => {
        // flushSync so next-themes commits the class before the snapshot.
        flushSync(() => setTheme(target));
      });
      transition.ready.then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${r}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: DURATION * 1000,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
      return;
    }

    // Fallback: portalled overlay reveal.
    busy.current = true;
    setReveal({ x, y, r, color: CANVAS[target], toDark: target === "dark" });
  }, [isDark, reduce, setTheme]);

  const commitFallback = useCallback(() => {
    // Overlay now covers the viewport → switch theme beneath it, then lift it.
    flushSync(() => setTheme(isDark ? "light" : "dark"));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setReveal(null);
        busy.current = false;
      }),
    );
  }, [isDark, setTheme]);

  return (
    <>
      <motion.button
        ref={btnRef}
        type="button"
        aria-label={mounted ? `Switch to ${next} mode` : "Toggle theme"}
        onClick={toggle}
        whileTap={{ scale: 0.82 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border text-ink/70 transition-colors hover:bg-elevated hover:text-ink"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={mounted && isDark ? "sun" : "moon"}
            initial={{ y: 14, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -14, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="grid place-items-center"
          >
            {mounted && isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Fallback overlay (only used where View Transitions are unsupported) */}
      {mounted &&
        createPortal(
          <AnimatePresence onExitComplete={() => (busy.current = false)}>
            {reveal && (
              <motion.div
                key="theme-reveal"
                aria-hidden
                className="pointer-events-none fixed inset-0 z-[200]"
                initial={{ clipPath: `circle(0px at ${reveal.x}px ${reveal.y}px)` }}
                animate={{ clipPath: `circle(${reveal.r}px at ${reveal.x}px ${reveal.y}px)` }}
                transition={{ duration: DURATION, ease: EASE }}
                onAnimationComplete={commitFallback}
                style={{
                  // Solid incoming colour with a faint accent-tinted ambient edge.
                  background: `radial-gradient(circle at ${reveal.x}px ${reveal.y}px, ${reveal.color} 0%, ${reveal.color} 72%, ${
                    reveal.toDark ? "rgba(0,212,255,0.10)" : "rgba(79,195,247,0.12)"
                  } 100%)`,
                  boxShadow: reveal.toDark
                    ? "0 0 80px 24px rgba(0,212,255,0.20)"
                    : "0 0 80px 24px rgba(79,195,247,0.18)",
                  willChange: "clip-path",
                }}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
