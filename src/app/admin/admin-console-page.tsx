import { redirect } from "next/navigation";
import { Shield, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentProfile } from "@/lib/profiles";
import { listTournaments } from "@/lib/tournaments";
import CreateTournamentPanel from "./create-tournament-panel";

export default async function AdminConsolePage() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/auth/login?next=/admin");
  }

  if (!currentProfile.isAdmin) {
    redirect("/");
  }

  const tournaments = await listTournaments();

  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-[var(--border)] py-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Shield className="h-4 w-4" />
            Painel admin
          </div>
          <h1 className="text-3xl font-black tracking-tight">Administracao BlueStrike</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Organize campeonatos, confira as equipes inscritas e mantenha o ecossistema do hub sob controle.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <CreateTournamentPanel />

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Trophy className="h-4 w-4" />
              Campeonatos cadastrados
            </div>

            <div className="space-y-3">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{tournament.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{tournament.organizerName}</div>
                    </div>
                    <Badge variant={tournament.status === "open" ? "open" : tournament.status === "ongoing" ? "ongoing" : tournament.status === "finished" ? "finished" : "upcoming"}>
                      {tournament.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-[var(--muted-foreground)]">
                    <div>
                      <span className="block">Times inscritos</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {tournament.registeredTeamsCount ?? 0}/{tournament.maxTeams}
                      </span>
                    </div>
                    <div>
                      <span className="block">Taxa</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        R$ {(tournament.entryFee ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {(tournament.registrations?.length ?? 0) > 0 && (
                    <div className="mt-4 border-t border-[var(--border)] pt-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        <Users className="h-3.5 w-3.5" />
                        Times cadastrados
                      </div>

                      <div className="space-y-2">
                        {tournament.registrations?.map((registration) => (
                          <div key={registration.id} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm">
                            <span className="font-medium">{registration.team?.name ?? "Time"}</span>
                            <span className="text-xs text-[var(--muted-foreground)]">{registration.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {tournaments.length === 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                  Nenhum campeonato cadastrado ainda.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
