import type { Tournament, TournamentRegistration } from "@/types";
import type { UserProfile } from "@/lib/profile";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getTeamsByIds, TEAM_MIN_STARTERS } from "@/lib/teams";
import { randomUUID } from "crypto";
import {
  getEffectiveTournamentStatus,
  isTournamentRegistrationOpen,
} from "@/lib/tournament-status";
import { buildSeededSingleEliminationBracket, type BracketMatchDraft, type BracketSeedTeam } from "@/lib/bracket-generation";

export { getEffectiveTournamentStatus, isTournamentRegistrationOpen } from "@/lib/tournament-status";

interface TournamentRow {
  id: string;
  name: string;
  description: string | null;
  rules: string[] | null;
  prize_total: number | null;
  prize_breakdown: Array<{ place: string; amount: number }> | null;
  banner_url: string | null;
  status: Tournament["status"];
  format: Tournament["format"];
  max_teams: number | null;
  min_elo: number | null;
  max_elo: number | null;
  check_in_required: boolean | null;
  check_in_window_mins: number | null;
  region: string | null;
  organizer_id: string | null;
  organizer_name: string | null;
  featured: boolean | null;
  tags: string[] | null;
  registration_starts: string | null;
  registration_ends: string | null;
  starts_at: string | null;
  ends_at: string | null;
  entry_fee?: number | null;
  created_at: string;
  updated_at: string;
}

interface TournamentRegistrationRow {
  id: string;
  tournament_id: string;
  team_id: string;
  status: TournamentRegistration["status"];
  checked_in: boolean;
  checked_in_at: string | null;
  registered_at: string;
  payment_status?: "pending" | "paid" | "failed" | "refunded" | null;
  payment_amount?: number | null;
  payment_reference?: string | null;
  payment_method?: string | null;
}

interface TournamentListOptions {
  query?: string;
  status?: Tournament["status"] | "all";
}

interface CreateTournamentInput {
  name: string;
  description: string | null;
  rules: string[];
  prizeTotal: number;
  entryFee: number;
  maxTeams: number;
  format: Tournament["format"];
  status: Tournament["status"];
  minElo: number | null;
  maxElo: number | null;
  checkInRequired: boolean;
  checkInWindowMins: number;
  region: string;
  tags: string[];
  registrationStarts: string | null;
  registrationEnds: string | null;
  startsAt: string | null;
  endsAt: string | null;
  bannerUrl: string | null;
  featured: boolean;
}

function mapTournamentRow(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    rules: row.rules ?? [],
    prizeTotal: row.prize_total ?? 0,
    prizeBreakdown: row.prize_breakdown ?? [],
    bannerUrl: row.banner_url,
    status: row.status,
    format: row.format,
    maxTeams: row.max_teams ?? 16,
    minElo: row.min_elo,
    maxElo: row.max_elo,
    checkInRequired: row.check_in_required ?? true,
    checkInWindowMins: row.check_in_window_mins ?? 30,
    region: row.region ?? "BR",
    organizerId: row.organizer_id,
    organizerName: row.organizer_name ?? "BlueStrike",
    featured: Boolean(row.featured),
    tags: row.tags ?? [],
    registrationStarts: row.registration_starts,
    registrationEnds: row.registration_ends,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    entryFee: row.entry_fee ?? 0,
  };
}

function mapRegistrationRow(row: TournamentRegistrationRow): TournamentRegistration {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    teamId: row.team_id,
    status: row.status,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    registeredAt: row.registered_at,
    paymentStatus: row.payment_status ?? "pending",
    paymentAmount: row.payment_amount ?? 0,
    paymentReference: row.payment_reference ?? null,
    paymentMethod: row.payment_method ?? null,
  };
}

function cleanString(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized.slice(0, maxLength) : null;
}

function parseDateTime(value: string | null | undefined) {
  const normalized = cleanString(value, 40);
  return normalized && !Number.isNaN(Date.parse(normalized)) ? normalized : null;
}

function normalizeArray(values: string[] | null | undefined, itemMaxLength: number) {
  return (values ?? [])
    .map((value) => cleanString(value, itemMaxLength))
    .filter((value): value is string => Boolean(value));
}

