import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Team, TeamMember, TournamentRegistration } from "@/types";
import type { UserProfile } from "@/lib/profile";
import { isProfileComplete, getMissingRequiredFields } from "@/lib/profile";
import { getProfilesByIds } from "@/lib/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const TEAM_PAGE_SIZE = 9;
const TEAM_MAX_MEMBERS = 6;
const TEAM_MIN_STARTERS = 5;

interface TeamRow {
  id: string;
  slug: string;
  name: string;
  tag: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  join_code: string;
  password_hash: string | null;
  captain_id: string;
  is_recruiting: boolean;
  elo: number | null;
  wins: number | null;
  losses: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMemberRow {
  id: string;
  team_id: string;
  profile_id: string;
  in_game_role: TeamMember["inGameRole"];
  is_starter: boolean;
  joined_at: string;
}

interface CreateTeamInput {
  name: string;
  tag: string;
  description: string | null;
  password: string | null;
}

interface TeamListOptions {
  page?: number;
  pageSize?: number;
  query?: string;
}

function mapTeamRow(row: TeamRow): Team {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tag: row.tag,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    joinCode: row.join_code,
    passwordHash: row.password_hash ?? undefined,
    captainId: row.captain_id,
    isRecruiting: row.is_recruiting,
    elo: row.elo ?? 1000,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    teamId: row.team_id,
    profileId: row.profile_id,
    inGameRole: row.in_game_role,
    isStarter: row.is_starter,
    joinedAt: row.joined_at,
  };
}

function normalizeTag(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
}

export function slugifyTeamName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function hashTeamPassword(password: string | null) {
  if (!password) {
    return null;
  }

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyTeamPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) {
    return true;
  }

  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function normalizeDescription(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized.slice(0, 400) : null;
}

function validateCreateTeamInput(input: CreateTeamInput) {
  const name = input.name.trim().slice(0, 48);
  const tag = normalizeTag(input.tag);
  const description = normalizeDescription(input.description);
  const password = input.password?.trim() ? input.password.trim().slice(0, 32) : null;

  if (name.length < 3) {
    throw new Error("Informe um nome de time com pelo menos 3 caracteres.");
  }

  if (tag.length < 2 || tag.length > 5) {
    throw new Error("A tag precisa ter entre 2 e 5 caracteres.");
  }

  if (password && password.length < 4) {
    throw new Error("A senha precisa ter pelo menos 4 caracteres.");
  }

  return {
    name,
    tag,
    description,
    password,
  };
}

async function fetchTeamRows(teamIds: string[]) {
  if (teamIds.length === 0) {
    return [];
  }

  const { data, error } = await createSupabaseAdminClient()
    .from("teams")
    .select("*")
    .in("id", [...new Set(teamIds)])
    .returns<TeamRow[]>();

  if (error) {
    throw new Error(`Falha ao buscar times: ${error.message}`);
  }

  return data ?? [];
}

export async function getTeamsByIds(teamIds: string[], options?: { withMembers?: boolean }) {
  const rows = await fetchTeamRows(teamIds);
  const teams = rows.filter((team) => team.is_active).map(mapTeamRow);

  if (options?.withMembers === false) {
    return teams;
  }

  return attachMembers(teams);
}

async function fetchTeamMembers(teamIds: string[]) {
  if (teamIds.length === 0) {
    return [];
  }

  const { data, error } = await createSupabaseAdminClient()
    .from("team_members")
    .select("*")
    .in("team_id", [...new Set(teamIds)])
    .order("is_starter", { ascending: false })
    .order("joined_at", { ascending: true })
    .returns<TeamMemberRow[]>();

  if (error) {
    throw new Error(`Falha ao buscar membros dos times: ${error.message}`);
  }

  return data ?? [];
}

async function attachMembers(teams: Team[]) {
  if (teams.length === 0) {
    return teams;
  }

  const members = await fetchTeamMembers(teams.map((team) => team.id));
  const profiles = await getProfilesByIds(members.map((member) => member.profile_id));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const membersByTeamId = new Map<string, TeamMember[]>();

  for (const memberRow of members) {
    const mapped = mapTeamMemberRow(memberRow);
    const current = membersByTeamId.get(mapped.teamId) ?? [];
    current.push({
      ...mapped,
      profile: profilesById.get(mapped.profileId),
    });
    membersByTeamId.set(mapped.teamId, current);
  }

  return teams.map((team) => ({
    ...team,
    members: membersByTeamId.get(team.id) ?? [],
  }));
}

