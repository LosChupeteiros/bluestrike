import type { Metadata } from "next";
import LegalPage from "@/components/legal/legal-page";
import { TERMS_DOCUMENT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Regras de conta, inscrição, premiação, fair play e punição dos campeonatos de CS2 da BlueStrike.",
};

export default function TermsPage() {
  return <LegalPage document={TERMS_DOCUMENT} />;
}
