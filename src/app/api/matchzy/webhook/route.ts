import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { computePayloadHash, processSeriesEnd } from "@/lib/matchzy";

export async function POST(req: Request) {
  // Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = String(payload.event ?? "");
  const matchzyMatchId = Number(payload.matchid ?? payload.match_id ?? 0);

  // Eventos sem matchid ou sem event são ignorados silenciosamente
  if (!eventType || !matchzyMatchId) {
    return Response.json({ ok: true });
  }

  const payloadHash = computePayloadHash(payload);
  const supabase = createSupabaseAdminClient();

  // 3. Buscar partida BlueStrike pelo matchzy_match_id
  const { data: matchRow } = await supabase
    .from("matches")
    .select("id, status, winner_id")
    .eq("matchzy_match_id", matchzyMatchId)
    .maybeSingle<{ id: string; status: string; winner_id: string | null }>();

  // 4. Inserir registro de idempotência (UNIQUE payload_hash previne duplicatas)
  const { error: insertErr } = await supabase.from("matchzy_webhook_events").insert({
    match_id: matchRow?.id ?? null,
    matchzy_match_id: matchzyMatchId,
    event_type: eventType,
    payload,
    payload_hash: payloadHash,
    processing_status: "pending",
  });

  if (insertErr) {
    // Código 23505 = unique_violation (PostgreSQL)
    if (insertErr.code === "23505") {
      return Response.json({ ok: true, duplicate: true });
    }
    console.error("[matchzy/webhook] insert event failed:", insertErr.message);
  }

  // 5. Processar evento
  try {
    await handleMatchzyEvent(eventType, matchzyMatchId, matchRow, supabase);

    await supabase
      .from("matchzy_webhook_events")
      .update({ processing_status: "processed", processed_at: new Date().toISOString() })
      .eq("payload_hash", payloadHash);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[matchzy/webhook] ${eventType} error:`, msg);

    await supabase
      .from("matchzy_webhook_events")
      .update({ processing_status: "failed", error_message: msg })
      .eq("payload_hash", payloadHash);
  }

  return Response.json({ ok: true });
}

async function handleMatchzyEvent(
  eventType: string,
  matchzyMatchId: number,
  matchRow: { id: string; status: string; winner_id: string | null } | null,
  supabase: ReturnType<typeof createSupabaseAdminClient>
): Promise<void> {
  switch (eventType) {
    case "series_start": {
      // Registrar started_at se ainda não estiver definido
      if (matchRow?.id) {
        await supabase
          .from("matches")
          .update({ started_at: new Date().toISOString() })
          .eq("id", matchRow.id)
          .is("started_at", null);
      }
      break;
    }

    case "going_live": {
      // Servidor agora está ao vivo
      if (matchRow?.id) {
        await supabase
          .from("dathost_servers")
          .update({ status: "live" })
          .eq("match_id", matchRow.id);
      }
      break;
    }

    case "series_end": {
      if (!matchRow?.id) {
        throw new Error(`Partida não encontrada para matchzy_match_id ${matchzyMatchId}`);
      }

      // Idempotente: se já finalizada com vencedor, não reprocessar
      if (matchRow.status === "finished" && matchRow.winner_id) break;

      await processSeriesEnd(matchRow.id);
      break;
    }

    // Eventos informativos — apenas log via tabela de eventos, sem side-effects
    case "round_end":
    case "map_result":
    case "player_disconnect":
    case "demo_upload_ended":
      break;

    default:
      break;
  }
}
