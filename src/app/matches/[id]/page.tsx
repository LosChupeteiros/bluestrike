import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, Crosshair, Flame, Gauge, Medal, Swords, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getFullMatchDetail, type PlayerStat } from "@/lib/matches";
import { getMapPresentation } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { Team } from "@/types";

interface MatchPageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getFullMatchDetail(id, false);
  if (!detail) return { title: "Partida" };
  return { title: `${detail.match.team1?.tag ?? "T1"} x ${detail.match.team2?.tag ?? "T2"}` };
}

function kd(kills: number, deaths: number) { return kills / Math.max(deaths, 1); }
function hsPercent(hs: number, kills: number) { return kills ? Math.round((hs / kills) * 100) : 0; }
function normalized(value: string | null | undefined) { return (value ?? "").trim().toLowerCase(); }

function aggregatePlayers(players: PlayerStat[]) {
  const aggregated = new Map<string, PlayerStat & { mapsPlayed: number }>();
  for (const player of players) {
    const key = player.steamid64 || player.profileId || `${player.teamId}:${player.nickname}`;
    const current = aggregated.get(key);
    if (!current) {
      aggregated.set(key, { ...player, mapsPlayed: 1 });
      continue;
    }
    const mapsPlayed = current.mapsPlayed + 1;
    aggregated.set(key, {
      ...current,
      kills: current.kills + player.kills,
      deaths: current.deaths + player.deaths,
      assists: current.assists + player.assists,
      hsCount: current.hsCount + player.hsCount,
      damageDealt: current.damageDealt + player.damageDealt,
      mvps: current.mvps + player.mvps,
      score: current.score + player.score,
      k2: current.k2 + player.k2,
      k3: current.k3 + player.k3,
      k4: current.k4 + player.k4,
      k5: current.k5 + player.k5,
      adr: (current.adr * current.mapsPlayed + player.adr) / mapsPlayed,
      mapsPlayed,
    });
  }
  return [...aggregated.values()];
}

function belongsToTeam(player: PlayerStat, team: Team | undefined, teamId: string | null) {
  if (player.teamId && player.teamId === teamId) return true;
  const recorded = normalized(player.teamName);
  return Boolean(recorded && team && (recorded === normalized(team.name) || recorded === normalized(team.tag)));
}

function getMvp(players: PlayerStat[]) {
  return [...players].sort((a, b) => b.score - a.score || b.kills - a.kills || b.adr - a.adr)[0] ?? null;
}

function TeamMark({ team, winner }: { team: Team | undefined; winner: boolean }) {
  return (
    <div className={cn("relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[1.7rem] border bg-black/38 shadow-2xl sm:h-36 sm:w-36", winner ? "border-[var(--primary)]/60 ring-4 ring-[var(--primary)]/10" : "border-white/15")}>
      {team?.logoUrl ? <Image src={team.logoUrl} alt={`Logo ${team.name}`} fill sizes="144px" className="object-contain p-4" unoptimized /> : <span className="text-3xl font-black text-white">{team?.tag ?? "?"}</span>}
    </div>
  );
}

