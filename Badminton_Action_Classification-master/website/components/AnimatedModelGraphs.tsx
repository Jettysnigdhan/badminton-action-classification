"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

/* ─── Training curve generation (client-only) ───────────────────────────── */

import historyData from "../data/history.json";

type EpochData = {
  epoch: number;
  acc: number;
  loss: number;
  f1: number;
};

const EPOCHS = historyData.length;
const MAX_LOSS = Math.max(2.0, ...historyData.map(d => d.loss));

/** Catmull-Rom → cubic-Bézier smooth SVG path */
function pointsToPath(
  points: { x: number; y: number }[]
): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    const tension = 0.25;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const W = 900;
const H = 380;
const PAD_X = 70; // Larger padding for axes
const PAD_Y = 40;

const CURVE_META = {
  accuracy: {
    label: "Accuracy",
    colorClass: "text-cyan",
    stroke: "url(#grad-cyan)",
    dotFill: "#00D4FF",
    glowColor: "rgba(0, 212, 255, 0.4)",
  },
  loss: {
    label: "Loss",
    colorClass: "text-muted",
    stroke: "url(#grad-muted)",
    dotFill: "#6A7588",
    glowColor: "rgba(106, 117, 136, 0.3)",
  },
  f1: {
    label: "Macro-F1",
    colorClass: "text-success",
    stroke: "url(#grad-green)",
    dotFill: "#22C55E",
    glowColor: "rgba(34, 197, 94, 0.4)",
  },
};

/* ─── Sliding marker on curve ───────────────────────────────────────────── */