async function getProfileActiveTeamMembership(profileId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("team_members")
    .select("id, team_id")
    .eq("profile_id", profileId)
    .returns<Array<{ id: string; team_id: string }>>();

  if (error) {
    throw new Error(`Falha ao consultar o time atual do jogador: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return null;
  }

  const teamRows = await fetchTeamRows(data.map((item) => item.team_id));
  const activeTeam = teamRows.find((team) => team.is_active);

  if (!activeTeam) {
    return null;
  }

  return data.find((item) => item.team_id === activeTeam.id) ?? null;
}

async function ensureUniqueTeamIdentity(name: string, tag: string, ignoreTeamId?: string) {
  const client = createSupabaseAdminClient();

  const [{ data: sameName, error: nameError }, { data: sameTag, error: tagError }] = await Promise.all([
    client
      .from("teams")
      .select("id")
      .eq("is_active", true)
      .ilike("name", name)
      .returns<Array<{ id: string }>>(),
    client
      .from("teams")
      .select("id")
      .eq("is_active", true)
      .ilike("tag", tag)
      .returns<Array<{ id: string }>>(),
  ]);

  if (nameError) {
    throw new Error(`Falha ao validar o nome do time: ${nameError.message}`);
  }

  if (tagError) {
    throw new Error(`Falha ao validar a tag do time: ${tagError.message}`);
  }

  const duplicatedName = (sameName ?? []).some((row) => row.id !== ignoreTeamId);
  const duplicatedTag = (sameTag ?? []).some((row) => row.id !== ignoreTeamId);

  if (duplicatedName) {
    throw new Error("Ja existe um time ativo com esse nome.");
  }

  if (duplicatedTag) {
    throw new Error("Ja existe um time ativo com essa tag.");
  }
}

async function createUniqueSlug(baseName: string) {
  const baseSlug = slugifyTeamName(baseName);

  if (!baseSlug) {
    throw new Error("Nao foi possivel gerar a URL do time.");
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await createSupabaseAdminClient()
      .from("teams")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new Error(`Falha ao validar o slug do time: ${error.message}`);
    }

    if (!data) {
      return candidate;
    }
  }

  throw new Error("Nao foi possivel reservar uma URL unica para o time.");
}

async function syncRecruitingState(teamId: string) {
  const members = await fetchTeamMembers([teamId]);
  const shouldRecruit = members.length < TEAM_MAX_MEMBERS;

  const { error } = await createSupabaseAdminClient()
    .from("teams")
    .update({ is_recruiting: shouldRecruit })
    .eq("id", teamId);

  if (error) {
    throw new Error(`Falha ao atualizar o estado de recrutamento do time: ${error.message}`);
  }
}

async function syncTeamElo(teamId: string) {
  const members = await fetchTeamMembers([teamId]);

  if (members.length === 0) {
    return;
  }

  const profiles = await getProfilesByIds(members.map((m) => m.profile_id));
  const avgElo =
    profiles.length > 0
      ? Math.round(profiles.reduce((sum, p) => sum + (p.elo ?? 1000), 0) / profiles.length)
      : 1000;

  const { error } = await createSupabaseAdminClient()
    .from("teams")
    .update({ elo: avgElo })
    .eq("id", teamId);

  if (error) {
    throw new Error(`Falha ao atualizar ELO do time: ${error.message}`);
  }
}

export async function listPublicTeams(options: TeamListOptions = {}) {
  const pageSize = Math.max(1, Math.min(options.pageSize ?? TEAM_PAGE_SIZE, 24));
  const page = Math.max(1, options.page ?? 1);
  const query = options.query?.trim() ?? "";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let teamQuery = createSupabaseAdminClient()
    .from("teams")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("is_recruiting", { ascending: false })
    .order("updated_at", { ascending: false });

  if (query) {
    const escaped = query.replace(/[%_,]/g, "");
    teamQuery = teamQuery.or(`name.ilike.%${escaped}%,tag.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  const [{ data, count, error }, { count: recruitingCount, error: recruitingError }] = await Promise.all([
    teamQuery.range(from, to).returns<TeamRow[]>(),
    createSupabaseAdminClient()
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("is_recruiting", true),
  ]);

  if (error) {
    throw new Error(`Falha ao listar times: ${error.message}`);
  }

  if (recruitingError) {
    throw new Error(`Falha ao contar times recrutando: ${recruitingError.message}`);
  }

  const teams = await attachMembers((data ?? []).map(mapTeamRow));
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    teams,
    total,
    page,
    pageSize,
    totalPages,
    recruitingCount: recruitingCount ?? 0,
    query,
  };
}

export async function getTeamBySlug(slug: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<TeamRow>();

  if (error) {
    throw new Error(`Falha ao buscar time: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const [team] = await attachMembers([mapTeamRow(data)]);
  return team ?? null;
}

export async function getTeamByJoinCode(code: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("teams")
    .select("*")
    .eq("join_code", code)
    .eq("is_active", true)
    .maybeSingle<TeamRow>();

  if (error) {
    throw new Error(`Falha ao buscar convite do time: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const [team] = await attachMembers([mapTeamRow(data)]);
  return team ?? null;
}

export async function getTeamsForProfile(profileId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("team_members")
    .select("team_id")
    .eq("profile_id", profileId)
    .returns<Array<{ team_id: string }>>();

  if (error) {
    throw new Error(`Falha ao buscar os times do jogador: ${error.message}`);
  }

  return getTeamsByIds(
    (data ?? []).map((row) => row.team_id),
    { withMembers: true }
  );
}

export async function getCurrentTeamForProfile(profileId: string) {
  const teams = await getTeamsForProfile(profileId);
  return teams[0] ?? null;
}

export async function createTeamForCaptain(captain: UserProfile, input: CreateTeamInput) {
  if (!isProfileComplete(captain)) {
    const missing = getMissingRequiredFields(captain);
    throw new Error(`Complete seu cadastro antes de criar um time. Faltam: ${missing.join(", ")}.`);
  }

  const normalizedInput = validateCreateTeamInput(input);
  const currentMembership = await getProfileActiveTeamMembership(captain.id);

  if (currentMembership) {
    throw new Error("Voce ja faz parte de um time ativo.");
  }

  await ensureUniqueTeamIdentity(normalizedInput.name, normalizedInput.tag);
  const slug = await createUniqueSlug(normalizedInput.name);
  const passwordHash = hashTeamPassword(normalizedInput.password);

  const { data: createdTeam, error: createTeamError } = await createSupabaseAdminClient()
    .from("teams")
    .insert({
      slug,
      name: normalizedInput.name,
      tag: normalizedInput.tag,
      description: normalizedInput.description,
      password_hash: passwordHash,
      captain_id: captain.id,
      is_recruiting: true,
    })
    .select("*")
    .single<TeamRow>();

  if (createTeamError) {
    throw new Error(`Falha ao criar time: ${createTeamError.message}`);
  }

  const { error: createMemberError } = await createSupabaseAdminClient()
    .from("team_members")
    .insert({
      team_id: createdTeam.id,
      profile_id: captain.id,
      in_game_role: captain.inGameRole,
      is_starter: true,
    });

  if (createMemberError) {
    await createSupabaseAdminClient().from("teams").delete().eq("id", createdTeam.id);
    throw new Error(`Falha ao vincular o capitao ao time: ${createMemberError.message}`);
  }

  await syncTeamElo(createdTeam.id);
  const [team] = await attachMembers([mapTeamRow(createdTeam)]);
  return team;
}

export async function joinTeamByCode(profile: UserProfile, code: string, password: string | null | undefined) {
  if (!isProfileComplete(profile)) {
    const missing = getMissingRequiredFields(profile);
    throw new Error(`Complete seu cadastro antes de entrar em um time. Faltam: ${missing.join(", ")}.`);
  }

  const team = await getTeamByJoinCode(code);

  if (!team) {
    throw new Error("Convite de time invalido ou expirado.");
  }

  if (!team.isActive) {
    throw new Error("Esse time nao esta mais ativo.");
  }

  const currentMembership = await getProfileActiveTeamMembership(profile.id);

  if (currentMembership) {
    throw new Error("Voce ja faz parte de um time ativo.");
  }

  if (!verifyTeamPassword(password?.trim() ?? "", team.passwordHash)) {
    throw new Error("A senha informada nao confere.");
  }

  const members = team.members ?? [];

  if (members.length >= TEAM_MAX_MEMBERS) {
    throw new Error("Esse time ja atingiu o limite maximo de jogadores.");
  }

  const isStarter = members.filter((member) => member.isStarter).length < TEAM_MIN_STARTERS;

  const { error } = await createSupabaseAdminClient()
    .from("team_members")
    .insert({
      team_id: team.id,
      profile_id: profile.id,
      in_game_role: profile.inGameRole,
      is_starter: isStarter,
    });

  if (error) {
    throw new Error(`Falha ao entrar no time: ${error.message}`);
  }

  await Promise.all([syncRecruitingState(team.id), syncTeamElo(team.id)]);
  return getTeamBySlug(team.slug);
}

export async function removeTeamMember(teamSlug: string, memberId: string, requesterProfileId: string) {
  const team = await getTeamBySlug(teamSlug);

  if (!team) {
    throw new Error("Time nao encontrado.");
  }

  if (team.captainId !== requesterProfileId) {
    throw new Error("Apenas o capitao pode expulsar jogadores.");
  }

  const targetMember = team.members?.find((member) => member.id === memberId);

  if (!targetMember) {
    throw new Error("Jogador nao encontrado nesse time.");
  }

  if (targetMember.profileId === requesterProfileId) {
    throw new Error("O capitao nao pode se expulsar. Exclua o time para sair dele.");
  }

  const { error } = await createSupabaseAdminClient()
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("team_id", team.id);

  if (error) {
    throw new Error(`Falha ao expulsar jogador: ${error.message}`);
  }

  await Promise.all([syncRecruitingState(team.id), syncTeamElo(team.id)]);
}

async function getActiveRegistrationsForTeam(teamId: string) {
  interface ActiveRegistrationRow {
    id: string;
    tournament_id: string;
    status: TournamentRegistration["status"];
  }

  const { data, error } = await createSupabaseAdminClient()
    .from("tournament_registrations")
    .select("id, tournament_id, status")
    .eq("team_id", teamId)
    .neq("status", "withdrawn")
    .returns<ActiveRegistrationRow[]>();

  if (error) {
    throw new Error(`Falha ao consultar inscricoes do time: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  const { data: tournaments, error: tournamentsError } = await createSupabaseAdminClient()
    .from("tournaments")
    .select("id, status")
    .in(
      "id",
      data.map((registration) => registration.tournament_id)
    )
    .returns<Array<{ id: string; status: string }>>();

  if (tournamentsError) {
    throw new Error(`Falha ao consultar campeonatos do time: ${tournamentsError.message}`);
  }

  const tournamentStatusById = new Map((tournaments ?? []).map((tournament) => [tournament.id, tournament.status]));
  return data.filter((registration) => {
    const tournamentStatus = tournamentStatusById.get(registration.tournament_id);
    return tournamentStatus && tournamentStatus !== "finished";
  });
}

export async function updateTeamDescription(teamSlug: string, description: string | null, requesterProfileId: string) {
  const team = await getTeamBySlug(teamSlug);

  if (!team) {
    throw new Error("Time nao encontrado.");
  }

  if (team.captainId !== requesterProfileId) {
    throw new Error("Apenas o capitao pode editar o time.");
  }

  const normalized = normalizeDescription(description);

  const { error } = await createSupabaseAdminClient()
    .from("teams")
    .update({ description: normalized, updated_at: new Date().toISOString() })
    .eq("id", team.id);

  if (error) {
    throw new Error(`Falha ao atualizar descricao: ${error.message}`);
  }
}

export async function deleteTeam(teamSlug: string, requesterProfileId: string) {
  const team = await getTeamBySlug(teamSlug);

  if (!team) {
    throw new Error("Time nao encontrado.");
  }

  if (team.captainId !== requesterProfileId) {
    throw new Error("Apenas o capitao pode excluir o time.");
  }

  const activeRegistrations = await getActiveRegistrationsForTeam(team.id);

  if (activeRegistrations.length > 0) {
    throw new Error("Esse time ainda possui campeonatos ativos e nao pode ser excluido agora.");
  }

  // team_members e tournament_registrations têm ON DELETE CASCADE, basta deletar o time
  const { error: deleteTeamError } = await createSupabaseAdminClient()
    .from("teams")
    .delete()
    .eq("id", team.id);

  if (deleteTeamError) {
    throw new Error(`Falha ao excluir time: ${deleteTeamError.message}`);
  }
}

export { TEAM_MAX_MEMBERS, TEAM_MIN_STARTERS, TEAM_PAGE_SIZE };
