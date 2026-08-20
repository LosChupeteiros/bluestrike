import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { BracketFlow, MapVeto, PixPayout, SkinsUnlocked } from "./platform-widgets";

/**
 * Bento — 12 colunas, fluxo denso, zero célula morta:
 *   linha 1 → chave(7) + pix(5)           = 12
 *   linha 2 → chave continua(7) + veto(5) = 12
 *   linha 3 → skins(12)                   = 12
 *
 * Cada célula carrega só o título. A descrição saiu de propósito: era texto de
 * preenchimento, e o espaço vale mais para a animação, que explica sozinha.
 */

interface CellProps {
  className?: string;
  visual: React.ReactNode;
  title: string;
  visualClassName?: string;
  /** "split" põe o título ao lado do visual — para células largas. */
  orientation?: "stacked" | "split";
}

function Cell({ className, visual, title, visualClassName, orientation = "stacked" }: CellProps) {
  const label = (
    <div
      className={cn(
        "shrink-0 border-white/[0.06]",
        orientation === "split"
          ? "border-t px-6 py-5 lg:w-[17rem] lg:border-r lg:border-t-0 lg:py-6"
          : "border-t px-6 py-5"
      )}
    >
      <h3 className="font-display text-[1rem] font-bold tracking-[-0.02em] text-ink">{title}</h3>
    </div>
  );

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-xl border border-white/[0.07] bg-abyss",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        "transition-colors duration-500 [transition-timing-function:var(--ease-out-quint)] hover:border-white/[0.14]",
        orientation === "split" ? "flex-col-reverse lg:flex-row lg:items-center" : "flex-col",
        className
      )}
    >
      {orientation === "split" && label}
      <div className={cn("flex min-h-0 min-w-0 flex-1 items-center p-6", visualClassName)}>{visual}</div>
      {orientation === "stacked" && label}
    </article>
  );
}

export default function PlatformGrid() {
  return (
    <section className="relative border-y border-line/60 bg-void">
      <div className="reticle-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
        <Reveal variant="mask" className="max-w-4xl">
          <h2 className="type-h2 text-ink">
            Você joga.
            <span className="block text-ink-3">O resto acontece sozinho.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-flow-dense grid-cols-1 gap-3 lg:auto-rows-[13.5rem] lg:grid-cols-12">
          <Reveal delay={0.05} className="lg:col-span-7 lg:row-span-2">
            <Cell
              className="h-full"
              visualClassName="p-5"
              visual={<BracketFlow />}
              title="Chave gerada automaticamente"
            />
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-5">
            <Cell className="h-full" visual={<PixPayout />} title="Premiação em PIX na hora" />
          </Reveal>

          <Reveal delay={0.19} className="lg:col-span-5">
            <Cell
              className="h-full"
              visualClassName="p-4"
              visual={<MapVeto />}
              title="Veto de mapa no navegador"
            />
          </Reveal>

          <Reveal delay={0.26} className="lg:col-span-12">
            <Cell
              className="h-full"
              orientation="split"
              visualClassName="p-4"
              visual={<SkinsUnlocked />}
              title="Todas as skins liberadas"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
