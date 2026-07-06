import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentUser } from "@/lib/auth-server";
import { getReport, type ReportPayload } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.39, 0.45, 0.56);
const INDIGO = rgb(0.157, 0.208, 0.576);
const CYAN = rgb(0, 0.83, 1);
const LINE = rgb(0.9, 0.92, 0.94);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const report = getReport(user.id, id);
  if (!report) return new Response("Not found", { status: 404 });
  const p = JSON.parse(report.payload) as ReportPayload;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = page.getWidth();
  const M = 50;
  let y = page.getHeight() - M;

  // Standard Helvetica uses WinAnsi, which can't encode ≥ / ≤. Map to ASCII.
  const safe = (s: string) => s.replace(/≥/g, ">=").replace(/≤/g, "<=");
  const text = (s: string, x: number, yy: number, size: number, f = font, color = INK) =>
    page.drawText(safe(s), { x, y: yy, size, font: f, color });

  // Header
  text("SKELETONCOURT", M, y, 9, bold, INDIGO);
  y -= 26;
  text(report.title, M, y, 22, bold, INK);
  y -= 18;
  text(`${report.type.toUpperCase()}  ·  ${p.rangeLabel}`, M, y, 10, font, MUTED);
  y -= 14;
  text(`Generated ${new Date(p.generatedAt).toLocaleString("en-US")}`, M, y, 9, font, MUTED);
  y -= 18;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE });
  y -= 30;

  // KPI row
  const kpis: [string, string][] = [
    ["Clips analyzed", String(p.clipCount)],
    ["Avg. confidence", p.clipCount ? `${p.avgConfidence.toFixed(1)}%` : "—"],
    ["Classes detected", `${p.classesDetected} / 5`],
    ["Flagged for review", `${p.reviewCount} (${p.reviewRate.toFixed(0)}%)`],
  ];
  const colW = (W - 2 * M) / 4;
  kpis.forEach(([label, value], i) => {
    const x = M + i * colW;
    text(value, x, y, 20, bold, INK);
    text(label, x, y - 16, 8.5, font, MUTED);
  });
  y -= 54;

  // Shot distribution
  text("Shot distribution", M, y, 13, bold, INK);
  y -= 22;
  const barMax = W - 2 * M - 170;
  if (p.distribution.length === 0) {
    text("No classifications in this report.", M, y, 10, font, MUTED);
    y -= 16;
  } else {
    for (const d of p.distribution) {
      text(d.label, M, y, 10, font, INK);
      const bx = M + 150;
      page.drawRectangle({ x: bx, y: y - 3, width: barMax, height: 8, color: LINE });
      page.drawRectangle({
        x: bx,
        y: y - 3,
        width: Math.max(2, (barMax * d.pct) / 100),
        height: 8,
        color: CYAN,
      });
      text(`${d.pct}%  (${d.count})`, bx + barMax + 10, y, 9, font, MUTED);
      y -= 22;
    }
  }
  y -= 14;

  // Confidence distribution
  text("Confidence distribution", M, y, 13, bold, INK);
  y -= 22;
  for (const b of p.confidenceBuckets) {
    text(b.label, M, y, 10, font, INK);
    text(String(b.count), M + 150, y, 10, font, MUTED);
    y -= 18;
  }
  y -= 10;

  // Source split
  text("Inference source", M, y, 13, bold, INK);
  y -= 22;
  text(`Model: ${p.modelCount}    Simulated: ${p.simulatedCount}`, M, y, 10, font, MUTED);

  // Footer
  text("SkeletonCourt · Skeleton-based badminton action classification", M, M - 14, 8, font, MUTED);

  const bytes = await doc.save();
  const safeTitle = report.title.replace(/[^\w-]+/g, "_").toLowerCase();
  return new Response(bytes as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${safeTitle}_${id}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
