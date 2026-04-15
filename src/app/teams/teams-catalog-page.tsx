import Link from "next/link";
import { Plus, Search, Shield, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublicTeams } from "@/lib/teams";

interface TeamsCatalogPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

function buildTeamsHref(query: string, page: number) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const suffix = params.toString();
  return suffix ? `/teams?${suffix}` : "/teams";
}

export default async function TeamsCatalogPage({ searchParams }: TeamsCatalogPageProps) {
  const query = await searchParams;
  const page = Number.parseInt(query.page ?? "1", 10);
  const teamList = await listPublicTeams({
    query: query.q ?? "",
    page: Number.isFinite(page) ? page : 1,
  });

  const recruiting = teamList.teams.filter((team) => team.isRecruiting);

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Users className="h-4 w-4" />
              Times
            </div>
            <h1 className="text-4xl font-black tracking-tight">Catalogo de Times</h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              {teamList.recruitingCount > 0
                ? `${teamList.recruitingCount} time${teamList.recruitingCount !== 1 ? "s" : ""} recrutando no momento.`
                : "Monte sua line, distribua o convite e coloque sua equipe no hub."}
            </p>
          </div>

          <Button asChild variant="gradient" className="gap-2 shrink-0">
            <Link href="/teams/create">
              <Plus className="h-4 w-4" />
              Criar time
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <form action="/teams" className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input name="q" defaultValue={teamList.query} className="pl-9" placeholder="Buscar por nome, tag ou descricao..." />
          </form>

          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-[var(--muted-foreground)]">
              {teamList.total} resultado{teamList.total !== 1 ? "s" : ""}
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-[var(--muted-foreground)]">
              {teamList.page} / {teamList.totalPages} paginas
            </div>
          </div>
        </div>

        {recruiting.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Recrutando jogadores
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recruiting.map((team) => (
                <Link key={team.id} href={`/teams/${team.slug}`} className="group block h-full">
                  <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 card-hover">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-base font-black text-[var(--primary)]">
                        {team.tag}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base font-black transition-colors group-hover:text-[var(--primary)]">
                          {team.name}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">{team.elo} ELO medio</div>
                      </div>
                    </div>

                    {team.description && (
                      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                        {team.description}
                      </p>
                    )}

                    <div className="mb-4 flex items-center gap-1.5">
                      {team.members?.slice(0, 5).map((member) => {
                        const displayName = member.profile?.steamPersonaName ?? member.profile?.fullName ?? "?";
                        return (
                          <Avatar key={member.id} className="h-7 w-7 ring-1 ring-[var(--border)]">
                            <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={displayName} />
                            <AvatarFallback className="text-[10px]">{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        );
                      })}
                    </div>

                    <div className="mt-auto flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>{team.members?.length ?? 0} jogadores</span>
                      <Badge variant="open">Recrutando</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-4 text-lg font-bold">Todos os times</h2>

          {teamList.teams.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-40" />
              <h3 className="mb-2 text-lg font-semibold">Nenhum time encontrado</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Ajuste a busca ou crie a primeira line com essa identidade.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamList.teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.slug}`} className="group block">
                  <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-sm font-black text-[var(--primary)]">
                      {team.tag}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold transition-colors group-hover:text-[var(--primary)]">
                        {team.name}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {team.members?.length ?? 0} jogador{(team.members?.length ?? 0) !== 1 ? "es" : ""} · {team.wins}V {team.losses}D · {team.elo} ELO medio
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {team.isRecruiting && <Badge variant="open">Recrutando</Badge>}
                      {!team.isActive && <Badge variant="finished">Inativo</Badge>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {teamList.totalPages > 1 && (
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--muted-foreground)]">
              Pagina {teamList.page} de {teamList.totalPages}
            </div>

            <div className="flex gap-2">
              {teamList.page <= 1 ? (
                <Button variant="outline" size="sm" disabled>
                  Pagina anterior
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildTeamsHref(teamList.query, teamList.page - 1)}>Pagina anterior</Link>
                </Button>
              )}

              {teamList.page >= teamList.totalPages ? (
                <Button variant="outline" size="sm" disabled>
                  Proxima pagina
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildTeamsHref(teamList.query, teamList.page + 1)}>Proxima pagina</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
