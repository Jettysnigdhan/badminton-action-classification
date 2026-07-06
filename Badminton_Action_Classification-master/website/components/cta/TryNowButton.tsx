"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { tryNowDestination } from "@/lib/auth";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
};

type Props = {
  size?: Size;
  label?: string;
  className?: string;
  magnetic?: boolean;
  pulse?: boolean;
};

/**
 * The primary conversion CTA. Premium treatment:
 *  - magnetic pull toward the cursor (spring physics)
 *  - animated gradient border glow + idle pulse
 *  - arrow that slides on hover
 *  - auth-aware navigation (login vs. dashboard)
 * Fully degrades under prefers-reduced-motion.
 */
export function TryNowButton({
  size = "md",
  label = "Try Now",
  className = "",
  magnetic = true,
  pulse = true,
}: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(my, { stiffness: 220, damping: 16, mass: 0.4 });

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    mx.set(relX * 0.28);
    my.set(relY * 0.4);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
    setHover(false);
  };

  const go = () => router.push(tryNowDestination());

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={go}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={reset}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      className={`group relative inline-flex items-center justify-center rounded-full font-semibold text-white ${SIZES[size]} ${className}`}
    >
      {/* Animated gradient border + glow */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[linear-gradient(110deg,#283593,#00D4FF,#4FC3F7,#283593)] bg-[length:200%_100%] transition-[background-position] duration-700 group-hover:bg-[position:100%_0]"
      />
      {/* Inner fill */}
      <span
        aria-hidden
        className="absolute inset-[1.5px] rounded-full bg-gradient-to-br from-indigo to-[#0b1b4d]"
      />
      {/* Idle pulse glow */}
      {pulse && !reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-cyan/40 blur-xl"
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* Hover sheen */}
      <span
        aria-hidden
        className="absolute inset-[1.5px] overflow-hidden rounded-full"
      >
        <span className="absolute -inset-y-2 -left-1/3 w-1/3 -skew-x-12 bg-white/20 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[400%]" />
      </span>

      <span className="relative z-10 flex items-center">
        {label}
        <motion.svg
          className="ml-1.5"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={reduce ? undefined : { x: hover ? 3 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </motion.svg>
      </span>
    </motion.button>
  );
}
