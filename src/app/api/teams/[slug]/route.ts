import { NextResponse } from "next/server";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";
import { deleteTeam, updateTeamDescription } from "@/lib/teams";

interface TeamRouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function PATCH(request: Request, context: TeamRouteContext) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam." }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    const body = (await request.json()) as { description?: string | null };
    await updateTeamDescription(slug, body.description ?? null, currentProfile.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel atualizar o time.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: TeamRouteContext) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam." }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    await deleteTeam(slug, currentProfile.id);

    return NextResponse.json({
      ok: true,
      redirectPath: `${resolveProfilePath(currentProfile)}?tab=teams&teamDeleted=1`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel excluir o time.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
