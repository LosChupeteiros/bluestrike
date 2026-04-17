import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getRegistration, createRegistration } from "@/lib/faceit-registrations";
import { getFaceitTeams } from "@/lib/faceit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: championshipId } = await params;

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
  }
  if (!profile.faceitId) {
    return NextResponse.json(
      { error: "Conecte sua conta FACEIT no perfil antes de se inscrever." },
      { status: 422 }
    );
  }

  // Verifica se já está inscrito
  const existing = await getRegistration(championshipId, profile.id);
  if (existing) {
    return NextResponse.json(
      { error: "Seu time já está inscrito neste campeonato." },
      { status: 409 }
    );
  }

  let body: { teamId?: string; teamName?: string; teamAvatar?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { teamId, teamName, teamAvatar } = body;
  if (!teamId || !teamName) {
    return NextResponse.json({ error: "Dados do time incompletos." }, { status: 400 });
  }

  // Valida via API FACEIT que o time tem 5 jogadores
  const teams = await getFaceitTeams(profile.faceitId);
  const team = teams.find((t) => t.teamId === teamId);

  if (!team) {
    return NextResponse.json(
      { error: "Time não encontrado na sua conta FACEIT. Verifique o time selecionado." },
      { status: 404 }
    );
  }

  const memberCount = team.members.length;
  if (memberCount < 5) {
    return NextResponse.json(
      {
        error: `O time precisa ter pelo menos 5 jogadores para se inscrever. Atualmente tem ${memberCount} membro${memberCount !== 1 ? "s" : ""}.`,
      },
      { status: 422 }
    );
  }

  try {
    const registration = await createRegistration({
      championshipId,
      profileId: profile.id,
      faceitTeamId: teamId,
      faceitTeamName: teamName,
      faceitTeamAvatar: teamAvatar ?? null,
    });
    return NextResponse.json({ registration });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar inscrição.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
