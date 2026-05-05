import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getMatchzyStats, processSeriesEnd } from "@/lib/matchzy";
import { writeDathostLog } from "@/lib/dathost";

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

  if (match.status === "finished" || match.status === "cancelled") {
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
    writeDathostLog({
      matchId,
      method: "POLL",
      url: "matchzy_tick::no_data",
      responseStatus: 200,
      responseBody: { matchzyMatchId, reason: "MySQL sem dados ainda" },
    }).catch(() => {});
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

  if (seriesDone && !processing.has(matchId)) {
    processing.add(matchId);

    writeDathostLog({
      matchId,
      method: "POLL",
      url: "matchzy_tick::series_end",
      responseStatus: 200,
      responseBody: { matchzyMatchId, wins, maps: mapsPayload },
    }).catch(() => {});

    processSeriesEnd(matchId)
      .catch(async (err: unknown) => {
        writeDathostLog({
          matchId,
          method: "POLL",
          url: "matchzy_tick::error",
          responseStatus: 500,
          responseBody: { error: err instanceof Error ? err.message : String(err) },
        }).catch(() => {});
      })
      .finally(() => processing.delete(matchId));
  }

  return Response.json({
    done: seriesDone,
    team1_maps: stats.match.team1_score ?? 0,
    team2_maps: stats.match.team2_score ?? 0,
    maps: mapsPayload,
  });
}
