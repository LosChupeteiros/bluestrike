import { redirect } from "next/navigation";
import { Activity, Shield, Trophy, WalletCards } from "lucide-react";
import { getCurrentProfile } from "@/lib/profiles";
import { listTournaments } from "@/lib/tournaments";
import { getFaceitChampionships } from "@/lib/faceit";
import CreateTournamentPanel from "./create-tournament-panel";
import BlueStrikeTournamentsPanel from "./bluestrike-tournaments-panel";
import FaceitPrizesPanel from "./faceit-prizes-panel";

export default async function AdminConsolePage() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) redirect("/auth/login?next=/admin");
  if (!currentProfile.isAdmin) redirect("/");

  const [tournaments, faceitChampionships] = await Promise.all([
    listTournaments(),
    getFaceitChampionships({ activeOnly: false }),
  ]);
  const activeTournaments = tournaments.filter((tournament) => tournament.status !== "finished").length;
  const prizeTournaments = tournaments.filter((tournament) => tournament.prizeTotal > 0).length;

  return (
    <div className="bs-app-page">
      <div className="bs-page-shell">
        <section className="bs-command-card relative mb-10 overflow-hidden p-6 sm:p-8 lg:p-10">
          <span className="pointer-events-none absolute -right-28 -top-40 h-96 w-96 rounded-full border-[58px] border-[var(--primary)]/10" aria-hidden="true" />
          <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <span className="bs-kicker"><Shield className="h-3.5 w-3.5" /> Operação BlueStrike</span>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">Console competitivo.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
                Campeonatos, premiações e integrações organizados em uma única superfície operacional.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Ativos", value: activeTournaments, icon: Activity },
                { label: "Com prêmio", value: prizeTournaments, icon: WalletCards },
                { label: "FACEIT", value: faceitChampionships.length, icon: Trophy },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bs-liquid-control min-w-24 rounded-2xl p-3 sm:min-w-32 sm:p-4">
                  <Icon className="h-4 w-4 text-[var(--primary)]" />
                  <strong className="mt-3 block text-2xl font-black tracking-[-0.04em] sm:text-3xl">{value}</strong>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-8">
          <CreateTournamentPanel />
          <BlueStrikeTournamentsPanel tournaments={tournaments} />
          <FaceitPrizesPanel championships={faceitChampionships} />
        </div>
      </div>
    </div>
  );
}
