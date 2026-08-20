"use client";

import { useId, useMemo, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EloTrendPoint {
  matchId: string;
  tournamentId: string | null;
  team1Tag: string;
  team2Tag: string;
  team1Score: number;
  team2Score: number;
  eloAfter: number;
  eloDelta: number;
  isWinner: boolean;
  playedAt: string | null;
}

interface EloTrendChartProps { points: EloTrendPoint[] }

const VB_W = 780;
const VB_H = 270;
const PAD_X = 52;
const PAD_TOP = 32;
const PAD_BOTTOM = 42;

function matchHref(point: EloTrendPoint) {
  return point.tournamentId ? `/tournaments/${point.tournamentId}/matches/${point.matchId}` : `/matches/${point.matchId}`;
}

function shortDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Partida";
}

export default function EloTrendChart({ points }: EloTrendChartProps) {
  const areaId = useId();
  const lineId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const series = useMemo(() => points.slice(-7), [points]);
  const totalDelta = useMemo(() => series.reduce((sum, point) => sum + point.eloDelta, 0), [series]);
  const wins = series.filter((point) => point.isWinner).length;
  const bestGain = series.reduce((best, point) => Math.max(best, point.eloDelta), 0);

  if (series.length < 2) {
    return (
      <section className="bs-bento-card grid min-h-64 place-items-center overflow-hidden p-8 text-center">
        <div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/8 text-[var(--primary)]"><Activity className="h-5 w-5" /></span><h2 className="mt-5 text-xl font-black">Histórico em construção</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">Jogue duas partidas BlueStrike para ativar a curva de evolução.</p></div>
      </section>
    );
  }

  const startingElo = series[0].eloAfter - series[0].eloDelta;
  const elos = [startingElo, ...series.map((point) => point.eloAfter)];
  const minElo = Math.min(...elos);
  const maxElo = Math.max(...elos);
  const padding = Math.max(12, (maxElo - minElo) * 0.22);
  const yMin = minElo - padding;
  const yMax = maxElo + padding;
  const innerWidth = VB_W - PAD_X * 2;
  const innerHeight = VB_H - PAD_TOP - PAD_BOTTOM;
  const xFor = (index: number) => PAD_X + (innerWidth * index) / Math.max(1, elos.length - 1);
  const yFor = (elo: number) => PAD_TOP + innerHeight - ((elo - yMin) / (yMax - yMin)) * innerHeight;
  const linePath = elos.map((elo, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(elo)}`).join(" ");
  const areaPath = `M ${xFor(0)} ${VB_H - PAD_BOTTOM} ${elos.map((elo, index) => `L ${xFor(index)} ${yFor(elo)}`).join(" ")} L ${xFor(elos.length - 1)} ${VB_H - PAD_BOTTOM} Z`;
  const positive = totalDelta >= 0;

  return (
    <section className="bs-bento-card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 p-5 sm:p-8">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div><p className="bs-eyebrow"><Activity className="h-4 w-4" /> Evolução competitiva</p><h2 className="mt-3 text-2xl font-black tracking-[-.04em] sm:text-3xl">Histórico de ELO</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">Cada ponto abre a partida que alterou sua classificação.</p></div>
            <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-base font-black", positive ? "border-green-500/25 bg-green-500/8 text-green-500" : "border-red-500/25 bg-red-500/8 text-red-500")}>
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{positive ? "+" : ""}{totalDelta} ELO
            </div>
          </div>

          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label={`Evolução nas últimas ${series.length} partidas: ${totalDelta >= 0 ? "+" : ""}${totalDelta} ELO`} className="h-auto min-h-[230px] w-full overflow-visible">
            <defs>
              <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--primary)" stopOpacity="0" /></linearGradient>
              <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="var(--primary)" stopOpacity=".65" /><stop offset="100%" stopColor="var(--primary)" /></linearGradient>
            </defs>
            {[0, .25, .5, .75, 1].map((tick) => <line key={tick} x1={PAD_X} x2={VB_W - PAD_X} y1={PAD_TOP + innerHeight * tick} y2={PAD_TOP + innerHeight * tick} stroke="var(--border)" strokeDasharray="3 7" />)}
            <path d={areaPath} fill={`url(#${areaId})`} />
            <path d={linePath} fill="none" stroke={`url(#${lineId})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="elo-line" />
            <circle cx={xFor(0)} cy={yFor(startingElo)} r="5" fill="var(--muted-foreground)" stroke="var(--card)" strokeWidth="3" />
            {series.map((point, index) => {
              const x = xFor(index + 1);
              const y = yFor(point.eloAfter);
              const active = activeIndex === index;
              const color = point.eloDelta >= 0 ? "#22c55e" : "#ef4444";
              return (
                <a key={point.matchId} href={matchHref(point)} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onBlur={() => setActiveIndex(null)} aria-label={`${point.team1Tag} ${point.team1Score} a ${point.team2Score} ${point.team2Tag}, ${point.eloDelta >= 0 ? "+" : ""}${point.eloDelta} ELO`}>
                  <circle cx={x} cy={y} r="20" fill="transparent" />
                  {active && <circle cx={x} cy={y} r="13" fill={color} opacity=".18" />}
                  <circle cx={x} cy={y} r={active ? 8 : 6.5} fill={color} stroke="var(--card)" strokeWidth="3" className="transition-all duration-200" />
                  {active && <g><rect x={Math.max(4, Math.min(VB_W - 178, x - 89))} y={Math.max(4, y - 68)} width="178" height="48" rx="12" fill="var(--card)" stroke="var(--border)" /><text x={Math.max(4, Math.min(VB_W - 178, x - 89)) + 12} y={Math.max(4, y - 68) + 20} fill="var(--foreground)" fontSize="11" fontWeight="700">{point.team1Tag} {point.team1Score} × {point.team2Score} {point.team2Tag}</text><text x={Math.max(4, Math.min(VB_W - 178, x - 89)) + 12} y={Math.max(4, y - 68) + 37} fill={color} fontSize="10" fontWeight="800">{point.eloDelta >= 0 ? "+" : ""}{point.eloDelta} ELO</text></g>}
                </a>
              );
            })}
          </svg>
        </div>

        <aside className="grid border-t border-[var(--border)] bg-[var(--field)] sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0">
          <TrendMetric icon={Trophy} label="Vitórias" value={`${wins}/${series.length}`} accent="text-emerald-500" />
          <TrendMetric icon={TrendingUp} label="Melhor ganho" value={`+${bestGain}`} accent="text-[var(--primary)]" />
          <TrendMetric icon={CalendarDays} label="ELO atual" value={series.at(-1)!.eloAfter.toLocaleString("pt-BR")} accent="text-[var(--foreground)]" />
        </aside>
      </div>

      <div className="grid border-t border-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
        {series.slice(-4).map((point) => (
          <a key={point.matchId} href={matchHref(point)} className="group flex min-h-20 items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 transition-colors hover:bg-[var(--primary)]/5 sm:border-r lg:border-b-0">
            <span><span className="block text-xs font-bold">{point.team1Tag} {point.team1Score} × {point.team2Score} {point.team2Tag}</span><span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{shortDate(point.playedAt)}</span></span>
            <span className={cn("flex items-center gap-1 font-mono text-xs font-black", point.eloDelta >= 0 ? "text-green-500" : "text-red-500")}>{point.eloDelta >= 0 ? "+" : ""}{point.eloDelta}<ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></span>
          </a>
        ))}
      </div>

      <style jsx>{`@media (prefers-reduced-motion: no-preference) { .elo-line { stroke-dasharray: 1600; stroke-dashoffset: 1600; animation: elo-line-draw 900ms cubic-bezier(.22,1,.36,1) forwards; } } @keyframes elo-line-draw { to { stroke-dashoffset: 0; } }`}</style>
    </section>
  );
}

function TrendMetric({ icon: Icon, label, value, accent }: { icon: typeof Trophy; label: string; value: string; accent: string }) {
  return <div className="flex min-h-32 flex-col justify-center border-b border-[var(--border)] p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b lg:border-r-0"><Icon className="h-4 w-4 text-[var(--primary)]" /><span className="mt-4 text-[9px] font-black uppercase tracking-[.14em] text-[var(--muted-foreground)]">{label}</span><strong className={cn("mt-2 text-3xl font-black tracking-[-.05em]", accent)}>{value}</strong></div>;
}
