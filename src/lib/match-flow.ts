// Match flow orchestration: ready-up → veto → provision server
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import type { MapVeto } from "@/types";
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
  if (match.status !== "pending") return { ok: false, error: "Essa partida não aceita check-in agora." };

  const isTeam1 = requestingTeamId === match.team1_id;
  const isTeam2 = requestingTeamId === match.team2_id;
  if (!isTeam1 && !isTeam2) return { ok: false, error: "Você não faz parte dessa partida." };

  const update: Partial<{ ready_team1: boolean; ready_team2: boolean; status: string }> = {};
  if (isTeam1) update.ready_team1 = true;
  if (isTeam2) update.ready_team2 = true;

  const bothReady =
    (isTeam1 ? true : match.ready_team1) &&
    (isTeam2 ? true : match.ready_team2);

  if (bothReady) update.status = "veto";

  await supabase.from("matches").update(update).eq("id", matchId);

  return { ok: true, bothReady };
}

// Mark one team as WO — other team wins without playing
export async function applyWalkover(
  matchId: string,
  defaultingTeamId: string
): Promise<void> {
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

  // Advance bracket
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
  | { ok: true; done: boolean; pickedMaps: string[] }
  | { ok: false; error: string }
> {
  if (!CS2_MAP_POOL.find((m) => m.name === mapName)) {
    return { ok: false, error: "Mapa inválido." };
  }

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, team1_id, team2_id, status, bo_type")
    .eq("id", matchId)
    .maybeSingle<Pick<MatchRow, "id" | "team1_id" | "team2_id" | "status" | "bo_type">>();

  if (!match) return { ok: false, error: "Partida não encontrada." };
  if (match.status !== "veto") return { ok: false, error: "Veto não está ativo." };

  const isTeam1 = requestingTeamId === match.team1_id;
  const isTeam2 = requestingTeamId === match.team2_id;
  if (!isTeam1 && !isTeam2) return { ok: false, error: "Você não faz parte dessa partida." };

  // Fetch existing veto actions
  const { data: existing } = await supabase
    .from("map_vetoes")
    .select("*")
    .eq("match_id", matchId)
    .order("veto_order", { ascending: true })
    .returns<{
      id: string;
      match_id: string;
      team_id: string;
      action: string;
      map_name: string;
      veto_order: number;
      picked_side: string | null;
    }[]>();

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

  // Check map not already used
  const usedMaps = new Set(done.map((v) => v.map_name));
  if (usedMaps.has(mapName)) {
    return { ok: false, error: "Esse mapa já foi usado no veto." };
  }

  // Insert this veto action
  await supabase.from("map_vetoes").insert({
    match_id: matchId,
    team_id: requestingTeamId,
    action: slot.action,
    map_name: mapName,
    veto_order: currentStep + 1,
    picked_side: slot.action === "pick" ? (pickedSide ?? null) : null,
  });

  const isLastStep = currentStep + 1 >= sequence.length;

  // Determine picked maps so far
  const allVetoes = [...done, { action: slot.action, map_name: mapName }];
  const pickedMaps = allVetoes.filter((v) => v.action === "pick").map((v) => v.map_name);

  if (isLastStep) {
    // Find the remaining map (decider for BO1 / BO3)
    const allBanned = allVetoes.filter((v) => v.action === "ban").map((v) => v.map_name);
    const remaining = CS2_MAP_POOL.map((m) => m.name).find(
      (m) => !pickedMaps.includes(m) && !allBanned.includes(m)
    );
    if (remaining) pickedMaps.push(remaining);

    // Veto done → provision server
    await supabase.from("matches").update({ status: "pending" }).eq("id", matchId);
    provisionServerAsync(matchId, match.team1_id!, match.team2_id!, pickedMaps[0] ?? "Mirage").catch(
      (err: unknown) => console.error("[match-flow] provision error:", err)
    );
  }

  return { ok: true, done: isLastStep, pickedMaps };
}

// ── Server provisioning ───────────────────────────────────────────────────────

async function provisionServerAsync(
  matchId: string,
  team1Id: string,
  team2Id: string,
  mapName: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Lock server allocation in DB first (prevents race condition with concurrent provisions)
  const { data: existing } = await supabase
    .from("dathost_servers")
    .select("id")
    .eq("match_id", matchId)
    .maybeSingle<{ id: string }>();

  if (existing) return; // Already provisioned

  const server = await findAvailableServer();
  if (!server) {
    console.error(`[provision] No available CS2 server for match ${matchId}`);
    return;
  }

  // Fetch team names and player steam IDs
  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, name, tag")
    .in("id", [team1Id, team2Id])
    .returns<{ id: string; name: string; tag: string }[]>();

  const team1 = teamRows?.find((t) => t.id === team1Id);
  const team2 = teamRows?.find((t) => t.id === team2Id);

  // Get player steam IDs from team members
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

  const profileSteamMap = new Map((profiles ?? []).map((p) => [p.id, p.steam_id]));

  const players = (members ?? [])
    .filter((m) => profileSteamMap.has(m.profile_id))
    .map((m) => ({
      steam_id_64: profileSteamMap.get(m.profile_id)!,
      team: m.team_id === team1Id ? ("team1" as const) : ("team2" as const),
    }));

  // Generate server password
  const password = randomUUID().replace(/-/g, "").slice(0, 12);

  // Get match webhook info
  const { data: matchRow } = await supabase
    .from("matches")
    .select("webhook_secret")
    .eq("id", matchId)
    .maybeSingle<{ webhook_secret: string | null }>();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bluestrike.gg";
  const webhookUrl = `${base}/api/webhooks/cs2/${matchId}`;
  const authHeader = matchRow?.webhook_secret ? `Bearer ${matchRow.webhook_secret}` : undefined;

  // Create CS2 match on Dathost
  const dathostMatch = await createCs2Match({
    game_server_id: server.id,
    team1_name: team1?.name ?? "Time 1",
    team2_name: team2?.name ?? "Time 2",
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
  });

  // Fetch updated server info to get raw_ip
  const serverInfo = await getGameServer(server.id);
  const rawIp = serverInfo.raw_ip ?? server.ip;
  const port = server.ports.game;
  const connectString = `steam://connect/${rawIp}:${port}/${password}`;
  const gotvPort = server.ports.gotv;

  // Persist server record
  await supabase.from("dathost_servers").upsert(
    {
      match_id: matchId,
      dathost_id: dathostMatch.id,
      ip: rawIp,
      port,
      gotv_port: gotvPort ?? null,
      connect_string: connectString,
      rcon_password: "",
      raw_ip: rawIp,
      server_password: password,
      status: "provisioning",
    },
    { onConflict: "match_id" }
  );

  // Update match with Dathost match ID
  await supabase
    .from("matches")
    .update({ dathost_match_id: dathostMatch.id })
    .eq("id", matchId);
}
