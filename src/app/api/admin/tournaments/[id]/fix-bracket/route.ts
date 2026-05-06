import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { buildSeededSingleEliminationBracket, type BracketByeAdvancement, type BracketSeedTeam } from "@/lib/bracket-generation";
import { getCurrentProfile } from "@/lib/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type MatchRow = {
  id: string;
  round: number;
  match_index: number;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  dathost_match_id: string | null;
  matchzy_match_id: number | null;
};

type RegistrationRow = {
  team_id: string;
  registered_at: string;
};

type TeamEloRow = {
  id: string;
  elo: number | null;
};

const STARTED_STATUSES = new Set(["veto", "pre_live", "live", "finished"]);

function hasStartedState(row: MatchRow): boolean {
  return (
    STARTED_STATUSES.has(row.status) ||
    Boolean(row.started_at) ||
    Boolean(row.finished_at) ||
    Boolean(row.dathost_match_id) ||
    Boolean(row.matchzy_match_id)
  );
}

async function advanceInitialByes(
  tournamentId: string,
  byeAdvancements: BracketByeAdvancement[]
): Promise<void> {
  if (byeAdvancements.length === 0) return;

  const supabase = createSupabaseAdminClient();
  for (const bye of byeAdvancements) {
    const { data: nextMatch } = await supabase
      .from("matches")
      .select("id, team1_id, team2_id")
      .eq("tournament_id", tournamentId)
      .eq("round", bye.round)
      .eq("match_index", bye.matchIndex)
      .maybeSingle<{ id: string; team1_id: string | null; team2_id: string | null }>();

    if (!nextMatch) continue;

    const otherTeamAlreadySet = bye.slot === 1 ? Boolean(nextMatch.team2_id) : Boolean(nextMatch.team1_id);
    const update = bye.slot === 1
      ? { team1_id: bye.winnerId, ...(otherTeamAlreadySet ? { teams_assigned_at: new Date().toISOString() } : {}) }
      : { team2_id: bye.winnerId, ...(otherTeamAlreadySet ? { teams_assigned_at: new Date().toISOString() } : {}) };

    await supabase.from("matches").update(update).eq("id", nextMatch.id);
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id: tournamentId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: registrations, error: registrationsError } = await supabase
    .from("tournament_registrations")
    .select("team_id, registered_at")
    .eq("tournament_id", tournamentId)
    .eq("status", "confirmed")
    .order("registered_at", { ascending: true })
    .order("team_id", { ascending: true })
    .returns<RegistrationRow[]>();

  if (registrationsError) {
    return NextResponse.json({ error: registrationsError.message }, { status: 400 });
  }

  const confirmedRegistrations = registrations ?? [];
  if (confirmedRegistrations.length < 2) {
    return NextResponse.json({ error: "A bracket precisa de pelo menos 2 times confirmados." }, { status: 400 });
  }

  const { data: teamRows, error: teamsError } = await supabase
    .from("teams")
    .select("id, elo")
    .in("id", confirmedRegistrations.map((registration) => registration.team_id))
    .returns<TeamEloRow[]>();

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 400 });
  }

  const eloByTeamId = new Map((teamRows ?? []).map((team) => [team.id, team.elo ?? 1000]));
  const seedTeams: BracketSeedTeam[] = confirmedRegistrations.map((registration) => ({
    teamId: registration.team_id,
    registeredAt: registration.registered_at,
    elo: eloByTeamId.get(registration.team_id) ?? 1000,
  }));

  const { data: existingRows, error: matchesError } = await supabase
    .from("matches")
    .select("id, round, match_index, team1_id, team2_id, winner_id, status, started_at, finished_at, dathost_match_id, matchzy_match_id")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("match_index", { ascending: true })
    .returns<MatchRow[]>();

  if (matchesError) {
    return NextResponse.json({ error: matchesError.message }, { status: 400 });
  }

  const rows = existingRows ?? [];
  const lockedRows = rows.filter(hasStartedState);
  if (lockedRows.length > 0) {
    return NextResponse.json(
      {
        error: "A bracket ja tem partida iniciada/finalizada ou vinculada a servidor. Correção automática bloqueada.",
        details: { lockedMatchIds: lockedRows.map((row) => row.id) },
      },
      { status: 409 }
    );
  }

  const generated = buildSeededSingleEliminationBracket(seedTeams);
  const assignedAt = new Date().toISOString();
  const toInsert = generated.matches.map((match) => ({
    id: randomUUID(),
    tournament_id: tournamentId,
    team1_id: match.team1Id,
    team2_id: match.team2Id,
    round: match.round,
    match_index: match.matchIndex,
    status: match.status,
    winner_id: match.winnerId,
    bo_type: match.boType,
    webhook_secret: randomUUID(),
    ...(match.teamsAssigned ? { teams_assigned_at: assignedAt } : {}),
  }));

  const { error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", tournamentId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("matches")
    .upsert(toInsert, { onConflict: "tournament_id,round,match_index", ignoreDuplicates: true });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  await advanceInitialByes(tournamentId, generated.byeAdvancements);

  return NextResponse.json({
    fixed: rows.length + generated.matches.length,
    details: {
      removedRows: rows.length,
      insertedRows: generated.matches.length,
      byeAdvancements: generated.byeAdvancements.length,
      finalRound: generated.model.finalRound,
      thirdPlaceRound: generated.model.thirdPlaceRound,
    },
  });
}
