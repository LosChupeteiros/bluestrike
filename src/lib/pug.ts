// Pickup / Captains Draft lobby ("/chupeteiromestre")
// Subsistema autocontido de pug/mix caseiro: presença → sorteio de capitães →
// draft alternado → ready → veto MD3 → escolha de lados → sobe servidor DatHost.
// Casual: NÃO escreve em matches/teams, não mexe em ELO nem coleta stats.
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CS2_MAP_POOL, getVetoSequence } from "@/lib/maps";
import {
  duplicateServer, startServer, getGameServer,
  sendConsoleCommand, stopGameServer, deleteGameServer,
} from "@/lib/dathost";

// Mirror server clonado para cada partida (mesmo do fluxo de torneio).
const MIRROR_SERVER_ID = process.env.DATHOST_MIRROR_SERVER_ID ?? "69f7f5303ee4ac03506ae4c1";
// Janela em que um jogador é considerado "presente" na sala de espera.
const PRESENCE_WINDOW_MS = 12_000;

type Side = "a" | "b";

// ── Row types (snake_case do banco) ─────────────────────────────────────────
interface LobbyRow {
  id: string;
  status: string;
  bo_type: number;
  captain_a: string | null;
  captain_b: string | null;
  first_pick: Side | null;
  pick_turn: Side | null;
  ready_a: boolean;
  ready_b: boolean;
  matchzy_match_id: number | null;
  dathost_server_id: string | null;
  server_ip: string | null;
  server_port: number | null;
  gotv_port: number | null;
  server_password: string | null;
  connect_string: string | null;
  server_status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface PlayerRow {
  id: string;
  lobby_id: string;
  profile_id: string;
  team: Side | null;
  pick_order: number | null;
  is_captain: boolean;
  last_seen: string;
  joined_at: string;
}

interface VetoRow {
  id: string;
  team: Side;
  action: "ban" | "pick";
  map_name: string;
  veto_order: number;
  picked_side: "ct" | "t" | null;
}

// ── Client-facing state ──────────────────────────────────────────────────────
export interface PugPlayer {
  profileId: string;
  publicId: number;
  persona: string;
  avatarUrl: string | null;
  elo: number;
  team: Side | null;
  pickOrder: number | null;
  isCaptain: boolean;
  present: boolean;
}

export interface PugVeto {
  id: string;
  team: Side;
  action: "ban" | "pick";
  mapName: string;
  vetoOrder: number;
  pickedSide: "ct" | "t" | null;
}

export type PugRole =
  | "spectator" | "captain_a" | "captain_b" | "player_a" | "player_b" | "pool";

export interface PugLobbyState {
  lobby: {
    id: string;
    status: string;
    boType: number;
    captainA: string | null;
    captainB: string | null;
    firstPick: Side | null;
    pickTurn: Side | null;
    readyA: boolean;
    readyB: boolean;
    server: {
      status: string | null;
      ip: string | null;
      port: number | null;
      gotvPort: number | null;
      connectString: string | null;
      password: string | null;
    } | null;
  };
  players: PugPlayer[];
  vetoes: PugVeto[];
  me: {
    profileId: string | null;
    isAdmin: boolean;
    role: PugRole;
    team: Side | null;
    isCaptain: boolean;
  };
}

type Ok<T = object> = { ok: true } & T;
type Err = { ok: false; error: string };

function fresh(lastSeen: string): boolean {
  return Date.now() - new Date(lastSeen).getTime() < PRESENCE_WINDOW_MS;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Supa = ReturnType<typeof createSupabaseAdminClient>;

// ── Active lobby (single global, auto-created) ───────────────────────────────
async function fetchActiveLobby(supabase: Supa): Promise<LobbyRow | null> {
  const { data } = await supabase
    .from("pug_lobbies")
    .select("*")
    .neq("status", "terminated")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<LobbyRow>();
  return data ?? null;
}

async function getOrCreateActiveLobby(supabase: Supa, createdBy?: string | null): Promise<LobbyRow> {
  const existing = await fetchActiveLobby(supabase);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("pug_lobbies")
    .insert({ status: "gathering", created_by: createdBy ?? null })
    .select("*")
    .single<LobbyRow>();

  if (error || !data) {
    // Corrida no índice único de sala ativa — re-seleciona o vencedor.
    const again = await fetchActiveLobby(supabase);
    if (again) return again;
    throw new Error(`Falha ao criar lobby de pug: ${error?.message ?? "desconhecido"}`);
  }
  return data;
}

// ── State (read) ─────────────────────────────────────────────────────────────
export async function getLobbyState(
  profileId: string | null,
  isAdmin: boolean
): Promise<PugLobbyState> {
  const supabase = createSupabaseAdminClient();
  const lobby = await getOrCreateActiveLobby(supabase, profileId);

  const { data: playerRows } = await supabase
    .from("pug_lobby_players")
    .select("id, lobby_id, profile_id, team, pick_order, is_captain, last_seen, joined_at")
    .eq("lobby_id", lobby.id)
    .returns<PlayerRow[]>();

  const rows = playerRows ?? [];
  const profileIds = rows.map((r) => r.profile_id);

  const profileMap = new Map<string, { public_id: number; steam_persona_name: string | null; steam_avatar_url: string | null; elo: number | null }>();
  if (profileIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, public_id, steam_persona_name, steam_avatar_url, elo")
      .in("id", profileIds)
      .returns<{ id: string; public_id: number; steam_persona_name: string | null; steam_avatar_url: string | null; elo: number | null }[]>();
    for (const p of profs ?? []) profileMap.set(p.id, p);
  }

  const inGathering = lobby.status === "gathering";
  const players: PugPlayer[] = rows
    .map((r) => {
      const p = profileMap.get(r.profile_id);
      const present = fresh(r.last_seen);
      return {
        profileId: r.profile_id,
        publicId: p?.public_id ?? 0,
        persona: p?.steam_persona_name ?? "Jogador",
        avatarUrl: p?.steam_avatar_url ?? null,
        elo: p?.elo ?? 1000,
        team: r.team,
        pickOrder: r.pick_order,
        isCaptain: r.is_captain,
        present,
      };
    })
    // Na sala de espera só listamos quem está presente; depois do sorteio,
    // todos os draftados aparecem (presença vira apenas um indicador).
    .filter((p) => (inGathering ? p.present : true))
    .sort((a, b) => (a.pickOrder ?? 99) - (b.pickOrder ?? 99));

  const { data: vetoRows } = await supabase
    .from("pug_vetoes")
    .select("id, team, action, map_name, veto_order, picked_side")
    .eq("lobby_id", lobby.id)
    .order("veto_order", { ascending: true })
    .returns<VetoRow[]>();

  const vetoes: PugVeto[] = (vetoRows ?? []).map((v) => ({
    id: v.id,
    team: v.team,
    action: v.action,
    mapName: v.map_name,
    vetoOrder: v.veto_order,
    pickedSide: v.picked_side,
  }));

  // Papel do usuário atual
  let role: PugRole = "spectator";
  let myTeam: Side | null = null;
  let isCaptain = false;
  if (profileId) {
    if (profileId === lobby.captain_a) { role = "captain_a"; myTeam = "a"; isCaptain = true; }
    else if (profileId === lobby.captain_b) { role = "captain_b"; myTeam = "b"; isCaptain = true; }
    else {
      const mine = rows.find((r) => r.profile_id === profileId);
      if (mine?.team === "a") { role = "player_a"; myTeam = "a"; }
      else if (mine?.team === "b") { role = "player_b"; myTeam = "b"; }
      else if (mine) { role = "pool"; }
    }
  }

  const hasServer = Boolean(lobby.server_status || lobby.dathost_server_id);

  return {
    lobby: {
      id: lobby.id,
      status: lobby.status,
      boType: lobby.bo_type,
      captainA: lobby.captain_a,
      captainB: lobby.captain_b,
      firstPick: lobby.first_pick,
      pickTurn: lobby.pick_turn,
      readyA: lobby.ready_a,
      readyB: lobby.ready_b,
      server: hasServer
        ? {
            status: lobby.server_status,
            ip: lobby.server_ip,
            port: lobby.server_port,
            gotvPort: lobby.gotv_port,
            connectString: lobby.connect_string,
            password: lobby.server_password,
          }
        : null,
    },
    players,
    vetoes,
    me: { profileId, isAdmin, role, team: myTeam, isCaptain },
  };
}

// ── Presence heartbeat ───────────────────────────────────────────────────────
export async function heartbeat(profileId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const lobby = await getOrCreateActiveLobby(supabase, profileId);

  const { data: existing } = await supabase
    .from("pug_lobby_players")
    .select("id")
    .eq("lobby_id", lobby.id)
    .eq("profile_id", profileId)
    .maybeSingle<{ id: string }>();

  if (existing) {
    await supabase
      .from("pug_lobby_players")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", existing.id);
  } else if (lobby.status === "gathering") {
    await supabase
      .from("pug_lobby_players")
      .insert({ lobby_id: lobby.id, profile_id: profileId });
  }
}

// ── Sortear capitães e iniciar o draft (admin) ───────────────────────────────
export async function startDraft(boType: 1 | 3 = 3): Promise<Ok | Err> {
  const supabase = createSupabaseAdminClient();
  const lobby = await getOrCreateActiveLobby(supabase);
  if (lobby.status !== "gathering") {
    return { ok: false, error: "O draft já foi iniciado." };
  }

  const { data: playerRows } = await supabase
    .from("pug_lobby_players")
    .select("id, profile_id, last_seen")
    .eq("lobby_id", lobby.id)
    .returns<{ id: string; profile_id: string; last_seen: string }[]>();

  const present = (playerRows ?? []).filter((r) => fresh(r.last_seen));
  if (present.length < 2) {
    return { ok: false, error: "É preciso pelo menos 2 jogadores presentes." };
  }

  // Remove quem saiu (não está presente) antes de sortear.
  const staleIds = (playerRows ?? []).filter((r) => !fresh(r.last_seen)).map((r) => r.id);
  if (staleIds.length) {
    await supabase.from("pug_lobby_players").delete().in("id", staleIds);
  }

  const shuffled = shuffle(present);
  const capA = shuffled[0];
  const capB = shuffled[1];

  await supabase.from("pug_lobby_players")
    .update({ team: "a", is_captain: true, pick_order: 0 }).eq("id", capA.id);
  await supabase.from("pug_lobby_players")
    .update({ team: "b", is_captain: true, pick_order: 0 }).eq("id", capB.id);

  const poolCount = present.length - 2;
  const firstPick: Side = Math.random() < 0.5 ? "a" : "b";

  await supabase.from("pug_lobbies").update({
    bo_type: boType,
    captain_a: capA.profile_id,
    captain_b: capB.profile_id,
    first_pick: firstPick,
    pick_turn: poolCount > 0 ? firstPick : null,
    status: poolCount > 0 ? "drafting" : "ready_check",
    updated_at: new Date().toISOString(),
  }).eq("id", lobby.id);

  return { ok: true };
}

// ── Capitão escolhe um jogador do pool ───────────────────────────────────────
export async function pickPlayer(captainProfileId: string, targetProfileId: string): Promise<Ok | Err> {
  const supabase = createSupabaseAdminClient();
  const lobby = await getOrCreateActiveLobby(supabase);
  if (lobby.status !== "drafting") return { ok: false, error: "O draft não está ativo." };

  const callerTeam: Side | null =
    captainProfileId === lobby.captain_a ? "a"
    : captainProfileId === lobby.captain_b ? "b"
    : null;
  if (!callerTeam) return { ok: false, error: "Apenas os capitães podem escolher." };
  if (lobby.pick_turn !== callerTeam) return { ok: false, error: "Não é a sua vez de escolher." };

  const { data: rows } = await supabase
    .from("pug_lobby_players")
    .select("id, profile_id, team, pick_order")
    .eq("lobby_id", lobby.id)
    .returns<{ id: string; profile_id: string; team: Side | null; pick_order: number | null }[]>();

  const all = rows ?? [];
  const target = all.find((r) => r.profile_id === targetProfileId);
  if (!target) return { ok: false, error: "Jogador não está na sala." };
  if (target.team !== null) return { ok: false, error: "Esse jogador já foi escolhido." };

  const maxOrder = Math.max(0, ...all.map((r) => r.pick_order ?? 0));
  await supabase.from("pug_lobby_players")
    .update({ team: callerTeam, pick_order: maxOrder + 1 })
    .eq("id", target.id);

  const remainingPool = all.filter((r) => r.team === null && r.profile_id !== targetProfileId).length;
  const nextTurn: Side = callerTeam === "a" ? "b" : "a";

  await supabase.from("pug_lobbies").update({
    pick_turn: remainingPool > 0 ? nextTurn : null,
    status: remainingPool > 0 ? "drafting" : "ready_check",
    updated_at: new Date().toISOString(),
  }).eq("id", lobby.id);

  return { ok: true };
}

// ── Ready-check dos capitães ────────────────────────────────────────────────
export async function readyUp(captainProfileId: string): Promise<Ok<{ bothReady: boolean }> | Err> {
  const supabase = createSupabaseAdminClient();
  const lobby = await getOrCreateActiveLobby(supabase);
  if (lobby.status !== "ready_check") return { ok: false, error: "Não é hora do ready." };

  const callerTeam: Side | null =
    captainProfileId === lobby.captain_a ? "a"
    : captainProfileId === lobby.captain_b ? "b"
    : null;
  if (!callerTeam) return { ok: false, error: "Apenas os capitães dão ready." };

  const update: Partial<LobbyRow> = { updated_at: new Date().toISOString() };
  if (callerTeam === "a") update.ready_a = true;
  else update.ready_b = true;

  const bothReady =
    (callerTeam === "a" ? true : lobby.ready_a) &&
    (callerTeam === "b" ? true : lobby.ready_b);

  if (bothReady) update.status = "veto";

  await supabase.from("pug_lobbies").update(update).eq("id", lobby.id);
  return { ok: true, bothReady };
}

// ── Veto MD3 (ban ban pick pick ban ban) ─────────────────────────────────────
export async function submitVeto(captainProfileId: string, mapName: string): Promise<Ok<{ done: boolean }> | Err> {
  if (!CS2_MAP_POOL.find((m) => m.name === mapName)) return { ok: false, error: "Mapa inválido." };

  const supabase = createSupabaseAdminClient();
  const lobby = await getOrCreateActiveLobby(supabase);
  if (lobby.status !== "veto") return { ok: false, error: "O veto não está ativo." };

  const callerTeam: Side | null =
    captainProfileId === lobby.captain_a ? "a"
    : captainProfileId === lobby.captain_b ? "b"
    : null;
  if (!callerTeam) return { ok: false, error: "Apenas os capitães vetam." };

  const { data: existing } = await supabase
    .from("pug_vetoes")
    .select("action, map_name, veto_order")
    .eq("lobby_id", lobby.id)
    .order("veto_order", { ascending: true })
    .returns<{ action: string; map_name: string; veto_order: number }[]>();

  const done = existing ?? [];
  const sequence = getVetoSequence(lobby.bo_type as 1 | 3);
  const currentStep = done.length;
  if (currentStep >= sequence.length) return { ok: false, error: "Veto já finalizado." };

  const slot = sequence[currentStep];
  const expectedTeam: Side = slot.turn === "team1" ? "a" : "b";
  if (callerTeam !== expectedTeam) return { ok: false, error: "Não é a sua vez no veto." };

  if (done.some((v) => v.map_name === mapName)) {
    return { ok: false, error: "Esse mapa já foi usado." };
  }

  await supabase.from("pug_vetoes").insert({
    lobby_id: lobby.id,
    team: callerTeam,
    action: slot.action,
    map_name: mapName,
    veto_order: currentStep + 1,
  });

  const isLast = currentStep + 1 >= sequence.length;
  if (isLast) {
    const hasPicks = [...done, { action: slot.action }].some((v) => v.action === "pick");
    if (hasPicks) {
      await supabase.from("pug_lobbies")
        .update({ status: "side_pick", updated_at: new Date().toISOString() })
        .eq("id", lobby.id);
    } else {
      // Sem picks (não acontece em BO3) — sobe direto.
      await supabase.from("pug_lobbies")
        .update({ status: "provisioning", updated_at: new Date().toISOString() })
        .eq("id", lobby.id);
      provisionPugServerAsync(lobby.id).catch((e) => console.error("[pug] provision:", e));
    }
  }

  return { ok: true, done: isLast };
}

// ── Escolha de lado pelo adversário de cada pick ─────────────────────────────
export async function submitSide(captainProfileId: string, vetoId: string, side: "ct" | "t"): Promise<Ok<{ done: boolean }> | Err> {
  if (side !== "ct" && side !== "t") return { ok: false, error: "Lado inválido." };

  const supabase = createSupabaseAdminClient();
  const lobby = await getOrCreateActiveLobby(supabase);
  if (lobby.status !== "side_pick") return { ok: false, error: "A escolha de lados não está ativa." };

  const callerTeam: Side | null =
    captainProfileId === lobby.captain_a ? "a"
    : captainProfileId === lobby.captain_b ? "b"
    : null;
  if (!callerTeam) return { ok: false, error: "Apenas os capitães escolhem o lado." };

  const { data: vetoes } = await supabase
    .from("pug_vetoes")
    .select("id, team, action, picked_side")
    .eq("lobby_id", lobby.id)
    .returns<{ id: string; team: Side; action: string; picked_side: "ct" | "t" | null }[]>();

  const all = vetoes ?? [];
  const target = all.find((v) => v.id === vetoId && v.action === "pick");
  if (!target) return { ok: false, error: "Pick não encontrado." };

  const chooserTeam: Side = target.team === "a" ? "b" : "a";
  if (callerTeam !== chooserTeam) {
    return { ok: false, error: "Esse lado deve ser escolhido pelo adversário do pick." };
  }

  await supabase.from("pug_vetoes").update({ picked_side: side }).eq("id", vetoId);

  const picks = all.filter((v) => v.action === "pick");
  const doneSides = picks.every((v) => (v.id === vetoId ? true : Boolean(v.picked_side)));

  if (doneSides) {
    await supabase.from("pug_lobbies")
      .update({ status: "provisioning", updated_at: new Date().toISOString() })
      .eq("id", lobby.id);
    provisionPugServerAsync(lobby.id).catch((e) => console.error("[pug] provision:", e));
  }

  return { ok: true, done: doneSides };
}

// ── Provisionamento do servidor DatHost ──────────────────────────────────────
// Espelha provisionServerAsync, mas grava nas colunas de pug_lobbies e passa
// matchId=null às chamadas DatHost (log desativado — evita FK em dathost_api_logs).
export async function provisionPugServerAsync(lobbyId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: lobby } = await supabase
    .from("pug_lobbies")
    .select("server_status, dathost_server_id")
    .eq("id", lobbyId)
    .maybeSingle<{ server_status: string | null; dathost_server_id: string | null }>();
  if (!lobby) return;

  // Já provisionado / em progresso? Só refaz se erro ou ainda não começou.
  if (lobby.server_status && lobby.server_status !== "error") return;

  await supabase.from("pug_lobbies").update({ server_status: "reserving" }).eq("id", lobbyId);

  let server: Awaited<ReturnType<typeof duplicateServer>>;
  try {
    server = await duplicateServer(MIRROR_SERVER_ID, null);
  } catch (err) {
    console.error(`[pug/${lobbyId}] duplicateServer falhou:`, err instanceof Error ? err.message : err);
    await supabase.from("pug_lobbies").update({ status: "error", server_status: "error" }).eq("id", lobbyId);
    return;
  }

  const port = server.ports.game ?? 27015;
  const gotvPort = server.ports.gotv ?? null;
  const password = randomUUID().replace(/-/g, "").slice(0, 12);
  const ipStr = server.ip ?? server.raw_ip ?? "";
  const matchzyMatchId = Math.floor(Date.now() / 1000);

  await supabase.from("pug_lobbies").update({
    dathost_server_id: server.id,
    server_ip: ipStr,
    server_port: port,
    gotv_port: gotvPort,
    server_password: password,
    matchzy_match_id: matchzyMatchId,
    connect_string: `steam://connect/${ipStr}:${port}/${password}`,
    server_status: "provisioning",
  }).eq("id", lobbyId);

  try {
    await startServer(server.id, null);
  } catch (err) {
    console.error(`[pug/${lobbyId}] startServer falhou:`, err instanceof Error ? err.message : err);
    await supabase.from("pug_lobbies").update({ status: "error", server_status: "error" }).eq("id", lobbyId);
    return;
  }

  let online = false;
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    const info = await getGameServer(server.id, null).catch(() => null);
    if (info?.on && !info.booting) { online = true; break; }
  }
  if (!online) {
    console.error(`[pug/${lobbyId}] servidor não ficou online após 60s`);
    await supabase.from("pug_lobbies").update({ status: "error", server_status: "error" }).eq("id", lobbyId);
    return;
  }

