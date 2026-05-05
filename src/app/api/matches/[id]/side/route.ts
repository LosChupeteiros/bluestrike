import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { submitMapSideChoice } from "@/lib/match-flow";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: matchId } = await context.params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "NÃ£o autenticado." }, { status: 401 });

  let body: { vetoId?: string; side?: "ct" | "t" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invÃ¡lido." }, { status: 400 });
  }

  if (!body.vetoId || (body.side !== "ct" && body.side !== "t")) {
    return NextResponse.json({ error: "vetoId e side sÃ£o obrigatÃ³rios." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: match } = await supabase
    .from("matches")
    .select("team1_id, team2_id")
    .eq("id", matchId)
    .maybeSingle<{ team1_id: string | null; team2_id: string | null }>();

  if (!match) return NextResponse.json({ error: "Partida nÃ£o encontrada." }, { status: 404 });

  const teamIds = [match.team1_id, match.team2_id].filter(Boolean) as string[];
  const { data: captainOf } = await supabase
    .from("teams")
    .select("id")
    .eq("captain_id", profile.id)
    .in("id", teamIds)
    .maybeSingle<{ id: string }>();

  const teamId = captainOf?.id;
  if (!teamId) {
    return NextResponse.json({ error: "Apenas capitÃ£es podem escolher o lado." }, { status: 403 });
  }

  const result = await submitMapSideChoice(matchId, teamId, body.vetoId, body.side);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, done: result.done });
}
