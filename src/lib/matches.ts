import type { Match, Team } from "@/types";
import type { UserProfile } from "@/lib/profile";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

interface MatchRow {
  id: string;
  tournament_id: string | null;
  team1_id: string | null;
  team2_id: string | null;
  round: number;
  match_index: number;
  bo_type: 1 | 3 | 5;
  status: Match["status"];
  winner_id: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  webhook_secret: string | null;
  dathost_match_id: string | null;
  ready_team1: boolean;
  ready_team2: boolean;
  teams_assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamRow {
  id: string;
  slug: string;
  name: string;
  tag: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  join_code: string;
  captain_id: string;
  is_recruiting: boolean;
  elo: number;
  wins: number;
  losses: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapTeamRow(row: TeamRow): Team {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tag: row.tag,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    joinCode: row.join_code,
    captainId: row.captain_id,
    isRecruiting: row.is_recruiting,
    elo: row.elo,
    wins: row.wins,
    losses: row.losses,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMatchRow(row: MatchRow, teams?: Map<string, Team>): Match {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    team1Id: row.team1_id,
    team2Id: row.team2_id,
    round: row.round,
    matchIndex: row.match_index,
    boType: row.bo_type,
    status: row.status,
    winnerId: row.winner_id,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    team1: row.team1_id && teams ? teams.get(row.team1_id) : undefined,
    team2: row.team2_id && teams ? teams.get(row.team2_id) : undefined,
  };
}

async function fetchTeamsForMatches(rows: MatchRow[]): Promise<Map<string, Team>> {
  const ids = [...new Set(rows.flatMap((r) => [r.team1_id, r.team2_id]).filter(Boolean) as string[])];
  if (ids.length === 0) return new Map();

  const { data } = await createSupabaseAdminClient()
    .from("teams")
    .select("*")
    .in("id", ids)
    .returns<TeamRow[]>();

  return new Map((data ?? []).map((t) => [t.id, mapTeamRow(t)]));
}

export async function getTournamentMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await createSupabaseAdminClient()
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("match_index", { ascending: true })
    .returns<MatchRow[]>();

  if (error) throw new Error(`Falha ao buscar partidas: ${error.message}`);

  const rows = data ?? [];
  const teams = await fetchTeamsForMatches(rows);
  return rows.map((r) => mapMatchRow(r, teams));
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<MatchRow>();

  if (error) throw new Error(`Falha ao buscar partida: ${error.message}`);
  if (!data) return null;

  const teams = await fetchTeamsForMatches([data]);
  return mapMatchRow(data, teams);
}

export interface MatchWebhookInfo {
  matchId: string;
  webhookUrl: string;
  authorizationHeader: string;
  // Events to enable in Dathost's webhooks.enabled_events field
  enabledEvents: string[];
}

export async function getMatchWebhookInfo(matchId: string): Promise<MatchWebhookInfo | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("matches")
    .select("id, webhook_secret")
    .eq("id", matchId)
    .maybeSingle<Pick<MatchRow, "id" | "webhook_secret">>();

  if (error || !data) return null;

  const secret = data.webhook_secret ?? randomUUID();

