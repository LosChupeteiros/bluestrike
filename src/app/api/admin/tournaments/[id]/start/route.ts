import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { ensureTournamentBracketGeneratedById, getTournamentById } from "@/lib/tournaments";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Inicia o campeonato na hora, sem esperar a data agendada.
 *
 * Fecha as inscricoes (o status "ongoing" ja derruba
 * `isTournamentRegistrationOpen`) e gera a chave com os times confirmados,
 * liberando as partidas da primeira rodada.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id: tournamentId } = await params;
  const tournament = await getTournamentById(tournamentId);

  if (!tournament) {
    return NextResponse.json({ error: "Campeonato nao encontrado." }, { status: 404 });
  }

  if (tournament.status === "finished") {
    return NextResponse.json({ error: "Esse campeonato ja foi encerrado." }, { status: 400 });
  }

  const confirmedTeams = (tournament.registrations ?? []).filter(
    (registration) => registration.status === "confirmed"
  ).length;

  if (confirmedTeams < 2) {
    return NextResponse.json(
      { error: `A chave precisa de pelo menos 2 times confirmados. Hoje tem ${confirmedTeams}.` },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  // Se a data de inicio ainda estava no futuro, ela passa a ser agora — senao a
  // pagina mostraria "em andamento" com um inicio agendado para depois.
  const shouldMoveStart =
    !tournament.startsAt || Date.parse(tournament.startsAt) > Date.now();

  const { error: updateError } = await supabase
    .from("tournaments")
    .update({
      status: "ongoing",
      ...(shouldMoveStart ? { starts_at: now } : {}),
    })
    .eq("id", tournamentId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const bracketReady = await ensureTournamentBracketGeneratedById(tournamentId);

  return NextResponse.json({
    ok: true,
    startedAt: shouldMoveStart ? now : tournament.startsAt,
    confirmedTeams,
    bracketReady,
  });
}
