import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, ChevronRight, Radio, Trophy } from "lucide-react";
import LivePlayerSection from "./live-player-section";

export const metadata: Metadata = {
  title: "Ao Vivo | BlueStrike",
  description: "Acompanhe ao vivo os campeonatos BlueStrike de CS2, partidas, premiações e grandes jogadas em tempo real.",
};

const TWITCH_CHANNEL = "gaules";

export default function LivePage() {
  return (
    <div className="bs-page min-h-screen pb-24 pt-20">
      <div className="bs-page-shell pt-8">
        <nav className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]" aria-label="Navegação estrutural">
          <Link href="/" className="hover:text-[var(--primary)]">Início</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--foreground)]">Ao vivo</span>
        </nav>

        <header className="mb-8 mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="bs-kicker">Broadcast oficial</div>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">BlueStrike ao vivo</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
              Acompanhe partidas, finais e momentos decisivos do circuito competitivo.
            </p>
          </div>
          <a href={`https://twitch.tv/${TWITCH_CHANNEL}`} target="_blank" rel="noreferrer noopener" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[var(--border-strong)] bg-white px-5 text-sm font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]">
            Abrir canal <ArrowRight className="h-4 w-4" />
          </a>
        </header>

        <LivePlayerSection channel={TWITCH_CHANNEL} />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <section className="bs-panel flex gap-4 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]"><Radio className="h-5 w-5" /></div>
            <div><div className="bs-kicker">Canal oficial</div><h2 className="mt-2 text-lg font-semibold">Toda a competição em um só lugar</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Fases classificatórias, playoffs e grandes finais com dados do ecossistema BlueStrike.</p></div>
          </section>
          <section className="bs-panel flex gap-4 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]"><Trophy className="h-5 w-5" /></div>
            <div><div className="bs-kicker">Programação</div><h2 className="mt-2 text-lg font-semibold">Encontre a próxima disputa</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">A agenda real de cada competição fica disponível no catálogo de campeonatos.</p><Link href="/tournaments" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">Ver campeonatos <ArrowRight className="h-4 w-4" /></Link></div>
          </section>
        </div>

        <section className="mt-12 flex flex-col items-start justify-between gap-6 border-y border-[var(--border)] py-10 sm:flex-row sm:items-center">
          <div className="flex gap-4"><Bell className="mt-1 h-5 w-5 text-[var(--primary)]" /><div><h2 className="text-2xl font-semibold tracking-[-0.03em]">Não perca a próxima partida</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">Siga o canal oficial para receber os avisos de transmissão.</p></div></div>
          <a href={`https://twitch.tv/${TWITCH_CHANNEL}`} target="_blank" rel="noreferrer noopener" className="inline-flex h-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]">Seguir @{TWITCH_CHANNEL}</a>
        </section>
      </div>
    </div>
  );
}
