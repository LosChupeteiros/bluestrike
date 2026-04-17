"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search, Trophy, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import TournamentCard from "@/components/tournament/tournament-card";
import { cn } from "@/lib/utils";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return tournaments.filter((tournament) => {
      const normalizedQuery = search.toLowerCase();
      const matchesSearch =
        tournament.name.toLowerCase().includes(normalizedQuery) ||
        (tournament.description ?? "").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || tournament.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, tournaments]);

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Trophy className="h-4 w-4" aria-hidden="true" />
            BlueStrike
          </div>
          <h1 className="mb-2 text-4xl font-black tracking-tight">Campeonatos BlueStrike</h1>
          <p className="text-[var(--muted-foreground)]">
            !ws ativo — use qualquer faca ou skin. Premiação em PIX, bracket automático.
          </p>
        </div>

        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden="true" />
            <Input
              placeholder="Buscar campeonato..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
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

          <div className="ml-auto flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--secondary)] p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
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
                "rounded p-1.5 transition-colors",
                viewMode === "list"
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)]"
              )}
              aria-label="Visualização em lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                statusFilter === filter.value
                  ? "border-[var(--primary)] bg-[var(--primary)] text-black shadow-md"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
              )}
            >
              {filter.label}
            </button>
          ))}

          <span className="ml-auto self-center text-sm text-[var(--muted-foreground)]">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
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
