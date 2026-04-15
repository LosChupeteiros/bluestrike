import {
  TrendingUp, TrendingDown, Minus, Crown, Medal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockRanking } from "@/data/mock";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ranking Global" };

function PositionBadge({ pos }: { pos: number }) {
  if (pos === 1)
    return (
      <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
        <Crown className="w-4 h-4 text-yellow-400" />
      </div>
    );
  if (pos === 2)
    return (
      <div className="w-8 h-8 rounded-full bg-gray-500/20 border border-gray-400/40 flex items-center justify-center">
        <Medal className="w-4 h-4 text-gray-300" />
      </div>
    );
  if (pos === 3)
    return (
      <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-400/40 flex items-center justify-center">
        <Medal className="w-4 h-4 text-orange-400" />
      </div>
    );
  return (
    <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[var(--muted-foreground)]">
      #{pos}
    </div>
  );
}

export default function RankingPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[var(--primary)] text-sm font-semibold mb-2">
            <TrendingUp className="w-4 h-4" />
            Ranking Global
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Os Melhores Jogadores</h1>
          <p className="text-[var(--muted-foreground)]">
            Ranking baseado em ELO — atualizado após cada partida disputada na plataforma.
          </p>
        </div>

        {/* Podium — top 3 */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
          {[mockRanking[1], mockRanking[0], mockRanking[2]].map((entry, i) => {
            const heights = ["h-28", "h-36", "h-24"];
            return (
              <div key={entry.profileId} className={cn("flex flex-col items-center", i === 1 ? "order-2" : i === 0 ? "order-1" : "order-3")}>
                <Avatar className={cn(
                  "ring-2 mb-2",
                  entry.position === 1 ? "h-16 w-16 ring-yellow-400/60" :
                  entry.position === 2 ? "h-14 w-14 ring-gray-400/40" :
                  "h-12 w-12 ring-orange-400/40"
                )}>
                  <AvatarImage src={entry.avatarUrl ?? undefined} />
                  <AvatarFallback>{entry.nickname[0]}</AvatarFallback>
                </Avatar>
                <div className="text-xs font-bold text-center truncate w-full px-2">{entry.nickname}</div>
                <div className="text-xs text-[var(--primary)] font-black mb-2">{entry.elo.toLocaleString()}</div>
                <div className={cn(
                  "w-full rounded-t-lg border flex items-center justify-center",
                  heights[i],
                  entry.position === 1
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : entry.position === 2
                    ? "bg-gray-500/10 border-gray-500/30"
                    : "bg-orange-500/10 border-orange-500/30"
                )}>
                  <PositionBadge pos={entry.position} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Full table */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--secondary)]">
            <div className="w-8 text-xs text-[var(--muted-foreground)] text-center">#</div>
            <div className="text-xs text-[var(--muted-foreground)] font-medium">Jogador</div>
            <div className="hidden sm:block text-xs text-[var(--muted-foreground)] text-center w-12">K/D</div>
            <div className="hidden sm:block text-xs text-[var(--muted-foreground)] text-center w-12">HS%</div>
            <div className="hidden md:block text-xs text-[var(--muted-foreground)] text-center w-16">Win%</div>
            <div className="text-xs text-[var(--muted-foreground)] text-right w-20">ELO</div>
          </div>

          {mockRanking.map((entry) => (
            <div
              key={entry.profileId}
              className={cn(
                "grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--secondary)]/50",
                entry.position <= 3 && "bg-gradient-to-r",
                entry.position === 1 && "from-yellow-500/5 to-transparent",
                entry.position === 2 && "from-gray-500/5 to-transparent",
                entry.position === 3 && "from-orange-500/5 to-transparent",
              )}
            >
              {/* Position */}
              <PositionBadge pos={entry.position} />

              {/* Player */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={entry.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{entry.nickname[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{entry.nickname}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {entry.wins}V · {entry.tournamentsPlayed} torneios
                  </div>
                </div>
              </div>

              {/* K/D */}
              <div className="hidden sm:block text-sm font-semibold text-center w-12">{entry.kdRatio.toFixed(2)}</div>

              {/* HS% */}
              <div className="hidden sm:block text-sm text-center w-12 text-[var(--muted-foreground)]">{entry.hsRate.toFixed(0)}%</div>

              {/* Win% */}
              <div className="hidden md:block text-sm text-center w-16">
                <span className="text-green-400 font-semibold">{entry.winRate.toFixed(0)}%</span>
              </div>

              {/* ELO + change */}
              <div className="text-right w-20">
                <div className="text-sm font-black text-[var(--primary)]">{entry.elo.toLocaleString()}</div>
                <div className={cn(
                  "flex items-center justify-end gap-0.5 text-xs",
                  entry.eloChange > 0 ? "text-green-400" : entry.eloChange < 0 ? "text-red-400" : "text-[var(--muted-foreground)]"
                )}>
                  {entry.eloChange > 0 ? <TrendingUp className="w-3 h-3" /> : entry.eloChange < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {entry.eloChange === 0 ? "—" : entry.eloChange > 0 ? `+${entry.eloChange}` : entry.eloChange}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-[var(--muted-foreground)] mt-4">
          Ranking atualizado em tempo real · Exibindo top {mockRanking.length} jogadores
        </p>
      </div>
    </div>
  );
}
