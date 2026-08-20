import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getMapPool, getMatchzyMapRef, isWingmanFormat } from "@/lib/maps";
import { normalizeTeamSize } from "@/lib/utils";

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
    .select("id, tournament_id, team1_id, team2_id, bo_type, matchzy_match_id")
    .eq("id", matchId)
    .maybeSingle<{
      id: string;
      tournament_id: string | null;
      team1_id: string | null;
      team2_id: string | null;
      bo_type: 1 | 3 | 5;
      matchzy_match_id: number | null;
    }>();

  if (!match || !match.team1_id || !match.team2_id) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  const { tournament_id, team1_id, team2_id, bo_type, matchzy_match_id } = match;

  // Formato do campeonato (1x1 ate 5x5). Sem campeonato vinculado, cai no 5x5.
  const { data: tournamentRow } = tournament_id
    ? await supabase
        .from("tournaments")
        .select("team_size")
        .eq("id", tournament_id)
        .maybeSingle<{ team_size: number | null }>()
    : { data: null };

  const teamSize = normalizeTeamSize(tournamentRow?.team_size);
  const wingman = isWingmanFormat(teamSize);
  const mapPool = getMapPool(teamSize);

  // Roster inscrito por time — so quem foi inscrito entra no config do servidor.
  const { data: registrationRows } = tournament_id
    ? await supabase
        .from("tournament_registrations")
        .select("team_id, roster_profile_ids")
        .eq("tournament_id", tournament_id)
        .in("team_id", [team1_id, team2_id])
        .returns<{ team_id: string; roster_profile_ids: string[] | null }[]>()
    : { data: null };

  const rosterByTeam = new Map<string, Set<string>>();
  for (const row of registrationRows ?? []) {
    if (row.roster_profile_ids?.length) {
      rosterByTeam.set(row.team_id, new Set(row.roster_profile_ids));
    }
  }

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

    const roster = rosterByTeam.get(m.team_id);
    if (roster && !roster.has(m.profile_id)) continue;

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

  const deciderEntry = mapPool.find(
    (m) => !pickedNames.includes(m.name) && !bannedNames.has(m.name)
  );

  const maplist: string[] = [];
  const mapSides: string[] = [];

  if (bo_type === 1) {
    // BO1: all bans, one remaining map is the decider
    if (deciderEntry) {
      maplist.push(getMatchzyMapRef(deciderEntry));
      mapSides.push("knife");
    }
  } else {
    // BO3 / BO5: ordered picks + decider
    for (const pick of picks) {
      const entry = mapPool.find((m) => m.name === pick.map_name);
      maplist.push(entry ? getMatchzyMapRef(entry) : pick.map_name);

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
      maplist.push(getMatchzyMapRef(deciderEntry));
      mapSides.push("knife");
    }
  }

  // Fallback: se o veto ainda nao terminou (request prematura), usa o primeiro
  // mapa do pool do formato — nao adianta cair em de_mirage num campeonato wingman.
  if (maplist.length === 0) {
    maplist.push(getMatchzyMapRef(mapPool[0]));
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
    // O MatchZy usa isso para saber quando o time esta completo — num 1x1 ele
    // nao pode esperar 5 jogadores.
    players_per_team: teamSize,
    // Liga game_mode 2 no servidor e faz o plugin rodar live_wingman.cfg.
    ...(wingman ? { wingman: true } : {}),
    cvars: {
      hostname: `BlueStrike${wingman ? " Wingman" : ""}: ${team1Name} vs ${team2Name}`,
      // Sem isso o !ready continuaria esperando o minimo de um 5x5.
      matchzy_minimum_ready_required: String(teamSize * 2),
    },
  };

  return Response.json(config, {
    headers: { "Cache-Control": "no-store" },
  });
}
