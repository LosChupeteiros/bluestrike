// MatchZy integration: MySQL stats client + series_end processing.
// All MySQL access is server-side only — never called from client components.

import mysql from "mysql2/promise";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { processWebhookResult, getMatchRowByIdForWebhook } from "@/lib/matches";
import { stopGameServer, deleteGameServer } from "@/lib/dathost";

// ── MySQL pool ────────────────────────────────────────────────────────────────

let _pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (_pool) return _pool;

  const ssl =
    process.env.WEAPONPAINTS_MYSQL_SSL === "true"
      ? { rejectUnauthorized: true }
      : undefined;

  _pool = mysql.createPool({
    host: process.env.WEAPONPAINTS_MYSQL_HOST,
    port: Number(process.env.WEAPONPAINTS_MYSQL_PORT ?? 3306),
    user: process.env.WEAPONPAINTS_MYSQL_USER,
    password: process.env.WEAPONPAINTS_MYSQL_PASSWORD,
    database: process.env.WEAPONPAINTS_MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 3000,
    ssl,
  });

  return _pool;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MatchzyStatsMatch {
  matchid: number;
  team1_name?: string;
  team2_name?: string;
  team1_score?: number;
  team2_score?: number;
  winner?: string;
  [key: string]: unknown;
}

export interface MatchzyStatsMap {
  matchid: number;
  mapnumber: number;
  mapname?: string;
  start_time?: string | null;
  end_time?: string | null;
  team1_score?: number;
  team2_score?: number;
  winner?: string;
  [key: string]: unknown;
}

export interface MatchzyStatsPlayer {
  matchid: number;
  mapnumber: number;
  steamid64: string;
  name?: string;
  team?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  damage?: number;
  head_shot_kills?: number;
  [key: string]: unknown;
}

export interface MatchzyStats {
  match: MatchzyStatsMatch;
  maps: MatchzyStatsMap[];
  players: MatchzyStatsPlayer[];
}

// ── MySQL queries ─────────────────────────────────────────────────────────────

export async function getMatchzyStats(matchzyMatchId: number): Promise<MatchzyStats | null> {
  const pool = getPool();

  const [[matchRows], [mapRows], [playerRows]] = await Promise.all([
    pool.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM matchzy_stats_matches WHERE matchid = ? LIMIT 1",
      [matchzyMatchId]
    ),
    pool.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM matchzy_stats_maps WHERE matchid = ? ORDER BY mapnumber ASC",
      [matchzyMatchId]
    ),
    pool.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM matchzy_stats_players WHERE matchid = ? ORDER BY mapnumber ASC, kills DESC",
      [matchzyMatchId]
    ),
  ]);

  // matchzy_stats_maps é a fonte primária — matchzy_stats_matches pode demorar a ser preenchida
  if (!mapRows.length && !matchRows.length) return null;

  return {
    match: (matchRows[0] as MatchzyStatsMatch) ?? { matchid: matchzyMatchId },
    maps: mapRows as MatchzyStatsMap[],
    players: playerRows as MatchzyStatsPlayer[],
  };
}

