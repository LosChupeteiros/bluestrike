import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";
import { createTeamForCaptain } from "@/lib/teams";

export async function POST(request: NextRequest) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam antes de criar um time." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      tag?: string;
      description?: string | null;
      password?: string | null;
    };

    const team = await createTeamForCaptain(currentProfile, {
      name: body.name ?? "",
      tag: body.tag ?? "",
      description: body.description ?? null,
      password: body.password ?? null,
    });

    return NextResponse.json({
      team,
      redirectPath: `${resolveProfilePath(currentProfile)}?tab=teams&teamCreated=1`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar o time.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
