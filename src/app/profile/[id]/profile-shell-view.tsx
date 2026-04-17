"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Gamepad2,
  Settings,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileEditModal from "./profile-edit-modal";
import RankGuideModal from "./rank-guide-modal";
import FaceitConnectModal from "./faceit-connect-modal";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import {
  calculateProfileCompletion,
  getEloBand,
  getMissingRequiredFields,
  getProfileAge,
  roleLabel,
  type InGameRole,
  type UserProfile,
} from "@/lib/profile";
import { getPlayerRank } from "@/lib/ranks";
import { cn, formatDate } from "@/lib/utils";
import type { MockRecentMatchSummary } from "@/data/competitive-mock";
import type { Team } from "@/types";
import type { FaceitTeam } from "@/lib/faceit";

interface ProfileShellViewProps {
  profile: UserProfile;
  stats: {
    winRate: number;
    kdRatio: number;
    hsRate: number;
  };
  teams: Team[];
  faceitTeams: FaceitTeam[];
  recentMatches: MockRecentMatchSummary[];
  isOwner: boolean;
  defaultEditOpen: boolean;
  showWelcome: boolean;
  showCompletionAlert: boolean;
  defaultTab: "matches" | "teams";
  showTeamCreatedNotice: boolean;
  showTeamDeletedNotice: boolean;
  faceitRankingPosition?: number | null;
}

