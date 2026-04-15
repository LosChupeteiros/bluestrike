import Link from "next/link";
import { ArrowRight, Trophy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TournamentsCarousel from "./tournaments-carousel";
import { listTournaments } from "@/lib/tournaments";
import type { Tournament } from "@/types";

const STATUS_PRIORITY: Record<Tournament["status"], number> = {
  open: 0,
  ongoing: 1,
  upcoming: 2,
  finished: 3,
};

export default async function FeaturedTournaments() {
  let tournaments: Tournament[] = [];
  let hasError = false;

  try {
    tournaments = await listTournaments({ status: "all" });
  } catch {
    hasError = true;
  }

  // Prioriza featured, depois ordena por status e data
  const sorted = [...tournaments].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const sp = (STATUS_PRIORITY[a.status] ?? 3) - (STATUS_PRIORITY[b.status] ?? 3);
    if (sp !== 0) return sp;
    const da = a.startsAt ? Date.parse(a.startsAt) : 0;
    const db = b.startsAt ? Date.parse(b.startsAt) : 0;
    return da - db;
  });

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

      {!hasError && tournaments.length === 0 && (
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

      {!hasError && tournaments.length > 0 && (
        <TournamentsCarousel tournaments={sorted} />
      )}

      {tournaments.length > 0 && (
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
