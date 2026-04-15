import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "@/lib/auth/session";
import { updateProfile } from "@/lib/profiles";

export async function PATCH(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Voce precisa entrar com a Steam primeiro." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const profile = await updateProfile(session.profileId, body);

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Os dados informados sao invalidos.",
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Nao foi possivel atualizar o perfil.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
