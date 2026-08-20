import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFaceitTeamsByIds, type FaceitTeam } from "@/lib/faceit";
import { listRegisteredFaceitTeamIds } from "@/lib/profiles";
import { listPublicTeams } from "@/lib/teams";
import type { Team } from "@/types";

interface TeamsCatalogPageProps {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    faceitQ?: string | string[];
    source?: string | string[];
  }>;
}

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function teamHref(query: string, page: number, source: "bluestrike" | "faceit") {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  if (source === "faceit") params.set("source", "faceit");
  const suffix = params.toString();
  return suffix ? `/teams?${suffix}` : "/teams";
}

function TeamLogo({ team, size = "md" }: { team: Team; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16 text-base" : "h-11 w-11 text-xs";
  if (team.logoUrl) {
    return <Avatar className={`${box} rounded-xl border border-[var(--border)]`}><AvatarImage src={team.logoUrl} alt={`Logo ${team.name}`} /><AvatarFallback>{team.tag}</AvatarFallback></Avatar>;
  }
  return <div className={`flex ${box} shrink-0 items-center justify-center rounded-xl bg-[var(--brand-navy)] font-black text-[var(--brand-cyan)]`}>{team.tag}</div>;
}

function LineupAvatars({ team }: { team: Team }) {
  const members = team.members ?? [];
  return (
    <div className="flex items-center -space-x-2">
      {members.slice(0, 5).map((member) => {
        const name = member.profile?.steamPersonaName ?? "Jogador";
        return (
          <Avatar key={member.id} className="h-8 w-8 border-2 border-white bg-[var(--secondary)]">
            <AvatarImage src={member.profile?.steamAvatarUrl ?? undefined} alt={name} />
            <AvatarFallback className="text-[10px]">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        );
      })}
      {members.length === 0 && <span className="text-xs text-[var(--muted-foreground)]">Lineup em formação</span>}
    </div>
  );
}

function FeaturedTeam({ team }: { team: Team }) {
  return (
    <Link href={`/teams/${team.slug}`} className="group bs-panel flex min-h-[170px] flex-col justify-between p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <TeamLogo team={team} size="lg" />
          <div className="min-w-0"><div className="text-xs font-bold text-[var(--primary)]">{team.tag}</div><h3 className="truncate text-lg font-semibold">{team.name}</h3><p className="mt-1 text-sm text-[var(--muted-foreground)]">ELO médio <span className="font-mono text-[var(--foreground)]">{team.elo.toLocaleString("pt-BR")}</span></p></div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Recrutando</span>
      </div>
      <div className="mt-5 flex items-center justify-between"><LineupAvatars team={team} /><ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--primary)]" /></div>
    </Link>
  );
}

function TeamRow({ team, position }: { team: Team; position: number }) {
  return (
    <Link href={`/teams/${team.slug}`} className="grid min-w-[980px] grid-cols-[54px_1.4fr_1.15fr_1fr_0.55fr_0.75fr_32px] items-center gap-4 border-b border-[var(--border)] px-5 py-4 last:border-b-0 hover:bg-[var(--accent)]/60">
      <span className="font-mono text-sm text-[var(--muted-foreground)]">{position}</span>
      <div className="flex min-w-0 items-center gap-3"><TeamLogo team={team} /><div className="min-w-0"><div className="text-[11px] font-bold text-[var(--primary)]">{team.tag}</div><div className="truncate font-semibold">{team.name}</div></div></div>
      <LineupAvatars team={team} />
      <div>
        <div className="flex gap-1.5" aria-label="Histórico recente ainda não disponível">
          {Array.from({ length: 10 }).map((_, index) => <span key={index} className="h-5 w-5 rounded-full border border-[var(--border)] bg-[var(--secondary)]" />)}
        </div>
        <span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{team.wins}V {team.losses}D no total</span>
      </div>
      <span className="font-mono font-bold text-[var(--primary)]">{team.elo.toLocaleString("pt-BR")}</span>
      <span className={team.isRecruiting ? "w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"}>{team.isRecruiting ? "Recrutando" : team.isActive ? "Ativo" : "Inativo"}</span>
      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
    </Link>
  );
}

