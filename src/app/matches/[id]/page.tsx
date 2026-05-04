import type { ElementType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, Crosshair, Flame, Swords, Trophy } from "lucide-react";
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
  const { match } = detail;
  const t1 = match.team1?.tag ?? "T1";
  const t2 = match.team2?.tag ?? "T2";
  return { title: `${t1} x ${t2}` };
}

function kd(kills: number, deaths: number) {
  return (kills / Math.max(deaths, 1)).toFixed(2);
}

function hsPercent(hs: number, kills: number) {
  if (kills === 0) return "0";
  return Math.round((hs / kills) * 100).toString();
}

function StatCell({ value, highlight }: { value: string | number; highlight?: boolean }) {
  return (
    <td className={cn("px-3 py-3 text-sm tabular-nums", highlight && "font-bold text-[var(--primary)]")}>
      {value}
    </td>
  );
}

function ScoreboardTable({ players, isWinner }: { players: PlayerStat[]; isWinner: boolean }) {
  const sorted = [...players].sort((a, b) => b.score - a.score || b.kills - a.kills);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            <th className="px-5 py-3 font-semibold">Jogador</th>
            <th className="px-3 py-3 font-semibold">K</th>
            <th className="px-3 py-3 font-semibold">D</th>
            <th className="px-3 py-3 font-semibold">A</th>
            <th className="px-3 py-3 font-semibold">K/D</th>
            <th className="px-3 py-3 font-semibold">HS%</th>
            <th className="px-3 py-3 font-semibold">ADR</th>
            <th className="px-3 py-3 font-semibold">MVPs</th>
            <th className="px-3 py-3 font-semibold">Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr
              key={p.profileId}
              className={cn(
                "border-b border-[var(--border)]/60 last:border-b-0 transition-colors",
                i === 0 && isWinner && "bg-[var(--primary)]/5"
              )}
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatarUrl ?? undefined} alt={p.nickname} />
                    <AvatarFallback className="text-xs">{p.nickname[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{p.nickname}</span>
                  {i === 0 && isWinner && (
                    <span className="rounded bg-[var(--primary)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">MVP</span>
                  )}
                </div>
              </td>
              <StatCell value={p.kills} highlight={p.kills >= 20} />
              <StatCell value={p.deaths} />
              <StatCell value={p.assists} />
              <StatCell value={kd(p.kills, p.deaths)} highlight={p.kills / Math.max(p.deaths, 1) >= 1.5} />
              <StatCell value={`${hsPercent(p.hsCount, p.kills)}%`} />
              <StatCell value={p.adr.toFixed(1)} highlight={p.adr >= 90} />
              <StatCell value={p.mvps} />
              <StatCell value={p.score} />
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={9} className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Stats ainda não disponíveis
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
        <div className="text-sm font-bold">{value}</div>
      </div>
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

  const t1Stats = playerStats.filter((p) => p.teamId === match.team1Id);
  const t2Stats = playerStats.filter((p) => p.teamId === match.team2Id);

  const statusLabel =
    match.status === "finished"
      ? "Finalizada"
      : match.status === "live"
        ? "Ao vivo"
        : match.status === "cancelled"
          ? "Cancelada"
          : "Agendada";

  const statusVariant: "finished" | "live" | "secondary" | "destructive" =
    match.status === "finished"
      ? "finished"
      : match.status === "live"
        ? "live"
        : match.status === "cancelled"
          ? "destructive"
          : "secondary";

  return (
    <div className="min-h-screen pb-24 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/matches"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Partidas
        </Link>

        {/* Hero */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="relative min-h-[200px] border-b border-[var(--border)] px-6 py-8 sm:px-10 sm:py-10">
            {mapPresentation ? (
              <>
                <div
                  className="absolute inset-0 bg-cover"
                  style={{ backgroundImage: `url(${mapPresentation.localImage})`, backgroundPosition: "center 60%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/85" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-900 to-black" />
            )}
            <div className="absolute inset-0 grid-bg opacity-15" />

            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant}>{statusLabel}</Badge>
                {mapPresentation && <Badge variant="outline">{mapPresentation.name}</Badge>}
                {match.boType > 1 && <Badge variant="secondary">BO{match.boType}</Badge>}
              </div>

              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
                {/* Team 1 */}
                <div className="flex items-center gap-4 lg:justify-end">
                  <div className="lg:text-right">
                    <div className="text-2xl font-black">{match.team1?.name ?? "Time 1"}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">{match.team1?.tag}</div>
                  </div>
                  <div
                    className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 text-xl font-black",
                      t1Won
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                    )}
                  >
                    {match.team1?.tag ?? "T1"}
                  </div>
                </div>

                {/* Score */}
                <div className="text-center">
                  {isFinished || match.status === "live" ? (
                    <div className="font-mono text-6xl font-black tracking-tight">
                      <span className={t1Won ? "text-[var(--primary)]" : ""}>{t1Score}</span>
                      <span className="mx-3 text-[var(--muted-foreground)]">:</span>
                      <span className={t2Won ? "text-[var(--primary)]" : ""}>{t2Score}</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-black text-[var(--muted-foreground)]">VS</div>
                  )}
                  {mapName && (
                    <div className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
                      {mapPresentation?.name ?? mapName}
                    </div>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 text-xl font-black",
                      t2Won
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                    )}
                  >
                    {match.team2?.tag ?? "T2"}
                  </div>
                  <div>
                    <div className="text-2xl font-black">{match.team2?.name ?? "Time 2"}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">{match.team2?.tag}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stat pills */}
          {playerStats.length > 0 && (() => {
            const allPlayers = [...t1Stats, ...t2Stats];
            const topKills = [...allPlayers].sort((a, b) => b.kills - a.kills)[0];
            const topAdr = [...allPlayers].sort((a, b) => b.adr - a.adr)[0];
            const topHs = [...allPlayers].sort(
              (a, b) => b.kills / Math.max(b.kills, 1) * (b.hsCount / Math.max(b.kills, 1)) - a.kills / Math.max(a.kills, 1) * (a.hsCount / Math.max(a.kills, 1))
            )[0];
            return (
              <div className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-4">
                <StatPill icon={Swords} label="Maior K" value={`${topKills?.nickname ?? "—"} (${topKills?.kills ?? 0})`} />
                <StatPill icon={Flame} label="Maior ADR" value={`${topAdr?.nickname ?? "—"} (${topAdr?.adr.toFixed(1) ?? "0"})`} />
                <StatPill icon={Crosshair} label="Mais HS" value={`${topHs?.nickname ?? "—"} (${topHs?.hsCount ?? 0})`} />
                <StatPill icon={Trophy} label="Rounds jogados" value={t1Score + t2Score} />
              </div>
            );
          })()}
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {[
            { team: match.team1, teamId: match.team1Id, stats: t1Stats, isWinner: t1Won },
            { team: match.team2, teamId: match.team2Id, stats: t2Stats, isWinner: t2Won },
          ].map(({ team, teamId, stats, isWinner }) => (
            <section
              key={teamId ?? team?.tag}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
            >
              <div
                className={cn(
                  "flex items-center justify-between border-b px-5 py-4",
                  isWinner
                    ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                    : "border-[var(--border)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl border font-black",
                      isWinner
                        ? "border-[var(--primary)]/50 bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
                    )}
                  >
                    {team?.tag ?? "?"}
                  </div>
                  <div>
                    <div className="text-base font-black">{team?.name ?? "Time"}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{stats.length} jogadores</div>
                  </div>
                </div>
                {isFinished && (
                  <Badge variant={isWinner ? "open" : "secondary"}>
                    {isWinner ? "Vitória" : "Derrota"}
                  </Badge>
                )}
              </div>
              <ScoreboardTable players={stats} isWinner={isWinner} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
