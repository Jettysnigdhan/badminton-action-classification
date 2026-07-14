import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { dashboardStats, listClassifications } from "@/lib/classifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const stats = dashboardStats(user.id);
  const recent = listClassifications(user.id, 5).map((row) => ({
    id: row.id,
    filename: row.clip,
    timestamp: row.created_at,
    topAction: row.predicted,
    confidence: row.confidence,
    status: row.status,
  }));

  return NextResponse.json({ stats, recent });
}
