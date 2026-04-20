import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { readyUpMatch } from "@/lib/match-flow";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id: matchId } = await context.params;

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data: match } = await supabase
    .from("matches")
    .select("team1_id, team2_id")
    .eq("id", matchId)
    .maybeSingle<{ team1_id: string | null; team2_id: string | null }>();

  if (!match) return NextResponse.json({ error: "Partida não encontrada." }, { status: 404 });

  const teamIds = [match.team1_id, match.team2_id].filter(Boolean) as string[];
  const { data: captainOf } = await supabase
    .from("teams")
    .select("id")
    .eq("captain_id", profile.id)
    .in("id", teamIds)
    .maybeSingle<{ id: string }>();

  if (!captainOf) {
    return NextResponse.json({ error: "Apenas o capitão pode dar ready." }, { status: 403 });
  }

  const result = await readyUpMatch(matchId, captainOf.id);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, bothReady: result.bothReady });
}