  if (!data.webhook_secret) {
    await createSupabaseAdminClient()
      .from("matches")
      .update({ webhook_secret: secret })
      .eq("id", matchId);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bluestrike.com.br";

  return {
    matchId,
    webhookUrl: `${base}/api/webhooks/cs2/${matchId}`,
    authorizationHeader: `Bearer ${secret}`,
    enabledEvents: [
      "match_started",
      "match_ended",
      "match_canceled",
      "round_end",
    ],
  };
}

async function advanceWinner(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  match: MatchRow,
  winnerId: string
): Promise<void> {
  const loserId = winnerId === match.team1_id ? match.team2_id : match.team1_id;
  if (!match.tournament_id) return;

  const { data: finalRoundRows } = await supabase
    .from("matches")
    .select("id, round, match_index, team1_id, team2_id, winner_id, status")
    .eq("tournament_id", match.tournament_id)
    .order("round", { ascending: false })
    .order("match_index", { ascending: true })
    .limit(4)
    .returns<Array<Pick<MatchRow, "id" | "round" | "match_index" | "team1_id" | "team2_id" | "winner_id" | "status">>>();

  const finalRound = finalRoundRows?.[0]?.round ?? match.round;
  const isFinalMatch = match.round === finalRound && match.match_index === 0;
  const isThirdPlaceMatch = match.round === finalRound && match.match_index === 1;
  const thirdPlaceMatch = finalRoundRows?.find((m) => m.round === finalRound && m.match_index === 1) ?? null;
  const shouldSendLoserToThird = Boolean(
    loserId &&
    thirdPlaceMatch &&
    match.round === finalRound - 1 &&
    (match.match_index === 0 || match.match_index === 1)
  );

  if (loserId && !shouldSendLoserToThird) {
    await supabase
      .from("tournament_registrations")
      .update({ status: "eliminated" })
      .eq("tournament_id", match.tournament_id)
      .eq("team_id", loserId)
      .neq("status", "withdrawn");
  }

  if (loserId && shouldSendLoserToThird && thirdPlaceMatch) {
    const isEvenSlot = match.match_index % 2 === 0;
    const otherTeamAlreadySet = isEvenSlot ? Boolean(thirdPlaceMatch.team2_id) : Boolean(thirdPlaceMatch.team1_id);
    const update = isEvenSlot
      ? { team1_id: loserId, ...(otherTeamAlreadySet ? { teams_assigned_at: new Date().toISOString() } : {}) }
      : { team2_id: loserId, ...(otherTeamAlreadySet ? { teams_assigned_at: new Date().toISOString() } : {}) };

    await supabase
      .from("matches")
      .update(update)
      .eq("id", thirdPlaceMatch.id);
  }

  const { data: nextMatch } = await supabase
    .from("matches")
    .select("id, team1_id, team2_id")
    .eq("tournament_id", match.tournament_id)
    .eq("round", match.round + 1)
    .eq("match_index", Math.floor(match.match_index / 2))
    .maybeSingle<Pick<MatchRow, "id" | "team1_id" | "team2_id">>();

  if (nextMatch) {
    const isEvenSlot = match.match_index % 2 === 0;
    const otherTeamAlreadySet = isEvenSlot ? Boolean(nextMatch.team2_id) : Boolean(nextMatch.team1_id);
    const update = isEvenSlot
      ? { team1_id: winnerId, ...(otherTeamAlreadySet ? { teams_assigned_at: new Date().toISOString() } : {}) }
      : { team2_id: winnerId, ...(otherTeamAlreadySet ? { teams_assigned_at: new Date().toISOString() } : {}) };

    await supabase
      .from("matches")
      .update(update)
      .eq("id", nextMatch.id);
    return;
  }

  // No next match found — verify this is actually the final round before closing the tournament
  const { count: higherRoundCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", match.tournament_id)
    .gt("round", match.round);

  if ((higherRoundCount ?? 0) === 0) {
    if (isThirdPlaceMatch) {
      if (loserId) {
        await supabase
          .from("tournament_registrations")
          .update({ status: "eliminated" })
          .eq("tournament_id", match.tournament_id)
          .eq("team_id", loserId)
          .neq("status", "withdrawn");
      }

      const finalDone = finalRoundRows?.some((m) =>
        m.round === finalRound && m.match_index === 0 && m.status === "finished" && m.winner_id
      );
      if (!finalDone) return;
    } else if (!isFinalMatch) {
      return;
    } else if (thirdPlaceMatch && !(thirdPlaceMatch.status === "finished" && thirdPlaceMatch.winner_id)) {
      return;
    }
  }

  if ((higherRoundCount ?? 0) > 0) {
    console.error(
      `[advanceWinner] Missing bracket row: expected round=${match.round + 1} match_index=${Math.floor(match.match_index / 2)} for tournament ${match.tournament_id}. Winner ${winnerId} was not advanced.`
    );
    return;
  }

  // This is the final — close the tournament
  const finalWinnerId = finalRoundRows?.find((m) => m.round === finalRound && m.match_index === 0)?.winner_id ?? null;
  const championId = isThirdPlaceMatch ? finalWinnerId : winnerId;
  if (!championId) return;

  await supabase
    .from("tournament_registrations")
    .update({ status: "champion" })
    .eq("tournament_id", match.tournament_id)
    .eq("team_id", championId);

  await supabase
    .from("tournament_registrations")
    .update({ status: "eliminated" })
    .eq("tournament_id", match.tournament_id)
    .neq("team_id", championId)
    .neq("status", "withdrawn")
    .neq("status", "champion");

  await supabase
    .from("tournaments")
    .update({ status: "finished" })
    .eq("id", match.tournament_id);
}

export async function submitMatchResult(
  adminProfile: UserProfile,
  matchId: string,
  winnerId: string
): Promise<void> {
  if (!adminProfile.isAdmin) {
    throw new Error("Apenas administradores podem registrar resultados.");
  }

  const supabase = createSupabaseAdminClient();

  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<MatchRow>();

  if (fetchError) throw new Error(`Falha ao buscar partida: ${fetchError.message}`);
  if (!match) throw new Error("Partida não encontrada.");
  if (match.status === "finished") throw new Error("Essa partida já foi finalizada.");

  if (winnerId !== match.team1_id && winnerId !== match.team2_id) {
    throw new Error("O vencedor informado não é um dos times da partida.");
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({ status: "finished", winner_id: winnerId, finished_at: new Date().toISOString() })
    .eq("id", matchId);

  if (updateError) throw new Error(`Falha ao salvar resultado: ${updateError.message}`);

  await advanceWinner(supabase, match, winnerId);
}

// Public wrapper used by match-flow.ts to advance bracket after a walkover
export async function advanceWinnerPublic(matchId: string, winnerId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<MatchRow>();
  if (match) await advanceWinner(supabase, match, winnerId);
}

// Called by the CS2 server webhook — no admin check, auth is done via webhook_secret
export async function processWebhookResult(
  match: MatchRow,
  team1Score: number,
  team2Score: number
): Promise<void> {
  if (team1Score === team2Score) return; // Tie — don't auto-determine

  const supabase = createSupabaseAdminClient();
  const winnerId = team1Score > team2Score ? match.team1_id : match.team2_id;
  if (!winnerId) return;

  await supabase
    .from("matches")
    .update({ status: "finished", winner_id: winnerId, finished_at: new Date().toISOString() })
    .eq("id", match.id);

  await advanceWinner(supabase, match, winnerId);
}

export async function getMatchRowByIdForWebhook(matchId: string): Promise<MatchRow | null> {
  const { data } = await createSupabaseAdminClient()
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<MatchRow>();

  return data ?? null;
}

// ── Full match detail (page) ───────────────────────────────────────────────────

interface MapVetoRow {
  id: string;
  match_id: string;
  team_id: string;
  action: "ban" | "pick";
  map_name: string;
  veto_order: number;
  picked_side: "ct" | "t" | null;
  created_at: string;
}

interface DathostServerRow {
  id: string;
  match_id: string;
  dathost_id: string;
  ip: string;
  port: number;
  gotv_port: number | null;
  connect_string: string | null;
  raw_ip: string | null;
  server_password: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerStat {
  profileId: string | null;
  profilePublicId: number | null;
  teamId: string | null;
  teamName: string | null;
  mapNumber: number;
  mapName: string | null;
  steamid64: string;
  nickname: string;
  avatarUrl: string | null;
  kills: number;
  deaths: number;
  assists: number;
  hsCount: number;
  adr: number;
  mvps: number;
  score: number;
  k2: number;
  k3: number;
  k4: number;
  k5: number;
  damageDealt: number;
}

export interface FullMatchDetail {
  match: Match & { readyTeam1: boolean; readyTeam2: boolean; teamsAssignedAt: string | null };
  vetoes: import("@/types").MapVeto[];
  server: {
    dathostId: string;
    ip: string;
    port: number;
    rawIp: string | null;
    password: string | null;
    connectString: string | null;
    gotvPort: number | null;
    status: string;
  } | null;
  team1Members: Array<{ profileId: string; publicId: number; steamId: string; nickname: string; avatarUrl: string | null; role: string | null; isStarter: boolean }>;
  team2Members: Array<{ profileId: string; publicId: number; steamId: string; nickname: string; avatarUrl: string | null; role: string | null; isStarter: boolean }>;
  matchMaps: Array<{ mapOrder: number; mapName: string | null; team1Score: number | null; team2Score: number | null; winnerId: string | null; status: string }>;
  playerStats: PlayerStat[];
}

function normalizeSteamId(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeName(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function mapVetoRow(row: MapVetoRow): import("@/types").MapVeto {
  return {
    id: row.id,
    matchId: row.match_id,
    teamId: row.team_id,
    action: row.action,
    mapName: row.map_name,
    vetoOrder: row.veto_order,
    pickedSide: row.picked_side,
    createdAt: row.created_at,
  };
}

export async function getFullMatchDetail(matchId: string, includeServerPassword: boolean): Promise<FullMatchDetail | null> {
  const supabase = createSupabaseAdminClient();

  const { data: matchData, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<MatchRow & { ready_team1: boolean; ready_team2: boolean }>();

  if (error || !matchData) return null;

  const teams = await fetchTeamsForMatches([matchData]);
  const match = {
    ...mapMatchRow(matchData, teams),
    readyTeam1: matchData.ready_team1 ?? false,
    readyTeam2: matchData.ready_team2 ?? false,
    teamsAssignedAt: matchData.teams_assigned_at ?? null,
  };

  // Fetch vetoes
  const { data: vetoRows } = await supabase
    .from("map_vetoes")
    .select("*")
    .eq("match_id", matchId)
    .order("veto_order", { ascending: true })
    .returns<MapVetoRow[]>();

  const vetoes = (vetoRows ?? []).map(mapVetoRow);

  // Fetch server
  const { data: serverRow } = await supabase
    .from("dathost_servers")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle<DathostServerRow>();

  const server = serverRow
    ? {
        dathostId: serverRow.dathost_id,
        ip: serverRow.ip,
        port: serverRow.port,
        rawIp: serverRow.raw_ip,
        password: includeServerPassword ? serverRow.server_password : null,
        connectString: includeServerPassword ? serverRow.connect_string : null,
        gotvPort: serverRow.gotv_port,
        status: serverRow.status,
      }
    : null;

  // Fetch team members
  async function fetchMembers(teamId: string | null) {
    if (!teamId) return [];
    const { data: memberRows } = await supabase
      .from("team_members")
      .select("profile_id, in_game_role, is_starter")
      .eq("team_id", teamId)
      .returns<{ profile_id: string; in_game_role: string | null; is_starter: boolean }[]>();

    if (!memberRows || memberRows.length === 0) return [];

    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, public_id, steam_id, steam_persona_name, steam_avatar_url")
      .in("id", memberRows.map((m) => m.profile_id))
      .returns<{ id: string; public_id: number; steam_id: string; steam_persona_name: string; steam_avatar_url: string | null }[]>();

    const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));

    return memberRows
      .filter((m) => profileMap.has(m.profile_id))
      .map((m) => {
        const p = profileMap.get(m.profile_id)!;
        return {
          profileId: m.profile_id,
          publicId: p.public_id,
          steamId: p.steam_id,
          nickname: p.steam_persona_name,
          avatarUrl: p.steam_avatar_url,
          role: m.in_game_role,
          isStarter: m.is_starter,
        };
      });
  }

  const [team1Members, team2Members, mapsResult] = await Promise.all([
    fetchMembers(matchData.team1_id),
    fetchMembers(matchData.team2_id),
    supabase
      .from("match_maps")
      .select("id, map_order, map_name, team1_score, team2_score, winner_id, status")
      .eq("match_id", matchId)
      .order("map_order", { ascending: true })
      .returns<{ id: string; map_order: number; map_name: string | null; team1_score: number | null; team2_score: number | null; winner_id: string | null; status: string }[]>(),
  ]);

  const mapRows = mapsResult.data ?? [];
  const matchMaps = mapRows.map((r) => ({
    mapOrder: r.map_order,
    mapName: r.map_name,
    team1Score: r.team1_score,
    team2Score: r.team2_score,
    winnerId: r.winner_id,
    status: r.status,
  }));

  // Fetch player stats — prefer matchzy_player_stats (raw MySQL dump, no FK deps)
  let playerStats: PlayerStat[] = [];

  const { data: rawStatRows } = await supabase
    .from("matchzy_player_stats")
    .select("mapnumber, mapname, steamid64, player_name, team_name, kills, deaths, assists, damage, head_shot_kills, map_team1_score, map_team2_score")
    .eq("match_id", matchId)
    .returns<{
      mapnumber: number;
      mapname: string | null;
      steamid64: string;
      player_name: string | null;
      team_name: string | null;
      kills: number;
      deaths: number;
      assists: number;
      damage: number;
      head_shot_kills: number;
      map_team1_score: number | null;
      map_team2_score: number | null;
    }[]>();

  if (rawStatRows && rawStatRows.length > 0) {
    // Enrich with Supabase profile data (avatar, username) by steam_id — best-effort
    const steamIds = [...new Set(rawStatRows.map((s) => normalizeSteamId(s.steamid64)).filter(Boolean))];
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, public_id, steam_id, steam_persona_name, steam_avatar_url")
      .in("steam_id", steamIds)
      .returns<{ id: string; public_id: number; steam_id: string; steam_persona_name: string; steam_avatar_url: string | null }[]>();

    const profileBySteamId = new Map((profileRows ?? []).map((p) => [normalizeSteamId(p.steam_id), p]));

    playerStats = rawStatRows.map((s) => {
      const steamid64 = normalizeSteamId(s.steamid64);
      const profile = profileBySteamId.get(steamid64);
      const rounds = (s.map_team1_score ?? 0) + (s.map_team2_score ?? 0);
      const adr = rounds > 0 ? Math.round((s.damage / rounds) * 100) / 100 : 0;
      return {
        profileId: profile?.id ?? null,
        profilePublicId: profile?.public_id ?? null,
        teamId: null,
        teamName: s.team_name,
        mapNumber: s.mapnumber,
        mapName: s.mapname,
        steamid64,
        nickname: profile?.steam_persona_name ?? s.player_name ?? s.steamid64,
        avatarUrl: profile?.steam_avatar_url ?? null,
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        hsCount: s.head_shot_kills,
        adr,
        mvps: 0,
        score: s.kills + s.assists,
        k2: 0, k3: 0, k4: 0, k5: 0,
        damageDealt: s.damage,
      };
    });
  } else {
    // Fallback: old match_player_stats path (for matches before this deploy)
    const mapIds = mapRows.map((r) => r.id);
    if (mapIds.length > 0) {
      const { data: statRows } = await supabase
        .from("match_player_stats")
        .select("profile_id, team_id, kills, deaths, assists, hs_count, adr, mvps, score, k2, k3, k4, k5, damage_dealt")
        .in("match_map_id", mapIds)
        .returns<{
          profile_id: string;
          team_id: string | null;
          kills: number;
          deaths: number;
          assists: number;
          hs_count: number;
          adr: number;
          mvps: number;
          score: number;
          k2: number;
          k3: number;
          k4: number;
          k5: number;
          damage_dealt: number;
        }[]>();

      if (statRows && statRows.length > 0) {
        const profileIds = [...new Set(statRows.map((s) => s.profile_id))];
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, public_id, steam_id, steam_persona_name, steam_avatar_url")
          .in("id", profileIds)
          .returns<{ id: string; public_id: number; steam_id: string; steam_persona_name: string; steam_avatar_url: string | null }[]>();

        const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));

        playerStats = statRows.map((s) => ({
          profileId: s.profile_id,
          profilePublicId: profileMap.get(s.profile_id)?.public_id ?? null,
          teamId: s.team_id ?? null,
          teamName: null,
          mapNumber: 0,
          mapName: null,
          steamid64: profileMap.get(s.profile_id)?.steam_id ?? "",
          nickname: profileMap.get(s.profile_id)?.steam_persona_name ?? s.profile_id,
          avatarUrl: profileMap.get(s.profile_id)?.steam_avatar_url ?? null,
          kills: s.kills,
          deaths: s.deaths,
          assists: s.assists,
          hsCount: s.hs_count,
          adr: s.adr,
          mvps: s.mvps,
          score: s.score,
          k2: s.k2,
          k3: s.k3,
          k4: s.k4,
          k5: s.k5,
          damageDealt: s.damage_dealt,
        }));
      }
    }
  }

  const memberProfiles = [
    ...team1Members.map((m) => ({ ...m, teamId: matchData.team1_id, teamName: match.team1?.name ?? null })),
    ...team2Members.map((m) => ({ ...m, teamId: matchData.team2_id, teamName: match.team2?.name ?? null })),
  ];
  const memberBySteamId = new Map(memberProfiles.map((m) => [normalizeSteamId(m.steamId), m]));

  playerStats = playerStats.map((stat) => {
    if (stat.profilePublicId && stat.avatarUrl) return stat;

    const statTeamName = normalizeName(stat.teamName);
    const bySteam = memberBySteamId.get(normalizeSteamId(stat.steamid64));
    const byNickAndTeam = memberProfiles.find((m) =>
      normalizeName(m.nickname) === normalizeName(stat.nickname) &&
      (!statTeamName || statTeamName === normalizeName(m.teamName))
    );
    const byNick = memberProfiles.find((m) => normalizeName(m.nickname) === normalizeName(stat.nickname));
    const member = bySteam ?? byNickAndTeam ?? byNick;
    if (!member) return stat;

    return {
      ...stat,
      profileId: stat.profileId ?? member.profileId,
      profilePublicId: stat.profilePublicId ?? member.publicId,
      teamId: stat.teamId ?? member.teamId,
      steamid64: normalizeSteamId(member.steamId) || stat.steamid64,
      nickname: stat.nickname || member.nickname,
      avatarUrl: stat.avatarUrl ?? member.avatarUrl,
    };
  });

  return { match, vetoes, server, team1Members, team2Members, matchMaps, playerStats };
}

// ── Recent matches for profile ─────────────────────────────────────────────────

export interface RecentMatchSummary {
  matchId: string;
  tournamentId: string | null;
  tournamentName: string;
  team1Tag: string;
  team2Tag: string;
  team1Score: number;
  team2Score: number;
  mapName: string | null;
  playedAt: string | null;
  status: string;
  isWinner: boolean;
}

export async function getRecentMatchesForProfile(profileId: string, limit = 10): Promise<RecentMatchSummary[]> {
  const supabase = createSupabaseAdminClient();

  // Get this profile's Steam identity to query matchzy_player_stats.
  // Older rows may have rounded steamid64 values from MySQL BIGINT parsing, so
  // player_name is a compatibility fallback for matches saved before the fix.
  const { data: profileData } = await supabase
    .from("profiles")
    .select("steam_id, steam_persona_name")
    .eq("id", profileId)
    .maybeSingle<{ steam_id: string | null; steam_persona_name: string | null }>();

  if (profileData?.steam_id) {
    type RawRecentStatRow = {
      match_id: string;
      team_name: string | null;
      map_team1_score: number | null;
      map_team2_score: number | null;
      mapname: string | null;
    };

    const statSelect = "match_id, team_name, map_team1_score, map_team2_score, mapname";
    const [steamResult, nameResult] = await Promise.all([
      supabase
        .from("matchzy_player_stats")
        .select(statSelect)
        .eq("steamid64", normalizeSteamId(profileData.steam_id))
        .returns<RawRecentStatRow[]>(),
      profileData.steam_persona_name
        ? supabase
            .from("matchzy_player_stats")
            .select(statSelect)
            .eq("player_name", profileData.steam_persona_name)
            .returns<RawRecentStatRow[]>()
        : Promise.resolve({ data: [] as RawRecentStatRow[], error: null }),
    ]);

    const rawRows = [...(steamResult.data ?? []), ...(nameResult.data ?? [])];

    if (rawRows && rawRows.length > 0) {
      // Deduplicate by match_id
      const matchIdToData = new Map<string, { teamName: string | null; team1Score: number; team2Score: number; mapname: string | null }>();
      for (const row of rawRows) {
        if (!matchIdToData.has(row.match_id)) {
          matchIdToData.set(row.match_id, {
            teamName: row.team_name,
            team1Score: row.map_team1_score ?? 0,
            team2Score: row.map_team2_score ?? 0,
            mapname: row.mapname,
          });
        }
      }

      const matchIds = [...matchIdToData.keys()];
      const { data: matchRows } = await supabase
        .from("matches")
        .select("id, tournament_id, team1_id, team2_id, winner_id, status, finished_at, started_at")
        .in("id", matchIds)
        .order("finished_at", { ascending: false })
        .limit(limit)
        .returns<{ id: string; tournament_id: string | null; team1_id: string | null; team2_id: string | null; winner_id: string | null; status: string; finished_at: string | null; started_at: string | null }[]>();

      if (matchRows && matchRows.length > 0) {
        const teamIds = [...new Set(matchRows.flatMap((m) => [m.team1_id, m.team2_id]).filter(Boolean) as string[])];
        const teamMap = new Map<string, { tag: string; name: string }>();
        if (teamIds.length > 0) {
          const { data: teamRows } = await supabase.from("teams").select("id, tag, name").in("id", teamIds).returns<{ id: string; tag: string; name: string }[]>();
          for (const t of teamRows ?? []) teamMap.set(t.id, { tag: t.tag, name: t.name });
        }

        const tournamentIds = [...new Set(matchRows.map((m) => m.tournament_id).filter(Boolean) as string[])];
        const tournamentMap = new Map<string, string>();
        if (tournamentIds.length > 0) {
          const { data: tournRows } = await supabase.from("tournaments").select("id, name").in("id", tournamentIds).returns<{ id: string; name: string }[]>();
          for (const t of tournRows ?? []) tournamentMap.set(t.id, t.name);
        }

        return matchRows.map((m) => {
          const data = matchIdToData.get(m.id);
          const myTeamName = data?.teamName ?? null;
          const winnerTeam = m.winner_id ? teamMap.get(m.winner_id) : null;
          const isWinner = Boolean(myTeamName && winnerTeam && myTeamName.toLowerCase() === winnerTeam.name.toLowerCase());
          return {
            matchId: m.id,
            tournamentId: m.tournament_id,
            tournamentName: m.tournament_id ? (tournamentMap.get(m.tournament_id) ?? "BlueStrike") : "BlueStrike",
            team1Tag: m.team1_id ? (teamMap.get(m.team1_id)?.tag ?? "???") : "???",
            team2Tag: m.team2_id ? (teamMap.get(m.team2_id)?.tag ?? "???") : "???",
            team1Score: data?.team1Score ?? 0,
            team2Score: data?.team2Score ?? 0,
            mapName: data?.mapname ?? null,
            playedAt: m.finished_at ?? m.started_at,
            status: m.status,
            isWinner,
          };
        });
      }
    }
  }

  // Fallback: old match_player_stats path
  const { data: statRows } = await supabase
    .from("match_player_stats")
    .select("match_map_id, team_id")
    .eq("profile_id", profileId)
    .returns<{ match_map_id: string; team_id: string | null }[]>();

  if (!statRows || statRows.length === 0) return [];

  const mapIdToTeamId = new Map(statRows.map((r) => [r.match_map_id, r.team_id]));
  const matchMapIds = [...mapIdToTeamId.keys()];

  const { data: mapRows } = await supabase
    .from("match_maps")
    .select("id, match_id, map_name, team1_score, team2_score")
    .in("id", matchMapIds)
    .returns<{ id: string; match_id: string; map_name: string | null; team1_score: number | null; team2_score: number | null }[]>();

  if (!mapRows || mapRows.length === 0) return [];

  const matchIdToMap = new Map<string, { map_name: string | null; team1_score: number | null; team2_score: number | null; teamId: string | null }>();
  for (const row of mapRows) {
    if (!matchIdToMap.has(row.match_id)) {
      matchIdToMap.set(row.match_id, {
        map_name: row.map_name,
        team1_score: row.team1_score,
        team2_score: row.team2_score,
        teamId: mapIdToTeamId.get(row.id) ?? null,
      });
    }
  }

  const matchIds = [...matchIdToMap.keys()];
  const { data: matchRows } = await supabase
    .from("matches")
    .select("id, tournament_id, team1_id, team2_id, winner_id, status, finished_at, started_at")
    .in("id", matchIds)
    .order("finished_at", { ascending: false })
    .limit(limit)
    .returns<{ id: string; tournament_id: string | null; team1_id: string | null; team2_id: string | null; winner_id: string | null; status: string; finished_at: string | null; started_at: string | null }[]>();

  if (!matchRows || matchRows.length === 0) return [];

  const tournamentIds = [...new Set(matchRows.map((m) => m.tournament_id).filter(Boolean) as string[])];
  const tournamentMap = new Map<string, string>();
  if (tournamentIds.length > 0) {
    const { data: tournRows } = await supabase.from("tournaments").select("id, name").in("id", tournamentIds).returns<{ id: string; name: string }[]>();
    for (const t of tournRows ?? []) tournamentMap.set(t.id, t.name);
  }

  const teamIds = [...new Set(matchRows.flatMap((m) => [m.team1_id, m.team2_id]).filter(Boolean) as string[])];
  const teamTagMap = new Map<string, string>();
  if (teamIds.length > 0) {
    const { data: teamRows } = await supabase.from("teams").select("id, tag").in("id", teamIds).returns<{ id: string; tag: string }[]>();
    for (const t of teamRows ?? []) teamTagMap.set(t.id, t.tag);
  }

  return matchRows.map((m) => {
    const mapData = matchIdToMap.get(m.id);
    const myTeamId = mapData?.teamId ?? null;
    return {
      matchId: m.id,
      tournamentId: m.tournament_id,
      tournamentName: m.tournament_id ? (tournamentMap.get(m.tournament_id) ?? "BlueStrike") : "BlueStrike",
      team1Tag: m.team1_id ? (teamTagMap.get(m.team1_id) ?? "???") : "???",
      team2Tag: m.team2_id ? (teamTagMap.get(m.team2_id) ?? "???") : "???",
      team1Score: mapData?.team1_score ?? 0,
      team2Score: mapData?.team2_score ?? 0,
      mapName: mapData?.map_name ?? null,
      playedAt: m.finished_at ?? m.started_at,
      status: m.status,
      isWinner: Boolean(myTeamId && m.winner_id === myTeamId),
    };
  });
}
