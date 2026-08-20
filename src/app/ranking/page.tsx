import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Crown, Globe2, Minus, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import { EloDisplay, MetricCard, PageHeader } from "@/components/bluestrike/platform-ui";
import { IN_GAME_ROLES, type UserProfile } from "@/lib/profile";
import { listPublicProfiles } from "@/lib/profiles";

export const metadata: Metadata = { title: "Ranking Global" };
export const revalidate = 1800;

const ROLE_LABELS: Record<string, string> = Object.fromEntries(IN_GAME_ROLES.map((role) => [role.value, role.label]));

function PlayerAvatar({ player, className }: { player: UserProfile; className: string }) {
  return (
    <Avatar className={`${className} border border-[var(--border)] bg-[var(--secondary)]`}>
      <AvatarImage src={player.faceitAvatar ?? player.steamAvatarUrl ?? undefined} alt={player.steamPersonaName} />
      <AvatarFallback>{player.steamPersonaName.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function PodiumCard({ player, position }: { player: UserProfile; position: 1 | 2 | 3 }) {
  const isFirst = position === 1;
  return (
    <Link
      href={`/profile/${player.publicId}`}
      className={`group relative flex min-h-[250px] flex-col justify-center overflow-hidden rounded-2xl bg-white p-6 ${isFirst ? "border border-[var(--primary)]" : "border border-[var(--border)]"}`}
    >
      <span className={`absolute -left-2 -top-7 font-mono text-[112px] font-black leading-none ${position === 1 ? "text-blue-50" : position === 2 ? "text-slate-100" : "text-orange-50"}`}>{position}</span>
      {isFirst && <div className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Crown className="h-5 w-5" /></div>}
      <div className="relative z-10 flex items-center gap-5">
        <PlayerAvatar player={player} className={isFirst ? "h-24 w-24 ring-2 ring-[var(--primary)]/20" : "h-20 w-20"} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold tracking-[-0.03em] group-hover:text-[var(--primary)]">{player.steamPersonaName}</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Brasil</p>
          <div className="mt-5 grid grid-cols-2 gap-5">
            <EloDisplay value={player.elo} label="BlueStrike ELO" />
            <EloDisplay value={player.faceitElo ?? "-"} source="faceit" label="FACEIT ELO" />
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]"><Minus className="h-3 w-3" /> Tendência indisponível</div>
        </div>
      </div>
    </Link>
  );
}

function RankingRow({ player, position }: { player: UserProfile; position: number }) {
  const role = player.inGameRole ? ROLE_LABELS[player.inGameRole] : "Sem função";
  return (
    <Link href={`/profile/${player.publicId}`} className="grid min-w-[900px] grid-cols-[72px_1.45fr_0.85fr_0.8fr_0.8fr_0.45fr_0.55fr_0.65fr] items-center gap-4 border-b border-[var(--border)] px-5 py-3.5 last:border-b-0 hover:bg-[var(--accent)]/60">
      <span className="font-mono font-bold">{position}</span>
      <div className="flex min-w-0 items-center gap-3"><PlayerAvatar player={player} className="h-9 w-9" /><div className="min-w-0"><div className="truncate text-sm font-semibold">{player.steamPersonaName}</div>{player.faceitNickname && <div className="text-[10px] text-[var(--faceit)]">@{player.faceitNickname}</div>}</div></div>
      <span className="text-sm text-[var(--muted-foreground)]">{role}</span>
      <EloDisplay value={player.elo} size="sm" />
      <span className="flex items-center gap-2 font-mono font-bold text-[var(--faceit)]">{player.faceitLevel ? <FaceitSkillIcon level={player.faceitLevel} size={18} /> : null}{player.faceitElo?.toLocaleString("pt-BR") ?? "-"}</span>
      <span className="font-mono text-sm">{player.faceitKdRatio?.toFixed(2) ?? "-"}</span>
      <span className="font-mono text-sm">{player.faceitWinRate != null ? `${player.faceitWinRate}%` : "-"}</span>
      <span className="text-xs text-[var(--muted-foreground)]">Sem dados</span>
    </Link>
  );
}

export default async function RankingPage() {
  const result = await listPublicProfiles({ query: "", page: 1 });
  const players = [...result.profiles].sort((a, b) => b.elo - a.elo).slice(0, 10);
  const podium = players.slice(0, 3);
  const podiumOrder = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;

  return (
    <div className="bs-page pb-20">
      <div className="bs-page-shell">
        <PageHeader
          className="pb-10 pt-14 lg:pb-12 lg:pt-16"
          eyebrow="Ranking global"
          title="Ranking BlueStrike"
          description="Jogadores de CS2 ranqueados por desempenho e BlueStrike ELO."
          actions={<div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><MetricCard icon={CalendarDays} value="Atual" label="Circuito" /><MetricCard icon={Globe2} value="Brasil" label="Região" /><MetricCard icon={Users} value={result.total.toLocaleString("pt-BR")} label="Jogadores" /></div>}
        />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-[10px] border border-[var(--border)] bg-white p-1"><span className="rounded-md bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white">Global</span><span className="px-5 py-2 text-sm text-[var(--muted-foreground)]">Temporada</span><span className="px-5 py-2 text-sm text-[var(--muted-foreground)]">Mensal</span></div>
          <div className="flex flex-wrap gap-2"><span className="rounded-[10px] border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--muted-foreground)]">Brasil</span><span className="rounded-[10px] border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--muted-foreground)]">Todas as funções</span><span className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--muted-foreground)]"><Search className="h-4 w-4" /> Buscar jogador</span></div>
        </div>

        {podiumOrder.length > 0 ? (
          <section className="grid items-end gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 lg:grid-cols-3">
            {podiumOrder.map((player) => {
              const position = (players.indexOf(player) + 1) as 1 | 2 | 3;
              return <PodiumCard key={player.id} player={player} position={position} />;
            })}
          </section>
        ) : (
          <div className="bs-panel p-16 text-center text-[var(--muted-foreground)]">O ranking ainda não possui jogadores.</div>
        )}

        {players.length > 3 && <section className="pt-5"><div className="bs-panel bs-table-scroll"><div className="grid min-w-[900px] grid-cols-[72px_1.45fr_0.85fr_0.8fr_0.8fr_0.45fr_0.55fr_0.65fr] gap-4 border-b border-[var(--border)] bg-[var(--secondary)]/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]"><span>Posição</span><span>Jogador</span><span>Função</span><span>BlueStrike ELO</span><span>FACEIT ELO</span><span>K/D</span><span>WR</span><span>Tendência</span></div>{players.slice(3).map((player, index) => <RankingRow key={player.id} player={player} position={index + 4} />)}<div className="px-5 py-4 text-center text-xs text-[var(--muted-foreground)]">Atualizado a cada 30 minutos</div></div></section>}
      </div>
    </div>
  );
}
