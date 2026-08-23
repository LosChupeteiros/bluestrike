import { NextRequest, NextResponse } from "next/server";
import { processSeriesEnd } from "@/lib/matchzy";
import { resolveMatchViewerAccess } from "@/lib/matches";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Recarrega as estatísticas de uma partida já encerrada.
 *
 * `processSeriesEnd` resolve vencedor, avança o chaveamento, recalcula ELO e
 * destrói o servidor. Duas travas antes de deixar rodar:
 *
 * 1. Só jogador da partida ou admin — antes bastava estar logado, e login é
 *    grátis via Steam.
 * 2. Só partida em estado terminal. Chamar isso numa partida ao vivo era um
 *    botão de sabotagem: com stats parciais no MySQL, encerrava a série no
 *    placar do momento e avançava a chave; sem stats, marcava a partida como
 *    `processing_failed`.
 */
export async function POST(_req: NextRequest, context: RouteContext) {
  const { id: matchId } = await context.params;

  const { matchExists, isPlayer, isAdmin } = await resolveMatchViewerAccess(matchId);
  if (!matchExists) {
    return NextResponse.json({ error: "Partida não encontrada." }, { status: 404 });
  }
  if (!isPlayer && !isAdmin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: match } = await supabase
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .maybeSingle<{ status: string }>();

  // Admin pode forçar em qualquer estado (é o caminho de destravar partida
  // presa). Jogador só recarrega o que já acabou.
  const TERMINAIS = ["finished", "walkover", "processing_failed", "terminated"];
  if (!isAdmin && !TERMINAIS.includes(match?.status ?? "")) {
    return NextResponse.json(
      { error: "A partida ainda não terminou." },
      { status: 409 }
    );
  }

  try {
    await processSeriesEnd(matchId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
