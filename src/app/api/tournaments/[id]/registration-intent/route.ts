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

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam antes de inscrever um time." }, { status: 401 });
  }

  const { id } = await context.params;

  let teamId: string;
  let rosterProfileIds: string[];

  try {
    const body = await request.json();
    teamId = body.teamId;
    rosterProfileIds = body.rosterProfileIds;

    if (typeof teamId !== "string" || !teamId) {
      return NextResponse.json({ error: "Selecione um time para inscrever." }, { status: 400 });
    }

    if (
      !Array.isArray(rosterProfileIds) ||
      rosterProfileIds.length === 0 ||
      !rosterProfileIds.every((v) => typeof v === "string")
    ) {
      return NextResponse.json({ error: "Selecione os jogadores que vao participar." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  try {
    const payload = await createCurrentCaptainRegistrationIntent({
      currentProfile,
      tournamentId: id,
      teamId,
      rosterProfileIds,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel reservar a inscricao.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
