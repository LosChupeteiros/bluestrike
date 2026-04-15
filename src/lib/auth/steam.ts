const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const DEFAULT_POST_LOGIN_PATH = "/profile";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

interface SteamPlayerSummaryResponse {
  response?: {
    players?: Array<{
      steamid: string;
      personaname: string;
      profileurl?: string;
      avatarfull?: string;
      avatarmedium?: string;
    }>;
  };
}

interface SteamLevelResponse {
  response?: {
    player_level?: number;
  };
}

export interface SteamAccount {
  steamId: string;
  steamPersonaName: string;
  steamAvatarUrl: string | null;
  steamProfileUrl: string | null;
  steamLevel: number;
}

function getConfiguredAppOrigin() {
  const configuredOrigin =
    process.env.PUBLIC_APP_ORIGIN ??
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_APP_ORIGIN ??
    null;

  if (!configuredOrigin) {
    return null;
  }

  try {
    return new URL(configuredOrigin).origin;
  } catch {
    return null;
  }
}

function getPreferredHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function buildOriginFromHost(protocol: string, host: string) {
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

export function sanitizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_POST_LOGIN_PATH;
  }

  return nextPath;
}

export function resolveRequestOrigin(request: Request | { url: string; headers: Headers; nextUrl?: URL }) {
  const configuredOrigin = getConfiguredAppOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const requestUrl = "nextUrl" in request && request.nextUrl ? request.nextUrl : new URL(request.url);
  const forwardedHost = getPreferredHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost ?? getPreferredHeaderValue(request.headers.get("host"));
  const protocol =
    getPreferredHeaderValue(request.headers.get("x-forwarded-proto")) ??
    requestUrl.protocol.replace(/:$/, "") ??
    "http";

  if (host && (forwardedHost || LOOPBACK_HOSTS.has(requestUrl.hostname))) {
    const originFromHeaders = buildOriginFromHost(protocol, host);

    if (originFromHeaders) {
      return originFromHeaders;
    }
  }

  return requestUrl.origin;
}

export function buildSteamAuthorizationUrl(origin: string, nextPath: string) {
  const normalizedOrigin = new URL(origin).origin;
  const callbackUrl = new URL("/api/auth/steam/callback", normalizedOrigin);
  callbackUrl.searchParams.set("next", sanitizeNextPath(nextPath));

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": callbackUrl.toString(),
    "openid.realm": normalizedOrigin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

export async function verifySteamOpenIdCallback(searchParams: URLSearchParams) {
  if (searchParams.get("openid.mode") !== "id_res") {
    return null;
  }

  const validationParams = new URLSearchParams(searchParams);
  validationParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: validationParams,
    cache: "no-store",
  });

  const body = await response.text();

  if (!response.ok || !body.includes("is_valid:true")) {
    return null;
  }

  const claimedId =
    searchParams.get("openid.claimed_id") ?? searchParams.get("openid.identity") ?? "";
  const match = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/);

  return match?.[1] ?? null;
}

async function fetchSteamLevel(steamApiKey: string, steamId: string) {
  const levelEndpoints = [
    "https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/",
    "https://partner.steam-api.com/IPlayerService/GetSteamLevel/v1/",
  ];

  for (const endpoint of levelEndpoints) {
    try {
      const url = new URL(endpoint);
      url.searchParams.set("key", steamApiKey);
      url.searchParams.set("steamid", steamId);

      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as SteamLevelResponse;
      const level = data.response?.player_level;

      if (typeof level === "number") {
        return level;
      }
    } catch {
      continue;
    }
  }

  return 0;
}

export async function fetchSteamAccount(steamApiKey: string, steamId: string): Promise<SteamAccount> {
  const summaryUrl = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
  summaryUrl.searchParams.set("key", steamApiKey);
  summaryUrl.searchParams.set("steamids", steamId);

  const response = await fetch(summaryUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o perfil da Steam.");
  }

  const data = (await response.json()) as SteamPlayerSummaryResponse;
  const player = data.response?.players?.[0];

  if (!player) {
    throw new Error("A Steam nao retornou os dados basicos do jogador.");
  }

  const steamLevel = await fetchSteamLevel(steamApiKey, steamId);

  return {
    steamId,
    steamPersonaName: player.personaname,
    steamAvatarUrl: player.avatarfull ?? player.avatarmedium ?? null,
    steamProfileUrl: player.profileurl ?? null,
    steamLevel,
  };
}
