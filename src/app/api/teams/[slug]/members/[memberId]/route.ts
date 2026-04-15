import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { removeTeamMember } from "@/lib/teams";

interface TeamMemberRouteContext {
  params: Promise<{
    slug: string;
    memberId: string;
  }>;
}

export async function DELETE(_request: Request, context: TeamMemberRouteContext) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam." }, { status: 401 });
  }

  try {
    const { slug, memberId } = await context.params;
    await removeTeamMember(slug, memberId, currentProfile.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel expulsar o jogador.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
