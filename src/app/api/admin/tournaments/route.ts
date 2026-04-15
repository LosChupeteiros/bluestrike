import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { createTournament } from "@/lib/tournaments";
import type { Tournament } from "@/types";

export async function POST(request: NextRequest) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam." }, { status: 401 });
  }

  if (!currentProfile.isAdmin) {
    return NextResponse.json({ error: "Apenas administradores podem cadastrar campeonatos." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      rules?: string[];
      prizeTotal?: number;
      entryFee?: number;
      maxTeams?: number;
      format?: Tournament["format"];
      status?: Tournament["status"];
      minElo?: number | null;
      maxElo?: number | null;
      checkInRequired?: boolean;
      checkInWindowMins?: number;
      region?: string;
      tags?: string[];
      registrationStarts?: string | null;
      registrationEnds?: string | null;
      startsAt?: string | null;
      endsAt?: string | null;
      bannerUrl?: string | null;
      featured?: boolean;
    };

    const tournament = await createTournament(currentProfile, {
      name: body.name ?? "",
      description: body.description ?? null,
      rules: body.rules ?? [],
      prizeTotal: body.prizeTotal ?? 0,
      entryFee: body.entryFee ?? 0,
      maxTeams: body.maxTeams ?? 16,
      format: body.format ?? "single_elimination",
      status: body.status ?? "upcoming",
      minElo: body.minElo ?? null,
      maxElo: body.maxElo ?? null,
      checkInRequired: body.checkInRequired ?? true,
      checkInWindowMins: body.checkInWindowMins ?? 30,
      region: body.region ?? "BR",
      tags: body.tags ?? [],
      registrationStarts: body.registrationStarts ?? null,
      registrationEnds: body.registrationEnds ?? null,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      bannerUrl: body.bannerUrl ?? null,
      featured: Boolean(body.featured),
    });

    return NextResponse.json({ tournament });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel cadastrar o campeonato.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
