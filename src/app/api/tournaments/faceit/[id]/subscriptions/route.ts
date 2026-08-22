import { NextRequest, NextResponse } from "next/server";
import { fetchFaceitChampionshipSubscriptions } from "@/lib/faceit";
import { syncCancellations } from "@/lib/faceit-registrations";

// Retorna os times atualmente inscritos na FACEIT e sincroniza cancelamentos no DB.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: championshipId } = await params;

  const result = await fetchFaceitChampionshipSubscriptions(championshipId);

  if (!result.ok) {
    // Falha ao falar com a FACEIT não pode virar lista vazia: quem consome
    // interpretaria isso como "todo mundo cancelou".
    console.warn(`[faceit/subscriptions] ${championshipId}: ${result.reason}`);
    return NextResponse.json({ error: "Erro ao buscar inscrições." }, { status: 502 });
  }

  // Sincroniza cancelamentos no Supabase em background (best-effort).
  const currentIds = result.teams.map((t) => t.teamId).filter(Boolean);
  syncCancellations(championshipId, currentIds).catch(() => {/* best-effort */});

  return NextResponse.json({ teams: result.teams });
}
