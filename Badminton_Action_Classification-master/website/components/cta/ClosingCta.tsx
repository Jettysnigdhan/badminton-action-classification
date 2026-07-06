import Link from "next/link";
import { Reveal } from "../ui/Reveal";
import { TryNowButton } from "./TryNowButton";

// Final conversion band on the landing page. Premium dark slab with the primary
// Try Now action and a quiet route to Contact.
export function ClosingCta() {
  return (
    <section id="get-started" className="scroll-mt-24 py-24 md:py-28">
      <div className="container-content">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border bg-midnight px-6 py-16 text-center shadow-card md:px-16 md:py-20">
            <div aria-hidden className="absolute inset-0 dot-grid opacity-40" />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.16),_transparent_60%)]"
            />
            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-cyan" />
                The platform is live
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold tracking-display text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.05]">
                Ready to analyze badminton actions?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/60">
                Upload your first clip and get calibrated, skeleton-based shot
                classification — no shuttlecock tracking, no setup.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <TryNowButton size="lg" />
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Talk to the team
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
