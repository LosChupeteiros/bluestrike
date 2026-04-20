import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { submitVetoAction } from "@/lib/match-flow";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: matchId } = await context.params;

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: { mapName: string; pickedSide?: "ct" | "t" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.mapName) {
    return NextResponse.json({ error: "mapName é obrigatório." }, { status: 400 });
  }

  // Find which team this user belongs to in this match
  const supabase = createSupabaseAdminClient();
  const { data: match } = await supabase
    .from("matches")
    .select("team1_id, team2_id")
    .eq("id", matchId)
    .maybeSingle<{ team1_id: string | null; team2_id: string | null }>();

  if (!match) return NextResponse.json({ error: "Partida não encontrada." }, { status: 404 });

  const teamIds = [match.team1_id, match.team2_id].filter(Boolean) as string[];
  const { data: memberOf } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", profile.id)
    .in("team_id", teamIds)
    .maybeSingle<{ team_id: string }>();

  // Also allow captain who may not be a team_member row
  const { data: captainOf } = await supabase
    .from("teams")
    .select("id")
    .eq("captain_id", profile.id)
    .in("id", teamIds)
    .maybeSingle<{ id: string }>();

  const teamId = captainOf?.id ?? memberOf?.team_id;
  if (!teamId) {
    return NextResponse.json({ error: "Você não faz parte dessa partida." }, { status: 403 });
  }

  const result = await submitVetoAction(matchId, teamId, body.mapName, body.pickedSide);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, done: result.done, pickedMaps: result.pickedMaps });
}
