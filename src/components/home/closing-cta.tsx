import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

interface ClosingCtaProps {
  isLoggedIn?: boolean;
}

/** The brand line, kept alive as kinetic type instead of a static tagline. */
function BrandRail() {
  const words = ["Desafie", "Supere", "Domine"];

  return (
    <Marquee speed={38} className="py-2">
      {[0, 1].map((pass) => (
        <span key={pass} className="flex items-center">
          {words.map((word, index) => (
            <span key={`${pass}-${word}`} className="flex items-center">
              <span
                className={cn(
                  "font-display text-[clamp(2.5rem,7vw,5rem)] font-extrabold uppercase leading-none tracking-[-0.04em]",
                  index === 2 ? "text-ink/90" : "text-transparent"
                )}
                style={
                  index === 2
                    ? undefined
                    : { WebkitTextStroke: "1px var(--color-line-2)" }
                }
              >
                {word}
              </span>
              <span className="mx-6 h-2 w-2 shrink-0 rotate-45 bg-strike/70 sm:mx-9" aria-hidden="true" />
            </span>
          ))}
        </span>
      ))}
    </Marquee>
  );
}

export default function ClosingCta({ isLoggedIn = false }: ClosingCtaProps) {
  return (
    <section className="relative overflow-hidden border-t border-line/60">
      {/* Brand light, committed: the surface itself carries the colour */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 90% at 50% 118%, color-mix(in oklab, var(--color-strike) 11%, transparent), transparent 62%)",
        }}
        aria-hidden="true"
      />
      <div className="reticle-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative pt-24 lg:pt-32">
        <div aria-hidden="true" className="select-none">
          <BrandRail />
        </div>

        <div className="mx-auto w-full max-w-[1360px] px-4 pb-28 pt-20 text-center sm:px-6 lg:px-8 lg:pb-40 lg:pt-24">
          <Reveal variant="mask" className="mx-auto max-w-3xl">
            <h2 className="type-h2 text-ink">
              {isLoggedIn ? "Sua próxima final começa agora." : "Entre, monte a line e jogue valendo."}
            </h2>
            <p className="type-body mx-auto mt-5 text-center">
              {isLoggedIn
                ? "Confira os campeonatos abertos, feche o time e garanta a vaga antes do fechamento das inscrições."
                : "Login com Steam em um clique. Crie o time, escolha o campeonato e dispute premiação paga em PIX."}
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic strength={0.3} className="w-full sm:w-auto">
              <Link href={isLoggedIn ? "/tournaments" : "/auth/login"} className="block">
                <Button variant="gradient" size="xl" className="w-full gap-2 sm:w-auto">
                  {isLoggedIn ? "Ver campeonatos abertos" : "Entrar com Steam"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </Magnetic>

            <Link href="/teams" className="w-full sm:w-auto">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Explorar times
              </Button>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
