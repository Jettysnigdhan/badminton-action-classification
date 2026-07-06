"use client";

import { motion } from "framer-motion";
import { TryNowButton } from "./cta/TryNowButton";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-28 pb-16 text-center">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-6%] h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.10),_transparent_60%)]" />
        <div className="absolute left-1/2 top-[26%] h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(40,53,147,0.10),_transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:56px_56px] mask-fade-b" />
      </div>

      <div className="container-content flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1.5 text-xs font-medium text-muted shadow-sm"
        >
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
          Skeleton-based action recognition · No shuttlecock tracking
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 max-w-4xl font-display text-[2.8rem] font-semibold leading-[1.03] tracking-display text-ink sm:text-6xl md:text-[4.5rem]"
        >
          Teaching AI to Understand{" "}
          <span className="text-gradient">Badminton Movement</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted"
        >
          Convert raw badminton footage into human skeleton trajectories and classify
          player actions with deep learning — powered by AlphaPose pose estimation and
          temporal sequence modeling.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <TryNowButton size="lg" />
          <a
            href="#paper"
            className="group inline-flex items-center gap-2 rounded-full border bg-surface px-6 py-3.5 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-elevated"
          >
            Explore Research
            <svg className="transition-transform group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 flex items-center gap-8 border-t pt-7 sm:gap-12"
        >
          {[
            ["17", "Keypoints"],
            ["5", "Shot classes"],
            ["85%", "Test accuracy"],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="font-display text-3xl font-semibold tracking-tight text-ink">{v}</dt>
              <dd className="mt-0.5 text-xs text-muted">{l}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
