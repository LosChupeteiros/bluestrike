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
    const body = (await request.json()) as {
      paymentConfirmed?: boolean;
      teamId?: string;
      rosterProfileIds?: string[];
    };

    if (!body.teamId || typeof body.teamId !== "string") {
      return NextResponse.json({ error: "Selecione um time para inscrever." }, { status: 400 });
    }

    if (!Array.isArray(body.rosterProfileIds) || body.rosterProfileIds.length === 0) {
      return NextResponse.json({ error: "Selecione os jogadores que vao participar." }, { status: 400 });
    }

    const payload = await registerCurrentCaptainTeamForTournament({
      currentProfile,
      tournamentId: id,
      teamId: body.teamId,
      rosterProfileIds: body.rosterProfileIds,
      paymentConfirmed: Boolean(body.paymentConfirmed),
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível concluir a inscrição.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
