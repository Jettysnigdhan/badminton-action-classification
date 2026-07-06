import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { listReports } from "@/lib/reports";
import { NewReportMenu } from "@/components/app/NewReportMenu";

const TYPE_LABEL: Record<string, string> = {
  performance: "Performance",
  distribution: "Distribution",
  quality: "Quality",
};

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const reports = listReports(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Reports</h2>
          <p className="mt-1 text-sm text-muted">Generated summaries across your analyzed clips.</p>
        </div>
        <NewReportMenu />
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border bg-surface px-6 py-16 text-center shadow-card">
          <p className="text-sm font-medium text-ink">No reports yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Generate a report to summarize your classifications — performance, shot
            distribution, or calibration quality.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <article key={r.id} className="flex flex-col rounded-2xl border bg-surface p-5 shadow-card">
              <span className="inline-flex w-fit items-center rounded-full bg-elevated px-2.5 py-1 text-xs font-medium text-muted">
                {TYPE_LABEL[r.type] ?? r.type}
              </span>
              <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-ink">{r.title}</h3>
              <p className="mt-1 text-sm text-muted">{r.range_label}</p>
              <p className="mt-4 text-xs text-muted">
                {r.clip_count} clip{r.clip_count === 1 ? "" : "s"} · {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              <div className="mt-5 flex gap-2 border-t pt-4">
                <Link
                  href={`/app/reports/${r.id}`}
                  className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium text-ink hover:bg-elevated"
                >
                  View
                </Link>
                <a
                  href={`/api/reports/${r.id}/pdf`}
                  className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium text-ink hover:bg-elevated"
                >
                  Download PDF
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
