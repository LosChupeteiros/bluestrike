import { normalizeSteamAvatarUrl } from "@/lib/steam-avatar";

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

/**
 * Normaliza o `?next=` do login para um caminho interno seguro.
 *
 * Checar prefixo na mão não basta. O parser de URL do navegador remove tab,
 * CR e LF antes de interpretar, e trata `\` como `/` — então `/\evil.com`,
 * `/<tab>/evil.com` e `/<lf>//evil.com` viram todos `https://evil.com`, virando
 * um open redirect logo após o login (phishing com o domínio do BlueStrike na
 * barra de endereço).
 *
 * Em vez de tentar listar os truques, resolve o valor contra uma origem base e
 * exige que o resultado continue nela. Só o caminho resolvido é devolvido.
 */
export function sanitizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return DEFAULT_POST_LOGIN_PATH;
  }

  // Origem sintética: interessa só se o valor escapa dela, não qual é.
  const BASE = "https://bluestrike.invalid";

  let resolved: URL;
  try {
    resolved = new URL(nextPath, BASE);
  } catch {
    return DEFAULT_POST_LOGIN_PATH;
  }

  if (resolved.origin !== BASE) {
    return DEFAULT_POST_LOGIN_PATH;
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
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
    // `avatarfull` é 184x184, o maior tamanho que a Steam expõe.
    steamAvatarUrl: normalizeSteamAvatarUrl(player.avatarfull ?? player.avatarmedium ?? null),
    steamProfileUrl: player.profileurl ?? null,
    steamLevel,
  };
}
