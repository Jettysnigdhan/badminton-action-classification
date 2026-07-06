import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center px-6">
      <div className="text-center">
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-display text-ink">
          Off the court
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">
          That page doesn&apos;t exist. Let&apos;s get you back to the research.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-canvas transition-transform hover:-translate-y-0.5"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
