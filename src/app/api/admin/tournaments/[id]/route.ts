import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const currentProfile = await getCurrentProfile();

  if (!currentProfile?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    status?: string;
    prizeTotal?: number;
    prizeBreakdown?: Array<{ place: string; amount: number }>;
    entryFee?: number;
    registrationEnds?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    description?: string | null;
  };

  const update: Record<string, unknown> = {};
  if (body.name !== undefined)            update.name = body.name;
  if (body.status !== undefined)          update.status = body.status;
  if (body.prizeTotal !== undefined)      update.prize_total = body.prizeTotal;
  if (body.prizeBreakdown !== undefined)  update.prize_breakdown = body.prizeBreakdown;
  if (body.entryFee !== undefined)        update.entry_fee = body.entryFee;
  if (body.registrationEnds !== undefined) update.registration_ends = body.registrationEnds;
  if (body.startsAt !== undefined)        update.starts_at = body.startsAt;
  if (body.endsAt !== undefined)          update.ends_at = body.endsAt;
  if (body.description !== undefined)     update.description = body.description;

  const { error } = await createSupabaseAdminClient()
    .from("tournaments")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