function validateTournamentInput(input: CreateTournamentInput) {
  const name = cleanString(input.name, 120);
  const description = cleanString(input.description, 1200);
  const rules = normalizeArray(input.rules, 240);
  const tags = normalizeArray(input.tags, 32).slice(0, 8);
  const bannerUrl = cleanString(input.bannerUrl, 500);
  const region = cleanString(input.region, 16) ?? "BR";
  const maxTeams = Math.max(2, Math.min(input.maxTeams, 128));
  const prizeTotal = Math.max(0, Math.trunc(input.prizeTotal));
  const entryFee = Math.max(0, Math.trunc(input.entryFee));
  const checkInWindowMins = Math.max(5, Math.min(input.checkInWindowMins, 180));
  const registrationStarts = parseDateTime(input.registrationStarts);
  const registrationEnds = parseDateTime(input.registrationEnds);
  const startsAt = parseDateTime(input.startsAt);
  const endsAt = parseDateTime(input.endsAt);

  if (!name || name.length < 4) {
    throw new Error("Informe um nome de campeonato com pelo menos 4 caracteres.");
  }

  if (!description || description.length < 16) {
    throw new Error("Descreva melhor o campeonato para publicacao.");
  }

  if (registrationStarts && registrationEnds && Date.parse(registrationStarts) > Date.parse(registrationEnds)) {
    throw new Error("A janela de inscricao esta invalida.");
  }

  if (startsAt && endsAt && Date.parse(startsAt) > Date.parse(endsAt)) {
    throw new Error("As datas do campeonato estao invalidas.");
  }

  return {
    ...input,
    name,
    description,
    rules,
    tags,
    bannerUrl,
    region,
    maxTeams,
    prizeTotal,
    entryFee,
    checkInWindowMins,
    registrationStarts,
    registrationEnds,
    startsAt,
    endsAt,
  };
}

async function getRegistrationRowsByTournamentId(tournamentId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registrations")
    .select("*")
    .eq("tournament_id", tournamentId)
    .neq("status", "withdrawn")
    .order("registered_at", { ascending: true })
    .returns<TournamentRegistrationRow[]>();

  if (error) {
    throw new Error(`Falha ao buscar inscricoes do campeonato: ${error.message}`);
  }

  return data ?? [];
}

async function attachRegistrations(tournaments: Tournament[]) {
  if (tournaments.length === 0) {
    return tournaments;
  }

  const registrations = (
    await Promise.all(tournaments.map((tournament) => getRegistrationRowsByTournamentId(tournament.id)))
  ).flat();
  const teams = await getTeamsByIds(
    registrations.map((registration) => registration.team_id),
    { withMembers: true }
  );
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const registrationsByTournamentId = new Map<string, TournamentRegistration[]>();

  for (const registrationRow of registrations) {
    const mapped = mapRegistrationRow(registrationRow);
    const current = registrationsByTournamentId.get(mapped.tournamentId) ?? [];
    current.push({
      ...mapped,
      team: teamsById.get(mapped.teamId),
    });
    registrationsByTournamentId.set(mapped.tournamentId, current);
  }

  return tournaments.map((tournament) => {
    const tournamentRegistrations = registrationsByTournamentId.get(tournament.id) ?? [];
    return {
      ...tournament,
      registrations: tournamentRegistrations,
      registeredTeamsCount: tournamentRegistrations.length,
    };
  });
}

