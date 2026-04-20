// Dathost CS2 Match API client
// Basic auth: USERBLUE / PASSBLUE env vars

const DATHOST_BASE = "https://dathost.net/api/0.1";

function dathostAuth(): string {
  const user = process.env.USERBLUE ?? "";
  const pass = process.env.PASSBLUE ?? "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

async function dathostFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${DATHOST_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: dathostAuth(),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Dathost ${options.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DathostGameServer {
  id: string;
  name: string;
  ip: string;
  ports: {
    game: number;
    gotv?: number;
  };
  raw_ip: string;
  location: string;
  game: string;
  on: boolean;
  booting: boolean;
  status_text: string;
  players_online: number;
  cs2_settings?: {
    steam_game_server_login_token?: string;
  };
  match?: {
    id: string;
  } | null;
}

export interface DathostCs2MatchSettings {
  game_server_id: string;
  team1_name: string;
  team2_name: string;
  team1_flag?: string;
  team2_flag?: string;
  map: string;
  enable_knife_round?: boolean;
  enable_pause?: boolean;
  enable_ready?: boolean;
  message_prefix?: string;
  webhooks?: {
    event_url?: string;
    authorization_header?: string;
    enabled_events?: string[];
  };
  players?: Array<{
    steam_id_64: string;
    team: "team1" | "team2";
    nickname_override?: string;
  }>;
  game_server_settings?: {
    password?: string;
    [key: string]: unknown;
  };
}

export interface DathostCs2Match {
  id: string;
  game_server_id: string;
  map: string;
  finished: boolean;
  cancel_reason: string | null;
  team1: { name: string; stats: { score: number } };
  team2: { name: string; stats: { score: number } };
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function listGameServers(): Promise<DathostGameServer[]> {
  return dathostFetch<DathostGameServer[]>("/game-servers");
}

export async function getGameServer(serverId: string): Promise<DathostGameServer> {
  return dathostFetch<DathostGameServer>(`/game-servers/${serverId}`);
}

export async function createCs2Match(settings: DathostCs2MatchSettings): Promise<DathostCs2Match> {
  return dathostFetch<DathostCs2Match>("/cs2-matches", {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

// Returns first available server (not currently hosting a match, powered on)
export async function findAvailableServer(): Promise<DathostGameServer | null> {
  const servers = await listGameServers();
  return (
    servers.find(
      (s) => s.game === "cs2" && s.on && !s.booting && !s.match
    ) ?? null
  );
}
