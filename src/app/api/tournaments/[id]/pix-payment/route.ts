import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { createPixPayment } from "@/lib/mercadopago";
import {
  getBlueStrikePaymentExternalReference,
  getTournamentRegistrationIntentById,
  REGISTRATION_INTENT_TTL_MS,
  saveRegistrationIntentPix,
} from "@/lib/tournament-registration-intents";
import { getTournamentById } from "@/lib/tournaments";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  let body: { intentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 });
  }

  const { id: tournamentId } = await context.params;
  const intentId = body.intentId;
  if (!intentId) {
    return NextResponse.json({ error: "intentId obrigatorio." }, { status: 400 });
  }

  const intent = await getTournamentRegistrationIntentById(intentId);
  if (!intent || intent.tournamentId !== tournamentId || intent.captainProfileId !== currentProfile.id) {
    return NextResponse.json({ error: "Reserva de inscricao nao encontrada." }, { status: 404 });
  }

  if (intent.paymentStatus === "paid" || intent.status === "paid") {
    return NextResponse.json({ error: "Pagamento ja confirmado." }, { status: 409 });
  }

  if (intent.status !== "pending" || Date.parse(intent.expiresAt) <= Date.now()) {
    return NextResponse.json({ error: "Essa reserva expirou. Inicie a inscricao novamente." }, { status: 410 });
  }

  if (intent.pixQrCode && intent.pixQrCodeBase64 && intent.pixExpiresAt && Date.parse(intent.pixExpiresAt) > Date.now()) {
    return NextResponse.json({
      paymentId: intent.mpPaymentId,
      qrCodeBase64: intent.pixQrCodeBase64,
      qrCode: intent.pixQrCode,
      expiresAt: intent.pixExpiresAt,
    });
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return NextResponse.json({ error: "Campeonato nao encontrado." }, { status: 404 });
  }

  if ((tournament.entryFee ?? 0) <= 0) {
    return NextResponse.json({ error: "Este campeonato nao possui taxa de inscricao." }, { status: 422 });
  }

  try {
    const pixExpiresAt = new Date(Date.now() + REGISTRATION_INTENT_TTL_MS).toISOString();
    const result = await createPixPayment({
      registrationId: intent.id,
      externalReference: getBlueStrikePaymentExternalReference(intent.id),
      championshipName: tournament.name,
      amount: tournament.entryFee ?? intent.paymentAmount,
      payerEmail: currentProfile.email ?? `${currentProfile.steamId}@bluestrike.com.br`,
      expirationMinutes: 15,
    });

    await saveRegistrationIntentPix({
      intentId: intent.id,
      paymentId: result.paymentId,
      qrCode: result.qrCode,
      qrCodeBase64: result.qrCodeBase64,
      expiresAt: pixExpiresAt,
    });

    return NextResponse.json({
      paymentId: result.paymentId,
      qrCodeBase64: result.qrCodeBase64,
      qrCode: result.qrCode,
      expiresAt: pixExpiresAt,
    });
  } catch (error) {
    console.error("[bluestrike-pix-payment] Erro MP:", error);
    const message = error instanceof Error ? error.message : "Erro ao gerar PIX.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
