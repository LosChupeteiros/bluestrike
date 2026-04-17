import type { Metadata } from "next";
import { getTournamentById } from "@/lib/tournaments";
import { getFaceitChampionshipById } from "@/lib/faceit";
import TournamentDetailPageView from "./tournament-detail-page-view";
import FaceitTournamentDetailView from "./faceit-tournament-detail-view";

interface Params {
  id: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;

  if (id.startsWith("faceit-")) {
    const faceitId = id.slice(7);
    const championship = await getFaceitChampionshipById(faceitId);
    if (!championship) return { title: "Campeonato não encontrado" };
    return {
      title: championship.name,
      description: championship.description || "Campeonato de CS2 na FACEIT organizado pela BlueStrike.",
    };
  }

  const tournament = await getTournamentById(id);
  if (!tournament) return { title: "Campeonato não encontrado" };
  return {
    title: tournament.name,
    description: tournament.description ?? undefined,
  };
}

export default async function TournamentDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  if (id.startsWith("faceit-")) {
    const faceitId = id.slice(7);
    return <FaceitTournamentDetailView id={faceitId} />;
  }

  return <TournamentDetailPageView params={params} />;
}
