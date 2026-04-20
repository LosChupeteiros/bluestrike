import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: matchId } = await context.params;

  const supabase = createSupabaseAdminClient();

  const { data: rows } = await supabase
    .from("map_vetoes")
    .select("id, match_id, team_id, action, map_name, veto_order, picked_side, created_at")
    .eq("match_id", matchId)
    .order("veto_order", { ascending: true })
    .returns<{
      id: string;
      match_id: string;
      team_id: string;
      action: "ban" | "pick";
      map_name: string;
      veto_order: number;
      picked_side: "ct" | "t" | null;
      created_at: string;
    }[]>();

  const vetoes = (rows ?? []).map((r) => ({
    id: r.id,
    matchId: r.match_id,
    teamId: r.team_id,
    action: r.action,
    mapName: r.map_name,
    vetoOrder: r.veto_order,
    pickedSide: r.picked_side,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ vetoes });
}
