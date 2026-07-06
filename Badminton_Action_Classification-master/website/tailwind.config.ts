import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        midnight: "#07111F",
        indigo: {
          DEFAULT: "#283593",
          50: "#eef0fb",
          100: "#d6dbf4",
          600: "#283593",
          700: "#1f2974",
        },
        cyan: {
          DEFAULT: "#00D4FF",
          glow: "#33ddff",
          hover: "#4FC3F7",
        },
        success: "#22C55E",
        warning: "#F5A524",
        error: "#F4475C",
        info: "#3B82F6",
        // Semantic tokens driven by CSS variables (see globals.css)
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        elevated: "rgb(var(--elevated) / <alpha-value>)",
        overlay: "rgb(var(--overlay) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-fg": "rgb(var(--accent-fg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter-tight)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      maxWidth: {
        content: "1200px",
        prose: "68ch",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        // Dark-aware elevation: ink-based ambient shadow + inner top highlight.
        card: "inset 0 1px 0 0 rgb(var(--edge) / var(--edge-alpha)), 0 1px 2px 0 rgb(var(--shadow-color) / 0.06), 0 12px 32px -16px rgb(var(--shadow-color) / 0.5)",
        "card-hover":
          "inset 0 1px 0 0 rgb(var(--edge) / var(--edge-alpha)), 0 2px 4px 0 rgb(var(--shadow-color) / 0.08), 0 28px 56px -20px rgb(var(--shadow-color) / 0.6)",
        glow: "0 0 0 1px rgb(var(--accent) / 0.3), 0 14px 44px -10px rgb(var(--accent) / 0.4)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "grid-flow": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "40px 40px" },
        },
        "draw-path": {
          "0%": { strokeDashoffset: "1" },
          "100%": { strokeDashoffset: "0" },
        },
        "dot-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.4)", opacity: "0.7" },
        },
        "step-ring-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.2" },
          "50%": { transform: "scale(1.15)", opacity: "0.08" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "grid-flow": "grid-flow 8s linear infinite",
        "draw-path": "draw-path 2s cubic-bezier(0.16,1,0.3,1) forwards",
        "dot-pulse": "dot-pulse 2.4s ease-in-out infinite",
        "step-ring-pulse": "step-ring-pulse 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
