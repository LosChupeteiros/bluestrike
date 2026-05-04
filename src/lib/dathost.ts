// Dathost CS2 Match API client
// Basic auth: USERBLUE / PASSBLUE env vars

const DATHOST_BASE = "https://dathost.net/api/0.1";

function dathostAuth(): string {
  const user = process.env.USERBLUE ?? "";
  const pass = process.env.PASSBLUE ?? "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

// ── Logging ───────────────────────────────────────────────────────────────────

type LogEntry = {
  matchId?: string | null;
  method: string;
  url: string;
  requestBody?: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  errorMessage?: string;
};

export async function writeDathostLog(entry: LogEntry): Promise<void> {
  if (!entry.matchId) return;
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
    await createSupabaseAdminClient()
      .from("dathost_api_logs")
      .insert({
        match_id: entry.matchId,
        method: entry.method,
        url: entry.url,
        request_body: entry.requestBody ? JSON.parse(JSON.stringify(entry.requestBody)) : null,
        response_status: entry.responseStatus ?? null,
        response_body: entry.responseBody ? JSON.parse(JSON.stringify(entry.responseBody)) : null,
        error_message: entry.errorMessage ?? null,
      });
  } catch {
    // Never let logging break the flow
  }
}

// ── HTTP ──────────────────────────────────────────────────────────────────────

async function dathostFetch<T>(
  path: string,
  options: RequestInit & { matchId?: string | null } = {}
): Promise<T> {
  const { matchId, ...fetchOptions } = options;
  const fullUrl = `${DATHOST_BASE}${path}`;
  const method = (fetchOptions.method ?? "GET").toUpperCase();
  let requestBody: unknown;
  if (fetchOptions.body && typeof fetchOptions.body === "string") {
    try { requestBody = JSON.parse(fetchOptions.body); } catch { requestBody = fetchOptions.body; }
  }

  const res = await fetch(fullUrl, {
    ...fetchOptions,
    headers: {
      Authorization: dathostAuth(),
      "Content-Type": "application/json",
      ...(fetchOptions.headers ?? {}),
    },
  });

  let responseBody: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  const rawText = await res.text();
  try {
    responseBody = contentType.includes("json") ? JSON.parse(rawText) : rawText;
  } catch {
    responseBody = rawText;
  }

  await writeDathostLog({
    matchId,
    method,
    url: fullUrl,
    requestBody,
    responseStatus: res.status,
    responseBody,
  });

  if (!res.ok) {
    throw new Error(`Dathost ${method} ${path} → ${res.status}: ${rawText}`);
  }

  return responseBody as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DathostGameServer {
  id: string;
  name: string;
  ip: string | null;
  raw_ip: string | null;
  ports: {
    game: number | null;
    gotv?: number | null;
  };
  location: string;
  game: string;
  on: boolean;
  booting: boolean;
  match_id: string | null; // Dathost CS2-match ID currently on this server
  players_online: number;
}

// POST /cs2-matches — request body matching actual Dathost API
export interface DathostCs2MatchSettings {
  game_server_id: string;
  team1: { name: string; flag?: string };
  team2: { name: string; flag?: string };
  players?: Array<{
    steam_id_64: string;
    team: "team1" | "team2";
    nickname_override?: string;
  }>;
  settings: {
    map: string;           // e.g. "de_mirage"
    enable_plugin?: boolean;
    enable_tech_pause?: boolean;
    wait_for_gotv?: boolean;
    match_begin_countdown?: number;
    connect_time?: number;
    password?: string;
  };
  webhooks?: {
    event_url?: string;
    authorization_header?: string;
    enabled_events?: string[];
  };
}

export interface DathostCs2Match {
  id: string;
  game_server_id: string;
  finished: boolean;
  cancel_reason: string | null;
  team1: { name: string; stats?: { score: number } };
  team2: { name: string; stats?: { score: number } };
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function listGameServers(matchId?: string | null): Promise<DathostGameServer[]> {
  return dathostFetch<DathostGameServer[]>("/game-servers", { matchId });
}

export async function getGameServer(serverId: string, matchId?: string | null): Promise<DathostGameServer> {
  return dathostFetch<DathostGameServer>(`/game-servers/${serverId}`, { matchId });
}

export async function createCs2Match(
  settings: DathostCs2MatchSettings,
  matchId?: string | null
): Promise<DathostCs2Match> {
  return dathostFetch<DathostCs2Match>("/cs2-matches", {
    method: "POST",
    body: JSON.stringify(settings),
    matchId,
  });
}

// Sends a console command to a game server (multipart/form-data, not JSON).
export async function sendConsoleCommand(
  serverId: string,
  command: string,
  matchId?: string | null
): Promise<void> {
  const url = `${DATHOST_BASE}/game-servers/${serverId}/console`;
  const body = new FormData();
  body.append("line", command);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: dathostAuth() },
    body,
  });

  await writeDathostLog({
    matchId,
    method: "POST",
    url,
    requestBody: { line: command },
    responseStatus: res.status,
    responseBody: res.status !== 200 ? await res.text().catch(() => null) : undefined,
  });
}

// Returns first CS2 server with no active match, not booting, and not already reserved.
export async function findAvailableServer(
  matchId?: string | null,
  excludeServerIds?: Set<string>
): Promise<DathostGameServer | null> {
  const servers = await listGameServers(matchId);
  return (
    servers.find(
      (s) =>
        s.game === "cs2" &&
        !s.booting &&
        s.match_id === null &&
        !(excludeServerIds?.has(s.id))
    ) ?? null
  );
}