function FaceitTeamCard({ team }: { team: FaceitTeam }) {
  return (
    <a href={team.faceitUrl || "#"} target="_blank" rel="noopener noreferrer" className="group bs-panel flex min-h-[150px] flex-col justify-between p-5 hover:border-orange-200">
      <div className="flex items-start gap-3"><Avatar className="h-12 w-12 rounded-xl border border-orange-200"><AvatarImage src={team.avatar ?? undefined} alt={team.name} /><AvatarFallback className="rounded-xl bg-orange-50 text-orange-700">{team.name.slice(0, 1)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><h3 className="truncate font-semibold group-hover:text-[var(--faceit)]">{team.name}</h3><p className="text-xs font-medium text-[var(--faceit)]">@{team.nickname || team.name}</p></div><ExternalLink className="h-4 w-4 text-[var(--faceit)]" /></div>
      <div className="mt-5 flex items-center justify-between"><div className="flex -space-x-2">{team.members.slice(0, 5).map((member) => <Avatar key={member.userId} className="h-8 w-8 border-2 border-white"><AvatarImage src={member.avatar ?? undefined} alt={member.nickname} /><AvatarFallback>{member.nickname.slice(0, 1)}</AvatarFallback></Avatar>)}</div><span className="text-xs text-[var(--muted-foreground)]">{team.members.length} jogadores</span></div>
    </a>
  );
}

export default async function TeamsCatalogPage({ searchParams }: TeamsCatalogPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(readParam(params.page) || "1", 10) || 1);
  const source = readParam(params.source) === "faceit" ? "faceit" : "bluestrike";
  const query = readParam(source === "faceit" ? params.faceitQ : params.q).trim();

  const [teamList, faceitIds] = await Promise.all([
    listPublicTeams({ query: source === "bluestrike" ? query : "", page }),
    listRegisteredFaceitTeamIds(120),
  ]);
  const allFaceit = await getFaceitTeamsByIds(faceitIds);
  const faceitTeams = allFaceit.filter((team) => {
    const q = normalize(query);
    return !q || [team.name, team.nickname, ...team.members.map((m) => m.nickname)].some((value) => normalize(value).includes(q));
  });
  const recruiting = teamList.teams.filter((team) => team.isRecruiting).slice(0, 4);

  return (
    <div className="bs-page pb-20">
      <div className="bs-page-shell">
        <header className="grid gap-8 pb-10 pt-14 lg:grid-cols-[1fr_auto] lg:items-end lg:pb-12 lg:pt-16">
          <div><div className="bs-kicker mb-3">Times</div><h1 className="text-5xl font-bold leading-[0.98] tracking-[-0.04em] md:text-6xl">Catálogo de Times</h1><p className="mt-4 max-w-[62ch] text-lg leading-7 text-[var(--muted-foreground)]">Encontre, compare e acompanhe as equipes de CS2 da comunidade BlueStrike.</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bs-panel flex min-w-[210px] items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]"><ShieldCheck className="h-5 w-5" /></div><div><div className="font-mono text-2xl font-bold">{teamList.total.toLocaleString("pt-BR")}</div><div className="text-xs text-[var(--muted-foreground)]">Times cadastrados</div></div></div>
            <div className="bs-panel flex min-w-[210px] items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]"><Users className="h-5 w-5" /></div><div><div className="font-mono text-2xl font-bold">{teamList.recruitingCount.toLocaleString("pt-BR")}</div><div className="text-xs text-[var(--muted-foreground)]">Recrutando agora</div></div></div>
          </div>
        </header>

        <form action="/teams" className="bs-panel flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <input type="hidden" name="source" value={source} />
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" /><Input name={source === "faceit" ? "faceitQ" : "q"} defaultValue={query} className="border-transparent bg-[var(--background)] pl-10" placeholder="Buscar time, tag ou jogador..." /></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["Jogo: CS2", "Região: Brasil", "ELO: Qualquer", "Status: Todos"].map((label) => <button key={label} type="button" className="h-10 rounded-[10px] border border-[var(--border)] px-3 text-left text-xs text-[var(--muted-foreground)]">{label}</button>)}
          </div>
          <Button type="submit" variant="outline" size="sm"><SlidersHorizontal className="h-4 w-4" /> Filtrar</Button>
          <div className="flex h-10 overflow-hidden rounded-[10px] border border-[var(--border)] bg-white p-1">
            <Link href={teamHref("", 1, "bluestrike")} className={`flex items-center rounded-md px-4 text-xs font-semibold ${source === "bluestrike" ? "bg-[var(--accent)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>BlueStrike</Link>
            <Link href={teamHref("", 1, "faceit")} className={`flex items-center rounded-md px-4 text-xs font-semibold ${source === "faceit" ? "bg-orange-50 text-[var(--faceit)]" : "text-[var(--muted-foreground)]"}`}>FACEIT</Link>
          </div>
        </form>

        {source === "bluestrike" ? (
          <>
            {recruiting.length > 0 && <section className="pt-10"><div className="mb-5 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><h2 className="text-2xl font-bold tracking-[-0.03em]">Times em destaque</h2><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-700">Recrutando</span></div><Link href="/teams?q=" className="text-sm font-semibold text-[var(--primary)] hover:underline">Ver todos recrutando</Link></div><div className="grid grid-flow-dense gap-4 sm:grid-cols-2 lg:grid-cols-4">{recruiting.map((team) => <FeaturedTeam key={team.id} team={team} />)}</div></section>}
            <section className="pt-12"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold tracking-[-0.03em]">Todos os times</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{teamList.total.toLocaleString("pt-BR")} resultados</p></div><Link href="/teams/create"><Button><Plus className="h-4 w-4" /> Criar time</Button></Link></div><div className="bs-panel bs-table-scroll"><div className="grid min-w-[980px] grid-cols-[54px_1.4fr_1.15fr_1fr_0.55fr_0.75fr_32px] gap-4 border-b border-[var(--border)] bg-[var(--secondary)]/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]"><span>#</span><span>Time</span><span>Jogadores</span><span>Retrospecto</span><span>ELO médio</span><span>Status</span><span /></div>{teamList.teams.length ? teamList.teams.map((team, index) => <TeamRow key={team.id} team={team} position={(teamList.page - 1) * 12 + index + 1} />) : <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">Nenhum time encontrado.</div>}</div></section>
            {teamList.totalPages > 1 && <div className="mt-5 flex items-center justify-between"><span className="text-sm text-[var(--muted-foreground)]">Página {teamList.page} de {teamList.totalPages}</span><div className="flex gap-2">{teamList.page > 1 && <Button asChild variant="outline" size="sm"><Link href={teamHref(teamList.query, teamList.page - 1, source)}>Anterior</Link></Button>}{teamList.page < teamList.totalPages && <Button asChild variant="outline" size="sm"><Link href={teamHref(teamList.query, teamList.page + 1, source)}>Próxima</Link></Button>}</div></div>}
          </>
        ) : (
          <section className="pt-10"><div className="mb-5 flex items-end justify-between"><div><h2 className="text-2xl font-bold tracking-[-0.03em]">Times FACEIT conectados</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{faceitTeams.length} resultados da comunidade.</p></div><a href="https://www.faceit.com/pt-br/teams/create" target="_blank" rel="noopener noreferrer"><Button variant="orange"><Plus className="h-4 w-4" /> Criar time FACEIT</Button></a></div>{faceitTeams.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{faceitTeams.map((team) => <FaceitTeamCard key={team.teamId} team={team} />)}</div> : <div className="bs-panel p-12 text-center text-sm text-[var(--muted-foreground)]">Nenhum time FACEIT encontrado.</div>}</section>
        )}
      </div>
    </div>
  );
}
