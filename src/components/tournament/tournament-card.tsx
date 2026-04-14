"use client";

import Link from "next/link";
import { Calendar, Users, Trophy, ArrowRight, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatCurrency, getStatusLabel } from "@/lib/utils";
import type { Tournament } from "@/types";

const STATUS_VARIANT: Record<string, "open" | "ongoing" | "finished" | "upcoming" | "live"> = {
  open: "open",
  ongoing: "ongoing",
  finished: "finished",
  upcoming: "upcoming",
};

interface TournamentCardProps {
  tournament: Tournament;
  featured?: boolean;
}

export default function TournamentCard({ tournament, featured = false }: TournamentCardProps) {
  const spotsLeft = tournament.maxTeams - tournament.registeredTeams;
  const fillPercent = (tournament.registeredTeams / tournament.maxTeams) * 100;
  const isFull = spotsLeft === 0;

  if (featured) {
    return (
      <Link href={`/tournaments/${tournament.id}`} className="group block">
        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden card-hover h-full">
          {/* Banner gradient */}
          <div className="relative h-44 bg-gradient-to-br from-cyan-950 via-slate-900 to-black overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent" />
            {/* Decorative glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--primary)]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-4 left-5">
              {tournament.featured && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold mb-2">
                  <Zap className="w-3 h-3" /> DESTAQUE
                </span>
              )}
              <Badge variant={STATUS_VARIANT[tournament.status]}>
                <span className={`w-1.5 h-1.5 rounded-full ${tournament.status === "ongoing" ? "bg-cyan-400 animate-pulse" : "bg-current"}`} />
                {getStatusLabel(tournament.status)}
              </Badge>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-lg font-bold mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-1">
              {tournament.name}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4 line-clamp-2">{tournament.description}</p>

            {/* Prize */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
              <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <div className="text-xs text-[var(--muted-foreground)]">Premiação Total</div>
                <div className="text-lg font-black text-yellow-400">{formatCurrency(tournament.prize)}</div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(tournament.startDate)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {tournament.registeredTeams}/{tournament.maxTeams} times
              </span>
            </div>

            {/* Fill bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--muted-foreground)]">Vagas preenchidas</span>
                <span className={isFull ? "text-red-400 font-semibold" : "text-[var(--primary)] font-semibold"}>
                  {isFull ? "LOTADO" : `${spotsLeft} vagas`}
                </span>
              </div>
              <Progress value={fillPercent} className={isFull ? "[&>div]:bg-red-500" : ""} />
            </div>

            <Button
              variant={tournament.status === "open" && !isFull ? "gradient" : "outline"}
              size="sm"
              className="w-full gap-2"
            >
              {tournament.status === "open" && !isFull ? "Inscrever-se" : "Ver Detalhes"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/tournaments/${tournament.id}`} className="group block">
      <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] card-hover">
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center shrink-0">
          <Trophy className="w-6 h-6 text-[var(--primary)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors truncate">
              {tournament.name}
            </h3>
            <Badge variant={STATUS_VARIANT[tournament.status]} className="shrink-0">
              {getStatusLabel(tournament.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(tournament.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {tournament.registeredTeams}/{tournament.maxTeams}
            </span>
          </div>
        </div>

        {/* Prize */}
        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-sm font-black text-yellow-400">{formatCurrency(tournament.prize)}</div>
          <div className="text-xs text-[var(--muted-foreground)]">premiação</div>
        </div>

        <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}
