import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Shield, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getTeamByJoinCode } from "@/lib/teams";
import JoinTeamFormClient from "./join-team-form-client";

interface JoinTeamPageViewProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function JoinTeamPageView({ params }: JoinTeamPageViewProps) {
  const { code } = await params;
  const team = await getTeamByJoinCode(code);

  if (!team) {
    notFound();
  }

  const starters = team.members?.filter((member) => member.isStarter) ?? [];

  return (
    <div className="flex min-h-screen items-start justify-center pb-20 pt-24">
      <div className="mx-auto w-full max-w-lg px-4">
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Ver todos os times
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
          <div className="mb-6 flex items-center gap-4 border-b border-[var(--border)] pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-xl font-black text-[var(--primary)]">
              {team.tag}
            </div>

            <div>
              <h1 className="text-2xl font-black">{team.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="ongoing" className="font-mono text-xs">
                  [{team.tag}]
                </Badge>
                <span className="text-xs text-[var(--muted-foreground)]">{team.elo} ELO</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Users className="h-4 w-4" />
              Line atual ({starters.length}/5)
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {starters.map((member) => {
                const displayName = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "-";
                return (
                  <div key={member.id} className="flex items-center gap-1.5 rounded-lg bg-[var(--secondary)] px-2.5 py-1.5 text-xs font-medium">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                      <AvatarFallback className="text-[9px]">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {displayName}
                  </div>
                );
              })}

              {Array.from({ length: Math.max(0, 5 - starters.length) }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="rounded-lg border border-dashed border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted-foreground)]"
                >
                  Vaga aberta
                </div>
              ))}
            </div>
          </div>

          {team.description && (
            <p className="mb-6 border-b border-[var(--border)] pb-6 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {team.description}
            </p>
          )}

          {team.passwordHash ? (
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Shield className="h-4 w-4" />
                Senha de entrada
              </div>
              <JoinTeamFormClient inviteCode={code} teamSlug={team.slug} teamName={team.name} requiresPassword />
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                Voce foi convidado para <span className="font-bold text-[var(--foreground)]">{team.name}</span>.
                Confirme abaixo para entrar na line.
              </p>
              <JoinTeamFormClient inviteCode={code} teamSlug={team.slug} teamName={team.name} requiresPassword={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
