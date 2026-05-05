// MatchZy integration: MySQL stats client + series_end processing.
// All MySQL access is server-side only — never called from client components.

import type mysql from "mysql2/promise";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { processWebhookResult, getMatchRowByIdForWebhook } from "@/lib/matches";
import { stopGameServer, deleteGameServer } from "@/lib/dathost";
import { getWeaponPaintsPool } from "@/lib/weaponpaints/mysql";

// ── MySQL pool ────────────────────────────────────────────────────────────────

function getPool(): mysql.Pool {
  const pool = getWeaponPaintsPool();
  if (!pool) {
    throw new Error("MySQL MatchZy/WeaponPaints não configurado.");
  }
  return pool;
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
  attempts = 4
): Promise<MatchzyStats | null> {
  let lastError: unknown = null;

  for (let i = 0; i < attempts; i++) {
    const stats = await getMatchzyStats(matchzyMatchId).catch((err: unknown) => {
      lastError = err;
      console.error(`[matchzy/mysql] tentativa ${i + 1}/${attempts} falhou para ${matchzyMatchId}:`, err);
      return null;
    });
    if (stats && stats.players.length > 0) return stats;
    if (i < attempts - 1) await sleep(2000);
  }

  if (lastError) {
    console.error(`[matchzy/mysql] stats indisponíveis para ${matchzyMatchId}:`, lastError);
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

  // When matchzy_stats_maps is empty (BO1 or end_time not yet written),
  // synthesize a single map row from matchzy_stats_matches so player stats can be saved.
  const isSyntheticMaps = stats.maps.length === 0;
  const mapsToProcess: MatchzyStatsMap[] = isSyntheticMaps
    ? [
        {
          matchid: stats.match.matchid,
          mapnumber: 0,
          mapname: "map1",
          team1_score: stats.match.team1_score,
          team2_score: stats.match.team2_score,
          winner: stats.match.winner,
          end_time: "done",
        } as MatchzyStatsMap,
      ]
    : stats.maps;

  for (const mapRow of mapsToProcess) {
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

    for (const player of (isSyntheticMaps ? stats.players : stats.players.filter((p) => p.mapnumber === mapNumber))) {
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

// ── Save raw MySQL stats to Supabase ────────────────────────────────────────

export async function saveMysqlStats(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matchId: string,
  stats: MatchzyStats
): Promise<{ saved: number; errors: string[] }> {
  if (!stats.players.length) return { saved: 0, errors: [] };

  // One row per player per map — no profile or team lookup required
  const playerRows = stats.players.map((player) => {
    const mapRow = stats.maps.find((m) => m.mapnumber === player.mapnumber) ?? stats.maps[0] ?? null;
    return {
      match_id: matchId,
      matchzy_match_id: Number(player.matchid),
      mapnumber: Number(player.mapnumber ?? 0),
      mapname: (mapRow?.mapname as string | undefined) ?? null,
      map_team1_score: (mapRow?.team1_score as number | undefined) ?? null,
      map_team2_score: (mapRow?.team2_score as number | undefined) ?? null,
      map_winner: (mapRow?.winner as string | undefined) ?? null,
      steamid64: String(player.steamid64),
      player_name: (player.name as string | undefined) ?? null,
      team_name: (player.team as string | undefined) ?? null,
      kills: Number(player.kills ?? 0),
      deaths: Number(player.deaths ?? 0),
      assists: Number(player.assists ?? 0),
      damage: Number(player.damage ?? 0),
      head_shot_kills: Number(player.head_shot_kills ?? 0),
    };
  });

  const { error } = await supabase
    .from("matchzy_player_stats")
    .upsert(playerRows, { onConflict: "match_id,mapnumber,steamid64" });

  if (error) return { saved: 0, errors: [error.message] };

  // Also upsert match_maps so the scoreboard header can show map name + round scores
  if (stats.maps.length > 0) {
    const mapRows = stats.maps.map((m) => ({
      match_id: matchId,
      map_order: Number(m.mapnumber ?? 0),
      map_name: (m.mapname as string | undefined) ?? null,
      team1_score: (m.team1_score as number | undefined) ?? 0,
      team2_score: (m.team2_score as number | undefined) ?? 0,
      winner_id: null,
      status: "finished",
      played_at: new Date().toISOString(),
    }));
    await supabase.from("match_maps").upsert(mapRows, { onConflict: "match_id,map_order" });
  }

  return { saved: playerRows.length, errors: [] };
}

async function getBracketScores(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  match: { team1_id: string; team2_id: string },
  stats: MatchzyStats
): Promise<{ team1Score: number; team2Score: number }> {
  const matchTeam1Score = Number(stats.match.team1_score ?? 0);
  const matchTeam2Score = Number(stats.match.team2_score ?? 0);

  if (matchTeam1Score !== matchTeam2Score) {
    return { team1Score: matchTeam1Score, team2Score: matchTeam2Score };
  }

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
  if (winnerId === match.team1_id) return { team1Score: 1, team2Score: 0 };
  if (winnerId === match.team2_id) return { team1Score: 0, team2Score: 1 };

  let team1MapWins = 0;
  let team2MapWins = 0;
  for (const map of stats.maps) {
    const winner = map.winner ? normalize(map.winner) : "";
    if (winner && winner === normalize(team1Name)) team1MapWins++;
    if (winner && winner === normalize(team2Name)) team2MapWins++;
  }

  if (team1MapWins !== team2MapWins) {
    return { team1Score: team1MapWins, team2Score: team2MapWins };
  }

  if (stats.maps.length === 1) {
    const map = stats.maps[0];
    return {
      team1Score: Number(map.team1_score ?? 0),
      team2Score: Number(map.team2_score ?? 0),
    };
  }

  return { team1Score: matchTeam1Score, team2Score: matchTeam2Score };
}

// ── Main handler: called on series_end ───────────────────────────────────────

export async function processSeriesEnd(matchId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

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

  // Salvar stats diretamente do MySQL — sem lookup de profile ou team_id
  const saveResult = await saveMysqlStats(supabase, matchId, stats);
  if (saveResult.errors.length) {
    console.error(`[matchzy/processSeriesEnd] saveMysqlStats errors for ${matchId}:`, saveResult.errors);
  } else {
    console.log(`[matchzy/processSeriesEnd] saved ${saveResult.saved} player rows for ${matchId}`);
  }

  // Bracket já avançado anteriormente — não repetir
  if (bracketDone) return;

  // Resolver vencedor e avançar bracket
  const bracketScores = await getBracketScores(
    supabase,
    { team1_id: match.team1_id, team2_id: match.team2_id },
    stats
  );
  await processWebhookResult(match, bracketScores.team1Score, bracketScores.team2Score);

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
