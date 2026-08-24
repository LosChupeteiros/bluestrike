"use client";

import { useEffect, useRef, useState } from "react";
import { DUR, prefersReducedMotion } from "@/lib/motion";

/**
 * Número que conta ao entrar na tela.
 *
 * Sem biblioteca: um `requestAnimationFrame` com easing, que é tudo o que um
 * contador precisa. Puxar o GSAP para isto seria pagar o download de uma engine
 * de timeline para animar um inteiro.
 *
 * Três cuidados que fazem a diferença entre bonito e irritante:
 *
 * 1. **Conta uma vez.** Recontar toda vez que o elemento reentra na tela vira
 *    distração ao rolar para cima e para baixo.
 * 2. **Reserva a largura final** com `tabular-nums` e o valor final invisível,
 *    para o layout não pular a cada dígito que aparece.
 * 3. **Renderiza o valor final no HTML** desde o começo. Quem tem
 *    `prefers-reduced-motion`, JS desligado ou um leitor de tela recebe o
 *    número certo, não um zero.
 */
export default function CountUp({
  value,
  duration = DUR.slow * 2.4,
  format = (n: number) => n.toLocaleString("pt-BR"),
  className,
  prefix,
  suffix,
}: {
  value: number;
  /** Segundos. O padrão é longo de propósito: contador rápido não se lê. */
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [atual, setAtual] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    let raf = 0;
    let cancelado = false;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observer.disconnect();

        const inicio = performance.now();
        const passo = (agora: number) => {
          if (cancelado) return;
          const p = Math.min(1, (agora - inicio) / (duration * 1000));
          // easeOutExpo: quase todo o movimento acontece no começo, então o
          // número "chega" cedo e os últimos dígitos assentam devagar.
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          setAtual(Math.round(value * eased));
          if (p < 1) raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      cancelado = true;
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  // `atual === null` = ainda não começou a contar (ou não vai). Mostra o valor
  // final, que é o que precisa estar no HTML para busca e leitor de tela.
  const mostrado = atual ?? value;

  return (
    <span ref={ref} className={cn2("tabular-nums", className)}>
      {prefix}
      {format(mostrado)}
      {suffix}
    </span>
  );
}

function cn2(...partes: (string | undefined)[]) {
  return partes.filter(Boolean).join(" ");
}
