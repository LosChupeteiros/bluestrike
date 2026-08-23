import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getPaymentById } from "@/lib/mercadopago";
import { getRegistrationById, markPaymentPaidByMp } from "@/lib/faceit-registrations";
import {
  finalizeBlueStrikeRegistrationIntent,
  parseBlueStrikePaymentExternalReference,
} from "@/lib/tournament-registration-intents";

/**
 * Idade a partir da qual a assinatura é considerada velha — apenas registrada
 * em log, nunca motivo de recusa.
 *
 * O Mercado Pago reenvia notificação não confirmada **a cada 15 minutos, e
 * segue reenviando indefinidamente** até receber 200. Recusar por idade
 * transformaria uma indisponibilidade nossa em pagamento nunca confirmado, que
 * é exatamente o problema de dinheiro que esta rota já teve. E o ganho seria
 * pequeno: quem repetir uma notificação capturada só faz o handler reconsultar
 * o pagamento real na API do MP e reconfirmar algo já confirmado — a rota é
 * idempotente. Quem autentica de verdade é o HMAC.
 */
const MP_SIGNATURE_IDADE_SUSPEITA_MIN = 60;

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

  // Só observabilidade — ver o comentário da constante sobre por que idade não
  // recusa. O `ts` do MP vem em segundos (ex.: 1704908010); a checagem de
  // tamanho cobre o caso de vir em milissegundos sem quebrar nada.
  const tsMs = Number(ts) * (ts.trim().length > 12 ? 1 : 1000);
  if (Number.isFinite(tsMs)) {
    const idadeMin = Math.abs(Date.now() - tsMs) / 60_000;
    if (idadeMin > MP_SIGNATURE_IDADE_SUSPEITA_MIN) {
      console.warn(`[mp-webhook] assinatura com ~${Math.round(idadeMin)}min (provável retry do MP)`);
    }
  }

  // Template oficial: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
  // O `data.id` vem da QUERY STRING, não do corpo. Quando o valor é
  // alfanumérico o MP assina em minúsculas, então normalizamos — para id de
  // pagamento, que é numérico, isso não muda nada, mas evita falha silenciosa
  // em outros tópicos. Parte ausente é omitida do template, conforme a doc.
  const url = new URL(request.url);
  const dataId = (url.searchParams.get("data.id") ?? "").trim().toLowerCase();
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
    console.error("[mp-webhook] Erro ao processar pagamento:", error);

    // O Mercado Pago reenvia a cada 15min até receber 200, indefinidamente.
    // Isso é o que se quer para falha transitória (banco fora do ar): antes a
    // rota devolvia 200 no catch, o MP considerava entregue e nunca repetia —
    // o jogador pagava e a inscrição não saía.
    //
    // Mas para erro PERMANENTE, repetir não conserta nada e só gera retry
    // eterno. Pagamento que o MP diz não existir (404) é permanente: ou o id é
    // inválido, ou é de outra conta. Nesse caso confirmamos o recebimento.
    const status = (error as { status?: number } | null)?.status;
    if (status === 404) {
      return NextResponse.json({ ok: true, note: "payment_not_found" });
    }

    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 500 });
  }
}
