import { NextRequest, NextResponse } from "next/server";
import { buildSteamAuthorizationUrl, resolveRequestOrigin, sanitizeNextPath } from "@/lib/auth/steam";

export async function GET(request: NextRequest) {
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
  const authorizationUrl = buildSteamAuthorizationUrl(resolveRequestOrigin(request), nextPath);

  return NextResponse.redirect(authorizationUrl);
}
