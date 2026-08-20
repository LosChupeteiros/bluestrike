import type { Metadata } from "next";
import { ELO_BANDS, IN_GAME_ROLE_VALUES, type InGameRole } from "@/lib/profile";
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
    role?: string;
    elo?: string;
    faceitMin?: string;
    faceitMax?: string;
  }>;
}

function parseBoundedInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(10, Math.max(1, parsed)) : fallback;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10);
  const role = IN_GAME_ROLE_VALUES.includes(params.role as InGameRole)
    ? (params.role as InGameRole)
    : null;
  const eloBand = ELO_BANDS.find((band) => band.key === params.elo) ?? null;
  const faceitMin = parseBoundedInt(params.faceitMin, 1);
  const faceitMax = Math.max(faceitMin, parseBoundedInt(params.faceitMax, 10));

  return (
    <PlayersPage
      query={params.q ?? ""}
      page={Number.isFinite(page) && page > 0 ? page : 1}
      view={params.view === "list" ? "list" : "cards"}
      role={role}
      eloBand={eloBand?.key ?? ""}
      minElo={eloBand?.min}
      maxElo={eloBand && Number.isFinite(eloBand.max) ? eloBand.max : undefined}
      faceitMin={faceitMin}
      faceitMax={faceitMax}
    />
  );
}
