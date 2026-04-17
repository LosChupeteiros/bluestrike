import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Shield, Trophy, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfilePath } from "@/lib/profile";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";
import { getTeamBySlug } from "@/lib/teams";
import { DeleteTeamButton, EditDescriptionButton, KickMemberButton } from "./team-management-controls";

const ROLE_LABELS: Record<string, string> = {
  igl: "IGL",
  awper: "AWPer",
  "entry-fragger": "Entry Fragger",
  rifler: "Rifler",
  lurker: "Lurker",
  support: "Support",
  coach: "Coach",
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
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  <Users className="h-4 w-4" />
                  Line principal
                </div>
                <Badge variant={starters.length >= 5 ? "open" : "upcoming"}>
                  {starters.length}/5 titulares
                </Badge>
              </div>

              <div className="space-y-3">
                {starters.map((member) => {
                  const displayName = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "Jogador";
                  const role = member.inGameRole ? ROLE_LABELS[member.inGameRole] ?? member.inGameRole : "Sem função";
                  const isMemberCaptain = member.profileId === team.captainId;

                  const profileHref = member.profile?.publicId
                    ? getProfilePath(member.profile.publicId)
                    : null;

                  return (
                    <div key={member.id} className="flex flex-col gap-3 rounded-xl bg-[var(--secondary)] p-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {profileHref ? (
                          <Link href={profileHref} className="shrink-0">
                            <Avatar className="h-10 w-10 ring-1 ring-[var(--border)] transition-opacity hover:opacity-80">
                              <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                              <AvatarFallback className="text-xs">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </Link>
                        ) : (
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                            <AvatarFallback className="text-xs">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}

                        <div className="min-w-0 flex-1">
                          {profileHref ? (
                            <Link href={profileHref} className="truncate text-sm font-semibold transition-colors hover:text-[var(--primary)]">
                              {displayName}
                            </Link>
                          ) : (
                            <div className="truncate text-sm font-semibold">{displayName}</div>
                          )}
                          <div className="text-xs text-[var(--muted-foreground)]">{role}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isMemberCaptain && <Badge variant="gold">Capitão</Badge>}
                        <span className="text-xs font-bold text-[var(--primary)]">{member.profile?.elo ?? 1000} ELO</span>
                        {isCaptain && !isMemberCaptain && (
                          <KickMemberButton teamSlug={team.slug} memberId={member.id} displayName={displayName} />
                        )}
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: Math.max(0, 5 - starters.length) }).map((_, index) => (
                  <div
                    key={`starter-empty-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--border)] px-3 py-4 opacity-60"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
                      <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">Vaga titular em aberto</span>
                  </div>
                ))}
              </div>

              {substitutes.length > 0 && (
                <div className="mt-5 border-t border-[var(--border)] pt-5">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Substitutos
                  </div>

                  <div className="space-y-3">
                    {substitutes.map((member) => {
                      const displayName = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "Jogador";
                      const subProfileHref = member.profile?.publicId
                        ? getProfilePath(member.profile.publicId)
                        : null;

                      return (
                        <div key={member.id} className="flex flex-col gap-3 rounded-xl bg-[var(--secondary)] p-3 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            {subProfileHref ? (
                              <Link href={subProfileHref} className="shrink-0">
                                <Avatar className="h-10 w-10 ring-1 ring-[var(--border)] transition-opacity hover:opacity-80">
                                  <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                                  <AvatarFallback className="text-xs">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </Link>
                            ) : (
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                                <AvatarFallback className="text-xs">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            {subProfileHref ? (
                              <Link href={subProfileHref} className="truncate text-sm font-semibold transition-colors hover:text-[var(--primary)]">
                                {displayName}
                              </Link>
                            ) : (
                              <span className="truncate text-sm font-semibold">{displayName}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Sub</Badge>
                            <span className="text-xs font-bold text-[var(--primary)]">{member.profile?.elo ?? 1000} ELO</span>
                            {isCaptain && (
                              <KickMemberButton teamSlug={team.slug} memberId={member.id} displayName={displayName} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
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
