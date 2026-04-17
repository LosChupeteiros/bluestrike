import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getFaceitTeams } from "@/lib/faceit";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!profile.faceitId) {
    return NextResponse.json({ teams: [] });
  }

  const teams = await getFaceitTeams(profile.faceitId);
  return NextResponse.json({ teams });
}
