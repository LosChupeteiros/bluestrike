import { getFaceitChampionships } from "@/lib/faceit";
import FaceitExplorer from "./faceit-explorer";

export default async function FaceitTournamentsPage() {
  let championships: Awaited<ReturnType<typeof getFaceitChampionships>> = [];

  try {
    championships = await getFaceitChampionships();
  } catch {
    // erro silencioso — FaceitExplorer exibe estado vazio
  }

  return <FaceitExplorer championships={championships} />;
}
