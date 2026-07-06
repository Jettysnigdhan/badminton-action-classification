"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PAPER, BIBTEX } from "@/lib/data";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

const TABS = [
  { key: "abstract", label: "Abstract", body: PAPER.abstract },
  { key: "methodology", label: "Methodology", body: PAPER.methodology },
  { key: "results", label: "Results", body: PAPER.results },
  { key: "future", label: "Future Work", body: PAPER.future },
] as const;

export function ResearchPaper() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("abstract");
  const [showBib, setShowBib] = useState(false);
  const [copied, setCopied] = useState(false);

  const active = TABS.find((t) => t.key === tab)!;

  async function copyBib() {
    try {
      await navigator.clipboard.writeText(BIBTEX);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section id="paper" className="scroll-mt-24 border-t bg-surface/40 py-24 md:py-32">
      <div className="container-content">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Left: meta */}
          <div>
            <SectionHeader
              eyebrow="Research Paper"
              title="Badminton Action Classification via AlphaPose skeletons"
            />
            <Reveal delay={0.05}>
              <div className="mt-8 rounded-2xl border bg-surface p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-midnight text-cyan">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4v16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8l-5-5H5a1 1 0 0 0-1 1z" />
                      <path d="M14 3v5h5M8 13h8M8 17h8" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display font-semibold leading-snug text-ink">
                      {PAPER.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">{PAPER.source}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-transform hover:-translate-y-0.5"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                    </svg>
                    Download Paper
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowBib(true)}
                    className="inline-flex items-center gap-2 rounded-full border bg-surface px-5 py-2.5 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-elevated"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
                    </svg>
                    Cite (BibTeX)
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right: tabbed content */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl border bg-surface p-6 shadow-card md:p-8">
              <div className="flex flex-wrap gap-1.5 border-b pb-4">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-pressed={tab === t.key}
                    className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      tab === t.key ? "text-canvas" : "text-muted hover:text-ink"
                    }`}
                  >
                    {tab === t.key && (
                      <motion.span
                        layoutId="paper-tab"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 text-[15px] leading-[1.8] text-ink/80"
                >
                  {active.body}
                </motion.p>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>

      {/* BibTeX modal */}
      <AnimatePresence>
        {showBib && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-midnight/50 p-4 backdrop-blur-sm"
            onClick={() => setShowBib(false)}
            role="dialog"
            aria-modal="true"
            aria-label="BibTeX citation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-2xl border bg-surface shadow-card-hover"
            >
              <div className="flex items-center justify-between border-b px-5 py-3.5">
                <p className="text-sm font-semibold text-ink">BibTeX Citation</p>
                <button
                  type="button"
                  onClick={() => setShowBib(false)}
                  aria-label="Close"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-ink"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <pre className="overflow-x-auto bg-midnight p-5 font-mono text-xs leading-relaxed text-cyan/90">
                {BIBTEX}
              </pre>
              <div className="flex justify-end border-t px-5 py-3.5">
                <button
                  type="button"
                  onClick={copyBib}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas"
                >
                  {copied ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="11" height="11" rx="2" />
                        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                      </svg>
                      Copy citation
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
