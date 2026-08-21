import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { resolveMatchViewerAccess } from "@/lib/matches";

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

  // Status, ready e placar são informação pública da partida — qualquer um que
  // abre a página acompanha. Já IP, porta e senha do servidor são credencial de
  // acesso: com elas dá para entrar numa partida oficial em andamento. Só
  // jogador dos dois times e admin recebem.
  const { canSeeServerCredentials } = await resolveMatchViewerAccess(matchId);

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

  const { data: consoleLogs } = await supabase
    .from("dathost_api_logs")
    .select("request_body")
    .eq("match_id", matchId)
    .eq("method", "POST")
    .like("url", "%/console")
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<{ request_body: { line?: unknown } | null }[]>();

  const matchzyConfigSent = Boolean(
    consoleLogs?.some((log) => {
      const line = log.request_body?.line;
      return typeof line === "string" && line.startsWith("matchzy_loadmatch_url ");
    })
  );

  return NextResponse.json({
    status: match.status,
    readyTeam1: match.ready_team1 ?? false,
    readyTeam2: match.ready_team2 ?? false,
    matchzyConfigSent,
    server: serverRow
      ? {
          // O status do servidor continua visível: é o que move a UI de
          // "provisionando" para "pronto", inclusive para espectador.
          status: serverRow.status,
          rawIp: canSeeServerCredentials ? serverRow.raw_ip : null,
          ip: canSeeServerCredentials ? serverRow.ip : "",
          port: canSeeServerCredentials ? serverRow.port : 0,
          gotvPort: canSeeServerCredentials ? serverRow.gotv_port : null,
          connectString: canSeeServerCredentials ? serverRow.connect_string : null,
          password: canSeeServerCredentials ? serverRow.server_password : null,
        }
      : null,
  });
}
