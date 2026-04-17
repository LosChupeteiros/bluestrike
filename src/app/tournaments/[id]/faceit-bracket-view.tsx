"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, Trophy } from "lucide-react";
import type { FaceitMatch } from "@/lib/faceit";

// ── layout constants ──────────────────────────────────────────────────────────
const CW = 210;       // card width (px)
const CH = 78;        // card height (px) — two 37px rows + 4px divider
const U  = 100;       // base slot unit (≈ CH + 22px padding)
const CG = 52;        // column gap (space for SVG connector lines)
const CT = CW + CG;   // column total step

// ── helpers ───────────────────────────────────────────────────────────────────

function matchIsFinished(s: string) { return s === "FINISHED"; }
function matchIsOngoing(s: string)  { return s === "ONGOING"; }
function matchHasResult(s: string)  { return matchIsFinished(s) || matchIsOngoing(s); }

function roundLabel(r: number, maxR: number): string {
  if (r === maxR) return "Final";
  if (r === maxR - 1 && maxR > 2) return "Semifinal";
  if (r === maxR - 2 && maxR > 3) return "Quartas";
  return `Rodada ${r}`;
}

// ── Bracket flow ordering ─────────────────────────────────────────────────────
// The 4-fetch merge returns matches in API insertion order, scrambling the
// within-round ordering the SVG connector math relies on.
//
// Two-pass bidirectional sort:
//
// BACKWARD PASS (last round → first round):
//   For each round r, look at round r+1 (already placed) and for every match in
//   round r, find which slot in round r+1 its winner (or its teams) appears in.
//   Sort round r so those that feed slot 0 come first, slot 1 next, etc.
//   This correctly places round 0 even though it has no "previous" round.
//
// FORWARD PASS (first round → last round):
//   After the backward pass has anchored round 0, propagate forward: for round r,
//   teams at positions 2j / 2j+1 feed slot j of round r+1.  Sort round r+1 so
//   it receives teams from the right pairs.
function sortByBracketFlow(
  rounds: (FaceitMatch | null)[][]
): (FaceitMatch | null)[][] {
  if (rounds.length <= 1) return rounds;

  const r = rounds.map((col) => [...col]);

  // ── backward pass ──────────────────────────────────────────────────────────
  for (let i = r.length - 2; i >= 0; i--) {
    const next = r[i + 1];

    // Map: lowercase team name → position in next round
    const nameToNextPos = new Map<string, number>();
    next.forEach((m, j) => {
      if (!m) return;
      [m.teams.faction1.name, m.teams.faction2.name].forEach((n) => {
        if (n) nameToNextPos.set(n.toLowerCase().trim(), j);
      });
    });

    // Key: which slot in the NEXT round does this match feed?
    // Prefer the winner (the team that actually advanced).
    const feedsPos = (m: FaceitMatch | null): number => {
      if (!m) return 999;
      const winnerName =
        m.results.winner === "faction1" ? m.teams.faction1.name
        : m.results.winner === "faction2" ? m.teams.faction2.name
        : null;
      if (winnerName) {
        const s = nameToNextPos.get(winnerName.toLowerCase().trim());
        if (s !== undefined) return s;
      }
      // No result yet — check if either expected team appears in next round
      const s1 = nameToNextPos.get(m.teams.faction1.name.toLowerCase().trim());
      const s2 = nameToNextPos.get(m.teams.faction2.name.toLowerCase().trim());
      return Math.min(s1 ?? 999, s2 ?? 999);
    };

    r[i] = [...r[i]].sort((a, b) => feedsPos(a) - feedsPos(b));
  }

  // ── forward pass ───────────────────────────────────────────────────────────
  for (let i = 1; i < r.length; i++) {
    const prev = r[i - 1];

    // Map: lowercase team name → target slot in THIS round
    // (match at prev[idx] feeds slot floor(idx/2))
    const nameToSlot = new Map<string, number>();
    prev.forEach((m, idx) => {
      if (!m) return;
      const slot = Math.floor(idx / 2);
      [m.teams.faction1.name, m.teams.faction2.name].forEach((n) => {
        if (n) nameToSlot.set(n.toLowerCase().trim(), slot);
      });
    });

    const slotOf = (m: FaceitMatch | null): number => {
      if (!m) return 999;
      const s1 = nameToSlot.get(m.teams.faction1.name.toLowerCase().trim());
      const s2 = nameToSlot.get(m.teams.faction2.name.toLowerCase().trim());
      return Math.min(s1 ?? 999, s2 ?? 999);
    };

    r[i] = [...r[i]].sort((a, b) => slotOf(a) - slotOf(b));
  }

  return r;
}

