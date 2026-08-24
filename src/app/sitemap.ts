import type { MetadataRoute } from "next";
import { getIntegrationBaseUrl } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Sitemap.
 *
 * Lista o que se quer ranqueando no Google: campeonatos, times e perfis de
 * jogador — as páginas que trazem busca de cauda longa ("time X CS2",
 * "campeonato CS2 brasil"). Área logada, painel e API ficam de fora, junto com
 * as páginas de partida: são muitas, mudam o tempo todo e não têm valor de
 * busca.
 *
 * Os perfis entram pelo `public_id` numérico, não pelo UUID.
 */

export const revalidate = 3600;

const ESTATICAS: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[0]["changeFrequency"] }> = [
  { path: "/",            priority: 1.0, freq: "daily" },
  { path: "/tournaments", priority: 0.9, freq: "daily" },
  { path: "/teams",       priority: 0.8, freq: "daily" },
  { path: "/players",     priority: 0.8, freq: "daily" },
  { path: "/ranking",     priority: 0.7, freq: "daily" },
  { path: "/live",        priority: 0.6, freq: "hourly" },
  { path: "/skins",       priority: 0.5, freq: "weekly" },
  { path: "/terms",       priority: 0.3, freq: "yearly" },
  { path: "/privacy",     priority: 0.3, freq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getIntegrationBaseUrl();
  const agora = new Date();

  const entradas: MetadataRoute.Sitemap = ESTATICAS.map((e) => ({
    url: `${base}${e.path}`,
    lastModified: agora,
    changeFrequency: e.freq,
    priority: e.priority,
  }));

  try {
    const supabase = createSupabaseAdminClient();

    const [torneios, times, perfis] = await Promise.all([
      // Allowlist de status em vez de "tudo o que existe": se um dia entrar um
      // status de rascunho ou privado, ele não vaza para a busca por omissão.
      supabase.from("tournaments").select("id, updated_at")
        .in("status", ["upcoming", "ongoing", "finished"])
        .limit(1000)
        .returns<{ id: string; updated_at: string | null }[]>(),
      supabase.from("teams").select("slug, updated_at").limit(2000)
        .returns<{ slug: string | null; updated_at: string | null }[]>(),
      supabase.from("profiles").select("public_id, updated_at").limit(5000)
        .returns<{ public_id: number | null; updated_at: string | null }[]>(),
    ]);

    for (const t of torneios.data ?? []) {
      entradas.push({
        url: `${base}/tournaments/${t.id}`,
        lastModified: t.updated_at ? new Date(t.updated_at) : agora,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    for (const t of times.data ?? []) {
      if (!t.slug) continue;
      entradas.push({
        url: `${base}/teams/${t.slug}`,
        lastModified: t.updated_at ? new Date(t.updated_at) : agora,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    for (const p of perfis.data ?? []) {
      if (!p.public_id) continue;
      entradas.push({
        url: `${base}/profile/${p.public_id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : agora,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch (err) {
    // Sitemap incompleto é melhor do que sitemap quebrado: as estáticas saem
    // de qualquer jeito.
    console.error("[sitemap] falha ao montar entradas dinâmicas:", err);
  }

  return entradas;
}
