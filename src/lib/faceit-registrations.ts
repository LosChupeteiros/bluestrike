import { createSupabaseAdminClient } from "@/lib/supabase/server";

export interface FaceitRegistration {
  id: string;
  championshipId: string;
  profileId: string;
  faceitTeamId: string;
  faceitTeamName: string;
  faceitTeamAvatar: string | null;
  paymentStatus: "pending" | "paid";
  friendCheck: boolean;
  teamConfirmed: boolean;
  registrationStatus: "active" | "cancelled";
  createdAt: string;
}

type RegistrationRow = {
  id: string;
  championship_id: string;
  profile_id: string;
  faceit_team_id: string;
  faceit_team_name: string;
  faceit_team_avatar: string | null;
  payment_status: string;
  friend_check: boolean;
  team_confirmed: boolean;
  registration_status: string;
  created_at: string;
};

function mapRow(row: RegistrationRow): FaceitRegistration {
  return {
    id: row.id,
    championshipId: row.championship_id,
    profileId: row.profile_id,
    faceitTeamId: row.faceit_team_id,
    faceitTeamName: row.faceit_team_name,
    faceitTeamAvatar: row.faceit_team_avatar,
    paymentStatus: row.payment_status as "pending" | "paid",
    friendCheck: row.friend_check,
    teamConfirmed: row.team_confirmed,
    registrationStatus: (row.registration_status ?? "active") as "active" | "cancelled",
    createdAt: row.created_at,
  };
}

export async function getRegistration(
  championshipId: string,
  profileId: string
): Promise<FaceitRegistration | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("faceit_registrations")
      .select("*")
      .eq("championship_id", championshipId)
      .eq("profile_id", profileId)
      .maybeSingle<RegistrationRow>();
    return data ? mapRow(data) : null;
  } catch {
    return null;
  }
}

export async function createRegistration(params: {
  championshipId: string;
  profileId: string;
  faceitTeamId: string;
  faceitTeamName: string;
  faceitTeamAvatar: string | null;
}): Promise<FaceitRegistration> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("faceit_registrations")
    .insert({
      championship_id: params.championshipId,
      profile_id: params.profileId,
      faceit_team_id: params.faceitTeamId,
      faceit_team_name: params.faceitTeamName,
      faceit_team_avatar: params.faceitTeamAvatar,
    })
    .select("*")
    .single<RegistrationRow>();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function markPaymentPaid(registrationId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("faceit_registrations")
    .update({ payment_status: "paid", updated_at: new Date().toISOString() })
    .eq("id", registrationId);
}

export async function updateLiveChecks(
  registrationId: string,
  friendCheck: boolean,
  teamConfirmed: boolean
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("faceit_registrations")
    .update({
      friend_check: friendCheck,
      team_confirmed: teamConfirmed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);
}

// Compara as inscrições ativas no DB com os times atualmente inscritos na FACEIT.
// Times que sumiram da FACEIT têm registration_status atualizado para 'cancelled'.
// Retorna os IDs FACEIT dos times que foram marcados como cancelados nesta chamada.
export async function syncCancellations(
  championshipId: string,
  currentFaceitTeamIds: string[]
): Promise<string[]> {
  const supabase = createSupabaseAdminClient();

  // Busca todas as inscrições ativas e confirmadas para o campeonato
  const { data: rows } = await supabase
    .from("faceit_registrations")
    .select("id, faceit_team_id")
    .eq("championship_id", championshipId)
    .eq("registration_status", "active")
    .eq("team_confirmed", true)
    .returns<{ id: string; faceit_team_id: string }[]>();

  if (!rows || rows.length === 0) return [];

  const activeSet = new Set(currentFaceitTeamIds);
  const toCancel = rows.filter((r) => !activeSet.has(r.faceit_team_id));

  if (toCancel.length === 0) return [];

  await supabase
    .from("faceit_registrations")
    .update({
      registration_status: "cancelled",
      team_confirmed: false,
      updated_at: new Date().toISOString(),
    })
    .in(
      "id",
      toCancel.map((r) => r.id)
    );

  return toCancel.map((r) => r.faceit_team_id);
}
