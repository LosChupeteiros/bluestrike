import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { findDeciderMap, getFixedMapSides, getMapPoolForMode } from "@/lib/maps";
import { getTeamMode, normalizeTeamMode } from "@/lib/team-modes";

interface VetoRow {
  team_id: string;
  action: string;
  map_name: string;
  veto_order: number;
  picked_side: "ct" | "t" | null;
}

interface MemberRow {
  team_id: string;
  profile_id: string;
  is_starter: boolean;
  joined_at: string;
}

interface ProfileRow {
  id: string;
  steam_id: string | null;
  steam_persona_name: string | null;
}

/**
 * Monta o elenco de um time respeitando o tamanho da modalidade.
 * Prioriza o snapshot gravado na inscrição, depois capitão, titulares e por fim
 * a ordem de entrada no time.
 */
function buildRoster(
  members: MemberRow[],
  profileMap: Map<string, ProfileRow>,
  captainId: string | null,
  rosterSnapshot: string[],
  playersPerTeam: number
): Record<string, string> {
  const snapshot = new Set(rosterSnapshot);

  const ranked = [...members].sort((a, b) => {
    const inSnapshot = Number(snapshot.has(b.profile_id)) - Number(snapshot.has(a.profile_id));
    if (inSnapshot !== 0) return inSnapshot;

    const isCaptain = Number(b.profile_id === captainId) - Number(a.profile_id === captainId);
    if (isCaptain !== 0) return isCaptain;

    const starter = Number(b.is_starter) - Number(a.is_starter);
    if (starter !== 0) return starter;

    return Date.parse(a.joined_at) - Date.parse(b.joined_at);
  });

  const players: Record<string, string> = {};
  for (const member of ranked) {
    if (Object.keys(players).length >= playersPerTeam) break;
    const profile = profileMap.get(member.profile_id);
    if (!profile?.steam_id) continue;
    players[profile.steam_id] = profile.steam_persona_name ?? profile.steam_id;
  }
  return players;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, tournament_id, team1_id, team2_id, bo_type, team_mode, matchzy_match_id")
    .eq("id", matchId)
    .maybeSingle<{
      id: string;
      tournament_id: string | null;
      team1_id: string | null;
      team2_id: string | null;
      bo_type: 1 | 3 | 5;
      team_mode: string | null;
      matchzy_match_id: number | null;
    }>();

  if (!match || !match.team1_id || !match.team2_id) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  const { team1_id, team2_id, bo_type, matchzy_match_id } = match;
  const teamMode = normalizeTeamMode(match.team_mode);
  const modeConfig = getTeamMode(teamMode);
  const pool = getMapPoolForMode(teamMode);

  // Teams
  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, name, captain_id")
    .in("id", [team1_id, team2_id])
    .returns<{ id: string; name: string; captain_id: string | null }[]>();

  const team1Row = teamRows?.find((t) => t.id === team1_id);
  const team2Row = teamRows?.find((t) => t.id === team2_id);
  const team1Name = team1Row?.name ?? "Time 1";
  const team2Name = team2Row?.name ?? "Time 2";

  // Players
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id, profile_id, is_starter, joined_at")
    .in("team_id", [team1_id, team2_id])
    .returns<MemberRow[]>();

  const profileIds = (members ?? []).map((m) => m.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, steam_id, steam_persona_name")
    .in("id", profileIds)
    .returns<ProfileRow[]>();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Snapshot do elenco inscrito no campeonato (quando existir)
  const { data: registrationRows } = match.tournament_id
    ? await supabase
        .from("tournament_registrations")
        .select("team_id, roster_profile_ids")
        .eq("tournament_id", match.tournament_id)
        .in("team_id", [team1_id, team2_id])
        .returns<{ team_id: string; roster_profile_ids: string[] | null }[]>()
    : { data: [] as { team_id: string; roster_profile_ids: string[] | null }[] };

  const rosterByTeam = new Map(
    (registrationRows ?? []).map((r) => [r.team_id, r.roster_profile_ids ?? []])
  );

  const team1Players = buildRoster(
    (members ?? []).filter((m) => m.team_id === team1_id),
    profileMap,
    team1Row?.captain_id ?? null,
    rosterByTeam.get(team1_id) ?? [],
    modeConfig.playersPerTeam
  );
  const team2Players = buildRoster(
    (members ?? []).filter((m) => m.team_id === team2_id),
    profileMap,
    team2Row?.captain_id ?? null,
    rosterByTeam.get(team2_id) ?? [],
    modeConfig.playersPerTeam
  );

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

  const deciderEntry = findDeciderMap(pool, pickedNames, bannedNames);

  const maplist: string[] = [];
  const mapSides: string[] = [];

  if (bo_type === 1) {
    // BO1: só bans, o mapa que sobra é o jogado
    if (deciderEntry) {
      maplist.push(deciderEntry.mapId);
      mapSides.push("knife");
    }
  } else {
    // BO3 / BO5: picks em ordem + decider
    for (const pick of picks) {
      const entry = pool.find((m) => m.name === pick.map_name);
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

  // Fallback: se o veto ainda não terminou (request prematura), joga o primeiro
  // mapa da pool da modalidade.
  if (maplist.length === 0) {
    maplist.push(pool[0].mapId);
    mapSides.push("knife");
  }

  // 1x1 nunca usa faca: os lados são fixos e alternam a cada mapa da série.
  const resolvedSides = modeConfig.fixedSides ? getFixedMapSides(maplist.length) : mapSides;

  const team1Label = modeConfig.playersPerTeam === 1
    ? Object.values(team1Players)[0] ?? team1Name
    : team1Name;
  const team2Label = modeConfig.playersPerTeam === 1
    ? Object.values(team2Players)[0] ?? team2Name
    : team2Name;

  const hostnamePrefix = modeConfig.wingman
    ? "BlueStrike Wingman"
    : modeConfig.playersPerTeam === 1
      ? "BlueStrike 1x1"
      : "BlueStrike";

  const cvars: Record<string, string> = {
    hostname: `${hostnamePrefix}: ${team1Label} vs ${team2Label}`,
  };

  if (modeConfig.wingman) {
    cvars.matchzy_minimum_ready_required = String(modeConfig.playersPerTeam * 2);
  }
  if (modeConfig.freeArmor) {
    cvars.mp_free_armor = "1";
  }

  const config = {
    matchid: matchzy_match_id,
    team1: { name: team1Name, players: team1Players },
    team2: { name: team2Name, players: team2Players },
    num_maps: bo_type,
    maplist,
    map_sides: resolvedSides,
    ...(modeConfig.wingman ? { wingman: true } : { wingman: false }),
    players_per_team: modeConfig.playersPerTeam,
    ...(modeConfig.playersPerTeam === 1
      ? { min_players_to_ready: 2 }
      : {}),
    clinch_series: true,
    cvars,
  };

  return Response.json(config, {
    headers: { "Cache-Control": "no-store" },
  });
}
