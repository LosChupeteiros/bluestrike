"use client";

import { useMemo, useState } from "react";
import { CalendarDays, LayoutGrid, List, Search, Trophy, WalletCards, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import TournamentCard from "@/components/tournament/tournament-card";
import { cn, formatCurrency } from "@/lib/utils";
import { TEAM_MODE_LIST, type TeamMode } from "@/lib/team-modes";
import type { Tournament, TournamentStatus } from "@/types";

const STATUS_FILTERS: { label: string; value: TournamentStatus | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Inscrições abertas", value: "open" },
  { label: "Em andamento", value: "ongoing" },
  { label: "Em breve", value: "upcoming" },
  { label: "Finalizados", value: "finished" },
];

interface TournamentsExplorerProps {
  tournaments: Tournament[];
}

export default function TournamentsExplorer({ tournaments }: TournamentsExplorerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | "all">("all");
  const [modeFilter, setModeFilter] = useState<TeamMode | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return tournaments.filter((tournament) => {
      const normalizedQuery = search.toLowerCase();
      const matchesSearch =
        tournament.name.toLowerCase().includes(normalizedQuery) ||
        (tournament.description ?? "").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || tournament.status === statusFilter;
      const matchesMode = modeFilter === "all" || tournament.teamMode === modeFilter;
      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [search, statusFilter, modeFilter, tournaments]);
  const openCount = tournaments.filter((tournament) => tournament.status === "open").length;
  const totalPrize = tournaments.reduce((sum, tournament) => sum + tournament.prizeTotal, 0);

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell">

        <header className="grid gap-8 border-b border-[var(--border)] pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
          <div className="bs-eyebrow">
            <Trophy className="h-4 w-4" aria-hidden="true" />
            Campeonatos
          </div>
          <h1 className="bs-display mt-4">Campeonatos <span className="text-[var(--primary)]">BlueStrike</span></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
            Competição séria, servidores prontos, skins liberadas e premiação em PIX — do open ao topo do circuito.
          </p>
          </div>
          <div className="bs-inset grid gap-3 p-3 sm:grid-cols-[.8fr_1fr_1.45fr] lg:col-span-6">
            {[
              { label: "Campeonatos", value: tournaments.length.toString(), icon: Trophy, color: "text-[var(--primary)]", compact: false },
              { label: "Inscrições abertas", value: openCount.toString(), icon: CalendarDays, color: "text-emerald-400", compact: false },
              { label: "Premiação total", value: formatCurrency(totalPrize), icon: WalletCards, color: "text-yellow-400", compact: true },
            ].map((metric) => <div className="bs-bento-card min-w-0 p-5" key={metric.label}><span className={`flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] ${metric.color}`}><metric.icon className="h-4 w-4" /></span><strong className={`mt-6 block whitespace-nowrap font-mono leading-none tracking-[-.065em] ${metric.compact ? "text-[clamp(1.25rem,1.7vw,1.7rem)]" : "text-[clamp(1.75rem,2.25vw,2.5rem)]"} text-[var(--foreground)]`}>{metric.value}</strong><span className="mt-2 block text-[9px] font-black uppercase leading-4 tracking-[0.11em] text-[var(--muted-foreground)]">{metric.label}</span></div>)}
          </div>
        </header>

        <div className="bs-bento-card my-8 p-4">
          <div className="flex flex-col items-start gap-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden="true" />
            <Input
              placeholder="Buscar campeonato..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bs-field h-12 pl-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="bs-field ml-auto flex items-center gap-1 rounded-full border border-[var(--border)] p-1 shadow-[var(--inset-shadow)]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--panel-shadow-soft)]"
                  : "text-[var(--muted-foreground)]"
              )}
              aria-label="Visualização em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                viewMode === "list"
                  ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--panel-shadow-soft)]"
                  : "text-[var(--muted-foreground)]"
              )}
              aria-label="Visualização em lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-black transition-all",
                statusFilter === filter.value
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
              )}
            >
              {filter.label}
            </button>
          ))}

          <span className="ml-auto self-center text-xs text-[var(--muted-foreground)]">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Modalidade
            </span>
            {[{ id: "all" as const, label: "Todas" }, ...TEAM_MODE_LIST.map((m) => ({ id: m.id, label: m.label }))].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setModeFilter(mode.id)}
                className={cn(
                  "min-h-9 rounded-full border px-3.5 text-xs font-black transition-all",
                  modeFilter === mode.id
                    ? "border-[var(--primary)]/55 bg-[var(--primary)]/12 text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] py-20 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-40" aria-hidden="true" />
            <h3 className="mb-1 text-lg font-semibold">Nenhum campeonato encontrado</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Tente ajustar os filtros de busca.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} featured />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
