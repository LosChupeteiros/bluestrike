import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { joinTeamByCode } from "@/lib/teams";

interface JoinTeamRouteContext {
  params: Promise<{
    code: string;
  }>;
}

export async function POST(request: NextRequest, context: JoinTeamRouteContext) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam antes de entrar em um time." }, { status: 401 });
  }

  try {
    const { code } = await context.params;
    const body = (await request.json()) as { password?: string | null };
    const team = await joinTeamByCode(currentProfile, code, body.password);

    return NextResponse.json({ team });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel entrar no time.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