  const confirmed = await getGameServer(server.id, null).catch(() => server);
  const confirmedIp = confirmed.raw_ip ?? confirmed.ip ?? ipStr;
  await supabase.from("pug_lobbies").update({
    server_ip: confirmedIp,
    connect_string: `steam://connect/${confirmedIp}:${port}/${password}`,
    server_status: "ready",
  }).eq("id", lobbyId);

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bluestrike.com.br";
  const configUrl = `${base}/api/chupeteiromestre/${lobbyId}/matchzy-config`;
  await sendConsoleCommand(server.id, `matchzy_loadmatch_url "${configUrl}"`, null);

  await supabase.from("pug_lobbies").update({ status: "live", server_status: "live" }).eq("id", lobbyId);

  console.log(`[pug/${lobbyId}] OK — matchzy_match_id: ${matchzyMatchId}, server: ${server.id}, ip: ${confirmedIp}:${port}`);
}

// ── Encerrar / novo draft (admin) ────────────────────────────────────────────
export async function endLobby(): Promise<Ok | Err> {
  const supabase = createSupabaseAdminClient();
  const lobby = await fetchActiveLobby(supabase);
  if (!lobby) return { ok: true }; // nada ativo — próximo /state cria uma nova

  if (lobby.dathost_server_id) {
    await stopGameServer(lobby.dathost_server_id, null).catch(() => {});
    await deleteGameServer(lobby.dathost_server_id, null).catch(() => {});
  }

  await supabase.from("pug_lobbies")
    .update({ status: "terminated", server_status: "terminated", updated_at: new Date().toISOString() })
    .eq("id", lobby.id);

  return { ok: true };
}