// ── buildSeRounds ─────────────────────────────────────────────────────────────
// rounds[i] = array of FaceitMatch|null for column i, padded to 2^(totalCols-i-1).
//
// Design decisions:
// 1. Map DISTINCT sorted round numbers → column indices (ignores FACEIT's interleaved
//    UB/LB numbering, e.g. UB uses 1,3,5 and LB 2,4,6 in DE brackets).
// 2. Infer totalCols from first column's match count so future rounds not yet
//    created in the API still appear as "A definir" TBD slots.
// 3. Within each column, sort by startedAt → scheduledAt → matchId to approximate
//    the bracket's top-to-bottom order.
// 4. Apply sortByBracketFlow so connectors remain correct regardless of API order.
function buildSeRounds(matches: FaceitMatch[]): (FaceitMatch | null)[][] {
  if (matches.length === 0) return [];

  const byRound = new Map<number, FaceitMatch[]>();
  for (const m of matches) {
    const arr = byRound.get(m.round) ?? [];
    arr.push(m);
    byRound.set(m.round, arr);
  }

  // Sort within each round: started time → scheduled time → matchId
  for (const arr of byRound.values()) {
    arr.sort((a, b) => {
      const ta = a.startedAt || a.scheduledAt || 0;
      const tb = b.startedAt || b.scheduledAt || 0;
      if (ta !== tb) return ta - tb;
      return a.matchId.localeCompare(b.matchId);
    });
  }

  const roundNums = [...byRound.keys()].sort((a, b) => a - b);
  const firstCount = byRound.get(roundNums[0])?.length ?? 0;
  const inferredTotal = firstCount > 0 ? Math.round(Math.log2(firstCount * 2)) : roundNums.length;
  const totalCols = Math.max(roundNums.length, inferredTotal);

  const rounds: (FaceitMatch | null)[][] = [];
  for (let i = 0; i < totalCols; i++) {
    const expected = Math.pow(2, totalCols - i - 1);
    const got = i < roundNums.length ? (byRound.get(roundNums[i]) ?? []) : [];
    const row: (FaceitMatch | null)[] = got.slice(0, expected);
    while (row.length < expected) row.push(null);
    rounds.push(row);
  }

  return sortByBracketFlow(rounds);
}

// ── TeamAvatar ────────────────────────────────────────────────────────────────
// Falls back to initials when the CDN image fails to load (e.g. 400 response).

