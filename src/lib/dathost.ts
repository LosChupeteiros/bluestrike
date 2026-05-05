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

export async function pruneDathostLogsForMatch(
  matchId: string,
  options: { method?: string; urlLike?: string; keep?: number }
): Promise<void> {
  const keep = options.keep ?? 3;
  if (keep < 0) return;

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("dathost_api_logs")
      .select("id")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .range(keep, keep + 999);

    if (options.method) query = query.eq("method", options.method);
    if (options.urlLike) query = query.like("url", options.urlLike);

    const { data } = await query.returns<{ id: string }[]>();
    const ids = data?.map((row) => row.id) ?? [];
    if (ids.length) {
      await supabase.from("dathost_api_logs").delete().in("id", ids);
    }
  } catch {
    // Log pruning is best-effort and must not break match flow.
  }
}

export async function writeRollingDathostLog(
  entry: LogEntry,
  options: { urlLike: string; keep?: number }
): Promise<void> {
  await writeDathostLog(entry);
  if (!entry.matchId) return;
  await pruneDathostLogsForMatch(entry.matchId, {
    method: entry.method,
    urlLike: options.urlLike,
    keep: options.keep ?? 3,
  });
}

export async function clearDathostLogsForMatch(matchId: string): Promise<number> {
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
    const { count, error } = await createSupabaseAdminClient()
      .from("dathost_api_logs")
      .delete({ count: "exact" })
      .eq("match_id", matchId);
    if (error) {
      console.error(`[dathost/logs] failed to clear logs for ${matchId}:`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch {
    // Log cleanup is best-effort and must not break match finalization.
    return 0;
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

// ── Full match stats (GET /cs2-matches/{id}) ─────────────────────────────────

export interface DathostFullPlayerStats {
  kills: number;
  assists: number;
  deaths: number;
  mvps: number;
  score: number;
  "2ks": number;
  "3ks": number;
  "4ks": number;
  "5ks": number;
  kills_with_headshot: number;
  damage_dealt: number;
}

export interface DathostFullPlayer {
  steam_id_64: string;
  team: "team1" | "team2";
  nickname_override: string;
  connected: boolean;
  kicked: boolean;
  stats: DathostFullPlayerStats;
}

export interface DathostCs2MatchFull {
  id: string;
  game_server_id: string;
  team1: { name: string; stats: { score: number } };
  team2: { name: string; stats: { score: number } };
  players: DathostFullPlayer[];
  settings: { map: string };
  rounds_played: number;
  finished: boolean;
}

// ── Server duplication ────────────────────────────────────────────────────────

// Duplicates a mirror CS2 server and returns the new server info.
// Uses multipart/form-data (same pattern as sendConsoleCommand).
export async function duplicateServer(
  mirrorServerId: string,
  matchId?: string | null
): Promise<DathostGameServer> {
  const url = `${DATHOST_BASE}/game-servers/${mirrorServerId}/duplicate`;
  const body = new FormData();
  body.append("location", "sao_paulo");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: dathostAuth(), accept: "application/json" },
    body,
  });

  const rawText = await res.text();
  let responseBody: unknown;
  try { responseBody = JSON.parse(rawText); } catch { responseBody = rawText; }

  await writeDathostLog({
    matchId,
    method: "POST",
    url,
    requestBody: { mirror_server_id: mirrorServerId, location: "sao_paulo" },
    responseStatus: res.status,
    responseBody,
  });

  if (!res.ok) throw new Error(`Dathost duplicate → ${res.status}: ${rawText}`);
  return responseBody as DathostGameServer;
}

// Fetches full match data including all player stats.
export async function getCs2Match(
  dathostMatchId: string,
  matchId?: string | null
): Promise<DathostCs2MatchFull> {
  return dathostFetch<DathostCs2MatchFull>(`/cs2-matches/${dathostMatchId}`, { matchId });
}

// Stops a running game server.
export async function stopGameServer(serverId: string, matchId?: string | null): Promise<void> {
  await dathostFetch<unknown>(`/game-servers/${serverId}/stop`, { method: "POST", matchId });
}

// Permanently deletes a game server from Dathost.
export async function deleteGameServer(serverId: string, matchId?: string | null): Promise<void> {
  await dathostFetch<unknown>(`/game-servers/${serverId}`, { method: "DELETE", matchId });
}

// Starts a stopped game server. Uses multipart/form-data (Dathost requirement).
export async function startServer(serverId: string, matchId?: string | null): Promise<void> {
  const url = `${DATHOST_BASE}/game-servers/${serverId}/start`;
  const body = new FormData();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: dathostAuth() },
    body,
  });
  let responseBody: unknown;
  if (!res.ok) {
    responseBody = await res.text().catch(() => null);
  }
  await writeDathostLog({
    matchId,
    method: "POST",
    url,
    responseStatus: res.status,
    responseBody,
  });
  if (!res.ok) throw new Error(`Dathost start → ${res.status}: ${responseBody}`);
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
