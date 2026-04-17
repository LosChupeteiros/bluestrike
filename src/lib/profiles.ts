import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  type ProfileBioInput,
  profileBioSchema,
  type ProfileUpdateInput,
  profileUpdateSchema,
  type UserProfile,
  getProfilePath,
} from "@/lib/profile";
import { getFaceitTeams, type FaceitTeam } from "@/lib/faceit";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export interface ProfileRow {
  id: string;
  public_id: number;
  steam_id: string;
  steam_persona_name: string;
  steam_avatar_url: string | null;
  steam_profile_url: string | null;
  steam_level: number | null;
  elo: number | null;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  birth_date: string | null;
  email: string | null;
  bio: string | null;
  in_game_role: UserProfile["inGameRole"];
  is_admin: boolean | null;
  created_at: string;
  updated_at: string;
  // Faceit
  faceit_id: string | null;
  faceit_nickname: string | null;
  faceit_avatar: string | null;
  faceit_elo: number | null;
  faceit_level: number | null;
  faceit_team_ids: string[] | null;
}

export function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    publicId: row.public_id,
    steamId: row.steam_id,
    steamPersonaName: row.steam_persona_name,
    steamAvatarUrl: row.steam_avatar_url,
    steamProfileUrl: row.steam_profile_url,
    steamLevel: row.steam_level ?? 0,
    elo: row.elo ?? 1000,
    fullName: row.full_name,
    cpf: row.cpf,
    phone: row.phone,
    birthDate: row.birth_date,
    email: row.email,
    bio: row.bio,
    inGameRole: row.in_game_role,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    faceitId: row.faceit_id ?? null,
    faceitNickname: row.faceit_nickname ?? null,
    faceitAvatar: row.faceit_avatar ?? null,
    faceitElo: row.faceit_elo ?? null,
    faceitLevel: row.faceit_level ?? null,
    faceitTeamIds: Array.isArray(row.faceit_team_ids) ? (row.faceit_team_ids as string[]) : null,
  };
}

function createProfileQuery() {
  return createSupabaseAdminClient().from("profiles").select("*");
}

export function resolveProfilePath(profile: Pick<UserProfile, "publicId">) {
  return getProfilePath(profile.publicId);
}

export async function getProfileById(profileId: string) {
  const { data, error } = await createProfileQuery().eq("id", profileId).maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(`Falha ao buscar perfil por id: ${error.message}`);
  }

  return data ? mapProfileRow(data) : null;
}

export async function getProfileByPublicId(publicId: number) {
  const { data, error } = await createProfileQuery()
    .eq("public_id", publicId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(`Falha ao buscar perfil público: ${error.message}`);
  }

  return data ? mapProfileRow(data) : null;
}

export async function getProfilesByIds(profileIds: string[]) {
  if (profileIds.length === 0) {
    return [];
  }

  const { data, error } = await createProfileQuery()
    .in("id", [...new Set(profileIds)])
    .returns<ProfileRow[]>();

  if (error) {
    throw new Error(`Falha ao buscar perfis por ids: ${error.message}`);
  }

  return (data ?? []).map(mapProfileRow);
}

export async function getProfilesByPublicIds(publicIds: number[]) {
  if (publicIds.length === 0) {
    return [];
  }

  const { data, error } = await createProfileQuery()
    .in("public_id", [...new Set(publicIds)])
    .returns<ProfileRow[]>();

  if (error) {
    throw new Error(`Falha ao buscar perfis por public ids: ${error.message}`);
  }

  return (data ?? []).map(mapProfileRow);
}

export async function getProfileBySteamId(steamId: string) {
  const { data, error } = await createProfileQuery()
    .eq("steam_id", steamId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(`Falha ao buscar perfil por steam id: ${error.message}`);
  }

  return data ? mapProfileRow(data) : null;
}

export async function upsertSteamProfile(input: {
  steamId: string;
  steamPersonaName: string;
  steamAvatarUrl: string | null;
  steamProfileUrl: string | null;
  steamLevel: number;
}) {
  const { data, error } = await createSupabaseAdminClient()
    .from("profiles")
    .upsert(
      {
        steam_id: input.steamId,
        steam_persona_name: input.steamPersonaName,
        steam_avatar_url: input.steamAvatarUrl,
        steam_profile_url: input.steamProfileUrl,
        steam_level: input.steamLevel,
      },
      {
        onConflict: "steam_id",
      }
    )
    .select("*")
    .single<ProfileRow>();

  if (error) {
    throw new Error(`Falha ao salvar perfil da Steam: ${error.message}`);
  }

  return mapProfileRow(data);
}

export async function updateProfile(profileId: string, input: ProfileUpdateInput) {
  const parsedInput = profileUpdateSchema.parse(input);

  const { data, error } = await createSupabaseAdminClient()
    .from("profiles")
    .update({
      full_name: parsedInput.fullName,
      cpf: parsedInput.cpf,
      phone: parsedInput.phone,
      birth_date: parsedInput.birthDate,
      email: parsedInput.email,
      bio: parsedInput.bio,
      in_game_role: parsedInput.inGameRole,
    })
    .eq("id", profileId)
    .select("*")
    .single<ProfileRow>();

  if (error) {
    throw new Error(`Falha ao atualizar perfil: ${error.message}`);
  }

  return mapProfileRow(data);
}

