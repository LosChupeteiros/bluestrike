import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getRegistrationById, saveMpPaymentId } from "@/lib/faceit-registrations";
import { createPixPayment } from "@/lib/mercadopago";
import { getFaceitChampionshipById } from "@/lib/faceit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: championshipId } = await params;

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { registrationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { registrationId } = body;
  if (!registrationId) {
    return NextResponse.json({ error: "registrationId obrigatório." }, { status: 400 });
  }

  const registration = await getRegistrationById(registrationId);
  if (!registration || registration.profileId !== profile.id) {
    return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  }
  if (registration.paymentStatus === "paid") {
    return NextResponse.json({ error: "Pagamento já confirmado." }, { status: 409 });
  }

  const championship = await getFaceitChampionshipById(championshipId);
  if (!championship) {
    return NextResponse.json({ error: "Campeonato não encontrado." }, { status: 404 });
  }

  const amount = championship.entryFee;
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Este campeonato não possui taxa de inscrição." }, { status: 422 });
  }

  try {
    const result = await createPixPayment({
      registrationId,
      championshipName: championship.name,
      amount,
      payerEmail: profile.email ?? `${profile.steamId}@bluestrike.gg`,
    });

    await saveMpPaymentId(registrationId, result.paymentId);

    return NextResponse.json({
      paymentId: result.paymentId,
      qrCodeBase64: result.qrCodeBase64,
      qrCode: result.qrCode,
    });
  } catch (err) {
    console.error("[pix-payment] Erro MP:", err);
    const msg = err instanceof Error ? err.message : "Erro ao gerar PIX.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
