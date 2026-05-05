import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CS2_MAP_POOL } from "@/lib/maps";

interface VetoRow {
  team_id: string;
  action: string;
  map_name: string;
  veto_order: number;
  picked_side: "ct" | "t" | null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, team1_id, team2_id, bo_type, matchzy_match_id")
    .eq("id", matchId)
    .maybeSingle<{
      id: string;
      team1_id: string | null;
      team2_id: string | null;
      bo_type: 1 | 3 | 5;
      matchzy_match_id: number | null;
    }>();

  if (!match || !match.team1_id || !match.team2_id) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  const { team1_id, team2_id, bo_type, matchzy_match_id } = match;

  // Teams
  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", [team1_id, team2_id])
    .returns<{ id: string; name: string }[]>();

  const team1Name = teamRows?.find((t) => t.id === team1_id)?.name ?? "Time 1";
  const team2Name = teamRows?.find((t) => t.id === team2_id)?.name ?? "Time 2";

  // Players
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id, profile_id")
    .in("team_id", [team1_id, team2_id])
    .returns<{ team_id: string; profile_id: string }[]>();

  const profileIds = (members ?? []).map((m) => m.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, steam_id, steam_persona_name")
    .in("id", profileIds)
    .returns<{ id: string; steam_id: string | null; steam_persona_name: string | null }[]>();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const team1Players: Record<string, string> = {};
  const team2Players: Record<string, string> = {};
  for (const m of members ?? []) {
    const p = profileMap.get(m.profile_id);
    if (!p?.steam_id) continue;
    const nick = p.steam_persona_name ?? p.steam_id;
    if (m.team_id === team1_id) team1Players[p.steam_id] = nick;
    else team2Players[p.steam_id] = nick;
  }

  // Veto → maplist + map_sides
  const { data: vetoRows } = await supabase
    .from("map_vetoes")
    .select("team_id, action, map_name, veto_order, picked_side")
    .eq("match_id", matchId)
    .order("veto_order", { ascending: true })
    .returns<VetoRow[]>();

  const vetoes = vetoRows ?? [];
  const picks = vetoes.filter((v) => v.action === "pick");
  const bannedNames = new Set(vetoes.filter((v) => v.action === "ban").map((v) => v.map_name));
  const pickedNames = picks.map((v) => v.map_name);

  const deciderEntry = CS2_MAP_POOL.find(
    (m) => !pickedNames.includes(m.name) && !bannedNames.has(m.name)
  );

  const maplist: string[] = [];
  const mapSides: string[] = [];

  if (bo_type === 1) {
    // BO1: all bans, one remaining map is the decider
    if (deciderEntry) {
      maplist.push(deciderEntry.mapId);
      mapSides.push("knife");
    }
  } else {
    // BO3 / BO5: ordered picks + decider
    for (const pick of picks) {
      const entry = CS2_MAP_POOL.find((m) => m.name === pick.map_name);
      maplist.push(entry?.mapId ?? pick.map_name);

      if (!pick.picked_side) {
        mapSides.push("knife");
      } else {
        const pickerIsTeam1 = pick.team_id === team1_id;
        const sideChooserIsTeam1 = !pickerIsTeam1;
        if (pick.picked_side === "ct") {
          mapSides.push(sideChooserIsTeam1 ? "team1_ct" : "team2_ct");
        } else {
          mapSides.push(sideChooserIsTeam1 ? "team2_ct" : "team1_ct");
        }
      }
    }
    if (deciderEntry) {
      maplist.push(deciderEntry.mapId);
      mapSides.push("knife");
    }
  }

  // Fallback: se o veto ainda não terminou (request prematura), jogar de_mirage
  if (maplist.length === 0) {
    maplist.push("de_mirage");
    mapSides.push("knife");
  }

  const config = {
    matchid: matchzy_match_id,
    team1: { name: team1Name, players: team1Players },
    team2: { name: team2Name, players: team2Players },
    num_maps: bo_type,
    maplist,
    map_sides: mapSides,
    clinch_series: true,
    players_per_team: Math.max(
      Object.keys(team1Players).length,
      Object.keys(team2Players).length,
    ),
    cvars: {
      hostname: `BlueStrike: ${team1Name} vs ${team2Name}`,
    },
  };

  return Response.json(config, {
    headers: { "Cache-Control": "no-store" },
  });
}
