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
  events: Record<string, string>;
}

export async function getMatchWebhookInfo(matchId: string): Promise<MatchWebhookInfo | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("matches")
    .select("id, webhook_secret")
    .eq("id", matchId)
    .maybeSingle<Pick<MatchRow, "id" | "webhook_secret">>();

  if (error || !data) return null;

  const secret = data.webhook_secret ?? randomUUID();

  // Ensure secret is persisted if it was just generated
  if (!data.webhook_secret) {
    await createSupabaseAdminClient()
      .from("matches")
      .update({ webhook_secret: secret })
      .eq("id", matchId);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bluestrike.gg";
  const webhookUrl = `${base}/api/webhooks/cs2/${matchId}`;
  const authHeader = `Bearer ${secret}`;

  const EVENTS = [
    "booting_server",
    "loading_map",
    "server_ready_for_players",
    "all_players_connected",
    "match_started",
    "match_canceled",
    "match_ended",
  ] as const;

  return {
    matchId,
    webhookUrl,
    authorizationHeader: authHeader,
    events: Object.fromEntries(EVENTS.map((e) => [e, `${webhookUrl}?event=${e}`])),
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
