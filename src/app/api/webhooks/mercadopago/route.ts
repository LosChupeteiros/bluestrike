import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getPaymentById } from "@/lib/mercadopago";
import { getRegistrationById, markPaymentPaidByMp } from "@/lib/faceit-registrations";
import {
  finalizeBlueStrikeRegistrationIntent,
  parseBlueStrikePaymentExternalReference,
} from "@/lib/tournament-registration-intents";

/** Tolerância de relógio para a assinatura, em minutos. */
const MP_SIGNATURE_MAX_AGE_MIN = 15;

type SignatureCheck = { ok: true } | { ok: false; reason: string };

function validateSignature(request: NextRequest): SignatureCheck {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Falha FECHADA. Antes isto devolvia `true` e o webhook seguia sem
    // conferir nada — como a variável nunca foi configurada, a validação de
    // assinatura estava desligada em produção sem ninguém perceber.
    return { ok: false, reason: "MP_WEBHOOK_SECRET não configurado" };
  }

  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(
    xSignature
      .split(",")
      .map((part) => part.split("="))
      .filter((kv): kv is [string, string] => kv.length === 2)
      .map(([k, v]) => [k.trim(), v.trim()])
  );
  const ts = parts.ts ?? "";
  const v1 = parts.v1 ?? "";

  if (!ts || !v1) return { ok: false, reason: "header x-signature incompleto" };

  // Assinatura velha é replay: sem isto, um POST capturado vale para sempre.
  const tsMs = Number(ts) * (ts.length > 12 ? 1 : 1000);
  if (Number.isFinite(tsMs)) {
    const idadeMin = Math.abs(Date.now() - tsMs) / 60_000;
    if (idadeMin > MP_SIGNATURE_MAX_AGE_MIN) {
      return { ok: false, reason: `assinatura com ${Math.round(idadeMin)}min de idade` };
    }
  }

  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? "";
  const manifestParts: string[] = [];
  if (dataId) manifestParts.push(`id:${dataId}`);
  if (xRequestId) manifestParts.push(`request-id:${xRequestId}`);
  manifestParts.push(`ts:${ts}`);

  const manifest = `${manifestParts.join(";")};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  // Comparação em tempo constante — `===` em string vaza o prefixo correto.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "assinatura não confere" };
  }

  return { ok: true };
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  const assinatura = validateSignature(request);
  if (!assinatura.ok) {
    console.warn(`[mp-webhook] rejeitado: ${assinatura.reason}`);
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
      console.warn("[mp-webhook] Inscrição nao encontrada:", externalReference);
      return NextResponse.json({ ok: true });
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json({ ok: true, already_paid: true });
    }

    await markPaymentPaidByMp(externalReference, paymentId);
    console.log(`[mp-webhook] Pagamento confirmado: reg=${externalReference} payment=${paymentId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    // HTTP 500, não 200. Devolver 200 aqui dizia ao Mercado Pago "recebi e
    // tratei", e ele nunca reenviava — se o Supabase piscasse na hora de
    // marcar como pago, o jogador pagava e a inscrição não saía, sem nenhuma
    // segunda chance. Com 500, o MP repete a notificação.
    console.error("[mp-webhook] Erro ao processar pagamento:", error);
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 500 });
  }
}
