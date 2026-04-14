import Link from "next/link";
import { ArrowRight, Play, Shield, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--background)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[var(--primary)] text-xs font-semibold mb-8 animate-fade-in">
          <Zap className="w-3.5 h-3.5" />
          Campeonatos de CS2 com fairplay, bracket e ELO
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6 animate-slide-up">
          <span className="block text-[var(--foreground)]">Compita.</span>
          <span className="block text-[var(--foreground)]">Vença.</span>
          <span className="block text-gradient">Domine.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
          A plataforma brasileira de campeonatos de Counter-Strike 2. Monte seu time, inscreva em torneios e dispute ranking real.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Link href="/tournaments">
            <Button size="xl" variant="gradient" className="gap-2 font-bold">
              Participar agora
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/ranking">
            <Button size="xl" variant="outline" className="gap-2">
              <Play className="w-4 h-4" />
              Ver ranking
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {[
            { icon: Shield, label: "Anti-cheat e arbitragem" },
            { icon: Zap, label: "Brackets automáticos" },
            { icon: Trophy, label: "Premiação em PIX" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--muted-foreground)]">
              <item.icon className="w-3.5 h-3.5 text-[var(--primary)]" />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
    </section>
  );
}
