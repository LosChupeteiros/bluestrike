import Link from "next/link";
import { ArrowRight, Crown, ExternalLink, Plus, Search, Shield, Sparkles, Swords, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFaceitTeamsByIds, type FaceitTeam } from "@/lib/faceit";
import { getCurrentProfile, listRegisteredFaceitTeamIds } from "@/lib/profiles";
import { listPublicTeams, getTeamsForProfile, teamMaxMembers, teamMinStarters } from "@/lib/teams";
import { formatTeamSize } from "@/lib/utils";
import type { Team } from "@/types";

interface TeamsCatalogPageProps {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    faceitQ?: string | string[];
    size?: string | string[];
  }>;
}

function readSearchParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildTeamsHref(query: string, page: number, faceitQuery: string, teamSize: number | null) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  if (faceitQuery) params.set("faceitQ", faceitQuery);
  if (teamSize) params.set("size", String(teamSize));

  const suffix = params.toString();
  return suffix ? `/teams?${suffix}` : "/teams";
}

function filterFaceitTeams(teams: FaceitTeam[], query: string) {
  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) {
    return teams;
  }

  return teams.filter((team) => {
    const fields = [
      team.name,
      team.nickname,
      ...team.members.map((member) => member.nickname),
    ];

    return fields.some((field) => normalizeSearch(field).includes(normalizedQuery));
  });
}

function sortFaceitTeams(teams: FaceitTeam[]) {
  return [...teams].sort((a, b) => {
    const memberDiff = b.members.length - a.members.length;
    if (memberDiff !== 0) return memberDiff;

    return a.name.localeCompare(b.name, "pt-BR");
  });
}

function FaceitGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
    </svg>
  );
}

function TeamIdentity({ team }: { team: Team }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-cyan-950 to-slate-900 text-xs font-black text-[var(--primary)]">
        {team.tag}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold">{team.name}</span>
          <span className="shrink-0 rounded border border-[var(--primary)]/30 bg-[var(--primary)]/12 px-1.5 py-0.5 font-mono text-[10px] font-black text-[var(--primary)]">
            {formatTeamSize(team.teamSize)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span>{team.members?.length ?? 0} jogadores</span>
          <span className="text-[10px]">/</span>
          <span>{team.wins}V {team.losses}D</span>
        </div>
      </div>
    </div>
  );
}

