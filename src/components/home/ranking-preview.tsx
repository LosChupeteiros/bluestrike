import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Crown, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockRanking } from "@/data/mock";
import { cn } from "@/lib/utils";

function PositionIcon({ position }: { position: number }) {
  if (position === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (position === 2) return <Medal className="w-4 h-4 text-gray-300" />;
  if (position === 3) return <Medal className="w-4 h-4 text-orange-400" />;
  return <span className="text-sm font-bold text-[var(--muted-foreground)]">#{position}</span>;
}

export default function RankingPreview() {
  const top5 = mockRanking.slice(0, 5);

  return (
    <section className="py-24 bg-[var(--card)] border-y border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-[var(--primary)] text-sm font-semibold mb-2">
              <TrendingUp className="w-4 h-4" />
              Ranking Global
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Os melhores jogadores
            </h2>
            <p className="text-[var(--muted-foreground)] mt-2">
              Baseado em ELO e performance nos campeonatos.
            </p>
          </div>
          <Link href="/ranking" className="hidden md:block">
            <Button variant="outline" size="sm" className="gap-2">
              Ver ranking completo <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          {top5.map((entry, i) => {
            return (
              <Link key={entry.profileId} href={`/profile/${entry.profileId}`} className="group block">
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                  i === 0
                    ? "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/8"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/3"
                )}>
                  {/* Position */}
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <PositionIcon position={entry.position} />
                  </div>

                  {/* Avatar */}
                  <Avatar className={cn("h-10 w-10", i === 0 && "ring-2 ring-yellow-400/50")}>
                    <AvatarImage src={entry.avatarUrl ?? undefined} alt={entry.nickname} />
                    <AvatarFallback>{entry.nickname[0]}</AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm group-hover:text-[var(--primary)] transition-colors truncate">
                      {entry.nickname}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {entry.tournamentsPlayed} torneios · {entry.wins}V/{entry.losses}D
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-xs text-[var(--muted-foreground)]">
                    <div className="text-center">
                      <div className="font-semibold text-[var(--foreground)]">{entry.kdRatio.toFixed(2)}</div>
                      <div>K/D</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-[var(--foreground)]">{entry.hsRate.toFixed(0)}%</div>
                      <div>HS</div>
                    </div>
                  </div>

                  {/* ELO + change */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-[var(--primary)]">{entry.elo.toLocaleString()}</div>
                    <div className={cn(
                      "flex items-center justify-end gap-0.5 text-xs font-medium",
                      entry.eloChange > 0 ? "text-green-400" : entry.eloChange < 0 ? "text-red-400" : "text-[var(--muted-foreground)]"
                    )}>
                      {entry.eloChange > 0 ? <TrendingUp className="w-3 h-3" /> : entry.eloChange < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {entry.eloChange > 0 ? `+${entry.eloChange}` : entry.eloChange === 0 ? "—" : entry.eloChange}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href="/ranking">
            <Button variant="outline" className="gap-2">
              Ver ranking completo <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
