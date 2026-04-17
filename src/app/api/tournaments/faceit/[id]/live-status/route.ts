import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getRegistration, updateLiveChecks } from "@/lib/faceit-registrations";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getFaceitChampionshipSubscriptions } from "@/lib/faceit";

// Verifica em tempo real:
// 1. Se o capitão adicionou BlueStrikeCS como amigo na FACEIT
// 2. Se o time aparece (ou ainda aparece) nas inscrições do campeonato
// Atualiza o DB quando houver mudança e retorna o estado atual.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: championshipId } = await params;

  const profile = await getCurrentProfile();
  if (!profile || !profile.faceitId) {
    return NextResponse.json({ friendCheck: false, teamConfirmed: false, registrationStatus: "active" });
  }

  const registration = await getRegistration(championshipId, profile.id);
  if (!registration) {
    return NextResponse.json({ friendCheck: false, teamConfirmed: false, registrationStatus: "active", paymentStatus: "pending" });
  }

  const apiKey = process.env.FACEIT_API_KEY;
  const blueStrikeId = process.env.FACEIT_PRIVATE_ID_BLUESTRIKE;

  // Retorna valores do DB se API não estiver configurada
  if (!apiKey || !blueStrikeId) {
    return NextResponse.json({
      friendCheck: registration.friendCheck,
      teamConfirmed: registration.teamConfirmed,
      registrationStatus: registration.registrationStatus,
      paymentStatus: registration.paymentStatus,
    });
  }

  // 1. Verifica amizade (só checa se ainda não confirmou — amizade não reverte)
  let friendCheck = registration.friendCheck;
  if (!friendCheck) {
    try {
      const res = await fetch(
        `https://open.faceit.com/data/v4/players/${blueStrikeId}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as { friends_ids?: string[] };
        friendCheck = (data.friends_ids ?? []).includes(profile.faceitId);
      }
    } catch {
      // best-effort — mantém valor anterior
    }
  }

  // 2. Verifica se o time AINDA aparece nas inscrições — sempre re-checa para detectar cancelamentos
  let teamConfirmed = registration.teamConfirmed;
  let registrationStatus = registration.registrationStatus;
  try {
    const subscriptions = await getFaceitChampionshipSubscriptions(championshipId);
    const nowInFaceit = subscriptions.some((s) => s.teamId === registration.faceitTeamId);

    if (nowInFaceit) {
      teamConfirmed = true;
      registrationStatus = "active";
    } else if (registration.teamConfirmed) {
      // Estava confirmado mas sumiu da FACEIT → cancelou a inscrição
      teamConfirmed = false;
      registrationStatus = "cancelled";
    }
  } catch {
    // best-effort — mantém valores anteriores
  }

  // Persiste no DB se algo mudou
  const changed =
    friendCheck !== registration.friendCheck ||
    teamConfirmed !== registration.teamConfirmed ||
    registrationStatus !== registration.registrationStatus;

  if (changed) {
    await updateLiveChecks(registration.id, friendCheck, teamConfirmed);
    if (registrationStatus !== registration.registrationStatus) {
      const supabase = createSupabaseAdminClient();
      await supabase
        .from("faceit_registrations")
        .update({ registration_status: registrationStatus, updated_at: new Date().toISOString() })
        .eq("id", registration.id);
    }
  }

  return NextResponse.json({
    friendCheck,
    teamConfirmed,
    registrationStatus,
    paymentStatus: registration.paymentStatus,
  });
}
