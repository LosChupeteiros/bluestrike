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
        // Exclui tudo exceto bank_transfer (PIX) — não usar default_payment_method_id
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "ticket" },
          { id: "atm" },
          { id: "prepaid_card" },
        ],
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

export async function getPaymentById(paymentId: string) {
  const client = getClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

export function isSandboxMode() {
  return (process.env.MP_ACCESS_TOKEN ?? "").startsWith("TEST-");
}
