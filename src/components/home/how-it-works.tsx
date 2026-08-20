"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

/**
 * Sequência real, então o numeral carrega informação.
 *
 * A trilha é ligada ao progresso de scroll da própria lista (não a degraus
 * discretos), então o traço acompanha o dedo. O marcador fica exatamente sobre
 * a linha: `left-4` + `-translate-x-1/2` centra os dois no mesmo eixo de 16px,
 * que é metade do marcador de 32px.
 */

const steps = [
  {
    title: "Monte seu time",
    body:
      "Crie a equipe, suba logo e banner, defina a senha de convite e distribua o link. O capitão controla quem entra e qual função cada um joga.",
    cta: "Criar time",
    href: "/teams/create",
  },
  {
    title: "Inscreva em um campeonato",
    body:
      "Escolha entre os torneios abertos e confira regras, premiação e formato antes de confirmar. A inscrição é por time completo: cinco titulares e um reserva opcional.",
    cta: "Ver campeonatos",
    href: "/tournaments",
  },
  {
    title: "Dispute e suba no ranking",
    body:
      "Check-in na janela da partida, servidor dedicado e chave atualizada sozinha. Cada resultado ajusta o ELO do time e de cada jogador no ranking global.",
    cta: "Ver ranking",
    href: "/ranking",
  },
];

/** Um segmento do medidor. Componente próprio para o hook não rodar em loop. */
function SegmentTick({
  progress,
  index,
  total,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const scaleX = useTransform(progress, [index / total, (index + 1) / total], [0, 1], { clamp: true });

  return (
    <span className="h-[3px] w-12 overflow-hidden rounded-full bg-line" aria-hidden="true">
      <motion.span className="block h-full w-full origin-left rounded-full bg-strike" style={{ scaleX }} />
    </span>
  );
}

export default function HowItWorks() {
  const listRef = React.useRef<HTMLOListElement>(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = React.useState(reduceMotion ? steps.length - 1 : -1);

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 72%", "end 65%"],
  });

  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const index = Math.min(steps.length - 1, Math.floor(value * steps.length + 0.18));
    setActive((current) => (index > current ? index : current));
  });

  React.useEffect(() => {
    if (reduceMotion) setActive(steps.length - 1);
  }, [reduceMotion]);

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-20">
        {/* Lado fixo */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal variant="mask">
            <h2 className="type-h2 text-ink">
              Do login à final
              <span className="text-ink-3"> em três passos.</span>
            </h2>
            <p className="type-body mt-5 max-w-[36ch]">
              Fluxo desenhado para o cenário brasileiro. Sem planilha compartilhada,
              sem call de organização, sem ruído no Discord.
            </p>
          </Reveal>

          <div className="mt-10 hidden items-center gap-3 lg:flex">
            {steps.map((step, index) => (
              <SegmentTick key={step.title} progress={scrollYProgress} index={index} total={steps.length} />
            ))}
            <span className="tabular ml-1 text-[11px] text-ink-3">
              {String(Math.max(1, active + 1)).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Trilha */}
        <ol ref={listRef} className="relative">
          {/* Cabo de fundo — mesmo eixo do marcador */}
          <span
            className="absolute bottom-8 left-4 top-4 w-px -translate-x-1/2 bg-line"
            aria-hidden="true"
          />
          {/* Preenchimento acompanhando o scroll */}
          <motion.span
            className="absolute bottom-8 left-4 top-4 w-px -translate-x-1/2 origin-top bg-strike"
            style={{ scaleY: fill }}
            aria-hidden="true"
          />

          {steps.map((step, index) => {
            const isActive = index <= active;

            return (
              <li key={step.title} className="relative pb-16 pl-14 last:pb-0 lg:min-h-[17rem] lg:pb-24">
                {/* Marcador — centrado no mesmo eixo de 16px da linha */}
                <span
                  className={cn(
                    "absolute left-4 top-1 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border bg-void",
                    "transition-colors duration-700 [transition-timing-function:var(--ease-out-quint)]",
                    isActive ? "border-strike/60" : "border-line"
                  )}
                  aria-hidden="true"
                >
                  <span
                    className="h-2 w-2 rounded-full transition-all duration-700 [transition-timing-function:var(--ease-out-quint)]"
                    style={{
                      background: isActive ? "var(--color-strike)" : "var(--color-line-2)",
                      transform: isActive ? "scale(1)" : "scale(0.55)",
                    }}
                  />
                </span>

                {/* O conteúdo acende conforme a trilha alcança o passo */}
                <div
                  style={{
                    opacity: isActive ? 1 : 0.42,
                    transform: isActive ? "translateY(0)" : "translateY(6px)",
                    transition:
                      "opacity 700ms var(--ease-out-quint), transform 700ms var(--ease-out-quint)",
                  }}
                >
                  <span
                    className="tabular block text-[11px] tracking-[0.12em] transition-colors duration-700"
                    style={{ color: isActive ? "var(--color-strike)" : "var(--color-ink-3)" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="type-h3 mt-2 text-ink">{step.title}</h3>

                  <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-2">
                    {step.body}
                  </p>

                  <Link
                    href={step.href}
                    prefetch
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-strike transition-[gap] duration-300 hover:gap-3.5"
                  >
                    {step.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
