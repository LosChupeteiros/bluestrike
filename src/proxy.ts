import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Proxy (no Next 16 é o que antes se chamava middleware).
 *
 * Duas responsabilidades, ambas de borda:
 *
 * 1. Cabeçalhos de segurança em toda resposta.
 * 2. Um teto grosso de requisições por IP nas rotas de API.
 *
 * O que este arquivo NÃO faz: autorizar. A doc do Next avisa que o proxy pode
 * ser distribuído para a CDN e que não se deve depender de estado compartilhado
 * aqui — e, mais importante, um caminho que não casa com o `matcher` simplesmente
 * não passa por aqui. Autorização mora em cada rota, perto do dado que ela toca.
 * Este arquivo é rede de proteção, nunca a única linha de defesa.
 */

/** Teto por IP para /api/*, por janela. Generoso: o placar ao vivo faz polling. */
const API_LIMITE = 240;
const API_JANELA_MS = 60_000;

/** Rotas de autenticação: alvo clássico de força bruta, teto bem menor. */
const AUTH_LIMITE = 20;
const AUTH_JANELA_MS = 60_000;

/**
 * Webhooks de máquina ficam de fora do limite por IP: o Mercado Pago e o
 * Dathost concentram muitas chamadas em poucos IPs, e barrar um webhook de
 * pagamento por excesso de tráfego perde dinheiro. Eles se defendem por
 * assinatura/segredo, que é o controle certo para esse tipo de chamador.
 */
const ISENTOS = ["/api/webhooks/", "/api/matchzy/webhook/"];

function comCabecalhosDeSeguranca(res: NextResponse): NextResponse {
  // Impede que o navegador "adivinhe" o tipo de um arquivo servido por nós.
  res.headers.set("X-Content-Type-Options", "nosniff");
  // Bloqueia enquadrar o site em iframe — defesa contra clickjacking.
  res.headers.set("X-Frame-Options", "DENY");
  // Não vaza a URL interna (que contém UUID de partida) para sites externos.
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Desliga APIs de dispositivo que a plataforma não usa.
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  // HSTS: uma vez em HTTPS, sempre em HTTPS.
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const isento = ISENTOS.some((p) => pathname.startsWith(p));

    if (!isento) {
      const ehAuth = pathname.startsWith("/api/auth/");
      const limite = ehAuth ? AUTH_LIMITE : API_LIMITE;
      const janela = ehAuth ? AUTH_JANELA_MS : API_JANELA_MS;

      const ip = getClientIp(request.headers);
      const escopo = ehAuth ? "auth" : "api";
      const resultado = rateLimit(`${ip}:${escopo}`, limite, janela);

      if (!resultado.ok) {
        return comCabecalhosDeSeguranca(
          NextResponse.json(
            { error: "Muitas requisições. Tente novamente em instantes." },
            {
              status: 429,
              headers: { "Retry-After": String(resultado.retryAfter) },
            }
          )
        );
      }
    }
  }

  return comCabecalhosDeSeguranca(NextResponse.next());
}

export const config = {
  // Tudo, menos assets estáticos e otimização de imagem — que são servidos pela
  // CDN e não têm por que passar por aqui.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)"],
};
