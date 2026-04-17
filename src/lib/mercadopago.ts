import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado.");
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10000 } });
}

export interface CreatePixPreferenceParams {
  registrationId: string;
  championshipId: string;
  championshipName: string;
  amount: number;
  payerEmail: string;
  payerName: string;
}

export interface PixPreferenceResult {
  preferenceId: string;
  initPoint: string;       // produção
  sandboxInitPoint: string; // testes sandbox
}

export async function createPixPreference(
  params: CreatePixPreferenceParams
): Promise<PixPreferenceResult> {
  const client = getClient();
  const preference = new Preference(client);

  const origin = process.env.PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
  const isSandbox = (process.env.MP_ACCESS_TOKEN ?? "").startsWith("TEST-");

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.registrationId,
          title: `Inscrição — ${params.championshipName}`,
          quantity: 1,
          unit_price: params.amount,
          currency_id: "BRL",
          category_id: "sports",
        },
      ],
      payer: {
        email: params.payerEmail,
        name: params.payerName,
      },
      payment_methods: {
        installments: 1,
      },
      external_reference: params.registrationId,
      back_urls: {
        success: `${origin}/tournaments/${params.championshipId}?mp_status=approved`,
        failure: `${origin}/tournaments/${params.championshipId}?mp_status=failure`,
        pending: `${origin}/tournaments/${params.championshipId}?mp_status=pending`,
      },
      auto_return: "approved" as const,
      // source_news=webhooks garante formato webhook (não IPN legado)
      notification_url: `${origin}/api/webhooks/mercadopago?source_news=webhooks`,
      statement_descriptor: "BLUESTRIKE",
      // Expira em 30 minutos
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  });

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxInitPoint: result.sandbox_init_point!,
  };
}

export interface CreatePixPaymentParams {
  registrationId: string;
  championshipName: string;
  amount: number;
  payerEmail: string;
}

export interface PixPaymentResult {
  paymentId: string;
  qrCodeBase64: string;
  qrCode: string;
}

export async function createPixPayment(
  params: CreatePixPaymentParams
): Promise<PixPaymentResult> {
  const client = getClient();
  const payment = new Payment(client);

  const origin = process.env.PUBLIC_APP_ORIGIN ?? "http://localhost:3000";

  const result = await payment.create({
    body: {
      transaction_amount: params.amount,
      description: `Inscrição — ${params.championshipName}`,
      payment_method_id: "pix",
      payer: {
        email: params.payerEmail,
      },
      external_reference: params.registrationId,
      notification_url: `${origin}/api/webhooks/mercadopago?source_news=webhooks`,
      date_of_expiration: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    requestOptions: {
      idempotencyKey: params.registrationId,
    },
  });

  const txData = result.point_of_interaction?.transaction_data;
  if (!txData?.qr_code_base64 || !txData?.qr_code) {
    throw new Error("MP não retornou dados do QR Code PIX.");
  }

  return {
    paymentId: String(result.id!),
    qrCodeBase64: txData.qr_code_base64,
    qrCode: txData.qr_code,
  };
}

export async function getPaymentById(paymentId: string) {
  const client = getClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

export function isSandboxMode() {
  return (process.env.MP_ACCESS_TOKEN ?? "").startsWith("TEST-");
}
