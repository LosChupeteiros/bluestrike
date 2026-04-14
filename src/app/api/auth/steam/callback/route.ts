import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { fetchSteamAccount, sanitizeNextPath, verifySteamOpenIdCallback } from "@/lib/auth/steam";
import { isProfileComplete } from "@/lib/profile";
import { resolveProfilePath, upsertSteamProfile } from "@/lib/profiles";

function redirectToLoginWithError(request: NextRequest, errorCode: string) {
  const url = new URL("/auth/login", request.nextUrl.origin);
  url.searchParams.set("error", errorCode);

  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
  if (nextPath !== "/profile") {
    url.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const steamApiKey = process.env.STEAM_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!steamApiKey) {
    return redirectToLoginWithError(request, "steam_not_configured");
  }

  if (!supabaseUrl || !supabaseSecretKey) {
    return redirectToLoginWithError(request, "supabase_not_configured");
  }

  try {
    const steamId = await verifySteamOpenIdCallback(request.nextUrl.searchParams);

    if (!steamId) {
      return redirectToLoginWithError(request, "steam_validation_failed");
    }

    const steamAccount = await fetchSteamAccount(steamApiKey, steamId);
    const profile = await upsertSteamProfile(steamAccount);

    const profilePath = resolveProfilePath(profile);
    const isComplete = isProfileComplete(profile);
    const requestedNextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
    const redirectPath =
      isComplete && requestedNextPath !== "/profile"
        ? requestedNextPath
        : isComplete
          ? profilePath
          : `${profilePath}?welcome=1&complete=1&edit=1`;

    const response = NextResponse.redirect(new URL(redirectPath, request.nextUrl.origin));
    await setSessionCookie(response, {
      profileId: profile.id,
      steamId: profile.steamId,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Falha ao salvar perfil da Steam")) {
      return redirectToLoginWithError(request, "profile_save_failed");
    }

    if (message.includes("Nao foi possivel consultar o perfil da Steam")) {
      return redirectToLoginWithError(request, "steam_profile_fetch_failed");
    }

    return redirectToLoginWithError(request, "steam_login_failed");
  }
}
