import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { upsertFaceitPrize } from "@/lib/faceit-prizes";

export async function POST(request: NextRequest) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: "VocÃª precisa entrar com a Steam." }, { status: 401 });
  }

  if (!currentProfile.isAdmin) {
    return NextResponse.json({ error: "Apenas administradores podem gerenciar premiaÃ§Ãµes." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      championshipId?: string;
      entryFee?: number;
      prizeTotal?: number;
      prizeFirst?: number;
      prizeSecond?: number;
      prizeThird?: number;
    };

    if (!body.championshipId) {
      return NextResponse.json({ error: "championshipId é obrigatório." }, { status: 400 });
    }

    await upsertFaceitPrize({
      championshipId: body.championshipId,
      entryFee: Number(body.entryFee ?? 0),
      prizeTotal: Number(body.prizeTotal ?? 0),
      prizeFirst: Number(body.prizeFirst ?? 0),
      prizeSecond: Number(body.prizeSecond ?? 0),
      prizeThird: Number(body.prizeThird ?? 0),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar premiação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
