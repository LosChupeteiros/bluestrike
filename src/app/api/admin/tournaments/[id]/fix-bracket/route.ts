import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { advanceWinnerPublic } from "@/lib/matches";
import { getBracketRoundModel } from "@/lib/bracket-model";

type MatchRow = {
  id: string;
  round: number;
  match_index: number;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
  status: string;
  bo_type: 1 | 3 | 5;
  teams_assigned_at: string | null;
  created_at: string;
};

type RegistrationRow = {
  team_id: string;
  registered_at: string;
};

function isFinished(row: MatchRow): boolean {
  return (row.status === "finished" || row.status === "walkover") && Boolean(row.winner_id);
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: registrations } = await supabase
    .from("tournament_registrations")
    .select("team_id, registered_at")
    .eq("tournament_id", tournamentId)
    .neq("status", "withdrawn")
    .order("registered_at", { ascending: true })
    .order("team_id", { ascending: true })
    .returns<RegistrationRow[]>();

  const activeTeams = registrations ?? [];
  const model = getBracketRoundModel(activeTeams.length);

  const { data: initialRows } = await supabase
    .from("matches")
    .select("id, round, match_index, team1_id, team2_id, winner_id, status, bo_type, teams_assigned_at, created_at")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("match_index", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<MatchRow[]>();

  const rows = initialRows ?? [];
  const results: string[] = [];

  async function updateRow(row: MatchRow, patch: Partial<MatchRow>) {
    await supabase.from("matches").update(patch).eq("id", row.id);
    Object.assign(row, patch);
    results.push(`updated:${row.id}`);
  }

  async function ensureRow(round: number, matchIndex: number, boType: 1 | 3 | 5): Promise<MatchRow> {
    const existing = rows.find((m) => m.round === round && m.match_index === matchIndex);
    if (existing) {
      if (existing.bo_type !== boType) await updateRow(existing, { bo_type: boType });
      return existing;
    }

    const { data: created, error } = await supabase
      .from("matches")
      .insert({
        id: randomUUID(),
        tournament_id: tournamentId,
        round,
        match_index: matchIndex,
        status: "pending",
        bo_type: boType,
        webhook_secret: randomUUID(),
      })
      .select("id, round, match_index, team1_id, team2_id, winner_id, status, bo_type, teams_assigned_at, created_at")
      .single<MatchRow>();

    if (error) throw new Error(`Falha ao criar linha da bracket: ${error.message}`);
    rows.push(created);
    results.push(`created:${created.id}`);
    return created;
  }

  async function moveRow(row: MatchRow, round: number, matchIndex: number, boType: 1 | 3 | 5) {
    if (row.round === round && row.match_index === matchIndex && row.bo_type === boType) return;
    await updateRow(row, { round, match_index: matchIndex, bo_type: boType });
  }

  const maxRound = Math.max(0, ...rows.map((m) => m.round));
  const brokenFinal = rows.find((m) => m.round === maxRound && m.match_index === 0) ?? null;
  const brokenThird = rows.find((m) => m.round === maxRound && m.match_index === 1) ?? null;

  if (model.hasThirdPlace && brokenThird) {
    await moveRow(brokenThird, model.thirdPlaceRound!, 0, 1);
  } else if (!model.hasThirdPlace && brokenThird && !isFinished(brokenThird)) {
    await updateRow(brokenThird, { status: "cancelled" });
  }

  if (brokenFinal) {
    await moveRow(brokenFinal, model.finalRound, 0, 3);
  }

  const lastNormalRound = model.semifinalRound ?? model.finalRound;
  for (let round = 1; round <= lastNormalRound; round++) {
    const expectedMatches = Math.max(1, Math.pow(2, lastNormalRound - round + 1));
    for (let matchIndex = 0; matchIndex < expectedMatches; matchIndex++) {
      await ensureRow(round, matchIndex, round === model.finalRound ? 3 : 1);
    }
  }

  await ensureRow(model.finalRound, 0, 3);
  if (model.hasThirdPlace && model.thirdPlaceRound !== null) {
    await ensureRow(model.thirdPlaceRound, 0, 1);
  }

  const firstRoundRows = rows
    .filter((m) => m.round === 1)
    .sort((a, b) => a.match_index - b.match_index);

  const assigned = new Set(rows.flatMap((m) => [m.team1_id, m.team2_id]).filter(Boolean) as string[]);
  const remainingTeams = activeTeams.map((r) => r.team_id).filter((teamId) => !assigned.has(teamId));
  let reseededSlots = 0;

  for (const row of firstRoundRows) {
    const patch: Partial<MatchRow> = {};
    if (!row.team1_id && remainingTeams.length > 0) {
      patch.team1_id = remainingTeams.shift() ?? null;
      reseededSlots++;
    }
    if (!row.team2_id && remainingTeams.length > 0) {
      patch.team2_id = remainingTeams.shift() ?? null;
      reseededSlots++;
    }
    const team1 = patch.team1_id ?? row.team1_id;
    const team2 = patch.team2_id ?? row.team2_id;
    if (team1 && team2 && !row.teams_assigned_at) patch.teams_assigned_at = new Date().toISOString();
    if (Object.keys(patch).length > 0) await updateRow(row, patch);
  }

  const finishedRows = rows
    .filter(isFinished)
    .sort((a, b) => a.round - b.round || a.match_index - b.match_index);

  let advanced = 0;
  for (const match of finishedRows) {
    if (!match.winner_id) continue;
    await advanceWinnerPublic(match.id, match.winner_id);
    advanced++;
  }

  return Response.json({
    fixed: results.length + advanced + reseededSlots,
    details: {
      changedRows: results.length,
      advanced,
      reseededSlots,
      finalRound: model.finalRound,
      thirdPlaceRound: model.thirdPlaceRound,
    },
  });
}
