"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { DUR, EASE, SHIFT, STAGGER, hasNativeScrollTimeline, prefersReducedMotion } from "@/lib/motion";

/**
 * Revelação ao rolar — só onde o navegador não faz sozinho.
 *
 * O CSS já revela `[data-reveal-item]` via `animation-timeline: view()`, que
 * roda no compositor e não custa nada de main thread. Este componente existe
 * apenas para o navegador que ainda não tem isso (Firefox hoje): ele confirma
 * a ausência do suporte, marca o documento e liga o ScrollTrigger.
 *
 * A ordem importa: se ligássemos o ScrollTrigger sempre, os navegadores
 * modernos pagariam custo de JS por um efeito que já teriam de graça — e o
 * pedido aqui era justamente que o scroll não travasse.
 *
 * O GSAP só é baixado quando realmente vai ser usado, via import dinâmico.
 */
export default function RevealProvider() {
  const pathname = usePathname();
  const ligado = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (hasNativeScrollTimeline()) return;

    let vivo = true;
    let matar: (() => void) | undefined;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!vivo) return;

      gsap.registerPlugin(ScrollTrigger);

      // Só esconde depois de ter o GSAP em mãos: se o import falhar, o
      // conteúdo continua visível em vez de sumir para sempre.
      document.documentElement.classList.add("bs-js-reveal");
      ligado.current = true;

      const lotes = ScrollTrigger.batch("[data-reveal-item], [data-reveal]", {
        start: "top 88%",
        // `once` mata o trigger depois de revelar. Numa listagem de 40 cards,
        // manter 40 triggers vivos para sempre é custo puro por um efeito que
        // já aconteceu.
        once: true,
        onEnter: (elementos) => {
          gsap.to(elementos, {
            opacity: 1,
            y: 0,
            duration: DUR.slow,
            ease: EASE.glide,
            stagger: STAGGER.grid,
            overwrite: true,
          });
        },
      });

      gsap.set("[data-reveal-item], [data-reveal]", { y: SHIFT, opacity: 0 });

      matar = () => {
        for (const t of lotes) t.kill();
        document.documentElement.classList.remove("bs-js-reveal");
      };
    })();

    return () => {
      vivo = false;
      matar?.();
    };
    // Refaz a cada navegação: o App Router troca o conteúdo sem desmontar o
    // provider, então os triggers antigos apontariam para elementos que já
    // saíram do DOM.
  }, [pathname]);

  return null;
}
