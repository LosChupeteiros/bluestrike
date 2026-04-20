import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import type { Team } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentProfile } from "@/lib/profiles";
import { getCurrentTeamForProfile } from "@/lib/teams";
import { getTournamentById } from "@/lib/tournaments";
import { getEffectiveTournamentStatus, isTournamentRegistrationOpen, getTournamentBadgeProps } from "@/lib/tournament-status";
import { getTournamentMatches } from "@/lib/matches";
import { formatCurrency, formatDate } from "@/lib/utils";
import TournamentRegistrationCard from "./tournament-registration-card";
import BlueStrikeBracketView from "./bluestrike-bracket-view";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminação Simples",
  double_elimination: "Eliminação Dupla",
  round_robin: "Round Robin",
  swiss: "Swiss",
};


interface TournamentDetailPageViewProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TournamentDetailPageView({ params }: TournamentDetailPageViewProps) {
  const { id } = await params;
  const [tournament, currentProfile] = await Promise.all([getTournamentById(id), getCurrentProfile()]);

  if (!tournament) {
    notFound();
  }

  const effectiveStatus = getEffectiveTournamentStatus(tournament);
  const registrationOpen = isTournamentRegistrationOpen(tournament);
  const badge = getTournamentBadgeProps(tournament);

  const [currentTeam, matches] = await Promise.all([
    currentProfile ? getCurrentTeamForProfile(currentProfile.id) : Promise.resolve(null),
    (effectiveStatus === "ongoing" || effectiveStatus === "finished")
      ? getTournamentMatches(tournament.id)
      : Promise.resolve([]),
  ]);

  const registered = tournament.registeredTeamsCount ?? 0;
  const spotsLeft = Math.max(0, tournament.maxTeams - registered);
  const fillPercent = tournament.maxTeams > 0 ? (registered / tournament.maxTeams) * 100 : 0;
  const isFull = spotsLeft === 0;
  const teams =
    tournament.registrations?.map((registration) => registration.team).filter((team): team is Team => Boolean(team)) ?? [];
  const currentTeamAlreadyRegistered = Boolean(
    currentTeam && tournament.registrations?.some((registration) => registration.teamId === currentTeam.id)
  );

  let registrationDisabledReason: string | null = null;

