"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Radio,
  Search,
  Trophy,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tournament, TournamentStatus } from "@/types";

const STATUS_FILTERS: { label: string; value: TournamentStatus | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Inscrições abertas", value: "open" },
  { label: "Em andamento", value: "ongoing" },
  { label: "Em breve", value: "upcoming" },
  { label: "Finalizados", value: "finished" },
];

const STATUS_LABEL: Record<TournamentStatus, string> = {
  open: "Aberto",
  ongoing: "Em andamento",
  upcoming: "Em breve",
  finished: "Finalizado",
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value / 100);
}

function formatName(value: Tournament["format"]) {
  return {
    single_elimination: "Eliminação simples",
    double_elimination: "Eliminação dupla",
    round_robin: "Pontos corridos",
    swiss: "Sistema suíço",
  }[value];
}

function TournamentListCard({ tournament, compact = false }: { tournament: Tournament; compact?: boolean }) {
  const count = tournament.registeredTeamsCount ?? tournament.registrations?.length ?? 0;
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={cn(
        "group bs-panel block p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]",
        compact ? "md:grid md:grid-cols-[1fr_auto_auto] md:items-center md:gap-8" : "min-h-[180px]",
      )}
    >
      <div>
        <span className={cn(
          "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em]",
          tournament.status === "open" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : tournament.status === "ongoing" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600",
        )}>
          {STATUS_LABEL[tournament.status]}
        </span>
        <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] transition-colors group-hover:text-[var(--primary)]">{tournament.name}</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{formatName(tournament.format)} | {tournament.maxTeams} times</p>
      </div>
      <div className={cn("mt-5 border-t border-[var(--border)] pt-4", compact && "md:mt-0 md:border-0 md:pt-0")}>
        <div className="font-mono text-lg font-bold">{money(tournament.prizeTotal)}</div>
        <div className="mt-1 text-xs text-[var(--muted-foreground)]">Premiação total</div>
      </div>
      <div className={cn("mt-4 flex items-center justify-between gap-3", compact && "md:mt-0 md:min-w-32")}>
        <span className="text-sm font-medium text-[var(--primary)]">{count}/{tournament.maxTeams} vagas</span>
        <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--primary)]" aria-hidden="true" />
      </div>
    </Link>
  );
}

