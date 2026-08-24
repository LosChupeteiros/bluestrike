import type { Metadata } from "next";
import AdminConsolePage from "./admin-console-page";

// Fora da busca. Quem protege o acesso é a checagem de admin dentro de
// AdminConsolePage — isto só evita a URL aparecer em resultado de pesquisa.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsolePage />;
}