export async function listTournaments(options: TournamentListOptions = {}) {
  const query = options.query?.trim() ?? "";
  const status = options.status ?? "all";

  let tournamentQuery = createSupabaseAdminClient()
    .from("tournaments")
    .select("*");

  if (status !== "all") {
    tournamentQuery = tournamentQuery.eq("status", status);
  }

  if (query) {
    const escaped = query.replace(/[%_,]/g, "");
    tournamentQuery = tournamentQuery.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  const { data, error } = await tournamentQuery
    .order("featured", { ascending: false })
    .order("starts_at", { ascending: true })
    .returns<TournamentRow[]>();

  if (error) {
    throw new Error(`Falha ao listar campeonatos: ${error.message}`);
  }

  const tournaments = await attachRegistrations((data ?? []).map(mapTournamentRow));
  return Promise.all(tournaments.map(syncTournamentStatus));
}

export async function getTournamentById(tournamentId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .maybeSingle<TournamentRow>();

  if (error) {
    throw new Error(`Falha ao buscar campeonato: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const [withRegistrations] = await attachRegistrations([mapTournamentRow(data)]);
  if (!withRegistrations) return null;
  return syncTournamentStatus(withRegistrations);
}

export async function createTournament(adminProfile: UserProfile, input: CreateTournamentInput) {
  if (!adminProfile.isAdmin) {
    throw new Error("Apenas administradores podem cadastrar campeonatos.");
  }

  const parsed = validateTournamentInput(input);

  const { data, error } = await createSupabaseAdminClient()
    .from("tournaments")
    .insert({
      name: parsed.name,
      description: parsed.description,
      rules: parsed.rules,
      prize_total: parsed.prizeTotal,
      prize_breakdown: [
        {
          place: "1 lugar",
          amount: parsed.prizeTotal,
        },
      ],
      banner_url: parsed.bannerUrl,
      status: parsed.status,
      format: parsed.format,
      max_teams: parsed.maxTeams,
      min_elo: parsed.minElo,
      max_elo: parsed.maxElo,
      check_in_required: parsed.checkInRequired,
      check_in_window_mins: parsed.checkInWindowMins,
      region: parsed.region,
      organizer_id: adminProfile.id,
      organizer_name: "BlueStrike E-Sports",
      featured: parsed.featured,
      tags: parsed.tags,
      registration_starts: parsed.registrationStarts,
      registration_ends: parsed.registrationEnds,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      entry_fee: parsed.entryFee,
    })
    .select("*")
    .single<TournamentRow>();

  if (error) {
    throw new Error(`Falha ao criar campeonato: ${error.message}`);
  }

  return mapTournamentRow(data);
}

async function syncTournamentStatus(tournament: Tournament): Promise<Tournament> {
  const effective = getEffectiveTournamentStatus(tournament);
  if (effective === tournament.status) {
    if (effective === "ongoing") {
      await ensureTournamentBracketGenerated(tournament);
    }
    return tournament;
  }

  const { data: transitioned, error } = await createSupabaseAdminClient()
    .from("tournaments")
    .update({ status: effective })
    .eq("id", tournament.id)
    .eq("status", tournament.status)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Falha ao atualizar status do campeonato: ${error.message}`);
  }

  const updated = { ...tournament, status: effective };

  if (
    transitioned &&
    effective === "ongoing" &&
    (tournament.status === "open" || tournament.status === "upcoming")
  ) {
    await ensureTournamentBracketGenerated(updated);
  }

  return updated;
}

async function getBracketSeedTeams(tournament: Tournament): Promise<BracketSeedTeam[]> {
  const confirmedRegistrations = (tournament.registrations ?? []).filter((r) => r.status === "confirmed");
  const teamsById = new Map(
    (await getTeamsByIds(
      confirmedRegistrations
        .filter((registration) => !registration.team)
        .map((registration) => registration.teamId),
      { withMembers: false }
    )).map((team) => [team.id, team])
  );

  return confirmedRegistrations.map((registration) => ({
    teamId: registration.teamId,
    registeredAt: registration.registeredAt,
    elo: registration.team?.elo ?? teamsById.get(registration.teamId)?.elo ?? 1000,
  }));
}

function applyByeAdvancementsToDrafts(
  matches: BracketMatchDraft[],
  byeAdvancements: ReturnType<typeof buildSeededSingleEliminationBracket>["byeAdvancements"]
): BracketMatchDraft[] {
  const drafts = matches.map((match) => ({ ...match }));
  for (const bye of byeAdvancements) {
    const target = drafts.find((match) => match.round === bye.round && match.matchIndex === bye.matchIndex);
    if (!target) continue;
    if (bye.slot === 1) target.team1Id = bye.winnerId;
    else target.team2Id = bye.winnerId;
    target.teamsAssigned = Boolean(target.team1Id && target.team2Id);
  }
  return drafts;
}

type ExistingBracketRow = {
  round: number;
  match_index: number;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
  bo_type: 1 | 3 | 5;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  dathost_match_id: string | null;
  matchzy_match_id: number | null;
};

function hasLockedBracketRow(row: ExistingBracketRow): boolean {
  return (
    row.status === "veto" ||
    row.status === "pre_live" ||
    row.status === "live" ||
    row.status === "finished" ||
    Boolean(row.started_at) ||
    Boolean(row.finished_at) ||
    Boolean(row.dathost_match_id) ||
    Boolean(row.matchzy_match_id)
  );
}

function bracketMatchesExpectedShape(
  existing: ExistingBracketRow[],
  expected: ReturnType<typeof buildSeededSingleEliminationBracket>["matches"]
): boolean {
  if (existing.length !== expected.length) return false;

  const rowsBySlot = new Map(existing.map((row) => [`${row.round}:${row.match_index}`, row]));
  return expected.every((match) => {
    const row = rowsBySlot.get(`${match.round}:${match.matchIndex}`);
    return (
      row &&
      row.team1_id === match.team1Id &&
      row.team2_id === match.team2Id &&
      row.winner_id === match.winnerId &&
      row.bo_type === match.boType &&
      row.status === match.status
    );
  });
}

export async function ensureTournamentBracketGenerated(tournament: Tournament): Promise<boolean> {
  const seedTeams = await getBracketSeedTeams(tournament);
  if (seedTeams.length < 2) return false;

  const supabase = createSupabaseAdminClient();
  const { data: existingRows, error: existingError } = await supabase
    .from("matches")
    .select("round, match_index, team1_id, team2_id, winner_id, bo_type, status, started_at, finished_at, dathost_match_id, matchzy_match_id")
    .eq("tournament_id", tournament.id)
    .returns<ExistingBracketRow[]>();

  if (existingError) {
    throw new Error(`Failed to inspect tournament bracket: ${existingError.message}`);
  }

  const existing = existingRows ?? [];
  if (existing.some(hasLockedBracketRow)) return false;

  const generated = buildSeededSingleEliminationBracket(seedTeams);
  const expectedMatches = applyByeAdvancementsToDrafts(generated.matches, generated.byeAdvancements);
  if (bracketMatchesExpectedShape(existing, expectedMatches)) return false;

  const assignedAt = new Date().toISOString();
  const toInsert = expectedMatches.map((match) => ({
    id: randomUUID(),
    tournament_id: tournament.id,
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

  if (existing.length > 0) {
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("tournament_id", tournament.id);

    if (deleteError) {
      throw new Error(`Failed to reset tournament bracket: ${deleteError.message}`);
    }
  }

  const { error: insertError } = await supabase
    .from("matches")
    .upsert(toInsert, { onConflict: "tournament_id,round,match_index", ignoreDuplicates: true });

  if (insertError) {
    throw new Error(`Failed to create tournament bracket: ${insertError.message}`);
  }

  return true;
}

export async function ensureTournamentBracketGeneratedById(tournamentId: string): Promise<boolean> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) return false;
  if (tournament.status !== "ongoing") return false;
  const generated = await ensureTournamentBracketGenerated(tournament);
  if (generated) return true;

  const seedTeams = await getBracketSeedTeams(tournament);
  const expectedCount = buildSeededSingleEliminationBracket(seedTeams).matches.length;
  const { count } = await createSupabaseAdminClient()
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  return Boolean(count && count >= expectedCount);
}

function tournamentRegistrationOpen(tournament: Tournament) {
  return isTournamentRegistrationOpen(tournament);
}

export async function registerCurrentCaptainTeamForTournament(input: {
  currentProfile: UserProfile;
  tournamentId: string;
  teamId: string;
  rosterProfileIds: string[];
  paymentConfirmed: boolean;
}) {
  const tournament = await getTournamentById(input.tournamentId);

  if (!tournament) {
    throw new Error("Campeonato nao encontrado.");
  }

  if (!tournamentRegistrationOpen(tournament)) {
    throw new Error("As inscricoes desse campeonato nao estao abertas.");
  }

  const teams = await getTeamsByIds([input.teamId], { withMembers: true });
  const team = teams[0] ?? null;

  if (!team) {
    throw new Error("Time nao encontrado.");
  }

  if (team.captainId !== input.currentProfile.id) {
    throw new Error("A inscricao so pode ser feita pelo capitao do time.");
  }

  if (input.rosterProfileIds.length < TEAM_MIN_STARTERS) {
    throw new Error("Selecione pelo menos 5 jogadores para participar.");
  }

  const memberIds = new Set((team.members ?? []).map((m) => m.profileId));
  if (!input.rosterProfileIds.every((id) => memberIds.has(id))) {
    throw new Error("Todos os jogadores selecionados precisam ser membros do time.");
  }

  if ((tournament.registeredTeamsCount ?? 0) >= tournament.maxTeams) {
    throw new Error("Esse campeonato ja atingiu o limite de vagas.");
  }

  if (tournament.minElo !== null && team.elo < tournament.minElo) {
    throw new Error(`Seu time precisa de pelo menos ${tournament.minElo} ELO medio para entrar.`);
  }

  if (tournament.maxElo !== null && team.elo > tournament.maxElo) {
    throw new Error(`Seu time excede o limite de ${tournament.maxElo} ELO medio desse campeonato.`);
  }

  const { data: existingRegistration, error: existingError } = await createSupabaseAdminClient()
    .from("tournament_registrations")
    .select("id")
    .eq("tournament_id", tournament.id)
    .eq("team_id", team.id)
    .neq("status", "withdrawn")
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(`Falha ao validar a inscricao atual do time: ${existingError.message}`);
  }

  if (existingRegistration) {
    throw new Error("Seu time ja esta inscrito nesse campeonato.");
  }

  if ((tournament.entryFee ?? 0) > 0) {
    throw new Error("Use o pagamento PIX para confirmar a inscricao desse campeonato.");
  }

  const paymentReference = `FREE-${tournament.id.slice(0, 8).toUpperCase()}-${team.id.slice(0, 6).toUpperCase()}`;

  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registrations")
    .insert({
      tournament_id: tournament.id,
      team_id: team.id,
      roster_profile_ids: input.rosterProfileIds,
      status: "confirmed",
      payment_status: "paid",
      payment_amount: 0,
      payment_reference: paymentReference,
      payment_method: null,
    })
    .select("*")
    .single<TournamentRegistrationRow>();

  if (error) {
    throw new Error(`Falha ao registrar o time no campeonato: ${error.message}`);
  }

  return {
    tournament,
    team,
    registration: mapRegistrationRow(data),
  };
}
