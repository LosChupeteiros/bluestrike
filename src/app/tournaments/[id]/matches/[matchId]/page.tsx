import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentProfile } from "@/lib/profiles";
import { getTournamentById } from "@/lib/tournaments";
import { getTournamentMatches } from "@/lib/matches";
import { getFullMatchDetail, getMatchWebhookInfo } from "@/lib/matches";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
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

  const [currentProfile, tournament] = await Promise.all([
    getCurrentProfile(),
    getTournamentById(tournamentId),
  ]);

  if (!tournament) notFound();

  // Determine if the current user is a player in this match
  // (players can see connect info; spectators cannot)
  let userTeamId: string | null = null;
  let isCaptain = false;

  if (currentProfile) {
    const supabase = createSupabaseAdminClient();

    // Check team_members
    const { data: detail0 } = await supabase
      .from("matches")
      .select("team1_id, team2_id")
      .eq("id", matchId)
      .maybeSingle<{ team1_id: string | null; team2_id: string | null }>();

    if (detail0) {
      const teamIds = [detail0.team1_id, detail0.team2_id].filter(Boolean) as string[];

      const [{ data: memberRow }, { data: captainRow }] = await Promise.all([
        supabase
          .from("team_members")
          .select("team_id")
          .eq("profile_id", currentProfile.id)
          .in("team_id", teamIds)
          .maybeSingle<{ team_id: string }>(),
        supabase
          .from("teams")
          .select("id")
          .eq("captain_id", currentProfile.id)
          .in("id", teamIds)
          .maybeSingle<{ id: string }>(),
      ]);

      userTeamId = captainRow?.id ?? memberRow?.team_id ?? null;
      isCaptain = Boolean(captainRow?.id);
    }
  }

  const isPlayer = Boolean(userTeamId);
  const isAdmin = Boolean(currentProfile?.isAdmin);

  const [detail, allMatches, webhookInfo] = await Promise.all([
    getFullMatchDetail(matchId, isPlayer || isAdmin),
    getTournamentMatches(tournamentId),
    isAdmin ? getMatchWebhookInfo(matchId) : Promise.resolve(null),
  ]);

  if (!detail || detail.match.tournamentId !== tournamentId) notFound();

  const maxRound = allMatches.reduce((acc: number, m) => Math.max(acc, m.round), 0);
  const roundLabel =
    detail.match.round === maxRound
      ? "Final"
      : detail.match.round === maxRound - 1 && maxRound > 2
      ? "Semifinal"
      : detail.match.round === maxRound - 2 && maxRound > 3
      ? "Quartas de Final"
      : `Rodada ${detail.match.round}`;

  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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

        <MatchPageClient
          detail={detail}
          tournamentId={tournamentId}
          roundLabel={roundLabel}
          isFinal={detail.match.round === maxRound}
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
