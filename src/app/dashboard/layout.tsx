import type { Metadata } from "next";

// `page.tsx` do dashboard é client component e não pode exportar `metadata`,
// então o noindex mora aqui. A página ainda renderiza dados de exemplo
// (`@/data/mock`) e não exige sessão — enquanto for assim, não deve aparecer
// em busca nem passar a impressão de ser área logada de verdade.
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
