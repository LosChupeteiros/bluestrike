import Link from "next/link";
import { ArrowRight, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import TournamentsCarousel, { type CarouselItem } from "./tournaments-carousel";
import { listTournaments } from "@/lib/tournaments";
import { getFaceitChampionships } from "@/lib/faceit";
import type { Tournament } from "@/types";

const STATUS_PRIORITY: Record<Tournament["status"], number> = {
  open: 0,
  ongoing: 1,
  upcoming: 2,
  finished: 3,
};

const FACEIT_STATUS_PRIORITY: Record<string, number> = {
  join: 0,
  checking_in: 1,
  ongoing: 2,
  finished: 3,
  cancelled: 4,
};

export default async function FeaturedTournaments() {
  let bsTournaments: Tournament[] = [];
  let faceitChampionships: Awaited<ReturnType<typeof getFaceitChampionships>> = [];
  let hasError = false;

  try {
    [bsTournaments, faceitChampionships] = await Promise.all([
      listTournaments({ status: "all" }),
      getFaceitChampionships(),
    ]);
  } catch {
    hasError = true;
  }

  // Constrói lista mista ordenada: featured primeiro, depois por status e data
  const items: CarouselItem[] = [
    ...bsTournaments.map((t): CarouselItem => ({ source: "bluestrike", tournament: t })),
    ...faceitChampionships.map((c): CarouselItem => ({ source: "faceit", championship: c })),
  ].sort((a, b) => {
    const aFeatured = a.source === "bluestrike" ? a.tournament.featured : a.championship.featured;
    const bFeatured = b.source === "bluestrike" ? b.tournament.featured : b.championship.featured;
    if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;

    const aPriority = a.source === "bluestrike"
      ? (STATUS_PRIORITY[a.tournament.status] ?? 3)
      : (FACEIT_STATUS_PRIORITY[a.championship.status] ?? 3);
    const bPriority = b.source === "bluestrike"
      ? (STATUS_PRIORITY[b.tournament.status] ?? 3)
      : (FACEIT_STATUS_PRIORITY[b.championship.status] ?? 3);
    if (aPriority !== bPriority) return aPriority - bPriority;

    const aDate = a.source === "bluestrike"
      ? (a.tournament.startsAt ? Date.parse(a.tournament.startsAt) : 0)
      : a.championship.championshipStart;
    const bDate = b.source === "bluestrike"
      ? (b.tournament.startsAt ? Date.parse(b.tournament.startsAt) : 0)
      : b.championship.championshipStart;
    return aDate - bDate;
  });

  const isEmpty = items.length === 0;

  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)] text-sm font-semibold mb-2">
            <Trophy className="w-4 h-4" />
            Campeonatos
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Compita pelos melhores prêmios
          </h2>
          <p className="text-[var(--muted-foreground)] mt-2 max-w-lg">
            Novos campeonatos toda semana. Encontre o que combina com o nível do seu time.
          </p>
        </div>
        <Link href="/tournaments" className="hidden md:block">
          <Button variant="outline" size="sm" className="gap-2">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {hasError && (
        <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/8 px-5 py-4 text-sm text-red-300">
          Não foi possível carregar os campeonatos agora. Tente novamente em instantes.
        </div>
      )}

      {!hasError && isEmpty && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-8 py-16 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-30" />
          <h3 className="mb-2 text-lg font-bold">Nenhum campeonato ativo no momento</h3>
          <p className="mx-auto max-w-sm text-sm text-[var(--muted-foreground)]">
            Novos campeonatos são publicados regularmente. Fique de olho ou acesse a página completa.
          </p>
          <Link href="/tournaments" className="mt-6 inline-flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 mt-6">
              <Plus className="w-4 h-4" />
              Ver todos os campeonatos
            </Button>
          </Link>
        </div>
      )}

      {!hasError && !isEmpty && <TournamentsCarousel items={items} />}

      {!isEmpty && (
        <div className="mt-8 text-center md:hidden">
          <Link href="/tournaments">
            <Button variant="outline" className="gap-2">
              Ver todos os campeonatos <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
