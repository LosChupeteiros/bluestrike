import Link from "next/link";
import { Medal, Trophy } from "lucide-react";
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
    card: "border-amber-200 bg-amber-50",
    tag: "border-amber-300 bg-white text-amber-800",
    label: "1 lugar",
    accent: "text-amber-800",
    size: "h-20 w-20 text-xl",
    lift: "sm:-translate-y-3",
  },
  2: {
    card: "border-slate-200 bg-slate-50",
    tag: "border-slate-300 bg-white text-slate-700",
    label: "2 lugar",
    accent: "text-slate-700",
    size: "h-16 w-16 text-lg",
    lift: "",
  },
  3: {
    card: "border-orange-200 bg-orange-50",
    tag: "border-orange-300 bg-white text-orange-800",
    label: "3 lugar",
    accent: "text-orange-800",
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
        <div className="mt-1 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-bold text-[var(--foreground)]">
          {formatCurrency(entry.prize)}
        </div>
      )}

      <div className="flex min-h-20 flex-col items-center justify-center gap-1 overflow-visible">
        <Medal className={`h-9 w-9 ${style.accent}`} />
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
    <div className="bs-panel overflow-visible p-6">
      <h3 className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
        <Trophy className="h-4 w-4 text-[var(--primary)]" />
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
