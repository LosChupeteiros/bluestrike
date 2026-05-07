import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type NotificationType = "match_start" | "checkin_reminder" | "result" | "system" | "team_invite";

export interface NotificationRow {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

/**
 * Cria notificações de "partida liberada" para todos os membros (titulares e reservas)
 * dos dois times de uma partida. Idempotente via unique index parcial em (profile_id, link)
 * para type='match_start'.
 */
export async function createMatchStartNotifications(matchId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, tournament_id, team1_id, team2_id, round")
    .eq("id", matchId)
    .maybeSingle<{ id: string; tournament_id: string | null; team1_id: string | null; team2_id: string | null; round: number | null }>();

  if (!match || !match.team1_id || !match.team2_id) return;

  const teamIds = [match.team1_id, match.team2_id];

  const [{ data: teams }, { data: tournament }, { data: members }] = await Promise.all([
    supabase.from("teams").select("id, name, tag").in("id", teamIds).returns<{ id: string; name: string; tag: string }[]>(),
    match.tournament_id
      ? supabase.from("tournaments").select("id, name").eq("id", match.tournament_id).maybeSingle<{ id: string; name: string }>()
      : Promise.resolve({ data: null as { id: string; name: string } | null }),
    supabase.from("team_members").select("team_id, profile_id").in("team_id", teamIds).returns<{ team_id: string; profile_id: string }[]>(),
  ]);

  if (!members || members.length === 0) return;

  const teamById = new Map<string, { name: string; tag: string }>();
  for (const t of teams ?? []) teamById.set(t.id, { name: t.name, tag: t.tag });

  const team1 = teamById.get(match.team1_id);
  const team2 = teamById.get(match.team2_id);
  if (!team1 || !team2) return;

  const link = match.tournament_id
    ? `/tournaments/${match.tournament_id}/matches/${match.id}`
    : `/matches/${match.id}`;

  const tournamentName = tournament?.name ?? "BlueStrike";

  const profileIds = members.map((m) => m.profile_id);

  // Idempotency: filter out profile_ids that already have a match_start notif for this link.
  const { data: existing } = await supabase
    .from("notifications")
    .select("profile_id")
    .eq("type", "match_start")
    .eq("link", link)
    .in("profile_id", profileIds)
    .returns<{ profile_id: string }[]>();
  const alreadyNotified = new Set((existing ?? []).map((r) => r.profile_id));

  const rows = members
    .filter((m) => !alreadyNotified.has(m.profile_id))
    .map((m) => {
      const isTeam1 = m.team_id === match.team1_id;
      const own = isTeam1 ? team1 : team2;
      const opp = isTeam1 ? team2 : team1;
      return {
        profile_id: m.profile_id,
        type: "match_start" as const,
        title: "Sua partida foi liberada",
        message: `${own.tag} vs ${opp.tag} · ${tournamentName}`,
        link,
        read: false,
      };
    });

  if (rows.length === 0) return;

  await supabase.from("notifications").insert(rows);
}
