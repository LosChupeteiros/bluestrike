import Link from "next/link";
import { CalendarClock, Crown, Swords, Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { KickMemberButton } from "./team-management-controls";
import { getProfilePath } from "@/lib/profile";
import { getTeamMode, type TeamMode } from "@/lib/team-modes";
import { cn, formatDate } from "@/lib/utils";
import type { TeamMember } from "@/types";
import type { TeamMatchSummary } from "@/lib/matches";

const ROLE_LABELS: Record<string, string> = {
  igl: "IGL",
  awper: "AWPer",
  "entry-fragger": "Entry Fragger",
  rifler: "Rifler",
  lurker: "Lurker",
  support: "Support",
  coach: "Coach",
};

interface TeamRosterSectionProps {
  teamMode: TeamMode;
  teamTag: string;
  starters: TeamMember[];
  substitutes: TeamMember[];
  isCaptain: boolean;
  captainId: string;
  teamSlug: string;
  recentMatches: TeamMatchSummary[];
}

function PlayerCard({
  member,
  captainId,
  isCaptain,
  teamSlug,
  variant,
}: {
  member: TeamMember;
  captainId: string;
  isCaptain: boolean;
  teamSlug: string;
  variant: "starter" | "sub";
}) {
  const displayName = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "Jogador";
  const role = member.inGameRole ? (ROLE_LABELS[member.inGameRole] ?? member.inGameRole) : "Sem função";
  const isMemberCaptain = member.profileId === captainId;
  const profileHref = member.profile?.publicId ? getProfilePath(member.profile.publicId) : null;
  const elo = member.profile?.elo;

  const inner = (
    <>
      <div className="relative">
        <Avatar
          className={cn(
            "ring-1 transition-all",
            variant === "starter" ? "h-16 w-16" : "h-11 w-11",
            isMemberCaptain
              ? "ring-[#f5c842]/45"
              : "ring-[var(--border)] group-hover:ring-[var(--primary)]/40"
          )}
        >
          <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt="" />
          <AvatarFallback className="text-xs font-black">
            {displayName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isMemberCaptain && (
          <span
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--card)] bg-[#f5c842]"
            title="Capitão"
          >
            <Crown className="h-2.5 w-2.5 text-black" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className={cn("min-w-0", variant === "starter" ? "text-center" : "flex-1")}>
        <p
          className={cn(
            "truncate font-bold transition-colors group-hover:text-[var(--primary)]",
            variant === "starter" ? "text-sm" : "text-xs"
          )}
        >
          {displayName}
        </p>
        <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
          {role}
        </p>
      </div>

      {elo != null && (
        <span
          className={cn(
            "font-mono font-black text-[var(--primary)]",
            variant === "starter" ? "text-sm" : "ml-auto text-xs"
          )}
        >
          {elo}
        </span>
      )}
    </>
  );

  const shell = cn(
    "group relative rounded-xl border border-[var(--border)] bg-black/15 transition-colors hover:border-[var(--primary)]/35",
    variant === "starter"
      ? "flex min-h-[168px] flex-col items-center justify-center gap-2.5 p-4"
      : "flex items-center gap-3 p-3"
  );

  return (
    <div className={shell}>
      {profileHref ? (
        <Link href={profileHref} className="contents">
          {inner}
        </Link>
      ) : (
        inner
      )}

      {isCaptain && !isMemberCaptain && (
        <div className="absolute right-1.5 top-1.5">
          <KickMemberButton teamSlug={teamSlug} memberId={member.id} displayName={displayName} />
        </div>
      )}
    </div>
  );
}

export function TeamRosterSection({
  teamMode,
  teamTag,
  starters,
  substitutes,
  isCaptain,
  captainId,
  teamSlug,
  recentMatches,
}: TeamRosterSectionProps) {
  const modeConfig = getTeamMode(teamMode);
  const emptySlots = Math.max(0, modeConfig.playersPerTeam - starters.length);

  return (
    <div className="space-y-6">
      {/* ── Line principal ── */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Line principal
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-[var(--primary)]/25 bg-[var(--primary)]/10 px-2 py-0.5 font-mono text-[10px] font-black text-[var(--primary)]">
              {modeConfig.label}
            </span>
            <Badge variant={starters.length >= modeConfig.playersPerTeam ? "open" : "upcoming"}>
              {starters.length}/{modeConfig.playersPerTeam}{" "}
              {modeConfig.playersPerTeam === 1 ? "titular" : "titulares"}
            </Badge>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-3",
            modeConfig.playersPerTeam === 1
              ? "sm:max-w-xs"
              : modeConfig.playersPerTeam === 2
                ? "grid-cols-2 sm:max-w-md"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          )}
        >
          {starters.map((member) => (
            <PlayerCard
              key={member.id}
              member={member}
              captainId={captainId}
              isCaptain={isCaptain}
              teamSlug={teamSlug}
              variant="starter"
            />
          ))}

          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`slot-${index}`}
              className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-3 text-center"
            >
              <Users className="h-6 w-6 text-[var(--muted-foreground)]/35" aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]/70">
                Vaga aberta
              </span>
            </div>
          ))}
        </div>

        {substitutes.length > 0 && (
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Reservas
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {substitutes.map((member) => (
                <PlayerCard
                  key={member.id}
                  member={member}
                  captainId={captainId}
                  isCaptain={isCaptain}
                  teamSlug={teamSlug}
                  variant="sub"
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Últimas partidas ── */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            <Swords className="h-3.5 w-3.5" aria-hidden="true" />
            Últimas partidas
          </div>
          {recentMatches.length > 0 && (
            <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
              {recentMatches.length} registrada{recentMatches.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {recentMatches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
            <Trophy className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/35" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold">Nenhuma partida disputada</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              O retrospecto aparece aqui assim que o time entrar em quadra.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
            {recentMatches.map((match) => {
              const href = match.tournamentId
                ? `/tournaments/${match.tournamentId}/matches/${match.matchId}`
                : `/matches/${match.matchId}`;
              const isFinished = match.status === "finished" || match.status === "walkover";
              const isTeam1 = match.team1Tag === teamTag;
              const opponentTag = isTeam1 ? match.team2Tag : match.team1Tag;
              const ownScore = isTeam1 ? match.team1Score : match.team2Score;
              const opponentScore = isTeam1 ? match.team2Score : match.team1Score;

              return (
                <Link
                  key={match.matchId}
                  href={href}
                  className="group flex items-center gap-3 bg-[var(--card)] px-4 py-3.5 transition-colors hover:bg-[var(--primary)]/[0.04]"
                >
                  {/* Faixa de resultado */}
                  <span
                    className={cn(
                      "h-10 w-1 shrink-0 rounded-full",
                      !isFinished ? "bg-blue-400" : match.isWinner ? "bg-emerald-400" : "bg-red-400"
                    )}
                    aria-hidden="true"
                  />

                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black",
                      !isFinished
                        ? "bg-blue-500/12 text-blue-400"
                        : match.isWinner
                          ? "bg-emerald-500/12 text-emerald-400"
                          : "bg-red-500/12 text-red-400"
                    )}
                  >
                    {!isFinished ? "AO" : match.isWinner ? "V" : "D"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold transition-colors group-hover:text-[var(--primary)]">
                      <span className="font-mono text-[var(--muted-foreground)]">vs</span> {opponentTag}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-[var(--muted-foreground)]">
                      {match.tournamentName && <span className="truncate">{match.tournamentName}</span>}
                      {match.tournamentName && match.playedAt && <span aria-hidden="true">·</span>}
                      {match.playedAt && (
                        <span className="inline-flex shrink-0 items-center gap-1">
                          <CalendarClock className="h-3 w-3" aria-hidden="true" />
                          {formatDate(match.playedAt)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right font-mono">
                    <span
                      className={cn(
                        "text-lg font-black tabular-nums",
                        match.isWinner ? "text-emerald-400" : "text-[var(--foreground)]"
                      )}
                    >
                      {ownScore}
                    </span>
                    <span className="mx-1 text-[var(--muted-foreground)]">:</span>
                    <span
                      className={cn(
                        "text-lg font-black tabular-nums",
                        match.isWinner ? "text-[var(--foreground)]" : "text-red-400"
                      )}
                    >
                      {opponentScore}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
