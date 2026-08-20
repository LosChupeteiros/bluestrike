"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";
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

        <div className="mb-12">
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
            Campeonatos
            <span className="text-strike"> BlueStrike</span>
          </h1>
          <p className="type-body mt-4">
            !ws ativo — use qualquer faca ou skin. Premiação em PIX e chave automática.
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
                "rounded-lg border px-3.5 py-1.5 text-[13px] font-medium",
                "transition-colors duration-300 [transition-timing-function:var(--ease-out-quint)]",
                statusFilter === filter.value
                  ? "border-strike/45 bg-strike/12 text-strike"
                  : "border-line text-ink-3 hover:border-line-2 hover:text-ink"
              )}
            >
              {filter.label}
            </button>
          ))}

          <span className="tabular ml-auto self-center text-[11px] text-ink-3">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center border-t border-line/70 py-20 text-center">
            <svg viewBox="0 0 52 52" className="mb-5 h-10 w-10" aria-hidden="true">
              <circle cx="26" cy="26" r="12" fill="none" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="26" y1="2" x2="26" y2="12" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="26" y1="40" x2="26" y2="50" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="2" y1="26" x2="12" y2="26" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="40" y1="26" x2="50" y2="26" stroke="var(--color-line-2)" strokeWidth="1.5" />
            </svg>
            <h3 className="font-display text-base font-bold tracking-tight text-ink">
              Nenhum campeonato encontrado
            </h3>
            <p className="mt-1.5 text-[13px] text-ink-3">Ajuste a busca ou troque o filtro de status.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
