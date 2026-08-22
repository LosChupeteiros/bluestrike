import type { MetadataRoute } from "next";
import { getIntegrationBaseUrl } from "@/lib/api-auth";

/**
 * robots.txt.
 *
 * A ideia é ser achado no Google pelo que atrai jogador — campeonatos, times,
 * ranking, perfis — e manter fora do índice o que é operacional ou pessoal.
 *
 * Vale lembrar que isto é orientação para robô que colabora, não controle de
 * acesso: `Disallow` não impede ninguém de acessar a URL. O que protege de
 * verdade é a autorização em cada rota. Aqui só se evita que a página apareça
 * na busca.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getIntegrationBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",             // nada de API no índice
          "/admin",            // painel administrativo
          "/chupeteiromestre", // sala de pug interna
          "/dashboard",        // área logada
          "/testrank",         // página de teste
          "/auth/",            // fluxo de login
          "/*?next=",          // parâmetro de redirect pós-login
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
