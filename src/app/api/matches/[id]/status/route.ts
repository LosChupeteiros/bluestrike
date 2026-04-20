import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: matchId } = await context.params;
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("status, ready_team1, ready_team2")
    .eq("id", matchId)
    .maybeSingle<{ status: string; ready_team1: boolean; ready_team2: boolean }>();

  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: serverRow } = await supabase
    .from("dathost_servers")
    .select("status, raw_ip, ip, port, gotv_port, connect_string, server_password")
    .eq("match_id", matchId)
    .maybeSingle<{
      status: string;
      raw_ip: string | null;
      ip: string;
      port: number;
      gotv_port: number | null;
      connect_string: string | null;
      server_password: string | null;
    }>();

  return NextResponse.json({
    status: match.status,
    readyTeam1: match.ready_team1 ?? false,
    readyTeam2: match.ready_team2 ?? false,
    server: serverRow
      ? {
          status: serverRow.status,
          rawIp: serverRow.raw_ip,
          ip: serverRow.ip,
          port: serverRow.port,
          gotvPort: serverRow.gotv_port,
          connectString: serverRow.connect_string,
          password: serverRow.server_password,
        }
      : null,
  });
}
