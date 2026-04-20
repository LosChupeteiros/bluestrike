import { NextRequest, NextResponse } from "next/server";
import { getMatchRowByIdForWebhook, processWebhookResult } from "@/lib/matches";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

// Dathost CS2 Match API webhook payload (base structure shared by all events)
interface DathostWebhookPayload {
  id: string;                  // Dathost match ID
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
  rounds_played: number;
  finished: boolean;
  cancel_reason: string | null;
}

const MATCH_STATUS_MAP: Record<string, string> = {
  booting_server:           "pending",
  loading_map:              "pending",
  server_ready_for_players: "pending",
  all_players_connected:    "pending",
  match_started:            "live",
  match_canceled:           "cancelled",
  match_ended:              "finished",
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { matchId } = await context.params;

  const match = await getMatchRowByIdForWebhook(matchId);

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  // Verify authorization header
  const authHeader = request.headers.get("authorization");
  const expectedAuth = match.webhook_secret ? `Bearer ${match.webhook_secret}` : null;

  if (!expectedAuth || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Parse event from query param (each Dathost event webhook URL includes ?event=X)
  const event = request.nextUrl.searchParams.get("event") ?? "unknown";

  let payload: DathostWebhookPayload;
  try {
    payload = (await request.json()) as DathostWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Store Dathost match ID on first webhook if not already set
  if (payload.id && !match.dathost_match_id) {
    await supabase
      .from("matches")
      .update({ dathost_match_id: payload.id })
      .eq("id", matchId);
  }

  switch (event) {
    case "match_started":
    case "all_players_connected": {
      if (match.status === "pending" || match.status === "veto") {
        await supabase
          .from("matches")
          .update({ status: "live", started_at: new Date().toISOString() })
          .eq("id", matchId);
      }
      break;
    }

    case "match_canceled": {
      await supabase
        .from("matches")
        .update({ status: "cancelled", finished_at: new Date().toISOString() })
        .eq("id", matchId);
      break;
    }

    case "match_ended": {
      if (match.status === "finished") {
        // Already processed — idempotent
        return NextResponse.json({ ok: true, note: "already_finished" });
      }

      const t1Score = payload.team1?.stats?.score ?? 0;
      const t2Score = payload.team2?.stats?.score ?? 0;

      await processWebhookResult(match, t1Score, t2Score);
      break;
    }

    case "booting_server":
    case "loading_map":
    case "server_ready_for_players": {
      // Status-tracking only — no action needed beyond acknowledgement
      break;
    }

    default:
      // Unknown event — log and return 200 to avoid Dathost retries
      console.warn(`[webhook/cs2/${matchId}] Unknown event: ${event}`);
  }

  return NextResponse.json({ ok: true, event });
}
