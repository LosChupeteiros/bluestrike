import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getRegistrationById, markPaymentPaidByMp } from "@/lib/faceit-registrations";
import { getPaymentById } from "@/lib/mercadopago";

// Chamada pelo frontend após retorno do MP (back_url success) ou manualmente.
// Verifica o status real do pagamento na API do Mercado Pago antes de marcar pago.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { registrationId?: string; mpPaymentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { registrationId, mpPaymentId } = body;
  if (!registrationId) {
    return NextResponse.json({ error: "registrationId obrigatório." }, { status: 400 });
  }

  const registration = await getRegistrationById(registrationId);
  if (!registration || registration.profileId !== profile.id) {
    return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  }

  // Já pago: idempotência
  if (registration.paymentStatus === "paid") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  // Se veio com mpPaymentId (retorno da back_url), verifica via API MP
  if (mpPaymentId) {
    try {
      const payment = await getPaymentById(mpPaymentId);
      if (payment.status === "approved" && payment.external_reference === registrationId) {
        await markPaymentPaidByMp(registrationId, mpPaymentId);
        return NextResponse.json({ ok: true });
      }
      // Pagamento existe mas não aprovado ainda
      return NextResponse.json({ ok: false, mpStatus: payment.status });
    } catch {
      return NextResponse.json({ error: "Erro ao verificar pagamento." }, { status: 502 });
    }
  }

  // Sem mpPaymentId: verifica se o webhook já processou (mp_payment_id populado)
  if (registration.mpPaymentId) {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  // Pagamento ainda pendente — o webhook processará quando MP confirmar
  return NextResponse.json({ ok: false, mpStatus: "pending" });
}
