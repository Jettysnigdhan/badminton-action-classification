import { NextResponse } from "next/server";
import {
  createSession,
  findUserByEmail,
  setPending,
  setTwofaPending,
  verifyPassword,
  checkLockout,
  recordFailedLogin,
  clearFailedLogin,
} from "@/lib/auth-server";
import { sendTwoFactorEmail, sendVerificationEmail, devLinkExposable } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";
import { signMagicToken } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate Limiting: 5 requests / 15 minutes per IP
  const rateLimit = await checkRateLimit(`ratelimit:login:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimit.success) {
    console.warn(`[SECURITY] Rate limit exceeded on login for IP: ${ip}`);
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const lowerEmail = email.toLowerCase();

  // Check Account Lockout
  if (await checkLockout(lowerEmail)) {
    console.warn(`[SECURITY] Attempted login on locked account: ${lowerEmail} from IP: ${ip}`);
    return NextResponse.json(
      { error: "Account is temporarily locked due to multiple failed login attempts." },
      { status: 403 }
    );
  }

  const user = findUserByEmail(lowerEmail);
  if (!user || !verifyPassword(password, user.password_hash)) {
    // Record failure
    await recordFailedLogin(lowerEmail);
    console.warn(`[SECURITY] Failed login attempt for: ${lowerEmail} from IP: ${ip}`);
    // Same message for both to avoid user enumeration.
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  // Clear failed login attempts upon successful credential verification
  await clearFailedLogin(lowerEmail);

  const appUrl = process.env.NODE_ENV === "development" ? new URL(req.url).origin : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin);

  // Unverified accounts get bounced to verification with a fresh link.
  if (!user.email_verified) {
    await setPending(user.id);
    const token = signMagicToken({ userId: user.id, email: user.email, purpose: "verify" });
    const link = new URL(`/api/auth/magic?token=${token}`, appUrl).toString();
    
    await sendVerificationEmail(user.email, user.name, link);
    return NextResponse.json(
      { error: "verify", devLink: devLinkExposable() ? link : undefined },
      { status: 403 }
    );
  }

  // Email 2FA: if enabled, require an emailed link before issuing a session.
  if (user.twofa_enabled) {
    await setTwofaPending(user.id);
    const token = signMagicToken({ userId: user.id, email: user.email, purpose: "2fa" });
    const link = new URL(`/api/auth/magic?token=${token}`, appUrl).toString();

    await sendTwoFactorEmail(user.email, user.name, link);
    return NextResponse.json({
      twofa: true,
      email: user.email,
      devLink: devLinkExposable() ? link : undefined,
    });
  }

  await createSession(user.id);
  console.log(`[AUTH] Successful login for: ${lowerEmail}`);
  return NextResponse.json({ ok: true });
}
