import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

function buildLoggedOutResponse(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));
  clearSessionCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  return buildLoggedOutResponse(request);
}

export async function POST(request: NextRequest) {
  return buildLoggedOutResponse(request);
}
