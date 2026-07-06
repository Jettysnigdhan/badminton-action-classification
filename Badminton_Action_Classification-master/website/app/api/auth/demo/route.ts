import { NextResponse } from "next/server";
import { createSession, createUser, findUserByEmail, setEmailVerified } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-click demo workspace: a pre-verified shared account for trying the app.
export async function POST() {
  const email = "demo@skeletoncourt.dev";
  const existing = findUserByEmail(email);
  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    const created = createUser(email, "Demo User", crypto.randomUUID());
    setEmailVerified(created.id);
    userId = created.id;
  }
  await createSession(userId);
  return NextResponse.json({ ok: true });
}
