import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Crown, Shield, Swords, Trophy, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";
import { getTeamBySlug } from "@/lib/teams";
import { getTeamMode } from "@/lib/team-modes";
import { getRecentMatchesForTeam } from "@/lib/matches";
import { DeleteTeamButton, EditDescriptionButton } from "./team-management-controls";
import { TeamProfileTabs } from "./team-profile-tabs";

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

  const recentMatches = await getRecentMatchesForTeam(team.id, 10);

  const teamModeConfig = getTeamMode(team.teamMode);
  const starters = team.members?.filter((member) => member.isStarter) ?? [];
  const substitutes = team.members?.filter((member) => !member.isStarter) ?? [];
  const captainMember = team.members?.find((member) => member.profileId === team.captainId);
  const isCaptain = currentProfile?.id === team.captainId;
  const currentUserIsMember = Boolean(team.members?.some((member) => member.profileId === currentProfile?.id));
  const backHref = currentProfile ? resolveProfilePath(currentProfile) : "/teams";
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
          <div className="lg:col-span-9">
            <TeamProfileTabs
              teamMode={team.teamMode}
              starters={starters}
              substitutes={substitutes}
              isCaptain={isCaptain}
              captainId={team.captainId}
              teamSlug={team.slug}
              recentMatches={recentMatches}
            />
          </div>

          <aside className="space-y-5 lg:col-span-3">
            {(team.isRecruiting && !currentUserIsMember) || isCaptain ? (
              <section className="bs-bento-card border-[var(--primary)]/25 p-5">
                <p className="bs-eyebrow"><UserPlus className="h-4 w-4" /> Gestão da lineup</p>
                <div className="mt-5 grid gap-2">
                  {team.isRecruiting && !currentUserIsMember && <Button asChild className="w-full" variant="gradient"><Link href={`/teams/join/${team.joinCode}`}>Solicitar vaga</Link></Button>}
                  {isCaptain && <Button asChild className="w-full" variant="outline"><Link href={`/teams/join/${team.joinCode}`}>Compartilhar convite</Link></Button>}
                  <Button asChild className="w-full" variant="outline"><Link href="/tournaments">Ver campeonatos</Link></Button>
                </div>
              </section>
            ) : null}

            <section className="bs-bento-card p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                <Trophy className="h-4 w-4" />
                Estatísticas
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Vitórias</span>
                  <span className="font-bold">{team.wins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Derrotas</span>
                  <span className="font-bold">{team.losses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Line atual</span>
                  <span className="font-bold">{team.members?.length ?? 0}/6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">ELO médio</span>
                  <span className="font-bold text-[var(--primary)]">{team.elo}</span>
                </div>
              </div>
            </section>

            <section className="bs-bento-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Shield className="h-4 w-4" />
                Informações
              </div>
              <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
                <div className="flex justify-between gap-3">
                  <span>Código de convite</span>
                  <span className="font-mono text-[var(--foreground)]">{team.joinCode}</span>
                </div>
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
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]"><Swords className="h-3 w-3" /> 5v5</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Membros</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]"><Users className="h-3 w-3" /> {team.members?.length ?? 0}</span>
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
