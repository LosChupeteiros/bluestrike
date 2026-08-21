import Image from "next/image";
import Link from "next/link";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import type { Team } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";

interface PodiumEntry {
  place: 1 | 2 | 3;
  team: Team | null;
  prize: number;
}

interface TournamentPodiumProps {
  title: string;
  entries: PodiumEntry[];
  showPendingCopy?: boolean;
}

const STYLE_BY_PLACE = {
  1: {
    label: "Campeão",
    icon: Crown,
    accent: "#f5c842",
    ring: "ring-[#f5c842]/50",
    glow: "shadow-[0_0_44px_rgba(245,200,66,0.18)]",
    pedestal: "h-24 sm:h-32",
    crest: "h-20 w-20 text-xl",
    order: "order-1 sm:order-2",
  },
  2: {
    label: "Vice",
    icon: Medal,
    accent: "#c7d2da",
    ring: "ring-[#c7d2da]/35",
    glow: "",
    pedestal: "h-16 sm:h-24",
    crest: "h-16 w-16 text-base",
    order: "order-2 sm:order-1",
  },
  3: {
    label: "3º lugar",
    icon: Award,
    accent: "#e08a4a",
    ring: "ring-[#e08a4a]/35",
    glow: "",
    pedestal: "h-12 sm:h-16",
    crest: "h-16 w-16 text-base",
    order: "order-3",
  },
} as const;

function PodiumColumn({ entry, index }: { entry: PodiumEntry; index: number }) {
  const style = STYLE_BY_PLACE[entry.place];
  const Icon = style.icon;
  const accent = style.accent;

  const body = (
    <>
      {/* Brasão do time */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-2xl border bg-[#06090e] font-black ring-2",
            style.crest,
            style.ring,
            style.glow
          )}
          style={{ borderColor: `color-mix(in srgb, ${accent} 32%, transparent)`, color: accent }}
        >
          {entry.team?.logoUrl ? (
            <Image
              src={entry.team.logoUrl}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-contain p-2"
              unoptimized
            />
          ) : (
            (entry.team?.tag ?? "—")
          )}
        </div>

        <span
          className="absolute -bottom-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[var(--card)]"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        >
          <Icon className="h-3.5 w-3.5 text-black" />
        </span>
      </div>

      {/* Identidade */}
      <div className="mt-5 min-w-0 w-full text-center">
        <p
          className="truncate text-sm font-black tracking-tight transition-colors"
          style={{ color: entry.team ? accent : undefined }}
          title={entry.team?.name}
        >
          {entry.team?.name ?? "A definir"}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">
          {entry.team ? `${entry.team.elo} ELO` : "—"}
        </p>
      </div>

      {entry.prize > 0 && (
        <div
          className="mt-3 w-full rounded-lg border bg-black/25 px-3 py-2 text-center"
          style={{ borderColor: `color-mix(in srgb, ${accent} 24%, transparent)` }}
        >
          <span className="block font-mono text-sm font-black tabular-nums" style={{ color: accent }}>
            {formatCurrency(entry.prize)}
          </span>
          <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Prêmio no PIX
          </span>
        </div>
      )}

      {/* Degrau */}
      <div
        className={cn(
          "mt-4 flex w-full items-start justify-center rounded-t-xl border-x border-t pt-3",
          style.pedestal
        )}
        style={{
          borderColor: `color-mix(in srgb, ${accent} 26%, transparent)`,
          background: `linear-gradient(to bottom, color-mix(in srgb, ${accent} 14%, transparent), transparent)`,
        }}
      >
        <span className="font-mono text-3xl font-black leading-none" style={{ color: `color-mix(in srgb, ${accent} 70%, transparent)` }}>
          {entry.place}
        </span>
      </div>
    </>
  );

  const shell = cn(
    "bs-podium-step flex min-w-0 flex-col items-center",
    style.order
  );

  return (
    <div className={shell} style={{ animationDelay: `${index * 110}ms` }}>
      {entry.team ? (
        <Link
          href={`/teams/${entry.team.slug}`}
          className="group flex w-full min-w-0 flex-col items-center rounded-2xl p-2 transition-transform duration-300 hover:-translate-y-1"
        >
          {body}
        </Link>
      ) : (
        <div className="flex w-full min-w-0 flex-col items-center p-2 opacity-55">{body}</div>
      )}
    </div>
  );
}

export default function TournamentPodium({ title, entries, showPendingCopy }: TournamentPodiumProps) {
  const byPlace = new Map(entries.map((entry) => [entry.place, entry]));
  const ordered = ([1, 2, 3] as const).map(
    (place) => byPlace.get(place) ?? { place, team: null, prize: 0 }
  );
  const totalPrize = ordered.reduce((sum, entry) => sum + entry.prize, 0);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#f5c842]/18 bg-[var(--card)]">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(245,200,66,0.12),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#f5c842]">
          <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
          {title}
        </h3>
        {totalPrize > 0 && (
          <span className="font-mono text-sm font-black tabular-nums text-[#f5c842]">
            {formatCurrency(totalPrize)}
          </span>
        )}
      </div>

      <div className="relative grid grid-cols-1 gap-4 px-5 pb-0 pt-8 sm:grid-cols-3 sm:items-end sm:gap-2 sm:px-6">
        {ordered.map((entry, index) => (
          <PodiumColumn key={entry.place} entry={entry} index={index} />
        ))}
      </div>

      {/* Base do pódio */}
      <div className="relative h-2 bg-gradient-to-r from-transparent via-[#f5c842]/25 to-transparent" aria-hidden="true" />

      {showPendingCopy && (
        <p className="relative border-t border-[var(--border)] px-5 py-3 text-center text-xs text-[var(--muted-foreground)]">
          O pódio é revelado ao final do campeonato.
        </p>
      )}
    </section>
  );
}
