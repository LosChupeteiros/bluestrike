"use client";

import { useId, useMemo, useState } from "react";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EloTrendPoint {
  matchId: string;
  team1Tag: string;
  team2Tag: string;
  team1Score: number;
  team2Score: number;
  eloAfter: number;
  eloDelta: number;
  isWinner: boolean;
  playedAt: string | null;
}

interface EloTrendChartProps {
  points: EloTrendPoint[];
}

// Layout constants (viewBox coordinates)
const VB_W = 720;
const VB_H = 220;
const PAD_X = 48;
const PAD_TOP = 28;
const PAD_BOTTOM = 36;

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - Date.parse(iso);
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `há ${Math.max(1, min)} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function EloTrendChart({ points }: EloTrendChartProps) {
  const gradId = useId();
  const lineGradId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Show last 5 oldest→newest. Input is ordered newest first; reverse and slice.
  const series = useMemo(() => {
    const sorted = [...points].reverse(); // oldest first
    return sorted.slice(-5);
  }, [points]);

  const totalDelta = useMemo(() => series.reduce((acc, p) => acc + p.eloDelta, 0), [series]);

  if (series.length < 2) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
          <Activity className="h-4 w-4 text-[var(--primary)]" />
          Tendência de ELO
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="mb-3 h-10 w-10 text-[var(--muted-foreground)] opacity-30" />
          <div className="text-sm font-semibold">Histórico em construção</div>
          <div className="mt-1 text-xs text-[var(--muted-foreground)]">
            {series.length === 0
              ? "Jogue 2 partidas BlueStrike para ver sua tendência aqui."
              : "Jogue mais 1 partida para ativar o gráfico."}
          </div>
        </div>
      </div>
    );
  }

  // Y-axis range with 10% padding
  const elos = series.map((p) => p.eloAfter);
  const minElo = Math.min(...elos);
  const maxElo = Math.max(...elos);
  const range = Math.max(1, maxElo - minElo);
  const yPad = Math.max(8, range * 0.2);
  const yMin = minElo - yPad;
  const yMax = maxElo + yPad;

  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) =>
    series.length === 1 ? VB_W / 2 : PAD_X + (innerW * i) / (series.length - 1);
  const yFor = (elo: number) => PAD_TOP + innerH - ((elo - yMin) / (yMax - yMin)) * innerH;

  const linePath = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(2)} ${yFor(p.eloAfter).toFixed(2)}`)
    .join(" ");

  const areaPath =
    `M ${xFor(0).toFixed(2)} ${(VB_H - PAD_BOTTOM).toFixed(2)} ` +
    series.map((p, i) => `L ${xFor(i).toFixed(2)} ${yFor(p.eloAfter).toFixed(2)}`).join(" ") +
    ` L ${xFor(series.length - 1).toFixed(2)} ${(VB_H - PAD_BOTTOM).toFixed(2)} Z`;

  const hovered = hoverIdx !== null ? series[hoverIdx] : null;
  const tooltipX = hoverIdx !== null ? xFor(hoverIdx) : 0;
  const tooltipY = hoverIdx !== null ? yFor(series[hoverIdx]!.eloAfter) : 0;

  // Convert to percentages for absolute-positioned tooltip overlay
  const tooltipLeftPct = (tooltipX / VB_W) * 100;
  const tooltipTopPct = (tooltipY / VB_H) * 100;

  const totalDeltaPositive = totalDelta >= 0;
  const wins = series.filter((p) => p.isWinner).length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
            <Activity className="h-4 w-4 text-[var(--primary)]" />
            Tendência de ELO
          </div>
          <div className="mt-1 text-xs text-[var(--muted-foreground)]">
            últimas {series.length} partidas BlueStrike · {wins}V {series.length - wins}D
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-black tabular-nums",
            totalDeltaPositive
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          )}
        >
          {totalDeltaPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {totalDeltaPositive ? "+" : ""}
          {totalDelta} ELO
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={`Gráfico das últimas ${series.length} partidas BlueStrike, total ${totalDelta >= 0 ? "+" : ""}${totalDelta} ELO`}
          className="h-[220px] w-full overflow-visible"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00c8ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00c8ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00c8ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00c8ff" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Subtle horizontal gridlines */}
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={PAD_X}
              x2={VB_W - PAD_X}
              y1={PAD_TOP + innerH * t}
              y2={PAD_TOP + innerH * t}
              stroke="#222222"
              strokeDasharray="2 4"
              strokeWidth="1"
            />
          ))}

          {/* Area */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Line with glow + draw-in animation */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${lineGradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: "drop-shadow(0 0 6px rgba(0, 200, 255, 0.55))",
              strokeDasharray: 1500,
              strokeDashoffset: 1500,
              animation: "elo-line-draw 700ms ease-out forwards",
            }}
          />

          {/* Points */}
          {series.map((p, i) => {
            const cx = xFor(i);
            const cy = yFor(p.eloAfter);
            const isPositive = p.eloDelta >= 0;
            const fill = isPositive ? "#22c55e" : "#ef4444";
            const isHover = hoverIdx === i;
            return (
              <g
                key={p.matchId}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                tabIndex={0}
                style={{ cursor: "pointer", outline: "none" }}
              >
                {/* Generous hit area */}
                <circle cx={cx} cy={cy} r={18} fill="transparent" />
                {/* Outer glow ring on hover */}
                {isHover && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={12}
                    fill={fill}
                    opacity={0.25}
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHover ? 8 : 6.5}
                  fill={fill}
                  stroke="#0a0a0a"
                  strokeWidth="2.5"
                  style={{
                    filter: `drop-shadow(0 0 ${isHover ? 8 : 5}px ${isPositive ? "rgba(34,197,94,0.65)" : "rgba(239,68,68,0.65)"})`,
                    transition: "r 120ms ease-out",
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip overlay (HTML, positioned by % over SVG) */}
        {hovered && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{
              left: `${tooltipLeftPct}%`,
              top: `${tooltipTopPct}%`,
              marginTop: "-12px",
            }}
          >
            <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--card)]/95 px-3 py-2 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold whitespace-nowrap">
                <span className="text-[var(--foreground)]">{hovered.team1Tag}</span>
                <span className="text-[var(--muted-foreground)]">{hovered.team1Score}</span>
                <span className="text-[var(--muted-foreground)]">×</span>
                <span className="text-[var(--muted-foreground)]">{hovered.team2Score}</span>
                <span className="text-[var(--foreground)]">{hovered.team2Tag}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
                <span
                  className={cn(
                    "font-mono font-black tabular-nums",
                    hovered.eloDelta >= 0 ? "text-green-400" : "text-red-400"
                  )}
                >
                  {hovered.eloDelta >= 0 ? "+" : ""}
                  {hovered.eloDelta} ELO
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-black",
                    hovered.isWinner
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  )}
                >
                  {hovered.isWinner ? "VITÓRIA" : "DERROTA"}
                </span>
              </div>
              {hovered.playedAt && (
                <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                  {formatRelative(hovered.playedAt)}
                </div>
              )}
              {/* Arrow */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  bottom: "-5px",
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid rgba(0,200,255,0.3)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes elo-line-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
