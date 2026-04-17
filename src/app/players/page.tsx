import type { Metadata } from "next";
import PlayersPage from "./players-page";

export const metadata: Metadata = {
  title: "Players | BlueStrike",
  description: "Encontre jogadores do hub BlueStrike, veja ELO, patente e função.",
};

interface Props {
  searchParams: Promise<{
    q?: string;
    page?: string;
    view?: string;
  }>;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10);

  return (
    <PlayersPage
      query={params.q ?? ""}
      page={Number.isFinite(page) && page > 0 ? page : 1}
      view={params.view === "list" ? "list" : "cards"}
    />
  );
}
