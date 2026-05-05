import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getTournamentRegistrationIntentById } from "@/lib/tournament-registration-intents";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { id: tournamentId } = await context.params;
  const intentId = request.nextUrl.searchParams.get("intentId");
  if (!intentId) {
    return NextResponse.json({ error: "intentId obrigatorio." }, { status: 400 });
  }

  const intent = await getTournamentRegistrationIntentById(intentId);
  if (!intent || intent.tournamentId !== tournamentId || intent.captainProfileId !== currentProfile.id) {
    return NextResponse.json({ error: "Reserva de inscricao nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    intent,
    paymentStatus: intent.paymentStatus,
    status: intent.status,
  });
}
