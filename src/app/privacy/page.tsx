import type { Metadata } from "next";
import LegalPage from "@/components/legal/legal-page";
import { PRIVACY_DOCUMENT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Quais dados a BlueStrike coleta, com qual base legal, com quem compartilha e como você exerce seus direitos sob a LGPD.",
};

export default function PrivacyPage() {
  return <LegalPage document={PRIVACY_DOCUMENT} />;
}
