"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { JOINTS, BONES, type Joint } from "@/lib/data";

const W = 400;
const H = 480;

type Pt = { x: number; y: number };

function toPx(j: Joint): Pt {
  return { x: j.x * W, y: j.y * H };
}

const GROUP_COLOR: Record<Joint["group"], string> = {
  head: "#7c8cff",
  arm: "#00D4FF",
  torso: "#9fb0ff",
  leg: "#5cd0ff",
};

type SkeletonCanvasProps = {
  interactive?: boolean;
  labels?: boolean;
  className?: string;
  /** Controlled active joint (id) — pass with onActive to lift the hover state. */
  activeId?: number | null;
  /** Notified whenever the hovered/focused joint changes. */
  onActive?: (id: number | null) => void;
};

/**
 * Animated COCO-17 skeleton (SVG).
 * Intro: the 17 keypoints spawn in first, then the bones draw to connect them.
 * - non-interactive: the racket arm performs a continuous smash-swing with a trail.
 * - interactive + labels: a static, hover-aware pose that reveals each joint's
 *   name in a small label near the point, and replays its intro when the
 *   page-load intro overlay finishes (the `sc:intro-done` event).
 */
export function SkeletonCanvas({
  interactive = false,
  labels = false,
  className = "",
  activeId,
  onActive,
}: SkeletonCanvasProps) {
  const reduce = useReducedMotion();
  const [internalActive, setInternalActive] = useState<number | null>(null);
  const [replay, setReplay] = useState(0);

  // Controlled when activeId is provided, otherwise internal.
  const controlled = activeId !== undefined;
  const active = controlled ? activeId : internalActive;
  const setActive = (id: number | null) => {
    if (!controlled) setInternalActive(id);
    onActive?.(id);
  };

  const base = useMemo(() => JOINTS.map(toPx), []);

  // Measure the rendered SVG box so the hover label (an HTML overlay rendered
  // above the floating cards) can be positioned over the right joint.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!interactive || !wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [interactive]);

  // Replay the spawn→connect intro once the full-screen intro overlay lifts, so
  // it isn't missed playing behind the overlay on first load.
  useEffect(() => {
    if (!interactive) return;
    const onDone = () => setReplay((k) => k + 1);
    window.addEventListener("sc:intro-done", onDone);
    return () => window.removeEventListener("sc:intro-done", onDone);
  }, [interactive]);

  // Swing keyframes for the racket arm (non-interactive only).
  const swing = reduce
    ? { elbow: { x: [0], y: [0] }, wrist: { x: [0], y: [0] } }
    : {
        elbow: { x: [0, 10, -4, 0], y: [0, -22, 6, 0] },
        wrist: { x: [0, 26, -10, 0], y: [0, -52, 18, 0] },
      };
  const trail = [0.4, 0.26, 0.14];

  // Intro timing: dots spawn first, bones draw afterwards.
  const dotDelay = (i: number) => i * 0.045;
  const boneDelay = (i: number) => 0.72 + i * 0.04;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Animated 17-point human skeleton performing a badminton stroke"
      >
        <defs>
          <radialGradient id="court-glow" cx="50%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.16" />
            <stop offset="55%" stopColor="#283593" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#283593" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bone-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#6f7dff" />
          </linearGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#court-glow)" />

        {/* Float the whole rig subtly in interactive mode (keeps hit areas aligned). */}
        <motion.g
          key={replay}
          animate={interactive && !reduce ? { y: [0, -5, 0] } : undefined}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Bones — draw in after the dots */}
          <g stroke="url(#bone-grad)" strokeWidth="2.5" strokeLinecap="round">
            {BONES.map(([a, b], i) => {
              const isRacket = (a === 6 && b === 8) || (a === 8 && b === 10);
              return (
                <motion.line
                  key={`${replay}-${i}`}
                  x1={base[a].x}
                  y1={base[a].y}
                  x2={base[b].x}
                  y2={base[b].y}
                  strokeOpacity={isRacket ? 0.95 : 0.55}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.55, delay: boneDelay(i), ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}
          </g>

          {/* Motion trail (non-interactive swing only) */}
          {!reduce &&
            !interactive &&
            trail.map((o, i) => (
              <motion.circle
                key={`trail-${i}`}
                cx={base[10].x}
                cy={base[10].y}
                r={5}
                fill="#00D4FF"
                initial={{ opacity: 0 }}
                animate={{ x: swing.wrist.x, y: swing.wrist.y, opacity: [0, o, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.08 * (i + 1) }}
              />
            ))}

          {/* Joints — spawn first */}
          {base.map((p, id) => {
            const joint = JOINTS[id];
            const isWrist = id === 10;
            const isElbow = id === 8;
            const swingAnim =
              !interactive && (isWrist || isElbow)
                ? { x: isWrist ? swing.wrist.x : swing.elbow.x, y: isWrist ? swing.wrist.y : swing.elbow.y }
                : {};
            const isActive = active === id;
            return (
              <motion.g
                key={`${replay}-j-${id}`}
                animate={swingAnim}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                {(isWrist || isActive) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 13 : 10}
                    fill={GROUP_COLOR[joint.group]}
                    opacity={isActive ? 0.28 : 0.18}
                    filter="url(#soft-glow)"
                  />
                )}
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 6.5 : isWrist ? 5.5 : 4}
                  fill={isActive ? "#ffffff" : GROUP_COLOR[joint.group]}
                  stroke={GROUP_COLOR[joint.group]}
                  strokeWidth={isActive ? 2.5 : 0}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: dotDelay(id), type: "spring", stiffness: 320, damping: 18 }}
                />
              </motion.g>
            );
          })}

          {/* Interactive hit targets */}
          {interactive &&
            base.map((p, id) => (
              <circle
                key={`hit-${id}`}
                cx={p.x}
                cy={p.y}
                r={16}
                fill="transparent"
                style={{ cursor: "none" }}
                onMouseEnter={() => setActive(id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(id)}
                onBlur={() => setActive(null)}
                tabIndex={labels ? 0 : -1}
                role="button"
                aria-label={`${JOINTS[id].name}: ${JOINTS[id].role}`}
              />
            ))}

        </motion.g>
      </svg>

      {/* Hover label — an HTML overlay above the floating cards, smartly placed
          so it never gets clipped by the canvas edge or hidden behind a card. */}
      {labels && active !== null && size.w > 0 && (
        <PointLabel name={JOINTS[active].name} vp={base[active]} size={size} k={active} />
      )}
    </div>
  );
}

function PointLabel({
  name,
  vp,
  size,
  k,
}: {
  name: string;
  vp: Pt;
  size: { w: number; h: number };
  k: number;
}) {
  // Map viewBox coords → rendered pixels (SVG uses xMidYMid meet).
  const scale = Math.min(size.w / W, size.h / H);
  const offX = (size.w - W * scale) / 2;
  const offY = (size.h - H * scale) / 2;
  const x = offX + vp.x * scale;
  const y = offY + vp.y * scale;

  const above = y > 58; // enough room above? otherwise drop below
  const left = Math.min(Math.max(x, 52), size.w - 52);
  const top = above ? y - 13 : y + 13;

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{ left, top, transform: `translate(-50%, ${above ? "-100%" : "0"})` }}
    >
      <motion.span
        key={k}
        initial={{ opacity: 0, scale: 0.9, y: above ? 3 : -3 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="block whitespace-nowrap rounded-full border border-cyan/30 bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-card backdrop-blur"
      >
        {name}
      </motion.span>
    </div>
  );
}
