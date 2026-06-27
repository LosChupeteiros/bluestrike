import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { startDraft } from "@/lib/pug";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!profile.isAdmin) return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  let boType: 1 | 3 = 3;
  try {
    const body = await request.json();
    if (body.boType === 1) boType = 1;
  } catch { /* body optional */ }

  const result = await startDraft(boType);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