function SlidingMarker({
  pathD,
  color,
  glow,
  progress,
  active,
}: {
  pathD: string;
  color: string;
  glow: string;
  progress: number;
  active: boolean;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current || !active) return;
    const len = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(len * progress);
    setPos({ x: point.x, y: point.y });
  }, [progress, active, pathD]);

  if (!active || !pathD) return null;

  return (
    <>
      <path ref={pathRef} d={pathD} fill="none" stroke="none" />
      {/* Outer glow */}
      <circle cx={pos.x} cy={pos.y} r={10} fill={glow} opacity={0.5}>
        <animate attributeName="r" values="8;14;8" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.4s" repeatCount="indefinite" />
      </circle>
      {/* Marker dot */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={5}
        fill={color}
        stroke="rgb(var(--surface))"
        strokeWidth={2.5}
      />
    </>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function AnimatedModelGraphs() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  const [data, setData] = useState<EpochData[]>([]);
  const [paths, setPaths] = useState<{ acc: string; loss: string; f1: string } | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [markerProgress, setMarkerProgress] = useState(0.15);

  useEffect(() => {
    const rawData = historyData;
    setData(rawData);

    // Apply Exponential Moving Average (EMA) for ultra-smooth "Apple-like" curves
    const smoothData = (data: EpochData[], weight: number = 0.2): EpochData[] => {
      if (data.length === 0) return [];
      const smoothed = [{ ...data[0] }];
      for (let i = 1; i < data.length; i++) {
        const prev = smoothed[i - 1];
        const curr = data[i];
        smoothed.push({
          epoch: curr.epoch,
          acc: prev.acc * (1 - weight) + curr.acc * weight,
          loss: prev.loss * (1 - weight) + curr.loss * weight,
          f1: prev.f1 * (1 - weight) + curr.f1 * weight,
        });
      }
      // Force the final point to exactly match the raw final point for accuracy
      smoothed[smoothed.length - 1] = { ...data[data.length - 1] };
      return smoothed;
    };

    const smoothedData = smoothData(rawData, 0.15);

    const usableW = W - PAD_X * 2;
    const usableH = H - PAD_Y * 2;

    const accPts = smoothedData.map((d, i) => ({
      x: PAD_X + (i / (EPOCHS - 1)) * usableW,
      y: PAD_Y + (1 - d.acc) * usableH,
    }));
    
    const lossPts = smoothedData.map((d, i) => ({
      x: PAD_X + (i / (EPOCHS - 1)) * usableW,
      y: PAD_Y + (1 - d.loss / MAX_LOSS) * usableH,
    }));
    
    // Visually offset F1 slightly down (-0.05) to prevent exact overlap with Accuracy
    // The tooltip will still show the exact raw values.
    const f1Pts = smoothedData.map((d, i) => ({
      x: PAD_X + (i / (EPOCHS - 1)) * usableW,
      y: PAD_Y + (1 - Math.max(0, d.f1 - 0.05)) * usableH,
    }));

    setPaths({
      acc: pointsToPath(accPts),
      loss: pointsToPath(lossPts),
      f1: pointsToPath(f1Pts),
    });
  }, []);

  // Continuously animate marker when not hovered
  useEffect(() => {
    if (!inView || reduceMotion || hoverIndex !== null) {
      if (reduceMotion && !hoverIndex) setMarkerProgress(0.75);
      return;
    }

    let frame: number;
    let start: number | null = null;
    const duration = 12000;

    function tick(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = (elapsed % duration) / duration;
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setMarkerProgress(0.05 + eased * 0.9);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, hoverIndex]);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * W;
    const usableW = W - PAD_X * 2;
    const progress = (svgX - PAD_X) / usableW;
    let idx = Math.round(progress * (EPOCHS - 1));
    idx = Math.max(0, Math.min(EPOCHS - 1, idx));
    setHoverIndex(idx);
    setMarkerProgress(idx / (EPOCHS - 1));
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const finalData = data[data.length - 1];

  return (
    <section className="relative scroll-mt-24 overflow-hidden py-24 md:py-32">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgb(var(--accent)/0.08),_transparent_60%)]"
      />

      <div className="container-content relative">
        <SectionHeader
          eyebrow="Performance Metrics"
          title="Training dynamics, visualized live"
          description="A dual-axis view of the BiLSTM training process. Accuracy and Macro-F1 plateau beautifully, while the loss curve rapidly descends and flattens out."
        />

        <Reveal>
          <div ref={ref} className="panel mt-14 overflow-hidden rounded-3xl">
            {/* Top bar with stat badges */}
            <div className="flex items-center justify-between border-b border-line/10 px-5 py-3.5 md:px-7">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-1.5">
                  <span className="font-mono text-[11px] text-faint uppercase tracking-wider">
                    {CURVE_META.accuracy.label}:
                  </span>
                  <span className={`font-mono text-sm font-semibold ${CURVE_META.accuracy.colorClass}`}>
                    {finalData ? (finalData.acc * 100).toFixed(1) + "%" : "85.2%"}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-1.5">
                  <span className="font-mono text-[11px] text-faint uppercase tracking-wider">
                    {CURVE_META.loss.label}:
                  </span>
                  <span className={`font-mono text-sm font-semibold ${CURVE_META.loss.colorClass}`}>
                    {finalData ? finalData.loss.toFixed(2) : "0.31"}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-1.5">
                  <span className="font-mono text-[11px] text-faint uppercase tracking-wider">
                    {CURVE_META.f1.label}:
                  </span>
                  <span className={`font-mono text-sm font-semibold ${CURVE_META.f1.colorClass}`}>
                    {finalData ? finalData.f1.toFixed(2) : "0.85"}
                  </span>
                </div>
              </div>
              {/* LIVE ANALYSIS pill */}
              <div className="hidden items-center gap-2 rounded-full bg-success/10 px-3.5 py-1.5 sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="font-mono text-xs font-semibold tracking-wider text-success">
                  LIVE ANALYSIS
                </span>
              </div>
            </div>

            {/* SVG Graph Container */}
            <div className="relative px-2 py-4 sm:px-4 sm:py-6">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full touch-none"
                preserveAspectRatio="xMidYMid meet"
                aria-label="Model training performance graph showing accuracy rising, loss falling, and F1 converging"
                role="img"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <defs>
                  <linearGradient id="grad-cyan" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06A8C4" />
                    <stop offset="50%" stopColor="#00D4FF" />
                    <stop offset="100%" stopColor="#38D3E8" />
                  </linearGradient>
                  <linearGradient id="grad-muted" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#586375" />
                    <stop offset="100%" stopColor="#8A8C9C" />
                  </linearGradient>
                  <linearGradient id="grad-green" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16A34A" />
                    <stop offset="50%" stopColor="#22C55E" />
                    <stop offset="100%" stopColor="#4ADE80" />
                  </linearGradient>
                  <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                </defs>

                {/* Subtle grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                  <line
                    key={frac}
                    x1={PAD_X}
                    y1={PAD_Y + frac * (H - PAD_Y * 2)}
                    x2={W - PAD_X}
                    y2={PAD_Y + frac * (H - PAD_Y * 2)}
                    stroke="rgb(var(--line))"
                    strokeOpacity={frac === 0 || frac === 1 ? 0.15 : 0.06}
                    strokeDasharray={frac === 0 || frac === 1 ? "none" : "4 6"}
                  />
                ))}

                {/* Left Y-axis labels (Acc / F1) */}
                <text x={PAD_X - 12} y={PAD_Y} textAnchor="end" dominantBaseline="middle" className="fill-faint font-mono text-[10px]">100%</text>
                <text x={PAD_X - 12} y={PAD_Y + 0.5 * (H - PAD_Y * 2)} textAnchor="end" dominantBaseline="middle" className="fill-faint font-mono text-[10px]">50%</text>
                <text x={PAD_X - 12} y={H - PAD_Y} textAnchor="end" dominantBaseline="middle" className="fill-faint font-mono text-[10px]">0%</text>
                <text x={20} y={H / 2} transform={`rotate(-90, 20, ${H / 2})`} textAnchor="middle" className="fill-muted font-mono text-[11px] font-medium tracking-wider">Accuracy (%) / Macro-F1</text>

                {/* Right Y-axis labels (Loss) */}
                <text x={W - PAD_X + 12} y={PAD_Y} textAnchor="start" dominantBaseline="middle" className="fill-faint font-mono text-[10px]">{MAX_LOSS.toFixed(1)}</text>
                <text x={W - PAD_X + 12} y={PAD_Y + 0.5 * (H - PAD_Y * 2)} textAnchor="start" dominantBaseline="middle" className="fill-faint font-mono text-[10px]">{(MAX_LOSS / 2).toFixed(1)}</text>
                <text x={W - PAD_X + 12} y={H - PAD_Y} textAnchor="start" dominantBaseline="middle" className="fill-faint font-mono text-[10px]">0.0</text>
                <text x={W - 20} y={H / 2} transform={`rotate(90, ${W - 20}, ${H / 2})`} textAnchor="middle" className="fill-muted font-mono text-[11px] font-medium tracking-wider">Loss</text>

                {/* X-axis labels (Epoch) */}
                <text x={PAD_X} y={H - 15} textAnchor="middle" className="fill-faint font-mono text-[10px]">0</text>
                <text x={W / 2} y={H - 15} textAnchor="middle" className="fill-faint font-mono text-[10px]">25</text>
                <text x={W - PAD_X} y={H - 15} textAnchor="middle" className="fill-faint font-mono text-[10px]">50</text>
                <text x={W / 2} y={H - 2} textAnchor="middle" className="fill-muted font-mono text-[11px] font-medium tracking-wider">Epoch</text>

                {/* Hover crosshair line */}
                {hoverIndex !== null && (
                  <line
                    x1={PAD_X + (hoverIndex / (EPOCHS - 1)) * (W - PAD_X * 2)}
                    y1={PAD_Y}
                    x2={PAD_X + (hoverIndex / (EPOCHS - 1)) * (W - PAD_X * 2)}
                    y2={H - PAD_Y}
                    stroke="rgb(var(--accent))"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity={0.5}
                  />
                )}

                {/* Curves */}
                {paths && (
                  <>
                    {/* Glows */}
                    <motion.path
                      d={paths.acc}
                      fill="none"
                      stroke={CURVE_META.accuracy.dotFill}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#line-glow)"
                      opacity={0.25}
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    />
                    <motion.path
                      d={paths.loss}
                      fill="none"
                      stroke={CURVE_META.loss.dotFill}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#line-glow)"
                      opacity={0.25}
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    />
                    <motion.path
                      d={paths.f1}
                      fill="none"
                      stroke={CURVE_META.f1.dotFill}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#line-glow)"
                      opacity={0.25}
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    />

                    {/* Main strokes */}
                    <motion.path
                      d={paths.acc}
                      fill="none"
                      stroke={CURVE_META.accuracy.stroke}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    />
                    <motion.path
                      d={paths.loss}
                      fill="none"
                      stroke={CURVE_META.loss.stroke}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 2, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                    />
                    <motion.path
                      d={paths.f1}
                      fill="none"
                      stroke={CURVE_META.f1.stroke}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                    />

                    {/* Sliding markers (follow hover or auto-play) */}
                    <SlidingMarker
                      pathD={paths.acc}
                      color={CURVE_META.accuracy.dotFill}
                      glow={CURVE_META.accuracy.glowColor}
                      progress={markerProgress}
                      active={inView}
                    />
                    <SlidingMarker
                      pathD={paths.loss}
                      color={CURVE_META.loss.dotFill}
                      glow={CURVE_META.loss.glowColor}
                      progress={markerProgress}
                      active={inView}
                    />
                    <SlidingMarker
                      pathD={paths.f1}
                      color={CURVE_META.f1.dotFill}
                      glow={CURVE_META.f1.glowColor}
                      progress={markerProgress}
                      active={inView}
                    />
                  </>
                )}
              </svg>

              {/* Floating Tooltip HTML Overlay */}
              {hoverIndex !== null && data[hoverIndex] && (
                <div
                  className="pointer-events-none absolute z-20 flex flex-col gap-1.5 rounded-xl border border-line/10 bg-surface/90 px-3 py-2.5 shadow-xl backdrop-blur-md transition-all duration-100 ease-out"
                  style={{
                    left: `calc(${(PAD_X + (hoverIndex / (EPOCHS - 1)) * (W - PAD_X * 2)) / W * 100}% + 12px)`,
                    top: "30%",
                  }}
                >
                  <div className="mb-1 text-xs font-semibold text-ink">
                    Epoch {data[hoverIndex].epoch}
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
                    <span className="text-faint">Acc</span>
                    <span className="text-cyan">{(data[hoverIndex].acc * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
                    <span className="text-faint">F1</span>
                    <span className="text-success">{data[hoverIndex].f1.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
                    <span className="text-faint">Loss</span>
                    <span className="text-muted">{data[hoverIndex].loss.toFixed(3)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom legend */}
            <div className="flex items-center justify-between border-t border-line/10 px-5 py-3 md:px-7">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="h-[3px] w-5 rounded-full" style={{ backgroundColor: CURVE_META.accuracy.dotFill }} />
                  <span className="text-xs text-faint">{CURVE_META.accuracy.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-[3px] w-5 rounded-full" style={{ backgroundColor: CURVE_META.loss.dotFill }} />
                  <span className="text-xs text-faint">{CURVE_META.loss.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-[3px] w-5 rounded-full" style={{ backgroundColor: CURVE_META.f1.dotFill }} />
                  <span className="text-xs text-faint">{CURVE_META.f1.label}</span>
                </div>
              </div>
              <span className="font-mono text-[11px] text-faint">
                BiLSTM + Attention Optimization
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
