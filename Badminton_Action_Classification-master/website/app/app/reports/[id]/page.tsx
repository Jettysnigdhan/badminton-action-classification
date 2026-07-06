import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { getReport, type ReportPayload } from "@/lib/reports";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { id } = await params;
  const report = getReport(user.id, id);
  if (!report) notFound();
  const p = JSON.parse(report.payload) as ReportPayload;

  const kpis = [
    { label: "Clips analyzed", value: String(p.clipCount) },
    { label: "Avg. confidence", value: p.clipCount ? `${p.avgConfidence.toFixed(1)}%` : "—" },
    { label: "Classes detected", value: `${p.classesDetected} / 5` },
    { label: "Flagged for review", value: `${p.reviewCount} (${p.reviewRate.toFixed(0)}%)` },
  ];
  const maxBucket = Math.max(1, ...p.confidenceBuckets.map((b) => b.count));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/app/reports" className="text-sm text-muted hover:text-ink">← All reports</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{report.title}</h2>
            <p className="mt-1 text-sm text-muted">
              {report.type.charAt(0).toUpperCase() + report.type.slice(1)} · {p.rangeLabel} ·
              generated {new Date(p.generatedAt).toLocaleString("en-US")}
            </p>
          </div>
          <a
            href={`/api/reports/${report.id}/pdf`}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-transform hover:-translate-y-0.5"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
            Download PDF
          </a>
        </div>
      </div>

      {p.clipCount === 0 ? (
        <div className="rounded-2xl border bg-surface px-6 py-16 text-center shadow-card">
          <p className="text-sm font-medium text-ink">This report has no data</p>
          <p className="mt-1 text-sm text-muted">Analyze some clips, then generate a fresh report.</p>
          <Link href="/app/videos" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">Upload a clip →</Link>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border bg-surface p-5 shadow-card">
                <p className="font-display text-2xl font-semibold tracking-tight text-ink">{k.value}</p>
                <p className="mt-1 text-sm text-muted">{k.label}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border bg-surface p-6 shadow-card">
              <h3 className="font-display text-base font-semibold tracking-tight text-ink">Shot distribution</h3>
              <div className="mt-5 space-y-4">
                {p.distribution.map((d) => (
                  <div key={d.label}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink">{d.label}</span>
                      <span className="font-mono text-xs text-muted">{d.pct}% · {d.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo to-cyan" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border bg-surface p-6 shadow-card">
              <h3 className="font-display text-base font-semibold tracking-tight text-ink">Confidence</h3>
              <div className="mt-5 space-y-3">
                {p.confidenceBuckets.map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 font-mono text-xs text-muted">{b.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
                      <div className="h-full rounded-full bg-indigo" style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                    </div>
                    <span className="w-6 shrink-0 text-right font-mono text-xs text-ink">{b.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-4 text-sm">
                <p className="flex justify-between"><span className="text-muted">Model inferences</span><span className="font-medium text-ink">{p.modelCount}</span></p>
                <p className="mt-1.5 flex justify-between"><span className="text-muted">Simulated</span><span className="font-medium text-ink">{p.simulatedCount}</span></p>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
