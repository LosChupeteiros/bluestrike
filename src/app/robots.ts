import type { MetadataRoute } from "next";
import { getIntegrationBaseUrl } from "@/lib/api-auth";

/**
 * robots.txt.
 *
 * Deliberadamente curto. `robots.txt` é público e é a primeira coisa que
 * qualquer varredura automatizada lê — listar `/admin`, `/dashboard` e afins
 * aqui seria entregar o mapa da casa a quem nem sabia que esses caminhos
 * existiam. Nenhum deles fica escondido por `Disallow` de qualquer forma:
 * quem protege é a checagem de sessão dentro da página.
 *
 * Para manter página fora da busca, o certo é `robots: { index: false }` no
 * `metadata` da própria página — e isso é mais confiável do que `Disallow`,
 * porque um caminho bloqueado aqui nem chega a ser lido pelo robô, então ele
 * nunca vê a instrução de não indexar e pode listar a URL crua mesmo assim.
 *
 * Só `/api/` continua aqui, porque resposta JSON não tem `<head>` onde pendurar
 * a meta tag.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getIntegrationBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
