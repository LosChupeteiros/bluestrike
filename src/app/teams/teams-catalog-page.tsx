import Link from "next/link";
import { ArrowRight, Crown, ExternalLink, KeyRound, Plus, Shield, Sparkles, Swords, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveSearchInput } from "@/components/ui/live-filters";
import { getFaceitTeamsByIds, type FaceitTeam } from "@/lib/faceit";
import { listRegisteredFaceitTeamIds } from "@/lib/profiles";
import { getCurrentProfile } from "@/lib/profiles";
import { listPublicTeams, getTeamsForProfile } from "@/lib/teams";
import { getTeamMode, TEAM_MODE_LIST } from "@/lib/team-modes";
import type { Team } from "@/types";

interface TeamsCatalogPageProps {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    faceitQ?: string | string[];
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

function buildTeamsHref(query: string, page: number, faceitQuery: string) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  if (faceitQuery) params.set("faceitQ", faceitQuery);

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
        <div className="truncate text-sm font-bold">{team.name}</div>
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

function TeamModeChip({ team }: { team: Team }) {
  const mode = getTeamMode(team.teamMode);
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--primary)]/25 bg-[var(--primary)]/10 px-1.5 py-0.5 font-mono text-[10px] font-black leading-none text-[var(--primary)]">
      {mode.label}
    </span>
  );
}

/** Vagas do elenco como slots — leitura rápida de quem já fechou a line. */
function RosterSlots({ team }: { team: Team }) {
  const mode = getTeamMode(team.teamMode);
  const filled = team.members?.length ?? 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: mode.maxMembers }).map((_, index) => (
          <span
            key={index}
            className={
              index < filled
                ? index < mode.playersPerTeam
                  ? "h-1.5 w-4 rounded-full bg-[var(--primary)]"
                  : "h-1.5 w-4 rounded-full bg-[var(--primary)]/40"
                : "h-1.5 w-4 rounded-full bg-[var(--border)]"
            }
          />
        ))}
      </div>
      <span className="font-mono text-[10px] font-bold text-[var(--muted-foreground)]">
        {filled}/{mode.maxMembers}
      </span>
    </div>
  );
}

