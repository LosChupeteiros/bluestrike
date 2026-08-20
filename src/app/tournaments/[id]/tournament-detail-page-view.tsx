import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Info,
  MapPin,
  Shield,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { Team } from "@/types";
import { Badge } from "@/components/ui/badge";
import { PlaceBadge } from "@/components/ui/place-badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentProfile } from "@/lib/profiles";
import { getCaptainTeamsWithMembers } from "@/lib/teams";
import { getTournamentById } from "@/lib/tournaments";
import {
  getCurrentTournamentRegistrationIntent,
  getTournamentActiveReservationCount,
} from "@/lib/tournament-registration-intents";
import { getEffectiveTournamentStatus, isTournamentRegistrationOpen, getTournamentBadgeProps } from "@/lib/tournament-status";
import { getTournamentMatches } from "@/lib/matches";
import { getBracketRoundModel } from "@/lib/bracket-model";
import { formatCurrency, formatDate } from "@/lib/utils";
import TournamentRegistrationCard from "./tournament-registration-card";
import TournamentPodium from "./tournament-podium";
import BlueStrikeBracketView from "./bluestrike-bracket-view";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminação Simples",
  double_elimination: "Eliminação Dupla",
  round_robin: "Round Robin",
  swiss: "Swiss",
};



interface TournamentDetailPageViewProps {
  params: Promise<{ id: string }>;
}

