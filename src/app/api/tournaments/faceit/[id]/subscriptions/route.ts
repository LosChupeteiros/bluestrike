import { NextRequest, NextResponse } from "next/server";
import { getFaceitChampionshipSubscriptions } from "@/lib/faceit";
import { syncCancellations } from "@/lib/faceit-registrations";

// Retorna os times atualmente inscritos na FACEIT e sincroniza cancelamentos no DB.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: championshipId } = await params;

  try {
    const teams = await getFaceitChampionshipSubscriptions(championshipId);

    // Sincroniza cancellations no Supabase em background (best-effort)
    const currentIds = teams.map((t) => t.teamId);
    syncCancellations(championshipId, currentIds).catch(() => {/* best-effort */});

    return NextResponse.json({ teams });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar inscrições." }, { status: 500 });
  }
}
