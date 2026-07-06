import { NextResponse } from "next/server";
import { getCurrentUser, setTwoFactor } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  setTwoFactor(user.id, !!body.enabled);
  return NextResponse.json({ ok: true, twoFactor: !!body.enabled });
}
