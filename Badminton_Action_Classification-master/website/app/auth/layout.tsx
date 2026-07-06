import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { SkeletonCanvas } from "@/components/SkeletonCanvas";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const POINTS = [
  "Skeleton-based classification — no shuttlecock tracking",
  "Calibrated, per-class confidence on every clip",
  "Reproducible, leakage-safe evaluation you can trust",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-midnight lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="absolute inset-0 dot-grid opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/4 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.14),_transparent_60%)]"
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-white">
            SkeletonCourt
          </span>
        </Link>

        <div className="relative mx-auto w-full max-w-xs">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10">
            <SkeletonCanvas className="h-full w-full" />
          </div>
        </div>

        <div className="relative">
          <p className="font-display text-xl font-medium leading-snug tracking-tight text-white/90">
            Advancing sports intelligence through human pose understanding.
          </p>
          <ul className="mt-6 space-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-white/55">
                <svg className="shrink-0 text-cyan" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form area */}
      <main className="relative flex flex-col items-center justify-center px-6 py-12">
        <Link
          href="/"
          className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink lg:hidden"
        >
          <BrandMark className="h-7 w-7" />
          <span className="font-display font-semibold text-ink">SkeletonCourt</span>
        </Link>
        {children}
        <p className="absolute bottom-6 text-xs text-muted">
          <Link href="/" className="hover:text-ink">
            ← Back to site
          </Link>
        </p>
      </main>
    </div>
  );
}
