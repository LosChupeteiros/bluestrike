import type { Team } from "@/types";
import type { UserProfile } from "@/lib/profile";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getTeamsByIds, TEAM_MIN_STARTERS } from "@/lib/teams";
import { getTournamentById, isTournamentRegistrationOpen } from "@/lib/tournaments";

export const BLUES_STRIKE_PAYMENT_REFERENCE_PREFIX = "bluestrike:";
export const REGISTRATION_INTENT_TTL_MS = 15 * 60 * 1000;

export type TournamentRegistrationIntentStatus = "pending" | "paid" | "cancelled" | "expired" | "failed";
export type TournamentRegistrationIntentPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface TournamentRegistrationIntent {
  id: string;
  tournamentId: string;
  teamId: string;
  captainProfileId: string;
  rosterProfileIds: string[];
  status: TournamentRegistrationIntentStatus;
  paymentStatus: TournamentRegistrationIntentPaymentStatus;
  paymentAmount: number;
  paymentMethod: "pix" | null;
  mpPaymentId: string | null;
  paymentReference: string;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: string | null;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TournamentRegistrationIntentRow {
  id: string;
  tournament_id: string;
  team_id: string;
  captain_profile_id: string;
  roster_profile_ids: string[];
  status: string;
  payment_status: string;
  payment_amount: number | null;
  payment_method: "pix" | null;
  mp_payment_id: string | null;
  payment_reference: string;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  pix_expires_at: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapIntentRow(row: TournamentRegistrationIntentRow): TournamentRegistrationIntent {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    teamId: row.team_id,
    captainProfileId: row.captain_profile_id,
    rosterProfileIds: row.roster_profile_ids ?? [],
    status: row.status as TournamentRegistrationIntentStatus,
    paymentStatus: row.payment_status as TournamentRegistrationIntentPaymentStatus,
    paymentAmount: row.payment_amount ?? 0,
    paymentMethod: row.payment_method,
    mpPaymentId: row.mp_payment_id,
    paymentReference: row.payment_reference,
    pixQrCode: row.pix_qr_code,
    pixQrCodeBase64: row.pix_qr_code_base64,
    pixExpiresAt: row.pix_expires_at,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isIntentActive(intent: TournamentRegistrationIntent) {
  return intent.status === "pending" && Date.parse(intent.expiresAt) > Date.now();
}

export function getBlueStrikePaymentExternalReference(intentId: string) {
  return `${BLUES_STRIKE_PAYMENT_REFERENCE_PREFIX}${intentId}`;
}

export function parseBlueStrikePaymentExternalReference(value: string | null | undefined) {
  if (!value?.startsWith(BLUES_STRIKE_PAYMENT_REFERENCE_PREFIX)) {
    return null;
  }

  return value.slice(BLUES_STRIKE_PAYMENT_REFERENCE_PREFIX.length) || null;
}

export async function expireStaleRegistrationIntents(tournamentId?: string) {
  const now = new Date().toISOString();
  let query = createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .update({ status: "expired", payment_status: "failed" })
    .eq("status", "pending")
    .lt("expires_at", now);

  if (tournamentId) {
    query = query.eq("tournament_id", tournamentId);
  }

  await query;
}

export async function getTournamentActiveReservationCount(tournamentId: string, excludeTeamId?: string) {
  await expireStaleRegistrationIntents(tournamentId);

  let query = createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  if (excludeTeamId) {
    query = query.neq("team_id", excludeTeamId);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(`Falha ao contar reservas de inscricao: ${error.message}`);
  }

  return count ?? 0;
}

export async function getTournamentRegistrationIntentById(intentId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .select("*")
    .eq("id", intentId)
    .maybeSingle<TournamentRegistrationIntentRow>();

  if (error) {
    throw new Error(`Falha ao buscar pagamento pendente: ${error.message}`);
  }

  return data ? mapIntentRow(data) : null;
}

export async function getCurrentTournamentRegistrationIntent(tournamentId: string, profileId: string) {
  await expireStaleRegistrationIntents(tournamentId);

  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("captain_profile_id", profileId)
    .in("status", ["pending", "paid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<TournamentRegistrationIntentRow>();

  if (error) {
    throw new Error(`Falha ao buscar sua reserva de inscricao: ${error.message}`);
  }

  return data ? mapIntentRow(data) : null;
}

async function getExistingRegistration(tournamentId: string, teamId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registrations")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("team_id", teamId)
    .neq("status", "withdrawn")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Falha ao validar inscricao existente: ${error.message}`);
  }

  return data;
}

async function hasRosterOverlapWithRegistrations(
  tournamentId: string,
  excludeTeamId: string,
  rosterProfileIds: string[]
): Promise<boolean> {
  if (rosterProfileIds.length === 0) return false;

  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registrations")
    .select("id")
    .eq("tournament_id", tournamentId)
    .neq("team_id", excludeTeamId)
    .neq("status", "withdrawn")
    .overlaps("roster_profile_ids", rosterProfileIds)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Falha ao validar conflito de jogadores: ${error.message}`);
  }

  return data !== null;
}

async function hasRosterOverlapWithActiveIntents(
  tournamentId: string,
  excludeTeamId: string,
  rosterProfileIds: string[]
): Promise<boolean> {
  if (rosterProfileIds.length === 0) return false;

  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .select("id")
    .eq("tournament_id", tournamentId)
    .neq("team_id", excludeTeamId)
    .in("status", ["pending", "paid"])
    .gt("expires_at", new Date().toISOString())
    .overlaps("roster_profile_ids", rosterProfileIds)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Falha ao validar conflito de jogadores: ${error.message}`);
  }

  return data !== null;
}

async function validateTeamEligibility(params: {
  tournamentId: string;
  profile: UserProfile;
  team: Team;
  rosterProfileIds: string[];
  excludeReservationTeamId?: string;
}) {
  const tournament = await getTournamentById(params.tournamentId);

  if (!tournament) {
    throw new Error("Campeonato nao encontrado.");
  }

  if (!isTournamentRegistrationOpen(tournament)) {
    throw new Error("As inscricoes desse campeonato nao estao abertas.");
  }

  if (params.team.captainId !== params.profile.id) {
    throw new Error("A inscricao so pode ser feita pelo capitao do time.");
  }

  if (params.rosterProfileIds.length < TEAM_MIN_STARTERS) {
    throw new Error("Selecione pelo menos 5 jogadores para participar.");
  }

  const memberIds = new Set((params.team.members ?? []).map((m) => m.profileId));
  const allValid = params.rosterProfileIds.every((id) => memberIds.has(id));
  if (!allValid) {
    throw new Error("Todos os jogadores selecionados precisam ser membros do time.");
  }

  if (tournament.minElo !== null && params.team.elo < tournament.minElo) {
    throw new Error(`Seu time precisa de pelo menos ${tournament.minElo} ELO medio para entrar.`);
  }

  if (tournament.maxElo !== null && params.team.elo > tournament.maxElo) {
    throw new Error(`Seu time excede o limite de ${tournament.maxElo} ELO medio desse campeonato.`);
  }

  const existingRegistration = await getExistingRegistration(tournament.id, params.team.id);
  if (existingRegistration) {
    throw new Error("Seu time ja esta inscrito nesse campeonato.");
  }

  const [overlapRegistration, overlapIntent] = await Promise.all([
    hasRosterOverlapWithRegistrations(tournament.id, params.team.id, params.rosterProfileIds),
    hasRosterOverlapWithActiveIntents(tournament.id, params.team.id, params.rosterProfileIds),
  ]);

  if (overlapRegistration || overlapIntent) {
    throw new Error("Um ou mais jogadores selecionados ja estao inscritos neste campeonato por outro time.");
  }

  const activeReservations = await getTournamentActiveReservationCount(
    tournament.id,
    params.excludeReservationTeamId ?? params.team.id
  );
  const occupiedSlots = (tournament.registeredTeamsCount ?? 0) + activeReservations;

  if (occupiedSlots >= tournament.maxTeams) {
    throw new Error("Esse campeonato ja atingiu o limite de vagas.");
  }

  return tournament;
}

export async function createCurrentCaptainRegistrationIntent(params: {
  currentProfile: UserProfile;
  tournamentId: string;
  teamId: string;
  rosterProfileIds: string[];
}) {
  await expireStaleRegistrationIntents(params.tournamentId);

  const teams = await getTeamsByIds([params.teamId], { withMembers: true });
  const team = teams[0] ?? null;
  if (!team) {
    throw new Error("Time nao encontrado.");
  }

  const existingIntent = await getCurrentTournamentRegistrationIntent(params.tournamentId, params.currentProfile.id);
  if (existingIntent?.teamId === params.teamId && isIntentActive(existingIntent)) {
    return { intent: existingIntent, team };
  }

  const tournament = await validateTeamEligibility({
    tournamentId: params.tournamentId,
    profile: params.currentProfile,
    team,
    rosterProfileIds: params.rosterProfileIds,
  });

  if ((tournament.entryFee ?? 0) <= 0) {
    throw new Error("Esse campeonato nao precisa de pagamento PIX.");
  }

  const now = Date.now();
  const expiresAt = new Date(now + REGISTRATION_INTENT_TTL_MS).toISOString();
  const paymentReference = `BST-${tournament.id.slice(0, 8).toUpperCase()}-${team.id.slice(0, 6).toUpperCase()}-${String(now).slice(-6)}`;

  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .insert({
      tournament_id: tournament.id,
      team_id: team.id,
      captain_profile_id: params.currentProfile.id,
      roster_profile_ids: params.rosterProfileIds,
      payment_amount: tournament.entryFee ?? 0,
      payment_method: "pix",
      payment_reference: paymentReference,
      expires_at: expiresAt,
    })
    .select("*")
    .single<TournamentRegistrationIntentRow>();

  if (error) {
    throw new Error(`Falha ao reservar a inscricao: ${error.message}`);
  }

  return { intent: mapIntentRow(data), team };
}

export async function saveRegistrationIntentPix(params: {
  intentId: string;
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}) {
  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .update({
      mp_payment_id: params.paymentId,
      pix_qr_code: params.qrCode,
      pix_qr_code_base64: params.qrCodeBase64,
      pix_expires_at: params.expiresAt,
    })
    .eq("id", params.intentId)
    .select("*")
    .single<TournamentRegistrationIntentRow>();

  if (error) {
    throw new Error(`Falha ao salvar o PIX da inscricao: ${error.message}`);
  }

  return mapIntentRow(data);
}

async function markIntentFailed(intentId: string) {
  await createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .update({ status: "failed", payment_status: "failed" })
    .eq("id", intentId)
    .eq("status", "pending");
}

export async function finalizeBlueStrikeRegistrationIntent(intentId: string, mpPaymentId: string) {
  const intent = await getTournamentRegistrationIntentById(intentId);
  if (!intent) {
    throw new Error("Reserva de inscricao nao encontrada.");
  }

  const teams = await getTeamsByIds([intent.teamId], { withMembers: true });
  const team = teams[0] ?? null;
  if (!team) {
    await markIntentFailed(intent.id);
    throw new Error("Time da inscricao nao encontrado.");
  }

  const tournament = await validateTeamEligibility({
    tournamentId: intent.tournamentId,
    profile: { id: intent.captainProfileId } as UserProfile,
    team,
    rosterProfileIds: intent.rosterProfileIds,
    excludeReservationTeamId: intent.teamId,
  }).catch(async (error) => {
    const existingRegistration = await getExistingRegistration(intent.tournamentId, intent.teamId);
    if (existingRegistration) {
      return null;
    }
    await markIntentFailed(intent.id);
    throw error;
  });

  const paymentReference = intent.paymentReference;
  const existingRegistration = await getExistingRegistration(intent.tournamentId, intent.teamId);

  if (!existingRegistration) {
    const { error: insertError } = await createSupabaseAdminClient()
      .from("tournament_registrations")
      .insert({
        tournament_id: intent.tournamentId,
        team_id: intent.teamId,
        roster_profile_ids: intent.rosterProfileIds,
        status: "confirmed",
        payment_status: "paid",
        payment_amount: tournament?.entryFee ?? intent.paymentAmount,
        payment_reference: paymentReference,
        payment_method: "pix",
      });

    if (insertError) {
      throw new Error(`Falha ao confirmar inscricao paga: ${insertError.message}`);
    }
  }

  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registration_intents")
    .update({
      status: "paid",
      payment_status: "paid",
      mp_payment_id: mpPaymentId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", intent.id)
    .select("*")
    .single<TournamentRegistrationIntentRow>();

  if (error) {
    throw new Error(`Falha ao marcar pagamento como aprovado: ${error.message}`);
  }

  return mapIntentRow(data);
}
