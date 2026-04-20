import { NextRequest, NextResponse } from "next/server";
import { getMatchRowByIdForWebhook, processWebhookResult } from "@/lib/matches";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { writeDathostLog } from "@/lib/dathost";

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

// ── Dathost CS2 Match API — full event_url payload ────────────────────────────

interface DathostPlayerStats {
  kills: number;
  assists: number;
  deaths: number;
  kills_with_headshot: number;
  damage_dealt: number;
  mvps?: number;
  score?: number;
  "2ks"?: number;
  "3ks"?: number;
  "4ks"?: number;
  "5ks"?: number;
}

interface DathostPlayer {
  match_id: string;
  steam_id_64: string;
  team: "team1" | "team2";
  nickname_override: string;
  connected: boolean;
  kicked: boolean;
  stats: DathostPlayerStats;
}

interface DathostEvent {
  event: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

interface DathostWebhookPayload {
  id: string;
  game_server_id: string;
  team1: {
    name: string;
    flag?: string;
    stats: { score: number };
  };
  team2: {
    name: string;
    flag?: string;
    stats: { score: number };
  };
  players?: DathostPlayer[];
  settings?: {
    map?: string;
    [key: string]: unknown;
  };
  webhooks?: {
    authorization_header?: string;
    [key: string]: unknown;
  };
  rounds_played: number;
  finished: boolean;
  cancel_reason: string | null;
  events: DathostEvent[];
}

// ── Save player stats for a completed map ────────────────────────────────────

async function savePlayerStats(
  matchId: string,
  team1Id: string | null,
  team2Id: string | null,
  mapName: string,
  players: DathostPlayer[]
): Promise<void> {
  if (players.length === 0) return;

  const supabase = createSupabaseAdminClient();

  // Create or find the match_map row
  const { data: existingMap } = await supabase
    .from("match_maps")
    .select("id")
    .eq("match_id", matchId)
    .eq("map_order", 1)
    .maybeSingle<{ id: string }>();

  let mapId: string;

  if (existingMap) {
    mapId = existingMap.id;
  } else {
    const { data: newMap, error } = await supabase
      .from("match_maps")
      .insert({
        match_id: matchId,
        map_name: mapName,
        map_order: 1,
        status: "finished",
        played_at: new Date().toISOString(),
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !newMap) return;
    mapId = newMap.id;
  }

  // Resolve steam_id_64 → profile_id
  const steamIds = players.map((p) => p.steam_id_64).filter(Boolean);
  if (steamIds.length === 0) return;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, steam_id")
    .in("steam_id", steamIds)
    .returns<{ id: string; steam_id: string }[]>();

  const profileBySteamId = new Map((profiles ?? []).map((p) => [p.steam_id, p.id]));

  const statsToInsert = players
    .filter((p) => profileBySteamId.has(p.steam_id_64))
    .map((p) => {
      const profileId = profileBySteamId.get(p.steam_id_64)!;
      const teamId = p.team === "team1" ? team1Id : team2Id;
      const kills = p.stats.kills ?? 0;
      const deaths = p.stats.deaths ?? 0;
      const hsCount = p.stats.kills_with_headshot ?? 0;
      const adr = deaths > 0 ? Number(((p.stats.damage_dealt ?? 0) / Math.max(p.stats.deaths, 1)).toFixed(2)) : 0;

      return {
        match_map_id: mapId,
        profile_id: profileId,
        team_id: teamId,
        kills,
        deaths,
        assists: p.stats.assists ?? 0,
        hs_count: hsCount,
        adr,
      };
    })
    .filter((s) => Boolean(s.team_id));

  if (statsToInsert.length > 0) {
    await supabase
      .from("match_player_stats")
      .upsert(statsToInsert, { onConflict: "match_map_id,profile_id" });
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, context: RouteContext) {
  const { matchId } = await context.params;

  const match = await getMatchRowByIdForWebhook(matchId);

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  // Verify authorization header only when a secret is configured
  const authHeader = request.headers.get("authorization");
  if (match.webhook_secret && authHeader !== `Bearer ${match.webhook_secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: DathostWebhookPayload;
  try {
    payload = (await request.json()) as DathostWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // The last entry in the events array is the event that triggered this call
  const lastEvent = payload.events?.at(-1)?.event ?? "unknown";

  // Log every incoming webhook to the admin console
  await writeDathostLog({
    matchId,
    method: "WEBHOOK",
    url: `webhook::${lastEvent}`,
    requestBody: {
      event: lastEvent,
      finished: payload.finished,
      team1_score: payload.team1?.stats?.score,
      team2_score: payload.team2?.stats?.score,
      map: payload.settings?.map,
      players_count: payload.players?.length ?? 0,
      cancel_reason: payload.cancel_reason,
    },
    responseStatus: 200,
  });

  const supabase = createSupabaseAdminClient();

  // Store Dathost match ID on first contact
  if (payload.id && !match.dathost_match_id) {
    await supabase
      .from("matches")
      .update({ dathost_match_id: payload.id })
      .eq("id", matchId);
  }

  switch (lastEvent) {
    case "all_players_connected":
    case "match_started": {
      // Server status "live" drives the "Ao vivo" badge in the UI
      await supabase
        .from("dathost_servers")
        .update({ status: "live" })
        .eq("match_id", matchId);
      if (match.status !== "live" && match.status !== "finished") {
        await supabase
          .from("matches")
          .update({ status: "live", started_at: new Date().toISOString() })
          .eq("id", matchId);
      }
      break;
    }

    case "match_ended": {
      await supabase.from("dathost_servers").update({ status: "terminated" }).eq("match_id", matchId);
      if (match.status === "finished") {
        return NextResponse.json({ ok: true, note: "already_finished" });
      }

      const t1Score = payload.team1?.stats?.score ?? 0;
      const t2Score = payload.team2?.stats?.score ?? 0;
      const mapName = payload.settings?.map ?? "unknown";

      // Save player stats before processing result (best-effort)
      if (payload.players && payload.players.length > 0) {
        await savePlayerStats(matchId, match.team1_id, match.team2_id, mapName, payload.players);
      }

      // Update map scores on the match_maps row
      if (t1Score !== t2Score) {
        const winnerId = t1Score > t2Score ? match.team1_id : match.team2_id;
        if (winnerId) {
          await supabase
            .from("match_maps")
            .update({
              team1_score: t1Score,
              team2_score: t2Score,
              winner_id: winnerId,
              status: "finished",
              played_at: new Date().toISOString(),
            })
            .eq("match_id", matchId)
            .eq("map_order", 1);
        }
      }

      await processWebhookResult(match, t1Score, t2Score);
      break;
    }

    case "match_canceled": {
      await supabase.from("dathost_servers").update({ status: "terminated" }).eq("match_id", matchId);
      if (match.status !== "finished" && match.status !== "cancelled") {
        await supabase
          .from("matches")
          .update({ status: "cancelled", finished_at: new Date().toISOString() })
          .eq("id", matchId);
      }
      break;
    }

    case "booting_server": {
      await supabase
        .from("dathost_servers")
        .update({ status: "provisioning" })
        .eq("match_id", matchId);
      break;
    }

    case "server_ready_for_players": {
      const serverUpdate: Record<string, unknown> = { status: "ready" };

      // Refresh IP — the server might not have had one when we first reserved it
      if (payload.game_server_id) {
        try {
          const { getGameServer } = await import("@/lib/dathost");
          const serverInfo = await getGameServer(payload.game_server_id, matchId);
          if (serverInfo.raw_ip) {
            const { data: sRow } = await supabase
              .from("dathost_servers")
              .select("port, server_password")
              .eq("match_id", matchId)
              .maybeSingle<{ port: number; server_password: string | null }>();
            if (sRow?.server_password) {
              serverUpdate.ip = serverInfo.raw_ip;
              serverUpdate.raw_ip = serverInfo.raw_ip;
              serverUpdate.connect_string = `steam://connect/${serverInfo.raw_ip}:${sRow.port}/${sRow.server_password}`;
            }
          }
        } catch { /* best-effort refresh */ }
      }

      await supabase.from("dathost_servers").update(serverUpdate).eq("match_id", matchId);
      break;
    }

    // Informational events — acknowledge without side-effects
    case "loading_map":
    case "round_end":
    case "player_connected":
    case "player_disconnected":
    case "player_votekick_success":
      break;

    default:
      console.warn(`[webhook/cs2/${matchId}] Unhandled event: ${lastEvent}`);
  }

  return NextResponse.json({ ok: true, event: lastEvent });
}