  if (!registrationOpen) {
    const now = Date.now();
    if (effectiveStatus === "finished") {
      registrationDisabledReason = "Esse campeonato já foi encerrado.";
    } else if (effectiveStatus === "ongoing") {
      registrationDisabledReason = "As inscrições para esse campeonato foram encerradas.";
    } else if (effectiveStatus === "upcoming") {
      registrationDisabledReason = "As inscrições ainda não foram abertas.";
    } else if (tournament.registrationEnds && now > Date.parse(tournament.registrationEnds)) {
      registrationDisabledReason = "O prazo de inscrições encerrou.";
    } else {
      registrationDisabledReason = "As inscrições não estão abertas no momento.";
    }
  } else if (!currentProfile) {
    registrationDisabledReason = "Entre com sua Steam para inscrever um time.";
  } else if (!currentTeam) {
    registrationDisabledReason = "Crie um time antes de tentar se inscrever.";
  } else if (currentTeam.captainId !== currentProfile.id) {
    registrationDisabledReason = "A inscrição precisa ser feita pelo capitão do time.";
  } else if (currentTeamAlreadyRegistered) {
    registrationDisabledReason = "Seu time já está inscrito nesse campeonato.";
  } else if (isFull) {
    registrationDisabledReason = "Esse campeonato já lotou.";
  } else if ((currentTeam.members?.filter((member) => member.isStarter).length ?? 0) < 5) {
    registrationDisabledReason = "Seu time precisa de 5 titulares para se inscrever.";
  } else if (tournament.minElo !== null && currentTeam.elo < tournament.minElo) {
    registrationDisabledReason = `Seu time precisa de pelo menos ${tournament.minElo} ELO médio.`;
  } else if (tournament.maxElo !== null && currentTeam.elo > tournament.maxElo) {
    registrationDisabledReason = `Seu time excede o teto de ${tournament.maxElo} ELO médio.`;
  }

  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="relative h-72 overflow-hidden border-b border-[var(--border)] sm:h-80 lg:h-[26rem]">
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
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-900 to-black" />
        )}
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-black/20 to-transparent" />

        <div className="absolute bottom-8 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
              Inicio
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/tournaments" className="transition-colors hover:text-[var(--foreground)]">
              Campeonatos
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--foreground)]">{tournament.name}</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant={badge.variant} className="mb-3">
                {badge.label}
              </Badge>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{tournament.name}</h1>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">Por {tournament.organizerName}</p>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-black/35 px-5 py-4 backdrop-blur">
              <div className="text-3xl font-black text-yellow-400">{formatCurrency(tournament.prizeTotal)}</div>
              <div className="text-xs text-[var(--muted-foreground)]">premiação total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs defaultValue="info">
              <TabsList className="mb-6 w-full justify-start border border-[var(--border)] bg-[var(--card)]">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="teams">Times ({registered})</TabsTrigger>
                <TabsTrigger value="rules">Regras</TabsTrigger>
                <TabsTrigger value="bracket">Chaveamento</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <div className="space-y-6">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-bold">
                      <Info className="h-4 w-4 text-[var(--primary)]" />
                      Sobre o campeonato
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{tournament.description}</p>
                  </div>

                  {tournament.prizeBreakdown.length > 0 && (
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                      <h3 className="mb-4 flex items-center gap-2 font-bold">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        Distribuição de prêmios
                      </h3>
                      <div className="space-y-3">
                        {tournament.prizeBreakdown.map((prize, index) => (
                          <div key={`${prize.place}-${index}`} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{prize.place}</span>
                            <span className={`font-black ${index === 0 ? "text-base text-yellow-400" : "text-sm"}`}>
                              {formatCurrency(prize.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: "Inicio", value: formatDate(tournament.startsAt ?? ""), icon: Calendar },
                      { label: "Termino", value: formatDate(tournament.endsAt ?? ""), icon: Calendar },
                      { label: "Inscrições até", value: formatDate(tournament.registrationEnds ?? ""), icon: Clock },
                      { label: "Formato", value: FORMAT_LABELS[tournament.format], icon: Swords },
                      { label: "Regiao", value: tournament.region, icon: MapPin },
                      {
                        label: "Valor da inscrição",
                        value: tournament.entryFee
                          ? `${formatCurrency(Math.ceil(tournament.entryFee / 5))} por player`
                          : "Gratuito",
                        icon: Trophy,
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                          <item.icon className="h-3 w-3" />
                          {item.label}
                        </div>
                        <div className="text-sm font-semibold">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {(tournament.minElo !== null || tournament.maxElo !== null) && (
                    <div className="flex items-start gap-2 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3 text-sm">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                      <span className="text-[var(--muted-foreground)]">
                        {tournament.minElo !== null && (
                          <>
                            ELO mínimo:{" "}
                            <span className="font-bold text-[var(--primary)]">{tournament.minElo}</span>
                          </>
                        )}
                        {tournament.minElo !== null && tournament.maxElo !== null ? " · " : null}
                        {tournament.maxElo !== null && (
                          <>
                            ELO máximo:{" "}
                            <span className="font-bold text-[var(--primary)]">{tournament.maxElo}</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {tournament.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="teams">
                <div className="space-y-3">
                  {teams.map((team, index) => (
                    <Link
                      key={team.id}
                      href={`/teams/${team.slug}`}
                      className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/30 hover:bg-[var(--secondary)]/45"
                    >
                      <div className="w-8 text-center text-sm font-bold text-[var(--muted-foreground)]">#{index + 1}</div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-xs font-black text-[var(--primary)]">
                        {team.tag}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold transition-colors group-hover:text-[var(--primary)]">{team.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {team.members?.length ?? 0} jogadores · {team.wins}V / {team.losses}D
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-[var(--primary)]">{team.elo} ELO</div>
                    </Link>
                  ))}

                  {Array.from({ length: Math.max(0, tournament.maxTeams - registered) }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="flex items-center gap-4 rounded-xl border border-dashed border-[var(--border)] p-4 opacity-45"
                    >
                      <div className="w-8 text-center text-sm text-[var(--muted-foreground)]">#{registered + index + 1}</div>
                      <div className="h-10 w-10 rounded-lg border border-dashed border-[var(--border)]" />
                      <div className="text-sm text-[var(--muted-foreground)]">Vaga disponível</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rules">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-bold">
                    <Shield className="h-4 w-4 text-[var(--primary)]" />
                    Regras do campeonato
                  </h3>
                  <ul className="space-y-3">
                    {tournament.rules.map((rule, index) => (
                      <li key={`${rule}-${index}`} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                        <span className="text-[var(--muted-foreground)]">{rule}</span>
                      </li>
                    ))}
                  </ul>

                  <Separator className="my-5" />

                  <div className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                    <p className="text-xs text-yellow-200/80">
                      O não cumprimento das regras pode resultar em desclassificação e bloqueio do time.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bracket">
                {effectiveStatus === "open" || effectiveStatus === "upcoming" ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                    <Swords className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-40" />
                    <h3 className="mb-2 font-semibold">Chaveamento ainda não gerado</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      O bracket é gerado automaticamente quando as inscrições encerram e o campeonato começa.
                    </p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                    <Swords className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-40" />
                    <h3 className="mb-2 font-semibold">Aguardando sorteio</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      O chaveamento será gerado em instantes.
                    </p>
                  </div>
                ) : (
                  <BlueStrikeBracketView matches={matches} tournamentId={tournament.id} />
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-5">
            <div className="sticky top-24 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--primary)]" />
                <span className="text-sm font-semibold">Vagas</span>
              </div>

              <div className="mb-3">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    {registered}/{tournament.maxTeams} times
                  </span>
                  <span className={isFull ? "font-bold text-red-400" : "font-bold text-[var(--primary)]"}>
                    {isFull ? "LOTADO" : `${spotsLeft} vagas`}
                  </span>
                </div>
                <Progress value={fillPercent} className={isFull ? "[&>div]:bg-red-500" : ""} />
              </div>

              <TournamentRegistrationCard
                tournamentId={tournament.id}
                tournamentName={tournament.name}
                entryFee={tournament.entryFee ?? 0}
                canRegister={registrationDisabledReason === null}
                disabledReason={registrationDisabledReason}
                currentTeamName={currentTeam?.name ?? null}
              />

              {tournament.checkInRequired && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--secondary)] p-2.5 text-xs text-[var(--muted-foreground)]">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
                  Check-in obrigatorio {tournament.checkInWindowMins}min antes da partida
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h4 className="mb-4 text-sm font-semibold">Informações Rápidas</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Formato</span>
                  <span className="font-medium">{FORMAT_LABELS[tournament.format]}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Regiao</span>
                  <span className="font-medium">{tournament.region}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Organizador</span>
                  <span className="font-medium text-[var(--primary)]">{tournament.organizerName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Inscrição</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {tournament.entryFee
                        ? `${formatCurrency(Math.ceil(tournament.entryFee / 5))} / player`
                        : "Gratuito"}
                    </div>
                    {tournament.entryFee ? (
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        total {formatCurrency(tournament.entryFee)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