function TeamAvatar({ avatar, name }: { avatar: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!avatar || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[7px] font-black text-[var(--muted-foreground)]">
        {name ? name.slice(0, 2).toUpperCase() : "?"}
      </div>
    );
  }

  return (
    <Image
      src={avatar}
      alt={name}
      fill
      sizes="22px"
      className="object-cover"
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

// ── TeamRow ───────────────────────────────────────────────────────────────────

function TeamRow({
  name,
  avatar,
  score,
  isWinner,
  hasResult,
}: {
  name: string;
  avatar: string | null;
  score: number;
  isWinner: boolean;
  hasResult: boolean;
}) {
  const scoreClass = !hasResult
    ? "text-[var(--muted-foreground)]"
    : isWinner
      ? "text-green-400 font-black"
      : "text-red-400 font-semibold";

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 ${
        isWinner && hasResult ? "bg-white/[0.03]" : ""
      }`}
    >
      {/* Team avatar */}
      <div className="relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-md border border-white/10 bg-[var(--secondary)]">
        <TeamAvatar avatar={avatar} name={name} />
      </div>

      {/* Name */}
      <span
        className={`flex-1 truncate text-xs font-semibold leading-tight ${
          name
            ? isWinner && hasResult
              ? "text-white"
              : "text-[var(--muted-foreground)]"
            : "text-[var(--muted-foreground)] italic opacity-50"
        }`}
      >
        {name || "A definir"}
      </span>

      {/* Score */}
      <span className={`shrink-0 text-sm tabular-nums ${scoreClass}`}>
        {hasResult ? score : "—"}
      </span>
    </div>
  );
}

// ── BracketMatchCard ──────────────────────────────────────────────────────────

function BracketMatchCard({ match }: { match: FaceitMatch | null }) {
  if (!match) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] opacity-40"
        style={{ width: CW, height: CH }}
      >
        <span className="text-[10px] text-[var(--muted-foreground)]">A definir</span>
      </div>
    );
  }

  const isOngoing  = matchIsOngoing(match.status);
  const hasResult  = matchHasResult(match.status);
  const f1Won      = match.results.winner === "faction1";
  const f2Won      = match.results.winner === "faction2";

  const inner = (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-[var(--card)] transition-all duration-200 ${
        match.faceitUrl ? "cursor-pointer hover:shadow-[0_2px_16px_rgba(255,85,0,0.12)]" : ""
      } ${
        isOngoing
          ? "border-red-500/40"
          : "border-[#FF5500]/18 hover:border-[#FF5500]/45"
      }`}
      style={{ width: CW, height: CH }}
    >
      {/* "live" top bar */}
      {isOngoing && (
        <div className="absolute left-0 right-0 top-0 h-[2px] animate-pulse bg-red-500" />
      )}

      <div className="flex h-full flex-col justify-center divide-y divide-[var(--border)]">
        <TeamRow
          name={match.teams.faction1.name}
          avatar={match.teams.faction1.avatar}
          score={match.results.score.faction1}
          isWinner={f1Won}
          hasResult={hasResult}
        />
        <TeamRow
          name={match.teams.faction2.name}
          avatar={match.teams.faction2.avatar}
          score={match.results.score.faction2}
          isWinner={f2Won}
          hasResult={hasResult}
        />
      </div>

      {/* External link hint */}
      {match.faceitUrl && (
        <ExternalLink className="absolute right-2 top-1.5 h-2.5 w-2.5 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-50" />
      )}
    </div>
  );

  if (match.faceitUrl) {
    return (
      <a href={match.faceitUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
}

// ── SingleEliminationBracket ──────────────────────────────────────────────────

interface SEBracketProps {
  matches: FaceitMatch[];
  label?: string;
  accentColor?: string;
}

function SingleEliminationBracket({
  matches,
  label,
  accentColor = "#FF5500",
}: SEBracketProps) {
  if (matches.length === 0) return null;

  const rounds    = buildSeRounds(matches);
  const numRounds = rounds.length;

  // Content height = first-column slots × slot-height-for-col-0 (= U).
  // Using numTeams*U was double the real height because numTeams = 2^numRounds
  // while column 0 only has 2^(numRounds-1) slots.
  const bracketH = (rounds[0]?.length ?? 1) * U;
  const bracketW = numRounds * CT - CG; // last round has no trailing gap

  // SVG connector paths between round r and r+1 (0-indexed)
  type SvgPath = { d: string };
  const connectors: SvgPath[] = [];

  for (let r = 0; r < numRounds - 1; r++) {
    const slotH  = U * Math.pow(2, r);       // slot height for round r
    const nextN  = rounds[r + 1].length;

    const xRight = r * CT + CW;              // right edge of cards in round r
    const xMid   = xRight + CG / 2;          // midpoint of the gap
    const xLeft  = (r + 1) * CT;            // left edge of cards in round r+1

    for (let j = 0; j < nextN; j++) {
      const y0      = (j * 2)     * slotH + slotH / 2; // center of upper source
      const y1      = (j * 2 + 1) * slotH + slotH / 2; // center of lower source
      const yTarget = (y0 + y1) / 2;                    // center of target (== next round center)

      // Upper arm:  right edge → midX (at y0)  then vertical down to y1
      connectors.push({ d: `M ${xRight} ${y0} H ${xMid} V ${y1}` });
      // Lower arm:  right edge → midX (at y1)  — closes the bracket shape
      connectors.push({ d: `M ${xRight} ${y1} H ${xMid}` });
      // Output:     midX → left edge of next round (at yTarget)
      connectors.push({ d: `M ${xMid} ${yTarget} H ${xLeft}` });
    }
  }

  const accentRgb = accentColor === "#FF5500" ? "255,85,0" : "0,200,255";

  return (
    <div>
      {/* Section label */}
      {label && (
        <div className="mb-4 flex items-center gap-3">
          <span
            className="text-[11px] font-black uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {label}
          </span>
          <div
            className="h-px flex-1 rounded"
            style={{ background: `linear-gradient(to right, ${accentColor}40, transparent)` }}
          />
        </div>
      )}

      {/* Round headers */}
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

      {/* Bracket body */}
      <div style={{ position: "relative", height: bracketH, width: bracketW }}>
        {/* SVG connector lines */}
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
              stroke={`rgba(${accentRgb},0.28)`}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {/* Match cards */}
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
              <BracketMatchCard match={match} />
            </div>
          ));
        })}
      </div>
    </div>
  );
}

