import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { processSeriesEnd } from "@/lib/matchzy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Admin-only: reprocessa stats do MatchZy para uma partida que ficou como
// "processing_failed" (stats não estavam disponíveis no moment do series_end).
export async function POST(request: NextRequest, context: RouteContext) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await processSeriesEnd(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reprocessamento falhou.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