export default function TournamentsExplorer({ tournaments }: { tournaments: Tournament[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return tournaments.filter((tournament) => {
      const matchesSearch = !query || [tournament.name, tournament.description ?? "", tournament.organizerName, ...tournament.tags]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
      return matchesSearch && (statusFilter === "all" || tournament.status === statusFilter);
    });
  }, [search, statusFilter, tournaments]);

  const featured = tournaments.find((t) => t.featured && t.status === "open")
    ?? tournaments.find((t) => t.status === "open")
    ?? tournaments[0];
  const nextLive = tournaments.find((t) => t.status === "ongoing") ?? featured;
  const featuredCount = featured ? featured.registeredTeamsCount ?? featured.registrations?.length ?? 0 : 0;

  return (
    <div className="bs-page pb-20">
      <div className="bs-page-shell">
        <header className="flex flex-col justify-between gap-7 pb-10 pt-14 md:flex-row md:items-end md:pb-12 md:pt-16">
          <div>
            <div className="bs-kicker mb-3">Campeonatos</div>
            <h1 className="max-w-[720px] text-5xl font-bold leading-[0.98] tracking-[-0.04em] md:text-6xl">
              Campeonatos BlueStrike
            </h1>
            <p className="mt-4 max-w-[58ch] text-lg text-[var(--muted-foreground)]">
              Encontre seu próximo campeonato. Do open ao pro.
            </p>
          </div>
          <Link href="/admin" className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-[10px] bg-[var(--primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] md:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" /> Criar campeonato
          </Link>
        </header>

        <div className="bs-panel mb-6 flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar campeonato, organização ou tag..."
              aria-label="Buscar campeonato, organização ou tag"
              className="border-transparent bg-[var(--background)] pl-10 pr-10"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" aria-label="Limpar busca">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                  statusFilter === filter.value ? "bg-[var(--accent)] text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)]" aria-label="Filtros avançados">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {featured && (
          <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
            <Link href={`/tournaments/${featured.id}`} className="group relative min-h-[370px] overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-xs)]">
              {featured.bannerUrl && (
                <Image src={featured.bannerUrl} alt="" fill sizes="(max-width:1023px) 100vw, 67vw" className="object-cover opacity-10" />
              )}
              <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-[var(--accent)] md:block" />
              <div className="bs-brand-arc -right-[4%] top-1/2 hidden -translate-y-1/2 scale-[0.78] md:block" />
              <div className="absolute right-[15%] top-1/2 hidden h-28 w-28 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--primary)] shadow-[var(--shadow-sm)] md:flex">
                <Trophy className="h-14 w-14" aria-hidden="true" />
              </div>
              <div className="relative z-10 flex min-h-[370px] max-w-full flex-col justify-between p-7 md:max-w-[55%] md:p-9">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                    Inscrições abertas | Destaque
                  </span>
                  <h2 className="mt-6 text-3xl font-bold tracking-[-0.04em] md:text-4xl">{featured.name}</h2>
                  <p className="mt-3 max-w-[52ch] text-sm leading-6 text-[var(--muted-foreground)] line-clamp-3">
                    {featured.description || "Competição oficial BlueStrike com servidores dedicados, bracket automático e premiação garantida."}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div><div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Prêmio</div><div className="mt-1 font-mono text-lg font-bold">{money(featured.prizeTotal)}</div></div>
                  <div><div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Vagas</div><div className="mt-1 font-mono text-lg font-bold">{featuredCount}/{featured.maxTeams}</div></div>
                  <div><div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Início</div><div className="mt-1 font-mono text-lg font-bold">{featured.startsAt ? new Date(featured.startsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase() : "A definir"}</div></div>
                </div>
              </div>
            </Link>

            <div className="bs-panel flex min-h-[370px] flex-col justify-between p-7">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--primary)]"><Radio className="h-4 w-4" /> Próximo ao vivo</div>
                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">{nextLive?.name ?? "Próxima transmissão"}</h2>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">Acompanhe o horário e os confrontos na página do campeonato.</p>
              </div>
              <div className="my-8 flex items-center justify-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--secondary)] font-mono font-bold">T1</div>
                <span className="text-sm font-bold text-[var(--muted-foreground)]">VS</span>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--secondary)] font-mono font-bold">T2</div>
              </div>
              {nextLive && <Link href={`/tournaments/${nextLive.id}`} className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[var(--border-strong)] text-sm font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]">Abrir transmissão <ArrowRight className="h-4 w-4" /></Link>}
            </div>
          </section>
        )}

        <section className="pt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.035em]">Todos os campeonatos</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <div className="flex rounded-[10px] border border-[var(--border)] bg-white p-1">
              <button type="button" onClick={() => setViewMode("grid")} className={cn("flex h-8 w-8 items-center justify-center rounded-md", viewMode === "grid" ? "bg-[var(--accent)] text-[var(--primary)]" : "text-[var(--muted-foreground)]")} aria-label="Visualização em grade"><LayoutGrid className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode("list")} className={cn("flex h-8 w-8 items-center justify-center rounded-md", viewMode === "list" ? "bg-[var(--accent)] text-[var(--primary)]" : "text-[var(--muted-foreground)]")} aria-label="Visualização em lista"><List className="h-4 w-4" /></button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bs-panel py-16 text-center"><Trophy className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" /><h3 className="mt-4 font-semibold">Nenhum campeonato encontrado</h3><p className="mt-1 text-sm text-[var(--muted-foreground)]">Ajuste a busca ou os filtros.</p></div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-flow-dense gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
              {filtered.map((tournament) => <TournamentListCard key={tournament.id} tournament={tournament} compact={viewMode === "list"} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