// ── LowerBracket ─────────────────────────────────────────────────────────────
// The LB alternates between two transition types:
//   "drop-in" rounds  — same count: UB loser enters, winner advances 1-to-1
//   "survivor" rounds — count halves: LB survivors pair up 2-to-1
//
// After sortByBracketFlow, slot i in round r always feeds slot i (drop-in) or
// slot floor(i/2) (survivor) in round r+1, letting us draw precise connectors.

function LowerBracket({ matches }: { matches: FaceitMatch[] }) {
  if (matches.length === 0) return null;

  const byRound = new Map<number, FaceitMatch[]>();
  for (const m of matches) {
    const arr = byRound.get(m.round) ?? [];
    arr.push(m);
    byRound.set(m.round, arr);
  }

  // Sort within each round: startedAt → scheduledAt → matchId
  for (const arr of byRound.values()) {
    arr.sort((a, b) => {
      const ta = a.startedAt || a.scheduledAt || 0;
      const tb = b.startedAt || b.scheduledAt || 0;
      if (ta !== tb) return ta - tb;
      return a.matchId.localeCompare(b.matchId);
    });
  }

  const roundNums  = [...byRound.keys()].sort((a, b) => a - b);
  const rawRounds: (FaceitMatch | null)[][] = roundNums.map((rn) => byRound.get(rn) ?? []);

  // Apply flow sort so winners track to the correct slot in the next round
  const rounds  = sortByBracketFlow(rawRounds);
  const maxCount = Math.max(...rounds.map((r) => r.length));
  const bracketH = maxCount * U;
  const bracketW = rounds.length * CT - CG;

  // ── SVG connectors ────────────────────────────────────────────────────────
  type SvgPath = { d: string };
  const connectors: SvgPath[] = [];

  for (let c = 0; c < rounds.length - 1; c++) {
    const currCount = rounds[c].length;
    const nextCount = rounds[c + 1].length;
    const currSlotH = bracketH / currCount;

    const xRight = c * CT + CW;
    const xMid   = xRight + CG / 2;
    const xLeft  = (c + 1) * CT;

    if (nextCount >= currCount) {
      // 1-to-1 drop-in round: straight horizontal at the center of each slot
      for (let i = 0; i < currCount; i++) {
        const y = i * currSlotH + currSlotH / 2;
        connectors.push({ d: `M ${xRight} ${y} H ${xLeft}` });
      }
    } else {
      // 2-to-1 survivor round: standard V-bracket connector
      const nextSlotH = bracketH / nextCount;
      for (let j = 0; j < nextCount; j++) {
        const y0      = (j * 2)     * currSlotH + currSlotH / 2;
        const y1      = (j * 2 + 1) * currSlotH + currSlotH / 2;
        const yTarget = j * nextSlotH + nextSlotH / 2;
        connectors.push({ d: `M ${xRight} ${y0} H ${xMid} V ${y1}` });
        connectors.push({ d: `M ${xRight} ${y1} H ${xMid}` });
        connectors.push({ d: `M ${xMid} ${yTarget} H ${xLeft}` });
      }
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">
          Lower Bracket
        </span>
        <div className="h-px flex-1 rounded bg-gradient-to-r from-cyan-500/30 to-transparent" />
      </div>

      {/* Round headers */}
      <div className="mb-3 flex" style={{ width: bracketW }}>
        {rounds.map((_, idx) => (
          <div
            key={idx}
            className="shrink-0"
            style={{ width: CW, marginRight: idx < rounds.length - 1 ? CG : 0 }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              LB Rodada {idx + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Bracket body */}
      <div style={{ position: "relative", height: bracketH, width: bracketW }}>
        {/* SVG connector lines */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
          width={bracketW}
          height={bracketH}
          aria-hidden="true"
        >
          {connectors.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill="none"
              stroke="rgba(0,200,255,0.28)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {/* Match cards */}
        {rounds.map((roundMatches, colIdx) => {
          const slotH = bracketH / roundMatches.length;
          return roundMatches.map((match, i) => (
            <div
              key={`lb-${colIdx}-${i}`}
              style={{
                position: "absolute",
                top: i * slotH + (slotH - CH) / 2,
                left: colIdx * CT,
              }}
            >
              <BracketMatchCard match={match} />
            </div>
          ));
        })}
      </div>
    </div>
  );
}

// ── GrandFinal ────────────────────────────────────────────────────────────────

function GrandFinal({ matches }: { matches: FaceitMatch[] }) {
  if (matches.length === 0) return null;
  const sorted = [...matches].sort((a, b) => a.round - b.round);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Trophy className="h-4 w-4 text-yellow-400" aria-hidden="true" />
        <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">
          Grand Final
        </span>
        <div className="h-px flex-1 rounded bg-gradient-to-r from-yellow-500/30 to-transparent" />
      </div>
      <div className="flex flex-wrap gap-6">
        {sorted.map((match, i) => (
          <div key={match.matchId}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              {sorted.length > 1 ? `Grand Final ${i + 1}` : "Grand Final"}
            </p>
            <BracketMatchCard match={match} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FaceitBracketView (main export) ───────────────────────────────────────────

export default function FaceitBracketView({
  matches,
  type,
}: {
  matches: FaceitMatch[];
  type: string;
}) {
  if (matches.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
        As partidas ainda não foram geradas para este campeonato.
      </div>
    );
  }

  // ── Double Elimination ──────────────────────────────────────────────────────
  if (type === "doubleElimination") {
    const upper    = matches.filter((m) => m.group === 1);
    const nonUpper = matches.filter((m) => m.group > 1);

    // FACEIT DE assigns group values in two possible ways:
    //   A) group=1 UB · group=2 LB (all rounds) · group=3 GF
    //   B) group=1 UB · group=2 LB-R1 · group=3 LB-R2 · … · group=N GF
    // In both cases the Grand Final is the matches with the SINGLE HIGHEST group value
    // — provided at least two distinct group values exist among non-UB matches.
    // If only one group value exists (e.g. GF not created yet), treat all as LB.
    const nonUpperGroups = [...new Set(nonUpper.map((m) => m.group))];
    const maxGroup       = nonUpperGroups.length > 0 ? Math.max(...nonUpperGroups) : 0;
    const hasExplicitGF  = nonUpperGroups.length >= 2; // need ≥2 groups to isolate GF

    const lower = hasExplicitGF
      ? nonUpper.filter((m) => m.group < maxGroup)
      : nonUpper;
    const gf = hasExplicitGF
      ? nonUpper.filter((m) => m.group === maxGroup)
      : [];

    if (upper.length + lower.length + gf.length === 0) {
      // No group data — render as single bracket
      return (
        <div className="overflow-x-auto pb-4">
          <SingleEliminationBracket matches={matches} />
        </div>
      );
    }

    return (
      <div className="space-y-14 overflow-x-auto pb-4">
        {upper.length > 0 && (
          <SingleEliminationBracket
            matches={upper}
            label="Upper Bracket"
            accentColor="#FF5500"
          />
        )}
        {lower.length > 0 && <LowerBracket matches={lower} />}
        {gf.length > 0     && <GrandFinal matches={gf} />}
      </div>
    );
  }

  // ── Single Elimination (default) ────────────────────────────────────────────
  // FACEIT assigns different group numbers to different halves of the draw even
  // for a plain SE bracket, so we must use ALL matches (no group filter).
  return (
    <div className="overflow-x-auto pb-4">
      <SingleEliminationBracket matches={matches} />
    </div>
  );
}
