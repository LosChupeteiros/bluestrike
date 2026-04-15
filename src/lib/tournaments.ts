import type { Tournament, TournamentRegistration } from "@/types";
import type { UserProfile } from "@/lib/profile";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTeamForProfile, getTeamsByIds, TEAM_MIN_STARTERS } from "@/lib/teams";

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

  return attachRegistrations((data ?? []).map(mapTournamentRow));
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

  const [tournament] = await attachRegistrations([mapTournamentRow(data)]);
  return tournament ?? null;
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

function tournamentRegistrationOpen(tournament: Tournament) {
  const now = Date.now();

  if (tournament.status !== "open") {
    return false;
  }

  if (tournament.registrationStarts && now < Date.parse(tournament.registrationStarts)) {
    return false;
  }

  if (tournament.registrationEnds && now > Date.parse(tournament.registrationEnds)) {
    return false;
  }

  return true;
}

export async function registerCurrentCaptainTeamForTournament(input: {
  currentProfile: UserProfile;
  tournamentId: string;
  paymentConfirmed: boolean;
}) {
  const tournament = await getTournamentById(input.tournamentId);

  if (!tournament) {
    throw new Error("Campeonato nao encontrado.");
  }

  if (!tournamentRegistrationOpen(tournament)) {
    throw new Error("As inscricoes desse campeonato nao estao abertas.");
  }

  const team = await getCurrentTeamForProfile(input.currentProfile.id);

  if (!team) {
    throw new Error("Voce precisa criar um time antes de se inscrever.");
  }

  if (team.captainId !== input.currentProfile.id) {
    throw new Error("A inscricao so pode ser feita pelo capitao do time.");
  }

  const starters = team.members?.filter((member) => member.isStarter) ?? [];

  if (starters.length < TEAM_MIN_STARTERS) {
    throw new Error("Seu time precisa de pelo menos 5 titulares para se inscrever.");
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

  if ((tournament.entryFee ?? 0) > 0 && !input.paymentConfirmed) {
    throw new Error("Confirme o pagamento fake via PIX antes de finalizar a inscricao.");
  }

  const paymentReference = `PIX-${tournament.id.slice(0, 8).toUpperCase()}-${team.id.slice(0, 6).toUpperCase()}`;

  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registrations")
    .insert({
      tournament_id: tournament.id,
      team_id: team.id,
      status: "confirmed",
      payment_status: (tournament.entryFee ?? 0) > 0 ? "paid" : "pending",
      payment_amount: tournament.entryFee ?? 0,
      payment_reference: paymentReference,
      payment_method: (tournament.entryFee ?? 0) > 0 ? "pix" : null,
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