export default async function TournamentDetailPageView({ params }: TournamentDetailPageViewProps) {
  const { id } = await params;
  const [tournament, currentProfile] = await Promise.all([getTournamentById(id), getCurrentProfile()]);

  if (!tournament) notFound();

  const effectiveStatus = getEffectiveTournamentStatus(tournament);
  const registrationOpen = isTournamentRegistrationOpen(tournament);
  const badge = getTournamentBadgeProps(tournament);
  // eslint-disable-next-line react-hooks/purity -- Server-rendered timestamp for tournament status copy.
  const nowMs = Date.now();

  const [captainTeams, matches, activeReservationCount, currentRegistrationIntent] = await Promise.all([
    currentProfile ? getCaptainTeamsWithMembers(currentProfile.id) : Promise.resolve([]),
    effectiveStatus === "ongoing" || effectiveStatus === "finished"
      ? getTournamentMatches(tournament.id)
      : Promise.resolve([]),
    getTournamentActiveReservationCount(tournament.id),
    currentProfile ? getCurrentTournamentRegistrationIntent(tournament.id, currentProfile.id) : Promise.resolve(null),
  ]);

  const registered = tournament.registeredTeamsCount ?? 0;
  const occupiedSpots = registered + activeReservationCount;
  const spotsLeft = Math.max(0, tournament.maxTeams - occupiedSpots);
  const fillPercent = tournament.maxTeams > 0 ? (occupiedSpots / tournament.maxTeams) * 100 : 0;
  const isFull = spotsLeft === 0;
  const isFinishedTournament = effectiveStatus === "finished";
  const teams =
    tournament.registrations?.map((r) => r.team).filter((t): t is Team => Boolean(t)) ?? [];

  // Derive podium from match results (no DB registration status required)
  let podiumFirst: Team | null = null;
  let podiumSecond: Team | null = null;
  let podiumThird: Team | null = null;
  if (isFinishedTournament && matches.length > 0) {
    const model = getBracketRoundModel(teams.length);
    const finalMatch = matches.find((m) => m.round === model.finalRound && m.status === "finished");
    const thirdPlaceMatch = model.thirdPlaceRound !== null
      ? matches.find((m) => m.round === model.thirdPlaceRound && m.status === "finished")
      : null;
    if (finalMatch?.winnerId) {
      podiumFirst = teams.find((t) => t.id === finalMatch.winnerId) ?? null;
      const runnerUpId = finalMatch.team1Id === finalMatch.winnerId ? finalMatch.team2Id : finalMatch.team1Id;
      podiumSecond = teams.find((t) => t.id === runnerUpId) ?? null;
    }
    if (thirdPlaceMatch?.winnerId) {
      podiumThird = teams.find((t) => t.id === thirdPlaceMatch.winnerId) ?? null;
    }
  }

  let registrationDisabledReason: string | null = null;

  if (!registrationOpen) {
    if (effectiveStatus === "finished") {
      registrationDisabledReason = "Esse campeonato já foi encerrado.";
    } else if (effectiveStatus === "ongoing") {
      registrationDisabledReason = "As inscrições para esse campeonato foram encerradas.";
    } else if (effectiveStatus === "upcoming") {
      registrationDisabledReason = "As inscrições ainda não foram abertas.";
    } else if (tournament.registrationEnds && nowMs > Date.parse(tournament.registrationEnds)) {
      registrationDisabledReason = "O prazo de inscrições encerrou.";
    } else {
      registrationDisabledReason = "As inscrições não estão abertas no momento.";
    }
  } else if (!currentProfile) {
    registrationDisabledReason = "Entre com sua Steam para inscrever um time.";
  } else if (captainTeams.length === 0) {
    registrationDisabledReason = "Crie um time antes de tentar se inscrever.";
  } else if (isFull) {
    registrationDisabledReason = "Esse campeonato já lotou.";
  }

  const keyDates = [
    { label: "Inscrições abertas", value: tournament.registrationStarts },
    { label: "Inscrições encerram", value: tournament.registrationEnds },
    { label: "Início do campeonato", value: tournament.startsAt },
    { label: "Encerramento", value: tournament.endsAt },
  ].filter((d) => d.value);
  const podiumEntries = [
    { label: "1º lugar", team: podiumFirst, prize: tournament.prizeBreakdown[0]?.amount ?? 0, className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" },
    { label: "2º lugar", team: podiumSecond, prize: tournament.prizeBreakdown[1]?.amount ?? 0, className: "border-slate-400/30 bg-slate-400/10 text-slate-300" },
    { label: "3º lugar", team: podiumThird, prize: tournament.prizeBreakdown[2]?.amount ?? 0, className: "border-orange-600/30 bg-orange-600/10 text-orange-300" },
  ];

  const finalPodiumEntries = [
    { place: 1 as const, team: podiumFirst, prize: tournament.prizeBreakdown[0]?.amount ?? 0 },
    { place: 2 as const, team: podiumSecond, prize: tournament.prizeBreakdown[1]?.amount ?? 0 },
    { place: 3 as const, team: podiumThird, prize: tournament.prizeBreakdown[2]?.amount ?? 0 },
  ];

  return (
    <div className="min-h-screen pb-20 pt-20">
      {/* ── Hero ── */}
      <div className={`relative overflow-hidden ${tournament.bannerUrl ? "h-64 sm:h-72 lg:h-[26rem]" : "h-auto"}`}>
        {tournament.bannerUrl ? (
          <Image
            src={tournament.bannerUrl}
            alt={tournament.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized
          />
        ) : (
          <div className="reticle-grid absolute inset-0 bg-void" />
        )}
        <div className="absolute inset-0 bg-void/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent" />

        <div className={`${tournament.bannerUrl ? "absolute inset-x-0 bottom-0" : "relative"} mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8`}>
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-white/50">
            <Link href="/" className="transition-colors hover:text-white/80">Inicio</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/tournaments" className="transition-colors hover:text-white/80">Campeonatos</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80">{tournament.name}</span>
          </nav>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant={badge.variant} className="mb-3">{badge.label}</Badge>
              <h1 className="font-display text-[clamp(1.875rem,4vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
                {tournament.name}
              </h1>
              <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">Por {tournament.organizerName}</p>
            </div>

            <div className="shrink-0 border-l border-line-2 pl-6">
              <span className="tick block">Premiação total</span>
              <span className="tabular mt-1.5 block text-[2rem] font-bold leading-none text-prize">
                {formatCurrency(tournament.prizeTotal)}
              </span>
            </div>
          </div>

          {/* Stats strip — fita de dados, sem pílulas */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
            <span>
              {occupiedSpots}/{tournament.maxTeams} vagas
            </span>
            <span className="h-3 w-px bg-line-2" aria-hidden="true" />
            {tournament.startsAt && (
              <>
                <span>Início {formatDate(tournament.startsAt)}</span>
                <span className="h-3 w-px bg-line-2" aria-hidden="true" />
              </>
            )}
            <span>{FORMAT_LABELS[tournament.format]}</span>
            <span className="h-3 w-px bg-line-2" aria-hidden="true" />
            <span>{tournament.region}</span>
            <span className="h-3 w-px bg-line-2" aria-hidden="true" />
            <span className="text-strike">
              {tournament.entryFee
                ? `${formatCurrency(Math.ceil(tournament.entryFee / 5))}/player`
                : "Gratuito"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── Left: Tabs ── */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="info">
              <TabsList className="mb-6 w-full justify-start border border-[var(--border)] bg-[var(--card)]">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="teams">Times ({registered})</TabsTrigger>
                <TabsTrigger value="rules">Regras</TabsTrigger>
                <TabsTrigger value="bracket">Chaveamento</TabsTrigger>
              </TabsList>

              {/* ── Info tab ── */}
              <TabsContent value="info">
                <div className="space-y-5">
                  {isFinishedTournament && (
                    <TournamentPodium title="Podio final" entries={finalPodiumEntries} />
                  )}

                  {/* Description */}
                  {tournament.description && (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                      <h3 className="mb-3 flex items-center gap-2 font-bold">
                        <Info className="h-4 w-4 text-[var(--primary)]" />
                        Sobre o campeonato
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                        {tournament.description}
                      </p>
                    </div>
                  )}

                  {/* Prize breakdown */}
                  {tournament.prizeBreakdown.length > 0 && (
                    <div className="rounded-xl border border-white/[0.07] bg-abyss p-6">
                      <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">
                        Distribuição de prêmios
                      </h3>

                      <ul className="mt-5 space-y-5">
                        {tournament.prizeBreakdown.map((prize, index) => {
                          const share =
                            tournament.prizeTotal > 0
                              ? Math.max(4, (prize.amount / tournament.prizeTotal) * 100)
                              : 0;
                          const tone =
                            index === 0
                              ? "var(--color-prize)"
                              : index === 1
                                ? "oklch(0.8 0.006 250)"
                                : "oklch(0.63 0.085 58)";

                          return (
                            <li key={`${prize.place}-${index}`}>
                              <div className="flex items-baseline justify-between gap-4">
                                <span
                                  className="font-display text-[15px] font-extrabold tracking-[-0.02em]"
                                  style={{ color: tone }}
                                >
                                  {prize.place}
                                </span>
                                <span
                                  className="tabular text-[1.375rem] font-bold leading-none"
                                  style={{ color: index === 0 ? "var(--color-prize)" : "var(--color-ink)" }}
                                >
                                  {formatCurrency(prize.amount)}
                                </span>
                              </div>

                              {/* Fatia do prêmio total */}
                              <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${share}%`, background: tone, opacity: index === 0 ? 1 : 0.55 }}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Key dates timeline */}
                  {keyDates.length > 0 && (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                      <h3 className="mb-5 flex items-center gap-2 font-bold">
                        <Calendar className="h-4 w-4 text-[var(--primary)]" />
                        Datas importantes
                      </h3>
                      <div className="relative">
                        <div className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-[var(--border)]" />
                        <div className="space-y-5 pl-9">
                          {keyDates.map((d) => {
                            const isPast = d.value ? nowMs > Date.parse(d.value) : false;
                            return (
                              <div key={d.label} className="relative flex items-center justify-between gap-4">
                                <div
                                  className={`absolute -left-9 flex h-5 w-5 items-center justify-center rounded-full border ${
                                    isPast
                                      ? "border-[var(--primary)]/50 bg-[var(--primary)]/15"
                                      : "border-[var(--border)] bg-[var(--background)]"
                                  }`}
                                >
                                  {isPast ? (
                                    <CheckCircle2 className="h-3 w-3 text-[var(--primary)]" />
                                  ) : (
                                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)]/50" />
                                  )}
                                </div>
                                <span
                                  className={`text-sm ${
                                    isPast
                                      ? "text-[var(--muted-foreground)]"
                                      : "font-semibold text-[var(--foreground)]"
                                  }`}
                                >
                                  {d.label}
                                </span>
                                <span className="text-sm font-bold tabular-nums text-[var(--foreground)]">
                                  {formatDate(d.value!)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: "Formato", value: FORMAT_LABELS[tournament.format], icon: Swords },
                      { label: "Região", value: tournament.region, icon: MapPin },
                      {
                        label: "Inscrição",
                        value: tournament.entryFee
                          ? `${formatCurrency(Math.ceil(tournament.entryFee / 5))} / player`
                          : "Gratuito",
                        icon: Zap,
                      },
                      { label: "Vagas totais", value: `${tournament.maxTeams} times`, icon: Users },
                      {
                        label: "Check-in",
                        value: tournament.checkInRequired
                          ? `${tournament.checkInWindowMins} min antes`
                          : "Não obrigatório",
                        icon: CheckCircle2,
                      },
                      { label: "Organizador", value: tournament.organizerName, icon: Shield },
                    ].map((item) => (
                      <div key={item.label} className="border-t border-line/60 pt-3.5">
                        <span className="tick block">{item.label}</span>
                        <span className="mt-1.5 block text-[13px] font-semibold text-ink">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* ELO requirements */}
                  {(tournament.minElo !== null || tournament.maxElo !== null) && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line/60 pt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                      {tournament.minElo !== null && (
                        <span>
                          ELO mínimo <span className="text-strike">{tournament.minElo}</span>
                        </span>
                      )}
                      {tournament.maxElo !== null && (
                        <span>
                          ELO máximo <span className="text-strike">{tournament.maxElo}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {tournament.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/60 pt-4">
                      {tournament.tags.map((tag) => (
                        <span key={tag} className="tick">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Teams tab ── */}
              <TabsContent value="teams">
                <div className="space-y-6">
                  {/* Podium */}
                  <TournamentPodium
                    title="Podio"
                    entries={finalPodiumEntries}
                    showPendingCopy={!isFinishedTournament}
                  />


                  {/* Registered teams — compact grid, no ranking */}
                  {teams.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                        <Users className="h-4 w-4 text-[var(--primary)]" />
                        Times inscritos
                        <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                          {teams.length}
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {teams.map((team) => (
                          <Link
                            key={team.id}
                            href={`/teams/${team.slug}`}
                            className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition-all hover:border-[var(--primary)]/40"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-xs font-black text-[var(--primary)]">
                              {team.tag}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold transition-colors group-hover:text-[var(--primary)]">
                                {team.name}
                              </div>
                              <div className="text-[10px] text-[var(--muted-foreground)]">{team.elo} ELO</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {teams.length === 0 && (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
                      <Users className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)] opacity-30" />
                      <p className="text-sm text-[var(--muted-foreground)]">Nenhum time inscrito ainda.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Rules tab ── */}
              <TabsContent value="rules">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <h3 className="mb-5 flex items-center gap-2 font-bold">
                    <Shield className="h-4 w-4 text-[var(--primary)]" />
                    Regras do campeonato
                  </h3>
                  <ol className="space-y-4">
                    {tournament.rules.map((rule, index) => (
                      <li key={`${rule}-${index}`} className="flex items-start gap-4">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-xs font-black text-[var(--primary)]">
                          {index + 1}
                        </span>
                        <span className="pt-0.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                          {rule}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <Separator className="my-5" />

                  <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                    <p className="text-xs leading-relaxed text-yellow-200/80">
                      O não cumprimento das regras pode resultar em desclassificação e bloqueio do time.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* ── Bracket tab ── */}
              <TabsContent value="bracket">
                {effectiveStatus === "open" || effectiveStatus === "upcoming" ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--secondary)]">
                      <Swords className="h-8 w-8 text-[var(--muted-foreground)] opacity-40" />
                    </div>
                    <h3 className="mb-2 font-bold">Chaveamento ainda não gerado</h3>
                    <p className="max-w-sm mx-auto text-sm text-[var(--muted-foreground)]">
                      O bracket é gerado automaticamente quando as inscrições encerram e o campeonato começa.
                    </p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5">
                      <Swords className="h-8 w-8 text-[var(--primary)] opacity-60" />
                    </div>
                    <h3 className="mb-2 font-bold">Aguardando sorteio</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      O chaveamento será gerado em instantes.
                    </p>
                  </div>
                ) : (
                  <BlueStrikeBracketView matches={matches} tournamentId={tournament.id} teamCount={teams.length} isAdmin={currentProfile?.isAdmin ?? false} />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Right: Sidebar ── */}
          <div className="space-y-5">
            <div className="sticky top-24 space-y-5">
              {/* Registration card */}
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
                {/* Card header */}
                <div className="border-b border-[var(--border)] bg-[var(--secondary)]/40 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Inscrições</span>
                    <Badge
                      variant={
                        isFull ? "destructive" : registrationOpen ? "open" : "secondary"
                      }
                      className="text-xs"
                    >
                      {isFull ? "Lotado" : registrationOpen ? "Abertas" : "Encerradas"}
                    </Badge>
                  </div>

                  {/* Vagas progress */}
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-[var(--muted-foreground)]">
                        {registered} de {tournament.maxTeams} times
                        {activeReservationCount > 0 ? ` + ${activeReservationCount} reserva${activeReservationCount === 1 ? "" : "s"}` : ""}
                      </span>
                      <span className={`font-bold ${isFull ? "text-red-400" : "text-[var(--primary)]"}`}>
                        {isFull ? `${registered}/${tournament.maxTeams}` : `${spotsLeft} vagas restantes`}
                      </span>
                    </div>
                    <Progress
                      value={fillPercent}
                      className={`h-1.5 ${isFull ? "[&>div]:bg-red-500" : ""}`}
                    />
                  </div>
                </div>

                <div className="p-5">
                  <TournamentRegistrationCard
                    tournamentId={tournament.id}
                    tournamentName={tournament.name}
                    entryFee={tournament.entryFee ?? 0}
                    canRegister={registrationDisabledReason === null}
                    disabledReason={registrationDisabledReason}
                    captainTeams={captainTeams}
                    registeredTeamIds={(tournament.registrations ?? []).map((r) => r.teamId)}
                    initialIntent={currentRegistrationIntent}
                  />

                  {tournament.checkInRequired && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--secondary)] p-2.5 text-xs text-[var(--muted-foreground)]">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
                      Check-in obrigatório {tournament.checkInWindowMins}min antes da partida
                    </div>
                  )}
                </div>
              </div>

              {/* Prize summary */}
              {tournament.prizeBreakdown.length > 0 && (
                <div className="rounded-xl border border-white/[0.07] bg-abyss p-5">
                  <h4 className="font-display text-sm font-bold tracking-tight text-ink">Premiação</h4>
                  <ul className="mt-4 divide-y divide-line/60 border-t border-line/60">
                    {tournament.prizeBreakdown.slice(0, 3).map((prize, index) => (
                      <li key={prize.place} className="flex items-baseline justify-between gap-3 py-3.5">
                        <span
                          className="font-display text-[13px] font-bold tracking-tight"
                          style={{
                            color:
                              index === 0
                                ? "var(--color-prize)"
                                : index === 1
                                  ? "oklch(0.8 0.006 250)"
                                  : "oklch(0.63 0.085 58)",
                          }}
                        >
                          {prize.place}
                        </span>
                        <span
                          className={`tabular text-[15px] font-bold ${
                            index === 0 ? "text-prize" : "text-ink"
                          }`}
                        >
                          {formatCurrency(prize.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
