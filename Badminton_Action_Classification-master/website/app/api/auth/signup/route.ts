import { NextResponse } from "next/server";
import {
  createUser,
  findUserByEmail,
  setPending,
} from "@/lib/auth-server";
import { sendVerificationEmail, devLinkExposable } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations";
import { signMagicToken } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate Limiting: 3 requests / 1 hour per IP
  const rateLimit = await checkRateLimit(`ratelimit:signup:${ip}`, 3, 60 * 60 * 1000);
  if (!rateLimit.success) {
    console.warn(`[SECURITY] Rate limit exceeded on signup for IP: ${ip}`);
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        },
      }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request format." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const existingUser = findUserByEmail(lowerEmail);
  if (existingUser) {
    if (existingUser.email_verified) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    // If not verified, we can allow re-sending the link by dropping down, but currently createUser will fail on UNIQUE constraint.
    // For simplicity, let's keep the existing logic that fails if it exists, or they can use "Resend".
    return NextResponse.json({ error: "An account with that email already exists. Please verify or log in." }, { status: 409 });
  }

  const user = createUser(lowerEmail, name, password);
  await setPending(user.id);
  
  const token = signMagicToken({ userId: user.id, email: lowerEmail, purpose: "verify" });
  const appUrl = process.env.NODE_ENV === "development" ? new URL(req.url).origin : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin);
  const link = new URL(`/api/auth/magic?token=${token}`, appUrl).toString();

  await sendVerificationEmail(lowerEmail, name, link);
  
  console.log(`[AUTH] New user signup: ${lowerEmail}`);

  return NextResponse.json({
    ok: true,
    email: lowerEmail,
    // Only present in dev without SMTP, so verification is testable locally.
    devLink: devLinkExposable() ? link : undefined,
  });
}
