import { Banknote, Crown, Medal, Award, Trophy } from "lucide-react";
import type { PrizeBreakdownEntry } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";

const PLACE_STYLE = [
  { icon: Crown, accent: "#f5c842", label: "1º" },
  { icon: Medal, accent: "#c7d2da", label: "2º" },
  { icon: Award, accent: "#e08a4a", label: "3º" },
] as const;

interface TournamentPrizesProps {
  breakdown: PrizeBreakdownEntry[];
  total: number;
  /** Layout compacto para a sidebar */
  compact?: boolean;
}

export default function TournamentPrizes({ breakdown, total, compact }: TournamentPrizesProps) {
  if (breakdown.length === 0) return null;

  const max = Math.max(...breakdown.map((prize) => prize.amount), 1);

  if (compact) {
    return (
      <div className="rounded-2xl border border-[#f5c842]/20 bg-[var(--card)] p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#f5c842]">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            Premiação
          </h4>
          <span className="font-mono text-sm font-black tabular-nums text-[#f5c842]">
            {formatCurrency(total)}
          </span>
        </div>

        <ul className="space-y-2">
          {breakdown.slice(0, 3).map((prize, index) => {
            const style = PLACE_STYLE[index];
            const Icon = style?.icon ?? Banknote;
            const accent = style?.accent ?? "var(--muted-foreground)";
            return (
              <li key={`${prize.place}-${index}`} className="flex items-center gap-2.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-[var(--muted-foreground)]">
                  {prize.place}
                </span>
                <span
                  className="shrink-0 font-mono text-sm font-black tabular-nums"
                  style={{ color: index === 0 ? accent : undefined }}
                >
                  {formatCurrency(prize.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#f5c842]/18 bg-[var(--card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#f5c842]">
          <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
          Distribuição de prêmios
        </h3>
        <div className="text-right">
          <span className="block font-mono text-xl font-black leading-none tabular-nums text-[#f5c842]">
            {formatCurrency(total)}
          </span>
          <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#f5c842]/55">
            Total no PIX
          </span>
        </div>
      </div>

      <ul className="divide-y divide-[var(--border)]">
        {breakdown.map((prize, index) => {
          const style = PLACE_STYLE[index];
          const Icon = style?.icon ?? Banknote;
          const accent = style?.accent ?? "#5b6672";
          const share = total > 0 ? Math.round((prize.amount / total) * 100) : 0;
          const barWidth = Math.max(6, Math.round((prize.amount / max) * 100));

          return (
            <li key={`${prize.place}-${index}`} className="relative px-5 py-4 sm:px-6">
              {/* Barra proporcional ao valor */}
              <span
                className="pointer-events-none absolute inset-y-0 left-0"
                style={{
                  width: `${barWidth}%`,
                  background: `linear-gradient(to right, color-mix(in srgb, ${accent} 10%, transparent), transparent)`,
                }}
                aria-hidden="true"
              />

              <div className="relative flex items-center gap-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
                    color: accent,
                  }}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{prize.place}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">
                    {share}% da premiação
                  </p>
                </div>

                <span
                  className={cn(
                    "shrink-0 font-mono font-black tabular-nums",
                    index === 0 ? "text-2xl" : "text-lg"
                  )}
                  style={{ color: accent }}
                >
                  {formatCurrency(prize.amount)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
