import type { Metadata } from "next";
import { requireCurrentProfile } from "@/lib/profiles";
import PugLobbyClient from "./pug-lobby-client";

export const metadata: Metadata = {
  title: "Pug",
  robots: { index: false, follow: false },
};

export default async function ChupeteiroMestrePage() {
  // Login obrigatório para participar (e manter a página restrita a usuários logados).
  await requireCurrentProfile("/chupeteiromestre");

  return <PugLobbyClient />;
}
