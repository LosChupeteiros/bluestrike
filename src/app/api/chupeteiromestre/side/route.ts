import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { submitSide } from "@/lib/pug";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: { vetoId?: string; side?: "ct" | "t" };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (!body.vetoId || !body.side) return NextResponse.json({ error: "vetoId e side são obrigatórios." }, { status: 400 });

  const result = await submitSide(profile.id, body.vetoId, body.side);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, done: result.done });
}
