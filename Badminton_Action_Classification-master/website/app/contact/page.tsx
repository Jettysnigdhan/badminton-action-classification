import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch about skeleton-based badminton action classification — research collaboration, enterprise deployment, or product questions.",
};

const CHANNELS = [
  { label: "Research", value: "research@skeletoncourt.dev", icon: "flask" },
  { label: "Sales", value: "sales@skeletoncourt.dev", icon: "chart" },
  { label: "Support", value: "support@skeletoncourt.dev", icon: "life" },
];

function Icon({ name }: { name: string }) {
  const c = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "flask") return <svg {...c}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /><path d="M7.5 15h9" /></svg>;
  if (name === "chart") return <svg {...c}><path d="M3 3v18h18M8 17V9M13 17V5M18 17v-6" /></svg>;
  return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>;
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="pt-32">
        <section className="container-content grid gap-12 pb-24 md:pb-32 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow">
              <span className="h-1 w-1 rounded-full bg-accent" /> Contact
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-display text-ink md:text-5xl">
              Let&apos;s talk
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted">
              Questions about the method, a deployment, or a research
              collaboration? Send a note — we read every message.
            </p>
            <ul className="mt-9 space-y-3">
              {CHANNELS.map((c) => (
                <li key={c.label} className="flex items-center gap-3 rounded-2xl border bg-surface px-4 py-3.5 shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-elevated text-indigo dark:text-cyan">
                    <Icon name={c.icon} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{c.label}</p>
                    <a href={`mailto:${c.value}`} className="text-sm text-muted hover:text-ink">{c.value}</a>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
