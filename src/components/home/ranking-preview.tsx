import Link from "next/link";
import { ArrowRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockRanking } from "@/data/mock";

export default function RankingPreview() {
  const top5 = mockRanking.slice(0, 5);

  return (
    <section className="bs-page-shell py-12 md:py-20">
      <div className="mb-7 flex items-end justify-between gap-5">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Top jogadores</h2>
          <p className="mt-2 text-[var(--muted-foreground)]">Performance, consistência e evolução no BlueStrike ELO.</p>
        </div>
        <Link href="/ranking" className="hidden items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline sm:flex">
          Ranking completo <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="bs-panel overflow-hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto md:grid md:grid-cols-5 md:overflow-visible">
          {top5.map((entry, index) => {
            const trend = entry.eloChange;
            return (
              <Link
                key={entry.profileId}
                href={`/profile/${entry.profileId}`}
                className="group min-w-[230px] snap-start border-r border-[var(--border)] px-5 py-6 transition-colors last:border-r-0 hover:bg-[var(--accent)] md:min-w-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 font-mono text-sm font-bold text-[var(--muted-foreground)]">{index + 1}</span>
                  <Avatar className="h-10 w-10 border border-[var(--border)]">
                    <AvatarImage src={entry.avatarUrl ?? undefined} alt={entry.nickname} />
                    <AvatarFallback>{entry.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                      {entry.nickname}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>ELO <strong className="font-mono text-[var(--foreground)]">{entry.elo.toLocaleString("pt-BR")}</strong></span>
                      <span className={trend > 0 ? "text-emerald-700" : trend < 0 ? "text-red-700" : "text-[var(--muted-foreground)]"}>
                        {trend > 0 ? <TrendingUp className="inline h-3 w-3" aria-hidden="true" /> : trend < 0 ? <TrendingDown className="inline h-3 w-3" aria-hidden="true" /> : <Minus className="inline h-3 w-3" aria-hidden="true" />}
                        <span className="ml-1">{trend > 0 ? `+${trend}` : trend}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
