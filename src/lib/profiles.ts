import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  type ProfileUpdateInput,
  profileUpdateSchema,
  type UserProfile,
  getProfilePath,
} from "@/lib/profile";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface ProfileRow {
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
  bio: string | null;
  in_game_role: UserProfile["inGameRole"];
  is_admin: boolean | null;
  created_at: string;
  updated_at: string;
}

function mapProfileRow(row: ProfileRow): UserProfile {
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
    bio: row.bio,
    inGameRole: row.in_game_role,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    throw new Error(`Falha ao buscar perfil publico: ${error.message}`);
  }

  return data ? mapProfileRow(data) : null;
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
