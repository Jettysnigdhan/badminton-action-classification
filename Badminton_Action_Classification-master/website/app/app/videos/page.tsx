import { redirect } from "next/navigation";
import { VideoUploader } from "@/components/app/VideoUploader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { getCurrentUser } from "@/lib/auth-server";
import { listVideos } from "@/lib/classifications";

export default async function VideosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const videos = listVideos(user.id, 100);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Upload &amp; analyze</h2>
        <p className="mt-1.5 text-sm text-muted">Drop a clip to run the skeleton-based classification pipeline.</p>
      </div>

      <VideoUploader />

      <section className="panel overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-line/[0.08] px-5 py-4">
          <h3 className="font-display text-base font-semibold tracking-tight text-ink">Your videos</h3>
          {videos.length > 0 && (
            <span className="rounded-full bg-overlay/60 px-2.5 py-0.5 text-xs font-medium text-muted tnum">
              {videos.length}
            </span>
          )}
        </div>
        {videos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-overlay/60 text-faint">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16"/></svg>
            </span>
            <p className="text-sm text-muted">No uploads yet — analyze a clip above.</p>
          </div>
        ) : (
          <div className="divide-y divide-line/[0.06]">
            {videos.map((row) => (
              <div key={row.id} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-overlay/40">
                <span className="grid h-10 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-midnight to-indigo/40 text-cyan ring-1 ring-inset ring-line/10 transition-transform duration-200 group-hover:scale-[1.04]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z"/></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] text-ink">{row.filename}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="tnum">{new Date(row.created_at).toISOString().slice(0, 10)}</span>
                    {row.predicted ? (
                      <>
                        {" · predicted "}
                        <span className="font-medium text-faint">{row.predicted}</span>
                      </>
                    ) : ""}
                  </p>
                </div>
                <StatusBadge status={row.status ?? "complete"} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
