import { buildMatchzyConfig } from "@/lib/pug";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = await buildMatchzyConfig(id);
  if (!config) return Response.json({ error: "Lobby not found" }, { status: 404 });
  return Response.json(config, { headers: { "Cache-Control": "no-store" } });
}
