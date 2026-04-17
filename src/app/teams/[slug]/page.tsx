import type { Metadata } from "next";
import { getTeamBySlug } from "@/lib/teams";
import TeamProfilePageView from "./team-profile-page";

interface Params {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);

  if (!team) {
    return { title: "Time não encontrado" };
  }

  return { title: `${team.name} [${team.tag}]` };
}

export default async function TeamProfilePage({ params }: { params: Promise<Params> }) {
  return <TeamProfilePageView params={params} />;
}
