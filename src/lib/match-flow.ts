// Match flow: ready-up → veto → second ready → provision server
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { CS2_MAP_POOL, getVetoSequence } from "@/lib/maps";
import { findAvailableServer, createCs2Match, getGameServer, writeDathostLog } from "@/lib/dathost";

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
    provisionServerAsync(matchId, match.team1_id!, match.team2_id!, mapName, mapId).catch(
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
  team1Id: string,
  team2Id: string,
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

  // Find available server, excluding those reserved by other active matches
  const { data: reservedRows } = await supabase
    .from("dathost_servers")
    .select("dathost_server_id")
    .neq("match_id", matchId)
    .not("dathost_server_id", "is", null);

  const reservedIds = new Set(
    (reservedRows ?? [])
      .map((r: { dathost_server_id: string | null }) => r.dathost_server_id)
      .filter((id): id is string => id !== null)
  );

  const server = await findAvailableServer(matchId, reservedIds);
  if (!server) {
    const msg = "Nenhum servidor CS2 disponível no momento.";
    console.error(`[provision/${matchId}] ${msg}`);
    await writeDathostLog({
      matchId,
      method: "GET",
      url: "https://dathost.net/api/0.1/game-servers",
      errorMessage: msg,
    });
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

  // Step 1 — reservation INSERT/UPDATE with only guaranteed-present columns.
  // dathost_id uses "" as placeholder (avoids NOT NULL failure before migration is applied).
  // Newer columns (dathost_server_id, raw_ip, server_password) are added via a follow-up UPDATE.
  const baseRow = {
    dathost_id: "",   // placeholder; replaced after Dathost match is created
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
      return;
    }
  }

  // Step 2 — try to persist newer columns (added by migration 20260425).
  // Safe to fail silently if migration hasn't been applied yet.
  await supabase.from("dathost_servers").update({
    dathost_server_id: server.id,
    raw_ip: server.raw_ip ?? null,
    server_password: password,
  }).eq("match_id", matchId).then(
    () => {},
    (e: unknown) => console.warn("[provision] newer columns not set (migration pending?):", e)
  );

  // Fetch team info
  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, name, tag")
    .in("id", [team1Id, team2Id])
    .returns<{ id: string; name: string; tag: string }[]>();

  const team1Row = teamRows?.find((t) => t.id === team1Id);
  const team2Row = teamRows?.find((t) => t.id === team2Id);

  // Fetch player steam IDs + nicknames
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id, profile_id")
    .in("team_id", [team1Id, team2Id])
    .returns<{ team_id: string; profile_id: string }[]>();

  const profileIds = (members ?? []).map((m) => m.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, steam_id, steam_persona_name")
    .in("id", profileIds)
    .returns<{ id: string; steam_id: string | null; steam_persona_name: string | null }[]>();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const players = (members ?? [])
    .filter((m) => profileMap.get(m.profile_id)?.steam_id)
    .map((m) => {
      const p = profileMap.get(m.profile_id)!;
      return {
        steam_id_64: p.steam_id!,
        team: (m.team_id === team1Id ? "team1" : "team2") as "team1" | "team2",
        ...(p.steam_persona_name ? { nickname_override: p.steam_persona_name } : {}),
      };
    });

  // Webhook config
  const { data: matchRow } = await supabase
    .from("matches")
    .select("webhook_secret")
    .eq("id", matchId)
    .maybeSingle<{ webhook_secret: string | null }>();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bluestrike.gg";
  const webhookUrl = `${base}/api/webhooks/cs2/${matchId}`;
  const authHeader = matchRow?.webhook_secret ? `Bearer ${matchRow.webhook_secret}` : undefined;

  // Create Dathost CS2 match — this boots the server
  let dathostMatchId: string;
  try {
    const dathostMatch = await createCs2Match(
      {
        game_server_id: server.id,
        team1: { name: team1Row?.name ?? "Time 1", flag: team1Row?.tag ?? "T1" },
        team2: { name: team2Row?.name ?? "Time 2", flag: team2Row?.tag ?? "T2" },
        players,
        settings: {
          map: mapId,
          enable_plugin: true,
          enable_tech_pause: true,
          wait_for_gotv: false,
          match_begin_countdown: 15,
          connect_time: 300,
          password,
        },
        webhooks: authHeader
          ? {
              event_url: webhookUrl,
              authorization_header: authHeader,
              enabled_events: [
                "booting_server",
                "server_ready_for_players",
                "match_started",
                "match_ended",
                "match_canceled",
              ],
            }
          : undefined,
      },
      matchId
    );
    dathostMatchId = dathostMatch.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[provision/${matchId}] createCs2Match failed:`, msg);
    await supabase.from("dathost_servers").update({ status: "error" }).eq("match_id", matchId);
    await writeDathostLog({
      matchId,
      method: "POST",
      url: "https://dathost.net/api/0.1/cs2-matches",
      errorMessage: `Falha ao criar partida CS2: ${msg}`,
    });
    throw err;
  }

  // Fetch server info to get confirmed IP after provisioning
  const serverInfo = await getGameServer(server.id, matchId).catch(() => server);
  const rawIp = serverInfo.raw_ip ?? server.raw_ip ?? server.ip ?? "";
  const connectString = `steam://connect/${rawIp}:${port}/${password}`;

  await supabase
    .from("dathost_servers")
    .update({
      dathost_id: dathostMatchId,
      ip: rawIp,
      raw_ip: rawIp,
      connect_string: connectString,
      status: "provisioning",
    })
    .eq("match_id", matchId);

  await supabase
    .from("matches")
    .update({ dathost_match_id: dathostMatchId })
    .eq("id", matchId);

  console.log(
    `[provision/${matchId}] OK — server: ${server.id}, map: ${mapName} (${mapId}), ip: ${rawIp}:${port}`
  );
}

// Admin retry: clears error/broken state and re-provisions.
export async function retryProvision(matchId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("team1_id, team2_id, status")
    .eq("id", matchId)
    .maybeSingle<{ team1_id: string | null; team2_id: string | null; status: string }>();

  if (!match?.team1_id || !match?.team2_id) {
    throw new Error("Times não definidos para esta partida.");
  }
  if (match.status !== "live" && match.status !== "pre_live") {
    throw new Error(`Partida no status "${match.status}" não pode ser reiniciada.`);
  }

  // Delete broken server row so provisionServerAsync starts fresh
  await supabase
    .from("dathost_servers")
    .delete()
    .eq("match_id", matchId)
    .in("status", ["error", "reserving"]);

  const { mapName, mapId } = await resolveMatchMap(matchId);
  await provisionServerAsync(matchId, match.team1_id, match.team2_id, mapName, mapId);
}
