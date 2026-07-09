import { NextResponse } from "next/server";
import { ACTIONS } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth-server";
import { enqueueClassification, updateClassification, type Prediction } from "@/lib/classifications";
import { checkRateLimit } from "@/lib/rate-limit";
import { classifyClipWithFallback } from "@/lib/model-inference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- Configuration ---------------------------------------------------------
const ACCEPTED_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

// Map the model's snake_case class slugs → display names used across the UI.
const SLUG_TO_NAME = new Map(ACTIONS.map((a) => [a.slug, a.name]));
function titleCase(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Try the configured model server first, then fall back to a local Python inference path.
async function classifyWithModel(clip: File): Promise<{ predictions: Prediction[]; thumbnail?: string | null }> {
  const result = await classifyClipWithFallback(
    clip,
    SLUG_TO_NAME,
    titleCase,
    {
      modelServerUrl: process.env.MODEL_SERVER_URL ?? "http://127.0.0.1:8000",
    }
  );
  return { predictions: result.predictions, thumbnail: result.thumbnail ?? null };
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const user = await getCurrentUser();
  const rateLimitKey = user ? `ratelimit:classify:${user.id}` : `ratelimit:classify:${ip}`;
  const rateLimit = await checkRateLimit(rateLimitKey, 30, 60 * 1000); // 30 req / 1 minute

  if (!rateLimit.success) {
    console.warn(`[SECURITY] Rate limit exceeded on classify for ${rateLimitKey}`);
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { 
        status: 429, 
        headers: { 
          "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        } 
      }
    );
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Malformed FormData." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Missing required file field." }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File size out of bounds." }, { status: 413 });
  }

  if (!ACCEPTED_TYPES.has(file.type)) {
    console.warn(`[SECURITY] Invalid MIME type detected from IP: ${ip}. MIME: ${file.type}`);
    return NextResponse.json({ error: "Unsupported media type." }, { status: 415 });
  }

  // Randomize storage name and sanitize
  const safeName = `${crypto.randomUUID()}-${file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 80)}`;

  let classificationId = "guest-" + Date.now();
  if (user) {
    const ids = enqueueClassification({
      userId: user.id,
      filename: safeName,
      size: file.size,
      mime: file.type
    });
    classificationId = ids.classificationId;
  }

  try {
    let predictions: Prediction[];
    let thumbnail: string | null = null;
    let usedModel = false;
    try {
      const result = await classifyWithModel(file);
      predictions = result.predictions;
      thumbnail = result.thumbnail ?? null;
      usedModel = true;
    } catch (err) {
      console.error("Model server classification failed.", err);
      return NextResponse.json(
        { error: "Classification failed. The trained model server is unavailable." },
        { status: 503 }
      );
    }

    if (user) {
      updateClassification(classificationId, {
        predictions,
        source: usedModel ? "model" : "simulated",
        status: "complete"
      });
    }

    console.log(`[CLASSIFY] usedModel=${usedModel} job=${classificationId} size=${file.size}`);
    return NextResponse.json({ 
      jobId: classificationId,
      status: "complete",
      usedModel,
      predictions,
      thumbnail,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CLASSIFY ERROR]", error);
    if (user) {
      updateClassification(classificationId, {
        predictions: [],
        source: "error",
        status: "error"
      });
    }
    return NextResponse.json({ error: "Classification failed." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
}
