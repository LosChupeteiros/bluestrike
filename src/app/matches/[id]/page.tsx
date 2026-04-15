import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, ChevronLeft, Swords, Trophy, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getMockMatchDetail } from "@/data/competitive-mock";
import { getMapPresentation } from "@/lib/maps";
import { getPlayerRank } from "@/lib/ranks";
import { getProfilesByPublicIds } from "@/lib/profiles";
import { cn, formatDate } from "@/lib/utils";

interface MatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatKd(kills: number, deaths: number) {
  return (kills / Math.max(deaths, 1)).toFixed(2);
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { id } = await params;
  const match = getMockMatchDetail(id);

  if (!match) {
    return { title: "Partida" };
  }

  return {
    title: `${match.team1.tag} x ${match.team2.tag}`,
  };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const match = getMockMatchDetail(id);

  if (!match) {
    notFound();
  }

  const mapPresentation = getMapPresentation(match.map);
  const realProfiles = await getProfilesByPublicIds(
    [...match.team1.players, ...match.team2.players].map((player) => player.publicId)
  );
  const avatarByPublicId = new Map(
    realProfiles
      .filter((profile) => Boolean(profile.steamAvatarUrl))
      .map((profile) => [profile.publicId, profile.steamAvatarUrl as string])
  );

  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/profile/1"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>

        <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="relative min-h-[180px] border-b border-[var(--border)] px-6 py-7 sm:px-8 sm:py-8 lg:min-h-[200px]">
            {mapPresentation ? (
              <>
                <div
                  className="absolute inset-0 bg-cover"
                  style={{
                    backgroundImage: `url(${mapPresentation.splashArtUrl})`,
                    backgroundPosition: "center 75%",
                  }}
                />
                {/* Overlay calibrado para legibilidade sem matar o mapa */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-900 to-black" />
            )}

            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="relative">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={match.status === "finished" ? "finished" : "live"}>
                  {match.status === "finished" ? "Partida finalizada" : "Ao vivo"}
                </Badge>
                <Badge variant="secondary">{match.tournamentName}</Badge>
                {mapPresentation && <Badge variant="outline">{mapPresentation.name}</Badge>}
              </div>

              <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
                <div className="flex items-center gap-4 lg:justify-end">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-xl font-black text-[var(--primary)]">
                    {match.team1.tag}
                  </div>
                  <div className="lg:text-right">
                    <div className="text-xl font-black">{match.team1.name}</div>
                    <div className="text-sm font-bold text-[var(--foreground)]">{match.team1.elo} ELO médio</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-mono text-5xl font-black tracking-tight">
                    {match.team1.score} <span className="text-[var(--muted-foreground)]">x</span> {match.team2.score}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-[var(--foreground)]">
                    <span className="flex items-center gap-1">
                      <Swords className="h-4 w-4 text-[var(--primary)]" />
                      {match.map}
                    </span>
                    <span className="text-[var(--foreground)]">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-[var(--primary)]" />
                      {formatDate(match.scheduledAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xl font-black">{match.team2.name}</div>
                    <div className="text-sm font-bold text-[var(--foreground)]">{match.team2.elo} ELO médio</div>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-xl font-black text-[var(--primary)]">
                    {match.team2.tag}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4">
              <div className="mb-1 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-[var(--muted-foreground)]">Mapa</span>
              </div>
              <div className="text-lg font-black">{match.map}</div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                <span className="text-xs text-[var(--muted-foreground)]">ELO do confronto</span>
              </div>
              <div className="text-lg font-black">{match.team1.elo} x {match.team2.elo}</div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4">
              <div className="mb-1 flex items-center gap-2">
                <Swords className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-[var(--muted-foreground)]">Status</span>
              </div>
              <div className="text-lg font-black">
                {match.status === "finished" ? "Resultado confirmado" : "Partida em andamento"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {[
            {
              team: match.team1,
              winner: match.team1.score > match.team2.score,
            },
            {
              team: match.team2,
              winner: match.team2.score > match.team1.score,
            },
          ].map(({ team, winner }) => (
            <section key={team.tag} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 font-black text-[var(--primary)]">
                    {team.tag}
                  </div>
                  <div>
                    <div className="text-lg font-black">{team.name}</div>
                    <div className="text-xs font-bold text-[var(--foreground)]">{team.elo} ELO médio</div>
                  </div>
                </div>

                <Badge variant={winner ? "open" : "secondary"}>
                  {winner ? "Vencedor" : "Derrota"}
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      <th className="px-5 py-3 font-semibold">Jogador</th>
                      <th className="px-3 py-3 font-semibold">Patente</th>
                      <th className="px-3 py-3 font-semibold">K</th>
                      <th className="px-3 py-3 font-semibold">D</th>
                      <th className="px-3 py-3 font-semibold">A</th>
                      <th className="px-3 py-3 font-semibold">K/D</th>
                      <th className="px-3 py-3 font-semibold">HS%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.players.map((player) => {
                      const rank = getPlayerRank(player.elo);
                      return (
                        <tr key={player.publicId} className="border-b border-[var(--border)]/70 last:border-b-0">
                          <td className="px-5 py-3">
                            <Link
                              href={`/profile/${player.publicId}`}
                              className="group flex items-center gap-3"
                            >
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={avatarByPublicId.get(player.publicId) ?? player.avatar} alt={player.nickname} />
                                <AvatarFallback>{player.nickname[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-semibold transition-colors group-hover:text-[var(--primary)]">
                                {player.nickname}
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2" title={rank.tooltip}>
                              <Image
                                src={rank.imagePath}
                                alt={rank.name}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                                unoptimized
                              />
                              <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                                {player.elo}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm">{player.kills}</td>
                          <td className="px-3 py-3 text-sm">{player.deaths}</td>
                          <td className="px-3 py-3 text-sm">{player.assists}</td>
                          <td className={cn("px-3 py-3 text-sm font-semibold", winner ? "text-green-400" : "text-[var(--foreground)]")}>
                            {formatKd(player.kills, player.deaths)}
                          </td>
                          <td className="px-3 py-3 text-sm">{player.hsRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
