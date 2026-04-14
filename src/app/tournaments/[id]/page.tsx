import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Users, Trophy, ChevronRight, Clock, MapPin,
  CheckCircle2, AlertCircle, Shield, Info, Swords
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { mockTournaments, mockTeams } from "@/data/mock";
import { formatDate, formatCurrency, getStatusLabel } from "@/lib/utils";
import type { Metadata } from "next";

interface Params {
  id: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const tournament = mockTournaments.find((t) => t.id === id);
  if (!tournament) return { title: "Campeonato não encontrado" };
  return {
    title: tournament.name,
    description: tournament.description,
  };
}

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminação Simples",
  double_elimination: "Eliminação Dupla",
  round_robin: "Round Robin",
  swiss: "Swiss",
};

const STATUS_VARIANT: Record<string, "open" | "ongoing" | "finished" | "upcoming"> = {
  open: "open",
  ongoing: "ongoing",
  finished: "finished",
  upcoming: "upcoming",
};

export default async function TournamentDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const tournament = mockTournaments.find((t) => t.id === id);
  if (!tournament) notFound();

  const spotsLeft = tournament.maxTeams - tournament.registeredTeams;
  const fillPercent = (tournament.registeredTeams / tournament.maxTeams) * 100;
  const isFull = spotsLeft === 0;
  const teams = mockTeams.slice(0, Math.min(tournament.registeredTeams, mockTeams.length));

  return (
    <div className="pt-20 pb-20 min-h-screen">
      {/* Hero banner */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-br from-cyan-950 via-slate-900 to-black overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[var(--primary)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-8 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-3">
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/tournaments" className="hover:text-[var(--foreground)] transition-colors">Campeonatos</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--foreground)]">{tournament.name}</span>
          </nav>
          <div className="flex items-end justify-between gap-4">
            <div>
              <Badge variant={STATUS_VARIANT[tournament.status]} className="mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${tournament.status === "ongoing" ? "bg-cyan-400 animate-pulse" : "bg-current"}`} />
                {getStatusLabel(tournament.status)}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{tournament.name}</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Por {tournament.organizer}</p>
            </div>
            <div className="hidden sm:block shrink-0">
              <div className="text-3xl font-black text-yellow-400">{formatCurrency(tournament.prize)}</div>
              <div className="text-xs text-[var(--muted-foreground)] text-right">premiação total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="info">
              <TabsList className="w-full justify-start mb-6 bg-[var(--card)] border border-[var(--border)]">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="teams">Times ({tournament.registeredTeams})</TabsTrigger>
                <TabsTrigger value="rules">Regras</TabsTrigger>
                <TabsTrigger value="bracket">Chaveamento</TabsTrigger>
              </TabsList>

              {/* Info tab */}
              <TabsContent value="info">
                <div className="space-y-6">
                  <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-[var(--primary)]" /> Sobre o Campeonato
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{tournament.description}</p>
                  </div>

                  {/* Prize breakdown */}
                  {tournament.prizeBreakdown && (
                    <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" /> Distribuição de Prêmios
                      </h3>
                      <div className="space-y-3">
                        {tournament.prizeBreakdown.map((p, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{p.place}</span>
                            <span className={`font-black text-sm ${i === 0 ? "text-yellow-400 text-base" : "text-[var(--foreground)]"}`}>
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Início", value: formatDate(tournament.startDate), icon: Calendar },
                      { label: "Término", value: formatDate(tournament.endDate), icon: Calendar },
                      { label: "Inscrições até", value: formatDate(tournament.registrationDeadline), icon: Clock },
                      { label: "Formato", value: FORMAT_LABELS[tournament.format], icon: Swords },
                      { label: "Região", value: tournament.region, icon: MapPin },
                      { label: "Jogo", value: tournament.game, icon: Shield },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-1">
                          <item.icon className="w-3 h-3" /> {item.label}
                        </div>
                        <div className="text-sm font-semibold">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {tournament.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Teams tab */}
              <TabsContent value="teams">
                <div className="space-y-3">
                  {teams.map((team, i) => (
                    <div key={team.id} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <div className="w-8 text-center text-sm font-bold text-[var(--muted-foreground)]">#{i + 1}</div>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center font-black text-xs text-[var(--primary)]">
                        {team.tag}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{team.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{team.members.length} jogadores</div>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {team.wins}W/{team.losses}L
                      </div>
                    </div>
                  ))}
                  {tournament.registeredTeams > teams.length && (
                    <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
                      + {tournament.registeredTeams - teams.length} times inscritos
                    </div>
                  )}
                  {Array.from({ length: tournament.maxTeams - tournament.registeredTeams }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-[var(--border)] opacity-40">
                      <div className="w-8 text-center text-sm text-[var(--muted-foreground)]">#{tournament.registeredTeams + i + 1}</div>
                      <div className="w-10 h-10 rounded-lg border border-dashed border-[var(--border)]" />
                      <div className="text-sm text-[var(--muted-foreground)]">Vaga disponível</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Rules tab */}
              <TabsContent value="rules">
                <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[var(--primary)]" /> Regras do Campeonato
                  </h3>
                  <ul className="space-y-3">
                    {tournament.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
                        <span className="text-[var(--muted-foreground)]">{rule}</span>
                      </li>
                    ))}
                  </ul>
                  <Separator className="my-5" />
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-300/80">
                      O não cumprimento das regras pode resultar em desqualificação e/ou banimento da plataforma.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Bracket tab */}
              <TabsContent value="bracket">
                <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--card)] text-center">
                  {tournament.status === "open" || tournament.status === "upcoming" ? (
                    <div>
                      <Swords className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4 opacity-40" />
                      <h3 className="font-semibold mb-2">Chaveamento ainda não gerado</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        O bracket será gerado automaticamente quando as inscrições encerrarem.
                      </p>
                    </div>
                  ) : (
                    <BracketDisplay teams={teams} />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Registration card */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[var(--primary)]" />
                <span className="font-semibold text-sm">Vagas</span>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-[var(--muted-foreground)]">{tournament.registeredTeams}/{tournament.maxTeams} times</span>
                  <span className={`font-bold ${isFull ? "text-red-400" : "text-[var(--primary)]"}`}>
                    {isFull ? "LOTADO" : `${spotsLeft} vagas`}
                  </span>
                </div>
                <Progress value={fillPercent} className={isFull ? "[&>div]:bg-red-500" : ""} />
              </div>

              {tournament.status === "open" && !isFull ? (
                <Button variant="gradient" className="w-full gap-2 font-bold" size="lg">
                  <Trophy className="w-4 h-4" />
                  Inscrever meu time
                </Button>
              ) : tournament.status === "open" && isFull ? (
                <Button variant="outline" className="w-full" disabled>
                  Inscrições encerradas
                </Button>
              ) : tournament.status === "ongoing" ? (
                <Button variant="outline" className="w-full gap-2" size="lg">
                  <Swords className="w-4 h-4" />
                  Acompanhar ao vivo
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  {tournament.status === "upcoming" ? "Em breve" : "Encerrado"}
                </Button>
              )}

              {tournament.checkInRequired && (
                <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-[var(--secondary)] text-xs text-[var(--muted-foreground)]">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-orange-400" />
                  Check-in obrigatório 30min antes da partida
                </div>
              )}
            </div>

            {/* Quick info */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <h4 className="font-semibold text-sm mb-4">Informações Rápidas</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Formato</span>
                  <span className="font-medium">{FORMAT_LABELS[tournament.format]}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Plataforma</span>
                  <span className="font-medium">{tournament.platform}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Região</span>
                  <span className="font-medium">{tournament.region}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Organizador</span>
                  <span className="font-medium text-[var(--primary)]">{tournament.organizer}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple bracket visual component
function BracketDisplay({ teams }: { teams: typeof mockTeams }) {
  const rounds = [
    { label: "Quartas", matches: [[teams[0], teams[1]], [teams[0], teams[1]]] },
    { label: "Semifinal", matches: [[teams[0], teams[1]]] },
    { label: "Final", matches: [[teams[0], teams[1]]] },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max p-4">
        {rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col justify-around gap-6" style={{ minWidth: 160 }}>
            <div className="text-xs font-bold text-[var(--primary)] text-center mb-2">{round.label}</div>
            {round.matches.map((match, mi) => (
              <div key={mi} className="rounded-lg border border-[var(--border)] overflow-hidden text-left">
                {match.map((team, ti) => (
                  <div
                    key={ti}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium ${ti === 0 ? "border-b border-[var(--border)]" : ""} ${ti === 0 ? "bg-[var(--primary)]/5" : ""}`}
                  >
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center text-[0.5rem] font-black text-[var(--primary)]">
                      {team?.tag?.slice(0, 2) ?? "TBD"}
                    </div>
                    <span className="truncate">{team?.name ?? "TBD"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
