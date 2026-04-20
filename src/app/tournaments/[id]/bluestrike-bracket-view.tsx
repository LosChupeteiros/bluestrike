"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import type { Match } from "@/types";

// ── layout constants ──────────────────────────────────────────────────────────
const CW = 210;
const CH = 78;
const U  = 100;
const CG = 52;
const CT = CW + CG;

// ── helpers ───────────────────────────────────────────────────────────────────

function roundLabel(r: number, maxR: number): string {
  if (r === maxR) return "Final";
  if (r === maxR - 1 && maxR > 2) return "Semifinal";
  if (r === maxR - 2 && maxR > 3) return "Quartas";
  return `Rodada ${r}`;
}

function buildRounds(matches: Match[]): (Match | null)[][] {
  if (matches.length === 0) return [];

  const byRound = new Map<number, Match[]>();
  for (const m of matches) {
    const arr = byRound.get(m.round) ?? [];
    arr.push(m);
    byRound.set(m.round, arr);
  }

  for (const arr of byRound.values()) {
    arr.sort((a, b) => a.matchIndex - b.matchIndex);
  }

  const roundNums = [...byRound.keys()].sort((a, b) => a - b);
  const firstCount = byRound.get(roundNums[0])?.length ?? 0;
  const totalCols = firstCount > 0 ? Math.round(Math.log2(firstCount * 2)) : roundNums.length;

  const rounds: (Match | null)[][] = [];
  for (let i = 0; i < totalCols; i++) {
    const expected = Math.pow(2, totalCols - i - 1);
    const got = i < roundNums.length ? (byRound.get(roundNums[i]) ?? []) : [];
    const row: (Match | null)[] = got.slice(0, expected);
    while (row.length < expected) row.push(null);
    rounds.push(row);
  }
  return rounds;
}

// ── TeamRow ───────────────────────────────────────────────────────────────────

