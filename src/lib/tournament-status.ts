import type { Tournament } from "@/types";

export function getEffectiveTournamentStatus(tournament: Tournament): Tournament["status"] {
  const now = Date.now();
  const s = tournament.status;

  if (s === "finished") return "finished";

  if (tournament.endsAt && now > Date.parse(tournament.endsAt)) return "finished";

  if (tournament.startsAt && now >= Date.parse(tournament.startsAt)) return "ongoing";

  if (s === "open" && tournament.registrationEnds && now > Date.parse(tournament.registrationEnds)) {
    return "ongoing";
  }

  if (s === "upcoming") {
    if (!tournament.registrationStarts || now >= Date.parse(tournament.registrationStarts)) {
      return "open";
    }
  }

  return s;
}

export function isTournamentRegistrationOpen(tournament: Tournament): boolean {
  const now = Date.now();
  if (getEffectiveTournamentStatus(tournament) !== "open") return false;
  if (tournament.registrationEnds && now > Date.parse(tournament.registrationEnds)) return false;
  const registered = tournament.registeredTeamsCount ?? 0;
  if (registered >= tournament.maxTeams) return false;
  return true;
}

type BadgeVariant = "open" | "ongoing" | "finished" | "upcoming" | "destructive";

export function getTournamentBadgeProps(tournament: Tournament): {
  variant: BadgeVariant;
  label: string;
} {
  const effective = getEffectiveTournamentStatus(tournament);
  const registered = tournament.registeredTeamsCount ?? 0;

  if (effective === "open" && registered >= tournament.maxTeams) {
    return { variant: "destructive", label: "LOTADO" };
  }

  const map: Record<Tournament["status"], { variant: BadgeVariant; label: string }> = {
    open:     { variant: "open",     label: "Inscrições Abertas" },
    ongoing:  { variant: "ongoing",  label: "Em Andamento" },
    finished: { variant: "finished", label: "Finalizado" },
    upcoming: { variant: "upcoming", label: "Em Breve" },
  };

  return map[effective] ?? { variant: "upcoming", label: effective };
}
