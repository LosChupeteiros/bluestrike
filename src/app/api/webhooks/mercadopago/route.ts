import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getPaymentById } from "@/lib/mercadopago";
import { getRegistrationById, markPaymentPaidByMp } from "@/lib/faceit-registrations";
import {
  finalizeBlueStrikeRegistrationIntent,
  parseBlueStrikePaymentExternalReference,
} from "@/lib/tournament-registration-intents";

function validateSignature(request: NextRequest): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[mp-webhook] MP_WEBHOOK_SECRET nao configurado; pulando validacao de assinatura.");
    return true;
  }

  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(xSignature.split(",").map((part) => part.split("=") as [string, string]));
  const ts = parts.ts ?? "";
  const v1 = parts.v1 ?? "";

  if (!ts || !v1) return false;

  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? "";
  const manifestParts: string[] = [];
  if (dataId) manifestParts.push(`id:${dataId}`);
  if (xRequestId) manifestParts.push(`request-id:${xRequestId}`);
  manifestParts.push(`ts:${ts}`);

  const manifest = `${manifestParts.join(";")};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === v1;
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  if (!validateSignature(request)) {
    console.warn("[mp-webhook] Assinatura invalida; requisicao rejeitada.");
    return NextResponse.json({ error: "Assinatura invalida." }, { status: 401 });
  }

  let event: { type?: string; data?: { id?: string | number } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  if (event.type !== "payment") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const paymentId = String(event.data?.id ?? "");
  if (!paymentId) {
    return NextResponse.json({ error: "payment id ausente." }, { status: 400 });
  }

  try {
    const payment = await getPaymentById(paymentId);

    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, status: payment.status });
    }

    if (payment.payment_method_id !== "pix") {
      console.warn(`[mp-webhook] Metodo inesperado: ${payment.payment_method_id}`);
      return NextResponse.json({ ok: true });
    }

    const externalReference = payment.external_reference;
    if (!externalReference) {
      console.warn("[mp-webhook] external_reference ausente no pagamento", paymentId);
      return NextResponse.json({ ok: true });
    }

    const blueStrikeIntentId = parseBlueStrikePaymentExternalReference(externalReference);
    if (blueStrikeIntentId) {
      await finalizeBlueStrikeRegistrationIntent(blueStrikeIntentId, paymentId);
      console.log(`[mp-webhook] Pagamento BlueStrike confirmado: intent=${blueStrikeIntentId} payment=${paymentId}`);
      return NextResponse.json({ ok: true });
    }

    const registration = await getRegistrationById(externalReference);
    if (!registration) {
      console.warn("[mp-webhook] Inscricao nao encontrada:", externalReference);
      return NextResponse.json({ ok: true });
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json({ ok: true, already_paid: true });
    }

    await markPaymentPaidByMp(externalReference, paymentId);
    console.log(`[mp-webhook] Pagamento confirmado: reg=${externalReference} payment=${paymentId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mp-webhook] Erro ao processar pagamento:", error);
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 200 });
  }
}
