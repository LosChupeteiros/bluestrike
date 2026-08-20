import Image from "next/image";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reveal } from "@/components/motion/reveal";
import { mockRanking } from "@/data/mock";
import { getPlayerRank } from "@/lib/ranks";
import { cn } from "@/lib/utils";

/**
 * A broadcast standings table, not a stack of cards: rows are grouped by
 * hairline rules, every figure is tabular so the columns never jitter, and
 * only the leader gets colour.
 */
export default function RankingPreview() {
  const top = mockRanking.slice(0, 5);

  return (
    <section className="relative overflow-hidden border-y border-line/60 bg-void">
      <div className="relative mx-auto w-full max-w-[1360px] px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
        <Reveal variant="mask" className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="type-h2 text-ink">
              Os melhores
              <span className="text-ink-3"> do ranking.</span>
            </h2>
            <p className="type-body mt-5">
              ELO ajustado a cada partida oficial, com K/D e taxa de headshot puxados direto das
              estatísticas do servidor.
            </p>
          </div>

          <Link
            href="/ranking"
            prefetch
            className="hidden items-center gap-2 text-sm font-semibold text-strike transition-[gap] duration-300 hover:gap-3.5 md:inline-flex"
          >
            Ranking completo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          {/* Column heads — desktop only, this is a table not a list */}
          <div className="hidden grid-cols-[3rem_minmax(0,1fr)_5rem_5rem_9rem] items-center gap-4 border-b border-line/70 px-3 pb-3 md:grid">
            <span className="tick">#</span>
            <span className="tick">Jogador</span>
            <span className="tick text-right">K/D</span>
            <span className="tick text-right">HS</span>
            <span className="tick text-right">ELO</span>
          </div>

          <ol className="divide-y divide-line/50">
            {top.map((entry, index) => {
              const rank = getPlayerRank(entry.elo);
              const isLeader = index === 0;
              const trendUp = entry.eloChange > 0;
              const trendFlat = entry.eloChange === 0;

              return (
                <li key={entry.profileId}>
                  <Link
                    href={`/profile/${entry.profileId}`}
                    className={cn(
                      "group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-4 rounded-lg px-3 py-4",
                      "transition-colors duration-300 hover:bg-white/[0.035]",
                      "md:grid-cols-[3rem_minmax(0,1fr)_5rem_5rem_9rem]"
                    )}
                  >
                    <span
                      className={cn(
                        "tabular text-sm font-semibold",
                        isLeader ? "text-prize" : "text-ink-3"
                      )}
                    >
                      {String(entry.position).padStart(2, "0")}
                    </span>

                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar
                        className={cn(
                          "h-9 w-9 shrink-0 ring-1 transition-all duration-500",
                          isLeader ? "ring-prize/50" : "ring-line-2 group-hover:ring-strike/40"
                        )}
                      >
                        <AvatarImage src={entry.avatarUrl ?? undefined} alt="" />
                        <AvatarFallback className="font-display text-xs font-bold">
                          {entry.nickname.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>

                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-bold tracking-tight text-ink transition-colors duration-300 group-hover:text-strike">
                          {entry.nickname}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-ink-3">
                          {entry.tournamentsPlayed} torneios · {entry.wins}V {entry.losses}D
                        </span>
                      </span>
                    </span>

                    <span className="tabular hidden text-right text-[13px] text-ink-2 md:block">
                      {entry.kdRatio.toFixed(2)}
                    </span>
                    <span className="tabular hidden text-right text-[13px] text-ink-2 md:block">
                      {entry.hsRate.toFixed(0)}%
                    </span>

                    <span className="flex items-center justify-end gap-3">
                      <Image
                        src={rank.imagePath}
                        alt={rank.name}
                        width={30}
                        height={30}
                        className="h-7 w-7 shrink-0 object-contain"
                        unoptimized
                      />
                      <span className="text-right">
                        <span className="tabular block text-[0.9375rem] font-semibold leading-tight text-ink">
                          {entry.elo.toLocaleString("pt-BR")}
                        </span>
                        <span
                          className={cn(
                            "tabular flex items-center justify-end gap-0.5 text-[11px] leading-tight",
                            trendFlat ? "text-ink-3" : trendUp ? "text-gain" : "text-loss"
                          )}
                        >
                          {!trendFlat &&
                            (trendUp ? (
                              <TrendingUp className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <TrendingDown className="h-3 w-3" aria-hidden="true" />
                            ))}
                          {trendFlat ? "—" : trendUp ? `+${entry.eloChange}` : entry.eloChange}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Reveal>

        <div className="mt-8 md:hidden">
          <Link
            href="/ranking"
            prefetch
            className="inline-flex items-center gap-2 text-sm font-semibold text-strike"
          >
            Ranking completo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