export default function ProfileShellView({
  profile,
  stats,
  teams,
  faceitTeams,
  recentMatches,
  isOwner,
  defaultEditOpen,
  showWelcome,
  showCompletionAlert,
  defaultTab,
  showTeamCreatedNotice,
  showTeamDeletedNotice,
  faceitRankingPosition,
}: ProfileShellViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(defaultEditOpen);
  const [isRankGuideOpen, setIsRankGuideOpen] = useState(false);
  const [isFaceitModalOpen, setIsFaceitModalOpen] = useState(false);
  const searchParamsString = searchParams.toString();
  const activeTab = searchParams.get("tab") === "teams" ? "teams" : defaultTab;

  useEffect(() => {
    setIsEditModalOpen(defaultEditOpen);
  }, [defaultEditOpen]);

  useEffect(() => {
    setIsEditModalOpen(searchParams.get("edit") === "1");
    setIsRankGuideOpen(searchParams.get("guide") === "1");
  }, [searchParamsString, searchParams]);

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = value === "teams" ? "teams" : "matches";
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (tab === "matches") {
        nextSearchParams.delete("tab");
      } else {
        nextSearchParams.set("tab", tab);
      }

      const nextHref = nextSearchParams.toString() ? `${pathname}?${nextSearchParams.toString()}` : pathname;
      window.history.replaceState(null, "", nextHref);
    },
    [pathname, searchParams]
  );

  const updateOverlayParam = useCallback(
    (key: "edit" | "guide", open: boolean) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (open) {
        nextSearchParams.set(key, "1");
      } else {
        nextSearchParams.delete(key);
      }

      const nextHref = nextSearchParams.toString() ? `${pathname}?${nextSearchParams.toString()}` : pathname;
      window.history.replaceState(null, "", nextHref);
    },
    [pathname, searchParams]
  );

  const completion = calculateProfileCompletion(profile);
  const age = getProfileAge(profile.birthDate);
  const currentBand = getEloBand(profile.elo);
  const playerRank = getPlayerRank(profile.elo);
  const missingFields = getMissingRequiredFields(profile);
  const role = roleLabel(profile.inGameRole);
  const teamsDescription = isOwner
    ? "Monte sua line, acompanhe seus elencos e abra o hub do time em um clique."
    : `Veja os times em que ${profile.steamPersonaName} esta vinculado.`;
  const emptyTeamsMessage = isOwner
    ? "Crie seu time com 5 titulares e 1 substituto opcional para competir no hub."
    : "Este jogador ainda não tem times ativos vinculados ao perfil.";

  const openEditor = useCallback(() => {
    setIsEditModalOpen(true);
    updateOverlayParam("edit", true);
  }, [updateOverlayParam]);

  const closeEditor = useCallback(() => {
    setIsEditModalOpen(false);
    updateOverlayParam("edit", false);
  }, [updateOverlayParam]);

  const openRankGuide = useCallback(() => {
    setIsRankGuideOpen(true);
    updateOverlayParam("guide", true);
  }, [updateOverlayParam]);

  const closeRankGuide = useCallback(() => {
    setIsRankGuideOpen(false);
    updateOverlayParam("guide", false);
  }, [updateOverlayParam]);

  return (
    <>
      <div className="min-h-screen pb-20 pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {showCompletionAlert && isOwner && (
            <div className="mb-8 rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/6 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                    <ShieldCheck className="h-4 w-4" />
                    {showWelcome ? "Conta conectada com sucesso" : "Complete seu cadastro"}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {missingFields.length > 0
                      ? `Ainda faltam: ${missingFields.join(", ")}.`
                      : "Seu cadastro competitivo ja esta pronto para competir."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-44">
                    <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>Progresso</span>
                      <span className="font-semibold text-[var(--primary)]">{completion}%</span>
                    </div>
                    <Progress value={completion} />
                  </div>

                  <Button asChild variant="gradient" className="gap-2">
                    <Link href="/cadastro">
                      <Settings className="h-4 w-4" />
                      Ir para cadastro
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showTeamCreatedNotice && isOwner && (
            <div className="mb-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-300">
                <ShieldCheck className="h-4 w-4" />
                Time criado com sucesso
              </div>
              <p className="mt-2 text-sm leading-relaxed text-green-100/80">
                Seu time já está no hub, aparece no catálogo público e pode receber convites para campeonato.
              </p>
            </div>
          )}

          {showTeamDeletedNotice && isOwner && (
            <div className="mb-8 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-300">
                <ShieldCheck className="h-4 w-4" />
                Time removido
              </div>
              <p className="mt-2 text-sm leading-relaxed text-orange-100/80">
                O time foi arquivado e sua vaga ficou livre para montar outra line quando quiser.
              </p>
            </div>
          )}

          <div className="mb-8 flex flex-col gap-5 border-b border-[var(--border)] py-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-2 ring-[var(--primary)]/30">
                  <AvatarImage src={profile.steamAvatarUrl ?? undefined} alt={profile.steamPersonaName} />
                  <AvatarFallback className="text-xl font-black">
                    {profile.steamPersonaName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[var(--background)] bg-green-400" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black">{profile.steamPersonaName}</h1>
                  <Badge variant={currentBand.badgeVariant}>{playerRank.name}</Badge>
                  <Badge variant={completion === 100 ? "open" : "upcoming"}>
                    {completion === 100 ? "Cadastro OK" : "Cadastro pendente"}
                  </Badge>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {profile.elo} ELO
                  </span>
                  <span>|</span>
                  <span>{role}</span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {profile.bio ??
                    "Ainda sem bio pública. Abra a edição para contar como você joga, como se comunica e o que seu time pode esperar de você no servidor."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={openRankGuide}>
                <BookOpen className="h-4 w-4" />
                Rank Guide
              </Button>

              {profile.steamProfileUrl && (
                <Button asChild variant="outline" className="gap-2">
                  <Link href={profile.steamProfileUrl} target="_blank" rel="noreferrer">
                    Ver Steam
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              {isOwner && !profile.faceitId && (
                <button
                  type="button"
                  onClick={() => setIsFaceitModalOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-white transition-opacity hover:opacity-85"
                  style={{ backgroundColor: "#FF5500" }}
                >
                  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" aria-hidden="true">
                    <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="white"/>
                  </svg>
                  Conectar FACEIT
                </button>
              )}

              {isOwner && (
                <Button variant="gradient" className="gap-2" onClick={openEditor}>
                  <Settings className="h-4 w-4" />
                  Editar perfil
                </Button>
              )}
            </div>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 card-hover">
              <div className="mb-0 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--muted-foreground)]">Patente</span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="shrink-0">
                  <Image
                    src={playerRank.imagePath}
                    alt={playerRank.name}
                    width={76}
                    height={76}
                    className="h-[76px] w-[76px] object-contain drop-shadow-lg"
                    unoptimized
                  />
                </div>

                <div>
                  <div className="text-sm font-bold leading-tight text-[var(--foreground)]">{playerRank.name}</div>
                  <div className="mt-0.5 font-mono text-base font-black text-[var(--primary)]">{profile.elo} ELO</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 card-hover">
              <div className="mb-0 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-400" />
                <span className="text-sm font-semibold text-[var(--muted-foreground)]">Win rate</span>
              </div>
              <div className="pt-2.5 text-[1.75rem] font-black leading-none text-green-400">{stats.winRate}%</div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 card-hover">
              <div className="mb-0 flex items-center gap-2">
                <Swords className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold text-[var(--muted-foreground)]">K/D ratio</span>
              </div>
              <div className="pt-2.5 text-[1.75rem] font-black leading-none text-orange-400">{stats.kdRatio.toFixed(2)}</div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 card-hover">
              <div className="mb-0 flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-[var(--muted-foreground)]">HS rate</span>
              </div>
              <div className="pt-2.5 text-[1.75rem] font-black leading-none text-purple-400">{stats.hsRate}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-6 border border-[var(--border)] bg-[var(--card)]">
                  <TabsTrigger value="matches">Ultimas partidas</TabsTrigger>
                  <TabsTrigger value="teams">Times</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-3">
                  {recentMatches.length > 0 ? (
                    recentMatches.map((match) => (
                      <Link key={match.id} href={`/matches/${match.id}`} className="group block">
                        <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 card-hover">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900">
                            <Trophy className="h-5 w-5 text-[var(--primary)]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold transition-colors group-hover:text-[var(--primary)]">
                              {match.team1.tag} {match.team1.score} x {match.team2.score} {match.team2.tag}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                              <span>{match.map}</span>
                              <span>|</span>
                              <span>{match.tournamentName}</span>
                              <span>|</span>
                              <span>{formatDate(match.playedAt)}</span>
                            </div>
                          </div>

                          <Badge variant={match.status === "finished" ? "finished" : "live"}>
                            {match.status === "finished" ? "Finalizada" : "Ao vivo"}
                          </Badge>

                          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary)]" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
                      <Trophy className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-40" />
                      <h3 className="mb-2 font-semibold">Nenhuma partida recente</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Assim que você jogar suas partidas ranqueadas, elas aparecem aqui.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="teams" className="space-y-8">

                  {/* ── Times BlueStrike ── */}
                  <div>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                          <Users className="h-4 w-4" />
                          Times BlueStrike
                        </div>
                        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{teamsDescription}</p>
                      </div>
                      {isOwner && (
                        <Button asChild variant="gradient" size="sm" className="gap-2">
                          <Link href="/teams/create">
                            <Users className="h-4 w-4" />
                            Criar time
                          </Link>
                        </Button>
                      )}
                    </div>

                    {teams.length > 0 ? (
                      <div className="space-y-5">
                        {teams.map((team) => (
                          <div key={team.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 font-black text-[var(--primary)]">
                                  {team.tag}
                                </div>
                                <div>
                                  <div className="text-lg font-black">{team.name}</div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                    <span>{team.wins}V / {team.losses}D</span>
                                    <span>|</span>
                                    <span>{team.elo} ELO</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={team.isRecruiting ? "open" : "secondary"}>
                                  {team.isRecruiting ? "Recrutando" : "Line fechada"}
                                </Badge>
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/teams/${team.slug}`}>Abrir time</Link>
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {team.members?.map((member) => {
                                const nick = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "-";
                                const avatar = member.profile?.steamAvatarUrl ?? undefined;
                                const elo = member.profile?.elo ?? 0;
                                const isCaptain = member.profileId === team.captainId;
                                const memberRole = roleLabel(member.inGameRole as InGameRole | null);
                                return (
                                  <div key={member.id} className="flex items-center gap-3 rounded-xl bg-[var(--secondary)]/85 p-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarImage src={avatar} alt={nick} />
                                      <AvatarFallback className="text-xs font-bold">{nick.slice(0, 1).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-semibold text-[var(--foreground)]">{nick}</div>
                                      <div className="text-xs text-[var(--muted-foreground)]">{memberRole}</div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {isCaptain && <Badge variant="gold">Capitao</Badge>}
                                      <span className="text-xs font-bold text-[var(--primary)]">{elo} ELO</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center">
                        <Users className="mx-auto mb-4 h-10 w-10 text-[var(--muted-foreground)] opacity-40" />
                        <h3 className="mb-1 font-semibold">Nenhum time vinculado</h3>
                        <p className="text-sm text-[var(--muted-foreground)]">{emptyTeamsMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* ── Times FACEIT ── */}
                  {profile.faceitId && (
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: "#FF5500" }}>
                        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" aria-hidden="true">
                          <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500"/>
                        </svg>
                        Times FACEIT
                      </div>

                      {faceitTeams.length > 0 ? (
                        <div className="space-y-4">
                          {faceitTeams.map((team) => (
                            <div key={team.teamId} className="overflow-hidden rounded-2xl border border-[#FF5500]/20 bg-[var(--card)]">
                              {/* Cabeçalho do time */}
                              <div className="flex items-center justify-between border-b border-[#FF5500]/10 bg-[#FF5500]/6 px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {team.avatar ? (
                                    <Image
                                      src={team.avatar}
                                      alt={team.name}
                                      width={44}
                                      height={44}
                                      className="h-11 w-11 rounded-xl object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div
                                      className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black text-white"
                                      style={{ backgroundColor: "#FF5500" }}
                                    >
                                      {team.nickname.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-base font-black text-[var(--foreground)]">{team.name}</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">
                                      #{team.nickname} · CS2
                                    </div>
                                  </div>
                                </div>

                                {team.faceitUrl && (
                                  <Link
                                    href={team.faceitUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF5500]/30 px-3 py-1.5 text-xs font-bold transition-colors hover:border-[#FF5500]/60 hover:bg-[#FF5500]/10"
                                    style={{ color: "#FF5500" }}
                                  >
                                    Ver na FACEIT
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                )}
                              </div>

                              {/* Membros */}
                              {team.members.length > 0 && (
                                <div className="space-y-1.5 p-4">
                                  {team.members.map((member) => (
                                    <Link
                                      key={member.userId}
                                      href={member.faceitUrl || "#"}
                                      target={member.faceitUrl ? "_blank" : undefined}
                                      rel="noreferrer"
                                      className="group flex items-center gap-3 rounded-xl bg-[var(--secondary)]/70 p-2.5 transition-colors hover:bg-[#FF5500]/8"
                                    >
                                      {member.avatar ? (
                                        <Image
                                          src={member.avatar}
                                          alt={member.nickname}
                                          width={36}
                                          height={36}
                                          className="h-9 w-9 rounded-full object-cover ring-1 ring-[#FF5500]/20"
                                          unoptimized
                                        />
                                      ) : (
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5500]/15 text-xs font-black" style={{ color: "#FF5500" }}>
                                          {member.nickname.slice(0, 1).toUpperCase()}
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[#FF5500]">
                                          {member.nickname}
                                        </div>
                                        {member.membership === "leader" && (
                                          <div className="text-xs" style={{ color: "#FF5500" }}>Capitão</div>
                                        )}
                                      </div>

                                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[#FF5500]/15 bg-[var(--card)] px-6 py-10 text-center">
                          <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3 h-8 w-8 opacity-30" aria-hidden="true">
                            <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500"/>
                          </svg>
                          <h3 className="mb-1 font-semibold">Nenhum time CS2 na FACEIT</h3>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            Crie ou entre em um time de CS2 na FACEIT para ele aparecer aqui.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-5">
              {profile.faceitId && (
                <section className="overflow-hidden rounded-2xl border border-[#FF5500]/25 bg-[var(--card)]">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[#FF5500]/15 bg-[#FF5500]/8 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" aria-hidden="true">
                        <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500"/>
                      </svg>
                      <span className="text-sm font-black" style={{ color: "#FF5500" }}>FACEIT</span>
                    </div>
                    {profile.faceitLevel != null && (
                      <div className="flex items-center gap-1.5">
                        <FaceitSkillIcon level={profile.faceitLevel} size={24} />
                        <span className="text-xs font-bold text-[var(--muted-foreground)]">
                          Nível {profile.faceitLevel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Avatar Faceit */}
                    <div className="relative shrink-0">
                      {profile.faceitAvatar ? (
                        <Image
                          src={profile.faceitAvatar}
                          alt={profile.faceitNickname ?? ""}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full object-cover ring-2"
                          style={{ "--tw-ring-color": "#FF550050" } as React.CSSProperties}
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF5500]/15 text-sm font-black" style={{ color: "#FF5500" }}>
                          {(profile.faceitNickname ?? "F").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-[var(--foreground)]">
                        {profile.faceitNickname}
                      </div>
                      {profile.faceitElo != null && (
                        <div className="mt-0.5 font-mono text-lg font-black leading-none" style={{ color: "#FF5500" }}>
                          {profile.faceitElo} <span className="text-xs font-semibold text-[var(--muted-foreground)]">ELO</span>
                        </div>
                      )}
                      {faceitRankingPosition != null && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">Ranking comunidade</span>
                          <span className="rounded-md border border-[#FF5500]/25 bg-[#FF5500]/10 px-1.5 py-0.5 text-[10px] font-black tabular-nums" style={{ color: "#FF5500" }}>
                            #{faceitRankingPosition}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Level badge grande */}
                    {profile.faceitLevel != null && (
                      <FaceitSkillIcon level={profile.faceitLevel} size={36} className="shrink-0 drop-shadow" />
                    )}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  <Users className="h-4 w-4" />
                  Perfil público
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Idade</span>
                    <span className="font-medium">{age ? `${age} anos` : "Não informada"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Função</span>
                    <span className="font-medium">{role}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Patente</span>
                    <div className="flex items-center gap-2">
                      <Image
                        src={playerRank.imagePath}
                        alt={playerRank.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                        unoptimized
                      />
                      <span className={cn("text-xs font-semibold", currentBand.accentClass)}>{playerRank.name}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  <ShieldCheck className="h-4 w-4" />
                  Status competitivo
                </div>

                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Cadastro</span>
                  <Badge variant={completion === 100 ? "open" : "upcoming"}>
                    {completion === 100 ? "OK" : "Pendente"}
                  </Badge>
                </div>

                <Progress value={completion} />

                <p className="mt-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  CPF, celular e data de nascimento ficam protegidos e só aparecem no modo de edição do próprio jogador.
                </p>
              </section>

              {isOwner && (
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                    <Gamepad2 className="h-4 w-4" />
                    Conta conectada
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--muted-foreground)]">Steam</span>
                      <span className="font-medium">{profile.steamPersonaName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--muted-foreground)]">SteamID</span>
                      <span className="font-mono text-xs text-[var(--foreground)]">{profile.steamId}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--muted-foreground)]">Nivel Steam</span>
                      <span className="font-medium text-[var(--primary)]">{profile.steamLevel}</span>
                    </div>
                  </div>
                </section>
              )}

            </div>
          </div>
        </div>
      </div>

      <ProfileEditModal profile={profile} isOpen={isEditModalOpen} onClose={closeEditor} />
      <RankGuideModal currentElo={profile.elo} isOpen={isRankGuideOpen} onClose={closeRankGuide} />
      <FaceitConnectModal isOpen={isFaceitModalOpen} onClose={() => setIsFaceitModalOpen(false)} />
    </>
  );
}
