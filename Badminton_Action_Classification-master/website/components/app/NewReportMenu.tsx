"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const TYPES = [
  { type: "performance", label: "Performance digest", desc: "KPIs across your analyzed clips" },
  { type: "distribution", label: "Shot-distribution summary", desc: "Breakdown by shot class" },
  { type: "quality", label: "Calibration & quality audit", desc: "Confidence + review rate" },
] as const;

export function NewReportMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  async function generate(type: string) {
    setPending(type);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setOpen(false);
      if (data.id) router.push(`/app/reports/${data.id}`);
      else router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:-translate-y-0.5"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        New report
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border bg-surface p-1.5 shadow-card-hover"
            >
              {TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  disabled={pending !== null}
                  onClick={() => generate(t.type)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-elevated disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-medium text-ink">{t.label}</span>
                    <span className="block text-xs text-muted">{t.desc}</span>
                  </span>
                  {pending === t.type && (
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
