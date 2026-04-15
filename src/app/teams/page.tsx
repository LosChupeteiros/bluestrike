import type { Metadata } from "next";
import TeamsCatalogPage from "./teams-catalog-page";

export const metadata: Metadata = { title: "Times" };

interface TeamsPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default function TeamsPage({ searchParams }: TeamsPageProps) {
  return <TeamsCatalogPage searchParams={searchParams} />;
}
