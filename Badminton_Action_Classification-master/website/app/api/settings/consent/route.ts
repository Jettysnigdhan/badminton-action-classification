import { NextResponse } from "next/server";
import { getCurrentUser, setConsent } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { consent?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  setConsent(user.id, !!body.consent);
  return NextResponse.json({ ok: true, consent: !!body.consent });
}
