import Link from "next/link";
import { Trophy } from "lucide-react";
import type { Team } from "@/types";
import { formatCurrency } from "@/lib/utils";

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
    card: "border-yellow-500/35 bg-yellow-500/10 shadow-[0_0_28px_rgba(234,179,8,0.16)]",
    tag: "border-yellow-500/60 bg-yellow-500/10 text-yellow-300 shadow-[0_0_24px_rgba(234,179,8,0.2)]",
    medal: "🥇",
    label: "1 lugar",
    accent: "text-yellow-300",
    size: "h-20 w-20 text-xl",
    lift: "sm:-translate-y-3",
  },
  2: {
    card: "border-slate-400/25 bg-slate-400/10",
    tag: "border-slate-400/40 bg-slate-400/10 text-slate-300",
    medal: "🥈",
    label: "2 lugar",
    accent: "text-slate-300",
    size: "h-16 w-16 text-lg",
    lift: "",
  },
  3: {
    card: "border-orange-600/25 bg-orange-600/10",
    tag: "border-orange-600/30 bg-orange-600/10 text-orange-300",
    medal: "🥉",
    label: "3 lugar",
    accent: "text-orange-300",
    size: "h-16 w-16 text-lg",
    lift: "",
  },
} as const;

function PodiumColumn({ entry }: { entry: PodiumEntry }) {
  const style = STYLE_BY_PLACE[entry.place];
  const teamContent = (
    <>
      <div className={`flex ${style.size} items-center justify-center rounded-2xl border-2 font-black ${style.tag}`}>
        {entry.team ? entry.team.tag : "?"}
      </div>
      <div className="min-w-0 text-center">
        <div className={`truncate text-sm font-black ${style.accent}`}>
          {entry.team ? entry.team.name : "-"}
        </div>
        {entry.team && <div className="text-xs text-[var(--muted-foreground)]">{entry.team.elo} ELO</div>}
      </div>
    </>
  );

  const body = (
    <div className="flex min-w-0 flex-col items-center gap-3">
      {teamContent}

      {entry.prize > 0 && (
        <div className="mt-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-[var(--foreground)]">
          {formatCurrency(entry.prize)}
        </div>
      )}

      <div className="flex min-h-20 flex-col items-center justify-center gap-1 overflow-visible">
        <div className="text-5xl leading-normal drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
          {style.medal}
        </div>
        <div className={`text-xs font-black uppercase tracking-wider ${style.accent}`}>{style.label}</div>
      </div>
    </div>
  );

  return entry.team ? (
    <Link
      href={`/teams/${entry.team.slug}`}
      className={`group min-w-0 rounded-2xl border p-4 transition-all hover:-translate-y-1 hover:border-[var(--primary)]/40 ${style.card} ${style.lift}`}
    >
      {body}
    </Link>
  ) : (
    <div className={`min-w-0 rounded-2xl border p-4 ${style.card} ${style.lift}`}>
      {body}
    </div>
  );
}

export default function TournamentPodium({ title, entries, showPendingCopy }: TournamentPodiumProps) {
  const byPlace = new Map(entries.map((entry) => [entry.place, entry]));
  const ordered = [2, 1, 3].map((place) => byPlace.get(place as 1 | 2 | 3) ?? {
    place: place as 1 | 2 | 3,
    team: null,
    prize: 0,
  });

  return (
    <div className="overflow-visible rounded-xl border border-yellow-500/15 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent p-6">
      <h3 className="mb-6 flex items-center gap-2 text-sm font-bold text-yellow-300">
        <Trophy className="h-4 w-4 text-yellow-400" />
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end sm:pt-3">
        {ordered.map((entry) => (
          <PodiumColumn key={entry.place} entry={entry} />
        ))}
      </div>
      {showPendingCopy && (
        <p className="mt-5 text-center text-xs text-[var(--muted-foreground)]">
          O podio sera revelado ao final do campeonato.
        </p>
      )}
    </div>
  );
}
