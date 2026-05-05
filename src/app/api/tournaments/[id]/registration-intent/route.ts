import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import {
  createCurrentCaptainRegistrationIntent,
  getCurrentTournamentRegistrationIntent,
} from "@/lib/tournament-registration-intents";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json({ intent: null });
  }

  const { id } = await context.params;
  try {
    const intent = await getCurrentTournamentRegistrationIntent(id, currentProfile.id);
    return NextResponse.json({ intent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel buscar a reserva.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam antes de inscrever um time." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const payload = await createCurrentCaptainRegistrationIntent({
      currentProfile,
      tournamentId: id,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel reservar a inscricao.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
