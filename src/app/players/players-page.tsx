import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import { Input } from "@/components/ui/input";
import { getProfilePath, IN_GAME_ROLES, type UserProfile } from "@/lib/profile";
import { listPublicProfiles } from "@/lib/profiles";
import ViewToggle from "./view-toggle";

const ROLE_LABELS: Record<string, string> = Object.fromEntries(IN_GAME_ROLES.map((role) => [role.value, role.label]));

function buildHref(query: string, page: number, view: "cards" | "list") {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  if (view === "list") params.set("view", "list");
  const suffix = params.toString();
  return suffix ? `/players?${suffix}` : "/players";
}

function PlayerAvatar({ profile, className = "h-16 w-16" }: { profile: UserProfile; className?: string }) {
  const src = profile.faceitAvatar ?? profile.steamAvatarUrl ?? undefined;
  return (
    <Avatar className={`${className} border border-[var(--border)] bg-[var(--secondary)]`}>
      <AvatarImage src={src} alt={profile.steamPersonaName} />
      <AvatarFallback className="font-bold text-[var(--primary)]">{profile.steamPersonaName.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function PlayerCard({ profile, position }: { profile: UserProfile; position: number }) {
  const role = profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : "Sem função";
  const hasFaceit = profile.faceitLevel != null && profile.faceitElo != null;
  return (
    <Link href={getProfilePath(profile.publicId)} className={`group bs-panel relative flex min-h-[300px] flex-col p-5 transition-transform hover:-translate-y-0.5 ${position === 1 ? "border-[var(--primary)]" : ""}`}>
      <div className="flex items-center justify-between"><span className="rounded-md bg-[var(--secondary)] px-2 py-1 font-mono text-[10px] font-bold text-[var(--muted-foreground)]">#{position}</span><span className="text-lg text-[var(--muted-foreground)]">···</span></div>
      <div className="mt-1 flex flex-col items-center text-center">
        <PlayerAvatar profile={profile} className="h-20 w-20" />
        <h3 className="mt-3 max-w-full truncate text-lg font-semibold tracking-[-0.025em] group-hover:text-[var(--primary)]">{profile.steamPersonaName}</h3>
        <span className="mt-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">{role}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 divide-x divide-[var(--border)] border-y border-[var(--border)] py-3 text-center">
        <div><div className="text-[10px] text-[var(--muted-foreground)]">BlueStrike ELO</div><div className="mt-1 font-mono text-xl font-bold text-[var(--primary)]">{profile.elo.toLocaleString("pt-BR")}</div></div>
        <div><div className="text-[10px] text-[var(--muted-foreground)]">FACEIT Level</div><div className="mt-1 flex h-6 items-center justify-center gap-1.5 font-mono text-xl font-bold text-[var(--faceit)]">{hasFaceit ? <><FaceitSkillIcon level={profile.faceitLevel!} size={20} />{profile.faceitLevel}</> : "-"}</div></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4 text-center"><div><div className="text-[10px] text-[var(--muted-foreground)]">K/D</div><div className="mt-1 font-mono font-semibold">{profile.faceitKdRatio?.toFixed(2) ?? "-"}</div></div><div><div className="text-[10px] text-[var(--muted-foreground)]">Win rate</div><div className="mt-1 font-mono font-semibold">{profile.faceitWinRate != null ? `${profile.faceitWinRate}%` : "-"}</div></div></div>
    </Link>
  );
}

function PlayerTableRow({ profile, position }: { profile: UserProfile; position: number }) {
  const role = profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : "Sem função";
  return (
    <Link href={getProfilePath(profile.publicId)} className="grid min-w-[1060px] grid-cols-[44px_1.4fr_0.8fr_0.75fr_0.75fr_0.5fr_0.6fr_0.65fr_0.7fr_30px] items-center gap-4 border-b border-[var(--border)] px-5 py-3.5 last:border-b-0 hover:bg-[var(--accent)]/60">
      <span className="font-mono text-xs text-[var(--muted-foreground)]">{position}</span>
      <div className="flex min-w-0 items-center gap-3"><PlayerAvatar profile={profile} className="h-9 w-9" /><div className="min-w-0"><div className="truncate text-sm font-semibold">{profile.steamPersonaName}</div>{profile.faceitNickname && <div className="truncate text-[10px] text-[var(--faceit)]">@{profile.faceitNickname}</div>}</div></div>
      <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">{role}</span>
      <span className="font-mono font-bold text-[var(--primary)]">{profile.elo.toLocaleString("pt-BR")}</span>
      <span className="flex items-center gap-2 font-mono font-bold text-[var(--faceit)]">{profile.faceitLevel ? <FaceitSkillIcon level={profile.faceitLevel} size={18} /> : null}{profile.faceitLevel ?? "-"}</span>
      <span className="font-mono text-sm">{profile.faceitKdRatio?.toFixed(2) ?? "-"}</span>
      <span className="font-mono text-sm">{profile.faceitWinRate != null ? `${profile.faceitWinRate}%` : "-"}</span>
      <span className="text-sm text-[var(--muted-foreground)]">Brasil</span>
      <span className="text-xs text-[var(--muted-foreground)]">Perfil ativo</span>
      <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
    </Link>
  );
}

export default async function PlayersPage({ query, page, view }: { query: string; page: number; view: "cards" | "list" }) {
  const result = await listPublicProfiles({ query, page });
  const profiles = result.profiles;
  const featured = profiles.slice(0, 6);
  const faceitCount = profiles.filter((profile) => profile.faceitId).length;
  const maxElo = profiles.reduce((current, profile) => Math.max(current, profile.elo), 0);

  return (
    <div className="bs-page pb-20">
      <div className="bs-page-shell">
        <header className="relative grid gap-10 overflow-hidden pb-12 pt-14 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:pb-14 lg:pt-16">
          <div className="relative z-10">
            <div className="bs-kicker mb-3">Players</div>
            <h1 className="text-5xl font-bold leading-[0.98] tracking-[-0.04em] md:text-6xl">Hub de Jogadores</h1>
            <p className="mt-4 max-w-[62ch] text-lg leading-7 text-[var(--muted-foreground)]">Encontre, avalie e acompanhe jogadores do cenário competitivo brasileiro.</p>
            <div className="mt-8 grid max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="bs-panel flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]"><Users className="h-5 w-5" /></div><div><div className="font-mono text-xl font-bold">{result.total.toLocaleString("pt-BR")}</div><div className="text-[11px] text-[var(--muted-foreground)]">Jogadores ativos</div></div></div>
              <div className="bs-panel flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]"><Sparkles className="h-5 w-5" /></div><div><div className="font-mono text-xl font-bold">{faceitCount}</div><div className="text-[11px] text-[var(--muted-foreground)]">FACEIT nesta página</div></div></div>
              <div className="bs-panel flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]"><Trophy className="h-5 w-5" /></div><div><div className="font-mono text-xl font-bold text-[var(--primary)]">{maxElo.toLocaleString("pt-BR")}</div><div className="text-[11px] text-[var(--muted-foreground)]">Maior ELO na página</div></div></div>
            </div>
          </div>
          <div className="relative min-h-[230px] overflow-hidden rounded-2xl bg-[var(--accent)]">
            <div className="bs-brand-arc -right-28 -top-28 opacity-90" />
            <div className="absolute inset-y-0 right-0 flex w-[68%] items-center px-8">
              <div className="bs-panel relative z-10 p-6"><Users className="h-7 w-7 text-[var(--primary)]" /><h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">Conecte-se ao cenário</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Complete seu perfil para ser encontrado por times e organizadores.</p><Link href="/profile" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">Criar perfil <ArrowRight className="h-4 w-4" /></Link></div>
            </div>
          </div>
        </header>

        <div className="bs-panel mb-10 flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <form action="/players" className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" /><Input name="q" defaultValue={result.query} className="border-transparent bg-[var(--background)] pl-10" placeholder="Buscar jogador por nickname ou nome real..." autoComplete="off" />{view === "list" && <input type="hidden" name="view" value="list" />}</form>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{["Função: Todas", "Função secundária", "Faixa de ELO", "FACEIT Level"].map((label) => <button type="button" key={label} className="h-10 rounded-[10px] border border-[var(--border)] px-3 text-left text-xs text-[var(--muted-foreground)]">{label}</button>)}</div>
          <Suspense><ViewToggle current={view} /></Suspense>
        </div>

        {featured.length > 0 && <section><div className="mb-5 flex items-end justify-between"><div><h2 className="text-2xl font-bold tracking-[-0.03em]">Jogadores em destaque</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Ordenados pelo BlueStrike ELO.</p></div></div><div className="grid grid-flow-dense gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{featured.map((profile, index) => <PlayerCard key={profile.id} profile={profile} position={(result.page - 1) * result.pageSize + index + 1} />)}</div></section>}

        <section className="pt-12"><div className="mb-5 flex items-end justify-between"><div><h2 className="text-2xl font-bold tracking-[-0.03em]">Todos os jogadores</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{result.total.toLocaleString("pt-BR")} perfis encontrados</p></div></div>{profiles.length ? <div className="bs-panel bs-table-scroll"><div className="grid min-w-[1060px] grid-cols-[44px_1.4fr_0.8fr_0.75fr_0.75fr_0.5fr_0.6fr_0.65fr_0.7fr_30px] gap-4 border-b border-[var(--border)] bg-[var(--secondary)]/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]"><span>#</span><span>Jogador</span><span>Função</span><span>BlueStrike ELO</span><span>FACEIT Level</span><span>K/D</span><span>Win rate</span><span>País</span><span>Atividade</span><span /></div>{profiles.map((profile, index) => <PlayerTableRow key={profile.id} profile={profile} position={(result.page - 1) * result.pageSize + index + 1} />)}</div> : <div className="bs-panel p-16 text-center"><Users className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" /><h3 className="mt-4 font-semibold">Nenhum jogador encontrado</h3></div>}</section>

        {result.totalPages > 1 && <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-[var(--muted-foreground)]">Página {result.page} de {result.totalPages} | {result.total} jogadores</span><div className="flex gap-2">{result.page > 1 && <Button asChild variant="outline" size="sm"><Link href={buildHref(result.query, result.page - 1, view)}>Anterior</Link></Button>}{result.page < result.totalPages && <Button asChild variant="outline" size="sm"><Link href={buildHref(result.query, result.page + 1, view)}>Próxima</Link></Button>}</div></div>}
      </div>
    </div>
  );
}