function BluestrikeFeaturedCard({ team }: { team: Team }) {
  return (
    <Link href={`/teams/${team.slug}`} className="group block h-full">
      <div className="flex h-full flex-col rounded-2xl border border-[var(--primary)]/15 bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--primary)]/5 p-5 transition-all hover:border-[var(--primary)]/35 hover:shadow-[0_0_24px_rgba(0,200,255,0.08)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <TeamIdentity team={team} />
          <Badge variant="open" className="shrink-0">
            Recrutando
          </Badge>
        </div>

        <p className="line-clamp-3 min-h-[60px] text-sm leading-relaxed text-[var(--muted-foreground)]">
          {team.description || "Time ativo na plataforma procurando reforcos para os proximos torneios."}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center -space-x-2">
            {(team.members ?? []).slice(0, 4).map((member) => {
              const name = member.profile?.steamPersonaName ?? "?";

              return (
                <Avatar
                  key={member.id}
                  className="h-8 w-8 border-2 border-[var(--card)] bg-[var(--secondary)]"
                >
                  <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={name} />
                  <AvatarFallback className="text-[10px]">
                    {name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--muted-foreground)]">ELO medio</div>
            <div className="text-sm font-black text-[var(--primary)]">{team.elo}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Meu time ──────────────────────────────────────────────────────────────────
// Ocupa metade do bloco de destaque para o jogador logado achar a propria lineup
// sem precisar procurar na tabela geral.

function MyTeamCard({ team, isCaptain }: { team: Team; isCaptain: boolean }) {
  const members = team.members ?? [];
  const starters = members.filter((member) => member.isStarter);
  const missingStarters = Math.max(0, teamMinStarters(team.teamSize) - starters.length);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/8 via-[var(--card)] to-[var(--card)] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/35 bg-gradient-to-br from-cyan-950 to-slate-900 text-xs font-black text-[var(--primary)]">
            {team.tag}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-black tracking-tight">{team.name}</span>
              <span className="shrink-0 rounded border border-[var(--primary)]/30 bg-[var(--primary)]/12 px-1.5 py-0.5 font-mono text-[10px] font-black text-[var(--primary)]">
                {formatTeamSize(team.teamSize)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              {isCaptain ? (
                <>
                  <Crown className="h-3.5 w-3.5 text-[#f5c842]" aria-hidden="true" />
                  <span className="font-semibold text-[#f5c842]">Capitao</span>
                </>
              ) : (
                <>
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Membro</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Badge variant={missingStarters === 0 ? "open" : "upcoming"} className="shrink-0">
          {missingStarters === 0 ? "Lineup completa" : `Faltam ${missingStarters}`}
        </Badge>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">ELO</div>
          <div className="font-mono text-lg font-black leading-tight text-[var(--primary)]">{team.elo}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Record</div>
          <div className="font-mono text-lg font-black leading-tight">
            {team.wins}<span className="text-[var(--muted-foreground)]">V</span> {team.losses}<span className="text-[var(--muted-foreground)]">D</span>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Lineup</div>
          <div className="font-mono text-lg font-black leading-tight">
            {members.length}<span className="text-sm text-[var(--muted-foreground)]">/{teamMaxMembers(team.teamSize)}</span>
          </div>
        </div>
      </div>

      <div className="mb-5 flex items-center -space-x-2">
        {members.slice(0, teamMaxMembers(team.teamSize)).map((member) => {
          const name = member.profile?.steamPersonaName ?? "?";

          return (
            <Avatar key={member.id} className="h-9 w-9 border-2 border-[var(--card)] bg-[var(--secondary)]">
              <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={name} />
              <AvatarFallback className="text-[10px]">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
          );
        })}

        {missingStarters > 0 && (
          <Link
            href={`/teams/${team.slug}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
            aria-label="Convidar jogadores para o time"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <Button asChild variant="gradient" className="flex-1">
          <Link href={`/teams/${team.slug}`}>
            Abrir meu time
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/tournaments">Competir</Link>
        </Button>
      </div>
    </div>
  );
}

function MyTeamRow({ team, isCaptain }: { team: Team; isCaptain: boolean }) {
  const members = team.members ?? [];
  const starters = members.filter((member) => member.isStarter);
  const missingStarters = Math.max(0, teamMinStarters(team.teamSize) - starters.length);

  return (
    <Link
      href={`/teams/${team.slug}`}
      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 transition-colors hover:border-[var(--primary)]/35 hover:bg-[var(--secondary)]/60"
    >
      <span className="shrink-0 rounded border border-[var(--primary)]/30 bg-[var(--primary)]/12 px-1.5 py-1 font-mono text-[10px] font-black text-[var(--primary)]">
        {formatTeamSize(team.teamSize)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold">{team.name}</span>
          {isCaptain && <Crown className="h-3 w-3 shrink-0 text-[#f5c842]" aria-hidden="true" />}
        </div>
        <div className="text-[10px] text-[var(--muted-foreground)]">
          {members.length}/{teamMaxMembers(team.teamSize)} no elenco
          {missingStarters > 0 && ` · faltam ${missingStarters} titular${missingStarters > 1 ? "es" : ""}`}
        </div>
      </div>

      <span className="shrink-0 font-mono text-sm font-black text-[var(--primary)]">{team.elo}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
    </Link>
  );
}

function NoTeamCard({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/8">
        <Shield className="h-6 w-6 text-[var(--primary)]" aria-hidden="true" />
      </div>

      <h3 className="text-base font-black tracking-tight">
        {isAuthenticated ? "Voce ainda nao tem time" : "Entre para ver seu time"}
      </h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-[var(--muted-foreground)]">
        {isAuthenticated
          ? "Crie um time no formato que voce quer disputar — 1x1, 2x2, ate 5x5 — ou entre em um time existente com o codigo de convite."
          : "Faca login com a Steam para acompanhar sua lineup, o ELO do time e as inscricoes em campeonatos."}
      </p>

      <div className="mt-4 flex justify-center gap-2">
        {isAuthenticated ? (
          <>
            <Button asChild variant="gradient">
              <Link href="/teams/create">
                <Plus className="h-4 w-4" />
                Criar time
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/players">Procurar jogadores</Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="gradient">
            <Link href="/auth/login?next=/teams">Entrar com a Steam</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function BluestrikeTableRow({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--secondary)]/60 md:grid-cols-[1fr_auto_auto_auto] last:border-0"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-cyan-950 to-slate-900 text-xs font-black text-[var(--primary)]">
          {team.tag}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">{team.name}</span>
            <span className="shrink-0 rounded border border-[var(--primary)]/30 bg-[var(--primary)]/12 px-1.5 py-0.5 font-mono text-[10px] font-black text-[var(--primary)]">
              {formatTeamSize(team.teamSize)}
            </span>
            {team.isRecruiting && <Badge variant="open">Recrutando</Badge>}
            {!team.isActive && <Badge variant="finished">Inativo</Badge>}
          </div>
          <div className="truncate text-xs text-[var(--muted-foreground)]">
            {team.description || "Pronto para disputar torneios e montar lineup na plataforma."}
          </div>
        </div>
      </div>

      <div className="hidden text-center text-sm font-semibold text-[var(--foreground)] md:block">
        {team.members?.length ?? 0}
      </div>

      <div className="text-right text-sm font-semibold text-[var(--muted-foreground)]">
        {team.wins}V {team.losses}D
      </div>

      <div className="w-16 text-right text-sm font-black text-[var(--primary)]">
        {team.elo}
      </div>
    </Link>
  );
}

function FaceitTeamCard({ team }: { team: FaceitTeam }) {
  return (
    <a
      href={team.faceitUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full"
    >
      <div className="flex h-full flex-col rounded-2xl border border-[#FF5500]/20 bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[#FF5500]/6 p-5 transition-all hover:border-[#FF5500]/40 hover:shadow-[0_0_24px_rgba(255,85,0,0.08)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-[#FF5500]/20">
              <AvatarImage src={team.avatar ?? undefined} alt={team.name} />
              <AvatarFallback className="rounded-xl bg-[#FF5500]/12 text-sm font-black text-[#FF5500]">
                {team.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-black transition-colors group-hover:text-[#FF5500]">
                {team.name}
              </div>
              <div className="truncate text-xs font-semibold text-[#FF5500]">
                @{team.nickname || team.name}
              </div>
            </div>
          </div>

          <ExternalLink className="h-4 w-4 shrink-0 text-[#FF5500]" />
        </div>

        <div className="mt-auto flex items-center">
          <div className="flex items-center -space-x-2">
            {team.members.slice(0, 5).map((member) => (
              <Avatar
                key={member.userId}
                className="h-8 w-8 border-2 border-[var(--card)] bg-[#1b1b1b]"
              >
                <AvatarImage src={member.avatar ?? undefined} alt={member.nickname} />
                <AvatarFallback className="text-[10px] text-[#FF5500]">
                  {member.nickname.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>
    </a>
  );
}

function FaceitEmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#FF5500]/20 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF5500]/20 bg-[#FF5500]/10">
        <FaceitGlyph className="h-7 w-7" />
      </div>
      <h3 className="mb-2 text-lg font-black">
        {hasQuery ? "Nenhum time FACEIT encontrado" : "Nenhum time FACEIT conectado"}
      </h3>
      <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
        {hasQuery
          ? "Tente outro nome, nickname ou jogador para localizar um time registrado na comunidade."
          : "Quando os jogadores conectarem a conta FACEIT ao perfil, os times cadastrados vao aparecer aqui."}
      </p>
    </div>
  );
}

export default async function TeamsCatalogPage({ searchParams }: TeamsCatalogPageProps) {
  const query = await searchParams;
  const page = Math.max(1, Number.parseInt(readSearchParam(query.page) || "1", 10) || 1);
  const bluestrikeQuery = readSearchParam(query.q).trim();
  const faceitQuery = readSearchParam(query.faceitQ).trim();
  const rawSize = Number.parseInt(readSearchParam(query.size), 10);
  const sizeFilter = rawSize >= 1 && rawSize <= 5 ? rawSize : null;

  const [teamList, registeredFaceitTeamIds, currentProfile] = await Promise.all([
    listPublicTeams({ query: bluestrikeQuery, page, teamSize: sizeFilter }),
    listRegisteredFaceitTeamIds(120),
    getCurrentProfile(),
  ]);

  // O jogador pode ter um time por formato (1x1, 2x2, ...). O maior formato vira
  // o card em evidencia e os demais viram linhas compactas logo abaixo.
  const myTeams = currentProfile
    ? [...(await getTeamsForProfile(currentProfile.id))].sort((a, b) => b.teamSize - a.teamSize)
    : [];
  const primaryTeam = myTeams[0] ?? null;
  const otherTeams = myTeams.slice(1);
  const myTeamIds = new Set(myTeams.map((team) => team.id));

  const rawFaceitTeams = await getFaceitTeamsByIds(registeredFaceitTeamIds);
  const faceitTeams = filterFaceitTeams(sortFaceitTeams(rawFaceitTeams), faceitQuery);
  const recruitingTeams = bluestrikeQuery
    ? []
    : teamList.teams
        .filter((team) => team.isRecruiting && !myTeamIds.has(team.id))
        .slice(0, 2);

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-left">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Users className="h-4 w-4" />
            Times
          </div>
          <h1 className="text-4xl font-black tracking-tight">Catalogo de Times</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-6 lg:divide-x lg:divide-[var(--border)]">
          <section className="flex h-full flex-col lg:pr-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  <Shield className="h-4 w-4" />
                  BlueStrike
                </div>
                <h2 className="text-2xl font-black tracking-tight">Times internos</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Lineups oficiais da plataforma, com foco em recrutamento, torneios e descoberta rapida.
                </p>
              </div>

              <Button asChild variant="gradient" className="shrink-0">
                <Link href="/teams/create">
                  <Plus className="h-4 w-4" />
                  Criar time
                </Link>
              </Button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <div className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                {teamList.total} times ativos
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1 text-xs font-bold text-[var(--foreground)]">
                {teamList.recruitingCount} recrutando agora
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Formato
              </span>

              <Link
                href={buildTeamsHref(bluestrikeQuery, 1, faceitQuery, null)}
                aria-current={sizeFilter === null ? "true" : undefined}
                className={`rounded-md border px-2.5 py-1 text-xs font-bold transition-colors ${
                  sizeFilter === null
                    ? "border-[var(--primary)]/50 bg-[var(--primary)]/12 text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                }`}
              >
                Todos
              </Link>

              {[1, 2, 3, 4, 5].map((size) => (
                <Link
                  key={size}
                  href={buildTeamsHref(bluestrikeQuery, 1, faceitQuery, size)}
                  aria-current={sizeFilter === size ? "true" : undefined}
                  className={`rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition-colors ${
                    sizeFilter === size
                      ? "border-[var(--primary)]/50 bg-[var(--primary)]/12 text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                  }`}
                >
                  {formatTeamSize(size)}
                </Link>
              ))}
            </div>

            <form action="/teams" className="relative mb-6">
              {faceitQuery && <input type="hidden" name="faceitQ" value={faceitQuery} />}
              {sizeFilter && <input type="hidden" name="size" value={sizeFilter} />}
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]" />
              <Input
                name="q"
                defaultValue={bluestrikeQuery}
                className="h-11 pl-10 pr-24"
                placeholder="Buscar time BlueStrike por nome, tag ou descricao..."
              />
              <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2">
                Buscar
              </Button>
            </form>

            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="flex flex-col">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Shield className="h-4 w-4 text-[var(--primary)]" />
                    {myTeams.length > 1 ? "Meus times" : "Meu time"}
                  </div>

                  {myTeams.length > 0 && (
                    <Link
                      href="/teams/create"
                      className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Novo formato
                    </Link>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {primaryTeam ? (
                    <>
                      <MyTeamCard team={primaryTeam} isCaptain={primaryTeam.captainId === currentProfile?.id} />

                      {otherTeams.map((team) => (
                        <MyTeamRow
                          key={team.id}
                          team={team}
                          isCaptain={team.captainId === currentProfile?.id}
                        />
                      ))}
                    </>
                  ) : (
                    <NoTeamCard isAuthenticated={Boolean(currentProfile)} />
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                  Destaques recrutando
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  {recruitingTeams.length > 0 ? (
                    recruitingTeams.map((team) => <BluestrikeFeaturedCard key={team.id} team={team} />)
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center">
                      <Users className="mb-2 h-8 w-8 text-[var(--muted-foreground)] opacity-40" aria-hidden="true" />
                      <p className="text-sm font-bold">Nenhum time recrutando</p>
                      <p className="mt-1 max-w-xs text-xs text-[var(--muted-foreground)]">
                        Quando uma lineup abrir vaga, ela aparece aqui primeiro.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-xs text-[var(--muted-foreground)] md:grid-cols-[1fr_auto_auto_auto]">
                <div>{bluestrikeQuery ? `Resultados para "${bluestrikeQuery}"` : "Todos os times"}</div>
                <div className="hidden text-center md:block">Lineup</div>
                <div className="text-right">Record</div>
                <div className="w-16 text-right">ELO</div>
              </div>

              {teamList.teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <Shield className="mb-3 h-10 w-10 text-[var(--muted-foreground)] opacity-40" />
                  <h3 className="text-lg font-black">Nenhum time encontrado</h3>
                  <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
                    Ajuste a busca ou crie uma nova lineup para aparecer no catalogo.
                  </p>
                </div>
              ) : (
                teamList.teams.map((team) => <BluestrikeTableRow key={team.id} team={team} />)
              )}
            </div>

            {teamList.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
                <span className="text-[var(--muted-foreground)]">
                  Pagina {teamList.page} de {teamList.totalPages}
                </span>

                <div className="flex gap-2">
                  {teamList.page > 1 ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={buildTeamsHref(teamList.query, teamList.page - 1, faceitQuery, sizeFilter)}>
                        Anterior
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Anterior
                    </Button>
                  )}

                  {teamList.page < teamList.totalPages ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={buildTeamsHref(teamList.query, teamList.page + 1, faceitQuery, sizeFilter)}>
                        Proxima
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Proxima
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="flex h-full flex-col lg:pl-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#FF5500]">
                  <FaceitGlyph />
                  FACEIT
                </div>
                <h2 className="text-2xl font-black tracking-tight">Times conectados</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Lineups FACEIT, com foco em competição séria. Estude seus adversários.
                </p>
              </div>

              <Button asChild variant="orange" className="shrink-0">
                <a
                  href="https://www.faceit.com/pt-br/teams/create"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Plus className="h-4 w-4" />
                  Criar time FACEIT
                </a>
              </Button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <div className="rounded-full border border-[#FF5500]/20 bg-[#FF5500]/10 px-3 py-1 text-xs font-bold text-[#FF5500]">
                {rawFaceitTeams.length} times ativos
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1 text-xs font-bold text-[var(--foreground)]">
                atualizado a cada 30 min
              </div>
            </div>

            <form action="/teams" className="relative mb-6">
              {bluestrikeQuery && <input type="hidden" name="q" value={bluestrikeQuery} />}
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF5500]/70" />
              <Input
                name="faceitQ"
                defaultValue={faceitQuery}
                className="h-11 border-[#FF5500]/20 pl-10 pr-24 focus-visible:ring-[#FF5500]/35"
                placeholder="Buscar time FACEIT por nome, nickname ou jogador..."
              />
              <Button
                type="submit"
                size="sm"
                variant="orange"
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              >
                Buscar
              </Button>
            </form>

            {faceitTeams.length === 0 ? (
              <FaceitEmptyState hasQuery={Boolean(faceitQuery)} />
            ) : (
              <>
                <div className="mb-4 text-sm font-bold">
                  {faceitQuery
                    ? `${faceitTeams.length} resultado${faceitTeams.length !== 1 ? "s" : ""} para "${faceitQuery}"`
                    : (
                      <span className="flex items-center gap-2 text-white">
                        <Swords className="h-4 w-4" />
                        Times FACEIT cadastrados
                      </span>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {faceitTeams.map((team) => (
                    <FaceitTeamCard key={team.teamId} team={team} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
