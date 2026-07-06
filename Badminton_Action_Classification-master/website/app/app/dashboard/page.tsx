import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/app/StatusBadge";
import { getCurrentUser } from "@/lib/auth-server";
import { dashboardStats, listClassifications } from "@/lib/classifications";

function StatIcon({ name }: { name: string }) {
  const c = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "film": return <svg {...c}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>;
    case "gauge": return <svg {...c}><path d="M12 14l3-3"/><path d="M3.5 18a9 9 0 1 1 17 0"/></svg>;
    case "layers": return <svg {...c}><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></svg>;
    default: return <svg {...c}><path d="M4 22V4h13l-1.5 4L17 12H4"/></svg>;
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const stats = dashboardStats(user.id);
  const recent = listClassifications(user.id, 5);

  const cards = [
    { label: "Clips analyzed", value: String(stats.total), delta: stats.total ? "all time" : "none yet", icon: "film" },
    { label: "Avg. confidence", value: stats.total ? `${stats.avg.toFixed(1)}%` : "—", delta: "across clips", icon: "gauge" },
    { label: "Classes detected", value: `${stats.classes} / 5`, delta: stats.classes === 5 ? "full coverage" : "of 5 shots", icon: "layers" },
    { label: "Flagged for review", value: String(stats.review), delta: "needs a look", icon: "flag" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border bg-midnight p-6 text-white md:p-8">
        <div aria-hidden className="absolute inset-0 dot-grid opacity-40" />
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.18),_transparent_60%)]" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h2>
            <p className="mt-2 max-w-md text-white/60">
              Upload a badminton clip and get calibrated, skeleton-based shot classification in seconds.
            </p>
          </div>
          <Link href="/app/videos" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo to-cyan px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
            Upload a clip
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-surface p-5 shadow-card">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-elevated text-indigo dark:text-cyan">
              <StatIcon name={s.icon} />
            </span>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">{s.value}</p>
            <p className="mt-1 text-sm font-medium text-ink">{s.label}</p>
            <p className="mt-0.5 text-xs text-muted">{s.delta}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Recent classifications</h3>
            <Link href="/app/classifications" className="text-sm font-medium text-accent hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted">No classifications yet.</p>
              <Link href="/app/videos" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">Upload your first clip →</Link>
            </div>
          ) : (
            <div className="divide-y">
              {recent.map((row) => (
                <div key={row.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-elevated text-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m8 5 11 7-11 7z"/></svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{row.predicted}</p>
                    <p className="truncate font-mono text-xs text-muted">{row.clip}</p>
                  </div>
                  <span className="hidden font-mono text-sm font-semibold text-ink sm:block">{row.confidence.toFixed(1)}%</span>
                  <StatusBadge status={row.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-surface p-5 shadow-card">
          <h3 className="font-display text-base font-semibold tracking-tight text-ink">Shot distribution</h3>
          <p className="mt-1 text-xs text-muted">Across {stats.total} analyzed clip{stats.total === 1 ? "" : "s"}</p>
          {stats.distribution.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Run a few classifications to see the breakdown.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {stats.distribution.map((d) => (
                <div key={d.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-ink">{d.label}</span>
                    <span className="font-mono text-xs text-muted">{d.value}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo to-cyan" style={{ width: `${d.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
