import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { cleanupMatchServer } from "@/lib/matchzy";

/**
 * Volta a partida para o estado logo depois do check-in e antes do veto:
 * status `veto`, sem vetos, sem mapas e sem servidor provisionado.
 * Usado pelo admin quando algo trava no meio do fluxo.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id: matchId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, team1_id, team2_id, status")
    .eq("id", matchId)
    .maybeSingle<{ id: string; team1_id: string | null; team2_id: string | null; status: string }>();

  if (!match) {
    return NextResponse.json({ error: "Partida não encontrada." }, { status: 404 });
  }
  if (!match.team1_id || !match.team2_id) {
    return NextResponse.json(
      { error: "A partida ainda não tem os dois times definidos." },
      { status: 409 }
    );
  }

  // Derruba e apaga o servidor Dathost, se existir (best-effort).
  await cleanupMatchServer(matchId).catch((err: unknown) =>
    console.warn(`[admin/reset/${matchId}] cleanup do servidor falhou:`, err)
  );

  const errors: string[] = [];

  const wipes: Array<[string, PromiseLike<{ error: { message: string } | null }>]> = [
    ["map_vetoes", supabase.from("map_vetoes").delete().eq("match_id", matchId)],
    ["match_maps", supabase.from("match_maps").delete().eq("match_id", matchId)],
    ["matchzy_player_stats", supabase.from("matchzy_player_stats").delete().eq("match_id", matchId)],
    ["matchzy_webhook_events", supabase.from("matchzy_webhook_events").delete().eq("match_id", matchId)],
    ["dathost_servers", supabase.from("dathost_servers").delete().eq("match_id", matchId)],
  ];

  for (const [table, query] of wipes) {
    const { error } = await query;
    if (error) errors.push(`${table}: ${error.message}`);
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      status: "veto",
      ready_team1: false,
      ready_team2: false,
      winner_id: null,
      started_at: null,
      finished_at: null,
      matchzy_match_id: null,
      dathost_match_id: null,
    })
    .eq("id", matchId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // O retrospecto dos times muda se a partida estava finalizada.
  const { syncTeamRecord } = await import("@/lib/teams");
  await Promise.all(
    [match.team1_id, match.team2_id].map((teamId) =>
      syncTeamRecord(teamId).catch((err: unknown) =>
        console.warn(`[admin/reset/${matchId}] retrospecto de ${teamId}:`, err)
      )
    )
  );

  return NextResponse.json({
    ok: true,
    previousStatus: match.status,
    status: "veto",
    warnings: errors,
  });
}
