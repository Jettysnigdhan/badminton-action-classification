"use client";

import { useState } from "react";
import { JOINTS } from "@/lib/data";
import { SectionHeader } from "./ui/Section";
import { SkeletonCanvas } from "./SkeletonCanvas";
import { Reveal } from "./ui/Reveal";

const GROUPS = [
  { key: "head", label: "Head & gaze", color: "#7c8cff" },
  { key: "arm", label: "Arms & racket", color: "#00D4FF" },
  { key: "torso", label: "Pelvis & torso", color: "#9fb0ff" },
  { key: "leg", label: "Legs & footwork", color: "#5cd0ff" },
] as const;

export function SkeletonAnatomy() {
  const [active, setActive] = useState<number | null>(10); // default: right wrist
  const joint = active !== null ? JOINTS[active] : null;

  return (
    <section className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          align="center"
          eyebrow="Anatomy of a Stroke"
          title="Seventeen joints, one moving signature"
          description="Hover any keypoint to see the biomechanical role it plays in stroke recognition. The racket wrist and elbow carry the most discriminative motion."
        />

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* Same interactive skeleton card as the hero */}
          <Reveal>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="relative aspect-[4/5] rounded-4xl border bg-gradient-to-b from-surface to-canvas p-2 shadow-card">
                <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-midnight">
                  <div className="absolute inset-0 dot-grid opacity-60" />
                  <SkeletonCanvas
                    interactive
                    labels
                    activeId={active}
                    onActive={(id) => id !== null && setActive(id)}
                    className="h-full w-full"
                  />
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-cyan" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                      17 keypoints · COCO-17
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Detail + legend */}
          <Reveal delay={0.1}>
            <div>
              <div className="rounded-3xl border bg-surface p-6 shadow-card md:p-8">
                <span className="eyebrow">
                  <span className="h-1 w-1 rounded-full bg-accent" /> Keypoint{" "}
                  {joint ? joint.id : "—"}
                </span>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                  {joint ? joint.name : "Select a joint"}
                </h3>
                <p className="mt-2 min-h-[3.5rem] text-base leading-relaxed text-muted">
                  {joint ? joint.role : "Hover the skeleton to inspect each keypoint."}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {GROUPS.map((g) => (
                  <div
                    key={g.key}
                    className="flex items-center gap-2.5 rounded-xl border bg-surface px-4 py-3 text-sm text-ink/80"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.label}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {JOINTS.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onMouseEnter={() => setActive(j.id)}
                    onFocus={() => setActive(j.id)}
                    onClick={() => setActive(j.id)}
                    aria-label={j.name}
                    className={`rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
                      active === j.id ? "bg-ink text-canvas" : "bg-elevated text-muted hover:text-ink"
                    }`}
                  >
                    {j.id}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
