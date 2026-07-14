import { NextResponse } from "next/server";
import { ACTIONS } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Keypoint = [number, number, number];
type Prediction = { action: string; confidence: number };

const labels = new Map(ACTIONS.map((action) => [action.slug, action.name]));

function titleCase(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isKeypointSequence(value: unknown): value is Keypoint[][] {
  return Array.isArray(value) && value.length >= 2 && value.length <= 240 && value.every(
    (frame) => Array.isArray(frame) && frame.length === 17 && frame.every(
      (point) => Array.isArray(point) && point.length === 3 && point.every(
        (coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate),
      ),
    ),
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = user ? `ratelimit:keypoints:${user.id}` : `ratelimit:keypoints:${ip}`;
  // A live stream submits a small overlapping window frequently.
  const limit = await checkRateLimit(key, 180, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Live classification rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !isKeypointSequence(body.keypoints)) {
    return NextResponse.json(
      { error: "keypoints must be 2–240 frames of 17 [x, y, confidence] values." },
      { status: 422 },
    );
  }

  const modelUrl = (process.env.MODEL_SERVER_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
  try {
    const response = await fetch(`${modelUrl}/v1/predict/keypoints`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keypoints: body.keypoints }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: detail || "Model server rejected the keypoints." }, { status: 503 });
    }

    const result = await response.json() as { probabilities?: Record<string, number>; abstain?: boolean };
    const predictions: Prediction[] = Object.entries(result.probabilities ?? {})
      .map(([slug, probability]) => ({
        action: labels.get(slug) ?? titleCase(slug),
        confidence: Math.round(probability * 1000) / 10,
      }))
      .sort((a, b) => b.confidence - a.confidence);
    return NextResponse.json({ predictions, abstain: Boolean(result.abstain) });
  } catch {
    return NextResponse.json({ error: "Model server is unavailable." }, { status: 503 });
  }
}
