import "server-only";
import { getDb, newId } from "./db";

export type ReportType = "performance" | "distribution" | "quality";

export type ReportPayload = {
  generatedAt: number;
  clipCount: number;
  rangeLabel: string;
  avgConfidence: number;
  classesDetected: number;
  reviewCount: number;
  reviewRate: number;
  topShot: string | null;
  modelCount: number;
  simulatedCount: number;
  distribution: { label: string; count: number; pct: number }[];
  confidenceBuckets: { label: string; count: number }[];
};

export type ReportRow = {
  id: string;
  title: string;
  type: ReportType;
  range_label: string;
  clip_count: number;
  payload: string;
  created_at: number;
};

const TITLES: Record<ReportType, string> = {
  performance: "Performance digest",
  distribution: "Shot-distribution summary",
  quality: "Calibration & quality audit",
};

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Compute a real snapshot from the user's classifications.
export function buildPayload(userId: string): ReportPayload {
  const db = getDb();
  const rows = db
    .prepare("SELECT predicted, confidence, status, source, created_at FROM classifications WHERE user_id = ?")
    .all(userId) as {
    predicted: string;
    confidence: number;
    status: string;
    source: string;
    created_at: number;
  }[];

  const clipCount = rows.length;
  const avgConfidence = clipCount ? rows.reduce((s, r) => s + r.confidence, 0) / clipCount : 0;
  const reviewCount = rows.filter((r) => r.status === "review").length;
  const modelCount = rows.filter((r) => r.source === "model").length;
  const simulatedCount = clipCount - modelCount;

  const byClass = new Map<string, number>();
  for (const r of rows) byClass.set(r.predicted, (byClass.get(r.predicted) ?? 0) + 1);
  const distribution = [...byClass.entries()]
    .map(([label, count]) => ({ label, count, pct: clipCount ? Math.round((count / clipCount) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  const buckets = [
    { label: "≥ 90%", count: rows.filter((r) => r.confidence >= 90).length },
    { label: "75–90%", count: rows.filter((r) => r.confidence >= 75 && r.confidence < 90).length },
    { label: "50–75%", count: rows.filter((r) => r.confidence >= 50 && r.confidence < 75).length },
    { label: "< 50%", count: rows.filter((r) => r.confidence < 50).length },
  ];

  let rangeLabel = "No data yet";
  if (clipCount) {
    const min = Math.min(...rows.map((r) => r.created_at));
    const max = Math.max(...rows.map((r) => r.created_at));
    rangeLabel = fmtDate(min) === fmtDate(max) ? fmtDate(min) : `${fmtDate(min)} – ${fmtDate(max)}`;
  }

  return {
    generatedAt: Date.now(),
    clipCount,
    rangeLabel,
    avgConfidence,
    classesDetected: byClass.size,
    reviewCount,
    reviewRate: clipCount ? (reviewCount / clipCount) * 100 : 0,
    topShot: distribution[0]?.label ?? null,
    modelCount,
    simulatedCount,
    distribution,
    confidenceBuckets: buckets,
  };
}

export function generateReport(userId: string, type: ReportType): ReportRow {
  const payload = buildPayload(userId);
  const id = newId("rep");
  const now = Date.now();
  const row: ReportRow = {
    id,
    title: TITLES[type],
    type,
    range_label: payload.rangeLabel,
    clip_count: payload.clipCount,
    payload: JSON.stringify(payload),
    created_at: now,
  };
  getDb()
    .prepare(
      "INSERT INTO reports (id, user_id, title, type, range_label, clip_count, payload, created_at) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(id, userId, row.title, row.type, row.range_label, row.clip_count, row.payload, now);
  return row;
}

export function listReports(userId: string): ReportRow[] {
  return getDb()
    .prepare("SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as ReportRow[];
}

export function getReport(userId: string, id: string): ReportRow | null {
  return (
    (getDb().prepare("SELECT * FROM reports WHERE id = ? AND user_id = ?").get(id, userId) as ReportRow | undefined) ??
    null
  );
}

export function deleteReport(userId: string, id: string) {
  getDb().prepare("DELETE FROM reports WHERE id = ? AND user_id = ?").run(id, userId);
}
