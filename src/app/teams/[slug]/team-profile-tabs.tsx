"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KickMemberButton } from "./team-management-controls";
import { getProfilePath } from "@/lib/profile";
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

interface TeamProfileTabsProps {
  starters: TeamMember[];
  substitutes: TeamMember[];
  isCaptain: boolean;
  captainId: string;
  teamSlug: string;
  recentMatches: TeamMatchSummary[];
}

export function TeamProfileTabs({
  starters,
  substitutes,
  isCaptain,
  captainId,
  teamSlug,
  recentMatches,
}: TeamProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"roster" | "matches">("roster");

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
      <TabsList className="mb-6 border border-[var(--border)] bg-[var(--card)]">
        <TabsTrigger value="roster">Elenco</TabsTrigger>
        <TabsTrigger value="matches">Últimas partidas</TabsTrigger>
      </TabsList>

      <TabsContent value="roster">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Users className="h-4 w-4" />
              Line principal
            </div>
            <Badge variant={starters.length >= 5 ? "open" : "upcoming"}>
              {starters.length}/5 titulares
            </Badge>
          </div>

          <div className="space-y-3">
            {starters.map((member) => {
              const displayName = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "Jogador";
              const role = member.inGameRole ? (ROLE_LABELS[member.inGameRole] ?? member.inGameRole) : "Sem função";
              const isMemberCaptain = member.profileId === captainId;
              const profileHref = member.profile?.publicId ? getProfilePath(member.profile.publicId) : null;

              return (
                <div key={member.id} className="flex flex-col gap-3 rounded-xl bg-[var(--secondary)] p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {profileHref ? (
                      <Link href={profileHref} className="shrink-0">
                        <Avatar className="h-10 w-10 ring-1 ring-[var(--border)] transition-opacity hover:opacity-80">
                          <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                          <AvatarFallback className="text-xs">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                        <AvatarFallback className="text-xs">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0 flex-1">
                      {profileHref ? (
                        <Link href={profileHref} className="truncate text-sm font-semibold transition-colors hover:text-[var(--primary)]">
                          {displayName}
                        </Link>
                      ) : (
                        <div className="truncate text-sm font-semibold">{displayName}</div>
                      )}
                      <div className="text-xs text-[var(--muted-foreground)]">{role}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isMemberCaptain && <Badge variant="gold">Capitão</Badge>}
                    <span className="text-xs font-bold text-[var(--primary)]">{member.profile?.elo ?? 1000} ELO</span>
                    {isCaptain && !isMemberCaptain && (
                      <KickMemberButton teamSlug={teamSlug} memberId={member.id} displayName={displayName} />
                    )}
                  </div>
                </div>
              );
            })}

            {Array.from({ length: Math.max(0, 5 - starters.length) }).map((_, index) => (
              <div
                key={`starter-empty-${index}`}
                className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--border)] px-3 py-4 opacity-60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
                  <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
                <span className="text-sm text-[var(--muted-foreground)]">Vaga titular em aberto</span>
              </div>
            ))}
          </div>

          {substitutes.length > 0 && (
            <div className="mt-5 border-t border-[var(--border)] pt-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Substitutos
              </div>
              <div className="space-y-3">
                {substitutes.map((member) => {
                  const displayName = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "Jogador";
                  const subProfileHref = member.profile?.publicId ? getProfilePath(member.profile.publicId) : null;

                  return (
                    <div key={member.id} className="flex flex-col gap-3 rounded-xl bg-[var(--secondary)] p-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {subProfileHref ? (
                          <Link href={subProfileHref} className="shrink-0">
                            <Avatar className="h-10 w-10 ring-1 ring-[var(--border)] transition-opacity hover:opacity-80">
                              <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                              <AvatarFallback className="text-xs">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </Link>
                        ) : (
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                            <AvatarFallback className="text-xs">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        {subProfileHref ? (
                          <Link href={subProfileHref} className="truncate text-sm font-semibold transition-colors hover:text-[var(--primary)]">
                            {displayName}
                          </Link>
                        ) : (
                          <span className="truncate text-sm font-semibold">{displayName}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Sub</Badge>
                        <span className="text-xs font-bold text-[var(--primary)]">{member.profile?.elo ?? 1000} ELO</span>
                        {isCaptain && (
                          <KickMemberButton teamSlug={teamSlug} memberId={member.id} displayName={displayName} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </TabsContent>

      <TabsContent value="matches" className="space-y-3">
        {recentMatches.length > 0 ? (
          recentMatches.map((match) => {
            const href = match.tournamentId
              ? `/tournaments/${match.tournamentId}/matches/${match.matchId}`
              : `/matches/${match.matchId}`;
            const isFinished = match.status === "finished" || match.status === "walkover";
            return (
              <Link key={match.matchId} href={href} className="group block">
                <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 card-hover">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-black",
                    !isFinished
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                      : match.isWinner
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                  )}>
                    {!isFinished ? "AO" : match.isWinner ? "V" : "D"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-mono text-sm font-bold transition-colors group-hover:text-[var(--primary)]">
                      <span>{match.team1Tag}</span>
                      <span className="text-[var(--muted-foreground)]">{match.team1Score}</span>
                      <span className="text-[var(--muted-foreground)]">×</span>
                      <span className="text-[var(--muted-foreground)]">{match.team2Score}</span>
                      <span>{match.team2Tag}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
                      <span>{match.tournamentName}</span>
                      {match.playedAt && <><span>·</span><span>{formatDate(match.playedAt)}</span></>}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary)]" />
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-40" />
            <h3 className="mb-2 font-semibold">Nenhuma partida recente</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              As partidas do time aparecem aqui após serem jogadas.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
