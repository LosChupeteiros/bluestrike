import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentProfile } from "@/lib/profiles";
import { getTournamentById } from "@/lib/tournaments";
import { getFullMatchDetail, getMatchWebhookInfo, resolveMatchViewerAccess } from "@/lib/matches";
import { getBracketRoundLabel, getBracketRoundModel } from "@/lib/bracket-model";
import MatchPageClient from "./match-page-client";
import WebhookInfoPanel from "./webhook-info-panel";

interface MatchPageProps {
  params: Promise<{ id: string; matchId: string }>;
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const detail = await getFullMatchDetail(matchId, false);
  if (!detail) return { title: "Partida" };
  const t1 = detail.match.team1?.tag ?? "TBD";
  const t2 = detail.match.team2?.tag ?? "TBD";
  return { title: `${t1} x ${t2}` };
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const { id: tournamentId, matchId } = await params;

  // Quem é o usuário nesta partida. Mesma regra usada pela rota de polling
  // (/api/matches/[id]/status) — jogador e admin veem os dados de conexão do
  // servidor, espectador acompanha só o placar e o status.
  const [currentProfile, tournament, access] = await Promise.all([
    getCurrentProfile(),
    getTournamentById(tournamentId),
    resolveMatchViewerAccess(matchId),
  ]);

  if (!tournament) notFound();

  const { userTeamId, isCaptain, isPlayer, isAdmin, canSeeServerCredentials } = access;

  const [detail, webhookInfo] = await Promise.all([
    getFullMatchDetail(matchId, canSeeServerCredentials),
    isAdmin ? getMatchWebhookInfo(matchId) : Promise.resolve(null),
  ]);

  if (!detail || detail.match.tournamentId !== tournamentId) notFound();

  const model = getBracketRoundModel(tournament.registeredTeamsCount ?? 2);
  const roundLabel = getBracketRoundLabel(detail.match.round, model);

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell max-w-[1400px]">
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

        <div className="mb-7">
          <p className="bs-eyebrow mb-3">Central competitiva</p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-5xl">{roundLabel}</h1>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">Ready, veto, servidor e placar reunidos em uma única experiência.</p>
        </div>

        <MatchPageClient
          detail={detail}
          tournamentId={tournamentId}
          roundLabel={roundLabel}
          isFinal={detail.match.round === model.finalRound}
          currentProfileId={currentProfile?.id ?? null}
          userTeamId={userTeamId}
          isCaptain={isCaptain}
          isPlayer={isPlayer}
          isAdmin={isAdmin}
        />

        {isAdmin && webhookInfo && (
          <WebhookInfoPanel webhookInfo={webhookInfo} />
        )}

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
