"use client";

import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

type Shot = {
  title: string;
  subtitle: string;
  description: string;
  slug: string;
  video?: string;
  image?: string;
};

const SHOTS: Shot[] = [
  {
    title: "Forehand Drive",
    subtitle: "Fast flat stroke from the forehand side",
    description:
      "A powerful, low trajectory shot that travels straight across the net. It is used to keep the rally fast and force the opponent back.",
    slug: "forehand_drive",
    video: "/shots/forehand_drive.mp4",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Backhand Drive",
    subtitle: "Quick counter from the backhand side",
    description:
      "A rapid flat stroke that is hit from the backhand side. It is ideal for maintaining pace and pressuring the opponent on the non-dominant wing.",
    slug: "backhand_drive",
    video: "/shots/backhand_drive.mp4",
    image:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Forehand Clear",
    subtitle: "High defensive shot to the rear court",
    description:
      "A deep overhead shot that pushes the shuttle high and toward the back of the court. Used to recover from attack and reset the rally.",
    slug: "forehand_clear",
    video: "/shots/forehand_clear.mp4",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Forehand Net Shot",
    subtitle: "Soft touch shot near the net",
    description:
      "A delicate forehand shot played close to the net to draw the opponent forward and open up the court for the next attack.",
    slug: "forehand_net_shot",
    video: "/shots/forehand_net_shot.mp4",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Backhand Net Shot",
    subtitle: "Soft backhand touch near the net",
    description:
      "A delicate backhand shot played close to the net to force the opponent forward and open up the court for the next attacking opportunity.",
    slug: "backhand_net_shot",
    video: "/shots/backhand_net_shot.mp4",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
  },
];

function ShotGraphic({ slug }: { slug: string }) {
  const common = {
    width: 46,
    height: 46,
    viewBox: "0 0 46 46",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg {...common} className="h-24 w-24 text-cyan-500">
      <path d="M15 18c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5-5 2.24-5 5Z" />
      <path d="M17 15 13 19 17 23" />
      <path d="M19 15 23 19 19 23" />
      <path d="M16 5c1.75 0 3.17 1.5 3.17 3.35 0 1.6-1 3-2.4 3.5-1.25.43-2.4.26-3.37-.35-.8-.5-1.5-1.28-1.5-2.2C11.5 7.2 12.9 5 14.6 5h1.4Z" />
      <path d="M30 7c0 2.8-1.5 4.9-3.3 6.4-1.8 1.5-3.8 2.3-5.4 2.4" />
      {slug === "forehand_clear" ? <path d="M13 13 33 7" /> : null}
      {slug === "backhand_clear" ? <path d="M13 7 33 13" /> : null}
      {slug === "forehand_drive" ? <path d="M13 17 33 17" /> : null}
      {slug === "backhand_drive" ? <path d="M13 27 33 27" /> : null}
      {slug === "backhand_net_shot" ? <path d="M13 23 33 11" /> : null}
    </svg>
  );
}

export function ShotDefinitions() {
  return (
    <section id="shots" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          eyebrow="Shot Library"
          title="Understand the key badminton strokes the model recognizes"
          description="Each card describes a common shot type so viewers can connect the prediction to real tactical meaning on court."
        />

        <div className="relative mt-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_45%)] blur-3xl" />
          <div className="mt-6 flex gap-6 overflow-x-auto pb-6 pl-4 pr-2 sm:pl-0 sm:pr-0 lg:px-0">
            {SHOTS.map((shot, index) => (
              <Reveal key={shot.title} delay={index * 0.08} y={28}>
                <article className="snap-center min-w-[320px] max-w-[360px] flex-shrink-0 overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-950/95 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.7)] transition-all duration-500 hover:-translate-y-3 hover:shadow-cyan-500/35">
                  <div className="h-2 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500" />
                  <div className="px-6 py-6 sm:px-7">
                    <div className="mb-6 flex items-center justify-between gap-3">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20 shadow-sm">
                        <ShotGraphic slug={shot.slug} />
                      </div>
                      <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200 ring-1 ring-cyan-500/15">
                        {shot.subtitle.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
                      {shot.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-slate-300">{shot.description}</p>
                  </div>
                  <div className="border-t border-slate-800/80 bg-slate-950/95 px-6 py-4 text-sm text-slate-400">
                    <span className="font-medium text-slate-100">Shot focus:</span> court control, speed, and tactical timing.
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