export async function updateProfileBio(profileId: string, input: ProfileBioInput) {
  const parsedInput = profileBioSchema.parse(input);

  const { data, error } = await createSupabaseAdminClient()
    .from("profiles")
    .update({
      bio: parsedInput.bio,
      in_game_role: parsedInput.inGameRole,
    })
    .eq("id", profileId)
    .select("*")
    .single<ProfileRow>();

  if (error) {
    throw new Error(`Falha ao atualizar bio: ${error.message}`);
  }

  return mapProfileRow(data);
}

const PLAYERS_PAGE_SIZE = 18;

interface PlayersListOptions {
  page?: number;
  pageSize?: number;
  query?: string;
}

export async function listPublicProfiles(options: PlayersListOptions = {}) {
  const pageSize = Math.max(1, Math.min(options.pageSize ?? PLAYERS_PAGE_SIZE, 36));
  const page = Math.max(1, options.page ?? 1);
  const query = options.query?.trim() ?? "";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dbQuery = createSupabaseAdminClient()
    .from("profiles")
    .select("*", { count: "exact" })
    .order("elo", { ascending: false })
    .order("created_at", { ascending: true });

  if (query) {
    const escaped = query.replace(/[%_,]/g, "");
    dbQuery = dbQuery.ilike("steam_persona_name", `%${escaped}%`);
  }

  const { data, count, error } = await dbQuery.range(from, to).returns<ProfileRow[]>();

  if (error) {
    throw new Error(`Falha ao listar jogadores: ${error.message}`);
  }

  const profiles = (data ?? []).map(mapProfileRow);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { profiles, total, page, pageSize, totalPages, query };
}

/**
 * Busca ELO e level atuais na API Faceit e persiste no Supabase se mudaram.
 * Retorna o perfil atualizado (ou o original em caso de erro/sem chave).
 */
export async function refreshFaceitStats(profile: UserProfile): Promise<UserProfile> {
  if (!profile.faceitId) return profile;

  const apiKey = process.env.FACEIT_API_KEY;
  if (!apiKey) return profile;

  try {
    const res = await fetch(
      `https://open.faceit.com/data/v4/players/${profile.faceitId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      }
    );

    if (!res.ok) return profile;

    const data = await res.json();
    const gameData = (data.games?.cs2 ?? data.games?.csgo) as
      | { faceit_elo: number; skill_level: number }
      | undefined;

    const newElo = gameData?.faceit_elo ?? null;
    const newLevel = gameData?.skill_level ?? null;
    const newAvatar = (data.avatar as string | undefined) ?? profile.faceitAvatar;
    const newNickname = (data.nickname as string | undefined) ?? profile.faceitNickname ?? "";

    // Só persiste se algo mudou
    if (
      newElo === profile.faceitElo &&
      newLevel === profile.faceitLevel &&
      newAvatar === profile.faceitAvatar &&
      newNickname === profile.faceitNickname
    ) {
      return profile;
    }

    return await updateFaceitProfile(profile.id, {
      faceitId: profile.faceitId,
      faceitNickname: newNickname,
      faceitAvatar: newAvatar,
      faceitElo: newElo,
      faceitLevel: newLevel,
    });
  } catch {
    // Retorna dados em cache silenciosamente se a API falhar
    return profile;
  }
}

/**
 * Busca times CS2 atualizados da API Faceit, persiste se mudaram, e retorna os dados frescos.
 * Em caso de falha da API, retorna o snapshot salvo no DB como fallback.
 */
/**
 * Busca times CS2 atualizados na API Faceit, persiste apenas os team_ids se mudaram,
 * e retorna os dados completos para exibição.
 * Em caso de falha da API, retorna array vazio (IDs guardados no DB ficam intactos).
 */
export async function syncFaceitTeams(profile: UserProfile): Promise<FaceitTeam[]> {
  if (!profile.faceitId) return [];

  const freshTeams = await getFaceitTeams(profile.faceitId);
  const freshIds = freshTeams.map((t) => t.teamId).sort();
  const storedIds = [...(profile.faceitTeamIds ?? [])].sort();

  // Persiste apenas os IDs, e somente se mudaram
  if (JSON.stringify(freshIds) !== JSON.stringify(storedIds)) {
    const { error } = await createSupabaseAdminClient()
      .from("profiles")
      .update({ faceit_team_ids: freshIds })
      .eq("id", profile.id);

    if (error) {
      console.error("[syncFaceitTeams] falha ao salvar team_ids:", error.message);
    }
  }

  return freshTeams;
}

export interface FaceitProfileInput {
  faceitId: string;
  faceitNickname: string;
  faceitAvatar: string | null;
  faceitElo: number | null;
  faceitLevel: number | null;
}

export async function updateFaceitProfile(profileId: string, input: FaceitProfileInput) {
  const { data, error } = await createSupabaseAdminClient()
    .from("profiles")
    .update({
      faceit_id: input.faceitId,
      faceit_nickname: input.faceitNickname,
      faceit_avatar: input.faceitAvatar,
      faceit_elo: input.faceitElo,
      faceit_level: input.faceitLevel,
    })
    .eq("id", profileId)
    .select("*")
    .single<ProfileRow>();

  if (error) {
    throw new Error(`Falha ao vincular FACEIT: ${error.message}`);
  }

  return mapProfileRow(data);
}

export async function getCurrentProfile() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return getProfileById(session.profileId);
}

export async function requireCurrentProfile(nextPath = "/profile") {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  return profile;
}
