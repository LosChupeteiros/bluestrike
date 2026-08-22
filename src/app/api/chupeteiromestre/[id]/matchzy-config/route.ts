import { buildMatchzyConfig } from "@/lib/pug";
import { verifyMatchSecret } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // O config carrega o SteamID64 e o nick de todo mundo na sala. Quem lê é o
  // servidor de jogo, que recebe o segredo no comando matchzy_loadmatch_url.
  const supabase = createSupabaseAdminClient();
  const { data: lobby } = await supabase
    .from("pug_lobbies")
    .select("webhook_secret")
    .eq("id", id)
    .maybeSingle<{ webhook_secret: string | null }>();

  if (!lobby) return Response.json({ error: "Lobby not found" }, { status: 404 });

  const auth = verifyMatchSecret(req, lobby.webhook_secret);
  if (!auth.ok) {
    console.warn(`[pug-config/${id}] credencial inválida — recusada.`);
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const config = await buildMatchzyConfig(id);
  if (!config) return Response.json({ error: "Lobby not found" }, { status: 404 });
  return Response.json(config, { headers: { "Cache-Control": "no-store" } });
}
