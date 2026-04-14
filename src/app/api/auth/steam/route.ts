import { NextRequest, NextResponse } from "next/server";
import { buildSteamAuthorizationUrl, sanitizeNextPath } from "@/lib/auth/steam";

export async function GET(request: NextRequest) {
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
  const authorizationUrl = buildSteamAuthorizationUrl(request.nextUrl.origin, nextPath);

  return NextResponse.redirect(authorizationUrl);
}
