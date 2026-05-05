import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { cleanupMatchServer, getMatchzyStats, processSeriesEnd } from "@/lib/matchzy";
import { writeRollingDathostLog } from "@/lib/dathost";

// In-process dedup: prevents concurrent processSeriesEnd for the same match
const processing = new Set<string>();

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("status, winner_id, matchzy_match_id, bo_type")
    .eq("id", matchId)
    .maybeSingle<{
      status: string;
      winner_id: string | null;
      matchzy_match_id: number | null;
      bo_type: 1 | 3 | 5;
    }>();

  if (!match) return Response.json({ error: "not found" }, { status: 404 });

  if (match.status === "finished") {
    await cleanupMatchServer(matchId);
    return Response.json({ done: true, status: match.status });
  }

  if (match.status === "cancelled") {
    return Response.json({ done: true, status: match.status });
  }

  if (!match.matchzy_match_id) {
    return Response.json({ done: false, reason: "no_matchzy_match_id" });
  }

  const matchzyMatchId = match.matchzy_match_id;
  const boType = match.bo_type ?? 1;
  const neededWins = Math.ceil(boType / 2);

  // MySQL check with 2s hard timeout so status polls stay fast
  const stats = await Promise.race([
    getMatchzyStats(matchzyMatchId).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
  ]);

  if (!stats) {
    await writeRollingDathostLog({
      matchId,
      method: "POLL",
      url: "matchzy_tick::no_data",
      responseStatus: 200,
      responseBody: { matchzyMatchId, reason: "MySQL sem dados ainda" },
    }, { urlLike: "matchzy_tick::%", keep: 3 }).catch(() => {});
    return Response.json({ done: false, reason: "no_data_yet" });
  }

  const mapsPayload = stats.maps.map((m) => ({
    mapname: m.mapname ?? "?",
    t1: m.team1_score ?? 0,
    t2: m.team2_score ?? 0,
    winner: m.winner ?? null,
    finished: m.end_time != null,
  }));

  const finishedMaps = stats.maps.filter((m) => m.end_time != null);
  const wins: Record<string, number> = {};
  for (const m of finishedMaps) {
    if (m.winner) wins[m.winner] = (wins[m.winner] ?? 0) + 1;
  }

  let seriesDone = Object.values(wins).some((c) => c >= neededWins);

  // Fallback: matchzy_stats_maps can be empty even after series ends (BO1 / end_time lag).
  // Use matchzy_stats_matches aggregate scores in that case.
  if (!seriesDone && finishedMaps.length === 0) {
    const t1 = stats.match.team1_score ?? 0;
    const t2 = stats.match.team2_score ?? 0;
    if (Math.max(t1, t2) >= neededWins) seriesDone = true;
  }

  let finalizeError: string | null = null;

  if (seriesDone && !processing.has(matchId)) {
    processing.add(matchId);

    await writeRollingDathostLog({
      matchId,
      method: "POLL",
      url: "matchzy_tick::series_end",
      responseStatus: 200,
      responseBody: { matchzyMatchId, wins, maps: mapsPayload },
    }, { urlLike: "matchzy_tick::%", keep: 3 }).catch(() => {});

    try {
      await processSeriesEnd(matchId);
    } catch (err: unknown) {
      finalizeError = err instanceof Error ? err.message : String(err);
      await writeRollingDathostLog({
        matchId,
        method: "POLL",
        url: "matchzy_tick::error",
        responseStatus: 500,
        responseBody: { error: finalizeError },
      }, { urlLike: "matchzy_tick::%", keep: 3 }).catch(() => {});
    } finally {
      processing.delete(matchId);
    }
  }

  const responseBody = {
    done: seriesDone && !finalizeError,
    error: finalizeError,
    fast_polling: mapsPayload.some((m) => Math.max(m.t1, m.t2) >= 11)
      || Math.max(stats.match.team1_score ?? 0, stats.match.team2_score ?? 0) >= 11,
    team1_maps: stats.match.team1_score ?? 0,
    team2_maps: stats.match.team2_score ?? 0,
    maps: mapsPayload,
  };

  if (!seriesDone) {
    await writeRollingDathostLog({
      matchId,
      method: "POLL",
      url: "matchzy_tick::live",
      responseStatus: 200,
      responseBody: { matchzyMatchId, ...responseBody },
    }, { urlLike: "matchzy_tick::%", keep: 3 }).catch(() => {});
  }

  return Response.json(responseBody);
}
