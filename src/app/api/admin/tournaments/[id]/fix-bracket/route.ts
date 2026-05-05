import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { advanceWinnerPublic } from "@/lib/matches";

type FinishedMatch = {
  id: string;
  winner_id: string;
  round: number;
  match_index: number;
  bo_type: 1 | 3 | 5;
};

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: allMatches } = await supabase
    .from("matches")
    .select("id, round, match_index, bo_type")
    .eq("tournament_id", tournamentId)
    .returns<{ id: string; round: number; match_index: number; bo_type: 1 | 3 | 5 }[]>();

  const maxRound = Math.max(0, ...(allMatches ?? []).map((m) => m.round));
  const finalMatch = allMatches?.find((m) => m.round === maxRound && m.match_index === 0);
  const thirdPlaceMatch = allMatches?.find((m) => m.round === maxRound && m.match_index === 1);
  if (finalMatch && finalMatch.bo_type !== 3) {
    await supabase.from("matches").update({ bo_type: 3 }).eq("id", finalMatch.id);
  }
  const { count: confirmedTeamCount } = await supabase
    .from("tournament_registrations")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .neq("status", "withdrawn");
  if ((confirmedTeamCount ?? 0) >= 4 && maxRound >= 2 && !thirdPlaceMatch) {
    await supabase.from("matches").insert({
      id: randomUUID(),
      tournament_id: tournamentId,
      round: maxRound,
      match_index: 1,
      bo_type: 1,
      status: "pending",
      webhook_secret: randomUUID(),
    });
  }

  const { data: finishedMatches } = await supabase
    .from("matches")
    .select("id, winner_id, round, match_index, bo_type")
    .eq("tournament_id", tournamentId)
    .eq("status", "finished")
    .not("winner_id", "is", null)
    .order("round", { ascending: true })
    .order("match_index", { ascending: true })
    .returns<FinishedMatch[]>();

  const results: { matchId: string; fixed: boolean; reason?: string }[] = [];

  for (const match of finishedMatches ?? []) {
    const nextRound = match.round + 1;
    const nextIndex = Math.floor(match.match_index / 2);
    const isEvenSlot = match.match_index % 2 === 0;

    const { data: nextMatch } = await supabase
      .from("matches")
      .select("id, team1_id, team2_id")
      .eq("tournament_id", tournamentId)
      .eq("round", nextRound)
      .eq("match_index", nextIndex)
      .maybeSingle<{ id: string; team1_id: string | null; team2_id: string | null }>();

    if (nextMatch) {
      const assignedSlot = isEvenSlot ? nextMatch.team1_id : nextMatch.team2_id;
      if (assignedSlot === match.winner_id) {
        results.push({ matchId: match.id, fixed: false, reason: "already_advanced" });
        continue;
      }
      await advanceWinnerPublic(match.id, match.winner_id);
      results.push({ matchId: match.id, fixed: true });
      continue;
    }

    // Next match row doesn't exist — check if there should be one (not the final)
    const { count: higherRoundCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournamentId)
      .gt("round", match.round);

    if ((higherRoundCount ?? 0) === 0) {
      // This was the final — no next match expected
      results.push({ matchId: match.id, fixed: false, reason: "is_final" });
      continue;
    }

    // Look up the sibling feeder match to populate both team slots at once
    const siblingIndex = isEvenSlot ? match.match_index + 1 : match.match_index - 1;
    const { data: siblingMatch } = await supabase
      .from("matches")
      .select("winner_id")
      .eq("tournament_id", tournamentId)
      .eq("round", match.round)
      .eq("match_index", siblingIndex)
      .maybeSingle<{ winner_id: string | null }>();

    const siblingWinnerId = siblingMatch?.winner_id ?? null;
    const bothReady = Boolean(siblingWinnerId);

    const newRow = {
      id: randomUUID(),
      tournament_id: tournamentId,
      round: nextRound,
      match_index: nextIndex,
      bo_type: match.bo_type,
      status: "pending",
      team1_id: isEvenSlot ? match.winner_id : siblingWinnerId,
      team2_id: isEvenSlot ? siblingWinnerId : match.winner_id,
      webhook_secret: randomUUID(),
      teams_assigned_at: bothReady ? new Date().toISOString() : null,
    };

    const { error: insertError } = await supabase.from("matches").insert(newRow);
    if (insertError) {
      results.push({ matchId: match.id, fixed: false, reason: `insert_failed: ${insertError.message}` });
      continue;
    }
    results.push({ matchId: match.id, fixed: true, reason: "created_next_match" });
  }

  return Response.json({ fixed: results.filter((r) => r.fixed).length, results });
}
