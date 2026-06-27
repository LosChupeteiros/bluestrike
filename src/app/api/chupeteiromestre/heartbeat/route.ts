import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { heartbeat } from "@/lib/pug";

export const dynamic = "force-dynamic";

export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await heartbeat(profile.id);
  return NextResponse.json({ ok: true });
}
