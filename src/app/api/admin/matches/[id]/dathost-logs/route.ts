import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: matchId } = await context.params;

  const { data } = await createSupabaseAdminClient()
    .from("dathost_api_logs")
    .select("id, method, url, request_body, response_status, response_body, error_message, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<{
      id: string;
      method: string;
      url: string;
      request_body: unknown;
      response_status: number | null;
      response_body: unknown;
      error_message: string | null;
      created_at: string;
    }[]>();

  return NextResponse.json({ logs: data ?? [] });
}
