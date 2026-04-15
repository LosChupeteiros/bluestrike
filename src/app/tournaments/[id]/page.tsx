import type { Metadata } from "next";
import { getTournamentById } from "@/lib/tournaments";
import TournamentDetailPageView from "./tournament-detail-page-view";

interface Params {
  id: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    return { title: "Campeonato nao encontrado" };
  }

  return {
    title: tournament.name,
    description: tournament.description ?? undefined,
  };
}

export default async function TournamentDetailPage({ params }: { params: Promise<Params> }) {
  return <TournamentDetailPageView params={params} />;
}
