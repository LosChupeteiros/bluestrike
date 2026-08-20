import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Medal,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  isLoggedIn?: boolean;
}

const metrics = [
  { icon: Users, value: "28.450", label: "Jogadores" },
  { icon: ShieldCheck, value: "1.250", label: "Times" },
  { icon: Trophy, value: "342", label: "Campeonatos" },
  { icon: Medal, value: "R$ 410 mil", label: "Em premiações" },
];

export default function Hero({ isLoggedIn = false }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#f8fbff] pt-16">
      <div className="bs-page-shell relative grid min-h-[560px] items-center gap-10 py-8 md:min-h-[580px] md:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="bs-hero-copy relative z-10 max-w-[640px] py-8 text-left">
          <h1 className="max-w-[640px] text-[clamp(3.25rem,5.2vw,5.75rem)] font-black leading-[0.94] tracking-[-0.04em] text-[var(--foreground)]">
            Seu próximo
            <span className="block">desafio começa</span>
            <span className="block text-[var(--primary)]">aqui.</span>
          </h1>
          <p className="mt-7 max-w-[54ch] text-base leading-7 text-[var(--muted-foreground)] md:text-lg">
            Compita em campeonatos de CS2 com seriedade, fair play e reconhecimento dentro da comunidade brasileira.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-52">
              <Link href="/tournaments">
                Explorar campeonatos
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-w-40">
              <Link href="/ranking">Ver ranking</Link>
            </Button>
          </div>
          {isLoggedIn && (
            <p className="mt-5 text-sm font-medium text-[var(--muted-foreground)]">
              Sua conta está pronta. Encontre a próxima disputa do seu time.
            </p>
          )}
        </div>

        <div className="bs-hero-visual relative min-h-[420px] md:min-h-[500px]" aria-label="Campanha competitiva BlueStrike">
          <div className="absolute inset-[9%_2%_4%_12%] bg-[var(--primary)] [clip-path:polygon(31%_0,100%_18%,84%_100%,0_85%)]" />
          <div className="absolute inset-[4%_0_0_7%] opacity-90 [clip-path:polygon(18%_0,100%_12%,88%_100%,0_89%)]">
            <Image
              src="/assets/banner_bluestrike_home.png"
              alt="Equipamento competitivo em destaque na campanha BlueStrike"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 767px) 100vw, 55vw"
              className="object-cover object-center contrast-110 saturate-75"
            />
            <div className="absolute inset-0 bg-[#06152b]/45" />
          </div>
          <div className="absolute right-[3%] top-[2%] h-[72%] w-[72%] rounded-full border border-[var(--primary)]/25" />
          <div className="absolute right-[13%] top-[12%] h-[52%] w-[52%] rounded-full border border-white/35" />
          <div className="absolute bottom-[9%] left-[3%] h-3 w-3 bg-[var(--brand-cyan)]" />
          <div className="absolute right-[4%] top-[44%] h-10 w-1 bg-white/70" />
        </div>
      </div>

      <div className="bs-page-shell relative z-20 -mb-10 -translate-y-7">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] shadow-[var(--shadow-float)] md:grid-flow-dense md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex min-h-28 items-center gap-4 bg-white px-5 py-5 md:px-7">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
                <metric.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="font-mono text-xl font-bold tracking-[-0.04em] text-[var(--foreground)] lg:text-2xl">
                  {metric.value}
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                  {metric.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
