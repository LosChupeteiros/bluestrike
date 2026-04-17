"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import FaceitTournamentCard from "@/components/tournament/faceit-tournament-card";
import { cn } from "@/lib/utils";
import type { FaceitChampionship } from "@/lib/faceit";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "Todos", value: "all" },
  { label: "Inscrições abertas", value: "join" },
  { label: "Check-in", value: "checking_in" },
  { label: "Em andamento", value: "ongoing" },
  { label: "Finalizados", value: "finished" },
];

const FACEIT_ICON = (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" aria-hidden="true">
    <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
  </svg>
);

interface FaceitExplorerProps {
  championships: FaceitChampionship[];
}

export default function FaceitExplorer({ championships }: FaceitExplorerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return championships.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, championships]);

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "#FF5500" }}>
            {FACEIT_ICON}
            FACEIT
          </div>
          <h1 className="mb-2 text-4xl font-black tracking-tight">Campeonatos FACEIT</h1>
          <p className="text-[var(--muted-foreground)]">
            Campeonatos da BlueStrike na plataforma FACEIT. Anti-cheat ativo, Elo real. Inscrição direta pela FACEIT.
          </p>
        </div>

        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden="true" />
            <Input
              placeholder="Buscar campeonato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ borderColor: search ? "rgba(255,85,0,0.4)" : undefined }}
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
                  ? "text-white shadow-md"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
              style={
                statusFilter === filter.value
                  ? { backgroundColor: "#FF5500", borderColor: "#FF5500" }
                  : undefined
              }
            >
              {filter.label}
            </button>
          ))}

          <span className="ml-auto self-center text-sm text-[var(--muted-foreground)]">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {championships.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 h-12 w-12 opacity-20" aria-hidden="true">
              {FACEIT_ICON}
            </div>
            <h3 className="mb-1 text-lg font-semibold">Nenhum campeonato FACEIT disponível</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Novos campeonatos são publicados regularmente.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 h-12 w-12 opacity-20" aria-hidden="true">
              {FACEIT_ICON}
            </div>
            <h3 className="mb-1 text-lg font-semibold">Nenhum campeonato encontrado</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((championship) => (
              <FaceitTournamentCard key={championship.id} championship={championship} featured />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
