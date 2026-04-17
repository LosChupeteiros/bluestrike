import type { Metadata } from "next";
import Link from "next/link";
import { Radio, Tv, Trophy } from "lucide-react";
import LivePlayerSection from "./live-player-section";

export const metadata: Metadata = {
  title: "Ao Vivo · BlueStrike",
  description: "Acompanhe ao vivo os campeonatos BlueStrike de CS2 — partidas, premiações e grandes jogadas em tempo real.",
};

export const TWITCH_CHANNEL = "gaules"; // altere para o canal real


export default function LivePage() {
  return (
    <div className="min-h-screen pb-24">
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(239,68,68,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">

        {/* ── Player + status (client) ─────────────────────────────────────── */}
        <LivePlayerSection channel={TWITCH_CHANNEL} />

        {/* ── Sobre + links ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-6 mb-14">
          <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-5">
            <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-3">
              <Radio className="w-3.5 h-3.5" />
              Canal oficial
            </div>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Acompanhe todos os campeonatos BlueStrike de CS2 ao vivo — fase de grupos,
              quartas, semifinais e grande final. Narração, análises e premiações em tempo real.
            </p>
          </div>

          <div className="sm:w-64 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-5 flex flex-col gap-3">
            <p className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Acompanhe também</p>
            <a
              href={`https://twitch.tv/${TWITCH_CHANNEL}`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100"
              style={{
                borderColor: "rgba(145,71,255,0.25)",
                backgroundColor: "rgba(145,71,255,0.07)",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#bf94ff" aria-hidden="true">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: "#bf94ff" }}>Twitch</span>
            </a>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 transition-colors hover:bg-[var(--primary)]/10"
            >
              <Trophy className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span className="text-sm font-semibold text-[var(--primary)]">Ver campeonatos</span>
            </Link>
          </div>
        </div>


        {/* ── CTA final ────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border px-8 py-12 text-center relative overflow-hidden"
          style={{
            borderColor: "rgba(145,71,255,0.18)",
            background: "linear-gradient(135deg, rgba(145,71,255,0.06) 0%, rgba(10,10,10,0) 60%)",
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl pointer-events-none"
            style={{ backgroundColor: "rgba(145,71,255,0.10)" }}
          />

          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span className="text-sm font-semibold text-[var(--muted-foreground)]">
                Transmissões toda semana
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] mb-2">
              Não perca nenhuma partida
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-8 max-w-sm mx-auto">
              Ative as notificações na Twitch e seja avisado quando os campeonatos estiverem ao vivo.
            </p>

            <a
              href={`https://twitch.tv/${TWITCH_CHANNEL}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: "#9147ff" }}
            >
              <Tv className="w-4 h-4" />
              Seguir @{TWITCH_CHANNEL}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
