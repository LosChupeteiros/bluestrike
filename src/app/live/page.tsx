import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, Radio, ShieldCheck, Trophy } from "lucide-react";
import LivePlayerSection from "./live-player-section";

export const metadata: Metadata = {
  title: "Ao Vivo · BlueStrike",
  description: "Acompanhe ao vivo os campeonatos BlueStrike de CS2 — partidas, premiações e grandes jogadas em tempo real.",
};

const TWITCH_CHANNEL = process.env.NEXT_PUBLIC_TWITCH_CHANNEL ?? "gaules";

export default function LivePage() {
  return (
    <div className="bs-page pb-24 pt-28">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_68%)]" />
      </div>

      <div className="bs-shell relative z-10">
        <header className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="bs-eyebrow mb-4 text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Central ao vivo
            </div>
            <h1 className="bs-display max-w-3xl text-5xl sm:text-6xl lg:text-7xl">
              A transmissão é parte da <span className="text-[var(--primary)]">competição.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
              Partidas oficiais, decisões de mapa e momentos que movimentam o circuito BlueStrike — em um player feito para manter o jogo no centro.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="bs-panel p-5">
              <Radio className="mb-6 h-5 w-5 text-red-400" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Canal oficial</p>
              <p className="mt-2 text-lg font-black text-[var(--foreground)]">@{TWITCH_CHANNEL}</p>
            </div>
            <div className="bs-panel p-5">
              <ShieldCheck className="mb-6 h-5 w-5 text-[var(--primary)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Cobertura</p>
              <p className="mt-2 text-lg font-black text-[var(--foreground)]">CS2 oficial</p>
            </div>
          </div>
        </header>

        <LivePlayerSection channel={TWITCH_CHANNEL} />

        <section className="mt-8 grid gap-5 lg:grid-cols-12">
          <div className="bs-panel p-6 sm:p-8 lg:col-span-8">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <div className="bs-eyebrow mb-3"><Trophy className="h-3.5 w-3.5" /> Circuito BlueStrike</div>
                <h2 className="text-2xl font-black text-[var(--foreground)] sm:text-3xl">Do veto à grande final</h2>
              </div>
              <span className="hidden rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-foreground)] sm:inline-flex">
                status automático
              </span>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              O status acima acompanha o canal em tempo real. Quando a transmissão estiver offline, consulte os campeonatos para ver confrontos, horários e chaveamentos publicados pela organização.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tournaments" className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-black text-black transition-transform hover:-translate-y-0.5">
                Explorar campeonatos <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href={`https://twitch.tv/${TWITCH_CHANNEL}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 rounded-xl border border-[#9147ff]/35 bg-[#9147ff]/10 px-5 py-3 text-sm font-black text-[#bf94ff] transition-colors hover:bg-[#9147ff]/15">
                Abrir na Twitch <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <aside className="bs-panel p-6 sm:p-8 lg:col-span-4">
            <CalendarClock className="h-6 w-6 text-[var(--primary)]" />
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">Próximas partidas</p>
            <h2 className="mt-3 text-2xl font-black text-[var(--foreground)]">Agenda baseada nos dados reais.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
              Os horários exibidos na plataforma vêm dos campeonatos e partidas cadastrados no BlueStrike.
            </p>
            <Link href="/matches" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[var(--primary)]">
              Ver central de partidas <ArrowUpRight className="h-4 w-4" />
            </Link>
          </aside>
        </section>
      </div>
    </div>
  );
}
