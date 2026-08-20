"use client";

import * as React from "react";
import Link from "next/link";
import type { Team } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { PLACE_TONE } from "@/components/ui/place-badge";

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

/**
 * Pódio de verdade: os degraus têm alturas diferentes e sobem quando a seção
 * entra em cena. Sem emoji de medalha (renderiza diferente em cada sistema) e
 * sem degradê colorido — a hierarquia vem da altura e de um fio de cor no topo
 * de cada degrau.
 */

const STEP = {
  1: { height: "h-24", label: "1º lugar", order: "sm:order-2" },
  2: { height: "h-16", label: "2º lugar", order: "sm:order-1" },
  3: { height: "h-12", label: "3º lugar", order: "sm:order-3" },
} as const;

function useEnterOnce<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [entered, setEntered] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (item.isIntersecting) {
            setEntered(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, entered };
}

function PodiumColumn({ entry, entered, index }: { entry: PodiumEntry; entered: boolean; index: number }) {
  const step = STEP[entry.place];
  const tone = PLACE_TONE[entry.place - 1];
  const delay = `${index * 110}ms`;

  const head = (
    <div className="flex min-w-0 flex-col items-center gap-2.5 pb-4">
      <span
        className={cn(
          "flex items-center justify-center rounded-xl border font-display font-extrabold tracking-tight",
          entry.place === 1 ? "h-16 w-16 text-lg" : "h-14 w-14 text-base"
        )}
        style={{
          borderColor: `color-mix(in oklab, ${tone.ring} 45%, transparent)`,
          background: `color-mix(in oklab, ${tone.ring} 9%, transparent)`,
          color: tone.text,
        }}
      >
        {entry.team ? entry.team.tag : "—"}
      </span>

      <span className="min-w-0 text-center">
        <span className="block truncate font-display text-sm font-bold tracking-tight text-ink">
          {entry.team ? entry.team.name : "A definir"}
        </span>
        {entry.team && (
          <span className="tabular mt-0.5 block text-[11px] text-ink-3">{entry.team.elo} ELO</span>
        )}
      </span>

      {entry.prize > 0 && (
        <span className="tabular text-[13px] font-semibold" style={{ color: tone.text }}>
          {formatCurrency(entry.prize)}
        </span>
      )}
    </div>
  );

  const inner = (
    <div className="flex min-w-0 flex-col justify-end">
      {head}

      {/* Degrau */}
      <div
        className={cn("relative w-full overflow-hidden rounded-t-md bg-surface", step.height)}
        style={{
          transformOrigin: "bottom",
          transform: entered ? "scaleY(1)" : "scaleY(0.04)",
          opacity: entered ? 1 : 0,
          transition: `transform 900ms var(--ease-out-quint) ${delay}, opacity 500ms linear ${delay}`,
        }}
      >
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: tone.ring }}
          aria-hidden="true"
        />
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {step.label}
        </span>
      </div>
    </div>
  );

  if (!entry.team) {
    return <div className={cn("min-w-0", step.order)}>{inner}</div>;
  }

  return (
    <Link
      href={`/teams/${entry.team.slug}`}
      className={cn(
        "group min-w-0 transition-transform duration-500 [transition-timing-function:var(--ease-out-quint)] hover:-translate-y-1",
        step.order
      )}
    >
      {inner}
    </Link>
  );
}

export default function TournamentPodium({ title, entries, showPendingCopy }: TournamentPodiumProps) {
  const { ref, entered } = useEnterOnce<HTMLDivElement>();
  const byPlace = new Map(entries.map((entry) => [entry.place, entry]));
  const ordered = [1, 2, 3].map(
    (place) =>
      byPlace.get(place as 1 | 2 | 3) ?? { place: place as 1 | 2 | 3, team: null, prize: 0 }
  );

  return (
    <div ref={ref} className="rounded-xl border border-white/[0.07] bg-abyss p-6">
      <h3 className="font-display text-sm font-bold tracking-tight text-ink">{title}</h3>

      <div className="mt-6 grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
        {ordered.map((entry, index) => (
          <PodiumColumn key={entry.place} entry={entry} entered={entered} index={index} />
        ))}
      </div>

      {showPendingCopy && (
        <p className="mt-6 border-t border-line/60 pt-4 text-center text-[13px] text-ink-3">
          O pódio será revelado ao final do campeonato.
        </p>
      )}
    </div>
  );
}
