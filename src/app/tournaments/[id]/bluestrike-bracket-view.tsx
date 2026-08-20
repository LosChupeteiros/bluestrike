"use client";

import Link from "next/link";
import { PlaceBadge } from "@/components/ui/place-badge";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Match } from "@/types";
import { getBracketRoundLabel, getBracketRoundModel, isFinalRound, isThirdPlaceRound, type BracketRoundModel } from "@/lib/bracket-model";

// ── layout constants ──────────────────────────────────────────────────────────
const CW = 210;
const CH = 78;
const U  = 100;
const CG = 52;
const CT = CW + CG;

// ── helpers ───────────────────────────────────────────────────────────────────

function expectedMatchCount(round: number, model: BracketRoundModel): number {
  if (isFinalRound(round, model) || isThirdPlaceRound(round, model)) return 1;
  const lastNormalRound = model.semifinalRound ?? model.finalRound;
  return Math.max(1, Math.pow(2, lastNormalRound - round + 1));
}

function buildRounds(matches: Match[], model: BracketRoundModel): (Match | null)[][] {
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

  const rounds: (Match | null)[][] = [];
  for (let round = 1; round <= model.finalRound; round++) {
    const expected = expectedMatchCount(round, model);
    const got = byRound.get(round) ?? [];
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
  score,
}: {
  tag: string;
  name: string;
  isWinner: boolean;
  hasResult: boolean;
  score?: number | null;
}) {
  const won = hasResult && isWinner;

  return (
    <div className={`flex items-center gap-2 px-2.5 py-2 ${won ? "bg-strike/[0.07]" : ""}`}>
      <span
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded border font-mono text-[8px] font-bold ${
          won
            ? "border-strike/45 bg-strike/12 text-strike"
            : "border-line bg-surface text-ink-3"
        }`}
      >
        {tag ? tag.slice(0, 3).toUpperCase() : "?"}
      </span>

      <span
        className={`flex-1 truncate text-xs font-semibold leading-tight ${
          !name ? "text-ink-3/60" : won ? "text-ink" : hasResult ? "text-ink-3" : "text-ink-2"
        }`}
      >
        {name || "A definir"}
      </span>

      {hasResult && score !== null && score !== undefined && (
        <span className={`tabular shrink-0 text-[11px] font-semibold ${won ? "text-strike" : "text-ink-3"}`}>
          {score}
        </span>
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
        className="flex items-center justify-center rounded-lg border border-dashed border-line bg-abyss/60"
        style={{ width: CW, height: CH }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3/70">A definir</span>
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

  // Placar da série derivado dos mapas, quando eles vierem no join.
  const playedMaps = match.maps ?? [];
  const t1Maps = playedMaps.length
    ? playedMaps.filter((map) => map.winnerId && map.winnerId === match.team1Id).length
    : null;
  const t2Maps = playedMaps.length
    ? playedMaps.filter((map) => map.winnerId && map.winnerId === match.team2Id).length
    : null;

  const inner = (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-abyss transition-all duration-300 [transition-timing-function:var(--ease-out-quint)] hover:-translate-y-px ${
        isLive ? "border-strike/45" : "border-white/[0.07] hover:border-white/[0.18]"
      }`}
      style={{ width: CW, height: CH }}
    >
      {isLive && (
        <div className="animate-breathe absolute inset-x-0 top-0 h-px bg-strike" />
      )}
      <div className="flex h-full flex-col justify-center divide-y divide-line/70">
        <TeamRow tag={t1Tag} name={t1Name} isWinner={t1Won} hasResult={finished} score={t1Maps} />
        <TeamRow tag={t2Tag} name={t2Name} isWinner={t2Won} hasResult={finished} score={t2Maps} />
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
  teamCount,
  isAdmin,
}: {
  matches: Match[];
  tournamentId: string;
  teamCount: number;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [fixing, setFixing] = useState(false);
  const [fixMsg, setFixMsg] = useState<string | null>(null);

  async function handleFixBracket() {
    setFixing(true);
    setFixMsg(null);
    const res = await fetch(`/api/admin/tournaments/${tournamentId}/fix-bracket`, { method: "POST" });
    const d = await res.json().catch(() => ({})) as { fixed?: number; error?: string };
    setFixMsg(res.ok ? `${d.fixed ?? 0} partida(s) corrigida(s)` : (d.error ?? "Erro"));
    if (res.ok) router.refresh();
    setFixing(false);
  }

  if (matches.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
        As partidas ainda não foram geradas para este campeonato.
      </div>
    );
  }

  const model = getBracketRoundModel(teamCount);
  const rounds    = buildRounds(matches, model);
  const numRounds = rounds.length;
  const bracketH  = (rounds[0]?.length ?? 1) * U;
  const bracketW  = numRounds * CT - CG;

  type SvgPath = { d: string; stroke?: string; dash?: string };
  const connectors: SvgPath[] = [];

  function cardTop(roundColumn: number, index: number): number {
    const roundNumber = roundColumn + 1;
    if (isFinalRound(roundNumber, model)) return bracketH / 2 - CH / 2;
    if (isThirdPlaceRound(roundNumber, model)) return bracketH / 2 - CH / 2;
    const count = Math.max(1, rounds[roundColumn]?.length ?? 1);
    const slotH = bracketH / count;
    return index * slotH + (slotH - CH) / 2;
  }

  function cardCenter(roundColumn: number, index: number): number {
    return cardTop(roundColumn, index) + CH / 2;
  }

  for (let r = 0; r < numRounds - 1; r++) {
    const nextRound = r + 2;
    if (isThirdPlaceRound(r + 1, model) || isFinalRound(r + 1, model)) continue;

    const xRight = r * CT + CW;
    const xMid   = xRight + CG / 2;
    const xLeft  = (r + 1) * CT;

    if (isThirdPlaceRound(nextRound, model)) {
      const thirdXLeft = (model.thirdPlaceRound! - 1) * CT;
      const finalXLeft = (model.finalRound - 1) * CT;
      const thirdY = cardCenter(model.thirdPlaceRound! - 1, 0);
      const finalY = cardCenter(model.finalRound - 1, 0);

      for (let j = 0; j < rounds[r].length; j++) {
        const y = cardCenter(r, j);
        connectors.push({
          d: `M ${xRight} ${y} H ${xMid} V ${finalY} H ${finalXLeft}`,
          stroke: "rgba(0,200,255,0.24)",
        });
        connectors.push({
          d: `M ${xRight} ${y} H ${xMid} V ${thirdY} H ${thirdXLeft}`,
          stroke: "rgba(251,146,60,0.30)",
          dash: "4 4",
        });
      }
      continue;
    }

    const nextN  = rounds[r + 1].length;
    for (let j = 0; j < nextN; j++) {
      const y0      = cardCenter(r, j * 2);
      const y1      = cardCenter(r, j * 2 + 1);
      const yTarget = (y0 + y1) / 2;
      connectors.push({ d: `M ${xRight} ${y0} H ${xMid} V ${y1}` });
      connectors.push({ d: `M ${xRight} ${y1} H ${xMid}` });
      connectors.push({ d: `M ${xMid} ${yTarget} H ${xLeft}` });
    }
  }

  const champion = matches.find(
    (m) =>
      m.round === model.finalRound &&
      (m.status === "finished" || m.status === "walkover") &&
      m.winnerId
  );
  const championTeam = champion
    ? (champion.winnerId === champion.team1Id ? champion.team1 : champion.team2)
    : null;

  return (
    <div className="space-y-6">
      {championTeam && (
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-abyss px-5 py-4">
          <PlaceBadge place={1} size="lg" />
          <div className="min-w-0">
            <span className="tick block">Campeão</span>
            <span className="mt-1 block truncate font-display text-lg font-bold tracking-tight text-prize">
              {championTeam.name}
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="tick text-strike">Eliminação Simples</span>
          <div className="hairline flex-1" />
        </div>

        <div className="mb-3 flex" style={{ width: bracketW }}>
          {rounds.map((_, r) => (
            <div
              key={r}
              className="shrink-0"
              style={{ width: CW, marginRight: r < numRounds - 1 ? CG : 0 }}
            >
              <span className="tick">{getBracketRoundLabel(r + 1, model)}</span>
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
                stroke={c.stroke ?? "rgba(0,200,255,0.25)"}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={c.dash}
              />
            ))}
          </svg>

          {rounds.map((roundMatches, r) => {
            return roundMatches.map((match, i) => (
              <div
                key={`${r}-${i}`}
                style={{
                  position: "absolute",
                  top: cardTop(r, i),
                  left: r * CT,
                }}
              >
                <BracketMatchCard match={match} tournamentId={tournamentId} />
              </div>
            ));
          })}
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleFixBracket}
            disabled={fixing}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {fixing ? "Corrigindo..." : "Admin: Corrigir Bracket"}
          </button>
          {fixMsg && <span className="text-xs text-[var(--muted-foreground)]">{fixMsg}</span>}
        </div>
      )}
    </div>
  );
}
