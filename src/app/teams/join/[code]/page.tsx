import type { Metadata } from "next";
import { getTeamByJoinCode } from "@/lib/teams";
import JoinTeamPageView from "./join-team-page-view";

interface Params {
  code: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { code } = await params;
  const team = await getTeamByJoinCode(code);

  if (!team) {
    return { title: "Convite invalido" };
  }

  return { title: `Entrar em ${team.name}` };
}

export default async function JoinTeamPage({ params }: { params: Promise<Params> }) {
  return <JoinTeamPageView params={params} />;
}
