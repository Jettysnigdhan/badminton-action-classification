import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/app/StatusBadge";
import { getCurrentUser } from "@/lib/auth-server";
import { listClassifications } from "@/lib/classifications";

export default async function ClassificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const rows = listClassifications(user.id, 200);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Classifications</h2>
          <p className="mt-1 text-sm text-muted">Every shot prediction with its calibrated confidence.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-surface px-6 py-16 text-center shadow-card">
          <p className="text-sm text-muted">No classifications yet.</p>
          <Link href="/app/videos" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
            Upload a clip to get started →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Clip</th>
                  <th className="px-5 py-3 font-medium">Predicted shot</th>
                  <th className="px-5 py-3 font-medium">Confidence</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-elevated/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-muted">{row.id}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-ink">{row.clip}</td>
                    <td className="px-5 py-3.5 font-medium text-ink">{row.predicted}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-elevated">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo to-cyan" style={{ width: `${row.confidence}%` }} />
                        </div>
                        <span className="font-mono text-xs text-ink">{row.confidence.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={row.status} /></td>
                    <td className="px-5 py-3.5 text-muted">{new Date(row.created_at).toISOString().slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
