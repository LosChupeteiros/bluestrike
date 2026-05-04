import { redirect } from "next/navigation";
import { Plus, Shield } from "lucide-react";
import { getCurrentProfile } from "@/lib/profiles";
import { listTournaments } from "@/lib/tournaments";
import { getFaceitChampionships } from "@/lib/faceit";
import CreateTournamentPanel from "./create-tournament-panel";
import BlueStrikeTournamentsPanel from "./bluestrike-tournaments-panel";
import FaceitPrizesPanel from "./faceit-prizes-panel";

function SectionHeader({ icon: Icon, label, title, description }: {
  icon: React.ElementType;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-4 border-b border-[var(--border)] pb-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5">
        <Icon className="h-5 w-5 text-[var(--primary)]" />
      </div>
      <div>
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">{label}</div>
        <h2 className="text-xl font-black tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

export default async function AdminConsolePage() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) redirect("/auth/login?next=/admin");
  if (!currentProfile.isAdmin) redirect("/");

  const [tournaments, faceitChampionships] = await Promise.all([
    listTournaments(),
    getFaceitChampionships({ activeOnly: false }),
  ]);

  return (
    <div className="min-h-screen pb-24 pt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-10 border-b border-[var(--border)] pb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Shield className="h-4 w-4" />
            Painel administrativo
          </div>
          <h1 className="text-3xl font-black tracking-tight">Console BlueStrike</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Gerencie campeonatos, premiações e configurações da plataforma.
          </p>
        </div>

        <div className="space-y-10">

          {/* ── Section 1: Criar campeonato ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <SectionHeader
              icon={Plus}
              label="Novo campeonato"
              title="Criar campeonato BlueStrike"
              description="Preencha os dados para publicar um novo campeonato na plataforma."
            />
            <CreateTournamentPanel />
          </div>

          {/* ── Section 2: Gerenciar campeonatos ── */}
          <BlueStrikeTournamentsPanel tournaments={tournaments} />

          {/* ── Section 3: FACEIT prizes ── */}
          <FaceitPrizesPanel championships={faceitChampionships} />

        </div>
      </div>
    </div>
  );
}
