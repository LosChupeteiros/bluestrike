"use client";

import Link from "next/link";
import { ArrowRight, Play, Shield, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--background)]" />

      {/* Animated blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "0s" }} />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 left-10 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />

      {/* Live indicator */}
      <div className="absolute top-24 right-6 sm:right-10 flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        1 Partida Ao Vivo
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Tag line */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[var(--primary)] text-xs font-semibold mb-8 animate-fade-in">
          <Zap className="w-3.5 h-3.5" />
          Plataforma #1 de CS2 no Brasil
        </div>

        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6 animate-slide-up">
          <span className="block text-[var(--foreground)]">Compita.</span>
          <span className="block text-[var(--foreground)]">Vença.</span>
          <span className="block text-gradient">Domine.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
          A plataforma definitiva para campeonatos de Counter-Strike 2. Inscreva seu time, dispute os melhores torneios e conquiste sua glória no cenário competitivo brasileiro.
        </p>

        {/* CTA Buttons */}
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

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)] max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {[
            { value: "12.847", label: "Jogadores" },
            { value: "R$ 485K", label: "Em prêmios" },
            { value: "156", label: "Campeonatos" },
            { value: "4.230", label: "Partidas" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--card)] px-6 py-5 text-center">
              <div className="text-2xl font-black text-[var(--primary)] mb-0.5">{stat.value}</div>
              <div className="text-xs text-[var(--muted-foreground)] font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-10 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          {[
            { icon: Shield, label: "Anti-cheat" },
            { icon: Zap, label: "Brackets automáticos" },
            { icon: Trophy, label: "Premiações reais" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <item.icon className="w-3.5 h-3.5 text-[var(--primary)]" />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
    </section>
  );
}