// ── MatchZy config (chamado pelo servidor via matchzy_loadmatch_url) ──────────
export async function buildMatchzyConfig(lobbyId: string): Promise<Record<string, unknown> | null> {
  const supabase = createSupabaseAdminClient();

  const { data: lobby } = await supabase
    .from("pug_lobbies")
    .select("id, captain_a, captain_b, matchzy_match_id, bo_type")
    .eq("id", lobbyId)
    .maybeSingle<{ id: string; captain_a: string | null; captain_b: string | null; matchzy_match_id: number | null; bo_type: number }>();
  if (!lobby) return null;

  const { data: rows } = await supabase
    .from("pug_lobby_players")
    .select("profile_id, team")
    .eq("lobby_id", lobbyId)
    .not("team", "is", null)
    .returns<{ profile_id: string; team: Side }[]>();

  const players = rows ?? [];
  const profileIds = players.map((p) => p.profile_id);

  const profileMap = new Map<string, { steam_id: string | null; steam_persona_name: string | null }>();
  if (profileIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, steam_id, steam_persona_name")
      .in("id", profileIds)
      .returns<{ id: string; steam_id: string | null; steam_persona_name: string | null }[]>();
    for (const p of profs ?? []) profileMap.set(p.id, p);
  }

  const team1Players: Record<string, string> = {};
  const team2Players: Record<string, string> = {};
  for (const pl of players) {
    const prof = profileMap.get(pl.profile_id);
    if (!prof?.steam_id) continue;
    const nick = prof.steam_persona_name ?? prof.steam_id;
    if (pl.team === "a") team1Players[prof.steam_id] = nick;
    else team2Players[prof.steam_id] = nick;
  }

  const team1Name = profileMap.get(lobby.captain_a ?? "")?.steam_persona_name ?? "Time A";
  const team2Name = profileMap.get(lobby.captain_b ?? "")?.steam_persona_name ?? "Time B";

  const { data: vetoRows } = await supabase
    .from("pug_vetoes")
    .select("team, action, map_name, veto_order, picked_side")
    .eq("lobby_id", lobbyId)
    .order("veto_order", { ascending: true })
    .returns<VetoRow[]>();

  const vetoes = vetoRows ?? [];
  const picks = vetoes.filter((v) => v.action === "pick");
  const banned = new Set(vetoes.filter((v) => v.action === "ban").map((v) => v.map_name));
  const pickedNames = picks.map((v) => v.map_name);
  const deciderEntry = CS2_MAP_POOL.find((m) => !pickedNames.includes(m.name) && !banned.has(m.name));

  const maplist: string[] = [];
  const mapSides: string[] = [];
  for (const pick of picks) {
    const entry = CS2_MAP_POOL.find((m) => m.name === pick.map_name);
    maplist.push(entry?.mapId ?? pick.map_name);
    if (!pick.picked_side) {
      mapSides.push("knife");
    } else {
      // team a = team1; o adversário do pick escolhe o lado.
      const pickerIsTeam1 = pick.team === "a";
      const sideChooserIsTeam1 = !pickerIsTeam1;
      if (pick.picked_side === "ct") mapSides.push(sideChooserIsTeam1 ? "team1_ct" : "team2_ct");
      else mapSides.push(sideChooserIsTeam1 ? "team2_ct" : "team1_ct");
    }
  }
  if (deciderEntry) { maplist.push(deciderEntry.mapId); mapSides.push("knife"); }
  if (maplist.length === 0) { maplist.push("de_mirage"); mapSides.push("knife"); }

  return {
    matchid: lobby.matchzy_match_id,
    team1: { name: team1Name, players: team1Players },
    team2: { name: team2Name, players: team2Players },
    num_maps: lobby.bo_type,
    maplist,
    map_sides: mapSides,
    clinch_series: true,
    players_per_team: Math.max(Object.keys(team1Players).length, Object.keys(team2Players).length),
    cvars: { hostname: `BlueStrike Pug: ${team1Name} vs ${team2Name}` },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
