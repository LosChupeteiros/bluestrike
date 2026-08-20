import type { ElementType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Flame,
  Radio,
  Swords,
  Trophy,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getFullMatchDetail, type PlayerStat } from "@/lib/matches";
import { getMapPresentation } from "@/lib/maps";
import { cn } from "@/lib/utils";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getFullMatchDetail(id, false);
  if (!detail) return { title: "Partida" };
  const t1 = detail.match.team1?.tag ?? "T1";
  const t2 = detail.match.team2?.tag ?? "T2";
  return { title: `${t1} x ${t2} | Central da Partida` };
}

function kd(kills: number, deaths: number) {
  return (kills / Math.max(deaths, 1)).toFixed(2);
}

function hsPercent(hs: number, kills: number) {
  return kills === 0 ? "0" : Math.round((hs / kills) * 100).toString();
}

function getMvp(players: PlayerStat[]) {
  return [...players].sort((a, b) => b.score - a.score || b.kills - a.kills || b.adr - a.adr)[0] ?? null;
}

function StatCell({ value, highlight }: { value: string | number; highlight?: boolean }) {
  return <td className={cn("px-3 py-3 text-sm tabular-nums", highlight && "font-bold text-[var(--primary)]")}>{value}</td>;
}

function ScoreboardTable({ players, mvpSteamId }: { players: PlayerStat[]; mvpSteamId: string | null }) {
  const sorted = [...players].sort((a, b) => b.score - a.score || b.kills - a.kills);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[650px] w-full">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
            <th className="px-5 py-3 font-semibold">Jogador</th>
            <th className="px-3 py-3 font-semibold">K</th>
            <th className="px-3 py-3 font-semibold">D</th>
            <th className="px-3 py-3 font-semibold">A</th>
            <th className="px-3 py-3 font-semibold">K/D</th>
            <th className="px-3 py-3 font-semibold">HS%</th>
            <th className="px-3 py-3 font-semibold">ADR</th>
            <th className="px-3 py-3 font-semibold">Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player) => {
            const isMvp = player.steamid64 === mvpSteamId;
            return (
              <tr key={player.profileId ?? player.steamid64} className={cn("group border-b border-[var(--border)]/70 last:border-b-0 hover:bg-blue-50/60", isMvp && "border-l-2 border-l-[var(--primary)] bg-blue-50/70")}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={player.avatarUrl ?? undefined} alt={player.nickname} /><AvatarFallback className="text-xs">{player.nickname[0]?.toUpperCase()}</AvatarFallback></Avatar>
                    {player.profilePublicId ? (
                      <Link href={`/profile/${player.profilePublicId}`} className="text-sm font-semibold group-hover:text-[var(--primary)]">{player.nickname}</Link>
                    ) : <span className="text-sm font-semibold">{player.nickname}</span>}
                    {isMvp && <Badge variant="ongoing" className="text-[9px]">MVP</Badge>}
                  </div>
                </td>
                <StatCell value={player.kills} highlight={player.kills >= 20} />
                <StatCell value={player.deaths} />
                <StatCell value={player.assists} />
                <StatCell value={kd(player.kills, player.deaths)} highlight={player.kills / Math.max(player.deaths, 1) >= 1.5} />
                <StatCell value={`${hsPercent(player.hsCount, player.kills)}%`} />
                <StatCell value={player.adr.toFixed(1)} highlight={player.adr >= 90} />
                <StatCell value={player.score} />
              </tr>
            );
          })}
          {sorted.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">Estatísticas ainda não disponíveis.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string | number }) {
  return (
    <div className="border-l border-[var(--border)] pl-4 first:border-l-0 first:pl-0">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]"><Icon className="h-3.5 w-3.5 text-[var(--primary)]" />{label}</div>
      <div className="mt-2 text-sm font-bold">{value}</div>
    </div>
  );
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const detail = await getFullMatchDetail(id, false);
  if (!detail) notFound();

  const { match, matchMaps, playerStats } = detail;
  const mapInfo = matchMaps[0];
  const mapName = mapInfo?.mapName ?? null;
  const mapPresentation = mapName ? getMapPresentation(mapName) : null;
  const t1Score = mapInfo?.team1Score ?? 0;
  const t2Score = mapInfo?.team2Score ?? 0;
  const isFinished = match.status === "finished";
  const t1Won = isFinished && t1Score > t2Score;
  const t2Won = isFinished && t2Score > t1Score;
  const t1NameLower = match.team1?.name?.toLowerCase() ?? "";
  const t2NameLower = match.team2?.name?.toLowerCase() ?? "";
  const t1Stats = playerStats.filter((player) =>
    (player.teamId && player.teamId === match.team1Id) ||
    (!player.teamId && player.teamName && t1NameLower && player.teamName.toLowerCase() === t1NameLower)
  );
  const t2Stats = playerStats.filter((player) =>
    (player.teamId && player.teamId === match.team2Id) ||
    (!player.teamId && player.teamName && t2NameLower && player.teamName.toLowerCase() === t2NameLower)
  );
  const mvpSteamId = getMvp(playerStats)?.steamid64 ?? null;
  const statusLabel = match.status === "finished" ? "Finalizada" : match.status === "live" ? "Ao vivo" : match.status === "cancelled" ? "Cancelada" : "Agendada";
  const statusVariant: "finished" | "live" | "secondary" | "destructive" = match.status === "finished" ? "finished" : match.status === "live" ? "live" : match.status === "cancelled" ? "destructive" : "secondary";
  const allPlayers = [...t1Stats, ...t2Stats];
  const topKills = [...allPlayers].sort((a, b) => b.kills - a.kills)[0];
  const topAdr = [...allPlayers].sort((a, b) => b.adr - a.adr)[0];
  const topHs = [...allPlayers].sort((a, b) => b.hsCount - a.hsCount)[0];

  return (
    <div className="bs-page min-h-screen pb-24 pt-20">
      <div className="bs-page-shell pt-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted-foreground)]" aria-label="Navegação estrutural">
          <Link href="/" className="hover:text-[var(--primary)]">Início</Link><ChevronRight className="h-3 w-3" />
          <Link href="/matches" className="hover:text-[var(--primary)]">Partidas</Link><ChevronRight className="h-3 w-3" />
          <span className="text-[var(--foreground)]">{match.team1?.tag ?? "T1"} x {match.team2?.tag ?? "T2"}</span>
        </nav>

        <header className="mb-6 mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="bs-kicker">Match center</div><h1 className="mt-2 text-4xl font-bold tracking-[-0.045em]">Central da Partida</h1><p className="mt-2 text-sm text-[var(--muted-foreground)]">Placar, mapas e desempenho competitivo em uma única visão.</p></div>
          <Badge variant={statusVariant} className="w-fit">{statusLabel}</Badge>
        </header>

        <section className="bs-panel overflow-hidden">
          <div className="grid items-center gap-6 px-6 py-7 sm:px-10 lg:grid-cols-[1fr_auto_1fr]">
            <TeamScore name={match.team1?.name ?? "Time 1"} tag={match.team1?.tag ?? "T1"} score={t1Score} winner={t1Won} align="right" />
            <div className="text-center"><div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">BO{match.boType}</div><div className="mt-2 text-xs text-[var(--muted-foreground)]">{mapPresentation?.name ?? mapName ?? "Mapa a definir"}</div></div>
            <TeamScore name={match.team2?.name ?? "Time 2"} tag={match.team2?.tag ?? "T2"} score={t2Score} winner={t2Won} align="left" />
          </div>
          {matchMaps.length > 0 && (
            <div className="grid border-t border-[var(--border)] sm:grid-cols-3">
              {matchMaps.slice(0, 3).map((map, index) => <div key={`${map.mapOrder}-${map.mapName ?? index}`} className="flex items-center justify-center gap-4 border-b border-[var(--border)] px-5 py-3 text-sm last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="text-[var(--muted-foreground)]">{map.mapName ? getMapPresentation(map.mapName)?.name : `Mapa ${index + 1}`}</span><strong className="font-mono text-[var(--primary)]">{map.team1Score ?? 0} : {map.team2Score ?? 0}</strong></div>)}
            </div>
          )}
        </section>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="bs-dark-surface relative aspect-video min-h-[320px] overflow-hidden bg-[#07111e]">
            {mapPresentation && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${mapPresentation.localImage})` }} />}
            <div className="absolute inset-0 bg-[#06101d]/70" />
            <div className="relative flex h-full flex-col justify-between p-6 text-white">
              <div className="flex items-center justify-between"><Badge variant={match.status === "live" ? "live" : "finished"}>{match.status === "live" ? "Ao vivo" : statusLabel}</Badge><div className="flex items-center gap-2 text-xs text-white/70"><Radio className="h-4 w-4" />Dados oficiais BlueStrike</div></div>
              <div><div className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">Mapa atual</div><h2 className="mt-2 text-4xl font-bold">{mapPresentation?.name ?? mapName ?? "A definir"}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/70">A transmissão aparece aqui quando um canal oficial é vinculado à partida.</p></div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="bs-panel overflow-hidden">
              {mapPresentation && <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${mapPresentation.localImage})` }} />}
              <div className="p-5"><div className="bs-kicker">Mapa atual</div><div className="mt-3 flex items-center justify-between"><div><div className="text-xl font-semibold">{mapPresentation?.name ?? mapName ?? "A definir"}</div><div className="mt-1 text-xs text-[var(--muted-foreground)]">Série BO{match.boType}</div></div><div className="font-mono text-2xl font-bold text-[var(--primary)]">{t1Score} : {t2Score}</div></div></div>
            </section>
            <section className="bs-panel p-5"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[var(--primary)]" /><h2 className="text-sm font-semibold">Destaques da série</h2></div><div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6"><StatPill icon={Swords} label="Maior K" value={topKills?.nickname ?? "-"} /><StatPill icon={Flame} label="Maior ADR" value={topAdr?.adr.toFixed(1) ?? "0"} /><StatPill icon={Crosshair} label="Mais HS" value={topHs?.hsCount ?? 0} /><StatPill icon={Trophy} label="Rounds" value={t1Score + t2Score} /></div></section>
          </aside>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {[{ team: match.team1, teamId: match.team1Id, stats: t1Stats, isWinner: t1Won }, { team: match.team2, teamId: match.team2Id, stats: t2Stats, isWinner: t2Won }].map(({ team, teamId, stats, isWinner }) => (
            <section key={teamId ?? team?.tag} className="bs-panel overflow-hidden">
              <div className={cn("flex items-center justify-between border-b border-[var(--border)] px-5 py-4", isWinner && "bg-emerald-50")}>
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-bold text-[var(--primary)]">{team?.tag ?? "?"}</div><div><div className="font-semibold">{team?.name ?? "Time"}</div><div className="text-xs text-[var(--muted-foreground)]">{stats.length} jogadores</div></div></div>
                {isFinished && <Badge variant={isWinner ? "open" : "destructive"}>{isWinner ? "Vitória" : "Derrota"}</Badge>}
              </div>
              <ScoreboardTable players={stats} mvpSteamId={mvpSteamId} />
            </section>
          ))}
        </div>

        <Link href="/matches" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"><ChevronLeft className="h-4 w-4" />Voltar para partidas</Link>
      </div>
    </div>
  );
}

function TeamScore({ name, tag, score, winner, align }: { name: string; tag: string; score: number; winner: boolean; align: "left" | "right" }) {
  return (
    <div className={cn("flex items-center gap-4", align === "right" ? "lg:justify-end" : "lg:justify-start")}>
      {align === "right" && <div className="min-w-0 text-right"><div className="truncate text-xl font-semibold">{name}</div><div className="text-xs text-[var(--muted-foreground)]">{tag}</div></div>}
      <div className={cn("flex h-16 min-w-16 items-center justify-center rounded-xl border px-4 font-mono text-4xl font-bold", winner ? "border-blue-200 bg-blue-50 text-[var(--primary)]" : "border-[var(--border)] bg-[var(--secondary)]")}>{score}</div>
      {align === "left" && <div className="min-w-0"><div className="truncate text-xl font-semibold">{name}</div><div className="text-xs text-[var(--muted-foreground)]">{tag}</div></div>}
    </div>
  );
}
