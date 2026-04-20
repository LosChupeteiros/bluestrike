import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { submitMatchResult } from "@/lib/matches";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { winnerId?: string };

    if (!body.winnerId) {
      return NextResponse.json({ error: "Informe o vencedor da partida." }, { status: 400 });
    }

    await submitMatchResult(currentProfile, id, body.winnerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível registrar o resultado.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
