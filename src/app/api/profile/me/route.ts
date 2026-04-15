import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ elo: null }, { status: 401 });
  }

  return NextResponse.json({ elo: profile.elo });
}
