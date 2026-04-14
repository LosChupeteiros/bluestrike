"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
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
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "../profile-form";
import {
  calculateProfileCompletion,
  ELO_BANDS,
  getEloBand,
  getMissingRequiredFields,
  getProfileAge,
  roleLabel,
  type UserProfile,
} from "@/lib/profile";
import { cn, formatDate } from "@/lib/utils";
import type { MockRecentMatchSummary } from "@/data/competitive-mock";
import type { Team } from "@/types";

interface ProfileShellProps {
  profile: UserProfile;
  stats: {
    winRate: number;
    kdRatio: number;
    hsRate: number;
  };
  teams: Team[];
  recentMatches: MockRecentMatchSummary[];
  isOwner: boolean;
  defaultEditOpen: boolean;
  showWelcome: boolean;
  showCompletionAlert: boolean;
}

export default function ProfileShell({
  profile,
  stats,
  teams,
  recentMatches,
  isOwner,
  defaultEditOpen,
  showWelcome,
  showCompletionAlert,
}: ProfileShellProps) {
  const [isEditing, setIsEditing] = useState(defaultEditOpen);
  const [isEloHoverOpen, setIsEloHoverOpen] = useState(false);

  const completion = calculateProfileCompletion(profile);
  const age = getProfileAge(profile.birthDate);
  const currentBand = getEloBand(profile.elo);
  const missingFields = getMissingRequiredFields(profile);
  const role = roleLabel(profile.inGameRole);
  const publicName = profile.fullName?.trim() || "Nome completo pendente";

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isEditing]);

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
                      : "Seu cadastro competitivo já está pronto para competir."}
                  </p>
                </div>

                <div className="min-w-44">
                  <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Progresso</span>
                    <span className="font-semibold text-[var(--primary)]">{completion}%</span>
                  </div>
                  <Progress value={completion} />
                </div>
              </div>
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
                  <Badge variant={currentBand.badgeVariant}>{currentBand.label}</Badge>
                  <Badge variant={completion === 100 ? "open" : "upcoming"}>
                    {completion === 100 ? "Cadastro OK" : "Cadastro pendente"}
                  </Badge>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {profile.elo} ELO
                  </span>
                  <span>·</span>
                  <span>{role}</span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {profile.bio ??
                    "Ainda sem bio pública. Abra a edição para contar como você joga, como se comunica e o que seu time pode esperar de você no servidor."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {profile.steamProfileUrl && (
                <Button asChild variant="outline" className="gap-2">
                  <Link href={profile.steamProfileUrl} target="_blank" rel="noreferrer">
                    Ver Steam
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              {isOwner && (
                <Button variant="gradient" className="gap-2" onClick={() => setIsEditing(true)}>
                  <Settings className="h-4 w-4" />
                  Editar perfil
                </Button>
              )}
            </div>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div
              className="relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 card-hover"
              onMouseEnter={() => setIsEloHoverOpen(true)}
              onMouseLeave={() => setIsEloHoverOpen(false)}
            >
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                <span className="text-xs text-[var(--muted-foreground)]">ELO</span>
              </div>
              <div className="text-2xl font-black text-[var(--primary)]">{profile.elo}</div>

              {isEloHoverOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-[320px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
                  <div className="mb-3 text-sm font-bold">Faixas de ELO</div>
                  <div className="space-y-2">
                    {ELO_BANDS.map((band) => {
                      const isCurrent = band.key === currentBand.key;

                      return (
                        <div
                          key={band.key}
                          className={cn(
                            "rounded-xl border px-3 py-2 transition-colors",
                            isCurrent
                              ? "border-[var(--primary)]/30 bg-[var(--primary)]/8"
                              : "border-[var(--border)] bg-[var(--secondary)]"
                          )}
                        >
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className={cn("text-sm font-bold", band.accentClass)}>{band.label}</span>
                            <span className="text-xs font-mono text-[var(--muted-foreground)]">
                              {Number.isFinite(band.max) ? `${band.min}-${band.max}` : `${band.min}+`}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                            {band.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 card-hover">
              <div className="mb-1 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-400" />
                <span className="text-xs text-[var(--muted-foreground)]">Win rate</span>
              </div>
              <div className="text-2xl font-black text-green-400">{stats.winRate}%</div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 card-hover">
              <div className="mb-1 flex items-center gap-2">
                <Swords className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-[var(--muted-foreground)]">K/D ratio</span>
              </div>
              <div className="text-2xl font-black text-orange-400">{stats.kdRatio.toFixed(2)}</div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 card-hover">
              <div className="mb-1 flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-[var(--muted-foreground)]">HS rate</span>
              </div>
              <div className="text-2xl font-black text-orange-400">{stats.hsRate}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Tabs defaultValue="matches">
                <TabsList className="mb-6 border border-[var(--border)] bg-[var(--card)]">
                  <TabsTrigger value="matches">Últimas partidas</TabsTrigger>
                  <TabsTrigger value="teams">Meus times</TabsTrigger>
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
                              <span>·</span>
                              <span>{match.tournamentName}</span>
                              <span>·</span>
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

                <TabsContent value="teams">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Meus times</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Monte sua line e prepare a inscrição nos campeonatos.
                      </p>
                    </div>

                    <Button asChild variant="gradient" size="sm" className="gap-2">
                      <Link href="/teams/create">
                        <Users className="h-4 w-4" />
                        Criar time
                      </Link>
                    </Button>
                  </div>

                  {teams.length > 0 ? (
                    <div className="space-y-5">
                      {teams.map((team) => (
                        <div key={team.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                          <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 font-black text-[var(--primary)]">
                                {team.tag}
                              </div>
                              <div>
                                <div className="text-lg font-black">{team.name}</div>
                                <div className="text-xs text-[var(--muted-foreground)]">
                                  {team.wins}V / {team.losses}D
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {team.members?.map((member, index) => {
                              const nick = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "—";
                              const avatar = member.profile?.steamAvatarUrl ?? undefined;
                              const elo = member.profile?.elo ?? 0;
                              return (
                              <div key={member.id} className="flex items-center gap-3 rounded-lg bg-[var(--secondary)] p-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={avatar} alt={nick} />
                                  <AvatarFallback className="text-xs">{nick[0]}</AvatarFallback>
                                </Avatar>
                                <span className="flex-1 text-sm font-medium">{nick}</span>
                                {index === 0 && <Badge variant="gold">Capitão</Badge>}
                                <span className="text-xs font-bold text-[var(--primary)]">{elo} ELO</span>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
                      <Users className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-40" />
                      <h3 className="mb-2 font-semibold">Nenhum time vinculado</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Crie seu time com 5 titulares e 1 substituto opcional para competir no hub.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  <Users className="h-4 w-4" />
                  Perfil público
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Nome completo</span>
                    <span className="text-right font-medium">{publicName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Idade</span>
                    <span className="font-medium">{age ? `${age} anos` : "Não informada"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Função</span>
                    <span className="font-medium">{role}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Faixa</span>
                    <span className={cn("font-semibold", currentBand.accentClass)}>{currentBand.label}</span>
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
                  CPF, celular e data de nascimento ficam protegidos e só aparecem no modo de edição
                  do próprio jogador.
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
                      <span className="text-[var(--muted-foreground)]">Nível Steam</span>
                      <span className="font-medium text-[var(--primary)]">{profile.steamLevel}</span>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsEditing(false);
            }
          }}
        >
          <div className="relative w-full max-w-5xl rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-[var(--border)] bg-[var(--background)]/95 px-6 py-4 backdrop-blur">
              <div>
                <div className="text-sm font-semibold text-[var(--primary)]">Edição do perfil</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Ajuste sua ficha competitiva sem sair da página.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full border border-[var(--border)] p-2 text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
                aria-label="Fechar edição"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <ProfileForm profile={profile} onCancel={() => setIsEditing(false)} onSaved={() => setIsEditing(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
