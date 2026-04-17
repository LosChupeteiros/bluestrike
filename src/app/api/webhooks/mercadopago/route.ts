import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getPaymentById } from "@/lib/mercadopago";
import { getRegistrationById, markPaymentPaidByMp } from "@/lib/faceit-registrations";

// Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/security/webhooks
function validateSignature(request: NextRequest, body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Sem secret configurado: aceita em dev (sandbox sem validação)
    console.warn("[mp-webhook] MP_WEBHOOK_SECRET não configurado — pulando validação de assinatura.");
    return true;
  }

  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";

  // Extrai ts e v1 do header x-signature (formato: ts=...,v1=...)
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"] ?? "";
  const v1 = parts["v1"] ?? "";

  if (!ts || !v1) return false;

  // Extrai data.id da query string (MP envia como ?data.id=xxx)
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? "";

  // Monta template removendo campos ausentes (conforme doc MP)
  // "Se algum dos valores não estiver presente, você deve removê-lo"
  const parts2: string[] = [];
  if (dataId) parts2.push(`id:${dataId}`);
  if (xRequestId) parts2.push(`request-id:${xRequestId}`);
  if (ts) parts2.push(`ts:${ts}`);
  const manifest = parts2.join(";") + ";";

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === v1;
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  // Valida assinatura
  if (!validateSignature(request, rawBody)) {
    console.warn("[mp-webhook] Assinatura inválida — requisição rejeitada.");
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let event: { type?: string; data?: { id?: string | number } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  // Só processa notificações de pagamento
  if (event.type !== "payment") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const paymentId = String(event.data?.id ?? "");
  if (!paymentId) {
    return NextResponse.json({ error: "payment id ausente." }, { status: 400 });
  }

  try {
    const payment = await getPaymentById(paymentId);

    // Só processa se aprovado e via PIX
    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, status: payment.status });
    }
    if (payment.payment_method_id !== "pix") {
      console.warn(`[mp-webhook] Método inesperado: ${payment.payment_method_id}`);
      return NextResponse.json({ ok: true });
    }

    const registrationId = payment.external_reference;
    if (!registrationId) {
      console.warn("[mp-webhook] external_reference ausente no pagamento", paymentId);
      return NextResponse.json({ ok: true });
    }

    // Verifica se a inscrição existe e ainda está pendente
    const registration = await getRegistrationById(registrationId);
    if (!registration) {
      console.warn("[mp-webhook] Inscrição não encontrada:", registrationId);
      return NextResponse.json({ ok: true });
    }
    if (registration.paymentStatus === "paid") {
      // Idempotência: já estava pago
      return NextResponse.json({ ok: true, already_paid: true });
    }

    await markPaymentPaidByMp(registrationId, paymentId);
    console.log(`[mp-webhook] Pagamento confirmado: reg=${registrationId} payment=${paymentId}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp-webhook] Erro ao processar pagamento:", err);
    // Retorna 200 para evitar retry loops do MP em erros internos transitórios
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 200 });
  }
}
