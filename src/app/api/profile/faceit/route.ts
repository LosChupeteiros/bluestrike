import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCurrentProfile, updateFaceitProfile } from "@/lib/profiles";

interface FaceitApiPlayer {
  player_id: string;
  nickname: string;
  avatar: string;
  steam_id_64: string;
  games?: {
    cs2?: { faceit_elo: number; skill_level: number };
    csgo?: { faceit_elo: number; skill_level: number };
  };
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  let nickname: string;

  try {
    const body = await request.json();
    nickname = String(body?.nickname ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!nickname) {
    return NextResponse.json({ error: "Informe seu nickname da FACEIT." }, { status: 400 });
  }

  const apiKey = process.env.FACEIT_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Integração FACEIT não configurada." }, { status: 500 });
  }

  let faceitData: FaceitApiPlayer;

  try {
    const res = await fetch(
      `https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { error: `Nickname "${nickname}" não encontrado na FACEIT.` },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Erro ao consultar a FACEIT. Tente novamente." },
        { status: 502 }
      );
    }

    faceitData = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível conectar à FACEIT. Verifique sua conexão." },
      { status: 502 }
    );
  }

  // Valida que o steam_id_64 bate com o perfil da BlueStrike
  if (faceitData.steam_id_64 !== profile.steamId) {
    return NextResponse.json(
      {
        error:
          "O nickname FACEIT não pertence à mesma conta Steam conectada na BlueStrike.",
      },
      { status: 422 }
    );
  }

  // Prioriza CS2, fallback para CSGO
  const gameData = faceitData.games?.cs2 ?? faceitData.games?.csgo ?? null;

  const updatedProfile = await updateFaceitProfile(profile.id, {
    faceitId: faceitData.player_id,
    faceitNickname: faceitData.nickname,
    faceitAvatar: faceitData.avatar || null,
    faceitElo: gameData?.faceit_elo ?? null,
    faceitLevel: gameData?.skill_level ?? null,
  });

  return NextResponse.json({ profile: updatedProfile });
}
