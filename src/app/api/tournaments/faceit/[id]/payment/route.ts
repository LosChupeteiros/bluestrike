import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { markPaymentPaid } from "@/lib/faceit-registrations";

// MOCK: simula confirmação de pagamento PIX.
// Quando implementarmos gateway real, esta rota deve verificar o status do pagamento
// antes de marcar como pago.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // consume dynamic segment

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

  await markPaymentPaid(registrationId);
  return NextResponse.json({ ok: true });
}
