import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken } from "@/lib/jwt";
import {
  findUserByEmail,
  getPending,
  clearPending,
  getTwofaPending,
  clearTwofaPending,
  setEmailVerified,
  createSession,
} from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/auth/login", req.url);

  if (!token) {
    loginUrl.searchParams.set("error", "missing_token");
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyMagicToken(token);
  if (!payload) {
    loginUrl.searchParams.set("error", "invalid_token");
    return NextResponse.redirect(loginUrl);
  }

  const user = findUserByEmail(payload.email);
  if (!user || user.id !== payload.sub) {
    loginUrl.searchParams.set("error", "user_not_found");
    return NextResponse.redirect(loginUrl);
  }

  if (payload.purpose === "verify") {
    if (user.email_verified) {
      // Idempotent: already verified, just login and redirect
      await createSession(user.id);
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }

    const pendingUserId = await getPending();
    if (pendingUserId !== user.id) {
      loginUrl.searchParams.set("error", "no_pending_verification");
      return NextResponse.redirect(loginUrl);
    }

    setEmailVerified(user.id);
    await clearPending();
    await createSession(user.id);
    
    // Different redirect destinations as suggested
    return NextResponse.redirect(new URL("/app/dashboard?verified=1", req.url));
  }

  if (payload.purpose === "2fa") {
    const pendingTwofaId = await getTwofaPending();
    if (pendingTwofaId !== user.id) {
      loginUrl.searchParams.set("error", "no_pending_2fa");
      return NextResponse.redirect(loginUrl);
    }

    await clearTwofaPending();
    await createSession(user.id);
    return NextResponse.redirect(new URL("/app/dashboard", req.url));
  }

  loginUrl.searchParams.set("error", "invalid_purpose");
  return NextResponse.redirect(loginUrl);
}