export async function getMatchzyStatsWithRetry(
  matchzyMatchId: number,
  attempts = 10
): Promise<MatchzyStats | null> {
  for (let i = 0; i < attempts; i++) {
    const stats = await getMatchzyStats(matchzyMatchId).catch(() => null);
    if (stats && stats.maps.length > 0 && stats.players.length > 0) return stats;
    await sleep(2000);
  }
  return null;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function computePayloadHash(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function normalize(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function resolveWinner(
  match: { team1_id: string; team2_id: string; team1_name: string; team2_name: string },
  mysqlMatch: MatchzyStatsMatch
): string | null {
  const { winner, team1_score = 0, team2_score = 0 } = mysqlMatch;

  if (winner) {
    const w = normalize(winner);
    if (w === normalize(match.team1_name)) return match.team1_id;
    if (w === normalize(match.team2_name)) return match.team2_id;
  }

  if (team1_score > team2_score) return match.team1_id;
  if (team2_score > team1_score) return match.team2_id;

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Save stats to Supabase ────────────────────────────────────────────────────

export interface SaveMatchStatsResult {
  maps: number;
  players: number;
  skippedNoProfile: string[];
  skippedNoTeam: string[];
  errors: string[];
}

export async function saveMatchStats(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matchId: string,
  team1Id: string,
  team2Id: string,
  stats: MatchzyStats
): Promise<SaveMatchStatsResult> {
  const result: SaveMatchStatsResult = { maps: 0, players: 0, skippedNoProfile: [], skippedNoTeam: [], errors: [] };

  // Resolve steam_id → profile_id
  const steamIds = [...new Set(stats.players.map((p) => p.steamid64))];
  const { data: profileRows, error: profileErr } = await supabase
    .from("profiles")
    .select("id, steam_id")
    .in("steam_id", steamIds)
    .returns<{ id: string; steam_id: string }[]>();

  if (profileErr) result.errors.push(`profiles lookup: ${profileErr.message}`);
  const steamToProfileId = new Map((profileRows ?? []).map((p) => [p.steam_id, p.id]));

  // Resolve team name → team_id
  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", [team1Id, team2Id])
    .returns<{ id: string; name: string }[]>();

  const team1Name = teamRows?.find((t) => t.id === team1Id)?.name ?? "";
  const team2Name = teamRows?.find((t) => t.id === team2Id)?.name ?? "";

  for (const mapRow of stats.maps) {
    const mapNumber = mapRow.mapnumber ?? 0;
    const mapName = (mapRow.mapname as string | undefined) ?? "unknown";

    const winnerName = mapRow.winner as string | undefined;
    let mapWinnerId: string | null = null;
    if (winnerName) {
      if (normalize(winnerName) === normalize(team1Name)) mapWinnerId = team1Id;
      else if (normalize(winnerName) === normalize(team2Name)) mapWinnerId = team2Id;
    }

    // Upsert map row — do NOT chain .select() here; some PostgREST versions
    // silently return nothing on UPDATE. We fetch the ID in a separate query.
    const { error: mapUpsertErr } = await supabase
      .from("match_maps")
      .upsert(
        {
          match_id: matchId,
          map_order: mapNumber,
          map_name: mapName,
          team1_score: (mapRow.team1_score as number | undefined) ?? 0,
          team2_score: (mapRow.team2_score as number | undefined) ?? 0,
          winner_id: mapWinnerId,
          status: "finished",
          played_at: new Date().toISOString(),
        },
        { onConflict: "match_id,map_order" }
      );

    if (mapUpsertErr) {
      result.errors.push(`match_maps upsert map ${mapNumber}: ${mapUpsertErr.message}`);
      continue;
    }

    // Fetch the ID explicitly — reliable regardless of INSERT vs UPDATE
    const { data: matchMapRow, error: mapFetchErr } = await supabase
      .from("match_maps")
      .select("id")
      .eq("match_id", matchId)
      .eq("map_order", mapNumber)
      .maybeSingle<{ id: string }>();

    if (mapFetchErr || !matchMapRow) {
      result.errors.push(`match_maps fetch map ${mapNumber}: ${mapFetchErr?.message ?? "row not found"}`);
      continue;
    }

    result.maps++;
    const matchMapId = matchMapRow.id;

    for (const player of stats.players.filter((p) => p.mapnumber === mapNumber)) {
      const profileId = steamToProfileId.get(player.steamid64);
      if (!profileId) {
        result.skippedNoProfile.push(`${player.steamid64} (${String(player.name)})`);
        continue;
      }

      const teamSide = player.team as string | undefined;
      let teamId: string | null = null;
      if (teamSide) {
        const norm = normalize(teamSide);
        if (norm === normalize(team1Name)) teamId = team1Id;
        else if (norm === normalize(team2Name)) teamId = team2Id;
      }
      if (!teamId) {
        result.skippedNoTeam.push(`${player.steamid64} team="${String(player.team)}" t1="${team1Name}" t2="${team2Name}"`);
        continue;
      }

      const kills = (player.kills as number | undefined) ?? 0;
      const deaths = (player.deaths as number | undefined) ?? 0;
      const assists = (player.assists as number | undefined) ?? 0;
      const damage = (player.damage as number | undefined) ?? 0;
      const hsKills = (player.head_shot_kills as number | undefined) ?? 0;
      const rounds = (mapRow.rounds_played as number | undefined) ?? 30;
      const adr = rounds > 0 ? Math.round((damage / rounds) * 100) / 100 : 0;

      const { error: statsErr } = await supabase.from("match_player_stats").upsert(
        {
          match_map_id: matchMapId,
          profile_id: profileId,
          team_id: teamId,
          kills,
          deaths,
          assists,
          hs_count: hsKills,
          adr,
          damage_dealt: damage,
          mvps: 0,
          score: 0,
          k2: 0,
          k3: 0,
          k4: 0,
          k5: 0,
        },
        { onConflict: "match_map_id,profile_id" }
      );
      if (statsErr) {
        result.errors.push(`match_player_stats upsert ${player.steamid64}: ${statsErr.message}`);
      } else {
        result.players++;
      }
    }
  }

  return result;
}

// ── Main handler: called on series_end ───────────────────────────────────────

export async function processSeriesEnd(matchId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Buscar o match completo (select *) para que processWebhookResult/advanceWinner
  // tenham todos os campos necessários (tournament_id, round, match_index, etc.)
  const match = await getMatchRowByIdForWebhook(matchId);
  if (!match) throw new Error(`Partida ${matchId} não encontrada`);

  const { data: matchzyRow } = await supabase
    .from("matches")
    .select("matchzy_match_id")
    .eq("id", matchId)
    .maybeSingle<{ matchzy_match_id: number | null }>();

  const matchzyMatchId = matchzyRow?.matchzy_match_id;
  if (!matchzyMatchId) throw new Error(`matchzy_match_id não definido para ${matchId}`);
  if (!match.team1_id || !match.team2_id) throw new Error(`Times não definidos para ${matchId}`);

  // Bracket já finalizado: só re-salva stats (upserts são idempotentes), não avança bracket de novo
  const bracketDone = match.status === "finished" && !!match.winner_id;

  // Buscar stats no MySQL com retry (MatchZy pode demorar alguns segundos para gravar)
  const stats = await getMatchzyStatsWithRetry(matchzyMatchId);
  if (!stats) {
    if (!bracketDone) {
      await supabase.from("matches").update({ status: "processing_failed" }).eq("id", matchId);
    }
    throw new Error(`Stats MySQL não disponíveis após retries para matchzy_match_id ${matchzyMatchId}`);
  }

  // Sempre salvar stats — upserts são idempotentes, corrige casos onde salvou parcialmente
  const saveResult = await saveMatchStats(supabase, matchId, match.team1_id, match.team2_id, stats);
  if (saveResult.errors.length || saveResult.skippedNoProfile.length || saveResult.skippedNoTeam.length) {
    console.warn(`[matchzy/processSeriesEnd] saveMatchStats result for ${matchId}:`, JSON.stringify(saveResult));
  }

  // Bracket já avançado anteriormente — não repetir
  if (bracketDone) return;

  // Resolver vencedor
  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", [match.team1_id, match.team2_id])
    .returns<{ id: string; name: string }[]>();

  const team1Name = teamRows?.find((t) => t.id === match.team1_id)?.name ?? "";
  const team2Name = teamRows?.find((t) => t.id === match.team2_id)?.name ?? "";

  const winnerId = resolveWinner(
    { team1_id: match.team1_id, team2_id: match.team2_id, team1_name: team1Name, team2_name: team2Name },
    stats.match
  );

  if (!winnerId) {
    throw new Error(
      `Não foi possível determinar o vencedor (team1_score=${stats.match.team1_score}, team2_score=${stats.match.team2_score}, winner="${stats.match.winner}")`
    );
  }

  // Marcar partida como finalizada e avançar bracket
  await processWebhookResult(match, stats.match.team1_score ?? 0, stats.match.team2_score ?? 0);

  // Cleanup do servidor (fire-and-forget)
  const { data: serverRow } = await supabase
    .from("dathost_servers")
    .select("dathost_server_id")
    .eq("match_id", matchId)
    .maybeSingle<{ dathost_server_id: string | null }>();

  if (serverRow?.dathost_server_id) {
    const sid = serverRow.dathost_server_id;
    stopGameServer(sid, matchId).catch(() => {});
    deleteGameServer(sid, matchId).catch(() => {});
    await supabase.from("dathost_servers").update({ status: "terminated" }).eq("match_id", matchId);
  }
}
