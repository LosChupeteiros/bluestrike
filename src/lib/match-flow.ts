// Match flow: ready-up → veto → second ready → provision server
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { CS2_MAP_POOL, getVetoSequence } from "@/lib/maps";
import { findAvailableServer, createCs2Match, getGameServer } from "@/lib/dathost";

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
// Handles both phases:
//   - "pending"   → pre-veto ready  → when both ready: status = "veto"
//   - "pre_live"  → post-veto ready → when both ready: provision server + status = "live"

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
    if (match.status === "pending") {
      // Phase 1: both ready → start veto
      update.status = "veto";
    } else {
      // Phase 2: post-veto both ready → go live, provision server
      update.status = "live";
    }
    // Reset ready flags for next potential use
    update.ready_team1 = false;
    update.ready_team2 = false;
  }

  await supabase.from("matches").update(update).eq("id", matchId);

  if (bothReady && match.status === "pre_live") {
    // Fetch the decider map from vetoes
    const { data: vetoRows } = await supabase
      .from("map_vetoes")
      .select("action, map_name")
      .eq("match_id", matchId)
      .returns<{ action: string; map_name: string }[]>();

    const picks = (vetoRows ?? []).filter((v) => v.action === "pick").map((v) => v.map_name);
    const bans = new Set((vetoRows ?? []).filter((v) => v.action === "ban").map((v) => v.map_name));
    const decider = CS2_MAP_POOL.find((m) => !picks.includes(m.name) && !bans.has(m.name))?.name;
    const mapToPlay = picks[0] ?? decider ?? "Mirage";

    provisionServerAsync(matchId, match.team1_id!, match.team2_id!, mapToPlay).catch(
      (err: unknown) => console.error("[match-flow] provision error:", err)
    );
  }

  return { ok: true, bothReady };
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

  if (currentStep >= sequence.length) {
    return { ok: false, error: "Veto já finalizado." };
  }

  const slot = sequence[currentStep];
  const expectedTeam = slot.turn === "team1" ? match.team1_id : match.team2_id;

  if (requestingTeamId !== expectedTeam) {
    return { ok: false, error: "Não é a sua vez no veto." };
  }

  const usedMaps = new Set(done.map((v) => v.map_name));
  if (usedMaps.has(mapName)) {
    return { ok: false, error: "Esse mapa já foi usado no veto." };
  }

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
    // Veto complete → reset ready flags, move to pre_live (waiting for second ready)
    await supabase
      .from("matches")
      .update({ status: "pre_live", ready_team1: false, ready_team2: false })
      .eq("id", matchId);
  }

  return { ok: true, done: isLastStep, pickedMaps, decider };
}

// ── Server provisioning ───────────────────────────────────────────────────────

export async function provisionServerAsync(
  matchId: string,
  team1Id: string,
  team2Id: string,
  mapName: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Atomic lock — prevent double provisioning
  const { data: existing } = await supabase
    .from("dathost_servers")
    .select("id")
    .eq("match_id", matchId)
    .maybeSingle<{ id: string }>();

  if (existing) return;

  const server = await findAvailableServer(matchId);
  if (!server) {
    console.error(`[provision/${matchId}] No available CS2 server`);
    await supabase.from("dathost_api_logs").insert({
      match_id: matchId,
      method: "GET",
      url: "https://dathost.net/api/0.1/game-servers",
      error_message: "No available server found",
    });
    return;
  }

  // Team names
  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", [team1Id, team2Id])
    .returns<{ id: string; name: string }[]>();

  const team1Name = teamRows?.find((t) => t.id === team1Id)?.name ?? "Time 1";
  const team2Name = teamRows?.find((t) => t.id === team2Id)?.name ?? "Time 2";

  // Player steam IDs
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id, profile_id")
    .in("team_id", [team1Id, team2Id])
    .returns<{ team_id: string; profile_id: string }[]>();

  const profileIds = (members ?? []).map((m) => m.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, steam_id")
    .in("id", profileIds)
    .returns<{ id: string; steam_id: string }[]>();

  const steamById = new Map((profiles ?? []).map((p) => [p.id, p.steam_id]));
  const players = (members ?? [])
    .filter((m) => steamById.has(m.profile_id))
    .map((m) => ({
      steam_id_64: steamById.get(m.profile_id)!,
      team: (m.team_id === team1Id ? "team1" : "team2") as "team1" | "team2",
    }));

  // Webhook info
  const { data: matchRow } = await supabase
    .from("matches")
    .select("webhook_secret")
    .eq("id", matchId)
    .maybeSingle<{ webhook_secret: string | null }>();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bluestrike.gg";
  const webhookUrl = `${base}/api/webhooks/cs2/${matchId}`;
  const authHeader = matchRow?.webhook_secret ? `Bearer ${matchRow.webhook_secret}` : undefined;

  const password = randomUUID().replace(/-/g, "").slice(0, 12);

  // Create Dathost match
  const dathostMatch = await createCs2Match(
    {
      game_server_id: server.id,
      team1_name: team1Name,
      team2_name: team2Name,
      map: mapName,
      enable_knife_round: true,
      enable_pause: true,
      players,
      game_server_settings: { password },
      webhooks: authHeader
        ? {
            event_url: webhookUrl,
            authorization_header: authHeader,
            enabled_events: ["match_started", "match_ended", "match_canceled", "round_end"],
          }
        : undefined,
    },
    matchId
  );

  // Get final server info (raw_ip)
  const serverInfo = await getGameServer(server.id, matchId);
  const rawIp = serverInfo.raw_ip ?? server.ip;
  const port = server.ports.game;
  const gotvPort = server.ports.gotv ?? null;
  const connectString = `steam://connect/${rawIp}:${port}/${password}`;

  // Save server record
  await supabase.from("dathost_servers").upsert(
    {
      match_id: matchId,
      dathost_id: dathostMatch.id,
      ip: rawIp,
      port,
      gotv_port: gotvPort,
      connect_string: connectString,
      rcon_password: "",
      raw_ip: rawIp,
      server_password: password,
      status: "provisioning",
    },
    { onConflict: "match_id" }
  );

  await supabase
    .from("matches")
    .update({ dathost_match_id: dathostMatch.id })
    .eq("id", matchId);
}
