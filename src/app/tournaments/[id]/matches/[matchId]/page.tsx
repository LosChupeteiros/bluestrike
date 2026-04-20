import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Swords, Trophy, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCurrentProfile } from "@/lib/profiles";
import { getTournamentById } from "@/lib/tournaments";
import { getMatchById, getTournamentMatches, getMatchWebhookInfo } from "@/lib/matches";
import { formatDate } from "@/lib/utils";
import MatchResultForm from "./match-result-form";
import WebhookInfoPanel from "./webhook-info-panel";

interface MatchPageProps {
  params: Promise<{ id: string; matchId: string }>;
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const match = await getMatchById(matchId);
  if (!match) return { title: "Partida" };
  const t1 = match.team1?.tag ?? "TBD";
  const t2 = match.team2?.tag ?? "TBD";
  return { title: `${t1} x ${t2}` };
}

const MATCH_STATUS_LABEL: Record<string, string> = {
  pending:  "Aguardando",
  veto:     "Veto de mapa",
  live:     "Ao vivo",
  finished: "Finalizado",
  walkover: "W.O.",
  cancelled: "Cancelado",
};

const MATCH_STATUS_VARIANT: Record<string, "open" | "ongoing" | "finished" | "upcoming" | "live"> = {
  pending:   "upcoming",
  veto:      "upcoming",
  live:      "live",
  finished:  "finished",
  walkover:  "finished",
  cancelled: "finished",
};

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const { id: tournamentId, matchId } = await params;

  const [match, tournament, currentProfile] = await Promise.all([
    getMatchById(matchId),
    getTournamentById(tournamentId),
    getCurrentProfile(),
  ]);

  if (!match || !tournament || match.tournamentId !== tournamentId) {
    notFound();
  }

  const isFinished = match.status === "finished" || match.status === "walkover";
  const winner = isFinished
    ? (match.winnerId === match.team1Id ? match.team1 : match.team2)
    : null;
  const loser = isFinished && match.winnerId
    ? (match.winnerId === match.team1Id ? match.team2 : match.team1)
    : null;

  const [allMatches, webhookInfo] = await Promise.all([
    getTournamentMatches(tournamentId),
    currentProfile?.isAdmin ? getMatchWebhookInfo(matchId) : Promise.resolve(null),
  ]);

  const maxRound = allMatches.reduce((acc, m) => Math.max(acc, m.round), 0);
  const roundLabel = match.round === maxRound
    ? "Final"
    : match.round === maxRound - 1 && maxRound > 2
    ? "Semifinal"
    : match.round === maxRound - 2 && maxRound > 3
    ? "Quartas de Final"
    : `Rodada ${match.round}`;

  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tournaments" className="transition-colors hover:text-[var(--foreground)]">Campeonatos</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/tournaments/${tournamentId}`} className="transition-colors hover:text-[var(--foreground)]">
            {tournament.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--foreground)]">{roundLabel}</span>
        </nav>

        {/* Match header */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="relative border-b border-[var(--border)] px-6 py-8">
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-slate-900/20 to-black/40" />

            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant={MATCH_STATUS_VARIANT[match.status] ?? "upcoming"}>
                  {match.status === "live" && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                  )}
                  {MATCH_STATUS_LABEL[match.status] ?? match.status}
                </Badge>
                <Badge variant="secondary">{roundLabel}</Badge>
                <Badge variant="secondary">{tournament.name}</Badge>
              </div>

              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
                {/* Team 1 */}
                <div className="flex items-center gap-4 lg:justify-end">
                  <div className="lg:text-right">
                    <div className={`text-2xl font-black ${isFinished && winner?.id === match.team1Id ? "text-green-400" : ""}`}>
                      {match.team1?.name ?? "A definir"}
                    </div>
                    {match.team1 && (
                      <div className="text-sm text-[var(--muted-foreground)]">{match.team1.elo} ELO médio</div>
                    )}
                    {isFinished && winner?.id === match.team1Id && (
                      <div className="mt-1 flex items-center gap-1 text-xs font-bold text-green-400 lg:justify-end">
                        <Crown className="h-3 w-3" /> Vencedor
                      </div>
                    )}
                  </div>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-xl font-black text-[var(--primary)]">
                    {match.team1?.tag ?? "?"}
                  </div>
                </div>

                {/* VS */}
                <div className="text-center">
                  <Swords className="mx-auto h-10 w-10 text-[var(--primary)] opacity-60" />
                  {match.scheduledAt && (
                    <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                      {formatDate(match.scheduledAt)}
                    </div>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-xl font-black text-[var(--primary)]">
                    {match.team2?.tag ?? "?"}
                  </div>
                  <div>
                    <div className={`text-2xl font-black ${isFinished && winner?.id === match.team2Id ? "text-green-400" : ""}`}>
                      {match.team2?.name ?? "A definir"}
                    </div>
                    {match.team2 && (
                      <div className="text-sm text-[var(--muted-foreground)]">{match.team2.elo} ELO médio</div>
                    )}
                    {isFinished && winner?.id === match.team2Id && (
                      <div className="mt-1 flex items-center gap-1 text-xs font-bold text-green-400">
                        <Crown className="h-3 w-3" /> Vencedor
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result summary */}
          {isFinished && winner && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <Trophy className="h-5 w-5 shrink-0 text-yellow-400" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-yellow-400/70">
                    {match.round === maxRound ? "Campeão do torneio" : "Avança para próxima fase"}
                  </div>
                  <div className="font-black text-yellow-400">{winner.name}</div>
                </div>
                {loser && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-8" />
                    <div className="text-xs text-[var(--muted-foreground)]">
                      <div className="uppercase tracking-widest">Eliminado</div>
                      <div className="font-semibold text-[var(--foreground)]">{loser.name}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin: result submission */}
        {currentProfile?.isAdmin && !isFinished && match.team1Id && match.team2Id && (
          <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--card)] p-6">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--primary)]">
              Registrar Resultado
            </h3>
            <MatchResultForm
              matchId={match.id}
              tournamentId={tournamentId}
              team1={{ id: match.team1Id, name: match.team1?.name ?? "Time 1" }}
              team2={{ id: match.team2Id, name: match.team2?.name ?? "Time 2" }}
            />
          </div>
        )}

        {/* Admin: webhook credentials */}
        {currentProfile?.isAdmin && webhookInfo && (
          <WebhookInfoPanel webhookInfo={webhookInfo} />
        )}

        {/* Back link */}
        <div className="mt-8">
          <Link
            href={`/tournaments/${tournamentId}?tab=bracket`}
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar ao chaveamento
          </Link>
        </div>
      </div>
    </div>
  );
}