function MyTeamCard({ team, isCaptain }: { team: Team; isCaptain: boolean }) {
  const mode = getTeamMode(team.teamMode);
  const filled = team.members?.length ?? 0;
  const readyToCompete = filled >= mode.playersPerTeam;

  return (
    <Link className="group block" href={`/teams/${team.slug}`}>
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/[0.04]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-cyan-950 to-slate-900 text-xs font-black text-[var(--primary)]">
          {team.tag}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-black transition-colors group-hover:text-[var(--primary)]">
              {team.name}
            </span>
            <TeamModeChip team={team} />
            {isCaptain && (
              <Crown className="h-3.5 w-3.5 shrink-0 text-[#f5c842]" aria-label="Você é o capitão" />
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <RosterSlots team={team} />
            <span
              className={
                readyToCompete
                  ? "text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400"
                  : "text-[10px] font-bold uppercase tracking-[0.12em] text-orange-400"
              }
            >
              {readyToCompete
                ? "Pronto para competir"
                : `Faltam ${mode.playersPerTeam - filled}`}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-base font-black text-[var(--primary)]">{team.elo}</div>
          <div className="text-[10px] text-[var(--muted-foreground)]">{team.wins}V {team.losses}D</div>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" />
      </div>
    </Link>
  );
}

function MyTeamsPanel({
  teams,
  currentProfileId,
}: {
  teams: Team[];
  currentProfileId: string | null;
}) {
  const usedModes = new Set(teams.map((team) => team.teamMode));
  const missingModes = TEAM_MODE_LIST.filter((mode) => !usedModes.has(mode.id));

  return (
    <section className="bg-[var(--background)] p-5 sm:p-7">
      <div className="flex min-h-28 items-start justify-between gap-4">
        <div>
          <p className="bs-eyebrow"><Swords className="h-4 w-4" /> Minha área</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">Meus times</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Uma line por modalidade: 1x1, 2x2, 3x3, 4x4 e 5x5 correm em paralelo.
          </p>
        </div>
        {teams.length > 0 && (
          <span className="shrink-0 rounded-full border border-[var(--primary)]/25 bg-[var(--primary)]/8 px-3 py-1.5 text-xs font-black text-[var(--primary)]">
            {teams.length} {teams.length === 1 ? "time" : "times"}
          </span>
        )}
      </div>

      {!currentProfileId ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--primary)]/20 px-6 py-14 text-center">
          <KeyRound className="mx-auto h-9 w-9 text-[var(--primary)]/45" />
          <h3 className="mt-4 font-black">Entre para ver seus times</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--muted-foreground)]">
            Faça login com a Steam para criar lines, receber convites e inscrever seu time nos campeonatos.
          </p>
          <Button asChild className="mt-5" variant="gradient">
            <Link href="/auth/login?next=/teams">Entrar com a Steam</Link>
          </Button>
        </div>
      ) : teams.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--primary)]/20 px-6 py-14 text-center">
          <Shield className="mx-auto h-9 w-9 text-[var(--primary)]/45" />
          <h3 className="mt-4 font-black">Você ainda não tem time</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--muted-foreground)]">
            Crie a sua line ou entre em uma equipe com um código de convite para disputar campeonatos.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="gradient">
              <Link href="/teams/create"><Plus className="h-4 w-4" /> Criar time</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {teams.map((team) => (
              <MyTeamCard
                key={team.id}
                team={team}
                isCaptain={team.captainId === currentProfileId}
              />
            ))}
          </div>

          {missingModes.length > 0 && (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Modalidades sem time
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {missingModes.map((mode) => (
                  <Link
                    key={mode.id}
                    href={`/teams/create?mode=${mode.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-black transition-colors hover:border-[var(--primary)]/45 hover:text-[var(--primary)]"
                  >
                    <Plus className="h-3 w-3" />
                    {mode.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
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

  const currentProfile = await getCurrentProfile();

  const [teamList, registeredFaceitTeamIds, myTeams] = await Promise.all([
    listPublicTeams({ query: bluestrikeQuery, page }),
    listRegisteredFaceitTeamIds(120),
    currentProfile ? getTeamsForProfile(currentProfile.id) : Promise.resolve([]),
  ]);

  const sortedMyTeams = [...myTeams].sort((a, b) => {
    const modeDelta =
      TEAM_MODE_LIST.findIndex((m) => m.id === a.teamMode) -
      TEAM_MODE_LIST.findIndex((m) => m.id === b.teamMode);
    if (modeDelta !== 0) return modeDelta;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  const rawFaceitTeams = await getFaceitTeamsByIds(registeredFaceitTeamIds);
  const faceitTeams = filterFaceitTeams(sortFaceitTeams(rawFaceitTeams), faceitQuery);
  const recruitingTeams = bluestrikeQuery
    ? []
    : teamList.teams.filter((team) => team.isRecruiting).slice(0, 4);

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell">
        <header className="grid gap-8 border-b border-[var(--border)] pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="bs-eyebrow"><Users className="h-4 w-4" /> Times</p>
            <h1 className="bs-display mt-4">Catálogo de <span className="text-[var(--primary)]">times</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
              Descubra lineups, compare força competitiva e encontre a equipe certa para o seu próximo campeonato.
            </p>
          </div>
          <div className="bs-inset grid gap-3 p-3 sm:grid-cols-2 lg:col-span-5">
            <div className="bs-bento-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[var(--primary)]"><Shield className="h-5 w-5" /></span>
              <strong className="mt-6 block font-mono text-3xl">{teamList.total}</strong>
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Times ativos</span>
            </div>
            <div className="bs-bento-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/18 bg-emerald-500/8 text-emerald-500"><Users className="h-5 w-5" /></span>
              <strong className="mt-6 block font-mono text-3xl">{teamList.recruitingCount}</strong>
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Recrutando agora</span>
            </div>
          </div>
        </header>

        <section className="py-8">
          <div className="bs-bento-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <LiveSearchInput
              param="q"
              initialValue={bluestrikeQuery}
              label="Buscar time BlueStrike"
              placeholder="Buscar time, tag ou jogador..."
              className="flex-1"
            />
            <div className="flex rounded-xl border border-[var(--border)] bg-black/15 p-1 text-xs font-black">
              <a className="rounded-lg bg-[var(--primary)]/15 px-4 py-2 text-[var(--primary)]" href="#bluestrike">BlueStrike</a>
              <a className="rounded-lg px-4 py-2 text-[#ff7a00] hover:bg-[#ff7a00]/10" href="#faceit">FACEIT</a>
            </div>
            <Button asChild className="h-12" variant="gradient"><Link href="/teams/create"><Plus className="h-4 w-4" /> Criar time</Link></Button>
          </div>
        </section>

        {/* Meia tela para os meus times, meia para quem está recrutando */}
        <div
          className="mb-10 grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] lg:grid-cols-2 lg:gap-px"
          data-reveal
        >
          <MyTeamsPanel teams={sortedMyTeams} currentProfileId={currentProfile?.id ?? null} />

          <section className="border-t border-[var(--border)] bg-[var(--background)] p-5 sm:p-7 lg:border-l lg:border-t-0" id="recrutando">
            <div className="flex min-h-28 items-start justify-between gap-4">
              <div>
                <p className="bs-eyebrow"><Sparkles className="h-4 w-4" /> Recrutando</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Times com vaga aberta</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
                  Lines que ainda não fecharam o elenco e estão aceitando reforço agora.
                </p>
              </div>
              {recruitingTeams.length > 0 && (
                <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1.5 text-xs font-black text-emerald-400">
                  {teamList.recruitingCount} abertos
                </span>
              )}
            </div>

            {recruitingTeams.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] px-6 py-14 text-center">
                <Users className="mx-auto h-9 w-9 text-[var(--muted-foreground)]/50" />
                <h3 className="mt-4 font-black">Nenhuma vaga aberta agora</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--muted-foreground)]">
                  Todos os times ativos estão com o elenco fechado. Crie o seu e chame a sua line.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {recruitingTeams.map((team) => <BluestrikeFeaturedCard key={team.id} team={team} />)}
              </div>
            )}
          </section>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] lg:grid-cols-2 lg:gap-px" data-reveal>
          <section className="bg-[var(--background)] p-5 sm:p-7" id="bluestrike">
            <div className="flex min-h-28 items-start justify-between gap-4">
              <div><p className="bs-eyebrow"><Shield className="h-4 w-4" /> BlueStrike</p><h2 className="mt-3 text-2xl font-black tracking-tight">Times da plataforma</h2><p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">Lineups, retrospecto e ELO construídos nas competições BlueStrike.</p></div>
              <span className="rounded-full border border-[var(--primary)]/25 bg-[var(--primary)]/8 px-3 py-1.5 text-xs font-black text-[var(--primary)]">{teamList.total} ativos</span>
            </div>
            <div className="mb-6 mt-5">
              <LiveSearchInput
                param="q"
                initialValue={bluestrikeQuery}
                label="Buscar time BlueStrike"
                placeholder="Buscar time BlueStrike..."
              />
            </div>
            {teamList.teams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--primary)]/20 px-6 py-16 text-center"><Shield className="mx-auto h-9 w-9 text-[var(--primary)]/45" /><h3 className="mt-4 font-black">Nenhum time encontrado</h3></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{teamList.teams.map((team) => <BluestrikeFeaturedCard key={team.id} team={team} />)}</div>
            )}
            {teamList.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-5 text-xs"><span className="text-[var(--muted-foreground)]">Página {teamList.page} de {teamList.totalPages}</span><div className="flex gap-2">{teamList.page > 1 ? <Button asChild size="sm" variant="outline"><Link href={buildTeamsHref(teamList.query, teamList.page - 1, faceitQuery)}>Anterior</Link></Button> : <Button disabled size="sm" variant="outline">Anterior</Button>}{teamList.page < teamList.totalPages ? <Button asChild size="sm" variant="outline"><Link href={buildTeamsHref(teamList.query, teamList.page + 1, faceitQuery)}>Próxima</Link></Button> : <Button disabled size="sm" variant="outline">Próxima</Button>}</div></div>
            )}
          </section>

          <section className="border-t border-[var(--border)] bg-[var(--background)] p-5 sm:p-7 lg:border-l lg:border-t-0" id="faceit">
            <div className="flex min-h-28 items-start justify-between gap-4">
              <div><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff7a00]"><FaceitGlyph /> FACEIT</p><h2 className="mt-3 text-2xl font-black tracking-tight">Times conectados</h2><p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">Lineups externas vinculadas pelos jogadores da comunidade.</p></div>
              <span className="rounded-full border border-[#ff7a00]/25 bg-[#ff7a00]/8 px-3 py-1.5 text-xs font-black text-[#ff7a00]">{faceitTeams.length} conectados</span>
            </div>
            <div className="mb-6 mt-5">
              <LiveSearchInput
                param="faceitQ"
                initialValue={faceitQuery}
                label="Buscar time FACEIT"
                placeholder="Buscar time FACEIT..."
              />
            </div>
            {faceitTeams.length === 0 ? <FaceitEmptyState hasQuery={Boolean(faceitQuery)} /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{faceitTeams.map((team) => <FaceitTeamCard key={team.teamId} team={team} />)}</div>}
            <Button asChild className="mt-5 w-full" variant="outline"><a href="https://www.faceit.com/pt-br/teams/create" rel="noopener noreferrer" target="_blank"><ExternalLink className="h-4 w-4" /> Criar time na FACEIT</a></Button>
          </section>
        </div>
      </div>
    </div>
  );
}