function TeamRow({
  tag,
  name,
  isWinner,
  hasResult,
}: {
  tag: string;
  name: string;
  isWinner: boolean;
  hasResult: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 ${
        isWinner && hasResult ? "bg-white/[0.03]" : ""
      }`}
    >
      <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border border-white/10 bg-[var(--secondary)] text-[7px] font-black text-[var(--primary)]">
        {tag ? tag.slice(0, 3).toUpperCase() : "?"}
      </div>
      <span
        className={`flex-1 truncate text-xs font-semibold leading-tight ${
          !name
            ? "italic text-[var(--muted-foreground)] opacity-50"
            : isWinner && hasResult
            ? "text-white"
            : "text-[var(--muted-foreground)]"
        }`}
      >
        {name || "A definir"}
      </span>
      {hasResult && isWinner && (
        <span className="shrink-0 text-[10px] font-black text-green-400">W</span>
      )}
    </div>
  );
}

// ── BracketMatchCard ──────────────────────────────────────────────────────────

function BracketMatchCard({
  match,
  tournamentId,
}: {
  match: Match | null;
  tournamentId: string;
}) {
  if (!match || (!match.team1Id && !match.team2Id)) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] opacity-40"
        style={{ width: CW, height: CH }}
      >
        <span className="text-[10px] text-[var(--muted-foreground)]">A definir</span>
      </div>
    );
  }

  const isLive    = match.status === "live";
  const finished  = match.status === "finished" || match.status === "walkover";
  const t1Won     = finished && match.winnerId === match.team1Id;
  const t2Won     = finished && match.winnerId === match.team2Id;
  const t1Name    = match.team1?.name ?? (match.team1Id ? "Time 1" : "");
  const t2Name    = match.team2?.name ?? (match.team2Id ? "Time 2" : "");
  const t1Tag     = match.team1?.tag ?? "T1";
  const t2Tag     = match.team2?.tag ?? "T2";

  const inner = (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-[var(--card)] transition-all duration-200 cursor-pointer hover:shadow-[0_2px_16px_rgba(0,200,255,0.10)] ${
        isLive
          ? "border-cyan-500/40"
          : "border-[var(--border)] hover:border-[var(--primary)]/40"
      }`}
      style={{ width: CW, height: CH }}
    >
      {isLive && (
        <div className="absolute left-0 right-0 top-0 h-[2px] animate-pulse bg-cyan-400" />
      )}
      <div className="flex h-full flex-col justify-center divide-y divide-[var(--border)]">
        <TeamRow tag={t1Tag} name={t1Name} isWinner={t1Won} hasResult={finished} />
        <TeamRow tag={t2Tag} name={t2Name} isWinner={t2Won} hasResult={finished} />
      </div>
    </div>
  );

  return (
    <Link href={`/tournaments/${tournamentId}/matches/${match.id}`}>
      {inner}
    </Link>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function BlueStrikeBracketView({
  matches,
  tournamentId,
}: {
  matches: Match[];
  tournamentId: string;
}) {
  if (matches.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
        As partidas ainda não foram geradas para este campeonato.
      </div>
    );
  }

  const rounds    = buildRounds(matches);
  const numRounds = rounds.length;
  const bracketH  = (rounds[0]?.length ?? 1) * U;
  const bracketW  = numRounds * CT - CG;

  type SvgPath = { d: string };
  const connectors: SvgPath[] = [];

  for (let r = 0; r < numRounds - 1; r++) {
    const slotH  = U * Math.pow(2, r);
    const nextN  = rounds[r + 1].length;
    const xRight = r * CT + CW;
    const xMid   = xRight + CG / 2;
    const xLeft  = (r + 1) * CT;

    for (let j = 0; j < nextN; j++) {
      const y0      = (j * 2) * slotH + slotH / 2;
      const y1      = (j * 2 + 1) * slotH + slotH / 2;
      const yTarget = (y0 + y1) / 2;
      connectors.push({ d: `M ${xRight} ${y0} H ${xMid} V ${y1}` });
      connectors.push({ d: `M ${xRight} ${y1} H ${xMid}` });
      connectors.push({ d: `M ${xMid} ${yTarget} H ${xLeft}` });
    }
  }

  const champion = matches.find(
    (m) =>
      m.round === numRounds &&
      (m.status === "finished" || m.status === "walkover") &&
      m.winnerId
  );
  const championTeam = champion
    ? (champion.winnerId === champion.team1Id ? champion.team1 : champion.team2)
    : null;

  return (
    <div className="space-y-6">
      {championTeam && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <Trophy className="h-5 w-5 text-yellow-400 shrink-0" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-yellow-400/70">Campeão</div>
            <div className="font-black text-yellow-400">{championTeam.name}</div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-[var(--primary)]">
            Eliminação Simples
          </span>
          <div className="h-px flex-1 rounded bg-gradient-to-r from-[var(--primary)]/30 to-transparent" />
        </div>

        <div className="mb-3 flex" style={{ width: bracketW }}>
          {rounds.map((_, r) => (
            <div
              key={r}
              className="shrink-0"
              style={{ width: CW, marginRight: r < numRounds - 1 ? CG : 0 }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {roundLabel(r + 1, numRounds)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", height: bracketH, width: bracketW }}>
          <svg
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
            width={bracketW}
            height={bracketH}
            aria-hidden="true"
          >
            {connectors.map((c, i) => (
              <path
                key={i}
                d={c.d}
                fill="none"
                stroke="rgba(0,200,255,0.25)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {rounds.map((roundMatches, r) => {
            const slotH = U * Math.pow(2, r);
            return roundMatches.map((match, i) => (
              <div
                key={`${r}-${i}`}
                style={{
                  position: "absolute",
                  top: i * slotH + (slotH - CH) / 2,
                  left: r * CT,
                }}
              >
                <BracketMatchCard match={match} tournamentId={tournamentId} />
              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
}
