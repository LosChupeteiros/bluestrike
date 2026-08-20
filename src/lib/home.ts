import type { UserProfile } from "@/lib/profile";
import { listPublicProfiles } from "@/lib/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export interface HomeTopPlayer {
  profile: UserProfile;
  eloChange: number;
}

export interface HomeSnapshot {
  topPlayers: HomeTopPlayer[];
}

async function getTopPlayers(): Promise<HomeTopPlayer[]> {
  try {
    const { profiles } = await listPublicProfiles({ page: 1, pageSize: 5 });
    if (profiles.length === 0) return [];

    const profileIds = profiles.map((profile) => profile.id);
    const { data, error } = await createSupabaseAdminClient()
      .from("elo_history")
      .select("profile_id, delta, created_at")
      .in("profile_id", profileIds)
      .order("created_at", { ascending: false })
      .limit(60)
      .returns<{ profile_id: string; delta: number; created_at: string }[]>();

    if (error) {
      console.error("[home] Falha ao carregar tendência de ELO:", error.message);
    }

    const recentDelta = new Map<string, number>();
    for (const row of data ?? []) {
      if (!recentDelta.has(row.profile_id)) {
        recentDelta.set(row.profile_id, row.delta);
      }
    }

    return profiles.map((profile) => ({
      profile,
      eloChange: recentDelta.get(profile.id) ?? 0,
    }));
  } catch (error) {
    console.error("[home] Falha ao carregar top jogadores:", error);
    return [];
  }
}

export async function getHomeSnapshot(): Promise<HomeSnapshot> {
  return { topPlayers: await getTopPlayers() };
}
