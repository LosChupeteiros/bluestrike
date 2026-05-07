import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const [{ data: rows }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, message, link, read, created_at")
      .eq("profile_id", session.profileId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", session.profileId)
      .eq("read", false),
  ]);

  return NextResponse.json({
    notifications: rows ?? [],
    unreadCount: count ?? 0,
  });
}
