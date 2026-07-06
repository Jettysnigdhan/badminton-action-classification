import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { generateReport, type ReportType } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: ReportType[] = ["performance", "distribution", "quality"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { type?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const type = (TYPES.includes(body.type as ReportType) ? body.type : "performance") as ReportType;
  const report = generateReport(user.id, type);
  return NextResponse.json({ ok: true, id: report.id });
}
