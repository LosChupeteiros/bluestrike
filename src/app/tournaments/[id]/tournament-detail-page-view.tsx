import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Shield,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { Team } from "@/types";
import { Badge } from "@/components/ui/badge";
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
import {
  getEffectiveTournamentStatus,
  getTournamentBadgeProps,
  isTournamentRegistrationOpen,
} from "@/lib/tournament-status";
import { getTournamentMatches } from "@/lib/matches";
import { getBracketRoundModel } from "@/lib/bracket-model";
import { formatCurrency, formatDate } from "@/lib/utils";
import TournamentRegistrationCard from "./tournament-registration-card";
import TournamentPodium from "./tournament-podium";
import BlueStrikeBracketView from "./bluestrike-bracket-view";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminação simples",
  double_elimination: "Eliminação dupla",
  round_robin: "Round robin",
  swiss: "Swiss",
};

interface TournamentDetailPageViewProps {
  params: Promise<{ id: string }>;
}

export default async function TournamentDetailPageView({ params }: TournamentDetailPageViewProps) {
  const { id } = await params;
  const [tournament, currentProfile] = await Promise.all([
    getTournamentById(id),
    getCurrentProfile(),
  ]);

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
    currentProfile
      ? getCurrentTournamentRegistrationIntent(tournament.id, currentProfile.id)
      : Promise.resolve(null),
  ]);

  const registered = tournament.registeredTeamsCount ?? 0;
  const occupiedSpots = registered + activeReservationCount;
  const spotsLeft = Math.max(0, tournament.maxTeams - occupiedSpots);
  const fillPercent = tournament.maxTeams > 0
    ? Math.min(100, (occupiedSpots / tournament.maxTeams) * 100)
    : 0;
  const isFull = spotsLeft === 0;
  const isFinished = effectiveStatus === "finished";
  const teams = tournament.registrations
    ?.map((registration) => registration.team)
    .filter((team): team is Team => Boolean(team)) ?? [];

  let podiumFirst: Team | null = null;
  let podiumSecond: Team | null = null;
  let podiumThird: Team | null = null;

  if (isFinished && matches.length > 0) {
    const model = getBracketRoundModel(teams.length);
    const finalMatch = matches.find(
      (match) => match.round === model.finalRound && match.status === "finished"
    );
    const thirdPlaceMatch = model.thirdPlaceRound !== null
      ? matches.find(
          (match) => match.round === model.thirdPlaceRound && match.status === "finished"
        )
      : null;

    if (finalMatch?.winnerId) {
      podiumFirst = teams.find((team) => team.id === finalMatch.winnerId) ?? null;
      const runnerUpId = finalMatch.team1Id === finalMatch.winnerId
        ? finalMatch.team2Id
        : finalMatch.team1Id;
      podiumSecond = teams.find((team) => team.id === runnerUpId) ?? null;
    }

    if (thirdPlaceMatch?.winnerId) {
      podiumThird = teams.find((team) => team.id === thirdPlaceMatch.winnerId) ?? null;
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
    { label: "Início", value: tournament.startsAt },
    { label: "Encerramento", value: tournament.endsAt },
  ].filter((date): date is { label: string; value: string } => Boolean(date.value));

  const finalPodiumEntries = [
    { place: 1 as const, team: podiumFirst, prize: tournament.prizeBreakdown[0]?.amount ?? 0 },
    { place: 2 as const, team: podiumSecond, prize: tournament.prizeBreakdown[1]?.amount ?? 0 },
    { place: 3 as const, team: podiumThird, prize: tournament.prizeBreakdown[2]?.amount ?? 0 },
  ];

  const entryFeePerPlayer = tournament.entryFee
    ? formatCurrency(Math.ceil(tournament.entryFee / 5))
    : "Gratuita";

  return (
    <div className="bs-page min-h-screen pb-20">
      <section className="relative min-h-[390px] overflow-hidden border-b border-[var(--border)] bg-[#f8fbff]">
        {tournament.bannerUrl && (
          <Image src={tournament.bannerUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-[0.045]" unoptimized />
        )}
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[var(--accent)] md:block" />
        <div className="bs-brand-arc -right-[3%] top-1/2 hidden -translate-y-1/2 opacity-90 md:block" />

        <div className="bs-page-shell relative z-10 py-8 md:py-10">
          <nav className="mb-9 flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted-foreground)]" aria-label="Navegação estrutural">
            <Link href="/" className="hover:text-[var(--primary)]">Início</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/tournaments" className="hover:text-[var(--primary)]">Campeonatos</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--foreground)]">{tournament.name}</span>
          </nav>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[760px]">
              <Badge variant={badge.variant} className="mb-4">{badge.label}</Badge>
              <h1 className="text-4xl font-bold tracking-[-0.045em] sm:text-6xl">{tournament.name}</h1>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                Organizado por {tournament.organizerName} <span aria-hidden="true">|</span> {tournament.region}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <HeroPill icon={Users} label={`${occupiedSpots} / ${tournament.maxTeams} vagas`} />
                {tournament.startsAt && <HeroPill icon={Calendar} label={formatDate(tournament.startsAt)} />}
                <HeroPill icon={Swords} label={FORMAT_LABELS[tournament.format] ?? tournament.format} />
                <HeroPill icon={Zap} label="!ws ativo" active />
              </div>
            </div>

            <div className="relative z-10 w-full max-w-[310px] rounded-2xl border border-[var(--border)] bg-white px-7 py-6 shadow-[var(--shadow-float)]">
              <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--muted-foreground)]">Premiação total</div>
              <div className="mt-2 font-mono text-3xl font-bold tracking-[-0.04em]">{formatCurrency(tournament.prizeTotal)}</div>
              <div className="mt-2 text-xs font-semibold text-[var(--primary)]">Pagamento em PIX</div>
            </div>
          </div>
        </div>
      </section>

      <Tabs defaultValue="info" className="bs-page-shell mt-0">
        <div className="overflow-x-auto border-b border-[var(--border)]">
          <TabsList className="h-auto min-w-max justify-start gap-7 rounded-none border-0 bg-transparent p-0">
            <Tab value="info">Visão geral</Tab>
            <Tab value="teams">Times {registered}</Tab>
            <Tab value="rules">Regras</Tab>
            <Tab value="bracket">Chaveamento</Tab>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          <main className="min-w-0">
            <TabsContent value="info" className="mt-0 space-y-5">
              {isFinished && <TournamentPodium title="Pódio final" entries={finalPodiumEntries} />}

              <section className="bs-panel flex gap-5 p-6 sm:p-7">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--primary)]">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">Sobre o campeonato</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                    {tournament.description || "Os detalhes oficiais desta competição serão publicados pela organização."}
                  </p>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <section className="bs-panel p-6">
                  <div className="bs-kicker">Distribuição do prêmio</div>
                  <div className="mt-5 divide-y divide-[var(--border)]">
                    {tournament.prizeBreakdown.length > 0 ? tournament.prizeBreakdown.slice(0, 3).map((prize, index) => (
                      <div key={`${prize.place}-${index}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] font-mono text-xs font-bold">{index + 1}º</span>
                          <span className="text-sm font-semibold">{prize.place}</span>
                        </div>
                        <span className="font-mono text-sm font-bold">{formatCurrency(prize.amount)}</span>
                      </div>
                    )) : <p className="text-sm text-[var(--muted-foreground)]">Distribuição ainda não publicada.</p>}
                  </div>
                </section>

                <section className="bs-panel p-6">
                  <div className="bs-kicker">Agenda</div>
                  <div className="mt-5 divide-y divide-[var(--border)]">
                    {keyDates.length > 0 ? keyDates.map((date) => (
                      <div key={date.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                          <Calendar className="h-4 w-4 text-[var(--primary)]" />{date.label}
                        </div>
                        <span className="font-mono text-xs font-bold">{formatDate(date.value)}</span>
                      </div>
                    )) : <p className="text-sm text-[var(--muted-foreground)]">Agenda ainda não publicada.</p>}
                  </div>
                </section>
              </div>

              <section className="bs-panel p-6">
                <div className="flex items-end justify-between gap-4">
                  <div><div className="bs-kicker">Times confirmados</div><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Quem já está dentro</h2></div>
                  <span className="text-xs text-[var(--muted-foreground)]">{teams.length} confirmados</span>
                </div>
                {teams.length > 0 ? (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {teams.slice(0, 4).map((team) => (
                      <Link key={team.id} href={`/teams/${team.slug}`} className="group flex items-center gap-3 rounded-xl bg-[var(--secondary)]/70 p-3 hover:bg-[var(--accent)]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-xs font-bold text-[var(--primary)]">{team.tag}</div>
                        <div className="min-w-0"><div className="truncate text-sm font-semibold group-hover:text-[var(--primary)]">{team.name}</div><div className="text-[10px] text-[var(--muted-foreground)]">{team.elo} ELO</div></div>
                      </Link>
                    ))}
                  </div>
                ) : <p className="mt-5 text-sm text-[var(--muted-foreground)]">Nenhum time confirmado até o momento.</p>}
              </section>

              <section className="border-y border-[var(--border)] py-6">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                  <DetailItem icon={Swords} label="Formato" value={FORMAT_LABELS[tournament.format] ?? tournament.format} />
                  <DetailItem icon={MapPin} label="Região" value={tournament.region} />
                  <DetailItem icon={Users} label="Vagas totais" value={`${tournament.maxTeams} times`} />
                  <DetailItem icon={Zap} label="Entrada" value={`${entryFeePerPlayer} por jogador`} />
                  <DetailItem icon={CheckCircle2} label="Check-in" value={tournament.checkInRequired ? `${tournament.checkInWindowMins} min antes` : "Não obrigatório"} />
                  <DetailItem icon={Shield} label="Organizador" value={tournament.organizerName} />
                </dl>
              </section>

              {(tournament.minElo !== null || tournament.maxElo !== null) && (
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
                  <Shield className="h-5 w-5 text-[var(--primary)]" />
                  {tournament.minElo !== null && <span>ELO mínimo <strong className="text-[var(--primary)]">{tournament.minElo}</strong></span>}
                  {tournament.maxElo !== null && <span>ELO máximo <strong className="text-[var(--primary)]">{tournament.maxElo}</strong></span>}
                </div>
              )}
            </TabsContent>

            <TabsContent value="teams" className="mt-0 space-y-5">
              <TournamentPodium title="Pódio" entries={finalPodiumEntries} showPendingCopy={!isFinished} />
              <section className="bs-panel p-6" id="times-inscritos">
                <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">Times inscritos</h2><Badge variant="secondary">{teams.length}</Badge></div>
                {teams.length > 0 ? (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {teams.map((team) => (
                      <Link key={team.id} href={`/teams/${team.slug}`} className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 hover:border-blue-200 hover:bg-blue-50/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-bold text-[var(--primary)]">{team.tag}</div>
                        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold group-hover:text-[var(--primary)]">{team.name}</div><div className="text-xs text-[var(--muted-foreground)]">{team.elo} ELO</div></div>
                        <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                      </Link>
                    ))}
                  </div>
                ) : <div className="py-14 text-center text-sm text-[var(--muted-foreground)]">Nenhum time inscrito ainda.</div>}
              </section>
            </TabsContent>

            <TabsContent value="rules" className="mt-0">
              <section className="bs-panel p-6 sm:p-7">
                <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-[var(--primary)]" /><h2 className="text-xl font-semibold">Regras do campeonato</h2></div>
                <ol className="mt-6 space-y-4">
                  {tournament.rules.map((rule, index) => (
                    <li key={`${rule}-${index}`} className="flex items-start gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-mono text-xs font-bold text-[var(--primary)]">{index + 1}</span><span className="pt-1 text-sm leading-6 text-[var(--muted-foreground)]">{rule}</span></li>
                  ))}
                </ol>
                <Separator className="my-6" />
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />O descumprimento das regras pode resultar em desclassificação e bloqueio do time.</div>
              </section>
            </TabsContent>

            <TabsContent value="bracket" className="mt-0">
              {effectiveStatus === "open" || effectiveStatus === "upcoming" ? (
                <EmptyState title="Chaveamento ainda não gerado" description="O bracket é gerado automaticamente quando as inscrições encerram e a competição começa." />
              ) : matches.length === 0 ? (
                <EmptyState title="Aguardando sorteio" description="O chaveamento será gerado em instantes." />
              ) : (
                <BlueStrikeBracketView matches={matches} tournamentId={tournament.id} teamCount={teams.length} isAdmin={currentProfile?.isAdmin ?? false} />
              )}
            </TabsContent>
          </main>

          <aside>
            <div className="sticky top-24 bs-panel p-6 sm:p-7">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-emerald-700"><Users className="h-4 w-4" />{isFull ? "Inscrições lotadas" : registrationOpen ? "Vagas disponíveis" : "Inscrições encerradas"}</div>
              <div className="mt-7 font-mono text-4xl font-bold tracking-[-0.04em]">{occupiedSpots} <span className="text-xl text-[var(--muted-foreground)]">de {tournament.maxTeams}</span></div>
              <Progress value={fillPercent} className="mt-4 h-2" />
              {activeReservationCount > 0 && <p className="mt-2 text-xs text-[var(--muted-foreground)]">{activeReservationCount} {activeReservationCount === 1 ? "vaga reservada" : "vagas reservadas"} em pagamento</p>}

              <div className="mt-6">
                <TournamentRegistrationCard
                  tournamentId={tournament.id}
                  tournamentName={tournament.name}
                  entryFee={tournament.entryFee ?? 0}
                  canRegister={registrationDisabledReason === null}
                  disabledReason={registrationDisabledReason}
                  captainTeams={captainTeams}
                  registeredTeamIds={(tournament.registrations ?? []).map((registration) => registration.teamId)}
                  initialIntent={currentRegistrationIntent}
                />
              </div>

              {tournament.checkInRequired && <div className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--secondary)] p-3 text-xs leading-5 text-[var(--muted-foreground)]"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />Check-in obrigatório {tournament.checkInWindowMins} minutos antes da partida.</div>}

              <Separator className="my-6" />
              <dl className="space-y-4">
                <SidebarItem label="Entrada" value={`${entryFeePerPlayer} / jogador`} />
                <SidebarItem label="Formato" value="5v5" />
                <SidebarItem label="Região" value={tournament.region} />
                <SidebarItem label="Anti-cheat" value="BlueStrike" />
              </dl>
            </div>
          </aside>
        </div>
      </Tabs>
    </div>
  );
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  return <TabsTrigger value={value} className="rounded-none border-b-2 border-transparent px-1 py-5 data-[state=active]:border-[var(--primary)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-none">{children}</TabsTrigger>;
}

function HeroPill({ icon: Icon, label, active = false }: { icon: typeof Users; label: string; active?: boolean }) {
  return <div className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium ${active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-[var(--border)] bg-white"}`}><Icon className="h-3.5 w-3.5 text-[var(--primary)]" />{label}</div>;
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" /><div><dt className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div></div>;
}

function SidebarItem({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><dt className="text-[var(--muted-foreground)]">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="bs-panel px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)]"><Swords className="h-6 w-6 text-[var(--primary)]" /></div><h2 className="mt-5 font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">{description}</p></div>;
}
