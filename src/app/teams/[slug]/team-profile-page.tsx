import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Crown, Lock, Shield, Swords, Trophy, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";
import { getTeamBySlug } from "@/lib/teams";
import { getTeamMode } from "@/lib/team-modes";
import { getTournamentsForTeam } from "@/lib/tournaments";
import { getRecentMatchesForTeam } from "@/lib/matches";
import { DeleteTeamButton, EditDescriptionButton } from "./team-management-controls";
import { TeamRosterSection } from "./team-roster-section";
import TeamInviteControls from "./team-invite-controls";

const TOURNAMENT_STATUS_LABEL: Record<string, string> = {
  upcoming: "Em breve",
  open: "Inscrições abertas",
  ongoing: "Em andamento",
  finished: "Finalizado",
};

interface TeamProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TeamProfilePage({ params }: TeamProfilePageProps) {
  const { slug } = await params;
  const [team, currentProfile] = await Promise.all([getTeamBySlug(slug), getCurrentProfile()]);

  if (!team) {
    notFound();
  }

  const [recentMatches, teamTournaments] = await Promise.all([
    getRecentMatchesForTeam(team.id, 10),
    getTournamentsForTeam(team.id),
  ]);

  const teamModeConfig = getTeamMode(team.teamMode);
  const starters = team.members?.filter((member) => member.isStarter) ?? [];
  const substitutes = team.members?.filter((member) => !member.isStarter) ?? [];
  const captainMember = team.members?.find((member) => member.profileId === team.captainId);
  const isCaptain = currentProfile?.id === team.captainId;
  const currentUserIsMember = Boolean(team.members?.some((member) => member.profileId === currentProfile?.id));
  const backHref = currentProfile ? resolveProfilePath(currentProfile) : "/teams";
  const memberCount = team.members?.length ?? 0;
  const openSlots = Math.max(0, teamModeConfig.maxMembers - memberCount);
  // 1x1 nunca aceita pedido de vaga: o elenco maximo e o proprio capitao.
  const canRequestSlot = openSlots > 0 && !currentUserIsMember && team.isRecruiting;
  const totalMatches = team.wins + team.losses;
  const winRate = totalMatches > 0 ? Math.round((team.wins / totalMatches) * 100) : 0;

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>

