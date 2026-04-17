import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { registerCurrentCaptainTeamForTournament } from "@/lib/tournaments";

interface TournamentRegisterRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: TournamentRegisterRouteContext) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: "Você precisa entrar com a Steam antes de inscrever um time." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { paymentConfirmed?: boolean };
    const payload = await registerCurrentCaptainTeamForTournament({
      currentProfile,
      tournamentId: id,
      paymentConfirmed: Boolean(body.paymentConfirmed),
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível concluir a inscrição.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
