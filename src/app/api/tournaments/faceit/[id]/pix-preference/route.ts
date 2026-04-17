import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/profiles";
import { getRegistrationById, saveMpPreferenceId } from "@/lib/faceit-registrations";
import { createPixPreference, isSandboxMode } from "@/lib/mercadopago";
import { getFaceitChampionshipById } from "@/lib/faceit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: championshipId } = await params;

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { registrationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { registrationId } = body;
  if (!registrationId) {
    return NextResponse.json({ error: "registrationId obrigatório." }, { status: 400 });
  }

  // Valida que a inscrição pertence ao usuário
  const registration = await getRegistrationById(registrationId);
  if (!registration || registration.profileId !== profile.id) {
    return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  }
  if (registration.paymentStatus === "paid") {
    return NextResponse.json({ error: "Pagamento já confirmado." }, { status: 409 });
  }

  // Busca dados do campeonato para montar o item
  const championship = await getFaceitChampionshipById(championshipId);
  if (!championship) {
    return NextResponse.json({ error: "Campeonato não encontrado." }, { status: 404 });
  }

  const amount = championship.entryFee;
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Este campeonato não possui taxa de inscrição." }, { status: 422 });
  }

  try {
    const preference = await createPixPreference({
      registrationId,
      championshipId,
      championshipName: championship.name,
      amount,
      // MP exige e-mail válido; usamos um fallback genérico se o perfil não tiver
      payerEmail: profile.email ?? `${profile.steamId}@bluestrike.gg`,
      payerName: profile.fullName ?? profile.steamPersonaName ?? "Jogador BlueStrike",
    });

    // Persiste preference_id para auditoria e reconciliação
    await saveMpPreferenceId(registrationId, preference.preferenceId);

    const sandbox = isSandboxMode();
    return NextResponse.json({
      preferenceId: preference.preferenceId,
      // Em sandbox usamos sandbox_init_point, em produção o init_point normal
      initPoint: sandbox ? preference.sandboxInitPoint : preference.initPoint,
      sandbox,
    });
  } catch (err) {
    console.error("[pix-preference] Erro MP:", err);
    const msg = err instanceof Error ? err.message : "Erro ao criar preferência de pagamento.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
