import Link from "next/link";
import { ArrowRight, Minus, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { HomeTopPlayer } from "@/lib/home";
import { getProfilePath, roleLabel } from "@/lib/profile";

export default function RankingPreview({ players }: { players: HomeTopPlayer[] }) {
  return (
    <section className="bs-shell bs-section pt-4" data-reveal>
      <div className="mb-7 flex items-end justify-between gap-5">
        <div>
          <p className="bs-eyebrow">Performance real</p>
          <h2 className="type-h2 mt-4">Top jogadores</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">Classificação real pelo BlueStrike ELO.</p>
        </div>
        <Link href="/ranking" className="hidden items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-white sm:flex">
          Ranking completo <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {players.length === 0 ? (
        <div className="bs-panel flex min-h-40 items-center gap-4 px-6 py-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold">Ranking em formação</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Os jogadores aparecem aqui assim que entram no ranking.</p>
          </div>
        </div>
      ) : (
        <div className="bs-bento-card overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
            {players.map(({ profile, eloChange }, index) => (
              <Link
                key={profile.id}
                href={getProfilePath(profile.publicId)}
                className={`group relative border-b border-[var(--border)] px-5 py-6 transition-colors hover:bg-[var(--secondary)] sm:border-r md:border-b-0 md:last:border-r-0 ${index === 0 ? "bg-[var(--primary)]/[0.045]" : ""}`}
              >
                {index === 0 && <span className="absolute inset-x-0 top-0 h-0.5 bg-[var(--primary)]" />}
                <div className="flex items-center gap-3">
                  <span className="w-6 tabular text-sm font-black text-[var(--muted-foreground)]">{index + 1}</span>
                  <Avatar className="h-10 w-10 border border-[var(--border)]">
                    <AvatarImage src={profile.faceitAvatar ?? profile.steamAvatarUrl ?? undefined} alt={profile.steamPersonaName} />
                    <AvatarFallback>{profile.steamPersonaName.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                      {profile.steamPersonaName}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">
                      {roleLabel(profile.inGameRole)}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-[var(--border)] pt-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--muted-foreground)]">BlueStrike ELO</div>
                    <div className="tabular mt-1 text-xl font-black text-[var(--primary)]">{profile.elo.toLocaleString("pt-BR")}</div>
                  </div>
                  <span className={eloChange > 0 ? "text-green-400" : eloChange < 0 ? "text-red-400" : "text-[var(--muted-foreground)]"}>
                    {eloChange > 0 ? <TrendingUp className="inline h-3.5 w-3.5" aria-hidden="true" /> : eloChange < 0 ? <TrendingDown className="inline h-3.5 w-3.5" aria-hidden="true" /> : <Minus className="inline h-3.5 w-3.5" aria-hidden="true" />}
                    <span className="ml-1 tabular text-xs font-bold">{eloChange > 0 ? `+${eloChange}` : eloChange}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
