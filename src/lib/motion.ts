/**
 * Identidade de movimento da plataforma.
 *
 * Mesmo vocabulário que existe em CSS (`--dur-*`, `--ease-*` em globals.css),
 * exposto aqui para o GSAP. Duas cópias do mesmo número divergem com o tempo,
 * então quem mexer em uma tem que mexer na outra — os nomes são idênticos de
 * propósito para isso ficar óbvio.
 *
 * A personalidade é energética no que responde ao usuário e premium no que
 * apenas se revela ao rolar: CS2 é reflexo, o retorno precisa ser imediato,
 * mas a apresentação pode respirar.
 */

/** Durações em segundos (GSAP trabalha em segundos, CSS em ms). */
export const DUR = {
  /** Feedback imediato: press, hover, toggle. */
  fast: 0.14,
  /** Mudança de estado: card, badge, tab. */
  base: 0.26,
  /** Apresentação: seção entrando, modal, revelação. */
  slow: 0.52,
} as const;

export const EASE = {
  /** Resposta: sai rápido e assenta. Para o que reage ao usuário. */
  snap: "power4.out",
  /** Revelação: entrada calma. Para o que aparece ao rolar. */
  glide: "power3.out",
  /** Saída: acelera e some. */
  exit: "power2.in",
} as const;

/**
 * Orçamentos de stagger.
 *
 * A regra que importa: o total precisa ficar abaixo de ~500ms. Acima disso o
 * último item da lista parece que travou, não que foi coreografado — e numa
 * grade de 20 times isso é a diferença entre elegante e lento.
 */
export const STAGGER = {
  /** Grade densa (cards, células). Total ≈ 250ms em 8 itens. */
  grid: 0.032,
  /** Lista ou painéis. Total ≈ 350ms em 5 itens. */
  list: 0.07,
  /** Poucos elementos com peso (hero, destaque). */
  hero: 0.065,
} as const;

/** Deslocamento padrão de entrada, em px. Curto de propósito: o olho lê a
 *  direção sem que o elemento pareça vir de fora da tela. */
export const SHIFT = 18;

/**
 * O usuário pediu para reduzir movimento?
 *
 * Toda animação decorativa passa por aqui antes de rodar. O CSS já respeita
 * `prefers-reduced-motion` globalmente; isto cobre o que é feito em JS.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * O navegador anima ao rolar sem custo de main thread?
 *
 * Onde `animation-timeline: view()` existe, a revelação roda no compositor e
 * não precisa de JS nenhum — é sempre a opção mais fluida. Onde não existe
 * (Firefox, Safari antigo), o ScrollTrigger assume. Testar em vez de assumir
 * evita rodar as duas coisas ao mesmo tempo.
 */
export function hasNativeScrollTimeline(): boolean {
  if (typeof CSS === "undefined" || !CSS.supports) return false;
  return CSS.supports("animation-timeline: view()");
}
