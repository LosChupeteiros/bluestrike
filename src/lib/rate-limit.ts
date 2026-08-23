/**
 * Rate limiting em memória, por instância.
 *
 * Limitação conhecida: a Vercel roda várias instâncias, e cada uma tem o seu
 * contador — o teto real é `limite × instâncias`. Isso é aceitável para o que
 * se quer aqui (cortar automação burra, força bruta e enumeração de UUID), e
 * não substitui um limitador central (Upstash/Redis) se a plataforma crescer.
 * O que NÃO pode é continuar sem limite nenhum, que era o caso.
 */

interface Bucket {
  /** Timestamps das requisições dentro da janela. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Remove buckets ociosos para a memória não crescer sem limite. */
function sweep(windowMs: number) {
  const agora = Date.now();
  if (agora - lastSweep < 60_000) return;
  lastSweep = agora;

  for (const [chave, bucket] of buckets) {
    const vivos = bucket.hits.filter((t) => agora - t < windowMs);
    if (vivos.length === 0) buckets.delete(chave);
    else bucket.hits = vivos;
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Quantas requisições ainda cabem na janela. */
  remaining: number;
  /** Segundos até liberar, quando bloqueado. */
  retryAfter: number;
}

/**
 * Janela deslizante simples.
 *
 * @param chave  identidade do chamador (ex.: `ip:/api/rota`)
 * @param limite requisições permitidas na janela
 * @param windowMs tamanho da janela
 */
export function rateLimit(chave: string, limite: number, windowMs: number): RateLimitResult {
  sweep(windowMs);

  const agora = Date.now();
  const bucket = buckets.get(chave) ?? { hits: [] };
  const hits = bucket.hits.filter((t) => agora - t < windowMs);

  if (hits.length >= limite) {
    const maisAntigo = hits[0];
    const retryAfter = Math.max(1, Math.ceil((windowMs - (agora - maisAntigo)) / 1000));
    bucket.hits = hits;
    buckets.set(chave, bucket);
    return { ok: false, remaining: 0, retryAfter };
  }

  hits.push(agora);
  bucket.hits = hits;
  buckets.set(chave, bucket);

  return { ok: true, remaining: limite - hits.length, retryAfter: 0 };
}

/**
 * IP do cliente atrás do proxy da Vercel.
 *
 * `x-forwarded-for` é uma lista onde só o ÚLTIMO salto é confiável, mas na
 * Vercel o primeiro valor é o IP real do cliente porque a borda reescreve o
 * header. Fora da Vercel isto é falsificável — não use como identidade para
 * decisão de segurança, só para agrupar tráfego.
 */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "desconhecido";
}
