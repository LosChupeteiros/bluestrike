import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import TournamentCard from "@/components/tournament/tournament-card";
import { mockTournaments } from "@/data/mock";

export default function FeaturedTournaments() {
  const featured = mockTournaments.filter((t) => t.featured);
  const rest = mockTournaments.filter((t) => !t.featured).slice(0, 4);

  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
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

      {/* Featured grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {featured.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} featured />
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {rest.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      <div className="mt-8 text-center md:hidden">
        <Link href="/tournaments">
          <Button variant="outline" className="gap-2">
            Ver todos os campeonatos <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
