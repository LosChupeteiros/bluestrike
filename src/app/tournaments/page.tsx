import { listTournaments } from "@/lib/tournaments";
import TournamentsExplorer from "./tournaments-explorer";

export default async function TournamentsPage() {
  const tournaments = await listTournaments();
  return <TournamentsExplorer tournaments={tournaments} />;
}
