import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { computePayloadHash, processSeriesEnd } from "@/lib/matchzy";
import { getMatchTeamMode, sendMatchConsoleCommand } from "@/lib/match-flow";
import { getTeamMode } from "@/lib/team-modes";
import { getServerIntegrationToken, readBearer, secretsMatch } from "@/lib/api-auth";

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * O MatchZy autentica de duas formas, e aceitamos as duas:
 *
 * 1. Segredo no caminho da URL (`matchzy_remote_log_url ".../webhook/<token>"`).
 *    É o caminho principal porque é só uma URL — funciona com certeza.
 * 2. Header `Authorization` (cvars `matchzy_remote_log_header_key/value`).
 *    Fica como reforço: a issue #369 do MatchZy relata essas cvars não pegando,
 *    então não dá para depender só delas.
 */
function authorize(request: Request, token: string): { ok: true } | { ok: false; status: number } {
  const expected = getServerIntegrationToken();
  // Falha fechado: sem token configurado, ninguém entra.
  if (!expected) return { ok: false, status: 503 };

  if (secretsMatch(decodeURIComponent(token), expected)) return { ok: true };
  if (secretsMatch(readBearer(request), expected)) return { ok: true };

  return { ok: false, status: 401 };
}

export async function POST(req: Request, context: RouteContext) {
  const { token } = await context.params;

  const auth = authorize(req, token);
  if (!auth.ok) {
    console.warn("[matchzy/webhook] requisição sem credencial válida — recusada.");
    return Response.json(
      { error: auth.status === 503 ? "Integração não configurada." : "Não autorizado." },
      { status: auth.status }
    );
  }

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
    await handleMatchzyEvent(eventType, matchzyMatchId, matchRow, supabase, payload);

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

/** Lê o placar de um payload de round_end, independente do formato exato. */
function readRoundScores(payload: Record<string, unknown>): { t1: number; t2: number } | null {
  const team1 = payload.team1 as Record<string, unknown> | undefined;
  const team2 = payload.team2 as Record<string, unknown> | undefined;
  const t1 = Number(team1?.score ?? team1?.series_score ?? NaN);
  const t2 = Number(team2?.score ?? team2?.series_score ?? NaN);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return null;
  return { t1, t2 };
}

/**
 * O 1x1 roda sem compra, então `mp_free_armor 1` precisa ser reenviado quando a
 * partida efetivamente sobe (going_live) e logo no começo — 0x0, 1x0 ou 0x1 —
 * porque o MatchZy reseta cvars ao iniciar a série.
 */
async function ensureFreeArmor(matchId: string): Promise<void> {
  const mode = await getMatchTeamMode(matchId);
  if (!getTeamMode(mode).freeArmor) return;
  await sendMatchConsoleCommand(matchId, "mp_free_armor 1");
}

async function handleMatchzyEvent(
  eventType: string,
  matchzyMatchId: number,
  matchRow: { id: string; status: string; winner_id: string | null } | null,
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  payload: Record<string, unknown>
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
        await ensureFreeArmor(matchRow.id);
      }
      break;
    }

    case "round_end": {
      // Reenvia mp_free_armor no início da partida (0x0, 1x0 ou 0x1)
      if (matchRow?.id) {
        const scores = readRoundScores(payload);
        if (!scores || scores.t1 + scores.t2 <= 1) {
          await ensureFreeArmor(matchRow.id);
        }
      }
      break;
    }

    case "series_end": {
      if (!matchRow?.id) {
        throw new Error(`Partida não encontrada para matchzy_match_id ${matchzyMatchId}`);
      }

      // Idempotente: se já finalizada com vencedor, não reprocessar
      await processSeriesEnd(matchRow.id);
      break;
    }

    // Eventos informativos — apenas log via tabela de eventos, sem side-effects
    case "map_result":
    case "player_disconnect":
    case "demo_upload_ended":
      break;

    default:
      break;
  }
}
