import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ensureTournamentBracketGeneratedById } from "@/lib/tournaments";

/**
 * Inicia o campeonato na hora, sem esperar o horário agendado.
 * Fecha as inscrições, antecipa `starts_at` e gera a chave — o que libera as
 * partidas da primeira rodada para check-in.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id: tournamentId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name, status, starts_at, registration_ends")
    .eq("id", tournamentId)
    .maybeSingle<{
      id: string;
      name: string;
      status: string;
      starts_at: string | null;
      registration_ends: string | null;
    }>();

  if (tournamentError) {
    return NextResponse.json({ error: tournamentError.message }, { status: 400 });
  }
  if (!tournament) {
    return NextResponse.json({ error: "Campeonato não encontrado." }, { status: 404 });
  }
  if (tournament.status === "finished") {
    return NextResponse.json({ error: "Esse campeonato já foi encerrado." }, { status: 409 });
  }

  const { count: confirmedCount, error: countError } = await supabase
    .from("tournament_registrations")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .eq("status", "confirmed");

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }

  if ((confirmedCount ?? 0) < 2) {
    return NextResponse.json(
      { error: "É preciso ter pelo menos 2 times confirmados para iniciar." },
      { status: 409 }
    );
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const registrationEndsInFuture =
    tournament.registration_ends && Date.parse(tournament.registration_ends) > now.getTime();

  const { error: updateError } = await supabase
    .from("tournaments")
    .update({
      status: "ongoing",
      starts_at: nowIso,
      // getEffectiveTournamentStatus reabre a inscrição se a janela ainda estiver
      // aberta, então ela precisa ser fechada junto.
      ...(registrationEndsInFuture || !tournament.registration_ends
        ? { registration_ends: nowIso }
        : {}),
    })
    .eq("id", tournamentId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const bracketReady = await ensureTournamentBracketGeneratedById(tournamentId);

  const { count: matchCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  return NextResponse.json({
    ok: true,
    bracketReady,
    confirmedTeams: confirmedCount ?? 0,
    matches: matchCount ?? 0,
  });
}
