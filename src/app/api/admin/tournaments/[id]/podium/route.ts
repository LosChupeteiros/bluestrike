import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PodiumEntry {
  team: { id: string; name: string; tag: string; elo: number } | null;
  captain: { id: string; nickname: string; avatarUrl: string | null; steamId: string } | null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: tournamentId } = await context.params;
  const currentProfile = await getCurrentProfile();

  if (!currentProfile?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  // Get all finished matches for this tournament
  const { data: matches } = await supabase
    .from("matches")
    .select("id, round, team1_id, team2_id, winner_id, status")
    .eq("tournament_id", tournamentId)
    .eq("status", "finished")
    .returns<{ id: string; round: number; team1_id: string | null; team2_id: string | null; winner_id: string | null; status: string }[]>();

  if (!matches || matches.length === 0) {
    return NextResponse.json({ first: null, second: null, third: null });
  }

  const maxRound = Math.max(...matches.map((m) => m.round));
  const finalMatch = matches.find((m) => m.round === maxRound);

  const firstId = finalMatch?.winner_id ?? null;
  const secondId = firstId
    ? (finalMatch?.team1_id === firstId ? finalMatch?.team2_id : finalMatch?.team1_id) ?? null
    : null;

  // Collect unique team IDs for batch fetch
  const teamIds = [firstId, secondId].filter(Boolean) as string[];

  async function buildEntry(teamId: string | null): Promise<PodiumEntry> {
    if (!teamId) return { team: null, captain: null };

    const { data: team } = await supabase
      .from("teams")
      .select("id, name, tag, elo, captain_id")
      .eq("id", teamId)
      .maybeSingle<{ id: string; name: string; tag: string; elo: number; captain_id: string }>();

    if (!team) return { team: null, captain: null };

    const { data: captainProfile } = await supabase
      .from("profiles")
      .select("id, steam_persona_name, steam_avatar_url, steam_id")
      .eq("id", team.captain_id)
      .maybeSingle<{ id: string; steam_persona_name: string; steam_avatar_url: string | null; steam_id: string }>();

    return {
      team: { id: team.id, name: team.name, tag: team.tag, elo: team.elo },
      captain: captainProfile
        ? {
            id: captainProfile.id,
            nickname: captainProfile.steam_persona_name,
            avatarUrl: captainProfile.steam_avatar_url,
            steamId: captainProfile.steam_id,
          }
        : null,
    };
  }

  const [first, second] = await Promise.all([buildEntry(firstId), buildEntry(secondId)]);

  return NextResponse.json({ first, second, third: null });
}
