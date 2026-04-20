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

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bluestrike.gg";

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

  if (loserId) {
    await supabase
      .from("tournament_registrations")
      .update({ status: "eliminated" })
      .eq("tournament_id", match.tournament_id)
      .eq("team_id", loserId)
      .neq("status", "withdrawn");
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
    await supabase
      .from("matches")
      .update(isEvenSlot ? { team1_id: winnerId } : { team2_id: winnerId })
      .eq("id", nextMatch.id);
  } else {
    // This was the final
    await supabase
      .from("tournaments")
      .update({ status: "finished" })
      .eq("id", match.tournament_id);

    await supabase
      .from("tournament_registrations")
      .update({ status: "champion" })
      .eq("tournament_id", match.tournament_id)
      .eq("team_id", winnerId);

    await supabase
      .from("tournament_registrations")
      .update({ status: "eliminated" })
      .eq("tournament_id", match.tournament_id)
      .neq("team_id", winnerId)
      .neq("status", "withdrawn")
      .neq("status", "champion");
  }
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

export interface FullMatchDetail {
  match: Match & { readyTeam1: boolean; readyTeam2: boolean };
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
  team1Members: Array<{ profileId: string; steamId: string; nickname: string; avatarUrl: string | null; role: string | null; isStarter: boolean }>;
  team2Members: Array<{ profileId: string; steamId: string; nickname: string; avatarUrl: string | null; role: string | null; isStarter: boolean }>;
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
      .select("id, steam_id, steam_persona_name, steam_avatar_url")
      .in("id", memberRows.map((m) => m.profile_id))
      .returns<{ id: string; steam_id: string; steam_persona_name: string; steam_avatar_url: string | null }[]>();

    const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));

    return memberRows
      .filter((m) => profileMap.has(m.profile_id))
      .map((m) => {
        const p = profileMap.get(m.profile_id)!;
        return {
          profileId: m.profile_id,
          steamId: p.steam_id,
          nickname: p.steam_persona_name,
          avatarUrl: p.steam_avatar_url,
          role: m.in_game_role,
          isStarter: m.is_starter,
        };
      });
  }

  const [team1Members, team2Members] = await Promise.all([
    fetchMembers(matchData.team1_id),
    fetchMembers(matchData.team2_id),
  ]);

  return { match, vetoes, server, team1Members, team2Members };
}
