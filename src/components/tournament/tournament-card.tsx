"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, Users, Trophy, ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getTournamentBadgeProps } from "@/lib/tournament-status";
import { getTeamMode } from "@/lib/team-modes";
import type { Tournament } from "@/types";

interface TournamentCardProps {
  tournament: Tournament;
  featured?: boolean;
}

export default function TournamentCard({ tournament, featured = false }: TournamentCardProps) {
  const badge = getTournamentBadgeProps(tournament);
  const modeConfig = getTeamMode(tournament.teamMode);
  const registered = tournament.registeredTeamsCount ?? 0;
  const spotsLeft = tournament.maxTeams - registered;
  const fillPercent = (registered / tournament.maxTeams) * 100;
  const isFull = spotsLeft === 0;
  const canRegister = badge.variant === "open";

  if (featured) {
    return (
      <Link href={`/tournaments/${tournament.id}`} className="group block">
        <div className="bs-bento-card relative h-full overflow-hidden transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--primary)]/40">
          <div className="relative h-48 overflow-hidden bg-[#151515]">
            {tournament.bannerUrl && (
              <Image
                src={tournament.bannerUrl}
                alt={tournament.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                className="object-cover"
                unoptimized
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-black/10 to-black/35" />
            {!tournament.bannerUrl && (
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--primary)]/10 rounded-full blur-3xl" />
            )}
            <div className="absolute bottom-4 left-5">
              {tournament.featured && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold mb-2">
                  <Zap className="w-3 h-3" /> DESTAQUE
                </span>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badge.variant}>
                  {badge.variant === "ongoing" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                  {badge.label}
                </Badge>
                <span className="inline-flex items-center rounded-full border border-[var(--primary)]/35 bg-black/50 px-2.5 py-1 font-mono text-[10px] font-black text-[var(--primary)] backdrop-blur-sm">
                  {modeConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-lg font-bold mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-1">
              {tournament.name}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4 line-clamp-2">{tournament.description}</p>

            <div className="mb-4 flex items-center gap-3 border-y border-yellow-500/15 py-3">
              <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-yellow-400/70">Prêmio total no PIX</div>
                <div className="text-lg font-black text-yellow-400">{formatCurrency(tournament.prizeTotal)}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(tournament.startsAt ?? "")}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {registered}/{tournament.maxTeams} times · {modeConfig.label}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--muted-foreground)]">Vagas preenchidas</span>
                <span className={isFull ? "text-red-400 font-semibold" : "text-[var(--primary)] font-semibold"}>
                  {isFull ? "LOTADO" : `${spotsLeft} vagas`}
                </span>
              </div>
              <Progress value={fillPercent} className={isFull ? "[&>div]:bg-red-500" : ""} />
            </div>

            <Button variant={canRegister ? "gradient" : "outline"} size="sm" className="w-full gap-2">
              {canRegister ? "Inscrever-se" : "Ver Detalhes"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/tournaments/${tournament.id}`} className="group block">
      <div className="bs-bento-card card-hover flex items-center gap-4 p-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[#151515]">
          {tournament.bannerUrl ? (
            <Image
              src={tournament.bannerUrl}
              alt={tournament.name}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <Trophy className="w-6 h-6 text-[var(--primary)]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors truncate">
              {tournament.name}
            </h3>
            <Badge variant={badge.variant} className="shrink-0">
              {badge.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(tournament.startsAt ?? "")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {registered}/{tournament.maxTeams} · {modeConfig.label}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-sm font-black text-yellow-400">{formatCurrency(tournament.prizeTotal)}</div>
          <div className="text-xs text-[var(--muted-foreground)]">premiação</div>
        </div>

        <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}
