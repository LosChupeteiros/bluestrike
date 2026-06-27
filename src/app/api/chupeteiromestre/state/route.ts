import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getLobbyState } from "@/lib/pug";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getCurrentProfile();
  const state = await getLobbyState(profile?.id ?? null, profile?.isAdmin ?? false);
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}
