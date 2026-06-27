import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { readyUp } from "@/lib/pug";

export const dynamic = "force-dynamic";

export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const result = await readyUp(profile.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, bothReady: result.bothReady });
}
