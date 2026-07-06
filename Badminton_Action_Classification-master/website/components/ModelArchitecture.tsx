"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

type Model = "LSTM" | "CNN";

const MODELS: Record<
  Model,
  {
    tagline: string;
    blurb: string;
    layers: { name: string; shape: string; note: string }[];
  }
> = {
  LSTM: {
    tagline: "BiLSTM + attention — the production model (85.2% test acc)",
    blurb:
      "A 3-layer bidirectional LSTM reads the normalized 89-dim kinematic sequence both ways, then additive temporal attention pools the decisive frames. Temperature-scaled (T = 1.84) for calibration, it reaches 85.2% test accuracy — beating the paper's 80% LSTM — without the over-parameterized 5×128 stack that memorizes a few hundred clips.",
    layers: [
      { name: "Input Sequence", shape: "(T=24, 89)", note: "17 joints → normalized kinematic features" },
      { name: "BiLSTM ×3", shape: "(24, 512)", note: "256 hidden, bidirectional, dropout 0.25" },
      { name: "LayerNorm", shape: "(24, 512)", note: "Stabilises the recurrent features" },
      { name: "Temporal Attention", shape: "(512,)", note: "Additive attention pooling over time" },
      { name: "Dropout → Dense → ReLU → Dense", shape: "(5,)", note: "Calibrated logits over 5 classes" },
    ],
  },
  CNN: {
    tagline: "Frame-level CNN — the paper's baseline (60%)",
    blurb:
      "The paper's CNN classifies frames spatially and discards the temporal swing trajectory — which is exactly where shot identity lives. It reaches 60% versus our BiLSTM's 85.2%, confirming that temporal modelling, not a frame classifier, is the right inductive bias.",
    layers: [
      { name: "Input Frame", shape: "(17, 3)", note: "Per-frame keypoints, no time axis" },
      { name: "Conv stack", shape: "(128, ·)", note: "Spatial filters over the joint map" },
      { name: "BatchNorm + ReLU", shape: "(128, ·)", note: "Per-frame spatial features" },
      { name: "Global Pool", shape: "(128,)", note: "Collapses spatial dimensions" },
      { name: "Softmax", shape: "(5,)", note: "Loses temporal order → 60% ceiling" },
    ],
  },
};

export function ModelArchitecture() {
  const [model, setModel] = useState<Model>("LSTM");
  const active = MODELS[model];

  return (
    <section id="architecture" className="scroll-mt-24 border-t bg-surface/40 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="Model Architecture"
          title="Two complementary heads, fused for accuracy"
          description="The LSTM branch reasons over time; the CNN branch sharpens local motion. Late fusion of their logits delivers the strongest top-1 accuracy."
        />

        <Reveal delay={0.05}>
          <div className="mt-10 inline-flex rounded-full border bg-surface p-1 shadow-sm">
            {(Object.keys(MODELS) as Model[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                aria-pressed={model === m}
                className="relative rounded-full px-6 py-2 text-sm font-medium transition-colors"
              >
                {model === m && (
                  <motion.span
                    layoutId="model-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${model === m ? "text-canvas" : "text-muted"}`}>
                  {m}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <div className="h-full rounded-3xl border bg-gradient-to-b from-surface to-canvas p-7 shadow-card">
              <span className="font-mono text-xs text-accent">{model}</span>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                {active.tagline}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {active.blurb}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-6 text-sm">
                <div>
                  <p className="font-mono text-xs text-muted">Input shape</p>
                  <p className="mt-1 font-medium text-ink">{active.layers[0].shape}</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-muted">Output</p>
                  <p className="mt-1 font-medium text-ink">softmax (5)</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Glassmorphism layer stack */}
          <div className="relative rounded-3xl border bg-midnight p-6 shadow-card md:p-8">
            <div aria-hidden className="absolute inset-0 rounded-3xl dot-grid opacity-40" />
            <AnimatePresence mode="wait">
              <motion.ol
                key={model}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative space-y-3"
              >
                {active.layers.map((l, i) => (
                  <motion.li
                    key={l.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur"
                  >
                    <div>
                      <p className="font-display text-sm font-semibold text-white">
                        {l.name}
                      </p>
                      <p className="mt-0.5 text-xs text-white/45">{l.note}</p>
                    </div>
                    <code className="shrink-0 rounded-lg bg-cyan/10 px-2.5 py-1 font-mono text-xs text-cyan">
                      {l.shape}
                    </code>
                  </motion.li>
                ))}
              </motion.ol>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
