"use client";

import { useState, useMemo } from "react";
import { Search, Trophy, X, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import TournamentCard from "@/components/tournament/tournament-card";
import { mockTournaments } from "@/data/mock";
import { cn } from "@/lib/utils";
import type { TournamentStatus } from "@/types";

const STATUS_FILTERS: { label: string; value: TournamentStatus | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Inscrições Abertas", value: "open" },
  { label: "Em Andamento", value: "ongoing" },
  { label: "Em Breve", value: "upcoming" },
  { label: "Finalizados", value: "finished" },
];

export default function TournamentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return mockTournaments.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[var(--primary)] text-sm font-semibold mb-2">
            <Trophy className="w-4 h-4" />
            Campeonatos
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Todos os Campeonatos</h1>
          <p className="text-[var(--muted-foreground)]">
            Encontre o campeonato certo para o seu time e inscreva-se agora.
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
            <Input
              placeholder="Buscar campeonato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-md border border-[var(--border)] p-1 bg-[var(--secondary)] ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)]"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === "list"
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)]"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                statusFilter === f.value
                  ? "bg-[var(--primary)] text-black border-[var(--primary)] shadow-md"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40"
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-[var(--muted-foreground)] self-center">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Trophy className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-semibold mb-1">Nenhum campeonato encontrado</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Tente alterar os filtros de busca.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <TournamentCard key={t.id} tournament={t} featured />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
