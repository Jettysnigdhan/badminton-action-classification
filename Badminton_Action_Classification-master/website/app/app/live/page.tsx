import { redirect } from "next/navigation";
import { LivePoseAnalyzer } from "@/components/app/LivePoseAnalyzer";
import { getCurrentUser } from "@/lib/auth-server";

export default async function LivePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/app/live");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Live shot analysis</h2>
        <p className="mt-1.5 text-sm text-muted">Record live from your webcam and get your badminton shots classified instantly.</p>
      </div>
      <LivePoseAnalyzer />
    </div>
  );
}
