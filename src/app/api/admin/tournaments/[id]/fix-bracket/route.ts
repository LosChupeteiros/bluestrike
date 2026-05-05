import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { advanceWinnerPublic } from "@/lib/matches";

type FinishedMatch = {
  id: string;
  winner_id: string;
  round: number;
  match_index: number;
};

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: finishedMatches } = await supabase
    .from("matches")
    .select("id, winner_id, round, match_index")
    .eq("tournament_id", tournamentId)
    .eq("status", "finished")
    .not("winner_id", "is", null)
    .returns<FinishedMatch[]>();

  const results: { matchId: string; fixed: boolean; reason?: string }[] = [];

  for (const match of finishedMatches ?? []) {
    const { data: nextMatch } = await supabase
      .from("matches")
      .select("id, team1_id, team2_id")
      .eq("tournament_id", tournamentId)
      .eq("round", match.round + 1)
      .eq("match_index", Math.floor(match.match_index / 2))
      .maybeSingle<{ id: string; team1_id: string | null; team2_id: string | null }>();

    if (!nextMatch) {
      results.push({ matchId: match.id, fixed: false, reason: "no_next_match" });
      continue;
    }

    const isEvenSlot = match.match_index % 2 === 0;
    const assignedSlot = isEvenSlot ? nextMatch.team1_id : nextMatch.team2_id;

    if (assignedSlot === match.winner_id) {
      results.push({ matchId: match.id, fixed: false, reason: "already_advanced" });
      continue;
    }

    await advanceWinnerPublic(match.id, match.winner_id);
    results.push({ matchId: match.id, fixed: true });
  }

  return Response.json({ fixed: results.filter((r) => r.fixed).length, results });
}
