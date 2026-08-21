import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";

/**
 * Autenticação das rotas chamadas por máquina (servidor CS2 / Dathost / MatchZy).
 *
 * Essas rotas não têm sessão de usuário: quem chama é o servidor de jogo. A
 * proteção é por segredo compartilhado, comparado em tempo constante para não
 * vazar informação por diferença de tempo de resposta.
 */

/** Compara dois segredos sem vazar tamanho nem prefixo pelo tempo de execução. */
export function secretsMatch(received: string | null | undefined, expected: string | null | undefined): boolean {
  if (!received || !expected) return false;

  // Hash antes de comparar: timingSafeEqual exige buffers do mesmo tamanho, e
  // comparar os hashes evita revelar o comprimento do segredo esperado.
  const a = createHash("sha256").update(received).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Lê o segredo do header Authorization, aceitando "Bearer x" ou o valor cru. */
export function readBearer(request: Request, headerName = "authorization"): string | null {
  const raw = request.headers.get(headerName);
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/^Bearer\s+(.+)$/i);
  return (match?.[1] ?? trimmed) || null;
}

/**
 * Token global das integrações de servidor (MatchZy → nosso webhook).
 * Sem ele configurado, as rotas protegidas recusam tudo — falhar fechado é
 * melhor do que ficar aberto por esquecimento de variável de ambiente.
 */
export function getServerIntegrationToken(): string | null {
  return process.env.SERVER_INTEGRATION_TOKEN?.trim() || null;
}

export type AuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/** Valida o token global de integração vindo de um header. */
export function verifyIntegrationToken(request: Request, headerName?: string): AuthResult {
  const expected = getServerIntegrationToken();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: "Integração de servidor não configurada.",
    };
  }

  const received = readBearer(request, headerName ?? "authorization");
  if (!secretsMatch(received, expected)) {
    return { ok: false, status: 401, error: "Não autorizado." };
  }

  return { ok: true };
}

/** Valida o segredo específico de uma partida (matches.webhook_secret). */
export function verifyMatchSecret(request: Request, matchSecret: string | null): AuthResult {
  if (!matchSecret) {
    return { ok: false, status: 503, error: "Partida sem segredo de integração." };
  }

  const received = readBearer(request);
  if (!secretsMatch(received, matchSecret)) {
    return { ok: false, status: 401, error: "Não autorizado." };
  }

  return { ok: true };
}

/**
 * ID numérico da partida no MatchZy.
 *
 * Era `Date.now() / 1000`, o que tornava o valor adivinhável: sabendo mais ou
 * menos quando a partida subiu, dava para varrer alguns milhares de inteiros e
 * acertar. Agora é aleatório dentro do int32 positivo, que é o que o MatchZy
 * aceita. Colisão é tratada por retentativa em quem chama.
 */
export function generateMatchzyMatchId(): number {
  // 1..2_147_483_646 — evita 0 e o limite do int32.
  return randomInt(1, 2_147_483_647);
}

/** Segredo novo para uma partida, no formato usado em `matches.webhook_secret`. */
export function generateMatchSecret(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Host base das URLs entregues ao servidor de jogo (config e webhook).
 *
 * Precisa ser o host CANÔNICO, sem redirect. `bluestrike.com.br` responde 307
 * para `www.bluestrike.com.br`, e o HttpClient do .NET — que é o que o MatchZy
 * usa — descarta o header `Authorization` em redirect entre hosts diferentes.
 * Apontar direto para o host final evita que a autenticação quebre em silêncio.
 */
export function getIntegrationBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "https://www.bluestrike.com.br";
}
