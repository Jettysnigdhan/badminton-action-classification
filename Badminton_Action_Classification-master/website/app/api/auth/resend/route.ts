import { NextResponse } from "next/server";
import { getPending, getTwofaPending } from "@/lib/auth-server";
import { sendVerificationEmail, sendTwoFactorEmail, devLinkExposable } from "@/lib/mailer";
import { getDb } from "@/lib/db";
import { signMagicToken } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Check if there is a pending signup verification
  let userId = await getPending();
  let purpose: "verify" | "2fa" = "verify";
  
  if (!userId) {
    // Check if there is a pending 2fa login
    userId = await getTwofaPending();
    purpose = "2fa";
  }

  if (!userId) {
    return NextResponse.json({ error: "No pending verification." }, { status: 400 });
  }

  const user = getDb()
    .prepare("SELECT email, name FROM users WHERE id = ?")
    .get(userId) as { email: string; name: string } | undefined;
    
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const token = signMagicToken({ userId, email: user.email, purpose });
  const appUrl = process.env.NODE_ENV === "development" ? new URL(req.url).origin : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin);
  const link = new URL(`/api/auth/magic?token=${token}`, appUrl).toString();

  if (purpose === "verify") {
    await sendVerificationEmail(user.email, user.name, link);
  } else {
    await sendTwoFactorEmail(user.email, user.name, link);
  }

  return NextResponse.json({ ok: true, devLink: devLinkExposable() ? link : undefined });
}
