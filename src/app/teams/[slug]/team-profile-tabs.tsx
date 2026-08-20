"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ShieldCheck, Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KickMemberButton } from "./team-management-controls";
import { getProfilePath } from "@/lib/profile";
import { cn, formatDate } from "@/lib/utils";
import type { TeamMember } from "@/types";
import type { TeamMatchSummary } from "@/lib/matches";

const ROLE_LABELS: Record<string, string> = {
  igl: "IGL", awper: "AWPer", "entry-fragger": "Entry", rifler: "Rifler", lurker: "Lurker", support: "Suporte", coach: "Coach",
};

function PlayerTile({ member, captainId, teamSlug, canManage }: { member: TeamMember; captainId: string; teamSlug: string; canManage: boolean }) {
  const name = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "Jogador";
  const role = member.inGameRole ? ROLE_LABELS[member.inGameRole] ?? member.inGameRole : "Sem função";
  const href = member.profile?.publicId ? getProfilePath(member.profile.publicId) : null;
  const content = (
    <div className="group flex min-h-[190px] flex-col items-center rounded-xl border border-[var(--border)] bg-white p-4 text-center transition-colors hover:border-[var(--primary)]/35">
      <Avatar className="h-16 w-16 border border-[var(--border)]"><AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={name} /><AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
      <div className="mt-3 flex items-center gap-1.5"><h3 className="max-w-[120px] truncate font-semibold group-hover:text-[var(--primary)]">{name}</h3>{member.profileId === captainId && <ShieldCheck className="h-3.5 w-3.5 text-amber-600" aria-label="Capitão" />}</div>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{role}</p>
      <div className="mt-3 flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">{member.profile?.faceitLevel ? <FaceitSkillIcon level={member.profile.faceitLevel} size={14} /> : null} FACEIT {member.profile?.faceitLevel ? `LEVEL ${member.profile.faceitLevel}` : "NÃO CONECTADO"}</div>
      <div className="mt-auto pt-2 font-mono text-xs font-bold text-[var(--primary)]">{member.profile?.elo ?? 1000} ELO</div>
    </div>
  );
  return (
    <div className="relative">
      {href ? <Link href={href}>{content}</Link> : content}
      {canManage && member.profileId !== captainId && <div className="absolute right-2 top-2"><KickMemberButton teamSlug={teamSlug} memberId={member.id} displayName={name} /></div>}
    </div>
  );
}

export function TeamProfileTabs({ starters, substitutes, isCaptain, captainId, teamSlug, recentMatches }: { starters: TeamMember[]; substitutes: TeamMember[]; isCaptain: boolean; captainId: string; teamSlug: string; recentMatches: TeamMatchSummary[] }) {
  const [activeTab, setActiveTab] = useState<"roster" | "matches">("roster");
  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
      <TabsList className="mb-5 border border-[var(--border)] bg-white"><TabsTrigger value="roster">Lineup</TabsTrigger><TabsTrigger value="matches">Resultados recentes</TabsTrigger></TabsList>
      <TabsContent value="roster">
        <section className="bs-panel p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold tracking-[-0.025em]">Lineup</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Titulares e reservas registrados no time.</p></div><Badge variant={starters.length >= 5 ? "open" : "upcoming"}>{starters.length}/5 titulares</Badge></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
            {starters.map((member) => <PlayerTile key={member.id} member={member} captainId={captainId} teamSlug={teamSlug} canManage={isCaptain} />)}
            {Array.from({ length: Math.max(0, 5 - starters.length) }).map((_, index) => <div key={index} className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--secondary)]/40 p-4 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--muted-foreground)]"><Users className="h-5 w-5" /></div><span className="mt-3 text-xs text-[var(--muted-foreground)]">Vaga titular</span></div>)}
          </div>
          {substitutes.length > 0 && <div className="mt-6 border-t border-[var(--border)] pt-5"><h3 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">Reservas</h3><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">{substitutes.map((member) => <PlayerTile key={member.id} member={member} captainId={captainId} teamSlug={teamSlug} canManage={isCaptain} />)}</div></div>}
        </section>
      </TabsContent>
      <TabsContent value="matches" className="space-y-3">
        {recentMatches.length ? recentMatches.map((match) => {
          const href = match.tournamentId ? `/tournaments/${match.tournamentId}/matches/${match.matchId}` : `/matches/${match.matchId}`;
          const finished = match.status === "finished" || match.status === "walkover";
          return <Link key={match.matchId} href={href} className="group block"><div className="bs-panel flex items-center gap-4 p-4"><div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold", !finished ? "bg-blue-50 text-blue-700" : match.isWinner ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{!finished ? "AO" : match.isWinner ? "V" : "D"}</div><div className="min-w-0 flex-1"><div className="font-mono text-sm font-bold"><span>{match.team1Tag}</span> <span className="text-[var(--muted-foreground)]">{match.team1Score} x {match.team2Score}</span> <span>{match.team2Tag}</span></div><div className="mt-1 text-xs text-[var(--muted-foreground)]">{match.tournamentName}{match.playedAt ? ` | ${formatDate(match.playedAt)}` : ""}</div></div><ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)]" /></div></Link>;
        }) : <div className="bs-panel px-6 py-14 text-center"><Trophy className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" /><h3 className="mt-4 font-semibold">Nenhuma partida recente</h3><p className="mt-1 text-sm text-[var(--muted-foreground)]">As partidas aparecem aqui depois de jogadas.</p></div>}
      </TabsContent>
    </Tabs>
  );
}
