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
      <path d="M16 26c0 3.3 2.7 6 6 6s6-2.7 6-6-2.7-6-6-6-6 2.7-6 6Z" />
      <path d="M20 20 14 26 20 32" />
      <path d="M22 20 28 26 22 32" />
      <path d="M20 10c1.2 2.1.5 4.7-1.5 6.4C16.5 18.7 14 18.9 12 18" />
      <path d="M26 10c-1.2 2.1-.5 4.7 1.5 6.4 2 1.7 4.5 1.9 6.5 1.4" />
      {slug === "forehand_clear" ? <path d="M12 12 34 6" /> : null}
      {slug === "backhand_clear" ? <path d="M12 6 34 12" /> : null}
      {slug === "forehand_drive" ? <path d="M12 16 34 16" /> : null}
      {slug === "backhand_drive" ? <path d="M12 26 34 26" /> : null}
      {slug === "backhand_net_shot" ? <path d="M12 22 34 10" /> : null}
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

        <div className="mt-14 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SHOTS.map((shot, index) => (
            <Reveal key={shot.title} delay={index * 0.06}>
              <article className="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-surface p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mb-5 overflow-hidden rounded-[1.75rem] bg-slate-950/10">
                  {shot.video ? (
                    <video
                      className="h-56 w-full object-cover sm:h-60"
                      src={shot.video}
                      muted
                      loop
                      playsInline
                      preload="auto"
                      poster={shot.image}
                      onMouseEnter={(event) => {
                        const video = event.currentTarget as HTMLVideoElement;
                        video.play().catch(() => undefined);
                      }}
                      onMouseLeave={(event) => {
                        const video = event.currentTarget as HTMLVideoElement;
                        video.pause();
                        video.currentTime = 0;
                      }}
                    />
                  ) : shot.image ? (
                    <div
                      className="h-56 w-full bg-cover bg-center sm:h-60"
                      style={{
                        backgroundImage: `linear-gradient(rgba(15,23,42,0.08), rgba(15,23,42,0.08)), url('${shot.image}')`,
                      }}
                    />
                  ) : (
                    <div className="h-56 w-full sm:h-60">
                      <ShotGraphic slug={shot.slug} />
                    </div>
                  )}
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                  {shot.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">{shot.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{shot.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
