// Match flow: ready-up → veto → second ready → provision server
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { CS2_MAP_POOL, getVetoSequence } from "@/lib/maps";
import { duplicateServer, startServer, getGameServer, stopGameServer, deleteGameServer, sendConsoleCommand, writeDathostLog } from "@/lib/dathost";

// Mirror server cloned for each match. Override via DATHOST_MIRROR_SERVER_ID env var.
const MIRROR_SERVER_ID = process.env.DATHOST_MIRROR_SERVER_ID ?? "69f7f5303ee4ac03506ae4c1";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MatchRow {
  id: string;
  tournament_id: string | null;
  team1_id: string | null;
  team2_id: string | null;
  round: number;
  match_index: number;
  bo_type: 1 | 3 | 5;
  status: string;
  winner_id: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  webhook_secret: string | null;
  dathost_match_id: string | null;
  ready_team1: boolean;
  ready_team2: boolean;
  teams_assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Ready-up ──────────────────────────────────────────────────────────────────
// Two phases:
//   "pending"  → both ready → status = "veto"
//   "pre_live" → both ready → status = "live" + provision server

export async function readyUpMatch(
  matchId: string,
  requestingTeamId: string
): Promise<{ ok: true; bothReady: boolean } | { ok: false; error: string }> {
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<MatchRow>();

  if (!match) return { ok: false, error: "Partida não encontrada." };
  if (match.status !== "pending" && match.status !== "pre_live") {
    return { ok: false, error: "Essa partida não aceita check-in agora." };
  }

  const isTeam1 = requestingTeamId === match.team1_id;
  const isTeam2 = requestingTeamId === match.team2_id;
  if (!isTeam1 && !isTeam2) return { ok: false, error: "Você não faz parte dessa partida." };

  const update: Partial<{ ready_team1: boolean; ready_team2: boolean; status: string }> = {};
  if (isTeam1) update.ready_team1 = true;
  if (isTeam2) update.ready_team2 = true;

  const bothReady =
    (isTeam1 ? true : match.ready_team1) &&
    (isTeam2 ? true : match.ready_team2);

  if (bothReady) {
    update.status = match.status === "pending" ? "veto" : "live";
    update.ready_team1 = false;
    update.ready_team2 = false;
  }

  await supabase.from("matches").update(update).eq("id", matchId);

  if (bothReady && match.status === "pre_live") {
    const { mapName, mapId } = await resolveMatchMap(matchId);
    provisionServerAsync(matchId, mapName, mapId).catch(
      (err: unknown) => console.error("[match-flow] provision error:", err)
    );
  }

  return { ok: true, bothReady };
}

// Resolves which map to play from the veto history.
async function resolveMatchMap(matchId: string): Promise<{ mapName: string; mapId: string }> {
  const supabase = createSupabaseAdminClient();
  const { data: vetoRows } = await supabase
    .from("map_vetoes")
    .select("action, map_name")
    .eq("match_id", matchId)
    .returns<{ action: string; map_name: string }[]>();

  const picks = (vetoRows ?? []).filter((v) => v.action === "pick").map((v) => v.map_name);
  const bans = new Set((vetoRows ?? []).filter((v) => v.action === "ban").map((v) => v.map_name));
  const decider = CS2_MAP_POOL.find((m) => !picks.includes(m.name) && !bans.has(m.name));
  const mapName = picks[0] ?? decider?.name ?? "Mirage";
  const mapEntry = CS2_MAP_POOL.find((m) => m.name === mapName);
  return { mapName, mapId: mapEntry?.mapId ?? "de_mirage" };
}

// ── Walkover ──────────────────────────────────────────────────────────────────

export async function applyWalkover(matchId: string, defaultingTeamId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<MatchRow>();

  if (!match || match.status === "finished" || match.status === "walkover") return;

  const winnerId = defaultingTeamId === match.team1_id ? match.team2_id : match.team1_id;
  if (!winnerId) return;

  await supabase
    .from("matches")
    .update({ status: "walkover", winner_id: winnerId, finished_at: new Date().toISOString() })
    .eq("id", matchId);

  const { advanceWinnerPublic } = await import("@/lib/matches");
  await advanceWinnerPublic(matchId, winnerId);
}

// ── Veto ──────────────────────────────────────────────────────────────────────

export async function submitVetoAction(
  matchId: string,
  requestingTeamId: string,
  mapName: string,
  pickedSide?: "ct" | "t"
): Promise<
  | { ok: true; done: boolean; pickedMaps: string[]; decider: string | null }
  | { ok: false; error: string }
> {
  if (!CS2_MAP_POOL.find((m) => m.name === mapName)) {
    return { ok: false, error: "Mapa inválido." };
  }

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, team1_id, team2_id, status, bo_type, webhook_secret")
    .eq("id", matchId)
    .maybeSingle<Pick<MatchRow, "id" | "team1_id" | "team2_id" | "status" | "bo_type" | "webhook_secret">>();

  if (!match) return { ok: false, error: "Partida não encontrada." };
  if (match.status !== "veto") return { ok: false, error: "Veto não está ativo." };

  const isTeam1 = requestingTeamId === match.team1_id;
  const isTeam2 = requestingTeamId === match.team2_id;
  if (!isTeam1 && !isTeam2) return { ok: false, error: "Você não faz parte dessa partida." };

  const { data: existing } = await supabase
    .from("map_vetoes")
    .select("team_id, action, map_name, veto_order")
    .eq("match_id", matchId)
    .order("veto_order", { ascending: true })
    .returns<{ team_id: string; action: string; map_name: string; veto_order: number }[]>();

  const done = existing ?? [];
  const sequence = getVetoSequence(match.bo_type as 1 | 3 | 5);
  const currentStep = done.length;

  if (currentStep >= sequence.length) return { ok: false, error: "Veto já finalizado." };

  const slot = sequence[currentStep];
  const expectedTeam = slot.turn === "team1" ? match.team1_id : match.team2_id;

  if (requestingTeamId !== expectedTeam) return { ok: false, error: "Não é a sua vez no veto." };

  const usedMaps = new Set(done.map((v) => v.map_name));
  if (usedMaps.has(mapName)) return { ok: false, error: "Esse mapa já foi usado no veto." };

  await supabase.from("map_vetoes").insert({
    match_id: matchId,
    team_id: requestingTeamId,
    action: slot.action,
    map_name: mapName,
    veto_order: currentStep + 1,
    picked_side: slot.action === "pick" ? (pickedSide ?? null) : null,
  });

  const isLastStep = currentStep + 1 >= sequence.length;

  const allVetoes = [...done, { action: slot.action, map_name: mapName }];
  const pickedMaps = allVetoes.filter((v) => v.action === "pick").map((v) => v.map_name);
  const allBanned = new Set(allVetoes.filter((v) => v.action === "ban").map((v) => v.map_name));
  const decider = CS2_MAP_POOL.find((m) => !pickedMaps.includes(m.name) && !allBanned.has(m.name))?.name ?? null;

  if (isLastStep) {
    await supabase
      .from("matches")
      .update({ status: "pre_live", ready_team1: false, ready_team2: false })
      .eq("id", matchId);
  }

  return { ok: true, done: isLastStep, pickedMaps, decider };
}

// ── Server provisioning ───────────────────────────────────────────────────────
// Called after both teams ready in pre_live, or by admin retry.
// Safe to call multiple times — skips if already in a non-error state.

export async function provisionServerAsync(
  matchId: string,
  mapName: string,
  mapId: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Skip if already provisioned or in progress
  // Allow retry on: "error" (explicit failure) or "reserving" (stuck — crashed between INSERT and Dathost call)
  const { data: existingRow } = await supabase
    .from("dathost_servers")
    .select("id, status")
    .eq("match_id", matchId)
    .maybeSingle<{ id: string; status: string }>();

  const retryableStatuses = new Set(["error", "reserving"]);
  if (existingRow && !retryableStatuses.has(existingRow.status)) return;

  // Duplicate the mirror server — each match gets its own fresh CS2 server.
  let server: Awaited<ReturnType<typeof duplicateServer>>;
  try {
    server = await duplicateServer(MIRROR_SERVER_ID, matchId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[provision/${matchId}] duplicateServer failed:`, msg);
    if (existingRow) {
      await supabase.from("dathost_servers").update({ status: "error" }).eq("match_id", matchId);
    } else {
      await supabase.from("dathost_servers").insert({
        match_id: matchId,
        dathost_id: null,
        ip: "",
        port: 0,
        rcon_password: "",
        status: "error",
      });
    }
    return;
  }

  const port = server.ports.game ?? 27015;
  const gotvPort = server.ports.gotv ?? null;
  const password = randomUUID().replace(/-/g, "").slice(0, 12);
  const ipStr = server.ip ?? server.raw_ip ?? "";

  const baseRow = {
    dathost_id: "",
    ip: ipStr,
    port,
    gotv_port: gotvPort,
    rcon_password: "",
    status: "reserving",
  };

  if (existingRow) {
    await supabase.from("dathost_servers").update(baseRow).eq("match_id", matchId);
  } else {
    const { error: insertErr } = await supabase.from("dathost_servers").insert({
      match_id: matchId,
      ...baseRow,
    });
    if (insertErr) {
      console.error(`[provision/${matchId}] DB insert failed:`, insertErr.message);
      await writeDathostLog({
        matchId,
        method: "POST",
        url: "internal://dathost_servers",
        errorMessage: `Falha ao reservar servidor no banco: ${insertErr.message}`,
      });
      // Cleanup orphaned duplicated server
      deleteGameServer(server.id, matchId).catch(() => {});
      return;
    }
  }

  await supabase.from("dathost_servers").update({
    dathost_server_id: server.id,
    raw_ip: server.raw_ip ?? null,
    server_password: password,
  }).eq("match_id", matchId).then(
    () => {},
    (e: unknown) => console.warn("[provision] newer columns not set (migration pending?):", e)
  );

  // Gerar matchzy_match_id: identificador numérico único que o MatchZy ecoará de volta
  // nos webhooks e gravará nas tabelas MySQL matchzy_stats_*.
  // MatchZy espera int32 — Unix timestamp em segundos (~1.78 bi em 2026, cabe em int32 até 2038)
  const matchzyMatchId = Math.floor(Date.now() / 1000);
  await supabase.from("matches").update({ matchzy_match_id: matchzyMatchId }).eq("id", matchId);

  // Connect string já disponível (IP + porta do servidor duplicado)
  const connectString = `steam://connect/${ipStr}:${port}/${password}`;
  await supabase
    .from("dathost_servers")
    .update({ connect_string: connectString, status: "provisioning" })
    .eq("match_id", matchId);

  // Iniciar o servidor
  try {
    await startServer(server.id, matchId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[provision/${matchId}] startServer failed:`, msg);
    await supabase.from("dathost_servers").update({ status: "error" }).eq("match_id", matchId);
    return;
  }

  // Polling até o servidor estar online (max ~60 s)
  let serverOnline = false;
  for (let i = 0; i < 12; i++) {
    await sleep(5000);
    const info = await getGameServer(server.id, matchId).catch(() => null);
    if (info?.on && !info.booting) { serverOnline = true; break; }
  }

  if (!serverOnline) {
    console.error(`[provision/${matchId}] servidor não ficou online após 60s`);
    await supabase.from("dathost_servers").update({ status: "error" }).eq("match_id", matchId);
    return;
  }

  // Atualizar IP confirmado após boot
  const confirmedInfo = await getGameServer(server.id, matchId).catch(() => server);
  const confirmedIp = confirmedInfo.raw_ip ?? confirmedInfo.ip ?? ipStr;
  await supabase
    .from("dathost_servers")
    .update({ ip: confirmedIp, raw_ip: confirmedIp, status: "ready" })
    .eq("match_id", matchId);

  // Enviar config MatchZy via console command
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bluestrike.com.br";
  const configUrl = `${base}/api/matches/${matchId}/matchzy-config`;
  await sendConsoleCommand(server.id, `matchzy_loadmatch_url "${configUrl}"`, matchId);

  console.log(
    `[provision/${matchId}] OK — matchzy_match_id: ${matchzyMatchId}, server: ${server.id}, map: ${mapName} (${mapId}), ip: ${confirmedIp}:${port}`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Admin retry: clears error/broken state and re-provisions.
export async function retryProvision(matchId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .maybeSingle<{ status: string }>();

  if (match?.status !== "live" && match?.status !== "pre_live") {
    throw new Error(`Partida no status "${match?.status ?? "desconhecido"}" não pode ser reiniciada.`);
  }

  // Fetch the duplicated server ID so we can clean it up on Dathost
  const { data: brokenRow } = await supabase
    .from("dathost_servers")
    .select("dathost_server_id")
    .eq("match_id", matchId)
    .in("status", ["error", "reserving"])
    .maybeSingle<{ dathost_server_id: string | null }>();

  // Delete broken DB row so provisionServerAsync starts fresh
  await supabase
    .from("dathost_servers")
    .delete()
    .eq("match_id", matchId)
    .in("status", ["error", "reserving"]);

  // Stop + delete the orphaned duplicated server from Dathost (best-effort)
  if (brokenRow?.dathost_server_id) {
    const sid = brokenRow.dathost_server_id;
    await stopGameServer(sid, matchId).catch(() => {});
    await deleteGameServer(sid, matchId).catch(() => {});
  }

  const { mapName, mapId } = await resolveMatchMap(matchId);
  await provisionServerAsync(matchId, mapName, mapId);
}
