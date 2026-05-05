import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getPaymentById } from "@/lib/mercadopago";
import {
  finalizeBlueStrikeRegistrationIntent,
  getBlueStrikePaymentExternalReference,
  getTournamentRegistrationIntentById,
} from "@/lib/tournament-registration-intents";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  let body: { intentId?: string; mpPaymentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 });
  }

  const { id: tournamentId } = await context.params;
  const { intentId, mpPaymentId } = body;
  if (!intentId) {
    return NextResponse.json({ error: "intentId obrigatorio." }, { status: 400 });
  }

  const intent = await getTournamentRegistrationIntentById(intentId);
  if (!intent || intent.tournamentId !== tournamentId || intent.captainProfileId !== currentProfile.id) {
    return NextResponse.json({ error: "Reserva de inscricao nao encontrada." }, { status: 404 });
  }

  if (intent.paymentStatus === "paid" || intent.status === "paid") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const paymentId = mpPaymentId ?? intent.mpPaymentId;
  if (!paymentId) {
    return NextResponse.json({ ok: false, mpStatus: "pending" });
  }

  try {
    const payment = await getPaymentById(paymentId);
    if (payment.external_reference !== getBlueStrikePaymentExternalReference(intent.id)) {
      return NextResponse.json({ error: "Pagamento nao pertence a essa inscricao." }, { status: 409 });
    }

    if (payment.status !== "approved") {
      return NextResponse.json({ ok: false, mpStatus: payment.status ?? "pending" });
    }

    await finalizeBlueStrikeRegistrationIntent(intent.id, String(payment.id ?? paymentId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao verificar pagamento.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
