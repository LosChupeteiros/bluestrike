import { NextRequest, NextResponse } from "next/server";
import { processSeriesEnd } from "@/lib/matchzy";
import { getSession } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id: matchId } = await context.params;
  try {
    await processSeriesEnd(matchId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