        <header className="bs-bento-card relative mb-8 overflow-hidden rounded-[1.75rem]">
          <div className="pointer-events-none absolute -right-28 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full border-[58px] border-[var(--primary)]/10" />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center lg:col-span-7">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--primary)]/25 bg-[#05080d] text-3xl font-black text-[var(--primary)] shadow-[0_24px_80px_rgba(0,0,0,.4)]">
                {team.logoUrl ? <Image alt={team.name} className="object-contain p-4" fill sizes="112px" src={team.logoUrl} unoptimized /> : team.tag}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {team.isRecruiting && <Badge variant="open">● Recrutando</Badge>}
                  <Badge variant="ongoing">[{team.tag}]</Badge>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-1 font-mono text-[11px] font-black text-[var(--primary)]">
                    {teamModeConfig.label}
                    <span className="font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]/70">
                      {teamModeConfig.gameModeLabel}
                    </span>
                  </span>
                </div>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{team.name}</h1>
                <div className="mt-3 flex items-start gap-2">
                  {team.description ? <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{team.description}</p> : isCaptain ? <p className="text-sm italic text-[var(--muted-foreground)]/60">Sem descrição ainda.</p> : null}
                  {isCaptain && <EditDescriptionButton currentDescription={team.description} teamSlug={team.slug} />}
                </div>
                {captainMember?.profile && (
                  <Link className="mt-5 inline-flex items-center gap-3 text-xs text-[var(--muted-foreground)] hover:text-white" href={resolveProfilePath(captainMember.profile)}>
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--secondary)]">
                      {captainMember.profile.steamAvatarUrl ? <Image alt="" height={32} src={captainMember.profile.steamAvatarUrl} unoptimized width={32} /> : <Crown className="h-4 w-4 text-[var(--primary)]" />}
                    </span>
                    <span><span className="block text-[9px] uppercase tracking-[0.14em]">Capitão</span><strong className="text-white">{captainMember.profile.steamPersonaName}</strong></span>
                  </Link>
                )}
              </div>
            </div>

            <div className="bs-inset grid gap-3 p-3 sm:grid-cols-2 lg:col-span-5">
              {[
                { label: "BlueStrike ELO", value: team.elo.toLocaleString("pt-BR"), detail: "Média da lineup", accent: true },
                { label: "Recorde", value: `${team.wins}V · ${team.losses}D`, detail: `${winRate}% win rate`, accent: false },
                { label: "Partidas", value: totalMatches.toString(), detail: "Registradas", accent: false },
                { label: "Lineup", value: `${starters.length}/${teamModeConfig.playersPerTeam}`, detail: `${substitutes.length} reserva${substitutes.length === 1 ? "" : "s"}`, accent: true },
              ].map((metric) => (
                <div className="bs-bento-card p-4" key={metric.label}>
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{metric.label}</span>
                  <strong className={`mt-2 block font-mono text-2xl ${metric.accent ? "text-[var(--primary)]" : ""}`}>{metric.value}</strong>
                  <span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{metric.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 xl:col-span-9">
            <TeamRosterSection
              teamMode={team.teamMode}
              teamTag={team.tag}
              starters={starters}
              substitutes={substitutes}
              isCaptain={isCaptain}
              captainId={team.captainId}
              teamSlug={team.slug}
              recentMatches={recentMatches}
            />
          </div>

          <aside className="space-y-5 lg:col-span-4 xl:col-span-3">
            {isCaptain && (
              <section className="bs-bento-card border-[var(--primary)]/25 p-5">
                <p className="bs-eyebrow"><UserPlus className="h-4 w-4" /> Convidar jogador</p>
                <div className="mt-4">
                  <TeamInviteControls
                    joinCode={team.joinCode}
                    hasPassword={team.hasPassword}
                    openSlots={openSlots}
                    modeLabel={teamModeConfig.label}
                  />
                </div>
              </section>
            )}

            {!isCaptain && canRequestSlot && (
              <section className="bs-bento-card border-[var(--primary)]/25 p-5">
                <p className="bs-eyebrow"><UserPlus className="h-4 w-4" /> Entrar no time</p>
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  Esse time tem {openSlots} {openSlots === 1 ? "vaga aberta" : "vagas abertas"} no
                  formato {teamModeConfig.label}.
                </p>
                <Button asChild className="mt-4 w-full" variant="gradient">
                  <Link href={`/teams/join/${team.joinCode}`}>Solicitar vaga</Link>
                </Button>
              </section>
            )}

            {!isCaptain && !canRequestSlot && !currentUserIsMember && (
              <section className="bs-bento-card p-5">
                <p className="bs-eyebrow"><Lock className="h-4 w-4" /> Line fechada</p>
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {teamModeConfig.playersPerTeam === 1
                    ? "Times de 1x1 são individuais — não aceitam outros jogadores."
                    : `Esse time já preencheu as ${teamModeConfig.maxMembers} vagas do formato ${teamModeConfig.label}.`}
                </p>
              </section>
            )}

            {/* ── Campeonatos do time ── */}
            <section className="bs-bento-card p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                  <Trophy className="h-4 w-4" />
                  Campeonatos
                </div>
                {teamTournaments.length > 0 && (
                  <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                    {teamTournaments.length}
                  </span>
                )}
              </div>

              {teamTournaments.length === 0 ? (
                <>
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                    Esse time ainda não disputou nenhum campeonato.
                  </p>
                  {isCaptain && (
                    <Button asChild className="mt-4 w-full" variant="outline" size="sm">
                      <Link href="/tournaments">Ver campeonatos abertos</Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  {teamTournaments.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/tournaments/${entry.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/15 p-2.5 transition-colors hover:border-[var(--primary)]/35"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[#05080d]">
                        {entry.bannerUrl ? (
                          <Image alt="" src={entry.bannerUrl} width={36} height={36} className="h-full w-full object-cover" unoptimized />
                        ) : (
                          <Trophy className="h-4 w-4 text-[var(--primary)]/60" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold transition-colors group-hover:text-[var(--primary)]">
                          {entry.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                          <span className="font-mono">{getTeamMode(entry.teamMode).label}</span>
                          <span aria-hidden="true">·</span>
                          <span>{TOURNAMENT_STATUS_LABEL[entry.status] ?? entry.status}</span>
                        </span>
                      </span>
                      {entry.registrationStatus === "champion" && (
                        <Trophy className="h-3.5 w-3.5 shrink-0 text-[#f5c842]" aria-label="Campeão" />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="bs-bento-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Shield className="h-4 w-4" />
                Informações
              </div>
              <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
                <div className="flex justify-between gap-3">
                  <span>Criado em</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {new Date(team.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Status</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {team.isRecruiting ? "Recrutando" : "Line fechada"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Formato</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]">
                    <Swords className="h-3 w-3" /> {teamModeConfig.label}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Membros</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]">
                    <Users className="h-3 w-3" /> {memberCount}/{teamModeConfig.maxMembers}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>ELO médio</span>
                  <span className="font-bold text-[var(--primary)]">{team.elo}</span>
                </div>
              </div>
            </section>

            {isCaptain && (
              <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <div className="mb-3 text-sm font-semibold text-red-300">Gestão do capitão</div>
                <p className="mb-4 text-xs leading-relaxed text-red-100/80">
                  Se a line acabar ou você quiser reorganizar tudo, pode arquivar o time por aqui. O sistema
                  bloqueia a exclusão se ainda houver campeonato ativo vinculado.
                </p>
                <DeleteTeamButton teamSlug={team.slug} redirectPath={`${backHref}?tab=teams&teamDeleted=1`} />
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
