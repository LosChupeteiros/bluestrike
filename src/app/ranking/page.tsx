import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight, Crown, Flame, Medal, Target, TrendingUp, Users, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import { getProfilePath, IN_GAME_ROLES, type UserProfile } from "@/lib/profile";
import { listFaceitRanking, listPublicProfiles, type FaceitRankingEntry } from "@/lib/profiles";

export const metadata: Metadata = { title: "Ranking Global" };
export const revalidate = 1800;

const ROLE_LABELS = Object.fromEntries(IN_GAME_ROLES.map((role) => [role.value, role.label]));
const PAGE_SIZE = 20;

interface RankingPageProps {
  searchParams: Promise<{ bsPage?: string | string[]; faceitPage?: string | string[] }>;
}

function pageParam(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  return Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);
}

function rankingHref(bsPage: number, faceitPage: number) {
  const params = new URLSearchParams();
  if (bsPage > 1) params.set("bsPage", String(bsPage));
  if (faceitPage > 1) params.set("faceitPage", String(faceitPage));
  return params.size ? `/ranking?${params}` : "/ranking";
}

function RankingPagination({ page, totalPages, previousHref, nextHref }: { page: number; totalPages: number; previousHref: string; nextHref: string }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs">
      <span className="text-[var(--muted-foreground)]">Página {page} de {totalPages}</span>
      <div className="flex items-center gap-2">
        {page > 1 ? <Link aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/45 hover:text-[var(--primary)]" href={previousHref}><ChevronLeft className="h-4 w-4" /></Link> : <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] opacity-35"><ChevronLeft className="h-4 w-4" /></span>}
        {page < totalPages ? <Link aria-label="Próxima página" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/45 hover:text-[var(--primary)]" href={nextHref}><ChevronRight className="h-4 w-4" /></Link> : <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] opacity-35"><ChevronRight className="h-4 w-4" /></span>}
      </div>
    </div>
  );
}

function PositionBadge({ position }: { position: number }) {
  if (position === 1) return <span className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-500/35 bg-yellow-500/10"><Crown className="h-4 w-4 text-yellow-400" /></span>;
  if (position === 2) return <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-400/30 bg-slate-400/10"><Medal className="h-4 w-4 text-slate-300" /></span>;
  if (position === 3) return <span className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-700/35 bg-orange-700/10"><Medal className="h-4 w-4 text-orange-500" /></span>;
  return <span className="flex h-8 w-8 items-center justify-center font-mono text-xs font-black text-[var(--muted-foreground)]">#{position}</span>;
}

