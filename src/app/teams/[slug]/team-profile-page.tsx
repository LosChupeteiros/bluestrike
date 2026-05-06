import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Shield, Trophy, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";
import { getTeamBySlug } from "@/lib/teams";
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

  const starters = team.members?.filter((member) => member.isStarter) ?? [];
  const substitutes = team.members?.filter((member) => !member.isStarter) ?? [];
  const isCaptain = currentProfile?.id === team.captainId;
  const currentUserIsMember = Boolean(team.members?.some((member) => member.profileId === currentProfile?.id));
  const backHref = currentProfile ? resolveProfilePath(currentProfile) : "/teams";

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="mb-8 flex flex-col gap-5 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-2xl font-black text-[var(--primary)]">
              {team.tag}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{team.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="ongoing">[{team.tag}]</Badge>
                {team.isRecruiting && <Badge variant="open">Recrutando</Badge>}
                {!team.isActive && <Badge variant="finished">Inativo</Badge>}
                <span className="text-xs text-[var(--muted-foreground)]">{team.elo} ELO médio</span>
              </div>
              <div className="mt-3 flex items-start gap-2">
                {team.description ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {team.description}
                  </p>
                ) : isCaptain ? (
                  <p className="text-sm italic text-[var(--muted-foreground)]/60">Sem descrição ainda.</p>
                ) : null}
                {isCaptain && (
                  <EditDescriptionButton teamSlug={team.slug} currentDescription={team.description} />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {team.isRecruiting && !currentUserIsMember && (
              <Button asChild variant="gradient" className="gap-2">
                <Link href={`/teams/join/${team.joinCode}`}>
                  <UserPlus className="h-4 w-4" />
                  Entrar no time
                </Link>
              </Button>
            )}

            {isCaptain && (
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/teams/join/${team.joinCode}`}>Link de convite</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TeamProfileTabs
              starters={starters}
              substitutes={substitutes}
              isCaptain={isCaptain}
              captainId={team.captainId}
              teamSlug={team.slug}
              recentMatches={recentMatches}
            />
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Trophy className="h-4 w-4" />
                Estatísticas
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Vitorias</span>
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

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
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
          </div>
        </div>
      </div>
    </div>
  );
}