function ScoreboardTable({ players, mvpSteamId }: { players: PlayerStat[]; mvpSteamId: string | null }) {
  const sorted = [...players].sort((a, b) => b.score - a.score || b.kills - a.kills);
  return (
    <div className="bs-table-scroll">
      <table className="min-w-[720px] w-full">
        <thead><tr className="border-b border-[var(--border)] text-left text-[9px] font-black uppercase tracking-[0.15em] text-[var(--muted-foreground)]"><th className="px-5 py-3.5">Jogador</th><th className="px-3 py-3.5">K</th><th className="px-3 py-3.5">D</th><th className="px-3 py-3.5">A</th><th className="px-3 py-3.5">K/D</th><th className="px-3 py-3.5">HS%</th><th className="px-3 py-3.5">ADR</th><th className="px-3 py-3.5">Score</th></tr></thead>
        <tbody>
          {sorted.map((player) => {
            const isMvp = player.steamid64 === mvpSteamId;
            return (
              <tr key={player.profileId ?? player.steamid64} className={cn("group border-b border-[var(--border)]/60 transition-colors last:border-b-0 hover:bg-[var(--primary)]/5", isMvp && "bg-[#f5c842]/6")}>
                <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={player.avatarUrl ?? undefined} alt={player.nickname} /><AvatarFallback className="text-xs">{player.nickname[0]?.toUpperCase()}</AvatarFallback></Avatar><div className="flex items-center gap-2">{player.profilePublicId ? <Link href={`/profile/${player.profilePublicId}`} className="text-sm font-bold hover:text-[var(--primary)]">{player.nickname}</Link> : <span className="text-sm font-bold">{player.nickname}</span>}{isMvp && <span className="rounded-full border border-[#f5c842]/25 bg-[#f5c842]/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#c89a00]">MVP</span>}</div></div></td>
                <td className="px-3 py-3.5 text-sm font-black tabular-nums text-[var(--primary)]">{player.kills}</td><td className="px-3 py-3.5 text-sm tabular-nums">{player.deaths}</td><td className="px-3 py-3.5 text-sm tabular-nums">{player.assists}</td><td className="px-3 py-3.5 text-sm font-bold tabular-nums">{kd(player.kills, player.deaths).toFixed(2)}</td><td className="px-3 py-3.5 text-sm tabular-nums">{hsPercent(player.hsCount, player.kills)}%</td><td className="px-3 py-3.5 text-sm font-bold tabular-nums">{player.adr.toFixed(1)}</td><td className="px-3 py-3.5 text-sm tabular-nums">{player.score}</td>
              </tr>
            );
          })}
          {sorted.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">Estatísticas em processamento.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const detail = await getFullMatchDetail(id, false);
  if (!detail) notFound();

  const { match, matchMaps, playerStats } = detail;
  const firstMap = matchMaps[0];
  const mapPresentation = firstMap?.mapName ? getMapPresentation(firstMap.mapName) : null;
  const isFinished = match.status === "finished" || match.status === "walkover";
  const t1Won = isFinished && match.winnerId === match.team1Id;
  const t2Won = isFinished && match.winnerId === match.team2Id;
  const seriesT1 = matchMaps.filter((map) => map.winnerId === match.team1Id).length;
  const seriesT2 = matchMaps.filter((map) => map.winnerId === match.team2Id).length;
  const displayT1Score = matchMaps.length > 1 ? seriesT1 : firstMap?.team1Score ?? 0;
  const displayT2Score = matchMaps.length > 1 ? seriesT2 : firstMap?.team2Score ?? 0;
  const aggregatedPlayers = aggregatePlayers(playerStats);
  const t1Stats = aggregatedPlayers.filter((player) => belongsToTeam(player, match.team1, match.team1Id));
  const t2Stats = aggregatedPlayers.filter((player) => belongsToTeam(player, match.team2, match.team2Id));
  const mvp = getMvp(aggregatedPlayers);
  const statusLabel = isFinished ? "Finalizada" : match.status === "live" ? "Ao vivo" : match.status === "cancelled" ? "Cancelada" : "Agendada";
  const statusVariant = isFinished ? "finished" as const : match.status === "live" ? "live" as const : match.status === "cancelled" ? "destructive" as const : "secondary" as const;
  const backHref = match.tournamentId ? `/tournaments/${match.tournamentId}` : "/live";

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5"><div><Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><ChevronLeft className="h-4 w-4" /> Voltar ao campeonato</Link><p className="bs-eyebrow"><Swords className="h-3.5 w-3.5" /> Central da partida</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">Placar e desempenho</h1></div><p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">Resultado, mapas, MVP e estatísticas sincronizados com o servidor competitivo.</p></div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0d0f] text-white shadow-[0_30px_85px_rgba(0,0,0,.3)]">
          {mapPresentation ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${mapPresentation.localImage})` }} /> : <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-950 to-black" />}
          <span className="absolute inset-0 bg-black/62" /><span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,200,255,.08),transparent_38%),linear-gradient(to_right,rgba(0,0,0,.5),transparent_45%,rgba(0,0,0,.5))]" />
          <div className="relative p-6 sm:p-10">
            <div className="mb-9 flex flex-wrap items-center justify-center gap-2"><Badge variant={statusVariant}>{statusLabel}</Badge>{mapPresentation && <Badge variant="outline" className="border-white/16 bg-black/30 text-white">{mapPresentation.name}</Badge>}<Badge variant="secondary" className="bg-white/9 text-white">BO{match.boType}</Badge></div>
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
              <div className="flex flex-col items-center gap-4 md:flex-row md:justify-end md:text-right"><div className="order-2 md:order-1"><h2 className={cn("text-2xl font-black sm:text-3xl", t1Won && "text-[var(--primary)]")}>{match.team1?.name ?? "Time 1"}</h2><p className="mt-1 text-sm text-white/52">{match.team1?.tag}</p></div><div className="order-1 md:order-2"><TeamMark team={match.team1} winner={t1Won} /></div></div>
              <div className="text-center"><div className="font-mono text-[clamp(4rem,8vw,7rem)] font-black leading-none tracking-[-.09em]"><span className={t1Won ? "text-[var(--primary)]" : "text-white"}>{displayT1Score}</span><span className="mx-3 text-white/24">:</span><span className={t2Won ? "text-[var(--primary)]" : "text-white"}>{displayT2Score}</span></div><p className="mt-3 text-[10px] font-black uppercase tracking-[.18em] text-white/42">{matchMaps.length > 1 ? "Placar da série" : mapPresentation?.name ?? "Partida"}</p></div>
              <div className="flex flex-col items-center gap-4 md:flex-row"><TeamMark team={match.team2} winner={t2Won} /><div><h2 className={cn("text-2xl font-black sm:text-3xl", t2Won && "text-[var(--primary)]")}>{match.team2?.name ?? "Time 2"}</h2><p className="mt-1 text-sm text-white/52">{match.team2?.tag}</p></div></div>
            </div>
          </div>
          {matchMaps.length > 0 && <div className="relative grid border-t border-white/10 bg-black/34 backdrop-blur-sm sm:grid-cols-3">{matchMaps.map((map, index) => <div key={map.mapOrder} className="flex min-h-20 items-center justify-between border-b border-white/10 px-6 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/40">Mapa {index + 1}</span><strong className="mt-1 block text-sm capitalize">{map.mapName?.replace("de_", "") ?? "A definir"}</strong></span><strong className="font-mono text-xl">{map.team1Score ?? "—"} <span className="text-white/28">:</span> {map.team2Score ?? "—"}</strong></div>)}</div>}
        </section>

        {mvp && isFinished && <section className="mt-5 grid overflow-hidden rounded-[1.75rem] border border-[#f5c842]/22 bg-[linear-gradient(120deg,rgba(245,200,66,.10),transparent_42%),var(--card)] shadow-[var(--panel-shadow-soft)] lg:grid-cols-[1.2fr_2fr]"><div className="flex items-center gap-5 p-6 sm:p-8"><Avatar className="h-20 w-20 border border-[#f5c842]/28 sm:h-24 sm:w-24"><AvatarImage src={mvp.avatarUrl ?? undefined} alt={mvp.nickname} /><AvatarFallback className="text-2xl font-black">{mvp.nickname[0]?.toUpperCase()}</AvatarFallback></Avatar><div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#c89a00]"><Medal className="h-4 w-4" /> MVP da série</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">{mvp.nickname}</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Maior impacto no resultado final</p></div></div><div className="grid grid-cols-2 border-t border-[var(--border)] sm:grid-cols-4 lg:border-l lg:border-t-0">{[{ label: "Kills", value: mvp.kills, icon: Swords }, { label: "K/D", value: kd(mvp.kills, mvp.deaths).toFixed(2), icon: Gauge }, { label: "ADR", value: mvp.adr.toFixed(1), icon: Flame }, { label: "HS", value: `${hsPercent(mvp.hsCount, mvp.kills)}%`, icon: Crosshair }].map((stat, index) => <div key={stat.label} className={cn("flex min-h-32 flex-col justify-center p-5", index % 2 ? "border-l border-[var(--border)]" : "", index > 1 ? "border-t border-[var(--border)] sm:border-t-0" : "", index > 0 ? "sm:border-l" : "")}><stat.icon className="h-4 w-4 text-[var(--primary)]" /><span className="mt-3 text-[9px] font-black uppercase tracking-[.14em] text-[var(--muted-foreground)]">{stat.label}</span><strong className="mt-1 text-3xl font-black tracking-[-.05em]">{stat.value}</strong></div>)}</div></section>}

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {[{ team: match.team1, teamId: match.team1Id, stats: t1Stats, winner: t1Won }, { team: match.team2, teamId: match.team2Id, stats: t2Stats, winner: t2Won }].map(({ team, teamId, stats, winner }) => (
            <section key={teamId ?? team?.tag} className="bs-bento-card overflow-hidden"><div className={cn("flex items-center justify-between border-b px-5 py-4", winner ? "border-[var(--primary)]/28 bg-[var(--primary)]/5" : "border-[var(--border)]")}><div className="flex items-center gap-3"><div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--secondary)]">{team?.logoUrl ? <Image src={team.logoUrl} alt="" fill sizes="56px" className="object-contain p-2" unoptimized /> : <span className="font-black">{team?.tag ?? "?"}</span>}</div><div><h2 className="text-lg font-black">{team?.name ?? "Time"}</h2><p className="text-xs text-[var(--muted-foreground)]">{stats.length} jogadores sincronizados</p></div></div>{isFinished && <Badge variant={winner ? "open" : "secondary"}>{winner ? "Vitória" : "Derrota"}</Badge>}</div><ScoreboardTable players={stats} mvpSteamId={mvp?.steamid64 ?? null} /></section>
          ))}
        </div>

        {isFinished && aggregatedPlayers.length === 0 && <div className="bs-bento-card mt-6 flex min-h-36 items-center gap-4 p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/8 text-[var(--primary)]"><Target className="h-5 w-5" /></span><div><h2 className="font-black">Estatísticas em processamento</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">O resultado já foi confirmado; os dados individuais serão exibidos assim que o servidor concluir a sincronização.</p></div></div>}
      </div>
    </div>
  );
}