function ProfileAvatar({ profile, size = "h-12 w-12" }: { profile: UserProfile; size?: string }) {
  return (
    <Avatar className={`${size} border border-white/10 bg-[var(--secondary)]`}>
      <AvatarImage alt={profile.steamPersonaName} src={profile.faceitAvatar ?? profile.steamAvatarUrl ?? undefined} />
      <AvatarFallback className="font-black text-[var(--primary)]">{profile.steamPersonaName.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function BlueStrikePodium({ players }: { players: UserProfile[] }) {
  const top = players.slice(0, 3);
  if (top.length === 0) return null;
  const ordered = top.length === 3 ? [top[1], top[0], top[2]] : top;

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {ordered.map((profile) => {
        const actualPosition = top.findIndex((entry) => entry.id === profile.id) + 1;
        return (
          <Link
            className={`group relative flex min-h-[228px] flex-col justify-center overflow-hidden rounded-xl border bg-[var(--card)] p-5 text-center transition hover:-translate-y-1 ${actualPosition === 1 ? "border-[var(--primary)]/60 sm:-translate-y-2" : "border-[var(--border)]"}`}
            href={getProfilePath(profile.publicId)}
            key={profile.id}
          >
            <span className="absolute -left-1 top-1 font-mono text-7xl font-black text-white/[0.025]">{actualPosition}</span>
            <div className="relative mx-auto mb-3 w-fit"><ProfileAvatar profile={profile} size={actualPosition === 1 ? "h-16 w-16" : "h-14 w-14"} /><span className="absolute -bottom-2 -right-2"><PositionBadge position={actualPosition} /></span></div>
            <strong className="block truncate text-sm group-hover:text-[var(--primary)]">{profile.steamPersonaName}</strong>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.15em] text-[var(--muted-foreground)]">BlueStrike ELO</span>
            <span className="mt-1 block font-mono text-xl font-black text-[var(--primary)]">{profile.elo.toLocaleString("pt-BR")}</span>
            {profile.faceitElo != null && <span className="mt-2 block font-mono text-xs font-bold text-[#ff7a00]">FACEIT {profile.faceitElo.toLocaleString("pt-BR")}</span>}
          </Link>
        );
      })}
    </div>
  );
}

function BlueStrikeTable({ players, firstPosition }: { players: UserProfile[]; firstPosition: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="hidden grid-cols-[48px_1.5fr_.8fr_.8fr_.7fr_.55fr] gap-3 border-b border-[var(--border)] px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--muted-foreground)] sm:grid">
        <span>Pos.</span><span>Jogador</span><span>Função</span><span>BlueStrike</span><span>FACEIT</span><span>K/D</span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {players.map((profile, index) => (
          <Link className="group grid grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-3.5 hover:bg-white/[0.025] sm:grid-cols-[48px_1.5fr_.8fr_.8fr_.7fr_.55fr]" href={getProfilePath(profile.publicId)} key={profile.id}>
            <PositionBadge position={firstPosition + index} />
            <span className="flex min-w-0 items-center gap-2.5"><ProfileAvatar profile={profile} size="h-9 w-9" /><strong className="truncate text-sm group-hover:text-[var(--primary)]">{profile.steamPersonaName}</strong></span>
            <span className="hidden text-xs text-[var(--muted-foreground)] sm:block">{profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : "Flex"}</span>
            <span className="hidden font-mono text-sm font-black text-[var(--primary)] sm:block">{profile.elo.toLocaleString("pt-BR")}</span>
            <span className="hidden font-mono text-sm font-black text-[#ff7a00] sm:block">{profile.faceitElo?.toLocaleString("pt-BR") ?? "—"}</span>
            <span className="font-mono text-xs font-bold">{profile.faceitKdRatio?.toFixed(2) ?? "—"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BlueStrikeRanking({ podiumPlayers, players, total, page, totalPages, faceitPage }: { podiumPlayers: UserProfile[]; players: UserProfile[]; total: number; page: number; totalPages: number; faceitPage: number }) {
  return (
    <section className="h-full">
      <div className="mb-6 flex min-h-[8.5rem] items-start justify-between gap-4">
        <div><p className="bs-eyebrow"><TrendingUp className="h-4 w-4" /> BlueStrike ELO</p><h2 className="mt-2 text-2xl font-black tracking-tight">Ranking interno</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Performance registrada nas competições da plataforma.</p></div>
        <span className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-3 py-1.5 text-xs font-black text-[var(--primary)]">{total} ativos</span>
      </div>
      <BlueStrikePodium players={podiumPlayers} />
      <BlueStrikeTable firstPosition={(page - 1) * PAGE_SIZE + 1} players={players} />
      <RankingPagination page={page} totalPages={totalPages} previousHref={rankingHref(page - 1, faceitPage)} nextHref={rankingHref(page + 1, faceitPage)} />
    </section>
  );
}

function FaceitAvatar({ entry, size = "h-10 w-10" }: { entry: FaceitRankingEntry; size?: string }) {
  return (
    <div className="relative shrink-0">
      <Avatar className={`${size} border border-[#ff7a00]/25 bg-[#ff7a00]/10`}>
        <AvatarImage alt={entry.faceitNickname} src={entry.faceitAvatar ?? entry.avatar ?? undefined} />
        <AvatarFallback className="font-black text-[#ff7a00]">{entry.faceitNickname.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="absolute -bottom-1.5 -right-1.5"><FaceitSkillIcon level={entry.faceitLevel} size={18} /></span>
    </div>
  );
}

function FaceitPodium({ players }: { players: FaceitRankingEntry[] }) {
  const top = players.slice(0, 3);
  if (!top.length) return null;
  const ordered = top.length === 3 ? [top[1], top[0], top[2]] : top;
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {ordered.map((entry) => (
        <Link className={`group relative flex min-h-[228px] flex-col justify-center overflow-hidden rounded-xl border bg-[var(--card)] p-5 text-center transition hover:-translate-y-1 ${entry.position === 1 ? "border-[#ff7a00]/55 sm:-translate-y-2" : "border-[var(--border)]"}`} href={getProfilePath(entry.publicId)} key={entry.id}>
          <span className="absolute -left-1 top-1 font-mono text-7xl font-black text-[var(--foreground)]/[0.035]">{entry.position}</span>
          <div className="relative mx-auto mb-3 w-fit"><FaceitAvatar entry={entry} size={entry.position === 1 ? "h-16 w-16" : "h-14 w-14"} /><span className="absolute -bottom-2 -right-2"><PositionBadge position={entry.position} /></span></div>
          <strong className="block truncate text-sm group-hover:text-[#ff7a00]">{entry.faceitNickname}</strong>
          <span className="mt-1 block text-[9px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">FACEIT ELO</span>
          <span className="mt-1 block font-mono text-xl font-black text-[#ff7a00]">{entry.faceitElo.toLocaleString("pt-BR")}</span>
        </Link>
      ))}
    </div>
  );
}

function FaceitTable({ players }: { players: FaceitRankingEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="hidden grid-cols-[48px_1.4fr_.8fr_.7fr_.6fr] gap-3 border-b border-[var(--border)] px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--muted-foreground)] sm:grid"><span>Pos.</span><span>Jogador</span><span>FACEIT ELO</span><span>Win rate</span><span>Streak</span></div>
      <div className="divide-y divide-[var(--border)]">
        {players.map((entry) => (
          <Link className="group grid grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-3.5 hover:bg-white/[0.025] sm:grid-cols-[48px_1.4fr_.8fr_.7fr_.6fr]" href={getProfilePath(entry.publicId)} key={entry.id}>
            <PositionBadge position={entry.position} />
            <span className="flex min-w-0 items-center gap-3"><FaceitAvatar entry={entry} /><span className="min-w-0"><strong className="block truncate text-sm group-hover:text-[#ff7a00]">{entry.faceitNickname}</strong><small className="text-[10px] text-[var(--muted-foreground)]">Level {entry.faceitLevel}</small></span></span>
            <span className="hidden font-mono text-sm font-black text-[#ff7a00] sm:block">{entry.faceitElo.toLocaleString("pt-BR")}</span>
            <span className="hidden text-sm font-bold text-emerald-400 sm:block">{entry.faceitWinRate != null ? `${entry.faceitWinRate}%` : "—"}</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-[#ff7a00]"><Flame className="h-3 w-3" /> {entry.faceitWinStreak ?? "—"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FaceitRanking({ podiumPlayers, players, total, page, totalPages, blueStrikePage }: { podiumPlayers: FaceitRankingEntry[]; players: FaceitRankingEntry[]; total: number; page: number; totalPages: number; blueStrikePage: number }) {
  return (
    <section className="h-full">
      <div className="mb-6 flex min-h-[8.5rem] items-start justify-between gap-4">
        <div><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff7a00]"><Activity className="h-4 w-4" /> FACEIT</p><h2 className="mt-2 text-2xl font-black tracking-tight">Ranking conectado</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Classificação externa dos jogadores BlueStrike vinculados.</p></div>
        <span className="rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-3 py-1.5 text-xs font-black text-[#ff7a00]">{total} conectados</span>
      </div>
      {players.length ? <><FaceitPodium players={podiumPlayers} /><FaceitTable players={players} /><RankingPagination page={page} totalPages={totalPages} previousHref={rankingHref(blueStrikePage, page - 1)} nextHref={rankingHref(blueStrikePage, page + 1)} /></> : <div className="rounded-2xl border border-dashed border-[#ff7a00]/20 p-16 text-center"><Zap className="mx-auto h-8 w-8 text-[#ff7a00]" /><h3 className="mt-4 font-black">Nenhuma conta conectada</h3></div>}
    </section>
  );
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const query = await searchParams;
  const requestedBlueStrikePage = pageParam(query.bsPage);
  const requestedFaceitPage = pageParam(query.faceitPage);
  const [blueStrikeResult, blueStrikePodium, allFaceitPlayers] = await Promise.all([
    listPublicProfiles({ page: requestedBlueStrikePage, pageSize: PAGE_SIZE }),
    listPublicProfiles({ page: 1, pageSize: 3 }),
    listFaceitRanking(500),
  ]);
  const blueStrikePage = Math.min(requestedBlueStrikePage, blueStrikeResult.totalPages);
  const faceitTotalPages = Math.max(1, Math.ceil(allFaceitPlayers.length / PAGE_SIZE));
  const faceitPage = Math.min(requestedFaceitPage, faceitTotalPages);
  const faceitPlayers = allFaceitPlayers.slice((faceitPage - 1) * PAGE_SIZE, faceitPage * PAGE_SIZE);

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell">
        <header className="grid gap-8 border-b border-[var(--border)] pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="bs-eyebrow"><Target className="h-4 w-4" /> Ranking global</p>
            <h1 className="bs-display mt-4">Os melhores da <span className="text-[var(--primary)]">comunidade</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">Duas leituras complementares: a evolução competitiva dentro da BlueStrike e o desempenho conectado na FACEIT.</p>
          </div>
          <div className="bs-inset grid grid-cols-2 gap-3 p-3 lg:col-span-5">
            <div className="bs-bento-card p-5"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[var(--primary)]"><Users className="h-5 w-5" /></span><strong className="mt-6 block font-mono text-3xl">{blueStrikeResult.total}</strong><span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Jogadores ranqueados</span></div>
            <div className="bs-bento-card p-5"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/8 text-[#ff7a00]"><Activity className="h-5 w-5" /></span><strong className="mt-6 block font-mono text-3xl">{allFaceitPlayers.length}</strong><span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">FACEIT conectados</span></div>
          </div>
        </header>

        <div className="bs-inset mt-10 grid gap-3 p-3 lg:grid-cols-2">
          <div className="bs-bento-card min-w-0 p-4 sm:p-6"><BlueStrikeRanking faceitPage={faceitPage} page={blueStrikePage} players={blueStrikeResult.profiles} podiumPlayers={blueStrikePodium.profiles} total={blueStrikeResult.total} totalPages={blueStrikeResult.totalPages} /></div>
          <div className="bs-bento-card min-w-0 p-4 sm:p-6"><FaceitRanking blueStrikePage={blueStrikePage} page={faceitPage} players={faceitPlayers} podiumPlayers={allFaceitPlayers.slice(0, 3)} total={allFaceitPlayers.length} totalPages={faceitTotalPages} /></div>
        </div>
      </div>
    </div>
  );
}
