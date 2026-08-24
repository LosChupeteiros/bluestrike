"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Crown,
  ExternalLink,
  Gamepad2,
  Plus,
  Settings,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProfileEditModal from "./profile-edit-modal";
import RankGuideModal from "./rank-guide-modal";
import FaceitConnectModal from "./faceit-connect-modal";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import {
  calculateProfileCompletion,
  getEloBand,
  getMissingRequiredFields,
  roleLabel,
  type UserProfile,
} from "@/lib/profile";
import { getMapLabel } from "@/lib/maps";
import { getTeamMode } from "@/lib/team-modes";
import { getPlayerRank } from "@/lib/ranks";
import { cn, formatDate } from "@/lib/utils";
import type { RecentMatchSummary } from "@/lib/matches";
import type { Team } from "@/types";
import type { FaceitTeam } from "@/lib/faceit";
import EloTrendChart, { type EloTrendPoint } from "@/components/profile/elo-trend-chart";

interface ProfileShellViewProps {
  profile: UserProfile;
  /** `null` quando o jogador nao tem FACEIT vinculado. */
  stats: {
    winRate: number;
    kdRatio: number;
    hsRate: number;
  } | null;
  teams: Team[];
  faceitTeams: FaceitTeam[];
  recentMatches: RecentMatchSummary[];
  isOwner: boolean;
  defaultEditOpen: boolean;
  showWelcome: boolean;
  showCompletionAlert: boolean;
  /** Idade calculada no servidor — a data de nascimento não é enviada ao cliente */
  publicAge: number | null;
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
  publicAge,
  showTeamCreatedNotice,
  showTeamDeletedNotice,
  faceitRankingPosition,
}: ProfileShellViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(defaultEditOpen);
  const [isRankGuideOpen, setIsRankGuideOpen] = useState(false);
  const [isFaceitModalOpen, setIsFaceitModalOpen] = useState(false);
  const [matchesPage, setMatchesPage] = useState(1);
  const searchParamsString = searchParams.toString();
  const matchesPageSize = 5;
  const matchesTotalPages = Math.max(1, Math.ceil(recentMatches.length / matchesPageSize));
  const visibleRecentMatches = recentMatches.slice((matchesPage - 1) * matchesPageSize, matchesPage * matchesPageSize);

  const chronologicalTrendMatches = recentMatches
    .filter((match) => match.eloDelta !== null && match.status === "finished")
    .sort((left, right) => {
      const leftTime = left.playedAt ? Date.parse(left.playedAt) : 0;
      const rightTime = right.playedAt ? Date.parse(right.playedAt) : 0;
      return leftTime - rightTime;
    })
    .slice(-5);
  const trendDelta = chronologicalTrendMatches.reduce((sum, match) => sum + (match.eloDelta ?? 0), 0);
  const trendStartingElo = profile.elo - trendDelta;
  const eloTrendPoints: EloTrendPoint[] = chronologicalTrendMatches
    .map((match, index) => {
      const reconstructedElo = trendStartingElo + chronologicalTrendMatches
        .slice(0, index + 1)
        .reduce((sum, item) => sum + (item.eloDelta ?? 0), 0);
      return {
        matchId: match.matchId,
        tournamentId: match.tournamentId,
        team1Tag: match.team1Tag,
        team2Tag: match.team2Tag,
        team1Score: match.team1Score,
        team2Score: match.team2Score,
        eloAfter: reconstructedElo,
        eloDelta: match.eloDelta ?? 0,
        isWinner: match.eloDelta !== null ? match.eloDelta > 0 : match.isWinner,
        playedAt: match.playedAt,
      };
    });

  useEffect(() => {
    setIsEditModalOpen(defaultEditOpen);
  }, [defaultEditOpen]);

  useEffect(() => {
    setIsEditModalOpen(searchParams.get("edit") === "1");
    setIsRankGuideOpen(searchParams.get("guide") === "1");
  }, [searchParamsString, searchParams]);

  useEffect(() => {
    setMatchesPage(1);
  }, [profile.id]);

  useEffect(() => {
    if (matchesPage > matchesTotalPages) setMatchesPage(matchesTotalPages);
  }, [matchesPage, matchesTotalPages]);

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
  const age = publicAge;
  const currentBand = getEloBand(profile.elo);
  const playerRank = getPlayerRank(profile.elo);
  const missingFields = getMissingRequiredFields(profile);
  const role = roleLabel(profile.inGameRole);
  const emptyTeamsMessage = isOwner
    ? "Crie uma line em qualquer modalidade — de 1x1 a 5x5 — para competir no hub."
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
      <div className="bs-page pb-24 pt-28">
        <div className="bs-shell">
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

          <header className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1012] text-white shadow-[0_32px_90px_rgba(0,0,0,.28)]">
            <span className="absolute -right-24 -top-40 h-[34rem] w-[34rem] rounded-full border-[5rem] border-[#00c8ff]/12" aria-hidden="true" />
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(0,200,255,.13),transparent_35%)]" aria-hidden="true" />
            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(25rem,.65fr)] lg:items-center lg:p-10">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <Avatar className="h-40 w-40 rounded-[1.7rem] border border-[#00c8ff]/35 ring-4 ring-[#00c8ff]/10 sm:h-48 sm:w-48 lg:h-52 lg:w-52">
                    <AvatarImage src={profile.steamAvatarUrl ?? undefined} alt={profile.steamPersonaName} />
                    <AvatarFallback className="rounded-[1.7rem] bg-[#00c8ff]/10 text-5xl font-black text-[#00c8ff]">{profile.steamPersonaName.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-[#0d1012] bg-emerald-400" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">{profile.steamPersonaName}</h1>
                    <Badge variant="ongoing">{role}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/52"><span>@{profile.steamPersonaName.toLowerCase().replace(/\s+/g, "")}</span><span>·</span><span>Membro desde {new Date(profile.createdAt).getFullYear()}</span></div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/8 px-3 py-2 text-xs font-black text-emerald-400"><ShieldCheck className="h-4 w-4" /> STEAM VERIFICADA</span>
                    {profile.faceitLevel != null && <span className="inline-flex items-center gap-2 rounded-xl border border-[#ff7a00]/28 bg-[#ff7a00]/9 px-3 py-2 text-xs font-black text-[#ff7a00]"><FaceitSkillIcon level={profile.faceitLevel} size={18} /> FACEIT LEVEL {profile.faceitLevel}</span>}
                  </div>
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-white/62">{profile.bio ?? "Ainda sem bio pública. Conte como você joga, como se comunica e o que sua próxima lineup pode esperar de você."}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="gap-2 border-white/14 bg-white/6 text-white shadow-none hover:border-white/30 hover:bg-white/10 hover:text-white" onClick={openRankGuide}><BookOpen className="h-4 w-4" /> Rank Guide</Button>
                    {profile.steamProfileUrl && <Button asChild variant="outline" className="gap-2 border-white/14 bg-white/6 text-white shadow-none hover:border-white/30 hover:bg-white/10 hover:text-white"><Link href={profile.steamProfileUrl} target="_blank" rel="noreferrer">Ver Steam <ExternalLink className="h-4 w-4" /></Link></Button>}
                    {isOwner && !profile.faceitId && <button type="button" onClick={() => setIsFaceitModalOpen(true)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#ff5500] px-5 text-sm font-black text-white transition-[filter,transform] hover:brightness-110 active:scale-[.985]"><svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true"><path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="white" /></svg>Conectar FACEIT</button>}
                    {isOwner && <Button variant="gradient" className="gap-2" onClick={openEditor}><Settings className="h-4 w-4" /> Editar perfil</Button>}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/26 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md">
                <div className="grid grid-cols-2 divide-x divide-white/10">
                  <div className="p-5 sm:p-6"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/46">BlueStrike ELO</span><strong className="mt-3 block font-mono text-4xl text-[#00c8ff] sm:text-5xl">{profile.elo.toLocaleString("pt-BR")}</strong><span className="mt-2 block text-xs font-bold text-[#00c8ff]">{playerRank.name}</span></div>
                  <div className="p-5 sm:p-6"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/46">FACEIT ELO</span><strong className="mt-3 block font-mono text-4xl text-[#ff7a00] sm:text-5xl">{profile.faceitElo?.toLocaleString("pt-BR") ?? "—"}</strong><span className="mt-2 block text-xs font-bold text-[#ff7a00]">{profile.faceitLevel ? `Level ${profile.faceitLevel}` : "Não vinculada"}</span></div>
                </div>
                <div className="flex items-center gap-4 border-t border-white/10 px-5 py-4 sm:px-6">
                  <Image src={playerRank.imagePath} alt={playerRank.name} width={62} height={62} className="h-14 w-14 object-contain drop-shadow-lg" unoptimized />
                  <div><span className="text-[9px] font-black uppercase tracking-[.14em] text-white/38">Patente atual</span><strong className="mt-1 block text-base text-white">{playerRank.name}</strong></div>
                </div>
              </div>
            </div>
          </header>

          {/* Sem FACEIT vinculado não há estatística para mostrar. O estado
              vazio é honesto — antes esses três números eram derivados do ELO e
              apareciam como se fossem desempenho real do jogador. */}
          <div className="bs-bento-card mb-6 grid overflow-hidden sm:grid-cols-3" data-reveal>
            {[
              { icon: Trophy, label: "Win rate", value: stats ? `${stats.winRate}%` : "—", tone: stats ? "text-emerald-500" : "text-[var(--muted-foreground)]" },
              { icon: Swords, label: "K/D ratio", value: stats ? stats.kdRatio.toFixed(2) : "—", tone: stats ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]" },
              { icon: Target, label: "Headshots", value: stats ? `${stats.hsRate}%` : "—", tone: stats ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]" },
            ].map((item, index) => (
              <div key={item.label} className={`flex min-h-36 items-center gap-5 p-6 sm:p-8 ${index > 0 ? "border-t border-[var(--border)] sm:border-l sm:border-t-0" : ""}`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/8 text-[var(--primary)]"><item.icon className="h-5 w-5" /></span>
                <div><span className="text-[10px] font-black uppercase tracking-[.14em] text-[var(--primary)]">{item.label}</span><strong className={cn("mt-2 block text-5xl font-black leading-none tracking-[-.065em]", item.tone)}>{item.value}</strong></div>
              </div>
            ))}
          </div>

          {!stats && (
            <p className="mb-6 text-center text-xs text-[var(--muted-foreground)]">
              Conecte uma conta FACEIT no perfil para ver estatísticas de partida.
            </p>
          )}

          <div className="mb-8">
            <EloTrendChart points={eloTrendPoints} />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Metade e metade: partidas de um lado, times do outro */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* ── Últimas partidas ── */}
                <section className="min-w-0 scroll-mt-28" id="partidas">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                      <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                      Últimas partidas
                    </h2>
                    {recentMatches.length > 0 && (
                      <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                        {recentMatches.length}
                      </span>
                    )}
                  </div>
                  {recentMatches.length > 0 ? (
                    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
                    {visibleRecentMatches.map((match) => {
                      // Todos os mapas da série levam para a mesma partida,
                      // já com o mapa daquela linha selecionado.
                      const mapQuery = match.mapNumber !== null ? `?map=${match.mapNumber}` : "";
                      const href = match.tournamentId
                        ? `/tournaments/${match.tournamentId}/matches/${match.matchId}${mapQuery}`
                        : `/matches/${match.matchId}`;
                      const isFinished = match.status === "finished";
                      const isSeries = match.seriesMapCount > 1;
                      const didWin = match.eloDelta !== null ? match.eloDelta > 0 : match.isWinner;
                      return (
                        <Link key={`${match.matchId}-${match.mapNumber ?? 0}`} href={href} className="group block border-b border-[var(--border)] last:border-b-0">
                          <div className="flex min-h-[4.5rem] items-center gap-3 px-4 py-3.5 transition-colors duration-300 hover:bg-[var(--primary)]/[0.04]">
                            {/* Result indicator */}
                            {/* Faixa de resultado */}
                            <span
                              className={cn(
                                "h-11 w-1 shrink-0 rounded-full",
                                !isFinished ? "bg-blue-400" : didWin ? "bg-emerald-400" : "bg-red-400"
                              )}
                              aria-hidden="true"
                            />

                            <div className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black",
                              !isFinished
                                ? "bg-blue-500/12 text-blue-400"
                                : didWin
                                  ? "bg-emerald-500/12 text-emerald-400"
                                  : "bg-red-500/12 text-red-400"
                            )}>
                              {!isFinished ? "AO" : didWin ? "V" : "D"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-mono text-[13px] font-bold transition-colors group-hover:text-[var(--primary)]">
                                  {match.team1Tag} <span className="text-[var(--muted-foreground)]">vs</span> {match.team2Tag}
                                </span>
                                {isSeries && (
                                  <span
                                    className="shrink-0 rounded bg-[var(--primary)]/10 px-1.5 py-0.5 font-mono text-[10px] font-black tabular-nums text-[var(--primary)]"
                                    title="Placar da série (mapas vencidos)"
                                  >
                                    {match.seriesTeam1Score}–{match.seriesTeam2Score}
                                  </span>
                                )}
                                {match.eloDelta !== null && (
                                  <span
                                    className={cn(
                                      "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-black tabular-nums",
                                      match.eloDelta >= 0
                                        ? "bg-emerald-500/12 text-emerald-400"
                                        : "bg-red-500/12 text-red-400"
                                    )}
                                  >
                                    {match.eloDelta >= 0 ? "+" : ""}{match.eloDelta}
                                  </span>
                                )}
                              </div>

                              <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-[var(--muted-foreground)]">
                                {isSeries && (
                                  <>
                                    <span className="shrink-0 rounded bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[9px] font-black text-[var(--foreground)]/75">
                                      MAPA {match.mapPosition}/{match.seriesMapCount}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                  </>
                                )}
                                {match.mapName && (
                                  <span className="shrink-0 font-medium text-[var(--foreground)]/65">
                                    {getMapLabel(match.mapName)}
                                  </span>
                                )}
                                {match.mapName && <span aria-hidden="true">·</span>}
                                <span className="truncate">{match.tournamentName}</span>
                                {match.playedAt && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="shrink-0">{formatDate(match.playedAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right font-mono tabular-nums">
                              <span className={cn("text-lg font-black", didWin && isFinished ? "text-emerald-400" : "text-[var(--foreground)]")}>
                                {match.team1Score}
                              </span>
                              <span className="mx-1 text-[var(--muted-foreground)]/40">:</span>
                              <span className={cn("text-lg font-black", !didWin && isFinished ? "text-red-400" : "text-[var(--foreground)]")}>
                                {match.team2Score}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    {matchesTotalPages > 1 && (
                      <div className="flex items-center justify-between bg-[var(--secondary)]/24 px-5 py-3.5">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Página {matchesPage} de {matchesTotalPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={matchesPage <= 1}
                            onClick={() => setMatchesPage((page) => Math.max(1, page - 1))}
                            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)] disabled:opacity-40"
                          >
                            Anterior
                          </button>
                          <button
                            type="button"
                            disabled={matchesPage >= matchesTotalPages}
                            onClick={() => setMatchesPage((page) => Math.min(matchesTotalPages, page + 1))}
                            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)] disabled:opacity-40"
                          >
                            Próxima
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
                      <Trophy className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-40" />
                      <h3 className="mb-2 font-semibold">Nenhuma partida recente</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Assim que você jogar suas partidas ranqueadas, elas aparecem aqui.
                      </p>
                    </div>
                  )}
                </section>

                {/* ── Times ── */}
                <section className="min-w-0 space-y-6 scroll-mt-28" id="times">
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        Times
                      </h2>
                      {isOwner ? (
                        <Button asChild variant="gradient" size="sm" className="h-8 gap-1.5 px-3 text-xs">
                          <Link href="/teams/create">
                            <Plus className="h-3.5 w-3.5" />
                            Criar time
                          </Link>
                        </Button>
                      ) : (
                        teams.length > 0 && (
                          <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                            {teams.length}
                          </span>
                        )
                      )}
                    </div>

                    {teams.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        {teams.map((team) => {
                          const mode = getTeamMode(team.teamMode);
                          const members = team.members ?? [];
                          const isTeamCaptain = team.captainId === profile.id;

                          return (
                            <div
                              key={team.id}
                              className="group flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/35"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-cyan-950 to-slate-900 text-[11px] font-black text-[var(--primary)]">
                                  {team.tag}
                                </span>

                                <div className="min-w-0 flex-1">
                                  {/* O nome do time também abre o time */}
                                  <Link
                                    href={`/teams/${team.slug}`}
                                    className="flex items-center gap-1.5 truncate text-sm font-black transition-colors hover:text-[var(--primary)]"
                                  >
                                    <span className="truncate">{team.name}</span>
                                    {isTeamCaptain && (
                                      <Crown className="h-3 w-3 shrink-0 text-[#f5c842]" aria-label="Capitão" />
                                    )}
                                  </Link>

                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span className="rounded border border-[var(--primary)]/25 bg-[var(--primary)]/10 px-1.5 py-0.5 font-mono text-[9px] font-black leading-none text-[var(--primary)]">
                                      {mode.label}
                                    </span>
                                    <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                                      {team.wins}V·{team.losses}D
                                    </span>
                                    <span className="font-mono text-[10px] font-bold text-[var(--primary)]">
                                      {team.elo} ELO
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Só as fotos, lado a lado — economiza altura */}
                              <div className="mt-3.5 flex items-center justify-between gap-3">
                                <div className="flex items-center -space-x-2">
                                  {members.slice(0, 6).map((member) => {
                                    const nick =
                                      member.profile?.steamPersonaName ?? member.profile?.fullName ?? "-";
                                    return (
                                      <Avatar
                                        key={member.id}
                                        className="h-7 w-7 border-2 border-[var(--card)]"
                                        title={nick}
                                      >
                                        <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={nick} sizes="64px" />
                                        <AvatarFallback className="text-[9px] font-bold">
                                          {nick.slice(0, 1).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    );
                                  })}
                                  {members.length === 0 && (
                                    <span className="text-[10px] text-[var(--muted-foreground)]">Sem elenco</span>
                                  )}
                                  <span className="pl-3.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                                    {members.length}/{mode.maxMembers}
                                  </span>
                                </div>

                                <Button asChild variant="outline" size="sm" className="h-8 shrink-0 px-3 text-xs">
                                  <Link href={`/teams/${team.slug}`}>Abrir</Link>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center">
                        <Users className="mx-auto mb-3 h-9 w-9 text-[var(--muted-foreground)] opacity-40" />
                        <h3 className="mb-1 text-sm font-bold">Nenhum time vinculado</h3>
                        <p className="text-xs text-[var(--muted-foreground)]">{emptyTeamsMessage}</p>
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
                </section>
              </div>
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
